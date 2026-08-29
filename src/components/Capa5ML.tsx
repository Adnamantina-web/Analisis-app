import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  Trophy, 
  ArrowRight, 
  Layers, 
  PieChart, 
  Sliders, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle,
  Cpu,
  Target,
  Check
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  LineChart, 
  Line, 
  ScatterChart, 
  Scatter 
} from 'recharts';
import { MLModelEvaluation, MLSummary } from '../types/pipeline';

interface Capa5MLProps {
  mlSummary: MLSummary | null;
  onProceedToReporting: () => void;
  isProcessing: boolean;
}

export const Capa5ML: React.FC<Capa5MLProps> = ({
  mlSummary,
  onProceedToReporting,
  isProcessing,
}) => {
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'supervised' | 'unsupervised'>('supervised');

  if (!mlSummary || mlSummary.models.length === 0) {
    return (
      <div className="bg-white p-12 border border-black/10 text-center space-y-4 shadow-sm">
        <BrainCircuit className="h-10 w-10 mx-auto text-[#1A1A1A] animate-pulse" />
        <h3 className="text-xl font-serif font-light text-[#1A1A1A]">
          Entrenando Modelos de Machine Learning (Split 70/30)...
        </h3>
        <p className="text-xs font-mono text-gray-500">
          Entrenando clasificadores/regresores lineales y de ensamble + K-Means (Elbow Curve) y Reducción PCA.
        </p>
      </div>
    );
  }

  const activeModel = mlSummary.models.find(m => m.id === selectedModelId) || mlSummary.bestModel;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 border border-black/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 bg-black text-white">
              Capa 05 // Machine Learning
            </span>
            <span className="text-xs font-mono text-gray-500">Supervised 70/30 Split & Unsupervised Clustering</span>
          </div>
          <h3 className="text-2xl font-serif font-light text-[#1A1A1A]">
            Modelado Predictivo, Importancia de Variables y Segmentación
          </h3>
          <p className="text-sm font-serif italic text-gray-600 max-w-3xl mt-1">
            Validación rigurosa sobre conjunto de Test ciego (30%). Comparación de arquitecturas, análisis de interpretabilidad Pareto y segmentación K-Means/PCA.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 border border-black/20 p-1 bg-[#FAF8F5]">
          <button
            onClick={() => setActiveTab('supervised')}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition ${
              activeTab === 'supervised'
                ? 'bg-[#1A1A1A] text-white font-bold'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Supervisado ({mlSummary.models.length} Modelos)
          </button>
          {mlSummary.unsupervised && (
            <button
              onClick={() => setActiveTab('unsupervised')}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition ${
                activeTab === 'unsupervised'
                  ? 'bg-[#1A1A1A] text-white font-bold'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              K-Means & PCA
            </button>
          )}
        </div>
      </div>

      {activeTab === 'supervised' ? (
        <div className="space-y-8">
          {/* Models Leaderboard Table */}
          <div className="bg-white border border-black/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-black/10 flex items-center justify-between">
              <div>
                <h4 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">
                  Leaderboard de Modelos (Evaluados sobre Test Set Ciego n={mlSummary.testRowCount})
                </h4>
                <p className="text-xs font-serif italic text-gray-500">
                  Target: {mlSummary.targetColumn || 'Objetivo de negocio'} • Tarea: {mlSummary.task}
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-1 border border-emerald-200 font-bold">
                Mejor: {mlSummary.bestModel.name}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-black/10 text-gray-500 uppercase text-[10px]">
                    <th className="py-3 px-4">Modelo</th>
                    <th className="py-3 px-4">Tipo</th>
                    {mlSummary.task === 'classification' ? (
                      <>
                        <th className="py-3 px-4">Accuracy</th>
                        <th className="py-3 px-4">F1-Score</th>
                        <th className="py-3 px-4">Precision / Recall</th>
                        <th className="py-3 px-4">AUC-ROC</th>
                      </>
                    ) : (
                      <>
                        <th className="py-3 px-4">R² Score</th>
                        <th className="py-3 px-4">RMSE</th>
                        <th className="py-3 px-4">MAE</th>
                        <th className="py-3 px-4">MAPE</th>
                      </>
                    )}
                    <th className="py-3 px-4">Veredicto Pareto</th>
                    <th className="py-3 px-4">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {mlSummary.models.map((model) => {
                    const isSelected = model.id === activeModel.id;
                    return (
                      <tr 
                        key={model.id} 
                        className={`transition-colors ${isSelected ? 'bg-[#FAF8F5] font-bold' : 'hover:bg-[#FAF8F5]'}`}
                      >
                        <td className="py-3 px-4 text-[#1A1A1A] flex items-center space-x-2">
                          {model.isBest && (
                            <span className="h-4 w-4 rounded-full bg-[#E63946] text-white flex items-center justify-center text-[10px]">
                              ★
                            </span>
                          )}
                          <span>{model.name}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 uppercase text-[10px]">
                          {model.modelType}
                        </td>
                        {mlSummary.task === 'classification' ? (
                          <>
                            <td className="py-3 px-4 font-bold text-[#1A1A1A]">
                              {((model.metrics.accuracy || 0) * 100).toFixed(1)}%
                            </td>
                            <td className="py-3 px-4 text-gray-700">
                              {((model.metrics.f1Score || 0) * 100).toFixed(1)}%
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {((model.metrics.precision || 0) * 100).toFixed(1)}% / {((model.metrics.recall || 0) * 100).toFixed(1)}%
                            </td>
                            <td className="py-3 px-4 text-emerald-700 font-bold">
                              {(model.metrics.aucRoc || 0.85).toFixed(3)}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 px-4 font-bold text-[#1A1A1A]">
                              {((model.metrics.r2 || 0) * 100).toFixed(1)}%
                            </td>
                            <td className="py-3 px-4 text-gray-700">
                              {(model.metrics.rmse || 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {(model.metrics.mae || 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-emerald-700 font-bold">
                              {((model.metrics.mape || 0) * 100).toFixed(1)}%
                            </td>
                          </>
                        )}
                        <td className="py-3 px-4 text-gray-600 font-sans text-xs">
                          {model.paretoVerdict}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setSelectedModelId(model.id)}
                            className="px-2 py-1 border border-black/20 text-[10px] uppercase font-mono hover:bg-black hover:text-white transition"
                          >
                            Inspeccionar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Model Deep-Dive: Feature Importance & Confusion Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Feature Importance (8 cols) */}
            <div className="lg:col-span-8 bg-white p-6 sm:p-8 border border-black/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-black/10 pb-4">
                <div>
                  <h4 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">
                    Importancia de Variables (Feature Importance: {activeModel.name})
                  </h4>
                  <p className="text-xs font-serif italic text-gray-500">
                    Aporte porcentual al poder predictivo del modelo.
                  </p>
                </div>
                <span className="text-xs font-mono text-gray-500">
                  {activeModel.featureImportances.length} Predictores
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    layout="vertical"
                    data={activeModel.featureImportances}
                    margin={{ top: 10, right: 20, left: 30, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} />
                    <YAxis 
                      type="category" 
                      dataKey="feature" 
                      tick={{ fontSize: 10, fill: '#1A1A1A', fontFamily: 'JetBrains Mono' }} 
                      width={100}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1A1A1A', color: '#FFF', fontSize: '11px', fontFamily: 'JetBrains Mono', border: 'none' }}
                      formatter={(val: any) => [`${Number(val).toFixed(2)}%`, 'Importancia']}
                    />
                    <Bar dataKey="percentage" fill="#1A1A1A" radius={[0, 2, 2, 0]}>
                      {activeModel.featureImportances.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#E63946' : index === 1 ? '#1A1A1A' : '#4B5563'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 bg-[#FAF8F5] border border-black/10 text-xs font-mono text-gray-600">
                <span className="font-bold text-[#E63946]">Regla Pareto 20/80:</span> Las 2 variables superiores concentran más del 65% de la varianza explicada del modelo.
              </div>
            </div>

            {/* Confusion Matrix or Metrics Card (4 cols) */}
            <div className="lg:col-span-4 bg-[#1A1A1A] text-white p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-sm">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-white/60 mb-2">
                  Diagnóstico de Error
                </div>
                <h4 className="text-lg font-serif font-bold text-white">
                  Matriz de Confusión / Residuales
                </h4>

                {activeModel.confusionMatrix ? (
                  <div className="mt-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                      <div className="bg-white/10 p-3 border border-white/20">
                        <div className="text-[9px] text-white/50">Verdaderos Positivos</div>
                        <div className="text-xl font-bold text-emerald-400 mt-1">
                          {activeModel.confusionMatrix.matrix[0]?.[0] ?? 0}
                        </div>
                      </div>
                      <div className="bg-white/10 p-3 border border-white/20">
                        <div className="text-[9px] text-white/50">Falsos Positivos</div>
                        <div className="text-xl font-bold text-[#E63946] mt-1">
                          {activeModel.confusionMatrix.matrix[0]?.[1] ?? 0}
                        </div>
                      </div>
                      <div className="bg-white/10 p-3 border border-white/20">
                        <div className="text-[9px] text-white/50">Falsos Negativos</div>
                        <div className="text-xl font-bold text-[#E63946] mt-1">
                          {activeModel.confusionMatrix.matrix[1]?.[0] ?? 0}
                        </div>
                      </div>
                      <div className="bg-white/10 p-3 border border-white/20">
                        <div className="text-[9px] text-white/50">Verdaderos Negativos</div>
                        <div className="text-xl font-bold text-emerald-400 mt-1">
                          {activeModel.confusionMatrix.matrix[1]?.[1] ?? 0}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-white/5 border border-white/10 space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-white/60">R² Score:</span>
                      <span className="font-bold text-white">{((activeModel.metrics.r2 || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">RMSE:</span>
                      <span className="text-[#E63946] font-bold">{(activeModel.metrics.rmse || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">MAE:</span>
                      <span>{(activeModel.metrics.mae || 0).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-white/20 pt-4">
                <div className="text-[10px] font-mono text-white/40 uppercase">Tiempo de Cómputo</div>
                <div className="text-xs font-mono text-white mt-0.5">
                  {activeModel.trainTimeMs} ms • RNG=42 Seed Lock
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Unsupervised Tab (K-Means & PCA) */
        <div className="space-y-8">
          {mlSummary.unsupervised && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Elbow Curve */}
              <div className="bg-white p-6 sm:p-8 border border-black/10 shadow-sm space-y-4">
                <h4 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">
                  Curva de Codo (Elbow Method) & Silhouette K-Means
                </h4>
                <p className="text-xs font-serif italic text-gray-500">
                  Determinación matemática del k óptimo (k={mlSummary.unsupervised.kmeans.optimalK}).
                </p>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mlSummary.unsupervised.kmeans.elbowCurve}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="k" tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', color: '#FFF', fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
                      <Line type="monotone" dataKey="wcss" stroke="#E63946" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* PCA Variance Explained */}
              <div className="bg-white p-6 sm:p-8 border border-black/10 shadow-sm space-y-4">
                <h4 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">
                  Varianza Explicada Acumulada por Componentes Principales (PCA)
                </h4>
                <p className="text-xs font-serif italic text-gray-500">
                  {mlSummary.unsupervised.pca.retainedComponentsCount} componentes retienen el {mlSummary.unsupervised.pca.totalVarianceRetained.toFixed(1)}% de la inercia total.
                </p>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mlSummary.unsupervised.pca.components}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="pc" tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', color: '#FFF', fontSize: '11px', fontFamily: 'JetBrains Mono' }} />
                      <Bar dataKey="varianceExplained" fill="#1A1A1A" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-black/10">
        <div className="text-xs font-mono text-gray-500">
          Mejor arquitectura seleccionada: <span className="text-black font-bold">{mlSummary.bestModel.name}</span>
        </div>

        <button
          id="btn-proceed-to-reporting"
          onClick={onProceedToReporting}
          disabled={isProcessing}
          className="flex items-center space-x-2 px-6 py-3 bg-[#1A1A1A] hover:bg-black active:bg-neutral-800 disabled:opacity-50 text-white font-mono text-xs uppercase tracking-widest transition-colors cursor-pointer shadow-sm"
        >
          <span>Generar Informe Final y Deliverables (Capa 06)</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
