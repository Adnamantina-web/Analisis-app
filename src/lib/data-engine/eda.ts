/**
 * Capa 3: Análisis Exploratorio de Datos (EDA Visual Pareto 20/80)
 * - Identifica, cuantifica y clasifica valores atípicos (outliers) en todas las variables cuantitativas (Tukey IQR & Z-score).
 * - Genera datos de respaldo con y sin outliers para posibilitar visualización comparativa (resaltar vs ocultar/filtrar).
 * - Selecciona las 8 a 10 figuras de mayor valor informativo alineadas a la variable objetivo (Target) y la pregunta de negocio.
 * - Univariado: Histograma + KDE Gaussiano, Boxplot Tukey con Outliers, QQ-Plot de Normalidad, Frecuencias/Proporciones Pareto.
 * - Multivariado: Matriz de Correlación Heatmap (Pearson/Spearman), Diagrama de Pareto 80/20 Acumulado,
 *   Scatter Plot con ajuste OLS y R² (con vs sin outliers), Boxplot Agrupado (Target vs Predictor), Tabla de Contingencia Cruzada.
 * - Cada figura cuenta con respaldo estadístico numérico y conclusión ejecutiva de negocio.
 */

import { ColumnSchema, CorrelationPair, EDAChart, EDAOutlierFeature, EDASummary, MulticollinearityAnalysis, ProjectContract, VIFScore } from '../../types/pipeline';

export class EDAEngine {
  static analyze(
    rows: Record<string, any>[],
    columns: ColumnSchema[],
    contract: ProjectContract | null
  ): EDASummary {
    const charts: EDAChart[] = [];

    // Filter out ID columns from statistical modeling
    const eligibleColumns = columns.filter(c => c.detectedType !== 'id');
    const numCols = eligibleColumns.filter(c => c.detectedType === 'numeric');
    const catCols = eligibleColumns.filter(c => c.detectedType === 'categorical' || c.detectedType === 'boolean');
    
    const targetColName = contract?.targetVariable;
    const targetColObj = targetColName ? columns.find(c => c.name === targetColName) : undefined;
    const isTargetNumeric = targetColObj?.detectedType === 'numeric';
    const isTargetCategorical = targetColObj?.detectedType === 'categorical' || targetColObj?.detectedType === 'boolean';

    // 0. Comprehensive Outlier Diagnostics across all numerical columns
    const outlierDiagnostics = computeAllOutliers(rows, numCols);
    const totalOutliersDetected = outlierDiagnostics.reduce((sum, item) => sum + item.outlierCount, 0);

    // 1. Correlation Matrix calculation (Pearson & Spearman)
    const corrMatrixData = computeCorrelationMatrix(rows, numCols);

    // 2. Rank numeric features by relevance:
    // If target is numeric -> correlation with target
    // If target is categorical -> discrimination score between target classes
    // Otherwise -> coefficient of variation & highest correlation
    const rankedNumCols = rankNumericFeatures(rows, numCols, targetColName, isTargetNumeric, isTargetCategorical);
    const primaryNumCol = rankedNumCols[0] || numCols[0];
    const secondaryNumCol = rankedNumCols[1] || numCols[1] || numCols[0];

    // Primary categorical column: target if categorical, else highest variance categorical
    const primaryCatCol = (isTargetCategorical && targetColObj) 
      ? targetColObj 
      : (catCols.find(c => c.name !== targetColName) || catCols[0]);

    // -------------------------------------------------------------
    // CHART 1: Multivariate - Heatmap de Correlación Lineal y Monótona
    // -------------------------------------------------------------
    if (numCols.length >= 2) {
      const topP = corrMatrixData.topPairs[0];
      const multi = corrMatrixData.multicollinearity;
      charts.push({
        id: 'eda_corr_heatmap',
        title: 'Matriz de Correlación D3 & Diagnóstico de Multicolinealidad',
        layer: 'multivariate',
        chartType: 'heatmap_corr',
        variables: numCols.map(c => c.name),
        data: corrMatrixData.cellList,
        hasOutliers: false,
        metadata: {
          columns: corrMatrixData.columns,
          matrix: corrMatrixData.matrix,
          spearmanMatrix: corrMatrixData.spearmanMatrix,
          pValuesMatrix: corrMatrixData.pValuesMatrix,
          topPairs: corrMatrixData.topPairs,
          multicollinearity: corrMatrixData.multicollinearity,
          totalVariables: numCols.length,
        },
        businessTakeaway: multi.hasSevereMulticollinearity
          ? `Alerta de Multicolinealidad Temprana: ${multi.summary} Se recomienda verificar pares como '${multi.highCorrelationPairs[0]?.var1}' ↔ '${multi.highCorrelationPairs[0]?.var2}' antes de entrenar regresión.`
          : topP
          ? `La mayor asociación empírica se registra entre '${topP.var1}' y '${topP.var2}' (r=${topP.pearsonR > 0 ? '+' : ''}${topP.pearsonR.toFixed(2)}, correlación ${topP.strength.toLowerCase()}). ${topP.isSignificant ? 'Efecto estadísticamente significativo (p < 0.05).' : 'No alcanza significancia estadística.'}`
          : 'Estructura multivariada de baja colinealidad global.',
        statisticalBacking: `Matriz simétrica calculada sobre n=${rows.length} registros completos con cálculo de VIF (Variance Inflation Factor), coeficientes de Pearson (lineal) y Spearman (monótono).`,
      });
    }

    // -------------------------------------------------------------
    // CHART 2: Pareto 80/20 Concentration Chart (Regla 80/20)
    // -------------------------------------------------------------
    const paretoCol = selectParetoColumn(numCols, targetColName, isTargetNumeric);
    if (paretoCol) {
      const paretoDiag = outlierDiagnostics.find(o => o.column === paretoCol.name);
      const paretoData = computeParetoData(rows, paretoCol.name, primaryCatCol?.name);
      const hasExtreme = paretoData.top20ContributionPercent >= 75;

      charts.push({
        id: `eda_pareto_${paretoCol.name}`,
        title: `Diagrama de Concentración Pareto 80/20: ${paretoCol.name}`,
        layer: 'univariate',
        chartType: 'pareto_chart',
        variables: [paretoCol.name],
        data: paretoData.bins,
        dataWithoutOutliers: paretoData.binsWithoutOutliers,
        hasOutliers: (paretoDiag?.outlierCount || 0) > 0,
        outlierCount: paretoDiag?.outlierCount || 0,
        outlierPercentage: paretoDiag?.outlierPercentage || 0,
        outlierBounds: paretoDiag ? { lower: paretoDiag.lowerBound, upper: paretoDiag.upperBound } : undefined,
        metadata: {
          top20ContributionPercent: paretoData.top20ContributionPercent,
          paretoIndex: paretoData.paretoIndex,
          totalSum: paretoData.totalSum,
          column: paretoCol.name,
          hasExtremeConcentration: hasExtreme,
        },
        businessTakeaway: paretoData.top20ContributionPercent >= 65
          ? `Principio de Pareto evidente: El 20% superior de las observaciones concentra el ${paretoData.top20ContributionPercent.toFixed(1)}% del valor acumulado de '${paretoCol.name}'. Focalizar recursos en este segmento genera el 80% del impacto.`
          : `Distribución relativamente uniforme: El 20% superior aporta el ${paretoData.top20ContributionPercent.toFixed(1)}% de '${paretoCol.name}', sin hiper-concentración atípica.`,
        statisticalBacking: `Curva de Lorenz y acumulación ordenada decreciente sobre suma acumulada total (${paretoData.totalSum.toLocaleString()} unidades).`,
      });
    }

    // -------------------------------------------------------------
    // CHART 3: Univariate - Histograma + Curva KDE Gaussiana (Driver Principal)
    // -------------------------------------------------------------
    if (primaryNumCol) {
      const vals = rows.map(r => Number(r[primaryNumCol.name])).filter(v => !isNaN(v));
      const histKde = computeHistogramAndKDE(primaryNumCol.name, vals, 12);
      
      const isTarget = primaryNumCol.name === targetColName;
      charts.push({
        id: `eda_hist_kde_${primaryNumCol.name}`,
        title: `Distribución Univariada y Curva KDE: ${primaryNumCol.name}${isTarget ? ' (Variable Objetivo)' : ' (Driver Clave)'}`,
        layer: 'univariate',
        chartType: 'histogram_kde',
        variables: [primaryNumCol.name],
        data: histKde.bins,
        dataWithoutOutliers: histKde.inlierBins,
        hasOutliers: histKde.hasOutliers,
        outlierCount: histKde.outlierCount,
        outlierPercentage: histKde.outlierPercentage,
        outlierBounds: histKde.outlierBounds,
        metadata: {
          mean: histKde.mean,
          median: histKde.median,
          std: histKde.std,
          skewness: histKde.skewness,
          kurtosis: histKde.kurtosis,
          min: histKde.min,
          max: histKde.max,
          inlierStats: histKde.inlierStats,
          bandwidth: histKde.bandwidth,
        },
        businessTakeaway: histKde.outlierCount > 0
          ? `Se identificaron ${histKde.outlierCount} valores atípicos (${histKde.outlierPercentage}% del total) que generan sesgo en la cola derecha/izquierda (sesgo = ${histKde.skewness.toFixed(2)}). La mediana (${histKde.median.toLocaleString()}) resulta más representativa que la media (${histKde.mean.toLocaleString()}).`
          : `Distribución simétrica y balanceada con media en ${histKde.mean.toLocaleString()} (±${histKde.std.toLocaleString()}), sin valores atípicos que distorsionen los estadísticos.`,
        statisticalBacking: `Histograma de frecuencias empíricas con ajuste de densidad de Kernel Gaussiano (Silverman h=${histKde.bandwidth.toFixed(2)}). Intervalo de normalidad IQR [${histKde.outlierBounds.lower.toLocaleString()} a ${histKde.outlierBounds.upper.toLocaleString()}].`,
      });

      // -------------------------------------------------------------
      // CHART 4: Univariate - Boxplot Tukey & Detección de Outliers
      // -------------------------------------------------------------
      const boxplotStats = computeBoxplotData(primaryNumCol.name, vals);
      charts.push({
        id: `eda_box_${primaryNumCol.name}`,
        title: `Dispersión Intercuartílica y Detección de Valores Atípicos: ${primaryNumCol.name}`,
        layer: 'univariate',
        chartType: 'boxplot',
        variables: [primaryNumCol.name],
        data: [boxplotStats],
        dataWithoutOutliers: [boxplotStats.inlierBoxplot],
        hasOutliers: boxplotStats.outliers.length > 0,
        outlierCount: boxplotStats.outliers.length,
        outlierPercentage: +((boxplotStats.outliers.length / vals.length) * 100).toFixed(1),
        outlierBounds: { lower: boxplotStats.lowerBound, upper: boxplotStats.upperBound },
        metadata: boxplotStats,
        businessTakeaway: boxplotStats.outliers.length > 0
          ? `Se detectaron ${boxplotStats.outliers.length} observaciones extremas (outliers) fuera del intervalo de Tukey [${boxplotStats.lowerWhisker.toLocaleString()} - ${boxplotStats.upperWhisker.toLocaleString()}]. Representan el ${((boxplotStats.outliers.length / vals.length) * 100).toFixed(1)}% de la muestra.`
          : `El 50% central de la muestra está comprendido homogéneamente en el rango intercuartílico IQR=[${boxplotStats.q1.toLocaleString()} - ${boxplotStats.q3.toLocaleString()}], sin casos atípicos.`,
        statisticalBacking: `Criterio de Tukey: Límite inferior Q1 - 1.5×IQR (${boxplotStats.lowerBound.toFixed(2)}), Límite superior Q3 + 1.5×IQR (${boxplotStats.upperBound.toFixed(2)}).`,
      });

      // -------------------------------------------------------------
      // CHART 5: Univariate - Gráfico Q-Q de Normalidad Teórica
      // -------------------------------------------------------------
      const qqData = computeQQPlotData(primaryNumCol.name, vals);
      charts.push({
        id: `eda_qq_${primaryNumCol.name}`,
        title: `Gráfico Q-Q de Normalidad Teórica: ${primaryNumCol.name}`,
        layer: 'univariate',
        chartType: 'qq_plot',
        variables: [primaryNumCol.name],
        data: qqData.points,
        dataWithoutOutliers: qqData.pointsWithoutOutliers,
        hasOutliers: qqData.hasExtremeQuantiles,
        outlierCount: qqData.outlierCount,
        metadata: {
          rSquared: qqData.rSquared,
          rSquaredWithoutOutliers: qqData.rSquaredWithoutOutliers,
          isNormalLikely: qqData.rSquared >= 0.95,
        },
        businessTakeaway: qqData.rSquared >= 0.95
          ? `Alta conformidad con la distribución normal teórica (R²=${qqData.rSquared.toFixed(3)}). Las estimaciones paramétricas basadas en media y varianza son sólidas.`
          : `Desviaciones notorias en las colas (R²=${qqData.rSquared.toFixed(3)}${qqData.rSquaredWithoutOutliers ? `, mejora a R²=${qqData.rSquaredWithoutOutliers.toFixed(3)} al aislar outliers` : ''}). Se recomienda utilizar métodos no paramétricos o transformaciones estabilizadoras.`,
        statisticalBacking: `Cuantiles estandarizados muestrales vs cuantiles de la distribución Normal Estándar N(0,1).`,
      });
    }

    // -------------------------------------------------------------
    // CHART 6: Multivariate - Dispersión con Línea OLS de Mínimos Cuadrados
    // -------------------------------------------------------------
    if (numCols.length >= 2) {
      let xVar = primaryNumCol.name;
      let yVar = secondaryNumCol.name;

      if (isTargetNumeric && targetColName) {
        yVar = targetColName;
        xVar = rankedNumCols.find(c => c.name !== targetColName)?.name || numCols.find(c => c.name !== targetColName)?.name || numCols[0].name;
      } else if (corrMatrixData.topPairs.length > 0) {
        xVar = corrMatrixData.topPairs[0].var1;
        yVar = corrMatrixData.topPairs[0].var2;
      }

      const scatterData = computeScatterWithOLS(rows, xVar, yVar, isTargetCategorical ? targetColName : undefined);
      charts.push({
        id: `eda_scatter_${xVar}_${yVar}`,
        title: `Dispersión Bivariada y Regresión OLS: ${xVar} vs ${yVar}`,
        layer: 'multivariate',
        chartType: 'scatter_trend',
        variables: [xVar, yVar],
        data: scatterData.points,
        dataWithoutOutliers: scatterData.pointsWithoutOutliers,
        hasOutliers: scatterData.outliersCount > 0,
        outlierCount: scatterData.outliersCount,
        outlierPercentage: +((scatterData.outliersCount / rows.length) * 100).toFixed(1),
        metadata: {
          slope: scatterData.slope,
          intercept: scatterData.intercept,
          rSquared: scatterData.rSquared,
          pearsonR: scatterData.pearsonR,
          slopeWithoutOutliers: scatterData.slopeWithoutOutliers,
          interceptWithoutOutliers: scatterData.interceptWithoutOutliers,
          rSquaredWithoutOutliers: scatterData.rSquaredWithoutOutliers,
          pearsonRWithoutOutliers: scatterData.pearsonRWithoutOutliers,
          xVar,
          yVar,
          outliersCount: scatterData.outliersCount,
        },
        businessTakeaway: scatterData.outliersCount > 0
          ? `Ecuación global: ${yVar} = ${(scatterData.intercept).toFixed(2)} + ${(scatterData.slope).toFixed(2)} × ${xVar} (R²=${scatterData.rSquared.toFixed(3)}). Al aislar los ${scatterData.outliersCount} valores atípicos bivariados, el ajuste OLS alcanza R²=${scatterData.rSquaredWithoutOutliers.toFixed(3)}.`
          : `Ecuación de tendencia: ${yVar} = ${(scatterData.intercept).toFixed(2)} + ${(scatterData.slope).toFixed(2)} × ${xVar}. El modelo lineal simple explica el ${(scatterData.rSquared * 100).toFixed(1)}% de la varianza conjunta (R²=${scatterData.rSquared.toFixed(3)}).`,
        statisticalBacking: `Ajuste por Mínimos Cuadrados Ordinarios (OLS). Identificación de residuos extremos (|residuos| > 2.5σ) y outliers en X/Y según Tukey.`,
      });
    }

    // -------------------------------------------------------------
    // CHART 7: Multivariate - Boxplot Agrupado (Target Cualitativo vs Predictor Cuantitativo)
    // -------------------------------------------------------------
    if (numCols.length > 0 && catCols.length > 0) {
      const selCat = (isTargetCategorical && targetColObj) ? targetColObj : catCols[0];
      const selNum = (isTargetNumeric && targetColObj) ? targetColObj : primaryNumCol;

      const groupedData = computeGroupedBoxplots(rows, selNum.name, selCat.name);
      if (groupedData.chartPoints.length > 1) {
        charts.push({
          id: `eda_grouped_box_${selNum.name}_by_${selCat.name}`,
          title: `Distribución de '${selNum.name}' Segmentada por '${selCat.name}'`,
          layer: 'multivariate',
          chartType: 'grouped_boxplot',
          variables: [selNum.name, selCat.name],
          data: groupedData.chartPoints,
          dataWithoutOutliers: groupedData.chartPointsWithoutOutliers,
          hasOutliers: groupedData.totalGroupOutliers > 0,
          outlierCount: groupedData.totalGroupOutliers,
          metadata: { 
            groupStats: groupedData.groupStats, 
            numVar: selNum.name, 
            catVar: selCat.name,
            totalGroupOutliers: groupedData.totalGroupOutliers,
          },
          businessTakeaway: `Heterogeneidad estructural visible: Las medianas de '${selNum.name}' difieren notablemente entre las categorías de '${selCat.name}'. ${groupedData.totalGroupOutliers > 0 ? `Se detectaron ${groupedData.totalGroupOutliers} outliers distribuidos entre los subgrupos.` : ''}`,
          statisticalBacking: `Desagregación bivariada cual-cuant con cálculo de 5 números de Tukey y detección de outliers por grupo muestral.`,
        });
      }
    }

    // -------------------------------------------------------------
    // CHART 8: Univariate - Frecuencias y Proporciones Categóricas
    // -------------------------------------------------------------
    if (primaryCatCol) {
      const catData = computeCategoricalFrequencies(rows, primaryCatCol.name);
      const topCat = catData[0];
      charts.push({
        id: `eda_cat_${primaryCatCol.name}`,
        title: `Proporciones y Frecuencia de Clases: ${primaryCatCol.name}`,
        layer: 'univariate',
        chartType: 'bar_freq',
        variables: [primaryCatCol.name],
        data: catData,
        hasOutliers: false,
        metadata: { categoriesCount: catData.length, totalN: rows.length },
        businessTakeaway: topCat
          ? `La categoría dominante '${topCat.category}' representa el ${topCat.percentage}% del total (${topCat.count} de ${rows.length} registros).`
          : 'Distribución equilibrada entre categorías.',
        statisticalBacking: `Distribución de frecuencias absolutas y porcentajes relativos sobre n=${rows.length}.`,
      });
    }

    // -------------------------------------------------------------
    // CHART 9: Multivariate - Tabla de Contingencia / Cruzada Bivariada
    // -------------------------------------------------------------
    if (catCols.length >= 2) {
      const cat1 = (isTargetCategorical && targetColObj) ? targetColObj : catCols[0];
      const cat2 = catCols.find(c => c.name !== cat1.name) || catCols[1];
      
      const crossTab = computeContingencyTable(rows, cat1.name, cat2.name);
      charts.push({
        id: `eda_crosstab_${cat1.name}_${cat2.name}`,
        title: `Tabla Cruzada de Contingencia y % Condicionados: ${cat1.name} × ${cat2.name}`,
        layer: 'multivariate',
        chartType: 'contingency_table',
        variables: [cat1.name, cat2.name],
        data: crossTab.tableData,
        hasOutliers: false,
        metadata: {
          rowVar: cat1.name,
          colVar: cat2.name,
          rowCats: crossTab.rows,
          colCats: crossTab.cols,
          matrix: crossTab.matrix,
        },
        businessTakeaway: `Matriz de contingencia bidimensional que revela patrones de concentración y desbalance relacional entre '${cat1.name}' y '${cat2.name}'.`,
        statisticalBacking: `Frecuencias conjuntas observadas n_ij y porcentajes condicionales normalizados por fila.`,
      });
    }

    // -------------------------------------------------------------
    // CHART 10: Univariate - Segundo Predictor Numérico Clave
    // -------------------------------------------------------------
    if (secondaryNumCol && secondaryNumCol.name !== primaryNumCol?.name) {
      const vals2 = rows.map(r => Number(r[secondaryNumCol.name])).filter(v => !isNaN(v));
      const hist2 = computeHistogramAndKDE(secondaryNumCol.name, vals2, 10);
      charts.push({
        id: `eda_hist_${secondaryNumCol.name}`,
        title: `Distribución de Predictor Secundario: ${secondaryNumCol.name}`,
        layer: 'univariate',
        chartType: 'histogram_kde',
        variables: [secondaryNumCol.name],
        data: hist2.bins,
        dataWithoutOutliers: hist2.inlierBins,
        hasOutliers: hist2.hasOutliers,
        outlierCount: hist2.outlierCount,
        outlierPercentage: hist2.outlierPercentage,
        outlierBounds: hist2.outlierBounds,
        metadata: { 
          mean: hist2.mean, 
          median: hist2.median, 
          std: hist2.std, 
          skewness: hist2.skewness,
          inlierStats: hist2.inlierStats,
        },
        businessTakeaway: `Variable explicativa con media en ${hist2.mean.toLocaleString()} (mediana ${hist2.median.toLocaleString()}) y dispersión σ=${hist2.std.toLocaleString()}.${hist2.hasOutliers ? ` Contiene ${hist2.outlierCount} outliers identificados.` : ''}`,
        statisticalBacking: `Histograma con ajuste paramétrico sobre n=${vals2.length} observaciones válidas.`,
      });
    }

    // Key Findings Executive Summary
    const keyFindings: string[] = [
      `Se analizaron ${columns.length} variables (${numCols.length} cuantitativas y ${catCols.length} cualitativas) sobre ${rows.length} registros saneados.`,
      totalOutliersDetected > 0
        ? `Diagnóstico de anomalías: Se detectaron ${totalOutliersDetected} valores atípicos acumulados en ${outlierDiagnostics.filter(o => o.outlierCount > 0).length} variables cuantitativas (criterio Tukey IQR & Z-score).`
        : 'Distribución cuantitativa homogénea sin presencia de valores atípicos severos.',
      corrMatrixData.topPairs.length > 0
        ? `Correlación máxima identificada: '${corrMatrixData.topPairs[0].var1}' con '${corrMatrixData.topPairs[0].var2}' (r=${corrMatrixData.topPairs[0].pearsonR > 0 ? '+' : ''}${corrMatrixData.topPairs[0].pearsonR.toFixed(2)}, p < 0.05).`
        : 'Estructura multivariada con baja colinealidad entre predictores.',
      primaryNumCol
        ? `La variable '${primaryNumCol.name}' presenta una mediana de ${primaryNumCol.median ?? 'N/A'} frente a una media de ${primaryNumCol.mean ?? 'N/A'}.`
        : '',
      targetColName
        ? `Enfoque analítico orientado a la variable objetivo '${targetColName}' (${contract?.targetType || 'multivariado'}).`
        : 'Exploración no supervisada de libre covarianza.',
    ].filter(Boolean);

    return {
      totalChartsGenerated: charts.length,
      charts,
      correlationMatrix: {
        columns: corrMatrixData.columns,
        matrix: corrMatrixData.matrix,
        spearmanMatrix: corrMatrixData.spearmanMatrix,
        pValuesMatrix: corrMatrixData.pValuesMatrix,
        topPairs: corrMatrixData.topPairs,
        multicollinearity: corrMatrixData.multicollinearity,
      },
      keyFindings,
      totalOutliersDetected,
      outlierFeatures: outlierDiagnostics,
      multicollinearity: corrMatrixData.multicollinearity,
    };
  }
}

// -------------------------------------------------------------
// Helper Calculation Functions & Outlier Engine
// -------------------------------------------------------------

function computeAllOutliers(rows: Record<string, any>[], numCols: ColumnSchema[]): EDAOutlierFeature[] {
  return numCols.map(col => {
    const vals = rows.map(r => Number(r[col.name])).filter(v => !isNaN(v));
    const sorted = [...vals].sort((a, b) => a - b);
    const n = sorted.length;
    if (n < 4) {
      return {
        column: col.name,
        outlierCount: 0,
        outlierPercentage: 0,
        lowerBound: 0,
        upperBound: 0,
        outlierValues: [],
        severity: 'low',
      };
    }

    const q1 = sorted[Math.floor(n * 0.25)];
    const q3 = sorted[Math.floor(n * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = +(q1 - 1.5 * iqr).toFixed(2);
    const upperBound = +(q3 + 1.5 * iqr).toFixed(2);

    const outlierValues = sorted.filter(v => v < lowerBound || v > upperBound);
    const outlierCount = outlierValues.length;
    const outlierPercentage = +((outlierCount / n) * 100).toFixed(1);

    let severity: 'low' | 'moderate' | 'high' = 'low';
    if (outlierPercentage > 5) severity = 'high';
    else if (outlierPercentage > 2) severity = 'moderate';

    return {
      column: col.name,
      outlierCount,
      outlierPercentage,
      lowerBound,
      upperBound,
      outlierValues,
      severity,
    };
  });
}

function rankNumericFeatures(
  rows: Record<string, any>[],
  numCols: ColumnSchema[],
  targetColName?: string,
  isTargetNumeric?: boolean,
  isTargetCategorical?: boolean
): ColumnSchema[] {
  if (numCols.length <= 1) return numCols;

  const scored = numCols.map(col => {
    let score = 0;
    const vals = rows.map(r => Number(r[col.name])).filter(v => !isNaN(v));
    const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (vals.length || 1);
    const std = Math.sqrt(variance);
    const cv = mean !== 0 ? Math.abs(std / mean) : 1; // Coefficient of variation

    if (isTargetNumeric && targetColName && col.name !== targetColName) {
      // Correlation with numeric target
      const targetVals = rows.map(r => Number(r[targetColName]) || 0);
      const r = Math.abs(calculatePearson(vals, targetVals));
      score = r * 100 + cv * 10;
    } else if (isTargetCategorical && targetColName) {
      // Discrimination across target classes (Difference in means normalized by std)
      const groups: Record<string, number[]> = {};
      rows.forEach(r => {
        const cls = String(r[targetColName] ?? 'N/A');
        const v = Number(r[col.name]);
        if (!isNaN(v)) {
          if (!groups[cls]) groups[cls] = [];
          groups[cls].push(v);
        }
      });
      const groupMeans = Object.values(groups).map(arr => arr.reduce((a, b) => a + b, 0) / (arr.length || 1));
      if (groupMeans.length >= 2) {
        const maxDiff = Math.max(...groupMeans) - Math.min(...groupMeans);
        score = (std > 0 ? maxDiff / std : 0) * 100 + cv * 10;
      } else {
        score = cv * 10;
      }
    } else {
      score = cv * 20;
    }

    if (col.name === targetColName) {
      score += 1000; // Target always ranks top
    }

    return { col, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.col);
}

function selectParetoColumn(
  numCols: ColumnSchema[],
  targetColName?: string,
  isTargetNumeric?: boolean
): ColumnSchema | undefined {
  if (numCols.length === 0) return undefined;
  if (isTargetNumeric && targetColName) {
    const tCol = numCols.find(c => c.name === targetColName);
    if (tCol) return tCol;
  }
  // Prefer monetary/volume/quantity columns like spend, income, price, units, hours
  const volumeCandidate = numCols.find(c => {
    const n = c.name.toLowerCase();
    return n.includes('gasto') || n.includes('ingreso') || n.includes('precio') || n.includes('coste') || n.includes('ventas') || n.includes('total') || n.includes('horas');
  });
  return volumeCandidate || numCols[0];
}

function computeParetoData(rows: Record<string, any>[], numCol: string, catCol?: string) {
  // If we have a categorical dimension with reasonable cardinality (<= 25 categories), aggregate by category
  let items: { label: string; value: number }[] = [];

  if (catCol) {
    const catMap: Record<string, number> = {};
    rows.forEach(r => {
      const cat = String(r[catCol] ?? 'Otros');
      const val = Math.max(0, Number(r[numCol]) || 0);
      catMap[cat] = (catMap[cat] || 0) + val;
    });
    const entries = Object.entries(catMap);
    if (entries.length >= 3 && entries.length <= 30) {
      items = entries.map(([label, value]) => ({ label, value }));
    }
  }

  // Fallback to top percentile observation buckets if no categorical grouping
  if (items.length === 0) {
    const vals = rows.map(r => Math.max(0, Number(r[numCol]) || 0)).sort((a, b) => b - a);
    const n = vals.length;
    const bucketCount = 10;
    const bucketSize = Math.ceil(n / bucketCount);
    for (let i = 0; i < bucketCount; i++) {
      const slice = vals.slice(i * bucketSize, (i + 1) * bucketSize);
      const sum = slice.reduce((a, b) => a + b, 0);
      items.push({
        label: `Decil ${i + 1} (${((i / bucketCount) * 100).toFixed(0)}-${(((i + 1) / bucketCount) * 100).toFixed(0)}%)`,
        value: +sum.toFixed(0),
      });
    }
  }

  // Sort items descending
  items.sort((a, b) => b.value - a.value);
  const totalSum = items.reduce((a, b) => a + b.value, 0) || 1;

  let currentCum = 0;
  const bins = items.map(item => {
    currentCum += item.value;
    const cumPercent = +((currentCum / totalSum) * 100).toFixed(1);
    const percent = +((item.value / totalSum) * 100).toFixed(1);
    return {
      label: item.label,
      value: item.value,
      percent,
      cumPercent,
    };
  });

  // Calculate 20% concentration
  const top20Count = Math.max(1, Math.round(items.length * 0.2));
  const top20Sum = items.slice(0, top20Count).reduce((a, b) => a + b.value, 0);
  const top20ContributionPercent = +((top20Sum / totalSum) * 100).toFixed(1);

  // Filter out top 1 extreme outlier if it represents > 60% alone
  const inlierItems = items.length > 3 && items[0].value > totalSum * 0.6 ? items.slice(1) : items;
  const inlierSum = inlierItems.reduce((a, b) => a + b.value, 0) || 1;
  let inlierCum = 0;
  const binsWithoutOutliers = inlierItems.map(item => {
    inlierCum += item.value;
    return {
      label: item.label,
      value: item.value,
      percent: +((item.value / inlierSum) * 100).toFixed(1),
      cumPercent: +((inlierCum / inlierSum) * 100).toFixed(1),
    };
  });

  return {
    bins,
    binsWithoutOutliers,
    totalSum: +totalSum.toFixed(0),
    top20ContributionPercent,
    paretoIndex: +top20ContributionPercent.toFixed(1),
  };
}

function computeCorrelationMatrix(rows: Record<string, any>[], numCols: ColumnSchema[]) {
  const cols = numCols.map(c => c.name);
  const matrix: number[][] = [];
  const spearmanMatrix: number[][] = [];
  const pValuesMatrix: number[][] = [];
  const topPairs: CorrelationPair[] = [];
  const cellList: { x: string; y: string; value: number; pValue: number; spearmanRho: number }[] = [];

  for (let i = 0; i < cols.length; i++) {
    matrix[i] = [];
    spearmanMatrix[i] = [];
    pValuesMatrix[i] = [];
    for (let j = 0; j < cols.length; j++) {
      if (i === j) {
        matrix[i][j] = 1.0;
        spearmanMatrix[i][j] = 1.0;
        pValuesMatrix[i][j] = 0;
        cellList.push({ x: cols[i], y: cols[j], value: 1.0, pValue: 0, spearmanRho: 1.0 });
      } else {
        const x = rows.map(r => Number(r[cols[i]]) || 0);
        const y = rows.map(r => Number(r[cols[j]]) || 0);
        const r = calculatePearson(x, y);
        const rho = calculateSpearman(x, y);
        const pVal = calculateCorrelationPValue(r, x.length);
        
        matrix[i][j] = +r.toFixed(3);
        spearmanMatrix[i][j] = +rho.toFixed(3);
        pValuesMatrix[i][j] = +pVal.toFixed(4);
        cellList.push({ x: cols[i], y: cols[j], value: +r.toFixed(3), pValue: pVal, spearmanRho: +rho.toFixed(3) });

        if (i < j) {
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

  // Compute VIF and Multicollinearity analysis
  const multicollinearity = computeMulticollinearity(cols, matrix, topPairs);

  return { columns: cols, matrix, spearmanMatrix, pValuesMatrix, topPairs, cellList, multicollinearity };
}

function computeMulticollinearity(
  cols: string[],
  matrix: number[][],
  topPairs: CorrelationPair[]
): MulticollinearityAnalysis {
  const k = cols.length;
  const vifScores: VIFScore[] = [];

  if (k <= 1) {
    return {
      hasSevereMulticollinearity: false,
      maxVIF: 1.0,
      vifScores: cols.map(c => ({
        variable: c,
        vif: 1.0,
        rSquared: 0,
        risk: 'low',
        recommendation: 'Variable independiente única.',
      })),
      highCorrelationPairs: [],
      overallCollinearityScore: 0,
      summary: 'Sin riesgo de multicolinealidad (variable única).',
      recommendedAction: 'Estructura lista para modelado.',
    };
  }

  // Calculate VIF for each variable using regularized correlation matrix inversion
  // In correlation matrix R, VIF_j = (R^-1)_jj
  // Regularize with small lambda = 1e-4 to prevent numerical breakdown
  const regularizedR: number[][] = [];
  for (let i = 0; i < k; i++) {
    regularizedR[i] = [];
    for (let j = 0; j < k; j++) {
      regularizedR[i][j] = matrix[i][j] + (i === j ? 0.0001 : 0);
    }
  }

  const invR = invertMatrixGaussJordan(regularizedR);

  for (let i = 0; i < k; i++) {
    let vifVal = 1.0;
    if (invR && invR[i] && typeof invR[i][i] === 'number' && !isNaN(invR[i][i]) && invR[i][i] > 0) {
      vifVal = Math.max(1.0, +invR[i][i].toFixed(2));
    } else {
      // Fallback: estimate from max pairwise correlation with other features
      let maxPairR = 0;
      for (let j = 0; j < k; j++) {
        if (i !== j) maxPairR = Math.max(maxPairR, Math.abs(matrix[i][j]));
      }
      const r2 = Math.min(0.99, Math.pow(maxPairR, 2));
      vifVal = +(1 / (1 - r2)).toFixed(2);
    }

    // Find top correlated partner for explanation
    let topPartner = '';
    let maxR = 0;
    for (let j = 0; j < k; j++) {
      if (i !== j && Math.abs(matrix[i][j]) > maxR) {
        maxR = Math.abs(matrix[i][j]);
        topPartner = cols[j];
      }
    }

    const rSquared = +(1 - 1 / vifVal).toFixed(3);
    let risk: 'low' | 'moderate' | 'high' = 'low';
    let recommendation = 'VIF < 5: Varianza estable, sin colinealidad que afecte coeficientes.';

    if (vifVal >= 10) {
      risk = 'high';
      recommendation = `VIF >= 10 (Crítico): Alta redundancia lineal (asociada a '${topPartner}' r=${maxR.toFixed(2)}). Considerar eliminar una o aplicar PCA/Ridge.`;
    } else if (vifVal >= 5) {
      risk = 'moderate';
      recommendation = `5 <= VIF < 10 (Moderado): Cierta inflación de varianza. Monitorear estabilidad de p-values en regresión.`;
    }

    vifScores.push({
      variable: cols[i],
      vif: vifVal,
      rSquared: Math.max(0, rSquared),
      risk,
      topCorrelatedWith: topPartner,
      maxCorrelation: maxR,
      recommendation,
    });
  }

  // Sort VIF descending by risk
  vifScores.sort((a, b) => b.vif - a.vif);

  const highCorrelationPairs = topPairs.filter(p => Math.abs(p.pearsonR) >= 0.70);
  const maxVIF = vifScores[0]?.vif || 1.0;
  const hasSevereMulticollinearity = maxVIF >= 10 || highCorrelationPairs.some(p => Math.abs(p.pearsonR) >= 0.85);

  // Overall Collinearity index (0 to 100)
  const avgHighPairs = highCorrelationPairs.length / Math.max(1, (k * (k - 1)) / 2);
  const overallCollinearityScore = Math.min(100, Math.round((Math.min(maxVIF, 20) / 20) * 60 + avgHighPairs * 40));

  let summary = 'Estructura multivariada con baja colinealidad general. Los predictores cuantitativos son ortogonalmente estables.';
  let recommendedAction = 'No se requieren transformaciones de reducción dimensional para modelos lineales.';

  if (hasSevereMulticollinearity) {
    const severeVars = vifScores.filter(v => v.risk === 'high').map(v => v.variable).join(', ');
    summary = `Alerta de Multicolinealidad Severa: Se identificaron factores de inflación de varianza críticos (VIF max = ${maxVIF}) y pares con |r| >= 0.70 (${highCorrelationPairs.length} pares detectados). Variables con alta redundancia: ${severeVars || 'múltiples'}.`;
    recommendedAction = 'En modelos paramétricos lineales (OLS/Logit) se recomienda aplicar regularización L2 (Ridge) o consolidar variables altamente correlacionadas.';
  } else if (vifScores.some(v => v.risk === 'moderate')) {
    summary = `Multicolinealidad Moderada detectada en ${vifScores.filter(v => v.risk === 'moderate').length} variable(s) (5 <= VIF < 10).`;
    recommendedAction = 'Los modelos de ensamble basados en árboles (Random Forest, Gradient Boosting) absorberán esta estructura sin problemas; en OLS revisar significancia individual.';
  }

  return {
    hasSevereMulticollinearity,
    maxVIF,
    vifScores,
    highCorrelationPairs,
    overallCollinearityScore,
    summary,
    recommendedAction,
  };
}

function invertMatrixGaussJordan(matrix: number[][]): number[][] | null {
  const n = matrix.length;
  // Create augmented matrix [A | I]
  const aug: number[][] = [];
  for (let i = 0; i < n; i++) {
    aug[i] = [];
    for (let j = 0; j < n; j++) aug[i][j] = matrix[i][j];
    for (let j = 0; j < n; j++) aug[i][n + j] = i === j ? 1 : 0;
  }

  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) maxRow = k;
    }
    if (Math.abs(aug[maxRow][i]) < 1e-9) return null; // Singular

    // Swap rows
    const temp = aug[i];
    aug[i] = aug[maxRow];
    aug[maxRow] = temp;

    // Scale pivot row
    const pivot = aug[i][i];
    for (let j = 0; j < 2 * n; j++) aug[i][j] /= pivot;

    // Eliminate other rows
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = aug[k][i];
        for (let j = 0; j < 2 * n; j++) aug[k][j] -= factor * aug[i][j];
      }
    }
  }

  // Extract right half
  const inv: number[][] = [];
  for (let i = 0; i < n; i++) {
    inv[i] = [];
    for (let j = 0; j < n; j++) inv[i][j] = aug[i][n + j];
  }
  return inv;
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
  const x = df / (df + t * t);
  return Math.max(0.0001, +(Math.pow(x, df / 2)).toFixed(4));
}

function computeHistogramAndKDE(colName: string, values: number[], numBins = 12) {
  const n = values.length;
  if (n === 0) {
    return {
      bins: [],
      inlierBins: [],
      mean: 0,
      median: 0,
      std: 0,
      skewness: 0,
      kurtosis: 0,
      min: 0,
      max: 0,
      bandwidth: 1,
      hasOutliers: false,
      outlierCount: 0,
      outlierPercentage: 0,
      outlierBounds: { lower: 0, upper: 0 },
      inlierStats: { mean: 0, median: 0, std: 0, count: 0 },
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const range = max - min || 1;
  const binWidth = range / numBins;

  // Tukey Bounds for Outlier Flagging
  const q1 = sorted[Math.floor(n * 0.25)];
  const median = sorted.length % 2 !== 0 ? sorted[Math.floor(n / 2)] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = +(q1 - 1.5 * iqr).toFixed(2);
  const upperBound = +(q3 + 1.5 * iqr).toFixed(2);

  const outliers = sorted.filter(v => v < lowerBound || v > upperBound);
  const inliers = sorted.filter(v => v >= lowerBound && v <= upperBound);
  const outlierCount = outliers.length;
  const outlierPercentage = +((outlierCount / n) * 100).toFixed(1);

  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const variance = sorted.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
  const std = Math.sqrt(variance) || 1;

  // Skewness and Kurtosis
  const m3 = sorted.reduce((a, b) => a + Math.pow(b - mean, 3), 0) / n;
  const m4 = sorted.reduce((a, b) => a + Math.pow(b - mean, 4), 0) / n;
  const skewness = m3 / Math.pow(std, 3);
  const kurtosis = m4 / Math.pow(std, 4) - 3;

  // Silverman's rule of thumb bandwidth for Gaussian KDE
  const bandwidth = Math.max(0.01, 1.06 * std * Math.pow(n, -0.2));

  // Compute Full Bins (with Outlier Flags)
  const bins: any[] = [];
  for (let i = 0; i < numBins; i++) {
    const binStart = min + i * binWidth;
    const binEnd = binStart + binWidth;
    const binMid = (binStart + binEnd) / 2;

    const binVals = sorted.filter(v => (i === numBins - 1 ? v >= binStart && v <= binEnd : v >= binStart && v < binEnd));
    const count = binVals.length;
    const density = count / (n * binWidth);

    // Is this bin considered an outlier region?
    const isOutlierBin = binEnd < lowerBound || binStart > upperBound || binVals.some(v => v < lowerBound || v > upperBound);
    const outlierInBinCount = binVals.filter(v => v < lowerBound || v > upperBound).length;

    // Evaluate Gaussian KDE at binMid
    let kdeVal = 0;
    for (let k = 0; k < n; k++) {
      const u = (binMid - sorted[k]) / bandwidth;
      kdeVal += (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * u * u);
    }
    kdeVal = kdeVal / (n * bandwidth);

    bins.push({
      binLabel: `${binStart.toFixed(0)} - ${binEnd.toFixed(0)}`,
      binMid: +binMid.toFixed(1),
      count,
      density: +density.toFixed(4),
      kde: +(kdeVal * n * binWidth).toFixed(1),
      isOutlierBin,
      outlierInBinCount,
    });
  }

  // Compute Inlier Bins (for "Hide Outliers" zoom-in view)
  const inlierBins: any[] = [];
  const inlierN = inliers.length;
  if (inlierN > 0) {
    const inlierMin = inliers[0];
    const inlierMax = inliers[inliers.length - 1];
    const inlierRange = inlierMax - inlierMin || 1;
    const inlierBinWidth = inlierRange / numBins;
    const inlierMean = inliers.reduce((a, b) => a + b, 0) / inlierN;
    const inlierVariance = inliers.reduce((a, b) => a + Math.pow(b - inlierMean, 2), 0) / inlierN;
    const inlierStd = Math.sqrt(inlierVariance) || 1;
    const inlierBandwidth = Math.max(0.01, 1.06 * inlierStd * Math.pow(inlierN, -0.2));

    for (let i = 0; i < numBins; i++) {
      const binStart = inlierMin + i * inlierBinWidth;
      const binEnd = binStart + inlierBinWidth;
      const binMid = (binStart + binEnd) / 2;

      const count = inliers.filter(v => (i === numBins - 1 ? v >= binStart && v <= binEnd : v >= binStart && v < binEnd)).length;
      const density = count / (inlierN * inlierBinWidth);

      let kdeVal = 0;
      for (let k = 0; k < inlierN; k++) {
        const u = (binMid - inliers[k]) / inlierBandwidth;
        kdeVal += (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * u * u);
      }
      kdeVal = kdeVal / (inlierN * inlierBandwidth);

      inlierBins.push({
        binLabel: `${binStart.toFixed(0)} - ${binEnd.toFixed(0)}`,
        binMid: +binMid.toFixed(1),
        count,
        density: +density.toFixed(4),
        kde: +(kdeVal * inlierN * inlierBinWidth).toFixed(1),
        isOutlierBin: false,
        outlierInBinCount: 0,
      });
    }
  }

  const inlierMean = inliers.length > 0 ? inliers.reduce((a, b) => a + b, 0) / inliers.length : mean;
  const inlierMedian = inliers.length > 0 ? (inliers.length % 2 !== 0 ? inliers[Math.floor(inliers.length / 2)] : (inliers[inliers.length / 2 - 1] + inliers[inliers.length / 2]) / 2) : median;
  const inlierStd = inliers.length > 0 ? Math.sqrt(inliers.reduce((a, b) => a + Math.pow(b - inlierMean, 2), 0) / inliers.length) : std;

  return {
    bins,
    inlierBins: inlierBins.length > 0 ? inlierBins : bins,
    mean: +mean.toFixed(2),
    median: +median.toFixed(2),
    std: +std.toFixed(2),
    skewness: +skewness.toFixed(2),
    kurtosis: +kurtosis.toFixed(2),
    min: +min.toFixed(2),
    max: +max.toFixed(2),
    bandwidth,
    hasOutliers: outlierCount > 0,
    outlierCount,
    outlierPercentage,
    outlierBounds: { lower: lowerBound, upper: upperBound },
    inlierStats: {
      mean: +inlierMean.toFixed(2),
      median: +inlierMedian.toFixed(2),
      std: +inlierStd.toFixed(2),
      count: inliers.length,
    },
  };
}

function computeBoxplotData(colName: string, values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) {
    return {
      name: colName,
      min: 0,
      lowerWhisker: 0,
      q1: 0,
      median: 0,
      q3: 0,
      upperWhisker: 0,
      max: 0,
      iqr: 0,
      lowerBound: 0,
      upperBound: 0,
      outliers: [],
      inlierBoxplot: {},
    };
  }

  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(sorted.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n) || 1;

  const min = sorted[0];
  const max = sorted[n - 1];
  const q1 = sorted[Math.floor(n * 0.25)];
  const median = sorted[Math.floor(n * 0.5)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;

  const lowerBound = +(q1 - 1.5 * iqr).toFixed(2);
  const upperBound = +(q3 + 1.5 * iqr).toFixed(2);

  const inliers = sorted.filter(v => v >= lowerBound && v <= upperBound);
  const lowerWhisker = inliers.length > 0 ? inliers[0] : min;
  const upperWhisker = inliers.length > 0 ? inliers[inliers.length - 1] : max;

  const rawOutliers = sorted.filter(v => v < lowerBound || v > upperBound);
  const outliersWithDetails = rawOutliers.map(val => ({
    value: val,
    isExtreme: val < q1 - 3 * iqr || val > q3 + 3 * iqr,
    zScore: +((val - mean) / std).toFixed(2),
    type: val < lowerBound ? ('lower' as const) : ('upper' as const),
  }));

  // Inlier only boxplot representation
  const inlierN = inliers.length;
  const inlierBoxplot = inlierN > 0 ? {
    name: `${colName} (Sin Outliers)`,
    min: inliers[0],
    lowerWhisker: inliers[0],
    q1: inliers[Math.floor(inlierN * 0.25)],
    median: inliers[Math.floor(inlierN * 0.5)],
    q3: inliers[Math.floor(inlierN * 0.75)],
    upperWhisker: inliers[inlierN - 1],
    max: inliers[inlierN - 1],
    iqr: inliers[Math.floor(inlierN * 0.75)] - inliers[Math.floor(inlierN * 0.25)],
    lowerBound: inliers[0],
    upperBound: inliers[inlierN - 1],
    outliers: [],
  } : null;

  return {
    name: colName,
    min: +min.toFixed(2),
    lowerWhisker: +lowerWhisker.toFixed(2),
    q1: +q1.toFixed(2),
    median: +median.toFixed(2),
    q3: +q3.toFixed(2),
    upperWhisker: +upperWhisker.toFixed(2),
    max: +max.toFixed(2),
    iqr: +iqr.toFixed(2),
    lowerBound,
    upperBound,
    outliers: rawOutliers,
    outliersDetails: outliersWithDetails,
    inlierBoxplot: inlierBoxplot || {
      name: colName,
      min,
      lowerWhisker,
      q1,
      median,
      q3,
      upperWhisker,
      max,
      iqr,
      outliers: [],
    },
  };
}

function computeQQPlotData(colName: string, values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((a, b) => a + b, 0) / (n || 1);
  const std = Math.sqrt(sorted.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n || 1)) || 1;

  const points: { 
    theoreticalQuantile: number; 
    sampleQuantile: number; 
    referenceLine: number;
    isOutlier: boolean;
    val: number;
  }[] = [];
  const theoVals: number[] = [];
  const sampVals: number[] = [];

  const inlierTheoVals: number[] = [];
  const inlierSampVals: number[] = [];

  for (let i = 0; i < n; i++) {
    const p = (i + 0.5) / n;
    const z = approxInverseNormal(p);
    const standardizedSample = (sorted[i] - mean) / std;

    // Flag outlier quantile if deviation from theoretical line > 0.75 or extreme z-score > 2.5
    const isOutlier = Math.abs(standardizedSample - z) > 0.75 || Math.abs(z) > 2.5;

    points.push({
      theoreticalQuantile: +z.toFixed(3),
      sampleQuantile: +standardizedSample.toFixed(3),
      referenceLine: +z.toFixed(3),
      isOutlier,
      val: sorted[i],
    });

    theoVals.push(z);
    sampVals.push(standardizedSample);

    if (!isOutlier) {
      inlierTheoVals.push(z);
      inlierSampVals.push(standardizedSample);
    }
  }

  const r = calculatePearson(theoVals, sampVals);
  const rSquared = +(r * r).toFixed(4);

  const rInlier = calculatePearson(inlierTheoVals, inlierSampVals);
  const rSquaredWithoutOutliers = inlierTheoVals.length > 5 ? +(rInlier * rInlier).toFixed(4) : rSquared;

  const outlierPointsCount = points.filter(p => p.isOutlier).length;

  return { 
    points, 
    pointsWithoutOutliers: points.filter(p => !p.isOutlier),
    rSquared, 
    rSquaredWithoutOutliers,
    hasExtremeQuantiles: outlierPointsCount > 0,
    outlierCount: outlierPointsCount,
  };
}

function approxInverseNormal(p: number): number {
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
      category: String(category),
      count,
      percentage: +((count / (total || 1)) * 100).toFixed(1),
    }))
    .sort((a, b) => b.count - a.count);
}

function computeScatterWithOLS(rows: Record<string, any>[], xCol: string, yCol: string, colorCol?: string) {
  const x = rows.map(r => Number(r[xCol]) || 0);
  const y = rows.map(r => Number(r[yCol]) || 0);
  const n = x.length;

  const sortedX = [...x].sort((a, b) => a - b);
  const sortedY = [...y].sort((a, b) => a - b);
  const q1X = sortedX[Math.floor(n * 0.25)];
  const q3X = sortedX[Math.floor(n * 0.75)];
  const iqrX = q3X - q1X;
  const xLower = q1X - 1.5 * iqrX;
  const xUpper = q3X + 1.5 * iqrX;

  const q1Y = sortedY[Math.floor(n * 0.25)];
  const q3Y = sortedY[Math.floor(n * 0.75)];
  const iqrY = q3Y - q1Y;
  const yLower = q1Y - 1.5 * iqrY;
  const yUpper = q3Y + 1.5 * iqrY;

  // Global OLS
  const meanX = x.reduce((a, b) => a + b, 0) / (n || 1);
  const meanY = y.reduce((a, b) => a + b, 0) / (n || 1);

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

  // Residual std for residual outlier detection
  const residuals = rows.map(r => {
    const xv = Number(r[xCol]) || 0;
    const yv = Number(r[yCol]) || 0;
    const expected = slope * xv + intercept;
    return yv - expected;
  });
  const resMean = residuals.reduce((a, b) => a + b, 0) / (n || 1);
  const resStd = Math.sqrt(residuals.reduce((a, b) => a + Math.pow(b - resMean, 2), 0) / (n || 1)) || 1;

  // Point classification
  const points = rows.map((r, i) => {
    const xv = Number(r[xCol]) || 0;
    const yv = Number(r[yCol]) || 0;
    const residual = residuals[i];
    const isXOutlier = xv < xLower || xv > xUpper;
    const isYOutlier = yv < yLower || yv > yUpper;
    const isResOutlier = Math.abs(residual) > 2.5 * resStd;
    const isOutlier = isXOutlier || isYOutlier || isResOutlier;

    let outlierReason = 'none';
    if (isXOutlier && isYOutlier) outlierReason = `Atípico Bivariado (${xCol} e ${yCol})`;
    else if (isXOutlier) outlierReason = `Atípico en ${xCol}`;
    else if (isYOutlier) outlierReason = `Atípico en ${yCol}`;
    else if (isResOutlier) outlierReason = `Residuo OLS Extremo (>2.5σ)`;

    return {
      x: xv,
      y: yv,
      trendline: +(slope * xv + intercept).toFixed(2),
      group: colorCol ? String(r[colorCol] ?? 'N/A') : undefined,
      isOutlier,
      isXOutlier,
      isYOutlier,
      outlierReason,
      residual: +residual.toFixed(2),
    };
  });

  const inlierPoints = points.filter(p => !p.isOutlier);
  const inlierX = inlierPoints.map(p => p.x);
  const inlierY = inlierPoints.map(p => p.y);
  const inlierN = inlierPoints.length;

  let slopeWithoutOutliers = slope;
  let interceptWithoutOutliers = intercept;
  let rSquaredWithoutOutliers = rSquared;
  let pearsonRWithoutOutliers = +r.toFixed(3);

  if (inlierN >= 3) {
    const inMeanX = inlierX.reduce((a, b) => a + b, 0) / inlierN;
    const inMeanY = inlierY.reduce((a, b) => a + b, 0) / inlierN;
    let inNum = 0;
    let inDen = 0;
    for (let i = 0; i < inlierN; i++) {
      inNum += (inlierX[i] - inMeanX) * (inlierY[i] - inMeanY);
      inDen += Math.pow(inlierX[i] - inMeanX, 2);
    }
    slopeWithoutOutliers = inDen === 0 ? 0 : inNum / inDen;
    interceptWithoutOutliers = inMeanY - slopeWithoutOutliers * inMeanX;
    const inR = calculatePearson(inlierX, inlierY);
    rSquaredWithoutOutliers = +(inR * inR).toFixed(4);
    pearsonRWithoutOutliers = +inR.toFixed(3);
  }

  const pointsWithoutOutliers = inlierPoints.map(p => ({
    ...p,
    trendline: +(slopeWithoutOutliers * p.x + interceptWithoutOutliers).toFixed(2),
  }));

  const outliersCount = points.filter(p => p.isOutlier).length;

  return { 
    points, 
    pointsWithoutOutliers,
    slope: +slope.toFixed(4), 
    intercept: +intercept.toFixed(2), 
    rSquared, 
    pearsonR: +r.toFixed(3),
    slopeWithoutOutliers: +slopeWithoutOutliers.toFixed(4),
    interceptWithoutOutliers: +interceptWithoutOutliers.toFixed(2),
    rSquaredWithoutOutliers,
    pearsonRWithoutOutliers,
    outliersCount,
  };
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
  const chartPointsWithoutOutliers: any[] = [];
  const groupStats: Record<string, any> = {};
  let totalGroupOutliers = 0;

  for (const [groupName, vals] of Object.entries(groups)) {
    if (vals.length === 0) continue;
    const box = computeBoxplotData(groupName, vals);
    groupStats[groupName] = box;
    totalGroupOutliers += box.outliers.length;

    chartPoints.push({
      group: groupName,
      min: box.min,
      lowerWhisker: box.lowerWhisker,
      q1: box.q1,
      median: box.median,
      q3: box.q3,
      upperWhisker: box.upperWhisker,
      max: box.max,
      iqr: box.iqr,
      count: vals.length,
      outlierCount: box.outliers.length,
      outliers: box.outliers,
    });

    const inlierBox = box.inlierBoxplot as any;
    chartPointsWithoutOutliers.push({
      group: groupName,
      min: inlierBox.min ?? box.lowerWhisker,
      lowerWhisker: inlierBox.lowerWhisker ?? box.lowerWhisker,
      q1: inlierBox.q1 ?? box.q1,
      median: inlierBox.median ?? box.median,
      q3: inlierBox.q3 ?? box.q3,
      upperWhisker: inlierBox.upperWhisker ?? box.upperWhisker,
      max: inlierBox.max ?? box.upperWhisker,
      iqr: inlierBox.iqr ?? box.iqr,
      count: vals.length - box.outliers.length,
      outlierCount: 0,
      outliers: [],
    });
  }

  return { chartPoints, chartPointsWithoutOutliers, groupStats, totalGroupOutliers };
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
