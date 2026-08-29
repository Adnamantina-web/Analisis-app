import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Target, 
  TrendingUp, 
  Layers, 
  Sparkles, 
  CheckCircle, 
  ArrowRight, 
  BarChart2, 
  Activity, 
  Shuffle, 
  PieChart 
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
  Cell 
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

  if (!mlSummary) {
    return (
      <div className="bg-white p-12 border border-black/10 text-center font-serif">
        <p className="text-gray-500 italic">Entrenando modelos supervisados (70/30 split) y clustering no supervisado...</p>
      </div>
    );
  }

  const selectedModel = mlSummary.models.find(m => m.modelId === selectedModelId) || mlSummary.bestModel;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 border border-black/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 bg-black text-white">
              Capa 05 // Machine Learning
            </span>
            <span className="text-xs font-mono text-gray-500">Supervisado 70/30 & No Supervisado (K-Means / PCA)</span>
          </div>
          <h3 className="text-2xl font-serif font-light text-[#1A1A1A]">
            Modelado Predictivo & Segmentación de Patrones
          </h3>
          <p className="text-sm font-serif italic text-gray-600 max-w-3xl mt-1">
            Evaluación rigurosa sobre partición Test 30% nunca antes vista. Comparación entre modelos lineales, árboles y ensamblados con ranking de importancia de variables explicativas.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Target Analizado</div>
          <div className="text-xs font-mono font-bold text-[#E63946]">
            {mlSummary.targetVariable} ({mlSummary.task.toUpperCase()})
          </div>
        </div>
      </div>

      {/* Model Benchmark Table */}
      <div className="bg-white border border-black/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">
              Benchmark Comparativo de Modelos (Evaluado en Partición Test 30%)
            </h4>
            <p className="text-xs font-serif italic text-gray-500">
              Split determinista con semilla aleatoria inmutable.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 font-bold">
            Modelo Ganador: {mlSummary.bestModel.modelName}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-black/10 text-gray-500 uppercase font-mono text-[10px] tracking-wider">
                <th className="py-3 px-4">Modelo</th>
                <th className="py-3 px-4">Familia Algorítmica</th>
                {mlSummary.task === 'classification' ? (
                  <>
                    <th className="py-3 px-4">Accuracy</th>
                    <th className="py-3 px-4">F1-Score</th>
                    <th className="py-3 px-4">ROC-AUC</th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-4">R² (Varianza)</th>
                    <th className="py-3 px-4">RMSE</th>
                    <th className="py-3 px-4">MAE</th>
                  </>
                )}
                <th className="py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {mlSummary.models.map((mod) => {
                const isBest = mod.modelId === mlSummary.bestModel.modelId;
                const isSelected = mod.modelId === selectedModel.modelId;
                return (
                  <tr
                    key={mod.modelId}
                    onClick={() => setSelectedModelId(mod.modelId)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#FAF8F5] font-bold' : 'hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-[#1A1A1A]">
                      {mod.modelName}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-500">
                      {mod.algorithm}
                    </td>
                    {mlSummary.task === 'classification' ? (
                      <>
                        <td className="py-3 px-4 font-mono text-gray-700">
                          {((mod.metrics.accuracy || 0) * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 font-mono text-[#1A1A1A]">
                          {mod.metrics.f1Score?.toFixed(3) || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-700">
                          {mod.metrics.rocAuc?.toFixed(3) || '—'}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-4 font-mono text-[#1A1A1A]">
                          R² = {mod.metrics.r2?.toFixed(3) || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-700">
                          {mod.metrics.rmse?.toFixed(2) || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-700">
                          {mod.metrics.mae?.toFixed(2) || '—'}
                        </td>
                      </>
                    )}
                    <td className="py-3 px-4">
                      {isBest ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#E63946] text-white rounded">
                          BEST MODEL
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-gray-400">
                          Evaluado
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Model Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Feature Importance (8 Cols) */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 border border-black/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-black/10 pb-4">
            <div>
              <h4 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">
                Importancia de Variables Explicativas (Feature Importance)
              </h4>
              <p className="text-xs font-serif italic text-gray-500">
                Aporte relativo de cada predictor al rendimiento de {selectedModel.modelName}.
              </p>
            </div>
            <span className="text-xs font-mono text-gray-400">
              Pareto Weights
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={selectedModel.featureImportance.slice(0, 8)}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="2 2" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fontFamily: 'monospace' }} domain={[0, 'dataMax + 0.05']} />
                <YAxis dataKey="feature" type="category" tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#1A1A1A' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', color: '#FFFFFF', border: 'none', fontFamily: 'monospace', fontSize: '11px' }}
                />
                <Bar dataKey="importance" fill="#1A1A1A">
                  {selectedModel.featureImportance.slice(0, 8).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#E63946' : '#1A1A1A'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="border-l-4 border-l-[#E63946] pl-4 pt-2">
            <div className="text-[10px] font-mono uppercase text-gray-500">Factor de Mayor Impacto</div>
            <p className="text-sm font-serif italic text-[#1A1A1A]">
              La variable &ldquo;{selectedModel.featureImportance[0]?.feature}&rdquo; domina con el {((selectedModel.featureImportance[0]?.importance || 0) * 100).toFixed(1)}% de peso explicativo.
            </p>
          </div>
        </div>

        {/* Confusion Matrix / Diagnostics (4 Cols) */}
        <div className="lg:col-span-4 bg-[#1A1A1A] text-white p-6 sm:p-8 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-[#E63946] mb-2">
              <Activity className="h-4 w-4" />
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] font-mono text-white">
                Diagnóstico de Error
              </h4>
            </div>
            <div className="text-2xl font-serif font-light">
              {selectedModel.modelName}
            </div>

            {selectedModel.confusionMatrix ? (
              <div className="mt-6 space-y-3">
                <div className="text-[10px] font-mono uppercase text-white/50">Matriz de Confusión (Test)</div>
                <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs">
                  <div className="bg-white/10 p-3 border border-white/10">
                    <div className="text-[10px] text-white/40">VP (Verdadero Pos)</div>
                    <div className="text-xl font-bold text-white mt-1">
                      {selectedModel.confusionMatrix.matrix[0]?.[0] || 0}
                    </div>
                  </div>
                  <div className="bg-white/5 p-3 border border-white/10">
                    <div className="text-[10px] text-white/40">FP (Falso Pos)</div>
                    <div className="text-xl font-bold text-[#E63946] mt-1">
                      {selectedModel.confusionMatrix.matrix[0]?.[1] || 0}
                    </div>
                  </div>
                  <div className="bg-white/5 p-3 border border-white/10">
                    <div className="text-[10px] text-white/40">FN (Falso Neg)</div>
                    <div className="text-xl font-bold text-[#E63946] mt-1">
                      {selectedModel.confusionMatrix.matrix[1]?.[0] || 0}
                    </div>
                  </div>
                  <div className="bg-white/10 p-3 border border-white/10">
                    <div className="text-[10px] text-white/40">VN (Verdadero Neg)</div>
                    <div className="text-xl font-bold text-white mt-1">
                      {selectedModel.confusionMatrix.matrix[1]?.[1] || 0}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/50">R² Score:</span>
                  <span className="text-white font-bold">{selectedModel.metrics.r2?.toFixed(3)}</span>
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

          <div className="pt-4 border-t border-white/10 text-[11px] font-mono text-white/60">
            {selectedModel.businessInterpretation}
          </div>
        </div>
      </div>

      {/* Unsupervised Learning: K-Means & PCA */}
      {mlSummary.unsupervised && (
        <div className="bg-white p-6 sm:p-8 border border-black/10 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-black/10 pb-4">
            <div>
              <h4 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">
                Modelado No Supervisado: K-Means Clustering & PCA
              </h4>
              <p className="text-xs font-serif italic text-gray-500">
                Segmentación atómica de perfiles y reducción dimensional reteniendo el {((mlSummary.unsupervised.pca.cumulativeVariance[1] || 0.8) * 100).toFixed(0)}% de varianza explicada.
              </p>
            </div>
            <span className="text-xs font-mono text-gray-500">
              k = {mlSummary.unsupervised.kMeans.kOptimal} Clusters Óptimos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mlSummary.unsupervised.kMeans.clusterProfiles.map((cluster) => (
              <div key={cluster.clusterId} className="p-5 bg-[#FAF8F5] border border-black/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase bg-black text-white px-2 py-0.5">
                    Cluster #{cluster.clusterId + 1}
                  </span>
                  <span className="text-xs font-mono text-gray-600">
                    {cluster.size} casos ({cluster.percentage}%)
                  </span>
                </div>
                <div className="text-sm font-serif font-bold text-[#1A1A1A]">
                  {cluster.dominantCharacteristics}
                </div>
                <div className="text-[11px] font-mono text-gray-600 pt-2 border-t border-black/5">
                  Distancia al Centroide: {cluster.centroidDist.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-end pt-4">
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
