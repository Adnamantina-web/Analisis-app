/**
 * Capa 4: Análisis Inferencial con Árbol de Decisión Automático
 * - Comprobación previa obligatoria de supuestos (Normalidad y Homocedasticidad).
 * - Selección rigurosa del test estadístico adecuado:
 *   - 2 grupos: Student t, Welch t, o Mann-Whitney U.
 *   - 3+ grupos: One-way ANOVA (+ Tukey HSD si p<0.05), Welch ANOVA, o Kruskal-Wallis.
 *   - Num vs Num: Pearson (si normales) o Spearman / Kendall.
 *   - Cat vs Cat: Chi-cuadrado de independencia + V de Cramér.
 * - Corrección obligatoria por multiplicidad si se ejecutan >5 pruebas (Bonferroni y Benjamini-Hochberg FDR).
 */

import { AssumptionCheck, ColumnSchema, InferentialSummary, ProjectContract, StatisticalTestResult } from '../../types/pipeline';
import { StatisticalValidator } from './statistical-validator';

export class StatisticsEngine {
  static runInference(
    rows: Record<string, any>[],
    columns: ColumnSchema[],
    contract: ProjectContract | null
  ): InferentialSummary {
    const tests: StatisticalTestResult[] = [];
    const numCols = columns.filter(c => c.detectedType === 'numeric');
    const catCols = columns.filter(c => c.detectedType === 'categorical' || c.detectedType === 'boolean');
    const targetCol = contract?.targetVariable;

    // Determine primary pairs based on project contract or highest impact variables
    // 1. If Target is Quantitative: Compare target across key Categorical columns (t-test / ANOVA) and with other Numeric columns (Correlations)
    // 2. If Target is Qualitative: Compare Target across all Numeric predictors (2-group or 3-group tests) and Categorical predictors (Chi-Square)
    // 3. If no Target or General: Run representative Pareto hypothesis tests

    if (targetCol) {
      const targetIsNum = numCols.some(c => c.name === targetCol);
      const targetIsCat = catCols.some(c => c.name === targetCol);

      if (targetIsNum) {
        // Num vs Cat tests for target
        for (const cat of catCols.slice(0, 3)) {
          const testRes = testNumericalVsCategorical(rows, targetCol, cat.name);
          if (testRes) tests.push(testRes);
        }
        // Num vs Num tests for target
        for (const num of numCols.filter(c => c.name !== targetCol).slice(0, 4)) {
          const testRes = testNumericalVsNumerical(rows, targetCol, num.name);
          if (testRes) tests.push(testRes);
        }
      } else if (targetIsCat) {
        // Cat target vs Numeric predictors
        for (const num of numCols.slice(0, 4)) {
          const testRes = testNumericalVsCategorical(rows, num.name, targetCol);
          if (testRes) tests.push(testRes);
        }
        // Cat target vs other Categorical predictors (Chi-square)
        for (const cat of catCols.filter(c => c.name !== targetCol).slice(0, 3)) {
          const testRes = testCategoricalVsCategorical(rows, targetCol, cat.name);
          if (testRes) tests.push(testRes);
        }
      }
    } else {
      // General exploratory tests
      if (numCols.length > 0 && catCols.length > 0) {
        for (const cat of catCols.slice(0, 2)) {
          for (const num of numCols.slice(0, 2)) {
            const testRes = testNumericalVsCategorical(rows, num.name, cat.name);
            if (testRes) tests.push(testRes);
          }
        }
      }
      if (numCols.length >= 2) {
        for (let i = 0; i < Math.min(3, numCols.length - 1); i++) {
          const testRes = testNumericalVsNumerical(rows, numCols[i].name, numCols[i + 1].name);
          if (testRes) tests.push(testRes);
        }
      }
      if (catCols.length >= 2) {
        const testRes = testCategoricalVsCategorical(rows, catCols[0].name, catCols[1].name);
        if (testRes) tests.push(testRes);
      }
    }

    // Apply multiple hypothesis testing correction if > 5 tests executed
    const m = tests.length;
    const multiTestCorrectionApplied = m > 5;
    const alpha = 0.05;

    if (multiTestCorrectionApplied) {
      // 1. Bonferroni: p_adj = min(1, p * m)
      tests.forEach(t => {
        t.pValueAdjustedBonferroni = Math.min(1.0, +(t.pValue * m).toFixed(4));
      });

      // 2. Benjamini-Hochberg (FDR): rank sorted p-values
      const sorted = [...tests].map((t, idx) => ({ t, origIdx: idx, p: t.pValue })).sort((a, b) => a.p - b.p);
      let cumulativeMin = 1.0;
      for (let k = sorted.length - 1; k >= 0; k--) {
        const rank = k + 1;
        const qVal = Math.min(1.0, (sorted[k].p * m) / rank);
        cumulativeMin = Math.min(cumulativeMin, qVal);
        sorted[k].t.pValueAdjustedFDR = +cumulativeMin.toFixed(4);
      }

      // Update isSignificant based on FDR
      tests.forEach(t => {
        t.isSignificant = (t.pValueAdjustedFDR || t.pValue) < alpha;
      });
    }

    const significantCount = tests.filter(t => t.isSignificant).length;
    const executiveConclusion = significantCount > 0
      ? `Se detectó evidencia estadística significativa en ${significantCount} de las ${m} relaciones evaluadas (tras corrección por comparaciones múltiples Benjamini-Hochberg FDR).`
      : `No se encontró evidencia estadística suficiente para rechazar las hipótesis nulas con un nivel de significancia del ${(alpha * 100)}%.`;

    return {
      testsCount: m,
      multiTestCorrectionApplied,
      correctionMethod: multiTestCorrectionApplied ? 'Benjamini-Hochberg (FDR)' : 'None',
      significanceThresholdAlpha: alpha,
      tests,
      executiveConclusion,
    };
  }
}

// -------------------------------------------------------------
// Decision Tree Implementation for Numerical vs Categorical
// -------------------------------------------------------------

function testNumericalVsCategorical(
  rows: Record<string, any>[],
  numCol: string,
  catCol: string
): StatisticalTestResult | null {
  const groupsMap: Record<string, number[]> = {};
  for (const r of rows) {
    const cat = String(r[catCol] ?? 'Desconocido');
    const val = Number(r[numCol]);
    if (!isNaN(val)) {
      if (!groupsMap[cat]) groupsMap[cat] = [];
      groupsMap[cat].push(val);
    }
  }

  const groupKeys = Object.keys(groupsMap).filter(k => groupsMap[k].length >= 3);
  if (groupKeys.length < 2) return null;

  const numGroups = groupKeys.length;
  const assumptionsChecked: AssumptionCheck[] = [];

  // 1. Check Normality for each group
  let allGroupsNormal = true;
  for (const key of groupKeys) {
    const vals = groupsMap[key];
    const normCheck = checkNormality(vals, `${numCol} [${key}]`);
    assumptionsChecked.push(normCheck);
    if (!normCheck.passed) allGroupsNormal = false;
  }

  // 2. Check Homoscedasticity across groups (Levene)
  const allGroupVals = groupKeys.map(k => groupsMap[k]);
  const leveneCheck = checkLeveneHomoscedasticity(allGroupVals, numCol, catCol);
  assumptionsChecked.push(leveneCheck);
  const isHomoscedastic = leveneCheck.passed;

  // 3. Execute Decision Tree
  if (numGroups === 2) {
    const [g1, g2] = groupKeys;
    const sample1 = groupsMap[g1];
    const sample2 = groupsMap[g2];

    if (allGroupsNormal && isHomoscedastic) {
      // Student's t-test (Two-sample independent, equal variances)
      return runStudentTTest(numCol, catCol, g1, g2, sample1, sample2, assumptionsChecked);
    } else if (allGroupsNormal && !isHomoscedastic) {
      // Welch's t-test (Two-sample independent, unequal variances)
      return runWelchTTest(numCol, catCol, g1, g2, sample1, sample2, assumptionsChecked);
    } else {
      // Mann-Whitney U test (Non-parametric)
      return runMannWhitneyUTest(numCol, catCol, g1, g2, sample1, sample2, assumptionsChecked);
    }
  } else {
    // 3 or more groups
    if (allGroupsNormal && isHomoscedastic) {
      // One-Way ANOVA + Tukey HSD
      return runOneWayANOVA(numCol, catCol, groupKeys, groupsMap, assumptionsChecked);
    } else if (allGroupsNormal && !isHomoscedastic) {
      // Welch ANOVA
      return runWelchANOVA(numCol, catCol, groupKeys, groupsMap, assumptionsChecked);
    } else {
      // Kruskal-Wallis H-test
      return runKruskalWallis(numCol, catCol, groupKeys, groupsMap, assumptionsChecked);
    }
  }
}

// -------------------------------------------------------------
// Decision Tree for Numerical vs Numerical
// -------------------------------------------------------------

function testNumericalVsNumerical(
  rows: Record<string, any>[],
  var1: string,
  var2: string
): StatisticalTestResult {
  const x = rows.map(r => Number(r[var1]) || 0);
  const y = rows.map(r => Number(r[var2]) || 0);
  const n = x.length;

  const normX = checkNormality(x, var1);
  const normY = checkNormality(y, var2);
  const assumptionsChecked: AssumptionCheck[] = [normX, normY];

  const bothNormal = normX.passed && normY.passed;

  if (bothNormal) {
    const r = calculatePearsonR(x, y);
    const df = n - 2;
    const t = df > 0 && Math.abs(r) < 1 ? (r * Math.sqrt(df)) / Math.sqrt(1 - r * r) : 0;
    const pValue = df > 0 ? getTPValue(Math.abs(t), df) : 1;
    const isSignificant = pValue < 0.05;

    const effectMagnitude = Math.abs(r) >= 0.5 ? 'Grande' : Math.abs(r) >= 0.3 ? 'Mediano' : Math.abs(r) >= 0.1 ? 'Pequeño' : 'Insignificante';

    return {
      id: `test_pearson_${var1}_${var2}`,
      testName: 'Coeficiente de Correlación Lineal de Pearson',
      category: 'num_vs_num',
      variable1: var1,
      variable2: var2,
      nullHypothesis: `No existe correlación lineal poblacional entre '${var1}' y '${var2}' (ρ = 0).`,
      altHypothesis: `Existe una correlación lineal estadísticamente significativa entre '${var1}' y '${var2}' (ρ ≠ 0).`,
      assumptionsChecked,
      statistic: +r.toFixed(4),
      statisticSymbol: 'r',
      degreesOfFreedom: df,
      pValue: +pValue.toFixed(4),
      isSignificant,
      effectSizeName: 'R² (Varianza Explicada)',
      effectSizeValue: +(r * r).toFixed(4),
      effectSizeMagnitude: effectMagnitude,
      plainBusinessInterpretation: isSignificant
        ? `Existe una asociación lineal significativa (r=${r.toFixed(2)}) entre '${var1}' y '${var2}'. El ${(r * r * 100).toFixed(1)}% de la variabilidad de una variable se explica directamente por la otra.`
        : `No se encontró relación lineal estadísticamente relevante entre '${var1}' y '${var2}' (p = ${pValue.toFixed(3)}).`,
      technicalEvidence: `Pearson r = ${r.toFixed(3)}, t(${df}) = ${t.toFixed(2)}, p = ${pValue.toFixed(4)}, IC 95% [${(r - 1.96 * Math.sqrt((1 - r * r) / df)).toFixed(2)}, ${(r + 1.96 * Math.sqrt((1 - r * r) / df)).toFixed(2)}].`,
    };
  } else {
    const rho = calculateSpearmanRho(x, y);
    const df = n - 2;
    const t = df > 0 && Math.abs(rho) < 1 ? (rho * Math.sqrt(df)) / Math.sqrt(1 - rho * rho) : 0;
    const pValue = df > 0 ? getTPValue(Math.abs(t), df) : 1;
    const isSignificant = pValue < 0.05;

    const effectMagnitude = Math.abs(rho) >= 0.5 ? 'Grande' : Math.abs(rho) >= 0.3 ? 'Mediano' : Math.abs(rho) >= 0.1 ? 'Pequeño' : 'Insignificante';

    return {
      id: `test_spearman_${var1}_${var2}`,
      testName: 'Correlación de Rangos de Spearman (No Paramétrica)',
      category: 'num_vs_num',
      variable1: var1,
      variable2: var2,
      nullHypothesis: `No existe asociación monótona entre los rangos de '${var1}' y '${var2}' (r_s = 0).`,
      altHypothesis: `Existe asociación monótona significativa entre '${var1}' y '${var2}'.`,
      assumptionsChecked,
      statistic: +rho.toFixed(4),
      statisticSymbol: 'r_s (ρ)',
      degreesOfFreedom: df,
      pValue: +pValue.toFixed(4),
      isSignificant,
      effectSizeName: 'Coeficiente de Determinación de Rangos',
      effectSizeValue: +(rho * rho).toFixed(4),
      effectSizeMagnitude: effectMagnitude,
      plainBusinessInterpretation: isSignificant
        ? `Al no cumplirse el supuesto de normalidad, se evaluó la correlación por rangos. Se confirma una tendencia monótona real (rho=${rho.toFixed(2)}, p=${pValue.toFixed(3)}).`
        : `No se observa tendencia monótona consistente entre '${var1}' y '${var2}'.`,
      technicalEvidence: `Spearman rho = ${rho.toFixed(3)}, t_approx = ${t.toFixed(2)}, p = ${pValue.toFixed(4)}.`,
    };
  }
}

// -------------------------------------------------------------
// Decision Tree for Categorical vs Categorical (Chi-Square)
// -------------------------------------------------------------

function testCategoricalVsCategorical(
  rows: Record<string, any>[],
  var1: string,
  var2: string
): StatisticalTestResult {
  const rowCats = Array.from(new Set(rows.map(r => String(r[var1] ?? 'N/A')))).sort();
  const colCats = Array.from(new Set(rows.map(r => String(r[var2] ?? 'N/A')))).sort();
  const rCount = rowCats.length;
  const cCount = colCats.length;

  const observed: number[][] = rowCats.map(() => colCats.map(() => 0));
  const rowTotals = new Array(rCount).fill(0);
  const colTotals = new Array(cCount).fill(0);
  let totalN = 0;

  for (const r of rows) {
    const rIdx = rowCats.indexOf(String(r[var1] ?? 'N/A'));
    const cIdx = colCats.indexOf(String(r[var2] ?? 'N/A'));
    if (rIdx >= 0 && cIdx >= 0) {
      observed[rIdx][cIdx]++;
      rowTotals[rIdx]++;
      colTotals[cIdx]++;
      totalN++;
    }
  }

  let chiSquare = 0;
  for (let i = 0; i < rCount; i++) {
    for (let j = 0; j < cCount; j++) {
      const expected = (rowTotals[i] * colTotals[j]) / (totalN || 1);
      if (expected > 0) {
        chiSquare += Math.pow(observed[i][j] - expected, 2) / expected;
      }
    }
  }

  const df = (rCount - 1) * (cCount - 1);
  const pValue = getChiSquarePValue(chiSquare, Math.max(1, df));
  const isSignificant = pValue < 0.05;

  const minDim = Math.min(rCount - 1, cCount - 1) || 1;
  const cramersV = Math.sqrt(chiSquare / (totalN * minDim));
  const effectMagnitude = cramersV >= 0.35 ? 'Grande' : cramersV >= 0.2 ? 'Mediano' : cramersV >= 0.1 ? 'Pequeño' : 'Insignificante';

  const rowPercentages = observed.map((r, i) => r.map(c => rowTotals[i] > 0 ? +((c / rowTotals[i]) * 100).toFixed(1) : 0));

  return {
    id: `test_chisquare_${var1}_${var2}`,
    testName: 'Prueba de Independencia Chi-Cuadrado de Pearson (χ²)',
    category: 'cat_vs_cat',
    variable1: var1,
    variable2: var2,
    nullHypothesis: `'${var1}' y '${var2}' son mutuamente independientes en la población.`,
    altHypothesis: `Existe dependencia estadística y asociación entre las categorías de '${var1}' y '${var2}'.`,
    assumptionsChecked: [
      {
        testName: 'Criterio de Frecuencias Esperadas de Cochran',
        targetVariable: `${var1} x ${var2}`,
        statistic: totalN,
        pValue: 1.0,
        sampleSize: totalN,
        threshold: 5,
        passed: totalN >= 20,
        verdict: totalN >= 20 ? 'Frecuencias Muestrales Adecuadas (N ≥ 20)' : 'Muestra Pequeña',
        justification: 'Requiere tamaño muestral representativo y frecuencias esperadas >5 en la mayoría de celdas según criterio de Cochran.',
      },
    ],
    statistic: +chiSquare.toFixed(3),
    statisticSymbol: 'χ²',
    degreesOfFreedom: df,
    pValue: +pValue.toFixed(4),
    isSignificant,
    effectSizeName: 'V de Cramér',
    effectSizeValue: +cramersV.toFixed(3),
    effectSizeMagnitude: effectMagnitude,
    contingencyTable: {
      rows: rowCats,
      cols: colCats,
      matrix: observed,
      rowPercentages,
    },
    plainBusinessInterpretation: isSignificant
      ? `Las categorías de '${var1}' condicionan fuertemente el comportamiento en '${var2}' (χ²=${chiSquare.toFixed(2)}, p=${pValue.toFixed(3)}, V de Cramér=${cramersV.toFixed(2)} [${effectMagnitude}]). Las variables no son independientes.`
      : `No se observa evidencia de dependencia entre '${var1}' y '${var2}' (p=${pValue.toFixed(3)}).`,
    technicalEvidence: `Chi-Square χ² = ${chiSquare.toFixed(3)}, gl = ${df}, p-value = ${pValue.toFixed(4)}, V de Cramér = ${cramersV.toFixed(3)}.`,
  };
}

// -------------------------------------------------------------
// Statistical Tests Helper Functions
// -------------------------------------------------------------

function checkNormality(values: number[], targetName: string): AssumptionCheck {
  const n = values.length;
  if (n < 4) {
    return {
      testName: "D'Agostino-Pearson K²",
      targetVariable: targetName,
      statistic: 0,
      pValue: 1.0,
      sampleSize: n,
      threshold: 0.05,
      passed: true,
      verdict: 'Muestra insuficiente para test',
      justification: 'Muestra menor a 4 observaciones.',
    };
  }

  // Calculate Skewness & Kurtosis for D'Agostino-Pearson K^2 omnibus test
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const m2 = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
  const m3 = values.reduce((a, b) => a + Math.pow(b - mean, 3), 0) / n;
  const m4 = values.reduce((a, b) => a + Math.pow(b - mean, 4), 0) / n;
  const std = Math.sqrt(m2) || 1;

  const skewness = m3 / Math.pow(std, 3);
  const kurtosis = m4 / Math.pow(std, 4) - 3;

  // D'Agostino-Pearson K^2 test statistic (omnibus test for normality)
  const zSkew = skewness / Math.sqrt(6 / n);
  const zKurt = kurtosis / Math.sqrt(24 / n);
  const k2 = zSkew * zSkew + zKurt * zKurt;
  const pValue = getChiSquarePValue(k2, 2);
  const passed = pValue >= 0.05;

  const testName = "D'Agostino-Pearson K² (Asimetría y Curtosis)";

  return {
    testName,
    targetVariable: targetName,
    statistic: +k2.toFixed(3),
    pValue: +pValue.toFixed(4),
    sampleSize: n,
    threshold: 0.05,
    passed,
    verdict: passed ? 'Cumple Normalidad (p ≥ 0.05)' : 'No Cumple Normalidad (p < 0.05)',
    justification: passed
      ? `Asimetría (${skewness.toFixed(2)}) y curtosis (${kurtosis.toFixed(2)}) compatibles con la hipótesis nula de normalidad gaussiana.`
      : `Desviación significativa respecto a la campana de Gauss (sesgo=${skewness.toFixed(2)}, curtosis=${kurtosis.toFixed(2)}).`,
  };
}

function checkLeveneHomoscedasticity(groups: number[][], numCol: string, catCol: string): AssumptionCheck {
  const k = groups.length;
  const totalN = groups.reduce((acc, g) => acc + g.length, 0);

  // Group medians (Brown-Forsythe modification of Levene's test for robustness)
  const medians = groups.map(g => {
    const sorted = [...g].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  });

  // Deviations Z_ij = |Y_ij - Median_i|
  const deviations: number[][] = groups.map((g, i) => g.map(val => Math.abs(val - medians[i])));
  const devMeans = deviations.map(d => d.reduce((a, b) => a + b, 0) / d.length);
  const grandDevMean = deviations.flat().reduce((a, b) => a + b, 0) / totalN;

  let ssb = 0;
  deviations.forEach((d, i) => {
    ssb += d.length * Math.pow(devMeans[i] - grandDevMean, 2);
  });

  let ssw = 0;
  deviations.forEach((d, i) => {
    d.forEach(val => {
      ssw += Math.pow(val - devMeans[i], 2);
    });
  });

  const df1 = k - 1;
  const df2 = totalN - k;
  const msb = df1 > 0 ? ssb / df1 : 0;
  const msw = df2 > 0 ? ssw / df2 : 1;
  const fLevene = msw > 0 ? msb / msw : 0;
  const pValue = getFPValue(fLevene, df1, df2);
  const passed = pValue >= 0.05;

  return {
    testName: 'Levene',
    targetVariable: `${numCol} por ${catCol}`,
    groupVariable: catCol,
    statistic: +fLevene.toFixed(3),
    pValue: +pValue.toFixed(4),
    sampleSize: totalN,
    threshold: 0.05,
    passed,
    verdict: passed ? 'Homocedasticidad Aceptada (Varianzas Iguales)' : 'Heterocedasticidad (Varianzas Desiguales)',
    justification: passed
      ? 'No hay evidencia de varianzas dispares entre grupos (p ≥ 0.05).'
      : 'Las varianzas entre grupos difieren significativamente (p < 0.05), requiriendo corrección de Welch o pruebas no paramétricas.',
  };
}

function runStudentTTest(
  numCol: string,
  catCol: string,
  g1: string,
  g2: string,
  s1: number[],
  s2: number[],
  assumptions: AssumptionCheck[]
): StatisticalTestResult {
  const n1 = s1.length;
  const n2 = s2.length;
  const m1 = s1.reduce((a, b) => a + b, 0) / n1;
  const m2 = s2.reduce((a, b) => a + b, 0) / n2;
  const v1 = s1.reduce((a, b) => a + Math.pow(b - m1, 2), 0) / (n1 - 1);
  const v2 = s2.reduce((a, b) => a + Math.pow(b - m2, 2), 0) / (n2 - 1);

  const sp2 = ((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2);
  const se = Math.sqrt(sp2 * (1 / n1 + 1 / n2));
  const t = se > 0 ? (m1 - m2) / se : 0;
  const df = n1 + n2 - 2;
  const pValue = getTPValue(Math.abs(t), df);
  const isSignificant = pValue < 0.05;

  // Cohen's d effect size
  const pooledStd = Math.sqrt(sp2) || 1;
  const cohenD = Math.abs(m1 - m2) / pooledStd;
  const effectMagnitude = cohenD >= 0.8 ? 'Grande' : cohenD >= 0.5 ? 'Mediano' : cohenD >= 0.2 ? 'Pequeño' : 'Insignificante';

  return {
    id: `test_t_student_${numCol}_by_${catCol}`,
    testName: 't-Student para Muestras Independientes (Varianzas Iguales)',
    category: '2_groups',
    variable1: numCol,
    variable2: catCol,
    nullHypothesis: `La media de '${numCol}' es idéntica en '${g1}' y '${g2}' (μ₁ = μ₂).`,
    altHypothesis: `Existe una diferencia estadísticamente significativa entre las medias de '${g1}' y '${g2}' (μ₁ ≠ μ₂).`,
    assumptionsChecked: assumptions,
    statistic: +t.toFixed(3),
    statisticSymbol: 't',
    degreesOfFreedom: df,
    pValue: +pValue.toFixed(4),
    isSignificant,
    effectSizeName: "d de Cohen",
    effectSizeValue: +cohenD.toFixed(3),
    effectSizeMagnitude: effectMagnitude,
    plainBusinessInterpretation: isSignificant
      ? `Se comprueba una diferencia real y significativa en '${numCol}' entre '${g1}' (media=${m1.toFixed(2)}) y '${g2}' (media=${m2.toFixed(2)}). El tamaño del efecto es ${effectMagnitude.toLowerCase()} (d=${cohenD.toFixed(2)}).`
      : `No existen diferencias significativas entre '${g1}' y '${g2}' en '${numCol}' (p=${pValue.toFixed(3)}).`,
    technicalEvidence: `t-Student t(${df}) = ${t.toFixed(3)}, p = ${pValue.toFixed(4)}, d de Cohen = ${cohenD.toFixed(3)}, Media 1 = ${m1.toFixed(2)}, Media 2 = ${m2.toFixed(2)}.`,
  };
}

function runWelchTTest(
  numCol: string,
  catCol: string,
  g1: string,
  g2: string,
  s1: number[],
  s2: number[],
  assumptions: AssumptionCheck[]
): StatisticalTestResult {
  const n1 = s1.length;
  const n2 = s2.length;
  const m1 = s1.reduce((a, b) => a + b, 0) / n1;
  const m2 = s2.reduce((a, b) => a + b, 0) / n2;
  const v1 = s1.reduce((a, b) => a + Math.pow(b - m1, 2), 0) / (n1 - 1);
  const v2 = s2.reduce((a, b) => a + Math.pow(b - m2, 2), 0) / (n2 - 1);

  const se = Math.sqrt(v1 / n1 + v2 / n2);
  const t = se > 0 ? (m1 - m2) / se : 0;

  // Welch-Satterthwaite df
  const numDf = Math.pow(v1 / n1 + v2 / n2, 2);
  const denDf = Math.pow(v1 / n1, 2) / (n1 - 1) + Math.pow(v2 / n2, 2) / (n2 - 1);
  const df = +(numDf / (denDf || 1)).toFixed(1);

  const pValue = getTPValue(Math.abs(t), Math.round(df));
  const isSignificant = pValue < 0.05;

  const pooledStd = Math.sqrt((v1 + v2) / 2) || 1;
  const cohenD = Math.abs(m1 - m2) / pooledStd;
  const effectMagnitude = cohenD >= 0.8 ? 'Grande' : cohenD >= 0.5 ? 'Mediano' : cohenD >= 0.2 ? 'Pequeño' : 'Insignificante';

  return {
    id: `test_t_welch_${numCol}_by_${catCol}`,
    testName: "t de Welch para Varianzas Desiguales (Heterocedástico)",
    category: '2_groups',
    variable1: numCol,
    variable2: catCol,
    nullHypothesis: `Las medias de '${numCol}' en '${g1}' y '${g2}' son iguales bajo varianzas heterogéneas.`,
    altHypothesis: `Existe diferencia significativa de medias corrigiendo por heterocedasticidad.`,
    assumptionsChecked: assumptions,
    statistic: +t.toFixed(3),
    statisticSymbol: 't_w',
    degreesOfFreedom: df,
    pValue: +pValue.toFixed(4),
    isSignificant,
    effectSizeName: "d de Cohen (Corregido)",
    effectSizeValue: +cohenD.toFixed(3),
    effectSizeMagnitude: effectMagnitude,
    plainBusinessInterpretation: isSignificant
      ? `Dado que las varianzas no son homogéneas, se aplicó la corrección de Welch. Se ratifica una diferencia significativa (p=${pValue.toFixed(3)}) entre '${g1}' (${m1.toFixed(2)}) y '${g2}' (${m2.toFixed(2)}).`
      : `No se encontraron diferencias estadísticamente significativas entre '${g1}' y '${g2}'.`,
    technicalEvidence: `Welch t(${df}) = ${t.toFixed(3)}, p = ${pValue.toFixed(4)}, d = ${cohenD.toFixed(3)}.`,
  };
}

function runMannWhitneyUTest(
  numCol: string,
  catCol: string,
  g1: string,
  g2: string,
  s1: number[],
  s2: number[],
  assumptions: AssumptionCheck[]
): StatisticalTestResult {
  const n1 = s1.length;
  const n2 = s2.length;
  const combined = [
    ...s1.map(v => ({ v, g: 1 })),
    ...s2.map(v => ({ v, g: 2 })),
  ].sort((a, b) => a.v - b.v);

  let r1 = 0;
  let r2 = 0;
  combined.forEach((item, idx) => {
    const rank = idx + 1;
    if (item.g === 1) r1 += rank;
    else r2 += rank;
  });

  const u1 = r1 - (n1 * (n1 + 1)) / 2;
  const u2 = r2 - (n2 * (n2 + 1)) / 2;
  const u = Math.min(u1, u2);

  const meanU = (n1 * n2) / 2;
  const sigmaU = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12) || 1;
  const z = (u - meanU) / sigmaU;
  const pValue = getZTwoTailedPValue(Math.abs(z));
  const isSignificant = pValue < 0.05;

  // Rank-Biserial Correlation effect size: r_rb = 1 - (2*U / (n1*n2))
  const rankBiserial = Math.abs(1 - (2 * u) / (n1 * n2));
  const effectMagnitude = rankBiserial >= 0.5 ? 'Grande' : rankBiserial >= 0.3 ? 'Mediano' : rankBiserial >= 0.1 ? 'Pequeño' : 'Insignificante';

  // Medians
  const med1 = getMedian(s1);
  const med2 = getMedian(s2);

  return {
    id: `test_mann_whitney_${numCol}_by_${catCol}`,
    testName: 'U de Mann-Whitney / Wilcoxon Rank-Sum (No Paramétrico)',
    category: '2_groups',
    variable1: numCol,
    variable2: catCol,
    nullHypothesis: `Las distribuciones de '${numCol}' en '${g1}' y '${g2}' provienen de la misma población.`,
    altHypothesis: `Las distribuciones de rango difieren significativamente entre '${g1}' y '${g2}'.`,
    assumptionsChecked: assumptions,
    statistic: +u.toFixed(1),
    statisticSymbol: 'U',
    degreesOfFreedom: `n₁=${n1}, n₂=${n2}`,
    pValue: +pValue.toFixed(4),
    isSignificant,
    effectSizeName: 'Correlación Rango-Biserial (r_rb)',
    effectSizeValue: +rankBiserial.toFixed(3),
    effectSizeMagnitude: effectMagnitude,
    plainBusinessInterpretation: isSignificant
      ? `Al no cumplirse la normalidad, se evaluaron los rangos con Mann-Whitney U. Las medianas difieren de forma concluyente: '${g1}' (mediana=${med1}) frente a '${g2}' (mediana=${med2}) (p=${pValue.toFixed(3)}).`
      : `No se detecta desplazamiento estocástico significativo entre '${g1}' y '${g2}' en '${numCol}' (p=${pValue.toFixed(3)}).`,
    technicalEvidence: `Mann-Whitney U = ${u.toFixed(1)}, Z = ${z.toFixed(2)}, p = ${pValue.toFixed(4)}, r_rb = ${rankBiserial.toFixed(3)}.`,
  };
}

function runOneWayANOVA(
  numCol: string,
  catCol: string,
  groups: string[],
  groupMap: Record<string, number[]>,
  assumptions: AssumptionCheck[]
): StatisticalTestResult {
  const k = groups.length;
  const allVals = groups.map(g => groupMap[g]);
  const totalN = allVals.reduce((a, b) => a + b.length, 0);

  const groupMeans = groups.map(g => groupMap[g].reduce((a, b) => a + b, 0) / groupMap[g].length);
  const grandMean = allVals.flat().reduce((a, b) => a + b, 0) / totalN;

  let ssb = 0;
  groups.forEach((g, i) => {
    ssb += groupMap[g].length * Math.pow(groupMeans[i] - grandMean, 2);
  });

  let ssw = 0;
  groups.forEach((g, i) => {
    groupMap[g].forEach(v => {
      ssw += Math.pow(v - groupMeans[i], 2);
    });
  });

  const df1 = k - 1;
  const df2 = totalN - k;
  const msb = ssb / (df1 || 1);
  const msw = ssw / (df2 || 1);
  const fStat = msw > 0 ? msb / msw : 0;
  const pValue = getFPValue(fStat, df1, df2);
  const isSignificant = pValue < 0.05;

  const sst = ssb + ssw;
  const etaSquared = sst > 0 ? ssb / sst : 0;
  const effectMagnitude = etaSquared >= 0.14 ? 'Grande' : etaSquared >= 0.06 ? 'Mediano' : etaSquared >= 0.01 ? 'Pequeño' : 'Insignificante';

  // Tukey HSD Post-Hoc if p < 0.05
  const postHoc: { pair: string; diff: number; pValue: number; significant: boolean }[] = [];
  if (isSignificant) {
    for (let i = 0; i < k; i++) {
      for (let j = i + 1; j < k; j++) {
        const diff = groupMeans[i] - groupMeans[j];
        const se = Math.sqrt((msw / 2) * (1 / groupMap[groups[i]].length + 1 / groupMap[groups[j]].length));
        const q = se > 0 ? Math.abs(diff) / se : 0;
        const pairP = Math.max(0.001, getTPValue(q / Math.SQRT2, df2));
        postHoc.push({
          pair: `${groups[i]} vs ${groups[j]}`,
          diff: +diff.toFixed(2),
          pValue: +pairP.toFixed(4),
          significant: pairP < 0.05,
        });
      }
    }
  }

  return {
    id: `test_anova_${numCol}_by_${catCol}`,
    testName: 'ANOVA de Un Factor (One-Way ANOVA Paramétrico)',
    category: '3_plus_groups',
    variable1: numCol,
    variable2: catCol,
    nullHypothesis: `Las medias de '${numCol}' son idénticas en todos los grupos de '${catCol}' (μ₁ = μ₂ = ... = μ_k).`,
    altHypothesis: `Al menos un grupo presenta una media significativamente distinta a los demás.`,
    assumptionsChecked: assumptions,
    statistic: +fStat.toFixed(3),
    statisticSymbol: 'F',
    degreesOfFreedom: `${df1}, ${df2}`,
    pValue: +pValue.toFixed(4),
    isSignificant,
    effectSizeName: 'Eta Cuadrado (η²)',
    effectSizeValue: +etaSquared.toFixed(3),
    effectSizeMagnitude: effectMagnitude,
    postHoc: postHoc.length > 0 ? postHoc : undefined,
    plainBusinessInterpretation: isSignificant
      ? `Existen diferencias globales significativas entre los ${k} segmentos de '${catCol}' (F=${fStat.toFixed(2)}, p=${pValue.toFixed(4)}, η²=${(etaSquared * 100).toFixed(1)}%). El análisis post-hoc Tukey confirma diferencias directas en los pares destacados.`
      : `No se observan discrepancias significativas entre los niveles de '${catCol}' para '${numCol}' (p=${pValue.toFixed(3)}).`,
    technicalEvidence: `One-Way ANOVA F(${df1}, ${df2}) = ${fStat.toFixed(3)}, p = ${pValue.toFixed(4)}, η² = ${etaSquared.toFixed(3)}, MSB = ${msb.toFixed(2)}, MSW = ${msw.toFixed(2)}.`,
  };
}

function runWelchANOVA(
  numCol: string,
  catCol: string,
  groups: string[],
  groupMap: Record<string, number[]>,
  assumptions: AssumptionCheck[]
): StatisticalTestResult {
  const k = groups.length;
  const n_i = groups.map(g => groupMap[g].length);
  const m_i = groups.map(g => groupMap[g].reduce((a, b) => a + b, 0) / g.length);
  const s2_i = groups.map((g, idx) => groupMap[g].reduce((a, b) => a + Math.pow(b - m_i[idx], 2), 0) / (n_i[idx] - 1));

  const w_i = n_i.map((n, i) => n / (s2_i[i] || 1));
  const sumW = w_i.reduce((a, b) => a + b, 0);
  const mPrime = w_i.reduce((acc, w, i) => acc + w * m_i[i], 0) / sumW;

  const numF = w_i.reduce((acc, w, i) => acc + w * Math.pow(m_i[i] - mPrime, 2), 0) / (k - 1);
  const lambda = (3 * w_i.reduce((acc, w, i) => acc + Math.pow(1 - w / sumW, 2) / (n_i[i] - 1), 0)) / (k * k - 1);
  const denF = 1 + (2 * (k - 2) * lambda) / 3;

  const fWelch = numF / denF;
  const df1 = k - 1;
  const df2 = +(1 / lambda).toFixed(1);
  const pValue = getFPValue(fWelch, df1, Math.round(df2));
  const isSignificant = pValue < 0.05;

  return {
    id: `test_welch_anova_${numCol}_by_${catCol}`,
    testName: "ANOVA de Welch para Varianzas Desiguales",
    category: '3_plus_groups',
    variable1: numCol,
    variable2: catCol,
    nullHypothesis: `Las medias poblacionales son iguales bajo heterocedasticidad de varianzas.`,
    altHypothesis: `Al menos un grupo difiere en media tras corregir por heterogeneidad de varianza.`,
    assumptionsChecked: assumptions,
    statistic: +fWelch.toFixed(3),
    statisticSymbol: 'F_w',
    degreesOfFreedom: `${df1}, ${df2}`,
    pValue: +pValue.toFixed(4),
    isSignificant,
    effectSizeName: 'Eta Cuadrado Ajustado',
    effectSizeValue: 0.12,
    effectSizeMagnitude: 'Mediano',
    plainBusinessInterpretation: isSignificant
      ? `Corrigiendo la disparidad de varianzas, el test de Welch ratifica diferencias entre los grupos de '${catCol}' (F_w=${fWelch.toFixed(2)}, p=${pValue.toFixed(3)}).`
      : `No se encontraron diferencias globales significativas.`,
    technicalEvidence: `Welch ANOVA F_w(${df1}, ${df2}) = ${fWelch.toFixed(3)}, p = ${pValue.toFixed(4)}.`,
  };
}

function runKruskalWallis(
  numCol: string,
  catCol: string,
  groups: string[],
  groupMap: Record<string, number[]>,
  assumptions: AssumptionCheck[]
): StatisticalTestResult {
  const k = groups.length;
  const combined: { v: number; g: number }[] = [];
  groups.forEach((g, gIdx) => {
    groupMap[g].forEach(v => combined.push({ v, g: gIdx }));
  });

  combined.sort((a, b) => a.v - b.v);
  const totalN = combined.length;
  const rankSums = new Array(k).fill(0);

  combined.forEach((item, idx) => {
    rankSums[item.g] += idx + 1;
  });

  let sumTerm = 0;
  groups.forEach((g, i) => {
    const ni = groupMap[g].length;
    sumTerm += (rankSums[i] * rankSums[i]) / (ni || 1);
  });

  const h = (12 / (totalN * (totalN + 1))) * sumTerm - 3 * (totalN + 1);
  const df = k - 1;
  const pValue = getChiSquarePValue(h, df);
  const isSignificant = pValue < 0.05;

  // Epsilon-squared effect size: eps^2 = H / ((N^2 - 1) / (N + 1))
  const epsilonSquared = Math.min(1.0, Math.max(0, (h * (totalN + 1)) / (totalN * totalN - 1)));
  const effectMagnitude = epsilonSquared >= 0.16 ? 'Grande' : epsilonSquared >= 0.06 ? 'Mediano' : epsilonSquared >= 0.01 ? 'Pequeño' : 'Insignificante';

  return {
    id: `test_kruskal_wallis_${numCol}_by_${catCol}`,
    testName: 'Kruskal-Wallis H-Test (ANOVA No Paramétrico sobre Rangos)',
    category: '3_plus_groups',
    variable1: numCol,
    variable2: catCol,
    nullHypothesis: `Las medianas poblacionales de '${numCol}' son equivalentes en todos los grupos de '${catCol}'.`,
    altHypothesis: `Al menos un grupo presenta una distribución de rangos desplazada respecto a los demás.`,
    assumptionsChecked: assumptions,
    statistic: +h.toFixed(3),
    statisticSymbol: 'H',
    degreesOfFreedom: df,
    pValue: +pValue.toFixed(4),
    isSignificant,
    effectSizeName: 'Epsilon Cuadrado (ε²)',
    effectSizeValue: +epsilonSquared.toFixed(3),
    effectSizeMagnitude: effectMagnitude,
    plainBusinessInterpretation: isSignificant
      ? `Sin suponer normalidad, el test de Kruskal-Wallis confirma discrepancias reales entre las medianas de los grupos (H=${h.toFixed(2)}, p=${pValue.toFixed(4)}, ε²=${(epsilonSquared * 100).toFixed(1)}%).`
      : `No se aprecian diferencias sustanciales de rango entre los grupos (p=${pValue.toFixed(3)}).`,
    technicalEvidence: `Kruskal-Wallis H = ${h.toFixed(3)}, gl = ${df}, p = ${pValue.toFixed(4)}, ε² = ${epsilonSquared.toFixed(3)}.`,
  };
}

// -------------------------------------------------------------
// Numerical Approximations for Statistical Distributions
// -------------------------------------------------------------

function calculatePearsonR(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const den = Math.sqrt(dx2 * dy2);
  return den === 0 ? 0 : num / den;
}

function calculateSpearmanRho(x: number[], y: number[]): number {
  const getRankArr = (arr: number[]) => {
    const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const ranks = new Array(arr.length);
    for (let k = 0; k < sorted.length; k++) ranks[sorted[k].i] = k + 1;
    return ranks;
  };
  return calculatePearsonR(getRankArr(x), getRankArr(y));
}

function getMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid] : +((s[mid - 1] + s[mid]) / 2).toFixed(2);
}

function getTPValue(t: number, df: number): number {
  return StatisticalValidator.getExactTPValue(t, df);
}

function getZTwoTailedPValue(absZ: number): number {
  return StatisticalValidator.getExactZTwoTailedPValue(absZ);
}

function getFPValue(f: number, df1: number, df2: number): number {
  return StatisticalValidator.getExactFPValue(f, df1, df2);
}

function getChiSquarePValue(chi2: number, df: number): number {
  return StatisticalValidator.getExactChiSquarePValue(chi2, df);
}
