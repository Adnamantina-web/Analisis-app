import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Printer, 
  FileSpreadsheet, 
  Lock, 
  Database,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { FinalReport, DecisionLog, FinalReportSection } from '../types/pipeline';
import { PipelineExporter } from '../lib/data-engine/exporters';

interface Capa6StorytellingProps {
  report: FinalReport | null;
  decisionLog: DecisionLog | null;
  cleanedData: Record<string, any>[];
  rawData: Record<string, any>[];
  onOpenArtifactsModal: () => void;
  isProcessing: boolean;
}

export const Capa6Storytelling: React.FC<Capa6StorytellingProps> = ({
  report,
  decisionLog,
  cleanedData,
  rawData,
  onOpenArtifactsModal,
  isProcessing,
}) => {
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  if (!report) {
    return (
      <div className="bg-white p-12 border border-black/10 text-center font-serif">
        <p className="text-gray-500 italic">Compilando el informe ejecutivo en 7 apartados oficiales...</p>
      </div>
    );
  }

  const handleDownloadDocx = async () => {
    if (!report || !decisionLog) return;
    setIsExportingDocx(true);
    try {
      await PipelineExporter.generateAndDownloadDocx(report, decisionLog);
    } catch (err) {
      console.error('Error exporting DOCX:', err);
    } finally {
      setIsExportingDocx(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 border border-black/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 bg-black text-white">
              Capa 06 // Informe Final
            </span>
            <span className="text-xs font-mono text-gray-500">7 Apartados Oficiales & Storytelling Certificado</span>
          </div>
          <h3 className="text-2xl font-serif font-light text-[#1A1A1A]">
            Dictamen Ejecutivo & Storytelling de Negocio
          </h3>
          <p className="text-sm font-serif italic text-gray-600 max-w-3xl mt-1">
            Cada afirmación descrita está estrictamente respaldada por una métrica o contraste generado en las capas previas. Cero tecnicismos en el resumen, máxima profundidad en los apéndices.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            id="btn-download-docx-storytelling"
            onClick={handleDownloadDocx}
            disabled={isExportingDocx}
            className="flex items-center space-x-2 px-4 py-2 bg-[#1A1A1A] hover:bg-black text-white text-xs font-mono uppercase tracking-wider rounded-none transition cursor-pointer"
          >
            {isExportingDocx ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5 text-[#E63946]" />}
            <span>Exportar Word (.docx)</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-4 py-2 border border-black/20 hover:border-black text-xs font-mono uppercase tracking-wider text-[#1A1A1A] bg-white transition cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Report Container (Editorial Book Style) */}
      <div className="bg-white border border-black/10 shadow-sm p-8 sm:p-12 space-y-12">
        {/* Cover Section */}
        <div className="border-b-2 border-black pb-8 space-y-4">
          <div className="flex justify-between items-start">
            <div className="text-xs font-mono uppercase tracking-[0.25em] text-gray-500">
              Pareto Analytics • Documento Ejecutivo Oficial
            </div>
            <div className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 font-bold">
              100% Respaldado por Evidencia
            </div>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-light text-[#1A1A1A] leading-tight">
            Informe Estratégico de Decisión y Análisis de Datos
          </h2>
          <div className="flex flex-wrap gap-6 text-xs font-mono text-gray-600 pt-2">
            <div><span className="text-gray-400 uppercase">Emisión:</span> {report.createdAt}</div>
            <div><span className="text-gray-400 uppercase">Nivel:</span> {report.scopeLevel.toUpperCase()}</div>
            <div><span className="text-gray-400 uppercase">Evidencias:</span> {report.sections.reduce((a, s) => a + s.groundedEvidences.length, 0)} verificadas</div>
          </div>
        </div>

        {/* 7 Sections of the Report */}
        <div className="space-y-12 divide-y divide-black/10">
          {report.sections.map((sec) => (
            <div key={sec.number} className={`pt-8 ${sec.number === 1 ? 'pt-0' : ''} space-y-6`}>
              {/* Section Header */}
              <div className="space-y-1">
                <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#E63946] font-bold">
                  Apartado {String(sec.number).padStart(2, '0')}
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#1A1A1A]">
                  {sec.title}
                </h3>
              </div>

              {/* Main Text Content */}
              <p className="font-serif text-lg leading-relaxed text-gray-800 text-justify">
                {sec.content}
              </p>

              {/* Highlights / Bullets */}
              {sec.highlights && sec.highlights.length > 0 && (
                <div className="bg-[#FAF8F5] p-6 border-l-4 border-l-black space-y-2">
                  <div className="text-xs font-mono uppercase tracking-wider text-gray-500 font-bold">
                    Puntos Clave & Accionables
                  </div>
                  <ul className="space-y-2 text-sm font-serif text-gray-800">
                    {sec.highlights.map((h, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-[#E63946] font-bold">•</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Grounded Evidences Grid */}
              {sec.groundedEvidences && sec.groundedEvidences.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                    Evidencias Cuantitativas de Respaldo ({sec.groundedEvidences.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sec.groundedEvidences.map((ev, i) => (
                      <div key={i} className="p-4 bg-white border border-black/10 space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="font-bold text-[#1A1A1A]">{ev.sourceLayer}</span>
                          <span className="text-[10px] uppercase px-1.5 py-0.5 bg-black/5 text-gray-700">
                            {ev.type}
                          </span>
                        </div>
                        <div className="text-sm font-serif italic text-gray-700">
                          {ev.metricOrTest}
                        </div>
                        <div className="text-xs font-mono font-bold text-[#E63946] pt-1 border-t border-black/5">
                          {ev.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Closing Certification Box */}
        <div className="bg-[#1A1A1A] text-white p-8 space-y-4">
          <div className="flex items-center space-x-2 text-[#E63946]">
            <ShieldCheck className="h-5 w-5" />
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] font-mono text-white">
              Certificación de Integridad Analítica
            </h4>
          </div>
          <p className="text-sm font-serif italic text-white/80 leading-relaxed">
            Este informe fue computado de forma determinista mediante el motor analítico Pareto 20/80. Todos los resultados son reproducibles byte-a-byte utilizando la semilla fijada y el registro de decisiones auditable disponible en los artefactos del proyecto.
          </p>
          <div className="flex flex-wrap items-center justify-between pt-4 border-t border-white/10 text-xs font-mono text-white/50">
            <span>Firmado: Arquitecto & Lead Data Scientist</span>
            <span>Semilla: RNG={decisionLog?.randomSeed || 42}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end space-x-4 pt-4">
        <button
          onClick={onOpenArtifactsModal}
          className="flex items-center space-x-2 px-6 py-3 bg-[#E63946] hover:bg-[#D90429] active:bg-[#C90022] text-white font-mono text-xs uppercase tracking-widest transition-colors cursor-pointer shadow-sm"
        >
          <Download className="h-4 w-4" />
          <span>Descargar Todos los Artefactos del Proyecto</span>
        </button>
      </div>
    </div>
  );
};
