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
  RefreshCw,
  Copy,
  Check,
  Eye,
  X,
  Code,
  FileCode
} from 'lucide-react';
import { 
  FinalReport, 
  DecisionLog, 
  FinalReportSection,
  EDASummary,
  InferentialSummary,
  MLSummary,
  CleaningSummary,
  ProjectContract 
} from '../types/pipeline';
import { PipelineExporter, downloadBlob } from '../lib/data-engine/exporters';

interface Capa6StorytellingProps {
  report: FinalReport | null;
  decisionLog: DecisionLog | null;
  cleanedData: Record<string, any>[];
  rawData: Record<string, any>[];
  onOpenArtifactsModal: () => void;
  isProcessing: boolean;
  edaSummary?: EDASummary | null;
  inferentialSummary?: InferentialSummary | null;
  mlSummary?: MLSummary | null;
  cleaningSummary?: CleaningSummary | null;
  contract?: ProjectContract | null;
}

export const Capa6Storytelling: React.FC<Capa6StorytellingProps> = ({
  report,
  decisionLog,
  cleanedData,
  rawData,
  onOpenArtifactsModal,
  isProcessing,
  edaSummary,
  inferentialSummary,
  mlSummary,
  cleaningSummary,
  contract,
}) => {
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingMd, setIsExportingMd] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [isPreviewMdOpen, setIsPreviewMdOpen] = useState(false);

  if (!report) {
    return (
      <div className="bg-white p-12 border border-black/10 text-center font-serif">
        <p className="text-gray-500 italic">Compilando el informe ejecutivo en 7 apartados oficiales...</p>
      </div>
    );
  }

  const effectiveContract = contract || decisionLog?.contract || report.contract;
  const effectiveEda = edaSummary || report.edaSummary;
  const effectiveInferential = inferentialSummary || report.inferentialSummary;
  const effectiveMl = mlSummary || report.mlSummary;
  const effectiveCleaning = cleaningSummary || report.cleaningSummary;

  const generateMarkdownContent = (): string => {
    return PipelineExporter.generateMarkdownReport(report, effectiveContract || decisionLog, {
      edaSummary: effectiveEda,
      inferentialSummary: effectiveInferential,
      mlSummary: effectiveMl,
      cleaningSummary: effectiveCleaning,
      contract: effectiveContract,
    });
  };

  const handleDownloadMarkdown = () => {
    setIsExportingMd(true);
    try {
      const mdContent = generateMarkdownContent();
      const seed = effectiveContract?.randomSeed || decisionLog?.randomSeed || 42;
      const target = effectiveContract?.targetVariable ? effectiveContract.targetVariable.replace(/[^a-zA-Z0-9_]/g, '_') : 'resumen';
      const filename = `informe_ejecutivo_pareto_${target}_seed${seed}.md`;
      
      downloadBlob(new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' }), filename);
    } catch (err) {
      console.error('Error generating Markdown report:', err);
    } finally {
      setTimeout(() => setIsExportingMd(false), 1200);
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      const mdContent = generateMarkdownContent();
      await navigator.clipboard.writeText(mdContent);
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2500);
    } catch (err) {
      console.error('Error copying Markdown:', err);
    }
  };

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
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          {/* Main Markdown Download Button */}
          <button
            id="btn-download-markdown-report"
            onClick={handleDownloadMarkdown}
            disabled={isExportingMd}
            className="flex items-center space-x-2 px-4 py-2 bg-[#E63946] hover:bg-[#D90429] active:bg-[#C90022] text-white text-xs font-mono uppercase tracking-wider rounded-none transition cursor-pointer shadow-xs"
            title="Descargar resumen completo formateado en Markdown estructurado con tablas visuales y conclusiones de negocio"
          >
            {isExportingMd ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            <span>{isExportingMd ? 'Generando...' : 'Descargar Markdown (.md)'}</span>
          </button>

          {/* Markdown Quick Actions: Copy & Preview */}
          <button
            id="btn-copy-markdown"
            onClick={handleCopyMarkdown}
            className={`flex items-center space-x-1.5 px-3 py-2 border text-xs font-mono uppercase tracking-wider transition cursor-pointer ${
              copiedMd 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                : 'border-black/20 hover:border-black text-[#1A1A1A] bg-white'
            }`}
            title="Copiar código Markdown al portapapeles (compatible con Obsidian, Notion, GitHub)"
          >
            {copiedMd ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-gray-600" />}
            <span>{copiedMd ? '¡Copiado!' : 'Copiar MD'}</span>
          </button>

          <button
            id="btn-preview-markdown"
            onClick={() => setIsPreviewMdOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 border border-black/20 hover:border-black text-xs font-mono uppercase tracking-wider text-[#1A1A1A] bg-white transition cursor-pointer"
            title="Ver vista previa del código Markdown estructurado"
          >
            <Eye className="h-3.5 w-3.5 text-gray-600" />
            <span>Vista Previa MD</span>
          </button>

          <button
            id="btn-download-docx-storytelling"
            onClick={handleDownloadDocx}
            disabled={isExportingDocx}
            className="flex items-center space-x-2 px-3 py-2 bg-[#1A1A1A] hover:bg-black text-white text-xs font-mono uppercase tracking-wider rounded-none transition cursor-pointer"
          >
            {isExportingDocx ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5 text-gray-300" />}
            <span>Word (.docx)</span>
          </button>
          
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-2 border border-black/20 hover:border-black text-xs font-mono uppercase tracking-wider text-[#1A1A1A] bg-white transition cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Markdown Quick Highlights Banner */}
      <div className="bg-[#FAF8F5] border border-black/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-black text-white shrink-0 mt-0.5">
            <FileCode className="h-4 w-4 text-[#E63946]" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
              <span>Resumen Ejecutivo en Markdown Limpio & Estilizado</span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold">Listo para Obsidian / Notion / GitHub</span>
            </div>
            <p className="text-xs font-serif italic text-gray-600 mt-1">
              Incluye las 7 secciones oficiales, las conclusiones ejecutivas de todos los gráficos Pareto, tablas de contraste de hipótesis corregidas por FDR, torneo de Machine Learning y recomendaciones 20/80.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
          <button
            onClick={handleDownloadMarkdown}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-1.5 bg-[#1A1A1A] hover:bg-black text-white text-xs font-mono uppercase tracking-wider transition cursor-pointer"
          >
            <Download className="h-3 w-3 text-[#E63946]" />
            <span>Descargar .md</span>
          </button>
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center justify-center space-x-1 px-3 py-1.5 border border-black/20 bg-white hover:border-black text-xs font-mono uppercase tracking-wider text-[#1A1A1A] transition cursor-pointer"
          >
            {copiedMd ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-gray-500" />}
            <span>{copiedMd ? 'Listo' : 'Copiar'}</span>
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
                          <span className="font-bold text-[#1A1A1A]">{ev.sourceLayer || 'Capa Analítica'}</span>
                          <span className="text-[10px] uppercase px-1.5 py-0.5 bg-black/5 text-gray-700">
                            {ev.type}
                          </span>
                        </div>
                        <div className="text-sm font-serif italic text-gray-700">
                          {ev.metricOrTest || ev.description}
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
            <span>Semilla: RNG={effectiveContract?.randomSeed || decisionLog?.randomSeed || 42}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-black/10">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#1A1A1A] hover:bg-black text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            <FileText className="h-4 w-4 text-[#E63946]" />
            <span>Descargar Informe Markdown (.md)</span>
          </button>
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center space-x-2 px-4 py-2.5 border border-black/20 hover:border-black bg-white font-mono text-xs uppercase tracking-wider text-[#1A1A1A] transition-colors cursor-pointer"
          >
            {copiedMd ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-gray-600" />}
            <span>{copiedMd ? '¡Copiado!' : 'Copiar Markdown'}</span>
          </button>
        </div>

        <button
          onClick={onOpenArtifactsModal}
          className="flex items-center space-x-2 px-6 py-3 bg-[#E63946] hover:bg-[#D90429] active:bg-[#C90022] text-white font-mono text-xs uppercase tracking-widest transition-colors cursor-pointer shadow-sm"
        >
          <Download className="h-4 w-4" />
          <span>Descargar Todos los Artefactos del Proyecto</span>
        </button>
      </div>

      {/* Markdown Preview Modal */}
      {isPreviewMdOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-black/10 bg-[#FAF8F5]">
              <div className="flex items-center space-x-2">
                <FileCode className="h-5 w-5 text-[#E63946]" />
                <div>
                  <h4 className="font-serif font-bold text-[#1A1A1A] text-lg">
                    Vista Previa del Informe Markdown (.md)
                  </h4>
                  <p className="text-xs font-mono text-gray-500">
                    Estructura en 7 apartados + Conclusiones Visuales + Tablas Estadísticas
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyMarkdown}
                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition cursor-pointer flex items-center space-x-1.5 ${
                    copiedMd ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'border-black/20 hover:border-black text-black bg-white'
                  }`}
                >
                  {copiedMd ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedMd ? '¡Copiado!' : 'Copiar'}</span>
                </button>
                <button
                  onClick={handleDownloadMarkdown}
                  className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-[#1A1A1A] hover:bg-black text-white transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Download className="h-3 w-3 text-[#E63946]" />
                  <span>Descargar</span>
                </button>
                <button
                  onClick={() => setIsPreviewMdOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-black border border-black/10 hover:border-black transition cursor-pointer ml-2"
                  aria-label="Cerrar modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Code Viewer */}
            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs bg-[#1A1A1A] text-gray-100 leading-relaxed space-y-1 select-text">
              <pre className="whitespace-pre-wrap font-mono text-xs">
                {generateMarkdownContent()}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-black/10 bg-[#FAF8F5] flex items-center justify-between text-xs font-mono text-gray-500">
              <span>Formato estándar Markdown con Frontmatter YAML y tablas GitHub Flavored Markdown (GFM)</span>
              <button
                onClick={() => setIsPreviewMdOpen(false)}
                className="px-4 py-1.5 border border-black/20 hover:border-black text-[#1A1A1A] uppercase tracking-wider bg-white transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

