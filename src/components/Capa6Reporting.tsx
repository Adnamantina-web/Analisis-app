import React, { useState } from 'react';
import { 
  FileCheck2, 
  Download, 
  Sparkles, 
  FileText, 
  Code, 
  Database, 
  ShieldCheck, 
  RefreshCw,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { FinalReport, ProjectContract } from '../types/pipeline';
import { ReportExporters } from '../lib/data-engine/exporters';

interface Capa6ReportingProps {
  finalReport: FinalReport | null;
  contract: ProjectContract | null;
  onOpenArtifactsModal: () => void;
  isProcessing: boolean;
  onBackToStart: () => void;
}

export const Capa6Reporting: React.FC<Capa6ReportingProps> = ({
  finalReport,
  contract,
  onOpenArtifactsModal,
  isProcessing,
  onBackToStart,
}) => {
  const [copied, setCopied] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSynthesis, setAiSynthesis] = useState<string | null>(null);

  if (!finalReport) {
    return (
      <div className="bg-white p-12 border border-black/10 text-center space-y-4 shadow-sm">
        <FileCheck2 className="h-10 w-10 mx-auto text-[#1A1A1A] animate-pulse" />
        <h3 className="text-xl font-serif font-light text-[#1A1A1A]">
          Generando Informe Canónico de 7 Secciones...
        </h3>
        <p className="text-xs font-mono text-gray-500">
          Sintetizando evidencias, métricas numéricas y verificando que cada afirmación tenga respaldo gráfico y estadístico.
        </p>
      </div>
    );
  }

  const handleCopyMarkdown = () => {
    if (!contract) return;
    const md = ReportExporters.generateMarkdownReport(finalReport, contract);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestAiSummary = async () => {
    setAiLoading(true);
    try {
      const resp = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: contract?.businessQuestion || 'Análisis Pareto 20/80',
          summary: {
            title: finalReport.title,
            target: finalReport.targetVariable,
            scope: finalReport.scopeLevel,
            executiveSummary: finalReport.executiveSummary,
            metricCounter: finalReport.groundedMetricCounter,
            recommendations: finalReport.recommendations,
          }
        }),
      });
      const data = await resp.json();
      if (data.text) {
        setAiSynthesis(data.text);
      } else {
        setAiSynthesis(data.message || finalReport.executiveSummary);
      }
    } catch (e: any) {
      setAiSynthesis('Síntesis ejecutiva generada localmente: ' + finalReport.executiveSummary);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 border border-black/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 bg-black text-white">
              Capa 06 // Storytelling & Deliverables
            </span>
            <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 border border-emerald-200">
              Integridad 100% Auditada • {finalReport.groundedMetricCounter} Evidencias
            </span>
          </div>
          <h3 className="text-2xl font-serif font-light text-[#1A1A1A]">
            Informe de Negocio y Síntesis Ejecutiva
          </h3>
          <p className="text-sm font-serif italic text-gray-600 max-w-3xl mt-1">
            Estructura canónica de 7 partes para directivos y stakeholders. Cada afirmación está respaldada por un gráfico, prueba inferencial o métrica.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center space-x-1.5 px-3 py-2 border border-black/30 rounded text-xs font-mono uppercase tracking-wider text-[#1A1A1A] hover:border-black bg-white cursor-pointer"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar Markdown'}</span>
          </button>

          <button
            onClick={onOpenArtifactsModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#E63946] hover:bg-[#D90429] text-white rounded text-xs font-bold font-mono uppercase tracking-wider transition cursor-pointer shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar Artefactos</span>
          </button>
        </div>
      </div>

      {/* AI Executive Synthesis Callout */}
      <div className="bg-[#1A1A1A] text-white p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2 text-[#E63946]">
            <Sparkles className="h-4 w-4" />
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] font-mono text-white">
              Síntesis Ejecutiva Server-Side (Gemini API)
            </h4>
          </div>
          <button
            onClick={handleRequestAiSummary}
            disabled={aiLoading}
            className="text-[11px] font-mono uppercase tracking-wider px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-white flex items-center space-x-1 cursor-pointer"
          >
            {aiLoading ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : null}
            <span>{aiLoading ? 'Generando...' : 'Generar Síntesis Gemini'}</span>
          </button>
        </div>

        {aiSynthesis ? (
          <div className="bg-white/5 border border-white/10 p-4 text-xs font-serif italic text-white/90 leading-relaxed whitespace-pre-line">
            {aiSynthesis}
          </div>
        ) : (
          <p className="text-xs font-serif italic text-white/60">
            Haz clic en &quot;Generar Síntesis Gemini&quot; para obtener un resumen de alto impacto formulado directamente para directivos a partir del contrato de proyecto y las métricas calculadas.
          </p>
        )}
      </div>

      {/* 7 CANONICAL SECTIONS ACCORDING TO PIPELINE SPEC */}
      <div className="space-y-6">
        {finalReport.sections.map((sec) => (
          <div 
            key={sec.number}
            id={`report-section-${sec.number}`}
            className="bg-white border border-black/10 shadow-sm p-6 sm:p-10 space-y-6"
          >
            {/* Section Header */}
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div className="flex items-center space-x-3">
                <span className="h-7 w-7 bg-[#1A1A1A] text-white flex items-center justify-center font-mono text-xs font-bold">
                  0{sec.number}
                </span>
                <h4 className="text-xl sm:text-2xl font-serif font-light text-[#1A1A1A]">
                  {sec.title}
                </h4>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                Sección 0{sec.number}/07
              </span>
            </div>

            {/* Highlights Grid */}
            {sec.highlights && sec.highlights.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sec.highlights.map((hl, hIdx) => (
                  <div key={hIdx} className="p-4 bg-[#FAF8F5] border border-black/10 flex items-start space-x-3">
                    <span className="text-[#E63946] font-mono font-bold text-xs mt-0.5">●</span>
                    <span className="text-xs font-serif text-gray-800 leading-relaxed">{hl}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Text Paragraphs */}
            <div className="prose prose-sm max-w-none text-gray-800 font-serif leading-relaxed text-sm sm:text-base space-y-3">
              {sec.content.split('\n\n').map((par, pIdx) => (
                <p key={pIdx}>{par}</p>
              ))}
            </div>

            {/* Grounded Evidences Citations */}
            {sec.groundedEvidences && sec.groundedEvidences.length > 0 && (
              <div className="pt-4 border-t border-black/10 space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">
                  Evidencias de Respaldo:
                </div>
                <div className="flex flex-wrap gap-2">
                  {sec.groundedEvidences.map((ev, eIdx) => (
                    <span 
                      key={eIdx}
                      className="px-2 py-1 bg-[#FAF8F5] border border-black/10 text-[10px] font-mono text-gray-600 rounded flex items-center space-x-1"
                    >
                      <span className="font-bold text-[#1A1A1A]">{ev.type.toUpperCase()}:</span>
                      <span>{ev.description}</span>
                      <span className="text-[#E63946] font-bold">[{ev.value}]</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Strategic Action Plan (Section 7 Recommendations) */}
      {finalReport.recommendations && finalReport.recommendations.length > 0 && (
        <div className="bg-white border-2 border-black p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-black/10 pb-3">
            <ShieldCheck className="h-5 w-5 text-emerald-700" />
            <h4 className="text-lg font-serif font-bold text-[#1A1A1A]">
              Recomendaciones Estratégicas y Plan de Decisión
            </h4>
          </div>

          <div className="space-y-3">
            {finalReport.recommendations.map((rec, rIdx) => (
              <div key={rIdx} className="flex items-start space-x-3 p-3 bg-[#FAF8F5] border border-black/10">
                <span className="text-[#E63946] font-mono font-bold text-xs mt-0.5">#{rIdx + 1}</span>
                <span className="text-xs font-sans text-gray-800 leading-relaxed">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-black/10">
        <button
          onClick={onBackToStart}
          className="flex items-center space-x-2 px-4 py-2 border border-black/30 text-xs font-mono uppercase tracking-wider text-gray-700 hover:border-black hover:text-black transition cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Volver a Ingesta (Capa 00)</span>
        </button>

        <button
          onClick={onOpenArtifactsModal}
          className="flex items-center space-x-2 px-6 py-3 bg-[#1A1A1A] hover:bg-black text-white text-xs font-mono uppercase tracking-widest transition cursor-pointer shadow-sm"
        >
          <Download className="h-4 w-4" />
          <span>Exportar Documentos Finales</span>
        </button>
      </div>
    </div>
  );
};
