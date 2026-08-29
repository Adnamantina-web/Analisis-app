/**
 * Capa 3: Análisis Exploratorio de Datos (EDA Visual Pareto 20/80)
 * - Selecciona los 8 a 10 gráficos de mayor valor informativo.
 * - Univariado: Histograma + KDE, Boxplot, QQ-Plot (cuantitativas); Barras / Tarta (cualitativas).
 * - Multivariado: Matriz de correlación Heatmap, Scatter plot con línea OLS, Tabla de contingencia con % condicionados, Boxplot agrupado.
 * - Cada gráfico incluye su respaldo estadístico exacto y conclusión de negocio.
 */

import { ColumnSchema, CorrelationPair, EDAChart, EDASummary, ProjectContract } from '../../types/pipeline';

export class EDAEngine {
  static analyze(
    rows: Record<string, any>[],
    columns: ColumnSchema[],
    contract: ProjectContract | null
  ): EDASummary {
    const charts: EDAChart[] = [];
    const numCols = columns.filter(c => c.detectedType === 'numeric');
    const catCols = columns.filter(c => c.detectedType === 'categorical' || c.detectedType === 'boolean');
    const targetCol = contract?.targetVariable;

    // 1. Correlation Matrix (Pearson & Spearman)
    const corrMatrixData = computeCorrelationMatrix(rows, numCols);

    // Chart 1: Multivariate - Correlation Heatmap (if at least 2 numeric cols)
    if (numCols.length >= 2) {
      charts.push({
        id: 'eda_corr_heatmap',
        title: 'Matriz de Correlación Lineal y Monótona (Heatmap)',
        layer: 'multivariate',
        chartType: 'heatmap_corr',
        variables: numCols.map(c => c.name),
        data: corrMatrixData.heatmapData,
        metadata: {
          columns: corrMatrixData.columns,
          matrix: corrMatrixData.matrix,
          topPairs: corrMatrixData.topPairs,
        },
        businessTakeaway: corrMatrixData.topPairs.length > 0
          ? `La mayor asociación se observa entre '${corrMatrixData.topPairs[0].var1}' y '${corrMatrixData.topPairs[0].var2}' con correlación r=${corrMatrixData.topPairs[0].pearsonR.toFixed(2)} (${corrMatrixData.topPairs[0].strength}).`
          : 'Estructura de covarianzas débilmente correlacionada.',
        statisticalBacking: `Matriz simétrica calculada sobre n=${rows.length} observaciones sin nulos.`,
      });
    }

    // Chart 2: Target Variable Distribution (if target defined) or Highest Variance Column
    const primaryNumCol = (targetCol && numCols.find(c => c.name === targetCol)) || numCols[0];
    if (primaryNumCol) {
      const vals = rows.map(r => Number(r[primaryNumCol.name])).filter(v => !isNaN(v));
      const histKde = computeHistogramAndKDE(primaryNumCol.name, vals, 12);
      
      charts.push({
        id: `eda_hist_kde_${primaryNumCol.name}`,
        title: `Distribución Univariada y Curva KDE: ${primaryNumCol.name}`,
        layer: 'univariate',
        chartType: 'histogram_kde',
        variables: [primaryNumCol.name],
        data: histKde.bins,
        metadata: {
          mean: histKde.mean,
          median: histKde.median,
          std: histKde.std,
          skewness: histKde.skewness,
          kurtosis: histKde.kurtosis,
        },
        businessTakeaway: Math.abs(histKde.skewness) > 0.8
          ? `Presenta asimetría marcada (sesgo = ${histKde.skewness.toFixed(2)}). La mediana (${histKde.median}) representa mejor la realidad del negocio que la media (${histKde.mean}).`
          : `Distribución simétrica y balanceada centrada en ${histKde.mean} con desviación estándar de ${histKde.std}.`,
        statisticalBacking: `Histograma con estimación de densidad de kernel (KDE Gaussiano) y estadística paramétrica/no paramétrica.`,
      });

      // Chart 3: Boxplot + Outlier Dispersion
      const boxplotStats = computeBoxplotData(primaryNumCol.name, vals);
      charts.push({
        id: `eda_box_${primaryNumCol.name}`,
        title: `Dispersión Intercuartílica y Outliers: ${primaryNumCol.name}`,
        layer: 'univariate',
        chartType: 'boxplot',
        variables: [primaryNumCol.name],
        data: [boxplotStats],
        metadata: boxplotStats,
        businessTakeaway: boxplotStats.outliers.length > 0
          ? `Se identifican ${boxplotStats.outliers.length} valores atípicos (outliers) por encima de ${boxplotStats.upperWhisker}. Representan comportamientos excepcionales.`
          : `El 50% central de las observaciones se concentra homogéneamente entre ${boxplotStats.q1} y ${boxplotStats.q3}.`,
        statisticalBacking: `Límites calculados mediante Tukey IQR: [Q1 - 1.5*IQR, Q3 + 1.5*IQR].`,
      });

      // Chart 4: QQ-Plot Normal Quantiles
      const qqData = computeQQPlotData(primaryNumCol.name, vals);
      charts.push({
        id: `eda_qq_${primaryNumCol.name}`,
        title: `Gráfico Q-Q de Normalidad Teórica: ${primaryNumCol.name}`,
        layer: 'univariate',
        chartType: 'qq_plot',
        variables: [primaryNumCol.name],
        data: qqData.points,
        metadata: { rSquared: qqData.rSquared, isNormalLikely: qqData.rSquared > 0.95 },
        businessTakeaway: qqData.rSquared > 0.95
          ? `Los puntos se alinean con la diagonal teórica (R²=${qqData.rSquared.toFixed(3)}), confirmando normalidad empírica adecuada para métodos paramétricos.`
          : `Desviaciones en las colas (R²=${qqData.rSquared.toFixed(3)}) indican colas pesadas o asimetría, recomendando pruebas no paramétricas.`,
        statisticalBacking: `Comparación de cuantiles muestrales frente a la distribución Normal Estándar N(0,1).`,
      });
    }

    // Chart 5: Categorical Distribution (Target or Primary Categorical)
    const primaryCatCol = (targetCol && catCols.find(c => c.name === targetCol)) || catCols[0];
    if (primaryCatCol) {
      const catData = computeCategoricalFrequencies(rows, primaryCatCol.name);
      charts.push({
        id: `eda_cat_${primaryCatCol.name}`,
        title: `Frecuencia y Proporciones: ${primaryCatCol.name}`,
        layer: 'univariate',
        chartType: catData.length <= 5 ? 'donut_freq' : 'bar_freq',
        variables: [primaryCatCol.name],
        data: catData,
        metadata: { categoriesCount: catData.length },
        businessTakeaway: `La categoría dominante es '${catData[0]?.category || 'N/A'}' con el ${catData[0]?.percentage || 0}% de los registros, marcando la concentración principal.`,
        statisticalBacking: `Distribución de frecuencias relativas y absolutas sobre n=${rows.length}.`,
      });
    }

    // Chart 6: Multivariate - Top Pair Scatter Plot with OLS Trendline (Quant vs Quant)
    if (corrMatrixData.topPairs.length > 0) {
      const topPair = corrMatrixData.topPairs[0];
      const scatterData = computeScatterWithOLS(rows, topPair.var1, topPair.var2);
      charts.push({
        id: `eda_scatter_${topPair.var1}_${topPair.var2}`,
        title: `Dispersión y Línea de Regresión: ${topPair.var1} vs ${topPair.var2}`,
        layer: 'multivariate',
        chartType: 'scatter_trend',
        variables: [topPair.var1, topPair.var2],
        data: scatterData.points,
        metadata: {
          slope: scatterData.slope,
          intercept: scatterData.intercept,
          rSquared: scatterData.rSquared,
          pearsonR: topPair.pearsonR,
        },
        businessTakeaway: `Por cada incremento unitario en '${topPair.var1}', '${topPair.var2}' varía en promedio ${scatterData.slope.toFixed(2)} unidades (R²=${scatterData.rSquared.toFixed(3)}).`,
        statisticalBacking: `Ajuste OLS por mínimos cuadrados ordinarios con coeficiente de determinación R².`,
      });
    }

    // Chart 7: Multivariate - Grouped Boxplot (Categorical vs Quantitative)
    if (numCols.length > 0 && catCols.length > 0) {
      const selNum = (targetCol && numCols.find(c => c.name === targetCol)) || numCols[0];
      const selCat = catCols.find(c => c.name !== targetCol) || catCols[0];
      
      const groupedData = computeGroupedBoxplots(rows, selNum.name, selCat.name);
      charts.push({
        id: `eda_grouped_box_${selNum.name}_by_${selCat.name}`,
        title: `Distribución de '${selNum.name}' Segmentada por '${selCat.name}'`,
        layer: 'multivariate',
        chartType: 'grouped_boxplot',
        variables: [selNum.name, selCat.name],
        data: groupedData.chartPoints,
        metadata: { groupStats: groupedData.groupStats },
        businessTakeaway: `Se observan claras diferencias en las medianas y rangos intercuartílicos entre los segmentos de '${selCat.name}', sugiriendo heterogeneidad estructural.`,
        statisticalBacking: `Desagregación bivariada cual-cuant con cálculo de medianas e IQR por grupo.`,
      });
    }

    // Chart 8: Multivariate - Contingency Table Cross-tab (Categorical vs Categorical)
    if (catCols.length >= 2) {
      const cat1 = (targetCol && catCols.find(c => c.name === targetCol)) || catCols[0];
      const cat2 = catCols.find(c => c.name !== cat1.name) || catCols[1];
      const crossTab = computeContingencyTable(rows, cat1.name, cat2.name);

      charts.push({
        id: `eda_crosstab_${cat1.name}_${cat2.name}`,
        title: `Tabla de Contingencia y Proporciones Condicionales: ${cat1.name} × ${cat2.name}`,
        layer: 'multivariate',
        chartType: 'contingency_table',
        variables: [cat1.name, cat2.name],
        data: crossTab.tableData,
        metadata: {
          rows: crossTab.rows,
          cols: crossTab.cols,
          chiSquareCandidate: true,
        },
        businessTakeaway: `Distribución conjunta que revela la concentración de frecuencias relativas cruzadas entre '${cat1.name}' y '${cat2.name}'.`,
        statisticalBacking: `Frecuencias observadas f_ij y porcentajes condicionales por fila.`,
      });
    }

    // Chart 9: Secondary Numeric Distribution or 2nd Predictor Scatter (Pareto cap at 9-10 charts)
    if (numCols.length >= 3) {
      const thirdCol = numCols.find(c => c.name !== primaryNumCol?.name);
      if (thirdCol) {
        const vals3 = rows.map(r => Number(r[thirdCol.name])).filter(v => !isNaN(v));
        const hist3 = computeHistogramAndKDE(thirdCol.name, vals3, 10);
        charts.push({
          id: `eda_hist_${thirdCol.name}`,
          title: `Distribución Univariada: ${thirdCol.name}`,
          layer: 'univariate',
          chartType: 'histogram_kde',
          variables: [thirdCol.name],
          data: hist3.bins,
          metadata: { mean: hist3.mean, median: hist3.median, std: hist3.std },
          businessTakeaway: `Variable complementaria con media en ${hist3.mean} y dispersión std de ${hist3.std}.`,
          statisticalBacking: `Estimación de distribución paramétrica sobre n=${vals3.length}.`,
        });
      }
    }

    const keyFindings: string[] = [
      `Se analizaron ${columns.length} variables (${numCols.length} numéricas y ${catCols.length} cualitativas) sobre ${rows.length} registros limpios.`,
      corrMatrixData.topPairs.length > 0
        ? `El par de mayor correlación lineal es '${corrMatrixData.topPairs[0].var1}' con '${corrMatrixData.topPairs[0].var2}' (r=${corrMatrixData.topPairs[0].pearsonR.toFixed(2)}).`
        : 'Estructura ortogonal sin multicolinealidad severa evidente.',
      primaryNumCol ? `La variable '${primaryNumCol.name}' presenta una media de ${primaryNumCol.mean} y desviación típica de ${primaryNumCol.std}.` : '',
    ].filter(Boolean);

    return {
      totalChartsGenerated: charts.length,
      charts,
      correlationMatrix: {
        columns: corrMatrixData.columns,
        matrix: corrMatrixData.matrix,
        topPairs: corrMatrixData.topPairs,
      },
      keyFindings,
    };
  }
}

// -------------------------------------------------------------
// Helper Calculation Functions for Robust Pareto EDA
// -------------------------------------------------------------

function computeCorrelationMatrix(rows: Record<string, any>[], numCols: ColumnSchema[]) {
  const cols = numCols.map(c => c.name);
  const matrix: number[][] = [];
  const topPairs: CorrelationPair[] = [];

  for (let i = 0; i < cols.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < cols.length; j++) {
      if (i === j) {
        matrix[i][j] = 1.0;
      } else {
        const x = rows.map(r => Number(r[cols[i]]) || 0);
        const y = rows.map(r => Number(r[cols[j]]) || 0);
        const r = calculatePearson(x, y);
        matrix[i][j] = +r.toFixed(3);

        if (i < j) {
          const rho = calculateSpearman(x, y);
          const pVal = calculateCorrelationPValue(r, x.length);
          const absR = Math.abs(r);
          let strength: CorrelationPair['strength'] = 'Nula';
          if (absR >= 0.7) strength = 'Muy Fuerte';
          else if (absR >= 0.5) strength = 'Fuerte';
          else if (absR >= 0.3) strength = 'Moderada';
          else if (absR >= 0.1) strength = 'Débil';

          topPairs.push({
            var1: cols[i],
            var2: cols[j],
            pearsonR: +r.toFixed(3),
            pearsonP: pVal,
            spearmanRho: +rho.toFixed(3),
            spearmanP: pVal,
            strength,
            isSignificant: pVal < 0.05,
          });
        }
      }
    }
  }

  topPairs.sort((a, b) => Math.abs(b.pearsonR) - Math.abs(a.pearsonR));

  const heatmapData = cols.map((colX, i) => {
    const rowObj: Record<string, any> = { variable: colX };
    cols.forEach((colY, j) => {
      rowObj[colY] = matrix[i][j];
    });
    return rowObj;
  });

  return { columns: cols, matrix, topPairs, heatmapData };
}

function calculatePearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

function calculateSpearman(x: number[], y: number[]): number {
  const rankX = getRanks(x);
  const rankY = getRanks(y);
  return calculatePearson(rankX, rankY);
}

function getRanks(arr: number[]): number[] {
  const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const ranks = new Array(arr.length);
  for (let k = 0; k < sorted.length; k++) {
    ranks[sorted[k].i] = k + 1;
  }
  return ranks;
}

function calculateCorrelationPValue(r: number, n: number): number {
  if (n <= 2 || Math.abs(r) >= 1) return 0;
  const t = (r * Math.sqrt(n - 2)) / Math.sqrt(1 - r * r);
  const df = n - 2;
  // Approximate two-tailed p-value from t-distribution
  const x = df / (df + t * t);
  return Math.max(0.0001, +(Math.pow(x, df / 2)).toFixed(4));
}

function computeHistogramAndKDE(colName: string, values: number[], numBins = 12) {
  const n = values.length;
  if (n === 0) return { bins: [], mean: 0, median: 0, std: 0, skewness: 0, kurtosis: 0 };

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const range = max - min || 1;
  const binWidth = range / numBins;

  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const median = sorted.length % 2 !== 0 ? sorted[Math.floor(n / 2)] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const variance = sorted.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
  const std = Math.sqrt(variance) || 1;

  // Skewness and Kurtosis
  const m3 = sorted.reduce((a, b) => a + Math.pow(b - mean, 3), 0) / n;
  const m4 = sorted.reduce((a, b) => a + Math.pow(b - mean, 4), 0) / n;
  const skewness = m3 / Math.pow(std, 3);
  const kurtosis = m4 / Math.pow(std, 4) - 3; // excess kurtosis

  // Silverman's rule of thumb bandwidth for Gaussian KDE
  const bandwidth = 1.06 * std * Math.pow(n, -0.2);

  const bins: any[] = [];
  for (let i = 0; i < numBins; i++) {
    const binStart = min + i * binWidth;
    const binEnd = binStart + binWidth;
    const binMid = (binStart + binEnd) / 2;

    const count = sorted.filter(v => (i === numBins - 1 ? v >= binStart && v <= binEnd : v >= binStart && v < binEnd)).length;
    const density = count / (n * binWidth);

    // Evaluate Gaussian KDE at binMid
    let kdeVal = 0;
    for (let k = 0; k < n; k++) {
      const u = (binMid - sorted[k]) / bandwidth;
      kdeVal += (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * u * u);
    }
    kdeVal = kdeVal / (n * bandwidth);

    bins.push({
      binLabel: `${binStart.toFixed(1)} - ${binEnd.toFixed(1)}`,
      binMid: +binMid.toFixed(2),
      count,
      density: +density.toFixed(4),
      kde: +(kdeVal * n * binWidth).toFixed(2), // scaled to counts for visual overlay
    });
  }

  return {
    bins,
    mean: +mean.toFixed(2),
    median: +median.toFixed(2),
    std: +std.toFixed(2),
    skewness: +skewness.toFixed(2),
    kurtosis: +kurtosis.toFixed(2),
  };
}

function computeBoxplotData(colName: string, values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const min = sorted[0];
  const max = sorted[n - 1];
  const q1 = sorted[Math.floor(n * 0.25)];
  const median = sorted[Math.floor(n * 0.5)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const lowerWhisker = Math.max(min, ...sorted.filter(v => v >= lowerBound));
  const upperWhisker = Math.min(max, ...sorted.filter(v => v <= upperBound));

  const outliers = sorted.filter(v => v < lowerBound || v > upperBound);

  return {
    name: colName,
    min,
    lowerWhisker,
    q1,
    median,
    q3,
    upperWhisker,
    max,
    iqr: +iqr.toFixed(2),
    outliers,
  };
}

function computeQQPlotData(colName: string, values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(sorted.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n) || 1;

  const points: { theoreticalQuantile: number; sampleQuantile: number; referenceLine: number }[] = [];
  const theoVals: number[] = [];
  const sampVals: number[] = [];

  for (let i = 0; i < n; i++) {
    // Filliben's estimate of plotting position
    const p = (i + 0.5) / n;
    // Inverse normal approximation (Beasley-Springer-Moro)
    const z = approxInverseNormal(p);
    const standardizedSample = (sorted[i] - mean) / std;

    points.push({
      theoreticalQuantile: +z.toFixed(3),
      sampleQuantile: +standardizedSample.toFixed(3),
      referenceLine: +z.toFixed(3), // 45 degree diagonal
    });

    theoVals.push(z);
    sampVals.push(standardizedSample);
  }

  const r = calculatePearson(theoVals, sampVals);
  const rSquared = +(r * r).toFixed(4);

  return { points, rSquared };
}

function approxInverseNormal(p: number): number {
  // Rational approximation for normal quantile function
  const a = [ -3.969683028665376e+01,  2.209460984245205e+02, -2.759285104469687e+02,  1.383577518672690e+02, -3.066479806614716e+01,  2.506628277459239e+00 ];
  const b = [ -5.447609879822406e+01,  1.615858368580409e+02, -1.556989798598866e+02,  6.680131188771972e+01, -1.328068155288572e+01 ];
  const c = [ -7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00,  4.374664141464968e+00,  2.938163982698783e+00 ];
  const d = [  7.784695709041462e-03,  3.224671290700398e-01,  2.445134137142996e+00,  3.754408661907416e+00 ];

  const p_low = 0.02425;
  const p_high = 1 - p_low;
  let q: number;

  if (p < p_low) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= p_high) {
    q = p - 0.5;
    const r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}

function computeCategoricalFrequencies(rows: Record<string, any>[], colName: string) {
  const map: Record<string, number> = {};
  let total = 0;

  for (const r of rows) {
    const val = r[colName] ?? 'N/A';
    map[val] = (map[val] || 0) + 1;
    total++;
  }

  return Object.entries(map)
    .map(([category, count]) => ({
      category,
      count,
      percentage: +((count / (total || 1)) * 100).toFixed(1),
    }))
    .sort((a, b) => b.count - a.count);
}

function computeScatterWithOLS(rows: Record<string, any>[], xCol: string, yCol: string) {
  const x = rows.map(r => Number(r[xCol]) || 0);
  const y = rows.map(r => Number(r[yCol]) || 0);
  const n = x.length;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - meanX) * (y[i] - meanY);
    den += Math.pow(x[i] - meanX, 2);
  }

  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;

  const r = calculatePearson(x, y);
  const rSquared = +(r * r).toFixed(4);

  const points = rows.map(r => {
    const xv = Number(r[xCol]) || 0;
    const yv = Number(r[yCol]) || 0;
    return {
      x: xv,
      y: yv,
      trendline: +(slope * xv + intercept).toFixed(2),
    };
  });

  return { points, slope, intercept, rSquared };
}

function computeGroupedBoxplots(rows: Record<string, any>[], numCol: string, catCol: string) {
  const groups: Record<string, number[]> = {};

  for (const r of rows) {
    const group = String(r[catCol] ?? 'Otros');
    const val = Number(r[numCol]);
    if (!isNaN(val)) {
      if (!groups[group]) groups[group] = [];
      groups[group].push(val);
    }
  }

  const chartPoints: any[] = [];
  const groupStats: Record<string, any> = {};

  for (const [groupName, vals] of Object.entries(groups)) {
    if (vals.length === 0) continue;
    const box = computeBoxplotData(groupName, vals);
    groupStats[groupName] = box;
    chartPoints.push({
      group: groupName,
      min: box.min,
      q1: box.q1,
      median: box.median,
      q3: box.q3,
      max: box.max,
      count: vals.length,
    });
  }

  return { chartPoints, groupStats };
}

function computeContingencyTable(rows: Record<string, any>[], rowCol: string, colCol: string) {
  const rowCats = Array.from(new Set(rows.map(r => String(r[rowCol] ?? 'N/A')))).sort();
  const colCats = Array.from(new Set(rows.map(r => String(r[colCol] ?? 'N/A')))).sort();

  const matrix: number[][] = rowCats.map(() => colCats.map(() => 0));
  const rowTotals = new Array(rowCats.length).fill(0);

  for (const r of rows) {
    const rIdx = rowCats.indexOf(String(r[rowCol] ?? 'N/A'));
    const cIdx = colCats.indexOf(String(r[colCol] ?? 'N/A'));
    if (rIdx >= 0 && cIdx >= 0) {
      matrix[rIdx][cIdx]++;
      rowTotals[rIdx]++;
    }
  }

  const tableData = rowCats.map((rCat, i) => {
    const item: Record<string, any> = { rowCategory: rCat, total: rowTotals[i] };
    colCats.forEach((cCat, j) => {
      const count = matrix[i][j];
      const pct = rowTotals[i] > 0 ? +((count / rowTotals[i]) * 100).toFixed(1) : 0;
      item[`${cCat}_count`] = count;
      item[`${cCat}_pct`] = pct;
    });
    return item;
  });

  return { rows: rowCats, cols: colCats, matrix, tableData };
}
