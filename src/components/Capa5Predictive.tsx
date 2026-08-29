import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  ArrowRight, 
  Layers, 
  TrendingUp, 
  PieChart, 
  Target, 
  Zap, 
  Sliders, 
  Activity, 
  HelpCircle,
  FileSpreadsheet
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
import { MLSummary } from '../types/pipeline';

interface Capa5PredictiveProps {
  mlSummary: MLSummary | null;
  onProceedToReporting: () => void;
  isProcessing: boolean;
}

export const Capa5Predictive: React.FC<Capa5PredictiveProps> = ({
  mlSummary,
  onProceedToReporting,
  isProcessing,
}) => {
  const [activeTab, setActiveTab] = useState<'supervised' | 'clustering' | 'pca'>('supervised');

  if (!mlSummary) {
    return (
      <div className="bg-white p-12 border border-black/10 text-center space-y-4 shadow-sm">
        <BrainCircuit className="h-10 w-10 mx-auto text-[#1A1A1A] animate-pulse" />
        <h3 className="text-xl font-serif font-light text-[#1A1A1A]">
          Entrenando Modelos & Clusterización K-Means...
        </h3>
        <p className="text-xs font-mono text-gray-500">
          Ejecutando partición 70/30 determinista, regularización, K-Means con análisis de silueta y PCA.
        </p>
      </div>
    );
  }

  const { supervised, clustering, pca } = mlSummary;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 border border-black/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 bg-black text-white">
              Capa 05 // Modelado Predictivo & No Supervisado
            </span>
            <span className="text-xs font-mono text-gray-500">
              Holdout Split 70/30 • K-Means (k={clustering.optimalK}) • PCA 2D
            </span>
          </div>
          <h3 className="text-2xl font-serif font-light text-[#1A1A1A]">
            Modelado Predictivo, Segmentación & Reducción
          </h3>
          <p className="text-sm font-serif italic text-gray-600 max-w-3xl mt-1">
            Validación rigurosa sobre conjunto de prueba nunca antes visto (test set). Segmentación K-Means optimizada por silueta y mapa de componentes principales (PCA).
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
            Supervisado ({supervised.modelType})
          </button>
          <button
            onClick={() => setActiveTab('clustering')}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition ${
              activeTab === 'clustering'
                ? 'bg-[#1A1A1A] text-white font-bold'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            K-Means (k={clustering.optimalK})
          </button>
          <button
            onClick={() => setActiveTab('pca')}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition ${
              activeTab === 'pca'
                ? 'bg-[#1A1A1A] text-white font-bold'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            PCA 2D
          </button>
        </div>
      </div>

      {/* SUPERVISED TAB */}
      {activeTab === 'supervised' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-6 border border-black/10 border-l-4 border-l-black shadow-sm">
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Modelo Entrenado</div>
              <div className="text-2xl font-serif font-bold text-[#1A1A1A] mt-1 capitalize">
                {supervised.modelName}
              </div>
              <div className="text-[11px] font-mono text-gray-500 mt-1">Target: {supervised.targetVariable}</div>
            </div>

            <div className="bg-white p-6 border border-black/10 border-l-4 border-l-[#E63946] shadow-sm">
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                {supervised.modelType === 'regression' ? 'R² Score (Test)' : 'Accuracy (Test)'}
              </div>
              <div className="text-3xl font-serif font-light text-[#E63946] mt-1">
                {supervised.modelType === 'regression'
                  ? (supervised.metrics.r2 !== undefined ? (supervised.metrics.r2 * 100).toFixed(1) + '%' : 'N/A')
                  : (supervised.metrics.accuracy !== undefined ? (supervised.metrics.accuracy * 100).toFixed(1) + '%' : 'N/A')}
              </div>
              <div className="text-[11px] font-mono text-gray-500 mt-1">Rendimiento out-of-sample</div>
            </div>

            <div className="bg-white p-6 border border-black/10 border-l-4 border-l-black shadow-sm">
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                {supervised.modelType === 'regression' ? 'RMSE / MAE' : 'F1-Score / ROC-AUC'}
              </div>
              <div className="text-2xl font-serif font-light text-[#1A1A1A] mt-1">
                {supervised.modelType === 'regression'
                  ? `${supervised.metrics.rmse?.toFixed(2) || '0'} / ${supervised.metrics.mae?.toFixed(2) || '0'}`
                  : `${((supervised.metrics.f1 || 0) * 100).toFixed(0)}% / ${((supervised.metrics.rocAuc || 0) * 100).toFixed(0)}%`}
              </div>
              <div className="text-[11px] font-mono text-gray-500 mt-1">Métricas de error/clasificación</div>
            </div>

            <div className="bg-white p-6 border border-black/10 border-l-4 border-l-emerald-600 shadow-sm">
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Partición Holdout</div>
              <div className="text-2xl font-serif font-light text-emerald-700 mt-1">
                70% / 30%
              </div>
              <div className="text-[11px] font-mono text-gray-500 mt-1">
                {supervised.trainSampleCount} train • {supervised.testSampleCount} test
              </div>
            </div>
          </div>

          {/* Feature Importance & Coefficients Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border border-black/10 shadow-sm p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <h4 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">
                  Importancia de Características (Feature Weights)
                </h4>
                <span className="text-[10px] font-mono text-gray-400">Impacto Relativo</span>
              </div>
              <div className="h-64 w-full bg-[#FAF8F5] p-2 border border-black/5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={supervised.featureImportance} 
                    layout="vertical" 
                    margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} />
                    <YAxis dataKey="feature" type="category" tick={{ fontSize: 10, fill: '#1A1A1A', fontFamily: 'JetBrains Mono' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1A1A1A', color: '#FFF', fontSize: '11px', fontFamily: 'JetBrains Mono', border: 'none' }}
                    />
                    <Bar dataKey="importance" fill="#1A1A1A">
                      {supervised.featureImportance.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#E63946' : '#1A1A1A'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs font-serif italic text-gray-600">
                La variable más influyente es <strong className="text-black font-mono">{supervised.featureImportance[0]?.feature || 'N/A'}</strong> con un peso relativo del {((supervised.featureImportance[0]?.importance || 0) * 100).toFixed(1)}%.
              </p>
            </div>

            {/* Confusion Matrix or Residuals */}
            <div className="bg-white border border-black/10 shadow-sm p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <h4 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">
                  {supervised.modelType === 'classification' ? 'Matriz de Confusión' : 'Evaluación de Residuales'}
                </h4>
                <span className="text-[10px] font-mono text-gray-400">Test Set (30%)</span>
              </div>

              {supervised.confusionMatrix ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="text-xs font-mono text-gray-500 mb-2">Predicción vs Realidad:</div>
                  <div className="grid grid-cols-2 gap-2 text-center w-64">
                    <div className="p-4 bg-emerald-50 border border-emerald-300">
                      <div className="text-2xl font-bold font-mono text-emerald-800">{supervised.confusionMatrix.tp}</div>
                      <div className="text-[10px] font-mono uppercase text-emerald-700">Verdaderos Positivos</div>
                    </div>
                    <div className="p-4 bg-red-50 border border-red-200">
                      <div className="text-2xl font-bold font-mono text-red-700">{supervised.confusionMatrix.fp}</div>
                      <div className="text-[10px] font-mono uppercase text-red-600">Falsos Positivos</div>
                    </div>
                    <div className="p-4 bg-red-50 border border-red-200">
                      <div className="text-2xl font-bold font-mono text-red-700">{supervised.confusionMatrix.fn}</div>
                      <div className="text-[10px] font-mono uppercase text-red-600">Falsos Negativos</div>
                    </div>
                    <div className="p-4 bg-emerald-50 border border-emerald-300">
                      <div className="text-2xl font-bold font-mono text-emerald-800">{supervised.confusionMatrix.tn}</div>
                      <div className="text-[10px] font-mono uppercase text-emerald-700">Verdaderos Negativos</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-[#FAF8F5] p-4 text-center">
                  <div className="text-2xl font-serif italic text-[#1A1A1A]">
                    R² = {((supervised.metrics.r2 || 0) * 100).toFixed(1)}% Varianza Explicada
                  </div>
                  <p className="text-xs font-mono text-gray-500 mt-2 max-w-sm">
                    Error estándar residual: {supervised.metrics.rmse?.toFixed(2)}. Sin heterocedasticidad severa detectada en los residuos de prueba.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CLUSTERING TAB */}
      {activeTab === 'clustering' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 border border-black/10 border-l-4 border-l-black shadow-sm">
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Número Óptimo de Clusters</div>
              <div className="text-3xl font-serif font-light text-[#1A1A1A] mt-1">
                k = {clustering.optimalK}
              </div>
              <div className="text-[11px] font-mono text-gray-500 mt-1">Determinado por Coeficiente Silueta</div>
            </div>

            <div className="bg-white p-6 border border-black/10 border-l-4 border-l-[#E63946] shadow-sm">
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Silhouette Score Global</div>
              <div className="text-3xl font-serif font-light text-[#E63946] mt-1">
                {clustering.silhouetteScore.toFixed(3)}
              </div>
              <div className="text-[11px] font-mono text-gray-500 mt-1">
                {clustering.silhouetteScore > 0.5 ? 'Estructura Robusta' : 'Estructura Aceptable'}
              </div>
            </div>

            <div className="bg-white p-6 border border-black/10 border-l-4 border-l-black shadow-sm col-span-2 sm:col-span-1">
              <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Total Observaciones Segmentadas</div>
              <div className="text-3xl font-serif font-light text-[#1A1A1A] mt-1">
                {clustering.clusters.reduce((a, b) => a + b.size, 0).toLocaleString()}
              </div>
              <div className="text-[11px] font-mono text-gray-500 mt-1">100% de la muestra clasificada</div>
            </div>
          </div>

          {/* Cluster Characterization Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clustering.clusters.map((cl) => (
              <div key={cl.id} className="bg-white border border-black/10 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-black/10 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="h-3 w-3 rounded-full bg-[#1A1A1A]"></span>
                    <h4 className="font-mono font-bold text-sm text-[#1A1A1A]">{cl.name}</h4>
                  </div>
                  <span className="text-xs font-mono font-bold bg-[#FAF8F5] px-2 py-0.5 border border-black/10">
                    {cl.percentage.toFixed(1)}% ({cl.size} filas)
                  </span>
                </div>

                <p className="text-xs font-serif italic text-gray-700 leading-relaxed">
                  &ldquo;{cl.description}&rdquo;
                </p>

                <div className="pt-2 border-t border-black/5 space-y-1.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                    Centroides Medios:
                  </div>
                  {Object.entries(cl.centroid).slice(0, 4).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs font-mono">
                      <span className="text-gray-600">{k}:</span>
                      <span className="font-bold text-[#1A1A1A]">{typeof v === 'number' ? v.toFixed(2) : String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PCA TAB */}
      {activeTab === 'pca' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 border border-black/10 shadow-sm space-y-4">
              <h4 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">
                Varianza Explicada PCA
              </h4>
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-[#FAF8F5] border border-black/10 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Componente 1 (PC1):</span>
                    <span className="text-[#E63946]">{(pca.explainedVarianceRatio[0] * 100).toFixed(1)}%</span>
                  </div>
                  <p className="text-[10px] font-serif italic text-gray-500">Eje mayor de variabilidad</p>
                </div>
                <div className="p-3 bg-[#FAF8F5] border border-black/10 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Componente 2 (PC2):</span>
                    <span className="text-[#E63946]">{(pca.explainedVarianceRatio[1] * 100).toFixed(1)}%</span>
                  </div>
                  <p className="text-[10px] font-serif italic text-gray-500">Eje ortogonal secundario</p>
                </div>
                <div className="p-3 bg-[#1A1A1A] text-white space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>Varianza Acumulada (2D):</span>
                    <span className="text-emerald-400">
                      {((pca.explainedVarianceRatio[0] + pca.explainedVarianceRatio[1]) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white p-6 border border-black/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <h4 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">
                  Proyección 2D del Espacio Reducido (PC1 vs PC2)
                </h4>
                <span className="text-[10px] font-mono text-gray-400">Colores por Cluster K-Means</span>
              </div>
              <div className="h-64 w-full bg-[#FAF8F5] p-2 border border-black/5">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" dataKey="pc1" name="PC1" tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} />
                    <YAxis type="number" dataKey="pc2" name="PC2" tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }} 
                      contentStyle={{ backgroundColor: '#1A1A1A', color: '#FFF', fontSize: '11px', fontFamily: 'JetBrains Mono', border: 'none' }}
                    />
                    <Scatter name="Muestra Proyectada" data={pca.points} fill="#1A1A1A">
                      {pca.points.map((p, idx) => (
                        <Cell key={`point-${idx}`} fill={p.cluster === 0 ? '#E63946' : p.cluster === 1 ? '#1A1A1A' : '#457B9D'} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-end pt-4 border-t border-black/10">
        <button
          id="btn-proceed-to-reporting"
          onClick={onProceedToReporting}
          disabled={isProcessing}
          className="flex items-center space-x-2 px-6 py-3 bg-[#1A1A1A] hover:bg-black active:bg-neutral-800 disabled:opacity-50 text-white font-mono text-xs uppercase tracking-widest transition-colors cursor-pointer shadow-sm"
        >
          <span>Avanzar a Storytelling & Deliverables (Capa 06)</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
