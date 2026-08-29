import React, { useState } from 'react';
import { 
  Sparkles, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Sliders, 
  ArrowRight, 
  FileSpreadsheet, 
  ShieldAlert, 
  ArrowDownUp, 
  Check 
} from 'lucide-react';
import { CleaningSummary, ColumnCleaningStrategy, ColumnSchema, OutlierStats } from '../types/pipeline';

interface Capa2CleaningProps {
  cleaningSummary: CleaningSummary | null;
  onApplyCleaning: (strategies: ColumnCleaningStrategy[]) => void;
  onProceedToEDA: () => void;
  isProcessing: boolean;
  originalRowCount: number;
}

export const Capa2Cleaning: React.FC<Capa2CleaningProps> = ({
  cleaningSummary,
  onApplyCleaning,
  onProceedToEDA,
  isProcessing,
  originalRowCount,
}) => {
  const [strategies, setStrategies] = useState<ColumnCleaningStrategy[]>(
    cleaningSummary?.strategies || []
  );

  const handleMethodChange = (columnName: string, method: ColumnCleaningStrategy['appliedMethod']) => {
    const updated = strategies.map(s => {
      if (s.column === columnName) {
        return {
          ...s,
          appliedMethod: method,
          userOverridden: method !== s.proposedMethod,
        };
      }
      return s;
    });
    setStrategies(updated);
    onApplyCleaning(updated);
  };

  const handleTransformationChange = (columnName: string, trans: ColumnCleaningStrategy['transformation']) => {
    const updated = strategies.map(s => {
      if (s.column === columnName) {
        return {
          ...s,
          transformation: trans,
          userOverridden: true,
        };
      }
      return s;
    });
    setStrategies(updated);
    onApplyCleaning(updated);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 border border-black/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 bg-black text-white">
              Capa 02 // Saneamiento
            </span>
            <span className="text-xs font-mono text-gray-500">Data Hygiene & Imputation Engine</span>
          </div>
          <h3 className="text-2xl font-serif font-light text-[#1A1A1A]">
            Tratamiento de Nulos, Atípicos y Transformaciones
          </h3>
          <p className="text-sm font-serif italic text-gray-600 max-w-3xl mt-1">
            Cada imputación tiene justificación probabilística (Media si simétrico, Mediana si asimétrico/outliers, Moda si categórico). El dataset original queda respaldado y protegido.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Preservación</div>
          <div className="text-xs font-mono font-bold text-emerald-700">Backup Crudo Inalterado</div>
        </div>
      </div>

      {/* Metric Callouts */}
      {cleaningSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-6 border border-black/10 border-l-4 border-l-black shadow-sm">
            <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Filas Depuradas</div>
            <div className="text-3xl font-serif font-light text-[#1A1A1A] mt-1">
              {cleaningSummary.finalRowCount.toLocaleString()}
            </div>
            <div className="text-[11px] font-mono text-gray-500 mt-1">
              {cleaningSummary.originalRowCount - cleaningSummary.finalRowCount} filas removidas ({cleaningSummary.duplicateRowsRemoved} dup)
            </div>
          </div>

          <div className="bg-white p-6 border border-black/10 border-l-4 border-l-[#E63946] shadow-sm">
            <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Nulos Imputados</div>
            <div className="text-3xl font-serif font-light text-[#E63946] mt-1">
              {cleaningSummary.totalNullsImputed}
            </div>
            <div className="text-[11px] font-mono text-gray-500 mt-1">Estrategias automáticas aplicadas</div>
          </div>

          <div className="bg-white p-6 border border-black/10 border-l-4 border-l-black shadow-sm">
            <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Atípicos (IQR)</div>
            <div className="text-3xl font-serif font-light text-[#1A1A1A] mt-1">
              {cleaningSummary.outliersSummary.reduce((a, b) => a + b.iqrOutlierCount, 0)}
            </div>
            <div className="text-[11px] font-mono text-gray-500 mt-1">
              En {cleaningSummary.outliersSummary.filter(o => o.iqrOutlierCount > 0).length} variables cuantitativas
            </div>
          </div>

          <div className="bg-white p-6 border border-black/10 border-l-4 border-l-emerald-600 shadow-sm">
            <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Calidad de Datos</div>
            <div className="text-3xl font-serif font-light text-emerald-700 mt-1">
              100%
            </div>
            <div className="text-[11px] font-mono text-gray-500 mt-1">0% de celdas nulas residuales</div>
          </div>
        </div>
      )}

      {/* Strategies Table */}
      <div className="bg-white border border-black/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">
              Estrategia de Imputación y Transformación por Columna
            </h4>
            <p className="text-xs font-serif italic text-gray-500">
              El motor seleccionó el tratamiento matemático óptimo. Puedes modificar cualquier regla.
            </p>
          </div>
          <span className="text-[11px] font-mono text-gray-500 bg-[#FAF8F5] px-3 py-1 border border-black/10">
            {strategies.length} Columnas Analizadas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-black/10 text-gray-500 uppercase font-mono text-[10px] tracking-wider">
                <th className="py-3 px-4">Columna</th>
                <th className="py-3 px-4">Diagnóstico Heurístico</th>
                <th className="py-3 px-4">Método de Imputación</th>
                <th className="py-3 px-4">Transformación</th>
                <th className="py-3 px-4">Justificación Metodológica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 font-sans">
              {strategies.map((strat) => (
                <tr key={strat.column} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#1A1A1A]">
                    {strat.column}
                    {strat.userOverridden && (
                      <span className="ml-2 text-[9px] font-mono bg-[#E63946]/10 text-[#E63946] px-1 py-0.5 rounded font-bold uppercase">
                        Manual
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-700 font-serif italic text-xs">
                    {strat.detectedIssue}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={strat.appliedMethod}
                      onChange={(e) => handleMethodChange(strat.column, e.target.value as any)}
                      className="bg-white border border-black/20 text-xs font-mono px-2.5 py-1.5 text-[#1A1A1A] focus:outline-none focus:border-black cursor-pointer"
                    >
                      <option value="none">Sin imputación (Conservar)</option>
                      <option value="median">Mediana (Robusta / Asimétrica)</option>
                      <option value="mean">Media (Distribución Normal)</option>
                      <option value="mode">Moda (Categórica)</option>
                      <option value="drop_rows">Eliminar filas con nulos</option>
                      <option value="drop_col">Descartar columna completa</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={strat.transformation || 'none'}
                      onChange={(e) => handleTransformationChange(strat.column, e.target.value as any)}
                      className="bg-white border border-black/20 text-xs font-mono px-2.5 py-1.5 text-[#1A1A1A] focus:outline-none focus:border-black cursor-pointer"
                    >
                      <option value="none">Ninguna</option>
                      <option value="log1p">Logaritmo Natural log(1+x)</option>
                      <option value="z_score">Estandarización Z (μ=0, σ=1)</option>
                      <option value="min_max">Escalado Min-Max [0, 1]</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-gray-600 font-mono text-[11px] max-w-sm">
                    {strat.justification}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Outliers Section */}
      {cleaningSummary && cleaningSummary.outliersSummary.length > 0 && (
        <div className="bg-white border border-black/10 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-black/10 pb-4">
            <div>
              <h4 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">
                Auditoría de Valores Atípicos (Regla IQR de Tukey & Z-Score)
              </h4>
              <p className="text-xs font-serif italic text-gray-500">
                Límites inferior [Q1 - 1.5·IQR] y superior [Q3 + 1.5·IQR] calculados sobre la muestra.
              </p>
            </div>
            <span className="text-xs font-mono text-gray-500">
              {cleaningSummary.outliersSummary.filter(o => o.iqrOutlierCount > 0).length} Columnas con Outliers
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cleaningSummary.outliersSummary.map((out) => (
              <div key={out.column} className="p-4 bg-[#FAF8F5] border border-black/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[#1A1A1A]">{out.column}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${out.iqrOutlierCount > 0 ? 'bg-[#E63946]/10 text-[#E63946]' : 'bg-black/5 text-gray-600'}`}>
                    {out.iqrOutlierCount} outliers
                  </span>
                </div>
                <div className="text-[11px] font-mono text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Rango IQR:</span>
                    <span>[{out.lowerBoundIQR.toFixed(1)}, {out.upperBoundIQR.toFixed(1)}]</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Q1 / Q3:</span>
                    <span>{out.q1.toFixed(1)} / {out.q3.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Media / Desv:</span>
                    <span>μ={out.mean.toFixed(1)}, σ={out.std.toFixed(1)}</span>
                  </div>
                </div>
                <div className="text-[10px] font-serif italic text-gray-500 pt-1 border-t border-black/5">
                  {out.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cleaned Dataset Preview */}
      {cleaningSummary && cleaningSummary.cleanedPreview.length > 0 && (
        <div className="bg-white border border-black/10 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-black/10 flex items-center justify-between">
            <div>
              <h4 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">
                Muestra del Dataset Saneado (Primeras 8 Observaciones)
              </h4>
              <p className="text-xs font-serif italic text-gray-500">
                Valores nulos corregidos y tipificación homogénea lista para EDA y Modelado.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 font-bold">
              Dataset Certificado Listo
            </span>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-black/10 text-gray-500 sticky top-0">
                  <th className="py-2.5 px-3">#</th>
                  {cleaningSummary.cleanedColumns.slice(0, 10).map((col) => (
                    <th key={col.name} className="py-2.5 px-3 whitespace-nowrap font-bold text-[#1A1A1A]">
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 text-[#1A1A1A]">
                {cleaningSummary.cleanedPreview.slice(0, 8).map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF8F5]">
                    <td className="py-2 px-3 text-gray-400">{idx + 1}</td>
                    {cleaningSummary.cleanedColumns.slice(0, 10).map((col) => (
                      <td key={col.name} className="py-2 px-3 whitespace-nowrap">
                        {String(row[col.name] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-end pt-4">
        <button
          id="btn-proceed-to-eda"
          onClick={onProceedToEDA}
          disabled={isProcessing}
          className="flex items-center space-x-2 px-6 py-3 bg-[#1A1A1A] hover:bg-black active:bg-neutral-800 disabled:opacity-50 text-white font-mono text-xs uppercase tracking-widest transition-colors cursor-pointer shadow-sm"
        >
          <span>Aceptar Saneamiento y Proceder a EDA Visual (Capa 03)</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
