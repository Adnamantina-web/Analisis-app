import React, { useState } from 'react';
import { 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Layers, 
  ShieldCheck, 
  FlaskConical, 
  Check, 
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { InferentialSummary, StatisticalTestResult } from '../types/pipeline';

interface Capa4InferenceProps {
  inferentialSummary: InferentialSummary | null;
  onProceedToML: () => void;
  isProcessing: boolean;
  scopeLevel: 'descriptive' | 'inferential' | 'predictive';
}

export const Capa4Inference: React.FC<Capa4InferenceProps> = ({
  inferentialSummary,
  onProceedToML,
  isProcessing,
  scopeLevel,
}) => {
  const [filterSigOnly, setFilterSigOnly] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  if (!inferentialSummary || inferentialSummary.tests.length === 0) {
    return (
      <div className="bg-white p-12 border border-black/10 text-center space-y-4 shadow-sm">
        <Scale className="h-10 w-10 mx-auto text-[#1A1A1A] animate-pulse" />
        <h3 className="text-xl font-serif font-light text-[#1A1A1A]">
          Calculando Inferencia Estadística & FDR...
        </h3>
        <p className="text-xs font-mono text-gray-500">
          Comprobando supuestos de normalidad, homocedasticidad y ejecutando contrastes de hipótesis con ajuste Benjamini-Hochberg.
        </p>
      </div>
    );
  }

  const tests = filterSigOnly
    ? inferentialSummary.tests.filter(t => t.isSignificant)
    : inferentialSummary.tests;

  const activeTest = inferentialSummary.tests.find(t => t.id === selectedTestId) || inferentialSummary.tests[0];

  const significantCount = inferentialSummary.tests.filter(t => t.isSignificant).length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 border border-black/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 bg-black text-white">
              Capa 04 // Inferencia
            </span>
            <span className="text-xs font-mono text-gray-500">
              Hypothesis Testing & {inferentialSummary.correctionMethod} (α = {inferentialSummary.significanceThresholdAlpha})
            </span>
          </div>
          <h3 className="text-2xl font-serif font-light text-[#1A1A1A]">
            Evidencia Estadística y Pruebas de Hipótesis
          </h3>
          <p className="text-sm font-serif italic text-gray-600 max-w-3xl mt-1">
            Ningún test paramétrico se ejecuta sin comprobar supuestos. Los p-valores crudos son ajustados mediante control False Discovery Rate (FDR) para erradicar descubrimientos espurios.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setFilterSigOnly(!filterSigOnly)}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition cursor-pointer ${
              filterSigOnly
                ? 'bg-[#E63946] border-[#E63946] text-white font-bold'
                : 'bg-[#FAF8F5] border-black/20 text-gray-700 hover:border-black'
            }`}
          >
            {filterSigOnly ? 'Solo Significativos (FDR)' : 'Todos los Tests'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-6 border border-black/10 border-l-4 border-l-black shadow-sm">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Total Pruebas</div>
          <div className="text-3xl font-serif font-light text-[#1A1A1A] mt-1">
            {inferentialSummary.tests.length}
          </div>
          <div className="text-[11px] font-mono text-gray-500 mt-1">Contrastes formulados</div>
        </div>

        <div className="bg-white p-6 border border-black/10 border-l-4 border-l-[#E63946] shadow-sm">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Significativos (FDR)</div>
          <div className="text-3xl font-serif font-light text-[#E63946] mt-1">
            {significantCount}
          </div>
          <div className="text-[11px] font-mono text-gray-500 mt-1">
            q-valor &lt; {inferentialSummary.significanceThresholdAlpha} corregido
          </div>
        </div>

        <div className="bg-white p-6 border border-black/10 border-l-4 border-l-black shadow-sm">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Corrección Múltiple</div>
          <div className="text-2xl font-serif font-light text-[#1A1A1A] mt-1 truncate">
            {inferentialSummary.correctionMethod}
          </div>
          <div className="text-[11px] font-mono text-gray-500 mt-1">Error Tipo I controlado</div>
        </div>

        <div className="bg-white p-6 border border-black/10 border-l-4 border-l-emerald-600 shadow-sm">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Control de Calidad</div>
          <div className="text-2xl font-serif font-light text-emerald-700 mt-1">
            100% Auditado
          </div>
          <div className="text-[11px] font-mono text-gray-500 mt-1">Supuestos verificados</div>
        </div>
      </div>

      {/* Hypothesis Tests Table */}
      <div className="bg-white border border-black/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">
              Matriz de Pruebas de Hipótesis y Control FDR
            </h4>
            <p className="text-xs font-serif italic text-gray-500">
              Cada contraste incluye hipótesis nula formal, estadístico, p-valor crudo, q-valor ajustado y tamaño del efecto.
            </p>
          </div>
          <span className="text-[11px] font-mono text-gray-500 bg-[#FAF8F5] px-3 py-1 border border-black/10">
            {tests.length} Contrastes Activos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-black/10 text-gray-500 uppercase font-mono text-[10px] tracking-wider">
                <th className="py-3 px-4">Variables / Contraste</th>
                <th className="py-3 px-4">Test Utilizado</th>
                <th className="py-3 px-4">Estadístico</th>
                <th className="py-3 px-4">p-valor Crudo</th>
                <th className="py-3 px-4">q-valor FDR (BH)</th>
                <th className="py-3 px-4">Efecto & Magnitud</th>
                <th className="py-3 px-4">Decisión de Negocio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 font-sans">
              {tests.map((test) => (
                <tr 
                  key={test.id} 
                  onClick={() => setSelectedTestId(test.id)}
                  className={`cursor-pointer transition-colors ${
                    selectedTestId === test.id ? 'bg-[#FAF8F5] font-semibold' : 'hover:bg-[#FAF8F5]'
                  }`}
                >
                  <td className="py-3 px-4 font-mono">
                    <div className="font-bold text-[#1A1A1A]">{test.variable1} ↔ {test.variable2}</div>
                    <div className="text-[10px] text-gray-400 font-serif italic max-w-xs truncate" title={test.nullHypothesis}>
                      H₀: {test.nullHypothesis}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-700">
                    <span className="px-2 py-0.5 bg-black/5 text-black border border-black/10 rounded text-[10px]">
                      {test.testName}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[#1A1A1A]">
                    {test.statisticSymbol || 't'} = {test.statistic.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <span className={test.pValue < 0.05 ? 'font-bold text-black' : 'text-gray-400'}>
                      {test.pValue < 0.001 ? '< 0.001' : test.pValue.toFixed(4)}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      test.isSignificant
                        ? 'bg-[#E63946] text-white'
                        : 'bg-black/5 text-gray-400'
                    }`}>
                      {test.pValueAdjustedFDR !== undefined 
                        ? (test.pValueAdjustedFDR < 0.001 ? 'q < 0.001' : `q = ${test.pValueAdjustedFDR.toFixed(4)}`)
                        : (test.pValue < 0.001 ? 'p < 0.001' : `p = ${test.pValue.toFixed(4)}`)}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {test.effectSizeValue !== undefined ? (
                      <div>
                        <span className="font-bold text-[#1A1A1A]">
                          {test.effectSizeName}: {test.effectSizeValue.toFixed(2)}
                        </span>
                        <span className="ml-1 text-[10px] text-gray-500 uppercase">
                          ({test.effectSizeMagnitude})
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs font-serif italic max-w-xs text-gray-800">
                    {test.plainBusinessInterpretation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assumptions Breakdown for Active Selected Test */}
      {activeTest && activeTest.assumptionsChecked && activeTest.assumptionsChecked.length > 0 && (
        <div className="bg-white border border-black/10 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-black/10 pb-4">
            <div>
              <h4 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">
                Verificación de Supuestos: {activeTest.variable1} vs {activeTest.variable2}
              </h4>
              <p className="text-xs font-serif italic text-gray-500">
                Diagnóstico previo al test paramétrico/no paramétrico seleccionado.
              </p>
            </div>
            <span className="text-xs font-mono text-gray-500">
              {activeTest.assumptionsChecked.length} Supuestos Verificados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTest.assumptionsChecked.map((assump, idx) => (
              <div key={idx} className="p-4 bg-[#FAF8F5] border border-black/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[#1A1A1A]">{assump.targetVariable}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center space-x-1 ${
                    assump.passed
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-900 border border-amber-200'
                  }`}>
                    {assump.passed ? <Check className="h-3 w-3 inline" /> : <AlertTriangle className="h-3 w-3 inline" />}
                    <span>{assump.passed ? 'Cumple Supuesto' : 'No Cumple (Ajuste)'}</span>
                  </span>
                </div>

                <div className="text-[11px] font-mono text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Prueba:</span>
                    <span>{assump.testName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estadístico / p:</span>
                    <span>{assump.statistic.toFixed(2)} (p = {assump.pValue < 0.001 ? '<0.001' : assump.pValue.toFixed(3)})</span>
                  </div>
                </div>

                <div className="text-[10px] font-serif italic text-gray-600 pt-2 border-t border-black/5">
                  Veredicto: <span className="font-mono font-semibold text-black">{assump.verdict}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-black/10">
        <div className="text-xs font-mono text-gray-500">
          Alcance del proyecto: <span className="text-black font-bold uppercase">{scopeLevel}</span>
        </div>

        <button
          id="btn-proceed-to-ml"
          onClick={onProceedToML}
          disabled={isProcessing}
          className="flex items-center space-x-2 px-6 py-3 bg-[#1A1A1A] hover:bg-black active:bg-neutral-800 disabled:opacity-50 text-white font-mono text-xs uppercase tracking-widest transition-colors cursor-pointer shadow-sm"
        >
          <span>
            {scopeLevel === 'inferential'
              ? 'Finalizar y Generar Informe Final (Capa 06)'
              : 'Proceder a Modelado & K-Means (Capa 05)'}
          </span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
