import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Target, 
  TrendingUp, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  BarChart2, 
  Activity, 
  Shuffle, 
  PieChart,
  Award,
  Zap,
  ShieldCheck,
  Cpu,
  Check,
  Eye,
  Sliders,
  Columns3,
  BarChart3,
  LayoutGrid,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ScatterChart, 
  Scatter, 
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { MLSummary, MLModelEvaluation } from '../types/pipeline';

interface Capa5MachineLearningProps {
  mlSummary: MLSummary | null;
  onProceedToReport: () => void;
  isProcessing: boolean;
}

export const Capa5MachineLearning: React.FC<Capa5MachineLearningProps> = ({
  mlSummary,
  onProceedToReport,
  isProcessing,
}) => {
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [comparisonViewMode, setComparisonViewMode] = useState<'matrix' | 'chart' | 'cards'>('matrix');

  if (!mlSummary) {
    return (
      <div className="bg-white p-12 border border-black/10 text-center font-serif space-y-3 shadow-sm">
        <BrainCircuit className="h-10 w-10 mx-auto text-[#1A1A1A] animate-pulse" />
        <h3 className="text-xl font-serif text-[#1A1A1A]">
          Entrenando Suite de Modelos Predictivos (Split 70/30)...
        </h3>
        <p className="text-xs font-mono text-gray-500 max-w-xl mx-auto">
          Optimizando modelos lineales regularizados, árboles y ensamblados en partición de prueba no sesgada, junto con segmentación no supervisada K-Means y reducción PCA.
        </p>
      </div>
    );
  }

  const models = mlSummary.models || [];
  const bestModel = mlSummary.bestModel || models[0];
  const selectedModel = models.find(m => (m.id === selectedModelId || m.modelId === selectedModelId)) || bestModel;
  const isClassification = mlSummary.task === 'classification';
  const hasMultipleModels = models.length > 1;

  // Helper to extract optimal metrics across all models
  const optimalMetrics = getOptimalMetrics(models, isClassification);

  // Prepare chart comparison data for side-by-side visual chart
  const comparisonChartData = prepareComparisonChartData(models, isClassification);

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="bg-white p-6 sm:p-8 border border-black/10 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 bg-black text-white">
                Capa 05 // Machine Learning
              </span>
              <span className="text-xs font-mono text-gray-500">
                Supervisado 70/30 & No Supervisado (K-Means / PCA)
              </span>
            </div>
            <h3 className="text-2xl font-serif font-light text-[#1A1A1A]">
              Modelado Predictivo & Benchmark Multimodelo
            </h3>
            <p className="text-sm font-serif italic text-gray-600 max-w-3xl mt-1">
              Evaluación rigurosa sobre partición Test 30% nunca antes vista. Comparación paralela de rendimiento, latencia e interpretabilidad bajo la regla de Pareto 20/80.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#FAF8F5] border border-black/10 px-4 py-2.5 text-right">
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Target Analizado</div>
              <div className="text-xs font-mono font-bold text-[#E63946]">
                {mlSummary.targetColumn || 'Variable Objetivo'} ({mlSummary.task.toUpperCase()})
              </div>
            </div>
            <div className="bg-[#FAF8F5] border border-black/10 px-4 py-2.5 text-right">
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Partición Test</div>
              <div className="text-xs font-mono font-bold text-[#1A1A1A]">
                {mlSummary.testRowCount} observaciones (30%)
              </div>
            </div>
          </div>
        </div>

        {/* Executive Winner Callout */}
        <div className="bg-[#1A1A1A] text-white p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#E63946] flex items-center justify-center shrink-0">
              <Award className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#E63946] font-bold">
                  Ganador Pareto 20/80
                </span>
                <span className="text-xs font-mono text-white/50">•</span>
                <span className="text-xs font-mono text-white/70">
                  {bestModel.modelType.toUpperCase()}
                </span>
              </div>
              <h4 className="text-base font-serif font-bold text-white">
                {bestModel.name || bestModel.modelName}
              </h4>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono">
            {isClassification ? (
              <>
                <div className="text-right">
                  <span className="text-white/40 block text-[10px]">F1-Score Test</span>
                  <span className="text-[#E63946] font-bold text-sm">
                    {bestModel.metrics.f1Score?.toFixed(3) || '—'}
                  </span>
                </div>
                <div className="text-right border-l border-white/20 pl-4">
                  <span className="text-white/40 block text-[10px]">Accuracy</span>
                  <span className="text-white font-bold text-sm">
                    {((bestModel.metrics.accuracy || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-right border-l border-white/20 pl-4">
                  <span className="text-white/40 block text-[10px]">ROC-AUC</span>
                  <span className="text-white font-bold text-sm">
                    {bestModel.metrics.aucRoc?.toFixed(3) || bestModel.metrics.rocAuc?.toFixed(3) || '—'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="text-right">
                  <span className="text-white/40 block text-[10px]">R² Test</span>
                  <span className="text-[#E63946] font-bold text-sm">
                    {bestModel.metrics.r2?.toFixed(3) || '—'}
                  </span>
                </div>
                <div className="text-right border-l border-white/20 pl-4">
                  <span className="text-white/40 block text-[10px]">RMSE</span>
                  <span className="text-white font-bold text-sm">
                    {bestModel.metrics.rmse?.toFixed(2) || '—'}
                  </span>
                </div>
                <div className="text-right border-l border-white/20 pl-4">
                  <span className="text-white/40 block text-[10px]">MAE</span>
                  <span className="text-white font-bold text-sm">
                    {bestModel.metrics.mae?.toFixed(2) || '—'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. SIDE-BY-SIDE MODEL COMPARISON TABLE (Shown when > 1 model) */}
      {hasMultipleModels && (
        <div className="bg-white border border-black/10 shadow-sm space-y-4">
          {/* Section Header & View Mode Switcher */}
          <div className="p-6 border-b border-black/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Columns3 className="h-4 w-4 text-[#E63946]" />
                <h4 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">
                  Tabla Comparativa Lado a Lado de Algoritmos ({models.length} Modelos Evaluados)
                </h4>
              </div>
              <p className="text-xs font-serif italic text-gray-500 mt-0.5">
                Inspección horizontal directa de métricas predictivas, tiempo de entrenamiento, interpretabilidad y penalización por sobreajuste.
              </p>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex items-center space-x-1 border border-black/20 p-1 bg-[#FAF8F5]">
              <button
                id="btn-ml-view-matrix"
                onClick={() => setComparisonViewMode('matrix')}
                className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition cursor-pointer ${
                  comparisonViewMode === 'matrix'
                    ? 'bg-[#1A1A1A] text-white font-bold'
                    : 'text-gray-600 hover:text-black'
                }`}
                title="Ver tabla matricial lado a lado con columnas por modelo"
              >
                <Columns3 className="h-3.5 w-3.5" />
                <span>Matriz Lado a Lado</span>
              </button>

              <button
                id="btn-ml-view-chart"
                onClick={() => setComparisonViewMode('chart')}
                className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition cursor-pointer ${
                  comparisonViewMode === 'chart'
                    ? 'bg-[#1A1A1A] text-white font-bold'
                    : 'text-gray-600 hover:text-black'
                }`}
                title="Comparativa gráfica de barras agrupadas"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Gráfico Comparativo</span>
              </button>

              <button
                id="btn-ml-view-cards"
                onClick={() => setComparisonViewMode('cards')}
                className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition cursor-pointer ${
                  comparisonViewMode === 'cards'
                    ? 'bg-[#1A1A1A] text-white font-bold'
                    : 'text-gray-600 hover:text-black'
                }`}
                title="Ver tarjetas individuales de algoritmo"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Tarjetas Bento</span>
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: SIDE-BY-SIDE MATRIX TABLE */}
          {comparisonViewMode === 'matrix' && (
            <div className="overflow-x-auto p-4 sm:p-6">
              <table className="w-full text-left text-xs font-mono border border-black/15">
                {/* Column Headers (Each model is a side-by-side column) */}
                <thead>
                  <tr className="bg-[#1A1A1A] text-white">
                    <th className="py-4 px-4 w-48 text-[11px] font-bold uppercase tracking-wider border-r border-white/20">
                      Dimensión Evaluada
                    </th>
                    {models.map((mod) => {
                      const isModBest = mod.isBest || mod.id === bestModel.id;
                      const isModSelected = (mod.id === selectedModel.id || mod.modelId === selectedModel.modelId);
                      return (
                        <th 
                          key={mod.id || mod.modelId}
                          className={`py-4 px-4 text-center border-r border-white/10 min-w-[200px] transition-colors ${
                            isModBest ? 'bg-[#222222]' : 'bg-[#1A1A1A]'
                          }`}
                        >
                          <div className="space-y-1.5">
                            {isModBest ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 bg-[#E63946] text-white font-bold uppercase tracking-widest">
                                <Award className="h-2.5 w-2.5" />
                                Ganador Pareto
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono px-2 py-0.5 bg-white/10 text-white/70 uppercase tracking-widest">
                                Algoritmo Evaluado
                              </span>
                            )}
                            <div className="text-xs font-serif font-bold text-white leading-tight">
                              {mod.name || mod.modelName}
                            </div>
                            <div className="text-[10px] font-mono text-white/50 uppercase">
                              Familia: {mod.modelType}
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-black/10 bg-white">
                  {/* Category Header: Métricas de Rendimiento en Test */}
                  <tr className="bg-[#FAF8F5] border-y border-black/15 font-bold">
                    <td colSpan={models.length + 1} className="py-2 px-4 text-[10px] uppercase tracking-widest text-gray-700">
                      1. Rendimiento Predictivo (Evaluado en Partición Test 30%)
                    </td>
                  </tr>

                  {isClassification ? (
                    <>
                      {/* Metric 1: F1-Score */}
                      <tr className="hover:bg-neutral-50/80">
                        <td className="py-3 px-4 font-bold text-[#1A1A1A] border-r border-black/10">
                          <div className="flex items-center justify-between">
                            <span>F1-Score (Armónico)</span>
                            <span className="text-[9px] text-gray-400 font-normal">Mayor es mejor</span>
                          </div>
                        </td>
                        {models.map(mod => {
                          const val = mod.metrics.f1Score ?? 0;
                          const isTop = val === optimalMetrics.maxF1;
                          return (
                            <td key={mod.id || mod.modelId} className={`py-3 px-4 text-center border-r border-black/10 ${isTop ? 'bg-emerald-50/70 font-bold' : ''}`}>
                              <div className="flex flex-col items-center">
                                <span className={`text-sm ${isTop ? 'text-emerald-800 font-bold' : 'text-gray-800'}`}>
                                  {val.toFixed(3)}
                                </span>
                                {isTop ? (
                                  <span className="text-[9px] text-emerald-700 font-bold">★ Mejor Valor</span>
                                ) : (
                                  <span className="text-[9px] text-gray-400">
                                    {(val - optimalMetrics.maxF1).toFixed(3)}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Metric 2: Accuracy */}
                      <tr className="hover:bg-neutral-50/80">
                        <td className="py-3 px-4 font-bold text-[#1A1A1A] border-r border-black/10">
                          <div className="flex items-center justify-between">
                            <span>Accuracy Global (%)</span>
                            <span className="text-[9px] text-gray-400 font-normal">Mayor es mejor</span>
                          </div>
                        </td>
                        {models.map(mod => {
                          const val = (mod.metrics.accuracy || 0) * 100;
                          const isTop = (mod.metrics.accuracy || 0) === optimalMetrics.maxAccuracy;
                          return (
                            <td key={mod.id || mod.modelId} className={`py-3 px-4 text-center border-r border-black/10 ${isTop ? 'bg-emerald-50/70 font-bold' : ''}`}>
                              <span className={`text-xs ${isTop ? 'text-emerald-800 font-bold' : 'text-gray-800'}`}>
                                {val.toFixed(1)}%
                              </span>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Metric 3: Precision */}
                      <tr className="hover:bg-neutral-50/80">
                        <td className="py-3 px-4 font-bold text-[#1A1A1A] border-r border-black/10">
                          <div className="flex items-center justify-between">
                            <span>Precisión Positiva</span>
                            <span className="text-[9px] text-gray-400 font-normal">Control falsos pos.</span>
                          </div>
                        </td>
                        {models.map(mod => {
                          const val = mod.metrics.precision ?? 0;
                          const isTop = val === optimalMetrics.maxPrecision;
                          return (
                            <td key={mod.id || mod.modelId} className={`py-3 px-4 text-center border-r border-black/10 ${isTop ? 'bg-emerald-50/70 font-bold' : ''}`}>
                              <span className={`text-xs ${isTop ? 'text-emerald-800 font-bold' : 'text-gray-800'}`}>
                                {val ? val.toFixed(3) : '—'}
                              </span>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Metric 4: Recall */}
                      <tr className="hover:bg-neutral-50/80">
                        <td className="py-3 px-4 font-bold text-[#1A1A1A] border-r border-black/10">
                          <div className="flex items-center justify-between">
                            <span>Sensibilidad (Recall)</span>
                            <span className="text-[9px] text-gray-400 font-normal">Control falsos neg.</span>
                          </div>
                        </td>
                        {models.map(mod => {
                          const val = mod.metrics.recall ?? 0;
                          const isTop = val === optimalMetrics.maxRecall;
                          return (
                            <td key={mod.id || mod.modelId} className={`py-3 px-4 text-center border-r border-black/10 ${isTop ? 'bg-emerald-50/70 font-bold' : ''}`}>
                              <span className={`text-xs ${isTop ? 'text-emerald-800 font-bold' : 'text-gray-800'}`}>
                                {val ? val.toFixed(3) : '—'}
                              </span>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Metric 5: ROC-AUC */}
                      <tr className="hover:bg-neutral-50/80">
                        <td className="py-3 px-4 font-bold text-[#1A1A1A] border-r border-black/10">
                          <div className="flex items-center justify-between">
                            <span>Área Bajo Curva (ROC-AUC)</span>
                            <span className="text-[9px] text-gray-400 font-normal">Discriminabilidad</span>
                          </div>
                        </td>
                        {models.map(mod => {
                          const val = mod.metrics.aucRoc ?? mod.metrics.rocAuc ?? 0;
                          const isTop = val === optimalMetrics.maxAuc;
                          return (
                            <td key={mod.id || mod.modelId} className={`py-3 px-4 text-center border-r border-black/10 ${isTop ? 'bg-emerald-50/70 font-bold' : ''}`}>
                              <span className={`text-xs ${isTop ? 'text-emerald-800 font-bold' : 'text-gray-800'}`}>
                                {val ? val.toFixed(3) : '—'}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    </>
                  ) : (
                    <>
                      {/* Regression Metric 1: R2 */}
                      <tr className="hover:bg-neutral-50/80">
                        <td className="py-3 px-4 font-bold text-[#1A1A1A] border-r border-black/10">
                          <div className="flex items-center justify-between">
                            <span>R² Coeficiente Determinación</span>
                            <span className="text-[9px] text-gray-400 font-normal">Mayor es mejor</span>
                          </div>
                        </td>
                        {models.map(mod => {
                          const val = mod.metrics.r2 ?? 0;
                          const isTop = val === optimalMetrics.maxR2;
                          return (
                            <td key={mod.id || mod.modelId} className={`py-3 px-4 text-center border-r border-black/10 ${isTop ? 'bg-emerald-50/70 font-bold' : ''}`}>
                              <div className="flex flex-col items-center">
                                <span className={`text-sm ${isTop ? 'text-emerald-800 font-bold' : 'text-gray-800'}`}>
                                  {val.toFixed(3)}
                                </span>
                                {isTop ? (
                                  <span className="text-[9px] text-emerald-700 font-bold">★ Mejor Ajuste</span>
                                ) : (
                                  <span className="text-[9px] text-gray-400">
                                    {(val - optimalMetrics.maxR2).toFixed(3)}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Regression Metric 2: RMSE */}
                      <tr className="hover:bg-neutral-50/80">
                        <td className="py-3 px-4 font-bold text-[#1A1A1A] border-r border-black/10">
                          <div className="flex items-center justify-between">
                            <span>Error Cuadrático (RMSE)</span>
                            <span className="text-[9px] text-gray-400 font-normal">Menor es mejor</span>
                          </div>
                        </td>
                        {models.map(mod => {
                          const val = mod.metrics.rmse ?? 0;
                          const isTop = val === optimalMetrics.minRmse;
                          return (
                            <td key={mod.id || mod.modelId} className={`py-3 px-4 text-center border-r border-black/10 ${isTop ? 'bg-emerald-50/70 font-bold' : ''}`}>
                              <span className={`text-xs ${isTop ? 'text-emerald-800 font-bold' : 'text-gray-800'}`}>
                                {val ? val.toFixed(2) : '—'}
                              </span>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Regression Metric 3: MAE */}
                      <tr className="hover:bg-neutral-50/80">
                        <td className="py-3 px-4 font-bold text-[#1A1A1A] border-r border-black/10">
                          <div className="flex items-center justify-between">
                            <span>Error Absoluto Medio (MAE)</span>
                            <span className="text-[9px] text-gray-400 font-normal">Menor es mejor</span>
                          </div>
                        </td>
                        {models.map(mod => {
                          const val = mod.metrics.mae ?? 0;
                          const isTop = val === optimalMetrics.minMae;
                          return (
                            <td key={mod.id || mod.modelId} className={`py-3 px-4 text-center border-r border-black/10 ${isTop ? 'bg-emerald-50/70 font-bold' : ''}`}>
                              <span className={`text-xs ${isTop ? 'text-emerald-800 font-bold' : 'text-gray-800'}`}>
                                {val ? val.toFixed(2) : '—'}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    </>
                  )}

                  {/* Category Header: Arquitectura y Eficiencia */}
                  <tr className="bg-[#FAF8F5] border-y border-black/15 font-bold">
                    <td colSpan={models.length + 1} className="py-2 px-4 text-[10px] uppercase tracking-widest text-gray-700">
                      2. Eficiencia Computacional & Factores Operativos
                    </td>
                  </tr>

                  {/* Latency ms */}
                  <tr className="hover:bg-neutral-50/80">
                    <td className="py-3 px-4 font-bold text-[#1A1A1A] border-r border-black/10">
                      <div className="flex items-center space-x-1.5">
                        <Zap className="h-3.5 w-3.5 text-amber-600" />
                        <span>Tiempo de Entrenamiento</span>
                      </div>
                    </td>
                    {models.map(mod => {
                      const isFastest = mod.trainTimeMs === optimalMetrics.minLatency;
                      return (
                        <td key={mod.id || mod.modelId} className="py-3 px-4 text-center border-r border-black/10">
                          <span className={`text-xs ${isFastest ? 'text-emerald-700 font-bold' : 'text-gray-700'}`}>
                            {mod.trainTimeMs} ms {isFastest && '⚡'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Interpretability */}
                  <tr className="hover:bg-neutral-50/80">
                    <td className="py-3 px-4 font-bold text-[#1A1A1A] border-r border-black/10">
                      <div className="flex items-center space-x-1.5">
                        <Eye className="h-3.5 w-3.5 text-gray-500" />
                        <span>Nivel de Interpretabilidad</span>
                      </div>
                    </td>
                    {models.map(mod => {
                      const interpretability = getInterpretabilityLabel(mod.modelType);
                      return (
                        <td key={mod.id || mod.modelId} className="py-3 px-4 text-center border-r border-black/10">
                          <span className={`text-[10px] px-2 py-0.5 uppercase font-bold border ${interpretability.badgeClass}`}>
                            {interpretability.label}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Overfitting Prevention / Hyperparameters */}
                  <tr className="hover:bg-neutral-50/80">
                    <td className="py-3 px-4 font-bold text-[#1A1A1A] border-r border-black/10">
                      <div className="flex items-center space-x-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                        <span>Control de Regularización</span>
                      </div>
                    </td>
                    {models.map(mod => {
                      const hpSummary = Object.entries(mod.hyperparameters || {})
                        .slice(0, 2)
                        .map(([k, v]) => `${k}=${v}`)
                        .join(', ') || 'Default';
                      return (
                        <td key={mod.id || mod.modelId} className="py-3 px-4 text-center border-r border-black/10 text-[10px] text-gray-600">
                          {hpSummary}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Top 1 Predictor Feature */}
                  <tr className="hover:bg-neutral-50/80">
                    <td className="py-3 px-4 font-bold text-[#1A1A1A] border-r border-black/10">
                      <span>Variable Más Influyente</span>
                    </td>
                    {models.map(mod => {
                      const topFeat = (mod.featureImportances || mod.featureImportance || [])[0];
                      return (
                        <td key={mod.id || mod.modelId} className="py-3 px-4 text-center border-r border-black/10">
                          {topFeat ? (
                            <span className="text-[11px] font-bold text-[#1A1A1A]">
                              {topFeat.feature} <span className="text-gray-400">({topFeat.percentage || (topFeat.importance * 100).toFixed(0)}%)</span>
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Action Row: Selection for Deep Dive */}
                  <tr className="bg-[#FAF8F5]">
                    <td className="py-4 px-4 font-bold text-[#1A1A1A] border-r border-black/10">
                      <span>Auditoría Profunda</span>
                    </td>
                    {models.map(mod => {
                      const isModSelected = (mod.id === selectedModel.id || mod.modelId === selectedModel.modelId);
                      return (
                        <td key={mod.id || mod.modelId} className="py-4 px-4 text-center border-r border-black/10">
                          <button
                            onClick={() => setSelectedModelId(mod.id || mod.modelId || null)}
                            className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition cursor-pointer w-full ${
                              isModSelected
                                ? 'bg-[#1A1A1A] text-white font-bold shadow-xs'
                                : 'border border-black/20 bg-white hover:bg-black/5 text-gray-700'
                            }`}
                          >
                            {isModSelected ? '● Inspeccionando' : 'Ver Detalles'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW MODE 2: GROUPED MULTI-MODEL BAR CHART */}
          {comparisonViewMode === 'chart' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-500">
                  Comparativa de métricas normalizadas entre los {models.length} algoritmos evaluados:
                </span>
                <span className="text-[10px] font-mono text-gray-400">
                  Escala normalizada [0.0 - 1.0]
                </span>
              </div>

              <div className="h-80 w-full bg-[#FAF8F5] p-4 border border-black/5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparisonChartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis 
                      dataKey="metricName" 
                      tick={{ fontSize: 10, fill: '#1A1A1A', fontFamily: 'JetBrains Mono' }} 
                    />
                    <YAxis 
                      domain={[0, 1]} 
                      tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1A1A1A', color: '#FFF', fontSize: '11px', fontFamily: 'JetBrains Mono', border: 'none' }}
                      formatter={(val: any, name: string) => [
                        typeof val === 'number' ? val.toFixed(3) : val,
                        name
                      ]}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', paddingTop: '10px' }} 
                    />
                    {models.map((mod, idx) => {
                      const colors = ['#E63946', '#1A1A1A', '#457B9D', '#2A9D8F', '#E76F51'];
                      const fill = mod.isBest ? '#E63946' : colors[(idx + 1) % colors.length];
                      return (
                        <Bar 
                          key={mod.id || mod.modelId} 
                          dataKey={mod.name || mod.modelName} 
                          fill={fill} 
                          radius={[3, 3, 0, 0]}
                        />
                      );
                    })}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* VIEW MODE 3: BENTO CARDS */}
          {comparisonViewMode === 'cards' && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {models.map(mod => {
                const isModBest = mod.isBest || mod.id === bestModel.id;
                const isModSelected = (mod.id === selectedModel.id || mod.modelId === selectedModel.modelId);
                return (
                  <div
                    key={mod.id || mod.modelId}
                    onClick={() => setSelectedModelId(mod.id || mod.modelId || null)}
                    className={`p-5 border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                      isModSelected
                        ? 'border-black bg-[#FAF8F5] ring-2 ring-black/20 shadow-md'
                        : isModBest
                        ? 'border-[#E63946]/40 bg-white hover:border-[#E63946]'
                        : 'border-black/10 bg-white hover:border-black/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 bg-black/5 text-gray-700 font-bold">
                          {mod.modelType}
                        </span>
                        {isModBest && (
                          <span className="text-[9px] font-mono px-2 py-0.5 bg-[#E63946] text-white font-bold uppercase">
                            👑 Mejor
                          </span>
                        )}
                      </div>
                      <h5 className="font-serif font-bold text-sm text-[#1A1A1A] leading-tight">
                        {mod.name || mod.modelName}
                      </h5>
                    </div>

                    <div className="space-y-2 py-2 border-y border-black/5 font-mono text-xs">
                      {isClassification ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-500">F1-Score:</span>
                            <span className="font-bold text-[#1A1A1A]">{mod.metrics.f1Score?.toFixed(3) || '—'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Accuracy:</span>
                            <span>{((mod.metrics.accuracy || 0) * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">ROC-AUC:</span>
                            <span>{mod.metrics.aucRoc?.toFixed(3) || mod.metrics.rocAuc?.toFixed(3) || '—'}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-500">R²:</span>
                            <span className="font-bold text-[#1A1A1A]">{mod.metrics.r2?.toFixed(3) || '—'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">RMSE:</span>
                            <span>{mod.metrics.rmse?.toFixed(2) || '—'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">MAE:</span>
                            <span>{mod.metrics.mae?.toFixed(2) || '—'}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between text-[10px] text-gray-400 pt-1 border-t border-black/5">
                        <span>Latencia:</span>
                        <span>{mod.trainTimeMs} ms</span>
                      </div>
                    </div>

                    <button
                      className={`w-full py-1.5 text-[10px] font-mono uppercase tracking-wider ${
                        isModSelected
                          ? 'bg-[#1A1A1A] text-white font-bold'
                          : 'bg-black/5 text-gray-700 hover:bg-black/10'
                      }`}
                    >
                      {isModSelected ? 'Inspeccionando' : 'Seleccionar'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pareto Trade-Off Rationale Note */}
          <div className="px-6 pb-6">
            <div className="bg-[#FAF8F5] p-4 border border-black/10 flex items-start space-x-3">
              <Sparkles className="h-4 w-4 text-[#E63946] shrink-0 mt-0.5" />
              <div className="text-xs font-mono text-gray-700 space-y-1">
                <span className="font-bold text-[#1A1A1A]">Dictamen Pareto 20/80 del Benchmark: </span>
                <span>
                  {bestModel.paretoVerdict || mlSummary.paretoSummary || 'El modelo ganador equilibra máxima capacidad predictiva en partición de prueba con bajo riesgo de sobreajuste.'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SELECTED MODEL DEEP DIVE INSPECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Feature Importance (8 Cols) */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 border border-black/10 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-black/10 pb-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-black text-white">
                  Auditoría de Predictor
                </span>
                <span className="text-xs font-mono text-gray-500">
                  {selectedModel.name || selectedModel.modelName}
                </span>
              </div>
              <h4 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">
                Importancia de Variables Explicativas (Feature Importance)
              </h4>
              <p className="text-xs font-serif italic text-gray-500 mt-0.5">
                Aporte relativo y contribución ponderada de cada variable al poder discriminante del modelo seleccionado.
              </p>
            </div>
            <span className="text-xs font-mono text-gray-400 shrink-0">
              Pareto Weights
            </span>
          </div>

          {/* Feature Importance Bar Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(selectedModel.featureImportances || selectedModel.featureImportance || []).slice(0, 8)}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 60, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="2 2" stroke="#E5E7EB" horizontal={false} />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 10, fontFamily: 'monospace' }} 
                  domain={[0, 'dataMax + 0.05']} 
                />
                <YAxis 
                  dataKey="feature" 
                  type="category" 
                  tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#1A1A1A' }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', color: '#FFFFFF', border: 'none', fontFamily: 'monospace', fontSize: '11px' }}
                  formatter={(val: any) => [
                    `${typeof val === 'number' ? (val * 100).toFixed(1) : val}% de peso`,
                    'Importancia'
                  ]}
                />
                <Bar dataKey="importance" fill="#1A1A1A" radius={[0, 2, 2, 0]}>
                  {(selectedModel.featureImportances || selectedModel.featureImportance || []).slice(0, 8).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#E63946' : index < 3 ? '#1A1A1A' : '#4A5568'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Dominant Feature Callout */}
          <div className="border-l-4 border-l-[#E63946] pl-4 py-1 bg-[#FAF8F5] p-3 border border-black/5">
            <div className="text-[10px] font-mono uppercase text-gray-500 font-bold">Factor de Mayor Impacto Explicativo</div>
            <p className="text-sm font-serif italic text-[#1A1A1A] mt-0.5">
              {(selectedModel.featureImportances || selectedModel.featureImportance || [])[0] ? (
                <>
                  La variable &ldquo;{(selectedModel.featureImportances || selectedModel.featureImportance || [])[0]?.feature}&rdquo; lidera la capacidad predictiva con el {
                    ((selectedModel.featureImportances || selectedModel.featureImportance || [])[0]?.percentage || 
                    ((selectedModel.featureImportances || selectedModel.featureImportance || [])[0]?.importance * 100)).toFixed(1)
                  }% de peso explicativo total.
                </>
              ) : (
                'Variables ponderadas de manera balanceada en la matriz regularizada.'
              )}
            </p>
          </div>
        </div>

        {/* Diagnostic Panel: Confusion Matrix / Error Breakdown (4 Cols) */}
        <div className="lg:col-span-4 bg-[#1A1A1A] text-white p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center space-x-2 text-[#E63946] mb-2">
              <Activity className="h-4 w-4" />
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] font-mono text-white">
                Diagnóstico de Error (Test Set)
              </h4>
            </div>
            <div className="text-xl font-serif font-light text-white">
              {selectedModel.name || selectedModel.modelName}
            </div>

            {selectedModel.confusionMatrix ? (
              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase text-white/50 border-b border-white/10 pb-1">
                  <span>Matriz de Confusión 2×2</span>
                  <span>n = {mlSummary.testRowCount}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs">
                  <div className="bg-white/10 p-3 border border-white/15">
                    <div className="text-[10px] text-emerald-400 font-bold">VP (Verdaderos Pos)</div>
                    <div className="text-2xl font-bold text-white mt-1">
                      {selectedModel.confusionMatrix.matrix[0]?.[0] || 0}
                    </div>
                  </div>
                  <div className="bg-white/5 p-3 border border-white/10">
                    <div className="text-[10px] text-[#E63946]">FP (Falsos Pos)</div>
                    <div className="text-2xl font-bold text-[#E63946] mt-1">
                      {selectedModel.confusionMatrix.matrix[0]?.[1] || 0}
                    </div>
                  </div>
                  <div className="bg-white/5 p-3 border border-white/10">
                    <div className="text-[10px] text-[#E63946]">FN (Falsos Neg)</div>
                    <div className="text-2xl font-bold text-[#E63946] mt-1">
                      {selectedModel.confusionMatrix.matrix[1]?.[0] || 0}
                    </div>
                  </div>
                  <div className="bg-white/10 p-3 border border-white/15">
                    <div className="text-[10px] text-emerald-400 font-bold">VN (Verdaderos Neg)</div>
                    <div className="text-2xl font-bold text-white mt-1">
                      {selectedModel.confusionMatrix.matrix[1]?.[1] || 0}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-white/70 space-y-1 pt-2">
                  <div className="flex justify-between">
                    <span>Precisión (VP / VP+FP):</span>
                    <strong className="text-white">{(selectedModel.metrics.precision ?? 0).toFixed(3)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Sensibilidad (VP / VP+FN):</span>
                    <strong className="text-white">{(selectedModel.metrics.recall ?? 0).toFixed(3)}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-3 font-mono text-xs">
                <div className="text-[10px] uppercase text-white/50 border-b border-white/10 pb-1">
                  Métricas de Residuales
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/50">R² Score:</span>
                  <span className="text-white font-bold text-sm">{selectedModel.metrics.r2?.toFixed(3)}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/50">RMSE:</span>
                  <span className="text-white">{selectedModel.metrics.rmse?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/50">MAE:</span>
                  <span className="text-white">{selectedModel.metrics.mae?.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/10 text-[11px] font-mono text-white/70 leading-relaxed">
            {selectedModel.paretoVerdict || selectedModel.businessInterpretation || 'Rendimiento evaluado con validación cruzada y partición de prueba no contaminada.'}
          </div>
        </div>
      </div>

      {/* 4. UNSUPERVISED LEARNING: K-MEANS & PCA */}
      {mlSummary.unsupervised && (
        <div className="bg-white p-6 sm:p-8 border border-black/10 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-black/10 pb-4">
            <div>
              <h4 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">
                Modelado No Supervisado: K-Means Clustering & PCA
              </h4>
              <p className="text-xs font-serif italic text-gray-500 mt-0.5">
                Segmentación natural de perfiles y reducción de dimensionalidad con retención de varianza ≥ 80%.
              </p>
            </div>
            <span className="text-xs font-mono text-gray-500 bg-[#FAF8F5] px-3 py-1 border border-black/10">
              k = {mlSummary.unsupervised.kmeans?.optimalK || 3} Clusters Óptimos (Silhouette)
            </span>
          </div>

          {mlSummary.unsupervised.kmeans?.clusterProfiles && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mlSummary.unsupervised.kmeans.clusterProfiles.map((cluster) => (
                <div key={cluster.clusterId} className="p-5 bg-[#FAF8F5] border border-black/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase bg-black text-white px-2 py-0.5">
                      Cluster #{cluster.clusterId + 1}
                    </span>
                    <span className="text-xs font-mono text-gray-600 font-semibold">
                      {cluster.size} casos ({cluster.percent}%)
                    </span>
                  </div>
                  <div className="text-sm font-serif font-bold text-[#1A1A1A]">
                    {cluster.summary}
                  </div>
                  <div className="text-[11px] font-mono text-gray-600 pt-2 border-t border-black/5">
                    {cluster.topFeatures ? (
                      <div>
                        Centroides: {Object.entries(cluster.topFeatures).slice(0, 2).map(([k, v]) => `${k}: ${typeof v === 'number' ? v.toFixed(2) : v}`).join(', ')}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-black/10">
        <div className="text-xs font-mono text-gray-500">
          Evaluación y validación: <span className="text-black font-bold">Split Test 30% Inmutable</span>
        </div>

        <button
          id="btn-proceed-to-report"
          onClick={onProceedToReport}
          disabled={isProcessing}
          className="flex items-center space-x-2 px-6 py-3 bg-[#1A1A1A] hover:bg-black active:bg-neutral-800 disabled:opacity-50 text-white font-mono text-xs uppercase tracking-widest transition-colors cursor-pointer shadow-sm"
        >
          <span>Proceder al Informe Final Ejecutivo (Capa 06)</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Helper Functions for Multi-Model Analysis & Comparison Formatting
// -------------------------------------------------------------

function getOptimalMetrics(models: MLModelEvaluation[], isClassification: boolean) {
  let maxF1 = -Infinity;
  let maxAccuracy = -Infinity;
  let maxPrecision = -Infinity;
  let maxRecall = -Infinity;
  let maxAuc = -Infinity;

  let maxR2 = -Infinity;
  let minRmse = Infinity;
  let minMae = Infinity;
  let minLatency = Infinity;

  models.forEach(m => {
    if (m.trainTimeMs < minLatency) minLatency = m.trainTimeMs;

    if (isClassification) {
      if ((m.metrics.f1Score ?? -Infinity) > maxF1) maxF1 = m.metrics.f1Score!;
      if ((m.metrics.accuracy ?? -Infinity) > maxAccuracy) maxAccuracy = m.metrics.accuracy!;
      if ((m.metrics.precision ?? -Infinity) > maxPrecision) maxPrecision = m.metrics.precision!;
      if ((m.metrics.recall ?? -Infinity) > maxRecall) maxRecall = m.metrics.recall!;
      const auc = m.metrics.aucRoc ?? m.metrics.rocAuc ?? -Infinity;
      if (auc > maxAuc) maxAuc = auc;
    } else {
      if ((m.metrics.r2 ?? -Infinity) > maxR2) maxR2 = m.metrics.r2!;
      if ((m.metrics.rmse ?? Infinity) < minRmse) minRmse = m.metrics.rmse!;
      if ((m.metrics.mae ?? Infinity) < minMae) minMae = m.metrics.mae!;
    }
  });

  return {
    maxF1,
    maxAccuracy,
    maxPrecision,
    maxRecall,
    maxAuc,
    maxR2,
    minRmse,
    minMae,
    minLatency
  };
}

function prepareComparisonChartData(models: MLModelEvaluation[], isClassification: boolean) {
  if (isClassification) {
    const metricsKeys = [
      { key: 'accuracy', label: 'Accuracy' },
      { key: 'f1Score', label: 'F1-Score' },
      { key: 'aucRoc', label: 'ROC-AUC' },
      { key: 'precision', label: 'Precisión' },
      { key: 'recall', label: 'Recall' },
    ];

    return metricsKeys.map(m => {
      const row: Record<string, any> = { metricName: m.label };
      models.forEach(mod => {
        const name = mod.name || mod.modelName || 'Modelo';
        const val = m.key === 'aucRoc' 
          ? (mod.metrics.aucRoc ?? mod.metrics.rocAuc ?? 0)
          : ((mod.metrics as any)[m.key] ?? 0);
        row[name] = val;
      });
      return row;
    });
  } else {
    const metricsKeys = [
      { key: 'r2', label: 'R² (Varianza)' },
      { key: 'normalizedRmse', label: 'Ajuste RMSE (1-Norm)' },
      { key: 'normalizedMae', label: 'Ajuste MAE (1-Norm)' },
    ];

    // Compute max RMSE and MAE for normalization
    const maxRmse = Math.max(...models.map(m => m.metrics.rmse || 1), 1);
    const maxMae = Math.max(...models.map(m => m.metrics.mae || 1), 1);

    return metricsKeys.map(m => {
      const row: Record<string, any> = { metricName: m.label };
      models.forEach(mod => {
        const name = mod.name || mod.modelName || 'Modelo';
        if (m.key === 'r2') {
          row[name] = Math.max(0, mod.metrics.r2 ?? 0);
        } else if (m.key === 'normalizedRmse') {
          row[name] = Math.max(0, 1 - (mod.metrics.rmse || 0) / (maxRmse * 1.2));
        } else if (m.key === 'normalizedMae') {
          row[name] = Math.max(0, 1 - (mod.metrics.mae || 0) / (maxMae * 1.2));
        }
      });
      return row;
    });
  }
}

function getInterpretabilityLabel(modelType: string): { label: string; badgeClass: string } {
  switch (modelType) {
    case 'linear':
      return { 
        label: 'Caja Blanca (Alta)', 
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200' 
      };
    case 'tree':
      return { 
        label: 'Intermedia (Árbol)', 
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-200' 
      };
    case 'ensemble':
      return { 
        label: 'Caja Gris (Ensamble)', 
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' 
      };
    case 'knn_svm':
      return { 
        label: 'No Paramétrico (Media)', 
        badgeClass: 'bg-purple-50 text-purple-800 border-purple-200' 
      };
    default:
      return { 
        label: 'Media', 
        badgeClass: 'bg-gray-100 text-gray-700 border-gray-300' 
      };
  }
}
