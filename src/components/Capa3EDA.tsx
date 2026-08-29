import React, { useState } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  Grid, 
  Layers, 
  Info, 
  ArrowRight, 
  Flame, 
  Compass, 
  FileText,
  Maximize2,
  X,
  Target,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Filter,
  ShieldAlert,
  Sliders,
  Activity
} from 'lucide-react';
import { 
  ComposedChart,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  ScatterChart, 
  Scatter, 
  Line, 
  ReferenceLine,
  Legend
} from 'recharts';
import { EDAChart, EDASummary, EDAOutlierFeature } from '../types/pipeline';

interface Capa3EDAProps {
  edaSummary: EDASummary | null;
  onProceedToInference: () => void;
  isProcessing: boolean;
  scopeLevel: 'descriptive' | 'inferential' | 'predictive';
}

export const Capa3EDA: React.FC<Capa3EDAProps> = ({
  edaSummary,
  onProceedToInference,
  isProcessing,
  scopeLevel,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'univariate' | 'multivariate'>('all');
  const [expandedChart, setExpandedChart] = useState<EDAChart | null>(null);
  const [outlierMode, setOutlierMode] = useState<'highlight' | 'hide' | 'normal'>('highlight');
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);

  if (!edaSummary) {
    return (
      <div className="bg-white p-12 border border-black/10 text-center space-y-4 shadow-sm">
        <BarChart2 className="h-10 w-10 mx-auto text-[#1A1A1A] animate-pulse" />
        <h3 className="text-xl font-serif font-light text-[#1A1A1A]">
          Generando Suite Visual Pareto 20/80...
        </h3>
        <p className="text-xs font-mono text-gray-500">
          Extrayendo distribuciones empíricas KDE, matrices de covarianza, curvas de Lorenz y detección estadística de valores atípicos.
        </p>
      </div>
    );
  }

  const filteredCharts = edaSummary.charts.filter(c => 
    activeTab === 'all' ? true : c.layer === activeTab
  );

  const totalOutliers = edaSummary.totalOutliersDetected ?? 
    edaSummary.charts.reduce((sum, c) => sum + (c.outlierCount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 border border-black/10 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 bg-black text-white">
                Capa 03 // EDA Visual
              </span>
              <span className="text-xs font-mono text-gray-500">Suite Visual Pareto 20/80 & Control de Outliers</span>
            </div>
            <h3 className="text-2xl font-serif font-light text-[#1A1A1A]">
              Suite de Gráficos de Alto Valor Informativo
            </h3>
            <p className="text-sm font-serif italic text-gray-600 max-w-3xl mt-1">
              Figuras estadísticas de máxima capacidad discriminante con soporte dinámico para resaltar u ocultar valores atípicos (outliers) mediante el criterio Tukey IQR y Z-Score.
            </p>
          </div>

          {/* Layer Filter Tabs */}
          <div className="flex items-center space-x-1 border border-black/20 p-1 bg-[#FAF8F5]">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#1A1A1A] text-white font-bold'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Todos ({edaSummary.charts.length})
            </button>
            <button
              onClick={() => setActiveTab('univariate')}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition cursor-pointer ${
                activeTab === 'univariate'
                  ? 'bg-[#1A1A1A] text-white font-bold'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Univariado ({edaSummary.charts.filter(c => c.layer === 'univariate').length})
            </button>
            <button
              onClick={() => setActiveTab('multivariate')}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition cursor-pointer ${
                activeTab === 'multivariate'
                  ? 'bg-[#1A1A1A] text-white font-bold'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Multivariado ({edaSummary.charts.filter(c => c.layer === 'multivariate').length})
            </button>
          </div>
        </div>

        {/* Outlier Mode Toggle Control Strip */}
        <div className="pt-4 border-t border-black/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#FAF8F5] p-3.5 border border-black/5">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-[#1A1A1A]">
              <Sliders className="h-4 w-4 text-[#E63946]" />
              <span>Control de Outliers:</span>
            </div>
            {totalOutliers > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-semibold">
                <AlertTriangle className="h-3 w-3 text-amber-700" />
                {totalOutliers} outliers detectados en los datos
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                Distribución sin outliers severos
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center border border-black/20 bg-white p-0.5 shadow-xs">
              <button
                id="btn-outlier-highlight"
                onClick={() => setOutlierMode('highlight')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition cursor-pointer ${
                  outlierMode === 'highlight'
                    ? 'bg-[#E63946] text-white font-bold shadow-xs'
                    : 'text-gray-600 hover:text-black'
                }`}
                title="Resalta los valores atípicos con halos rojos, etiquetas y estadísticas en cada gráfico"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Resaltar</span>
              </button>

              <button
                id="btn-outlier-hide"
                onClick={() => setOutlierMode('hide')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition cursor-pointer ${
                  outlierMode === 'hide'
                    ? 'bg-[#1A1A1A] text-white font-bold shadow-xs'
                    : 'text-gray-600 hover:text-black'
                }`}
                title="Oculta los valores atípicos extremos para examinar la distribución central y recalcular la línea OLS sin distorsión"
              >
                <EyeOff className="h-3.5 w-3.5" />
                <span>Ocultar</span>
              </button>

              <button
                id="btn-outlier-normal"
                onClick={() => setOutlierMode('normal')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition cursor-pointer ${
                  outlierMode === 'normal'
                    ? 'bg-neutral-300 text-black font-bold shadow-xs'
                    : 'text-gray-600 hover:text-black'
                }`}
                title="Vista estándar continua"
              >
                <Activity className="h-3.5 w-3.5" />
                <span>Estándar</span>
              </button>
            </div>

            {edaSummary.outlierFeatures && edaSummary.outlierFeatures.length > 0 && (
              <button
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                className="px-2.5 py-1.5 text-xs font-mono border border-black/20 bg-white hover:bg-black/5 text-gray-700 transition cursor-pointer"
                title="Ver diagnóstico detallado de outliers por variable"
              >
                {showDiagnostics ? 'Cerrar Diagnóstico' : 'Ver Diagnóstico'}
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Outlier Diagnostics Table */}
        {showDiagnostics && edaSummary.outlierFeatures && (
          <div className="bg-white border border-black/15 p-4 space-y-3 shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A]">
                Diagnóstico de Valores Atípicos por Variable Cuantitativa (Tukey IQR)
              </span>
              <span className="text-[10px] font-mono text-gray-500">
                Intervalo Inlier = [Q1 - 1.5×IQR, Q3 + 1.5×IQR]
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border border-black/10">
                <thead>
                  <tr className="bg-[#1A1A1A] text-white text-[10px]">
                    <th className="py-2 px-3">Variable</th>
                    <th className="py-2 px-3 text-center">Outliers</th>
                    <th className="py-2 px-3 text-center">% Muestra</th>
                    <th className="py-2 px-3 text-center">Límite Inferior</th>
                    <th className="py-2 px-3 text-center">Límite Superior</th>
                    <th className="py-2 px-3 text-center">Severidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {edaSummary.outlierFeatures.map((feat, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF8F5]">
                      <td className="py-2 px-3 font-bold text-[#1A1A1A]">{feat.column}</td>
                      <td className="py-2 px-3 text-center font-bold">
                        {feat.outlierCount > 0 ? (
                          <span className="text-[#E63946]">{feat.outlierCount}</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">{feat.outlierPercentage}%</td>
                      <td className="py-2 px-3 text-center text-gray-600">{feat.lowerBound.toLocaleString()}</td>
                      <td className="py-2 px-3 text-center text-gray-600">{feat.upperBound.toLocaleString()}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 text-[9px] uppercase font-bold ${
                          feat.severity === 'high' 
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : feat.severity === 'moderate'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {feat.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Key Findings Card */}
      {edaSummary.keyFindings.length > 0 && (
        <div className="bg-[#1A1A1A] text-white p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[#E63946]">
              <Flame className="h-4 w-4" />
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] font-mono text-white">
                Hallazgos Clave de la Exploración (Regla Pareto)
              </h4>
            </div>
            <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
              {edaSummary.totalChartsGenerated} Figuras Generadas
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {edaSummary.keyFindings.map((finding, idx) => (
              <div key={idx} className="flex items-start space-x-3 text-xs font-mono bg-white/5 p-3.5 border border-white/10">
                <span className="text-[#E63946] font-bold">0{idx + 1}.</span>
                <span className="text-white/90 leading-relaxed font-sans">{finding}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correlation Top Pairs Table (if available) */}
      {edaSummary.correlationMatrix && edaSummary.correlationMatrix.topPairs.length > 0 && (
        <div className="bg-white border border-black/10 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[#1A1A1A]">
              <TrendingUp className="h-4 w-4 text-[#E63946]" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider">
                Principales Asociaciones Bivariadas (Ranking de Correlación)
              </h4>
            </div>
            <span className="text-[10px] font-mono text-gray-500">
              Pearson (Lineal) vs Spearman (Monótona)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border border-black/10">
              <thead>
                <tr className="bg-[#FAF8F5] text-gray-600 text-[10px] uppercase border-b border-black/10">
                  <th className="py-2.5 px-3">Variable 1</th>
                  <th className="py-2.5 px-3">Variable 2</th>
                  <th className="py-2.5 px-3 text-center">Pearson r</th>
                  <th className="py-2.5 px-3 text-center">Spearman ρ</th>
                  <th className="py-2.5 px-3 text-center">Fuerza</th>
                  <th className="py-2.5 px-3 text-center">Significancia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {edaSummary.correlationMatrix.topPairs.slice(0, 5).map((pair, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF8F5]">
                    <td className="py-2.5 px-3 font-bold text-[#1A1A1A]">{pair.var1}</td>
                    <td className="py-2.5 px-3 font-bold text-[#1A1A1A]">{pair.var2}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-[#E63946]">
                      {pair.pearsonR > 0 ? '+' : ''}{pair.pearsonR.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center text-gray-600">
                      {pair.spearmanRho > 0 ? '+' : ''}{pair.spearmanRho.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 text-[9px] uppercase bg-black/5 border border-black/10 font-semibold">
                        {pair.strength}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {pair.isSignificant ? (
                        <span className="text-emerald-700 font-bold">p &lt; 0.05</span>
                      ) : (
                        <span className="text-gray-400">p &gt; 0.05</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid of EDA Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredCharts.map((chart) => (
          <div 
            key={chart.id}
            className="bg-white border border-black/10 shadow-sm p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:border-black/30 transition-colors"
          >
            {/* Chart Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 flex-wrap gap-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-[#FAF8F5] border border-black/10 text-gray-600 font-semibold">
                    {chart.layer === 'univariate' ? 'Univariado' : 'Multivariado'} • {getChartTypeBadge(chart.chartType)}
                  </span>

                  {/* Outlier Indicator Badge */}
                  {chart.hasOutliers && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 border font-semibold flex items-center gap-1 ${
                      outlierMode === 'highlight' 
                        ? 'bg-rose-50 text-rose-800 border-rose-200' 
                        : outlierMode === 'hide'
                        ? 'bg-neutral-100 text-neutral-800 border-neutral-300'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {outlierMode === 'highlight' && <Eye className="h-2.5 w-2.5 text-rose-600" />}
                      {outlierMode === 'hide' && <EyeOff className="h-2.5 w-2.5 text-neutral-600" />}
                      {chart.outlierCount} Outliers ({chart.outlierPercentage || 0}%)
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setExpandedChart(chart)}
                  className="text-gray-400 hover:text-black p-1 transition cursor-pointer"
                  title="Ampliar gráfico"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <h4 className="text-lg font-serif font-bold text-[#1A1A1A] leading-snug">
                {chart.title}
              </h4>
            </div>

            {/* Chart Canvas Rendering */}
            <div className="min-h-[280px] w-full bg-[#FAF8F5] p-3 border border-black/5 flex flex-col justify-center">
              {renderChartBody(chart, outlierMode)}
            </div>

            {/* Business Takeaway & Statistical Backing */}
            <div className="space-y-3 pt-4 border-t border-black/10 font-sans">
              <div className="border-l-4 border-l-[#E63946] pl-3 py-0.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">
                  Conclusión Ejecutiva
                </div>
                <p className="text-sm font-serif italic text-[#1A1A1A] mt-0.5 leading-relaxed">
                  &ldquo;{chart.businessTakeaway}&rdquo;
                </p>
              </div>

              <div className="text-[11px] font-mono text-gray-600 bg-[#FAF8F5] p-2.5 border border-black/5 flex items-center justify-between">
                <span>{chart.statisticalBacking}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Expanded Chart Modal */}
      {expandedChart && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-black/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-black text-white">
                    {expandedChart.layer} • {expandedChart.chartType}
                  </span>
                  {expandedChart.hasOutliers && (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-100 text-rose-900 border border-rose-300 font-bold">
                      {expandedChart.outlierCount} Outliers ({expandedChart.outlierPercentage}%)
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-serif font-bold text-[#1A1A1A] mt-1">
                  {expandedChart.title}
                </h3>
              </div>
              <button
                onClick={() => setExpandedChart(null)}
                className="p-2 text-gray-400 hover:text-black cursor-pointer border border-black/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="h-[380px] w-full bg-[#FAF8F5] p-4 border border-black/10">
              {renderChartBody(expandedChart, outlierMode)}
            </div>

            <div className="space-y-3 bg-[#FAF8F5] p-4 border border-black/10">
              <div className="border-l-4 border-l-[#E63946] pl-3">
                <span className="text-xs font-mono uppercase font-bold text-[#E63946]">Conclusión Ejecutiva</span>
                <p className="text-sm font-serif italic text-[#1A1A1A] mt-1">
                  {expandedChart.businessTakeaway}
                </p>
              </div>
              <p className="text-xs font-mono text-gray-600 pt-2 border-t border-black/5">
                {expandedChart.statisticalBacking}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-black/10">
        <div className="text-xs font-mono text-gray-500">
          Alcance metodológico: <span className="text-black font-bold uppercase">{scopeLevel}</span>
        </div>

        <button
          id="btn-proceed-to-inference"
          onClick={onProceedToInference}
          disabled={isProcessing}
          className="flex items-center space-x-2 px-6 py-3 bg-[#1A1A1A] hover:bg-black active:bg-neutral-800 disabled:opacity-50 text-white font-mono text-xs uppercase tracking-widest transition-colors cursor-pointer shadow-sm"
        >
          <span>
            {scopeLevel === 'descriptive'
              ? 'Finalizar y Generar Informe Final (Capa 06)'
              : 'Proceder a Evidencia Estadística (Capa 04)'}
          </span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

function getChartTypeBadge(type: string): string {
  switch (type) {
    case 'heatmap_corr': return 'Heatmap Correlación';
    case 'pareto_chart': return 'Pareto 80/20';
    case 'histogram_kde': return 'Histograma + KDE';
    case 'boxplot': return 'Boxplot Tukey';
    case 'grouped_boxplot': return 'Boxplot Agrupado';
    case 'qq_plot': return 'Q-Q Plot Normalidad';
    case 'scatter_trend': return 'Scatter + Regresión OLS';
    case 'bar_freq': return 'Frecuencias Proporcionales';
    case 'contingency_table': return 'Tabla de Contingencia';
    default: return type;
  }
}

// -------------------------------------------------------------
// Specialized Chart Renderers for Every EDA Chart Type with Outlier Support
// -------------------------------------------------------------

function renderChartBody(chart: EDAChart, outlierMode: 'highlight' | 'hide' | 'normal') {
  // 1. PARETO 80/20 CHART
  if (chart.chartType === 'pareto_chart') {
    const dataToRender = (outlierMode === 'hide' && chart.dataWithoutOutliers && chart.dataWithoutOutliers.length > 0)
      ? chart.dataWithoutOutliers
      : chart.data;

    return (
      <div className="h-full flex flex-col justify-between">
        <div className="flex justify-between items-center mb-1 px-1 text-[11px] font-mono">
          <span className="text-gray-500">
            {outlierMode === 'hide' ? 'Volumen Inliers (Sin Extremos)' : 'Volumen por Segmento'}
          </span>
          <span className="text-[#E63946] font-bold">
            Top 20% = {chart.metadata.top20ContributionPercent}% del total
          </span>
        </div>
        <ResponsiveContainer width="100%" height={230}>
          <ComposedChart data={dataToRender} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 9, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} 
              interval={0}
              angle={-20}
              textAnchor="end"
            />
            <YAxis 
              yAxisId="left" 
              tick={{ fontSize: 9, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} 
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: '#E63946', fontFamily: 'JetBrains Mono' }} 
              unit="%" 
            />
            <Tooltip 
              formatter={(val: any, name: string) => [
                name === 'cumPercent' ? `${val}%` : Number(val).toLocaleString(),
                name === 'cumPercent' ? '% Acumulado' : 'Valor Total'
              ]}
              contentStyle={{ backgroundColor: '#1A1A1A', color: '#FFF', fontSize: '11px', fontFamily: 'JetBrains Mono', border: 'none' }}
            />
            <Bar yAxisId="left" dataKey="value" fill="#1A1A1A" radius={[2, 2, 0, 0]}>
              {dataToRender.map((entry: any, index: number) => (
                <Cell 
                  key={`pareto-cell-${index}`} 
                  fill={
                    outlierMode === 'highlight' && index === 0 && entry.percent > 50
                      ? '#E63946'
                      : index % 2 === 0 ? '#1A1A1A' : '#374151'
                  } 
                />
              ))}
            </Bar>
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="cumPercent" 
              stroke="#E63946" 
              strokeWidth={2.5} 
              dot={{ r: 3, fill: '#E63946' }} 
            />
            <ReferenceLine 
              yAxisId="right" 
              y={80} 
              stroke="#E63946" 
              strokeDasharray="4 4" 
              label={{ value: "Corte 80%", fill: "#E63946", fontSize: 10, position: "top" }} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 2. HISTOGRAM + KDE GAUSSIAN DENSITY CURVE
  if (chart.chartType === 'histogram_kde') {
    const isHidden = outlierMode === 'hide' && chart.dataWithoutOutliers && chart.dataWithoutOutliers.length > 0;
    const dataToRender = isHidden ? chart.dataWithoutOutliers! : chart.data;
    const stats = (isHidden && chart.metadata?.inlierStats) ? chart.metadata.inlierStats : chart.metadata;

    return (
      <div className="h-full flex flex-col justify-between">
        {stats && (
          <div className="flex flex-wrap items-center gap-1.5 mb-1 px-1 text-[10px] font-mono">
            <span className="bg-black/5 px-2 py-0.5 border border-black/10">
              Media: <strong className="text-black">{stats.mean}</strong>
            </span>
            <span className="bg-black/5 px-2 py-0.5 border border-black/10">
              Mediana: <strong className="text-black">{stats.median}</strong>
            </span>
            <span className="bg-black/5 px-2 py-0.5 border border-black/10">
              Desv: <strong className="text-black">{stats.std}</strong>
            </span>
            {isHidden ? (
              <span className="bg-neutral-800 text-white px-2 py-0.5 border border-black font-semibold">
                Zoom Inliers ({stats.count} obs)
              </span>
            ) : (
              chart.hasOutliers && outlierMode === 'highlight' && (
                <span className="bg-rose-100 text-rose-900 border border-rose-300 px-2 py-0.5 font-bold">
                  {chart.outlierCount} outliers en colas
                </span>
              )
            )}
          </div>
        )}
        <ResponsiveContainer width="100%" height={230}>
          <ComposedChart data={dataToRender} margin={{ top: 10, right: 15, left: -15, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis 
              dataKey="binLabel" 
              tick={{ fontSize: 9, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} 
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 9, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} />
            <Tooltip 
              formatter={(val: any, name: string) => [
                name === 'kde' ? `${val} (densidad escalada)` : val,
                name === 'kde' ? 'Curva KDE Gaussiana' : 'Frecuencia'
              ]}
              contentStyle={{ backgroundColor: '#1A1A1A', color: '#FFF', fontSize: '11px', fontFamily: 'JetBrains Mono', border: 'none' }}
            />
            <Bar dataKey="count" fill="#1A1A1A" radius={[2, 2, 0, 0]}>
              {dataToRender.map((entry: any, index: number) => {
                let cellColor = index % 2 === 0 ? '#1A1A1A' : '#374151';
                if (outlierMode === 'highlight' && entry.isOutlierBin) {
                  cellColor = '#E63946'; // Highlight outlier bins in distinct red
                }
                return <Cell key={`cell-${index}`} fill={cellColor} />;
              })}
            </Bar>
            <Line 
              type="monotone" 
              dataKey="kde" 
              stroke="#E63946" 
              strokeWidth={2.5} 
              dot={false} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 3. HEATMAP CORRELATION MATRIX
  if (chart.chartType === 'heatmap_corr') {
    const cols: string[] = chart.metadata?.columns || [];
    const matrix: number[][] = chart.metadata?.matrix || [];

    if (cols.length === 0 || matrix.length === 0) {
      return <div className="text-xs font-mono text-gray-500 text-center p-8">No hay variables numéricas suficientes para matriz de correlación.</div>;
    }

    return (
      <div className="h-full flex flex-col justify-center items-center p-2 overflow-x-auto">
        <div className="w-full max-w-md">
          {/* Header Row */}
          <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `80px repeat(${cols.length}, minmax(0, 1fr))` }}>
            <div className="text-[9px] font-mono font-bold text-gray-400 truncate">Variable</div>
            {cols.map((col, idx) => (
              <div key={idx} className="text-[9px] font-mono text-center text-gray-600 truncate font-semibold px-0.5" title={col}>
                {col.slice(0, 7)}
              </div>
            ))}
          </div>

          {/* Matrix Rows */}
          {cols.map((rowCol, rIdx) => (
            <div key={rIdx} className="grid gap-1 mb-1 items-center" style={{ gridTemplateColumns: `80px repeat(${cols.length}, minmax(0, 1fr))` }}>
              <div className="text-[9px] font-mono text-gray-700 truncate font-semibold pr-1 text-right" title={rowCol}>
                {rowCol.slice(0, 9)}
              </div>
              {cols.map((colCol, cIdx) => {
                const val = matrix[rIdx]?.[cIdx] ?? 0;
                const isDiag = rIdx === cIdx;
                const isPos = val >= 0;
                const intensity = Math.min(Math.abs(val), 1);
                
                return (
                  <div
                    key={cIdx}
                    title={`${rowCol} ↔ ${colCol}: r = ${val.toFixed(3)}`}
                    className="flex flex-col items-center justify-center p-1.5 text-center border border-black/10 rounded-xs transition-transform hover:scale-105"
                    style={{
                      backgroundColor: isDiag
                        ? '#1A1A1A'
                        : isPos
                        ? `rgba(230, 57, 70, ${0.1 + intensity * 0.85})`
                        : `rgba(43, 45, 66, ${0.15 + intensity * 0.85})`,
                      color: isDiag || intensity > 0.45 ? '#FFFFFF' : '#1A1A1A'
                    }}
                  >
                    <span className="text-[10px] font-mono font-bold">
                      {isDiag ? '1.0' : val.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. BOXPLOT TUKEY WITH OUTLIERS
  if (chart.chartType === 'boxplot') {
    const rawStats = chart.metadata || chart.data[0];
    if (!rawStats) return null;

    const isHidden = outlierMode === 'hide';
    const stats = (isHidden && rawStats.inlierBoxplot) ? rawStats.inlierBoxplot : rawStats;

    const min = stats.min ?? 0;
    const max = stats.max ?? 100;
    const range = max - min || 1;
    const getPercent = (v: number) => Math.max(0, Math.min(100, ((v - min) / range) * 100));

    return (
      <div className="h-full flex flex-col justify-center px-4 py-6 space-y-6">
        {/* Five Numbers Summary Pills */}
        <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-mono">
          <div className="bg-white p-2 border border-black/10">
            <span className="text-gray-400 block text-[9px]">Min Whisk</span>
            <strong>{stats.lowerWhisker}</strong>
          </div>
          <div className="bg-white p-2 border border-black/10">
            <span className="text-gray-400 block text-[9px]">Q1 (25%)</span>
            <strong>{stats.q1}</strong>
          </div>
          <div className="bg-[#1A1A1A] text-white p-2 border border-black/10">
            <span className="text-white/60 block text-[9px]">Mediana (Q2)</span>
            <strong>{stats.median}</strong>
          </div>
          <div className="bg-white p-2 border border-black/10">
            <span className="text-gray-400 block text-[9px]">Q3 (75%)</span>
            <strong>{stats.q3}</strong>
          </div>
          <div className="bg-white p-2 border border-black/10">
            <span className="text-gray-400 block text-[9px]">Max Whisk</span>
            <strong>{stats.upperWhisker}</strong>
          </div>
        </div>

        {/* Visual Boxplot Diagram */}
        <div className="relative w-full h-20 flex items-center">
          {/* Background Axis Line */}
          <div className="absolute w-full h-0.5 bg-gray-300" />

          {/* Whisker Line */}
          <div 
            className="absolute h-0.5 bg-black"
            style={{
              left: `${getPercent(stats.lowerWhisker)}%`,
              width: `${Math.max(1, getPercent(stats.upperWhisker) - getPercent(stats.lowerWhisker))}%`,
            }}
          />

          {/* Left Whisker End Cap */}
          <div 
            className="absolute w-0.5 h-6 bg-black -translate-x-1/2"
            style={{ left: `${getPercent(stats.lowerWhisker)}%` }}
          />

          {/* Right Whisker End Cap */}
          <div 
            className="absolute w-0.5 h-6 bg-black -translate-x-1/2"
            style={{ left: `${getPercent(stats.upperWhisker)}%` }}
          />

          {/* IQR Box (Q1 to Q3) */}
          <div 
            className="absolute h-12 bg-white border-2 border-black shadow-sm flex items-center justify-center"
            style={{
              left: `${getPercent(stats.q1)}%`,
              width: `${Math.max(2, getPercent(stats.q3) - getPercent(stats.q1))}%`,
            }}
          >
            <span className="text-[9px] font-mono font-bold text-gray-500 uppercase">IQR</span>
          </div>

          {/* Median Bar */}
          <div 
            className="absolute w-1 h-14 bg-[#E63946] -translate-x-1/2 shadow-xs"
            style={{ left: `${getPercent(stats.median)}%` }}
          />

          {/* Outlier Dots (shown in highlight and normal mode) */}
          {!isHidden && rawStats.outliers && rawStats.outliers.map((val: number, idx: number) => {
            const isHighlight = outlierMode === 'highlight';
            return (
              <div 
                key={idx}
                className={`absolute rounded-full -translate-x-1/2 shadow-xs transition-all ${
                  isHighlight 
                    ? 'w-4 h-4 bg-[#E63946] border-2 border-white ring-2 ring-[#E63946]/50 animate-pulse' 
                    : 'w-3 h-3 bg-neutral-700 border border-white'
                }`}
                style={{ left: `${getPercent(val)}%` }}
                title={`Outlier extremo: ${val} (Tukey IQR)`}
              />
            );
          })}
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
          <span>Min: {stats.min}</span>
          {isHidden ? (
            <span className="text-neutral-700 font-bold bg-neutral-100 px-2 py-0.5 border border-neutral-300">
              🚫 Outliers Ocultos ({rawStats.outliers?.length || 0} casos)
            </span>
          ) : (
            <span className={`font-bold ${rawStats.outliers?.length > 0 ? 'text-[#E63946]' : 'text-gray-400'}`}>
              {rawStats.outliers?.length || 0} Outliers detectados
            </span>
          )}
          <span>Max: {stats.max}</span>
        </div>
      </div>
    );
  }

  // 5. GROUPED BOXPLOT
  if (chart.chartType === 'grouped_boxplot') {
    const isHidden = outlierMode === 'hide';
    const points = (isHidden && chart.dataWithoutOutliers && chart.dataWithoutOutliers.length > 0)
      ? chart.dataWithoutOutliers
      : chart.data || [];

    return (
      <div className="h-full flex flex-col justify-between py-2 space-y-3">
        <div className="flex justify-between items-center text-[11px] font-mono text-gray-500 mb-1">
          <span>Comparativa de Medianas y Rango Intercuartílico:</span>
          {isHidden && (
            <span className="text-neutral-700 font-bold bg-neutral-100 px-2 py-0.5 border border-neutral-300 text-[10px]">
              Filtro Inliers Activo
            </span>
          )}
        </div>
        <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1">
          {points.map((pt: any, idx: number) => (
            <div key={idx} className="bg-white p-3 border border-black/10 space-y-1.5 shadow-xs">
              <div className="flex justify-between items-center text-xs font-mono font-bold">
                <span className="text-[#1A1A1A]">{pt.group}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-[#E63946]">Mediana: {pt.median} (n={pt.count})</span>
                  {outlierMode === 'highlight' && pt.outlierCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-rose-100 text-rose-900 border border-rose-300">
                      {pt.outlierCount} outliers
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-gray-500 bg-[#FAF8F5] p-1.5 border border-black/5">
                <span>Q1: {pt.q1}</span>
                <span>Q3: {pt.q3}</span>
                <span>Min: {pt.min}</span>
                <span>Max: {pt.max}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 6. QQ-PLOT NORMAL QUANTILE COMPARISON
  if (chart.chartType === 'qq_plot') {
    const isHidden = outlierMode === 'hide';
    const dataToRender = (isHidden && chart.dataWithoutOutliers && chart.dataWithoutOutliers.length > 0)
      ? chart.dataWithoutOutliers
      : chart.data;

    const r2Val = isHidden && chart.metadata?.rSquaredWithoutOutliers 
      ? chart.metadata.rSquaredWithoutOutliers 
      : chart.metadata?.rSquared;

    return (
      <div className="h-full flex flex-col justify-between">
        <div className="flex justify-between items-center mb-1 px-1 text-[11px] font-mono">
          <span className="text-gray-500">Diagonal 45° = Distribución Normal</span>
          <span className={`font-bold ${r2Val >= 0.95 ? 'text-emerald-700' : 'text-amber-700'}`}>
            R² Linealidad = {r2Val} {r2Val >= 0.95 ? '(Normal)' : '(No Normal)'}
            {isHidden && ' [Sin Outliers]'}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={230}>
          <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              type="number" 
              dataKey="theoreticalQuantile" 
              name="Cuantil Teórico N(0,1)" 
              tick={{ fontSize: 9, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} 
            />
            <YAxis 
              type="number" 
              dataKey="sampleQuantile" 
              name="Cuantil Estandarizado" 
              tick={{ fontSize: 9, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} 
            />
            <Tooltip 
              formatter={(val: any, name: string) => [val, name]}
              contentStyle={{ backgroundColor: '#1A1A1A', color: '#FFF', fontSize: '11px', fontFamily: 'JetBrains Mono', border: 'none' }}
            />
            <Scatter 
              name="Muestra" 
              data={dataToRender} 
              fill="#1A1A1A" 
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                if (outlierMode === 'highlight' && payload.isOutlier) {
                  return (
                    <circle cx={cx} cy={cy} r={5} fill="#E63946" stroke="#FFF" strokeWidth={1.5} />
                  );
                }
                return <circle cx={cx} cy={cy} r={3} fill="#1A1A1A" opacity={0.75} />;
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 7. SCATTER PLOT WITH OLS REGRESSION TRENDLINE (WITH OUTLIER TOGGLE)
  if (chart.chartType === 'scatter_trend') {
    const isHidden = outlierMode === 'hide';
    const isHighlight = outlierMode === 'highlight';
    const dataToRender = (isHidden && chart.dataWithoutOutliers && chart.dataWithoutOutliers.length > 0)
      ? chart.dataWithoutOutliers
      : chart.data;

    const r2Val = isHidden && chart.metadata?.rSquaredWithoutOutliers 
      ? chart.metadata.rSquaredWithoutOutliers 
      : chart.metadata?.rSquared;
    const rVal = isHidden && chart.metadata?.pearsonRWithoutOutliers
      ? chart.metadata.pearsonRWithoutOutliers
      : chart.metadata?.pearsonR;

    const inlierPoints = dataToRender.filter((p: any) => !p.isOutlier);
    const outlierPoints = isHighlight ? dataToRender.filter((p: any) => p.isOutlier) : [];

    return (
      <div className="h-full flex flex-col justify-between">
        <div className="flex justify-between items-center mb-1 px-1 text-[11px] font-mono">
          <span className="text-gray-500">
            {isHidden ? 'Ajuste OLS Inliers Limpios' : 'Ajuste Mínimos Cuadrados (OLS)'}
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-[#E63946] font-bold">
              R² = {r2Val} | r = {rVal}
            </span>
            {isHighlight && chart.metadata?.rSquaredWithoutOutliers && chart.metadata.rSquaredWithoutOutliers !== chart.metadata.rSquared && (
              <span className="text-[10px] bg-neutral-100 text-neutral-800 px-1.5 py-0.5 border border-neutral-300">
                R² sin outliers: <strong>{chart.metadata.rSquaredWithoutOutliers}</strong>
              </span>
            )}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={230}>
          <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name={chart.variables[0]} 
              tick={{ fontSize: 9, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} 
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name={chart.variables[1]} 
              tick={{ fontSize: 9, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} 
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }} 
              formatter={(val: any, name: string, item: any) => {
                if (item?.payload?.isOutlier) {
                  return [`${val} [⚠️ ${item.payload.outlierReason || 'Outlier'}]`, name];
                }
                return [val, name];
              }}
              contentStyle={{ backgroundColor: '#1A1A1A', color: '#FFF', fontSize: '11px', fontFamily: 'JetBrains Mono', border: 'none' }}
            />
            
            {/* Standard Inliers Scatter Points */}
            <Scatter 
              name="Observaciones" 
              data={inlierPoints} 
              fill="#1A1A1A" 
              shape="circle" 
              opacity={0.7}
            />

            {/* Distinct Red Outlier Points (in Highlight Mode) */}
            {isHighlight && outlierPoints.length > 0 && (
              <Scatter 
                name="Outliers" 
                data={outlierPoints} 
                fill="#E63946" 
                shape={(props: any) => {
                  const { cx, cy } = props;
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={6} fill="#E63946" stroke="#FFF" strokeWidth={2} />
                      <circle cx={cx} cy={cy} r={8} fill="none" stroke="#E63946" strokeWidth={1} opacity={0.6} />
                    </g>
                  );
                }} 
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 8. CATEGORICAL FREQUENCY BARS
  if (chart.chartType === 'bar_freq') {
    return (
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chart.data} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis 
            dataKey="category" 
            tick={{ fontSize: 9, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} 
            angle={-15}
            textAnchor="end"
          />
          <YAxis tick={{ fontSize: 9, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} />
          <Tooltip 
            formatter={(val: any, name: string) => [
              `${val} registros`,
              'Frecuencia'
            ]}
            contentStyle={{ backgroundColor: '#1A1A1A', color: '#FFF', fontSize: '11px', fontFamily: 'JetBrains Mono', border: 'none' }}
          />
          <Bar dataKey="count" fill="#1A1A1A" radius={[2, 2, 0, 0]}>
            {chart.data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={index === 0 ? '#E63946' : '#1A1A1A'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // 9. CONTINGENCY TABLE CROSS-TAB
  if (chart.chartType === 'contingency_table') {
    const rowCats: string[] = chart.metadata?.rowCats || [];
    const colCats: string[] = chart.metadata?.colCats || [];
    const matrix: number[][] = chart.metadata?.matrix || [];

    if (rowCats.length === 0 || colCats.length === 0) {
      return <div className="text-xs font-mono text-gray-500 text-center p-8">Tabla de contingencia no disponible.</div>;
    }

    return (
      <div className="h-full flex flex-col justify-center overflow-x-auto p-2">
        <table className="w-full text-left text-xs font-mono border border-black/10">
          <thead>
            <tr className="bg-[#1A1A1A] text-white text-[10px]">
              <th className="py-2 px-2.5 font-bold uppercase">{chart.metadata?.rowVar} / {chart.metadata?.colVar}</th>
              {colCats.map((col, idx) => (
                <th key={idx} className="py-2 px-2.5 text-center">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10 bg-white">
            {rowCats.map((rCat, rIdx) => {
              const rowSum = matrix[rIdx]?.reduce((a, b) => a + b, 0) || 1;
              return (
                <tr key={rIdx} className="hover:bg-[#FAF8F5]">
                  <td className="py-2 px-2.5 font-bold bg-[#FAF8F5] border-r border-black/10">{rCat}</td>
                  {colCats.map((cCat, cIdx) => {
                    const count = matrix[rIdx]?.[cIdx] ?? 0;
                    const pct = ((count / rowSum) * 100).toFixed(1);
                    return (
                      <td key={cIdx} className="py-2 px-2.5 text-center">
                        <span className="font-bold text-[#1A1A1A]">{count}</span>
                        <span className="text-[10px] text-gray-400 block">({pct}%)</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Fallback representation
  return (
    <div className="text-xs font-mono text-gray-400 text-center p-8">
      Visualización en proceso de renderizado...
    </div>
  );
}
