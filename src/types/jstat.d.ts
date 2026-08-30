declare module 'jstat' {
  export const jStat: {
    studentt: {
      pdf(x: number, df: number): number;
      cdf(x: number, df: number): number;
      inv(p: number, df: number): number;
    };
    centralF: {
      pdf(x: number, df1: number, df2: number): number;
      cdf(x: number, df1: number, df2: number): number;
      inv(p: number, df1: number, df2: number): number;
    };
    chisquare: {
      pdf(x: number, df: number): number;
      cdf(x: number, df: number): number;
      inv(p: number, df: number): number;
    };
    normal: {
      pdf(x: number, mean: number, std: number): number;
      cdf(x: number, mean: number, std: number): number;
      inv(p: number, mean: number, std: number): number;
    };
    [key: string]: any;
  };
  export default jStat;
}
