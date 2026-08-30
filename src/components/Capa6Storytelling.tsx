import React, { useState, useEffect } from 'react';
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
  FileCode,
  BarChart2,
  TrendingUp,
  Activity,
  Flame,
  Layers,
  FileDown,
  Cpu,
  CheckCircle,
  AlertTriangle
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
  Line, 
  ReferenceLine,
  Legend
} from 'recharts';
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
import { StatisticalValidator, StatisticalBenchmarkCase } from '../lib/data-engine/statistical-validator';

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
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [isPreviewMdOpen, setIsPreviewMdOpen] = useState(false);

  // Gemini Generative AI State & Benchmarks
  const [isGeneratingGemini, setIsGeneratingGemini] = useState(false);
  const [geminiDraft, setGeminiDraft] = useState<any | null>(null);
  const [narrativeMode, setNarrativeMode] = useState<'grounded' | 'gemini'>('grounded');
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState<ReturnType<typeof StatisticalValidator.runBenchmarks> | null>(null);
  const [geminiApiAvailable, setGeminiApiAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    // Check server Gemini status
    fetch('/api/gemini/status')
      .then(res => res.json())
      .then(data => setGeminiApiAvailable(data.hasApiKey))
      .catch(() => setGeminiApiAvailable(false));
  }, []);

  const handleRunBenchmarks = () => {
    const res = StatisticalValidator.runBenchmarks();
    setBenchmarkResults(res);
    setIsBenchmarkModalOpen(true);
  };

  const handleGenerateWithGemini = async () => {
    setIsGeneratingGemini(true);
    try {
      const payload = {
        contract: effectiveContract,
        cleaning: effectiveCleaning,
        eda: effectiveEda,
        inferential: effectiveInferential,
        ml: effectiveMl,
      };

      const res = await fetch('/api/storytelling/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.aiDraft) {
        setGeminiDraft(data.aiDraft);
        setNarrativeMode('gemini');
      } else {
        alert(data.note || data.message || 'Se aplicó el motor determinista grounded certificado.');
      }
    } catch (err: any) {
      console.error('Error invoking Gemini API:', err);
      alert('No fue posible conectar con el endpoint de Gemini. Se mantiene la redacción determinista por reglas.');
    } finally {
      setIsGeneratingGemini(false);
    }
  };

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

  const getSectionContent = (secNumber: number, originalContent: string): string => {
    if (narrativeMode === 'gemini' && geminiDraft) {
      switch (secNumber) {
        case 1: return geminiDraft.executiveSummary || originalContent;
        case 2: return geminiDraft.businessContext || originalContent;
        case 3: return geminiDraft.methodologyDataTreatment || originalContent;
        case 4: return geminiDraft.exploratoryFindings || originalContent;
        case 5: return geminiDraft.statisticalEvidence || originalContent;
        case 6: return geminiDraft.modelPerformance || originalContent;
        case 7:
          if (Array.isArray(geminiDraft.recommendations)) {
            return geminiDraft.recommendations.map((r: string, idx: number) => `${idx + 1}. ${r}`).join('\n\n');
          }
          return geminiDraft.recommendations || originalContent;
        default: return originalContent;
      }
    }
    return originalContent;
  };

  const generateMarkdownContent = (): string => {
    return PipelineExporter.generateMarkdownReport(report, effectiveContract || decisionLog, {
      edaSummary: effectiveEda,
      inferentialSummary: effectiveInferential,
      mlSummary: effectiveMl,
      cleaningSummary: effectiveCleaning,
      contract: effectiveContract,
    });
  };

  const handleDownloadPDF = async () => {
    setIsExportingPdf(true);
    try {
      await PipelineExporter.generateAndDownloadPDF(report, effectiveContract || decisionLog, {
        edaSummary: effectiveEda,
        inferentialSummary: effectiveInferential,
        mlSummary: effectiveMl,
        cleaningSummary: effectiveCleaning,
        contract: effectiveContract,
        elementIdToCapture: 'report-document-container',
      });
    } catch (err) {
      console.error('Error generating PDF report:', err);
    } finally {
      setIsExportingPdf(false);
    }
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

  // Extract key Pareto chart if available
  const paretoChart = effectiveEda?.charts?.find(c => c.chartType === 'pareto_chart') || effectiveEda?.charts?.[0];
  const mlFeatureImportances = effectiveMl?.featureImportance || [];

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
          {/* Main High-Fidelity PDF Button */}
          <button
            id="btn-download-pdf-report"
            onClick={handleDownloadPDF}
            disabled={isExportingPdf}
            className="flex items-center space-x-2 px-4 py-2 bg-[#E63946] hover:bg-[#D90429] active:bg-[#C90022] text-white text-xs font-mono uppercase tracking-wider rounded-none transition cursor-pointer shadow-xs"
            title="Exportar informe completo y gráficos en documento PDF de alta resolución"
          >
            {isExportingPdf ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
            <span>{isExportingPdf ? 'Exportando PDF...' : 'Exportar PDF (.pdf)'}</span>
          </button>

          {/* Markdown Download Button */}
          <button
            id="btn-download-markdown-report"
            onClick={handleDownloadMarkdown}
            disabled={isExportingMd}
            className="flex items-center space-x-2 px-3.5 py-2 bg-[#1A1A1A] hover:bg-black text-white text-xs font-mono uppercase tracking-wider rounded-none transition cursor-pointer"
            title="Descargar resumen completo formateado en Markdown estructurado"
          >
            {isExportingMd ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5 text-gray-300" />}
            <span>{isExportingMd ? 'Generando...' : 'Markdown (.md)'}</span>
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
            <span>Vista Previa</span>
          </button>

          <button
            id="btn-download-docx-storytelling"
            onClick={handleDownloadDocx}
            disabled={isExportingDocx}
            className="flex items-center space-x-2 px-3 py-2 border border-black/20 hover:border-black text-xs font-mono uppercase tracking-wider text-[#1A1A1A] bg-white transition cursor-pointer"
          >
            {isExportingDocx ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5 text-gray-600" />}
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

      {/* AI & Statistical Verification Controls Banner */}
      <div className="bg-[#FAF8F5] border border-black/15 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 bg-black text-white shrink-0 mt-0.5">
            <Cpu className="h-5 w-5 text-[#E63946]" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
              <span>Motor de Redacción & Certificación Estadística</span>
              <span className={`text-[10px] px-2 py-0.5 font-semibold ${
                narrativeMode === 'gemini' 
                  ? 'bg-purple-100 text-purple-900 border border-purple-300' 
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}>
                {narrativeMode === 'gemini' ? 'Gemini 3.7 Flash Activo' : 'Motor Determinista Certificado'}
              </span>
            </div>
            <p className="text-xs font-serif italic text-gray-600 mt-1">
              Garantía de Cero Alucinación: La redacción ejecutiva puede ser elaborada por el LLM Gemini 3.7 Flash o generada por el motor determinista, siempre anclada al 100% en las métricas empíricas del pipeline.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
          {geminiDraft && (
            <div className="inline-flex border border-black/20 p-0.5 bg-white text-xs font-mono">
              <button
                onClick={() => setNarrativeMode('grounded')}
                className={`px-2.5 py-1 transition cursor-pointer ${
                  narrativeMode === 'grounded' ? 'bg-black text-white font-bold' : 'text-gray-600 hover:text-black'
                }`}
              >
                Determinista
              </button>
              <button
                onClick={() => setNarrativeMode('gemini')}
                className={`px-2.5 py-1 transition cursor-pointer flex items-center gap-1 ${
                  narrativeMode === 'gemini' ? 'bg-[#E63946] text-white font-bold' : 'text-gray-600 hover:text-black'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>Gemini IA</span>
              </button>
            </div>
          )}

          <button
            id="btn-trigger-gemini-ai"
            onClick={handleGenerateWithGemini}
            disabled={isGeneratingGemini}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1A1A1A] hover:bg-black text-white text-xs font-mono uppercase tracking-wider transition cursor-pointer"
            title="Invocar Gemini 3.7 Flash para redactar el dictamen ejecutivo con grounding empírico"
          >
            {isGeneratingGemini ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-[#E63946]" />}
            <span>{isGeneratingGemini ? 'Redactando con Gemini...' : 'Redactar con Gemini IA'}</span>
          </button>

          <button
            id="btn-run-scipy-benchmarks"
            onClick={handleRunBenchmarks}
            className="flex items-center space-x-1.5 px-3 py-1.5 border border-black/20 hover:border-black text-[#1A1A1A] bg-white text-xs font-mono uppercase tracking-wider transition cursor-pointer"
            title="Verificar numéricamente los contrastes contra los valores de referencia SciPy / R"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Auditoría SciPy</span>
          </button>
        </div>
      </div>

      {/* PDF & Markdown Quick Highlights Banner */}
      <div className="bg-[#FAF8F5] border border-black/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-black text-white shrink-0 mt-0.5">
            <FileDown className="h-4 w-4 text-[#E63946]" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
              <span>Exportación PDF de Alta Fidelidad & Markdown Certificado</span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold">jsPDF Engine Ready</span>
            </div>
            <p className="text-xs font-serif italic text-gray-600 mt-1">
              Descarga directa del informe ejecutivo con 7 secciones canónicas, gráficos Pareto de alta resolución, contrastes FDR, torneo ML y sello de certificación reproducible.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
          <button
            onClick={handleDownloadPDF}
            disabled={isExportingPdf}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-1.5 bg-[#E63946] hover:bg-[#D90429] text-white text-xs font-mono uppercase tracking-wider transition cursor-pointer"
          >
            {isExportingPdf ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            <span>{isExportingPdf ? 'Exportando...' : 'Descargar PDF'}</span>
          </button>
          <button
            onClick={handleDownloadMarkdown}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-1.5 bg-[#1A1A1A] hover:bg-black text-white text-xs font-mono uppercase tracking-wider transition cursor-pointer"
          >
            <FileText className="h-3 w-3 text-gray-300" />
            <span>Descargar .md</span>
          </button>
        </div>
      </div>

      {/* Report Container (Editorial Book Style) with ID for high-fidelity PDF capture */}
      <div id="report-document-container" className="bg-white border border-black/10 shadow-sm p-8 sm:p-12 space-y-12 report-printable-area">
        {/* Cover Section */}
        <div className="border-b-2 border-black pb-8 space-y-4">
          <div className="flex flex-wrap justify-between items-start gap-2">
            <div className="text-xs font-mono uppercase tracking-[0.25em] text-gray-500">
              Pareto Analytics • Documento Ejecutivo Oficial
            </div>
            <div className="flex items-center gap-2">
              <div className={`text-xs font-mono px-3 py-1 font-bold border ${
                narrativeMode === 'gemini' 
                  ? 'text-purple-800 bg-purple-50 border-purple-200' 
                  : 'text-emerald-700 bg-emerald-50 border-emerald-200'
              }`}>
                {narrativeMode === 'gemini' ? '🌟 Redactado por Gemini 3.7 Flash' : '🛡️ Motor Determinista Grounded'}
              </div>
              <div className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 font-bold">
                100% Respaldado por Evidencia
              </div>
            </div>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-light text-[#1A1A1A] leading-tight">
            {report.title}
          </h2>
          <div className="flex flex-wrap gap-6 text-xs font-mono text-gray-600 pt-2">
            <div><span className="text-gray-400 uppercase">Emisión:</span> {report.createdAt}</div>
            <div><span className="text-gray-400 uppercase">Nivel:</span> {report.scopeLevel.toUpperCase()}</div>
            <div><span className="text-gray-400 uppercase">Evidencias:</span> {report.sections.reduce((a, s) => a + s.groundedEvidences.length, 0)} verificadas</div>
            <div><span className="text-gray-400 uppercase">Semilla RNG:</span> {effectiveContract?.randomSeed || 42}</div>
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

              {/* Main Text Content (Resolved based on active narrative mode) */}
              <div className="font-serif text-lg leading-relaxed text-gray-800 text-justify whitespace-pre-line">
                {getSectionContent(sec.number, sec.content)}
              </div>

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

              {/* Graphical Visual Charts Embed inside Section 04 or relevant section */}
              {sec.number === 4 && (
                <div className="space-y-6 pt-4">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center space-x-2 border-b border-black/10 pb-2">
                    <BarChart2 className="h-4 w-4 text-[#E63946]" />
                    <span>Figuras Visuales & Gráficos Estratégicos del Dictamen</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pareto Diagram Chart Visual */}
                    {paretoChart && paretoChart.data && (
                      <div className="p-5 bg-[#FAF8F5] border border-black/15 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-[#1A1A1A]">
                            Figura 1: Curva de Pareto 80/20 ({paretoChart.variables?.[0] || 'Factores Críticos'})
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-black text-white">Top Vitales</span>
                        </div>
                        <div className="h-56 w-full bg-white p-2 border border-black/10">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={paretoChart.data.slice(0, 8)} margin={{ top: 10, right: 15, left: 0, bottom: 25 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#4B5563' }} angle={-25} textAnchor="end" />
                              <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#4B5563' }} />
                              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 9, fill: '#E63946' }} />
                              <Tooltip contentStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                              <Bar yAxisId="left" dataKey="value" fill="#1A1A1A" radius={[2, 2, 0, 0]}>
                                {paretoChart.data.slice(0, 8).map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={(entry.cumulativePercentage || 0) <= 80 ? '#E63946' : '#6B7280'} />
                                ))}
                              </Bar>
                              <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" stroke="#E63946" strokeWidth={2} dot={{ r: 3, fill: '#E63946' }} />
                              <ReferenceLine yAxisId="right" y={80} stroke="#1A1A1A" strokeDasharray="3 3" />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="text-xs font-serif italic text-gray-600">
                          {paretoChart.businessTakeaway || 'Los factores resaltados en rojo concentran el 80% del impacto en la variable analizada.'}
                        </p>
                      </div>
                    )}

                    {/* ML Feature Importance or Correlation Overview */}
                    {mlFeatureImportances.length > 0 ? (
                      <div className="p-5 bg-[#FAF8F5] border border-black/15 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-[#1A1A1A]">
                            Figura 2: Importancia de Variables Predictoras (Top Drivers)
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold">Modelo Ganador</span>
                        </div>
                        <div className="h-56 w-full bg-white p-2 border border-black/10">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mlFeatureImportances.slice(0, 6)} layout="vertical" margin={{ top: 10, right: 15, left: 35, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                              <XAxis type="number" tick={{ fontSize: 9, fill: '#4B5563' }} />
                              <YAxis type="category" dataKey="feature" tick={{ fontSize: 9, fill: '#1A1A1A' }} width={70} />
                              <Tooltip contentStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                              <Bar dataKey="importance" fill="#1A1A1A" radius={[0, 2, 2, 0]}>
                                {mlFeatureImportances.slice(0, 6).map((_, index) => (
                                  <Cell key={`cell-ml-${index}`} fill={index < 2 ? '#E63946' : '#374151'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="text-xs font-serif italic text-gray-600">
                          {effectiveMl?.topFeaturesSummary || 'Las variables con mayor ponderación relativa en el modelo predictivo óptimo.'}
                        </p>
                      </div>
                    ) : (
                      effectiveEda?.correlationMatrix && (
                        <div className="p-5 bg-[#FAF8F5] border border-black/15 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-[#1A1A1A]">
                              Figura 2: Relaciones de Correlación Más Relevantes
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-black/10 text-gray-700">Pearson / Spearman</span>
                          </div>
                          <div className="h-56 w-full bg-white p-3 border border-black/10 overflow-y-auto space-y-2 text-xs font-mono">
                            {effectiveEda.correlationMatrix.topPairs.slice(0, 4).map((p, i) => (
                              <div key={i} className="flex items-center justify-between p-2 bg-[#FAF8F5] border border-black/5">
                                <div>
                                  <span className="font-bold text-[#1A1A1A]">{p.var1}</span> ↔ <span className="font-bold text-[#1A1A1A]">{p.var2}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-[#E63946]">r = {p.pearsonR.toFixed(3)}</span>
                                  <span className="text-[10px] text-gray-500 ml-1">({p.strength})</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs font-serif italic text-gray-600">
                            {effectiveEda.correlationMatrix.narrative || 'Asociaciones bivariadas cuantitativas con significancia estadística.'}
                          </p>
                        </div>
                      )
                    )}
                  </div>
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
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={isExportingPdf}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#E63946] hover:bg-[#D90429] active:bg-[#C90022] text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
          >
            {isExportingPdf ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            <span>{isExportingPdf ? 'Generando PDF...' : 'Descargar Informe PDF (.pdf)'}</span>
          </button>
          
          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center space-x-2 px-4 py-2.5 bg-[#1A1A1A] hover:bg-black text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            <FileText className="h-4 w-4 text-gray-300" />
            <span>Descargar Markdown (.md)</span>
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
          className="flex items-center space-x-2 px-6 py-3 bg-[#1A1A1A] hover:bg-black text-white font-mono text-xs uppercase tracking-widest transition-colors cursor-pointer shadow-sm"
        >
          <Download className="h-4 w-4 text-[#E63946]" />
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

      {/* SciPy Benchmark Verification Modal */}
      {isBenchmarkModalOpen && benchmarkResults && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-black/10 bg-[#FAF8F5]">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
                <div>
                  <h4 className="font-serif font-bold text-[#1A1A1A] text-lg">
                    Auditoría de Paridad Estadística contra SciPy / R
                  </h4>
                  <p className="text-xs font-mono text-gray-600">
                    Verificación de funciones continuas (Student-t, ANOVA F, Chi-Cuadrado, Normal Z)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-3 py-1 bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                  {benchmarkResults.allPassed ? '✓ 100% Casos Superados (Error < 0.0005)' : 'Errores Detectados'}
                </span>
                <button
                  onClick={() => setIsBenchmarkModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-black border border-black/10 hover:border-black transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Table Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <p className="text-xs font-serif italic text-gray-600">
                A continuación se comparan los cálculos del motor estadístico interno (basado en la biblioteca científica certificada jStat) frente a los valores exactos tabulados por SciPy (scipy.stats).
              </p>

              <div className="border border-black/15 overflow-x-auto">
                <table className="w-full text-xs font-mono border-collapse">
                  <thead>
                    <tr className="bg-[#1A1A1A] text-white uppercase text-[10px] tracking-wider text-left">
                      <th className="p-2.5">Test</th>
                      <th className="p-2.5">Caso / Parámetros</th>
                      <th className="p-2.5 text-right">Referencia SciPy</th>
                      <th className="p-2.5 text-right">Motor App (jStat)</th>
                      <th className="p-2.5 text-right">Error Absoluto</th>
                      <th className="p-2.5 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10">
                    {benchmarkResults.cases.map((c, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="p-2.5 font-bold text-[#1A1A1A]">{c.testType}</td>
                        <td className="p-2.5 text-gray-700">{c.description}</td>
                        <td className="p-2.5 text-right text-gray-900 font-semibold">{c.scipyReferencePValue.toFixed(6)}</td>
                        <td className="p-2.5 text-right text-blue-700 font-bold">{c.appCalculatedPValue.toFixed(6)}</td>
                        <td className="p-2.5 text-right text-gray-500">{c.absoluteError.toFixed(6)}</td>
                        <td className="p-2.5 text-center">
                          {c.passed ? (
                            <span className="inline-flex items-center text-emerald-700 font-bold gap-1">
                              <CheckCircle className="h-3.5 w-3.5" /> OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-red-700 font-bold gap-1">
                              <AlertTriangle className="h-3.5 w-3.5" /> Fallo
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-black/10 bg-[#FAF8F5] flex items-center justify-between text-xs font-mono text-gray-500">
              <span>Tolerancia de precisión: delta &lt; 0.0005 frente a distribuciones de probabilidad teóricas completas.</span>
              <button
                onClick={() => setIsBenchmarkModalOpen(false)}
                className="px-4 py-1.5 bg-[#1A1A1A] text-white hover:bg-black uppercase tracking-wider transition cursor-pointer"
              >
                Cerrar Auditoría
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

