/**
 * DataFlow 6-Layer Pareto Data Pipeline Types
 * Strict architecture adhering to Pareto 20/80 principle and 6-layer methodology
 */

export interface ColumnSchema {
  name: string;
  detectedType: 'numeric' | 'categorical' | 'datetime' | 'boolean' | 'text' | 'id';
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  sampleValues: any[];
  isNumericCandidate?: boolean;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  std?: number;
  topCategories?: { value: string; count: number; percentage: number }[];
}

export interface IngestSummary {
  fileName: string;
  fileSize: number;
  fileType: 'csv' | 'tsv' | 'xlsx' | 'json' | 'parquet' | 'sql';
  delimiter?: string;
  encoding: string;
  rowCount: number;
  columnCount: number;
  sheetNames?: string[];
  selectedSheet?: string;
  columns: ColumnSchema[];
  previewRows: Record<string, any>[];
  rawText?: string;
  ingestedAt: string;
}

export interface ProjectContract {
  businessQuestion: string;
  targetVariable: string | null;
  targetType: 'quantitative' | 'qualitative' | 'none';
  unitOfObservation: string;
  scopeLevel: 'descriptive' | 'inferential' | 'predictive';
  randomSeed: number;
  createdAt: string;
  signedBy: string;
  hypothesis?: string;
}

export interface OutlierStats {
  column: string;
  q1: number;
  q3: number;
  iqr: number;
  lowerBoundIQR: number;
  upperBoundIQR: number;
  iqrOutlierCount: number;
  mean: number;
  std: number;
  zOutlierCount: number;
  outlierIndices: number[];
  recommendation: string;
}

export interface ColumnCleaningStrategy {
  column: string;
  detectedIssue: string;
  proposedMethod: 'mean' | 'median' | 'mode' | 'knn' | 'drop_rows' | 'drop_col' | 'none';
  justification: string;
  appliedMethod: 'mean' | 'median' | 'mode' | 'knn' | 'drop_rows' | 'drop_col' | 'none';
  userOverridden: boolean;
  transformation: 'none' | 'log1p' | 'box_cox' | 'z_score' | 'min_max';
}

export interface CleaningSummary {
  originalRowCount: number;
  finalRowCount: number;
  originalColumnCount: number;
  finalColumnCount: number;
  duplicateRowsRemoved: number;
  totalNullsImputed: number;
  typeCorrectionsApplied: { column: string; from: string; to: string; count: number }[];
  outliersSummary: OutlierStats[];
  strategies: ColumnCleaningStrategy[];
  cleanedPreview: Record<string, any>[];
  cleanedColumns: ColumnSchema[];
  cleanedAt: string;
}

export interface ChartDataPoint {
  [key: string]: any;
}

export interface EDAChart {
  id: string;
  title: string;
  layer: 'univariate' | 'multivariate';
  chartType: 'histogram_kde' | 'boxplot' | 'qq_plot' | 'bar_freq' | 'donut_freq' | 'scatter_trend' | 'heatmap_corr' | 'contingency_table' | 'grouped_boxplot' | 'pareto_chart';
  variables: string[];
  data: ChartDataPoint[];
  dataWithoutOutliers?: ChartDataPoint[];
  hasOutliers?: boolean;
  outlierCount?: number;
  outlierPercentage?: number;
  outlierBounds?: { lower: number; upper: number };
  metadata: Record<string, any>;
  businessTakeaway: string;
  statisticalBacking: string;
}

export interface CorrelationPair {
  var1: string;
  var2: string;
  pearsonR: number;
  pearsonP: number;
  spearmanRho: number;
  spearmanP: number;
  strength: 'Muy Fuerte' | 'Fuerte' | 'Moderada' | 'Débil' | 'Nula';
  isSignificant: boolean;
}

export interface EDAOutlierFeature {
  column: string;
  outlierCount: number;
  outlierPercentage: number;
  lowerBound: number;
  upperBound: number;
  outlierValues: number[];
  severity: 'low' | 'moderate' | 'high';
}

export interface VIFScore {
  variable: string;
  vif: number;
  rSquared: number;
  risk: 'low' | 'moderate' | 'high';
  topCorrelatedWith?: string;
  maxCorrelation?: number;
  recommendation?: string;
}

export interface MulticollinearityAnalysis {
  hasSevereMulticollinearity: boolean;
  maxVIF: number;
  vifScores: VIFScore[];
  highCorrelationPairs: CorrelationPair[];
  overallCollinearityScore: number;
  summary: string;
  recommendedAction: string;
}

export interface EDASummary {
  totalChartsGenerated: number;
  charts: EDAChart[];
  correlationMatrix: {
    columns: string[];
    matrix: number[][];
    topPairs: CorrelationPair[];
    spearmanMatrix?: number[][];
    pValuesMatrix?: number[][];
    multicollinearity?: MulticollinearityAnalysis;
  };
  keyFindings: string[];
  totalOutliersDetected?: number;
  outlierFeatures?: EDAOutlierFeature[];
  multicollinearity?: MulticollinearityAnalysis;
}

export interface AssumptionCheck {
  testName: 'Shapiro-Wilk' | 'Kolmogorov-Smirnov' | 'D-Agostino' | 'Levene' | 'Bartlett';
  targetVariable: string;
  groupVariable?: string;
  statistic: number;
  pValue: number;
  sampleSize: number;
  threshold: number;
  passed: boolean;
  verdict: string;
  justification: string;
}

export interface StatisticalTestResult {
  id: string;
  testName: string;
  category: '2_groups' | '3_plus_groups' | 'num_vs_num' | 'cat_vs_cat';
  variable1: string;
  variable2: string;
  nullHypothesis: string;
  altHypothesis: string;
  assumptionsChecked: AssumptionCheck[];
  statistic: number;
  statisticSymbol: string;
  degreesOfFreedom?: number | string;
  pValue: number;
  pValueAdjustedBonferroni?: number;
  pValueAdjustedFDR?: number;
  isSignificant: boolean;
  effectSizeName: string;
  effectSizeValue: number;
  effectSizeMagnitude: 'Insignificante' | 'Pequeño' | 'Mediano' | 'Grande' | 'Muy Grande';
  postHoc?: { pair: string; diff: number; pValue: number; significant: boolean }[];
  contingencyTable?: { rows: string[]; cols: string[]; matrix: number[][]; rowPercentages: number[][] };
  plainBusinessInterpretation: string;
  technicalEvidence: string;
}

export interface InferentialSummary {
  testsCount: number;
  multiTestCorrectionApplied: boolean;
  correctionMethod: 'Bonferroni' | 'Benjamini-Hochberg (FDR)' | 'None';
  significanceThresholdAlpha: number;
  tests: StatisticalTestResult[];
  executiveConclusion: string;
}

export interface MLModelEvaluation {
  id: string;
  name: string;
  modelId?: string;
  modelName?: string;
  algorithm?: string;
  modelType: 'linear' | 'tree' | 'ensemble' | 'knn_svm' | 'naive_bayes';
  task: 'classification' | 'regression';
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    aucRoc?: number;
    rocAuc?: number;
    rmse?: number;
    mae?: number;
    r2?: number;
    mape?: number;
  };
  confusionMatrix?: {
    labels: string[];
    matrix: number[][];
  };
  rocCurve?: { fpr: number; tpr: number }[];
  residualsPlot?: { actual: number; predicted: number; residual: number }[];
  featureImportances: { feature: string; importance: number; percentage: number }[];
  featureImportance?: { feature: string; importance: number; percentage?: number }[];
  hyperparameters: Record<string, any>;
  trainTimeMs: number;
  isBest: boolean;
  paretoVerdict: string;
  businessInterpretation?: string;
}

export interface ClusterEvaluation {
  k: number;
  wcss: number;
  silhouetteScore: number;
  clusterSizes: number[];
  centroids: Record<string, number>[];
}

export interface UnsupervisedResult {
  kmeans: {
    optimalK: number;
    elbowCurve: { k: number; wcss: number; silhouette: number }[];
    clusterProfiles: { clusterId: number; size: number; percent: number; summary: string; topFeatures: Record<string, number> }[];
  };
  pca: {
    components: { pc: string; varianceExplained: number; cumulativeVariance: number }[];
    retainedComponentsCount: number;
    totalVarianceRetained: number;
    loadings: { feature: string; [pc: string]: number | string }[];
  };
}

export interface MLSummary {
  task: 'classification' | 'regression' | 'unsupervised';
  targetColumn?: string;
  trainRowCount: number;
  testRowCount: number;
  models: MLModelEvaluation[];
  bestModel: MLModelEvaluation;
  unsupervised?: UnsupervisedResult;
  modelArtifactName: string;
  paretoSummary: string;
}

export interface FinalReportGroundedEvidence {
  type: 'chart' | 'test' | 'metric' | 'cleaning' | string;
  referenceId?: string;
  description?: string;
  value: string;
  sourceLayer?: string;
  metricOrTest?: string;
}

export interface FinalReportSection {
  number: number;
  title: string;
  content: string;
  highlights: string[];
  groundedEvidences: FinalReportGroundedEvidence[];
}

export interface FinalReport {
  title: string;
  businessQuestion: string;
  targetVariable: string | null;
  scopeLevel: string;
  createdAt: string;
  executiveSummary: string; // Max 3 sentences, zero jargon
  businessContext: string;
  methodologyDataTreatment: string;
  exploratoryFindings: string;
  statisticalEvidence: string;
  modelPerformance: string;
  recommendations: string[];
  sections: FinalReportSection[];
  groundedMetricCounter: number;
  integrityVerified: boolean;
  edaSummary?: EDASummary;
  inferentialSummary?: InferentialSummary | null;
  mlSummary?: MLSummary | null;
  cleaningSummary?: CleaningSummary | null;
  contract?: ProjectContract;
}

export interface DecisionLog {
  id?: string;
  projectId?: string;
  contract: ProjectContract;
  timestamp?: string;
  certifiedTimestamp?: string;
  randomSeed?: number;
  ingestionMetadata?: {
    fileName: string;
    totalRawRows: number;
    totalRawColumns: number;
    encoding: string;
  };
  ingestedSource?: {
    name: string;
    sha256: string;
  };
  cleaningDecisions?: ColumnCleaningStrategy[] | any[];
  edaTakeaways?: { id: string; takeaway: string }[];
  statisticalDecisions?: { test: string; p: number; rejectNull?: boolean }[];
  mlDecisions?: {
    bestModel: string;
    metrics: Record<string, any>;
    topFeatures: any[];
  } | any[];
  reportIntegrityHash?: string;
}

export interface SampleDatasetInfo {
  id: string;
  name: string;
  category?: string;
  description: string;
  format?: string;
  suggestedTarget?: string;
  targetType?: 'quantitative' | 'qualitative' | 'none';
  suggestedQuestion?: string;
  unitOfObservation?: string;
  scopeLevel?: 'descriptive' | 'inferential' | 'predictive';
  rawCsv?: string;
  defaultTarget?: string;
  defaultQuestion?: string;
  rawContent?: string;
}

export interface DecisionLogEntry {
  id: string;
  timestamp: string;
  layerNumber: number;
  layer: string;
  action: string;
  rationale: string;
  parameterChanges?: Record<string, any>;
}

export interface AuditLogEntry {
  layer: number;
  layerName: string;
  timestamp: string;
  action: string;
  decision: string;
  justification: string;
  paretoRuleApplied: string;
  details: Record<string, any>;
}

export interface FullPipelineAuditLog {
  appVersion: string;
  executionId: string;
  timestamp: string;
  projectContract: ProjectContract;
  decisions: AuditLogEntry[];
}

export interface PipelineState {
  currentLayer: number; // 0: Ingest, 1: Strategy, 2: Cleaning, 3: EDA, 4: Stats, 5: ML, 6: Report & Deliverables
  isProcessing: boolean;
  processingMessage: string;
  ingest: IngestSummary | null;
  contract: ProjectContract | null;
  cleaning: CleaningSummary | null;
  cleanedDataset: Record<string, any>[] | null;
  originalDataset: Record<string, any>[] | null;
  eda: EDASummary | null;
  inferential: InferentialSummary | null;
  ml: MLSummary | null;
  finalReport: FinalReport | null;
  auditLog: FullPipelineAuditLog | null;
  deliverablesReady: boolean;
}
