import React, { useState } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  PieChart, 
  Grid, 
  Layers, 
  Info, 
  ArrowRight, 
  Sparkles, 
  Flame, 
  Compass, 
  FileText,
  Maximize2
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
  ScatterChart, 
  Scatter, 
  ZAxis, 
  LineChart, 
  Line, 
  AreaChart, 
  Area 
} from 'recharts';
import { EDAChart, EDASummary } from '../types/pipeline';

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
  const [selectedChartId, setSelectedChartId] = useState<string | null>(null);

  if (!edaSummary) {
    return (
      <div className="bg-white p-12 border border-black/10 text-center space-y-4 shadow-sm">
        <BarChart2 className="h-10 w-10 mx-auto text-[#1A1A1A] animate-pulse" />
        <h3 className="text-xl font-serif font-light text-[#1A1A1A]">
          Generando Suite Visual Pareto 20/80...
        </h3>
        <p className="text-xs font-mono text-gray-500">
          Extrayendo distribuciones KDE, matrices de covarianza y visualizaciones de máxima información.
        </p>
      </div>
    );
  }

  const filteredCharts = edaSummary.charts.filter(c => 
    activeTab === 'all' ? true : c.layer === activeTab
  );

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 border border-black/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 bg-black text-white">
              Capa 03 // EDA Visual
            </span>
            <span className="text-xs font-mono text-gray-500">Pareto 20/80 Visual Information Suite</span>
          </div>
          <h3 className="text-2xl font-serif font-light text-[#1A1A1A]">
            Suite de Gráficos de Alto Valor Informativo
          </h3>
          <p className="text-sm font-serif italic text-gray-600 max-w-3xl mt-1">
            Ningún gráfico es decorativo. Cada figura sintetiza distribuciones empíricas, relaciones monótonas o no lineales, y cuenta con respaldo estadístico numérico y conclusión ejecutiva.
          </p>
        </div>

        {/* Tab Filter */}
        <div className="flex items-center space-x-1 border border-black/20 p-1 bg-[#FAF8F5]">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition ${
              activeTab === 'all'
                ? 'bg-[#1A1A1A] text-white font-bold'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Todos ({edaSummary.charts.length})
          </button>
          <button
            onClick={() => setActiveTab('univariate')}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition ${
              activeTab === 'univariate'
                ? 'bg-[#1A1A1A] text-white font-bold'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Univariado
          </button>
          <button
            onClick={() => setActiveTab('multivariate')}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition ${
              activeTab === 'multivariate'
                ? 'bg-[#1A1A1A] text-white font-bold'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Multivariado
          </button>
        </div>
      </div>

      {/* Key Findings Card */}
      {edaSummary.keyFindings.length > 0 && (
        <div className="bg-[#1A1A1A] text-white p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 text-[#E63946]">
            <Flame className="h-4 w-4" />
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] font-mono text-white">
              Hallazgos Clave de la Exploración (Regla Pareto)
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {edaSummary.keyFindings.map((finding, idx) => (
              <div key={idx} className="flex items-start space-x-3 text-xs font-mono bg-white/5 p-3.5 border border-white/10">
                <span className="text-[#E63946] font-bold">0{idx + 1}.</span>
                <span className="text-white/80 leading-relaxed font-sans">{finding}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correlation Top Pairs Table (if available) */}
      {edaSummary.correlationMatrix && edaSummary.correlationMatrix.topPairs.length > 0 && (
        <div className="bg-white border border-black/10 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-black/10 pb-4">
            <div>
              <h4 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">
                Ranking de Correlaciones Bivariadas (Pearson r & Spearman ρ)
              </h4>
              <p className="text-xs font-serif italic text-gray-500">
                Identificación de colinealidades y relaciones lineales directas o inversas.
              </p>
            </div>
            <span className="text-xs font-mono text-gray-500">
              {edaSummary.correlationMatrix.columns.length} Variables Numéricas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-black/10 text-gray-500 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Par de Variables</th>
                  <th className="py-2.5 px-3">Pearson r</th>
                  <th className="py-2.5 px-3">Spearman ρ</th>
                  <th className="py-2.5 px-3">Intensidad</th>
                  <th className="py-2.5 px-3">Significancia p-valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {edaSummary.correlationMatrix.topPairs.slice(0, 6).map((pair, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF8F5]">
                    <td className="py-2.5 px-3 font-bold text-[#1A1A1A]">
                      {pair.var1} <span className="text-gray-400 font-normal">↔</span> {pair.var2}
                    </td>
                    <td className="py-2.5 px-3 font-bold">
                      <span className={Math.abs(pair.pearsonR) > 0.5 ? 'text-[#E63946]' : 'text-gray-700'}>
                        {pair.pearsonR > 0 ? `+${pair.pearsonR.toFixed(3)}` : pair.pearsonR.toFixed(3)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-700">
                      {pair.spearmanRho > 0 ? `+${pair.spearmanRho.toFixed(3)}` : pair.spearmanRho.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-black/5 text-black border border-black/10 rounded text-[10px]">
                        {pair.strength}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-emerald-700 font-bold">
                      {pair.pearsonP < 0.001 ? 'p < 0.001 ***' : `p = ${pair.pearsonP.toFixed(4)}`}
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
            className="bg-white border border-black/10 shadow-sm p-6 sm:p-8 flex flex-col justify-between space-y-6"
          >
            {/* Chart Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-[#FAF8F5] border border-black/10 text-gray-600">
                  {chart.layer === 'univariate' ? 'Univariado' : 'Multivariado'} • {chart.chartType}
                </span>
                <span className="text-xs font-mono text-gray-400">
                  {chart.variables.join(' vs ')}
                </span>
              </div>
              <h4 className="text-lg font-serif font-bold text-[#1A1A1A] leading-snug">
                {chart.title}
              </h4>
            </div>

            {/* Chart Canvas Rendering */}
            <div className="h-64 w-full bg-[#FAF8F5] p-2 border border-black/5">
              {renderChartBody(chart)}
            </div>

            {/* Business Takeaway & Statistical Backing */}
            <div className="space-y-3 pt-4 border-t border-black/10 font-sans">
              <div className="border-l-4 border-l-[#E63946] pl-3 py-0.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                  Conclusión Ejecutiva
                </div>
                <p className="text-sm font-serif italic text-[#1A1A1A] mt-0.5 leading-relaxed">
                  &ldquo;{chart.businessTakeaway}&rdquo;
                </p>
              </div>

              <div className="text-[11px] font-mono text-gray-500 bg-[#FAF8F5] p-2.5 border border-black/5 flex items-center justify-between">
                <span>{chart.statisticalBacking}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-black/10">
        <div className="text-xs font-mono text-gray-500">
          Alcance seleccionado: <span className="text-black font-bold uppercase">{scopeLevel}</span>
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

function renderChartBody(chart: EDAChart) {
  if (chart.chartType === 'histogram_kde' || chart.chartType === 'bar_freq') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis 
            dataKey={chart.chartType === 'histogram_kde' ? 'binLabel' : 'category'} 
            tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} 
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1A1A1A', color: '#FFF', fontSize: '11px', fontFamily: 'JetBrains Mono', border: 'none' }}
          />
          <Bar dataKey="count" fill="#1A1A1A" radius={[2, 2, 0, 0]}>
            {chart.data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#1A1A1A' : '#374151'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chart.chartType === 'scatter_trend') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            type="number" 
            dataKey="x" 
            name={chart.variables[0]} 
            tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} 
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name={chart.variables[1]} 
            tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} 
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }} 
            contentStyle={{ backgroundColor: '#1A1A1A', color: '#FFF', fontSize: '11px', fontFamily: 'JetBrains Mono', border: 'none' }}
          />
          <Scatter name="Datos" data={chart.data} fill="#E63946" shape="circle" />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  if (chart.chartType === 'heatmap_corr') {
    return (
      <div className="h-full flex flex-col justify-center items-center p-2 overflow-x-auto">
        <div className="grid grid-cols-4 gap-1.5 w-full max-w-sm">
          {chart.data.slice(0, 16).map((d: any, idx: number) => {
            const val = Number(d.value || d.pearsonR || 0);
            const isPos = val >= 0;
            const intensity = Math.min(Math.abs(val), 1);
            return (
              <div
                key={idx}
                className="flex flex-col items-center justify-center p-2 text-center border border-black/10"
                style={{
                  backgroundColor: isPos 
                    ? `rgba(230, 57, 70, ${0.1 + intensity * 0.8})` 
                    : `rgba(26, 26, 26, ${0.1 + intensity * 0.8})`,
                  color: intensity > 0.45 ? '#FFF' : '#1A1A1A'
                }}
              >
                <span className="text-[9px] font-mono truncate w-full">{d.x || d.var1}</span>
                <span className="text-xs font-mono font-bold mt-0.5">
                  {val.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Fallback Area/Line representation
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis 
          dataKey={Object.keys(chart.data[0] || {})[0]} 
          tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} 
        />
        <YAxis tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1A1A1A', color: '#FFF', fontSize: '11px', fontFamily: 'JetBrains Mono', border: 'none' }}
        />
        <Area type="monotone" dataKey={Object.keys(chart.data[0] || {})[1] || 'count'} stroke="#1A1A1A" fill="#FAF8F5" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
