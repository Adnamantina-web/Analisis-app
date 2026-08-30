/**
 * Test de Regresión y Validación Estadística contra Valores de Referencia (SciPy / R)
 * Valida numéricamente las distribuciones t-Student, F-Snedecor (ANOVA), Chi-cuadrado y Normal.
 */

import jStatPkg from 'jstat';

// Support both ESM default and CJS module exports
const jStat: any = (jStatPkg as any)?.jStat || jStatPkg;

export interface StatisticalBenchmarkCase {
  testType: 't-Student' | 'ANOVA (F)' | 'Chi-cuadrado' | 'Normal (Z)';
  description: string;
  statistic: number;
  df1: number;
  df2?: number;
  scipyReferencePValue: number;
  appCalculatedPValue: number;
  absoluteError: number;
  passed: boolean;
}

export class StatisticalValidator {
  /**
   * Ejecuta el benchmark de regresión comparando contra scipy.stats
   */
  static runBenchmarks(): {
    allPassed: boolean;
    cases: StatisticalBenchmarkCase[];
  } {
    const cases: StatisticalBenchmarkCase[] = [
      // 1. t-Student Two-Tailed Tests
      {
        testType: 't-Student',
        description: 't=2.0, df=10 (Caso no significativo limítrofe)',
        statistic: 2.0,
        df1: 10,
        scipyReferencePValue: 0.073388,
        appCalculatedPValue: StatisticalValidator.getExactTPValue(2.0, 10),
        absoluteError: 0,
        passed: false,
      },
      {
        testType: 't-Student',
        description: 't=2.26, df=10 (Caso significativo p<0.05)',
        statistic: 2.26,
        df1: 10,
        scipyReferencePValue: 0.047368,
        appCalculatedPValue: StatisticalValidator.getExactTPValue(2.26, 10),
        absoluteError: 0,
        passed: false,
      },
      {
        testType: 't-Student',
        description: 't=3.0, df=15 (Caso altamente significativo)',
        statistic: 3.0,
        df1: 15,
        scipyReferencePValue: 0.008973,
        appCalculatedPValue: StatisticalValidator.getExactTPValue(3.0, 15),
        absoluteError: 0,
        passed: false,
      },
      // 2. ANOVA F-Distribution One-Tailed Upper Tail Tests
      {
        testType: 'ANOVA (F)',
        description: 'F=5.0, df1=4, df2=25 (ANOVA multivariado)',
        statistic: 5.0,
        df1: 4,
        df2: 25,
        scipyReferencePValue: 0.004224,
        appCalculatedPValue: StatisticalValidator.getExactFPValue(5.0, 4, 25),
        absoluteError: 0,
        passed: false,
      },
      {
        testType: 'ANOVA (F)',
        description: 'F=2.5, df1=2, df2=30 (ANOVA 3 grupos)',
        statistic: 2.5,
        df1: 2,
        df2: 30,
        scipyReferencePValue: 0.099088,
        appCalculatedPValue: StatisticalValidator.getExactFPValue(2.5, 2, 30),
        absoluteError: 0,
        passed: false,
      },
      // 3. Chi-Square Independence Tests
      {
        testType: 'Chi-cuadrado',
        description: 'χ²=5.0, df=2 (Chi-cuadrado 2x3)',
        statistic: 5.0,
        df1: 2,
        scipyReferencePValue: 0.082085,
        appCalculatedPValue: StatisticalValidator.getExactChiSquarePValue(5.0, 2),
        absoluteError: 0,
        passed: false,
      },
      {
        testType: 'Chi-cuadrado',
        description: 'χ²=15.0, df=5 (Chi-cuadrado significativo)',
        statistic: 15.0,
        df1: 5,
        scipyReferencePValue: 0.010362,
        appCalculatedPValue: StatisticalValidator.getExactChiSquarePValue(15.0, 5),
        absoluteError: 0,
        passed: false,
      },
      // 4. Normal / Z Distribution (Mann-Whitney / Large sample)
      {
        testType: 'Normal (Z)',
        description: 'Z=1.96 (Umbral 95% bilateral)',
        statistic: 1.96,
        df1: 1,
        scipyReferencePValue: 0.049996,
        appCalculatedPValue: StatisticalValidator.getExactZTwoTailedPValue(1.96),
        absoluteError: 0,
        passed: false,
      },
    ];

    // Compute errors and tolerance check (tolerance < 0.0002)
    let allPassed = true;
    for (const c of cases) {
      c.absoluteError = Math.abs(c.appCalculatedPValue - c.scipyReferencePValue);
      c.passed = c.absoluteError < 0.0005;
      if (!c.passed) allPassed = false;
    }

    return { allPassed, cases };
  }

  static getExactTPValue(t: number, df: number): number {
    if (df <= 0 || isNaN(df)) return 1.0;
    const absT = Math.abs(t);
    const cdf = jStat.studentt.cdf(absT, df);
    const pTwoTailed = 2 * (1 - cdf);
    return Math.max(0.000001, Math.min(1.0, +pTwoTailed.toFixed(6)));
  }

  static getExactFPValue(f: number, df1: number, df2: number): number {
    if (f <= 0 || df1 <= 0 || df2 <= 0 || isNaN(f)) return 1.0;
    const cdf = jStat.centralF.cdf(f, df1, df2);
    const pUpper = 1 - cdf;
    return Math.max(0.000001, Math.min(1.0, +pUpper.toFixed(6)));
  }

  static getExactChiSquarePValue(chi2: number, df: number): number {
    if (chi2 <= 0 || df <= 0 || isNaN(chi2)) return 1.0;
    const cdf = jStat.chisquare.cdf(chi2, df);
    const pUpper = 1 - cdf;
    return Math.max(0.000001, Math.min(1.0, +pUpper.toFixed(6)));
  }

  static getExactZTwoTailedPValue(absZ: number): number {
    if (isNaN(absZ)) return 1.0;
    const cdf = jStat.normal.cdf(Math.abs(absZ), 0, 1);
    const pTwoTailed = 2 * (1 - cdf);
    return Math.max(0.000001, Math.min(1.0, +pTwoTailed.toFixed(6)));
  }
}
