import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  Code, 
  Database, 
  ShieldCheck, 
  Printer, 
  Check, 
  FileSpreadsheet,
  Layers
} from 'lucide-react';
import { 
  FinalReport, 
  ProjectContract, 
  CleaningSummary, 
  EDASummary, 
  InferentialSummary, 
  MLSummary, 
  DecisionLogEntry 
} from '../types/pipeline';
import { ReportExporters, downloadBlob } from '../lib/data-engine/exporters';

interface ArtifactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  finalReport: FinalReport | null;
  contract: ProjectContract | null;
  cleaningSummary?: CleaningSummary | null;
  edaSummary?: EDASummary | null;
  inferentialSummary?: InferentialSummary | null;
  mlSummary?: MLSummary | null;
  decisionLogs: DecisionLogEntry[];
  cleanedRows: Record<string, any>[];
}

export const ArtifactsModal: React.FC<ArtifactsModalProps> = ({
  isOpen,
  onClose,
  finalReport,
  contract,
  decisionLogs,
  cleanedRows,
}) => {
  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = async (format: 'markdown' | 'latex' | 'docx' | 'json' | 'csv' | 'print') => {
    const filenameBase = `pareto_analisis_${contract?.targetVariable || 'dataset'}_seed${contract?.randomSeed || 42}`;

    if (format === 'markdown') {
      if (finalReport && contract) {
        const md = ReportExporters.generateMarkdownReport(finalReport, contract);
        downloadBlob(new Blob([md], { type: 'text/markdown;charset=utf-8;' }), `${filenameBase}_informe.md`);
      }
    } else if (format === 'latex') {
      if (finalReport && contract) {
        const tex = ReportExporters.generateLatexReport(finalReport, contract);
        downloadBlob(new Blob([tex], { type: 'application/x-latex;charset=utf-8;' }), `${filenameBase}_informe.tex`);
      }
    } else if (format === 'docx') {
      if (finalReport && contract) {
        await ReportExporters.generateAndDownloadDocx(finalReport, contract);
      }
    } else if (format === 'json') {
      ReportExporters.exportDecisionLogJson(decisionLogs, contract);
    } else if (format === 'csv') {
      ReportExporters.exportCSV(cleanedRows, `${filenameBase}_limpio.csv`);
    } else if (format === 'print') {
      window.print();
    }

    setDownloadedFormat(format);
    setTimeout(() => setDownloadedFormat(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white border-2 border-black max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-black/10 pb-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 bg-black text-white">
                Exportación
              </span>
              <span className="text-xs font-mono text-gray-500">Suite de Entregables Reproducibles</span>
            </div>
            <h3 className="text-2xl font-serif font-light text-[#1A1A1A]">
              Exportar Artefactos del Pipeline
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-black border border-black/10 hover:border-black transition cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Artifacts List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Markdown Full Report */}
          <div className="p-4 border border-black/20 bg-[#FAF8F5] flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center space-x-2 text-[#1A1A1A] font-serif font-bold text-base">
                <FileText className="h-4 w-4 text-[#E63946]" />
                <span>Informe Markdown (.md)</span>
              </div>
              <p className="text-xs font-serif italic text-gray-600 mt-1">
                Documento de 7 secciones canónicas formateado con tablas estadísticas y citas de evidencia.
              </p>
            </div>
            <button
              onClick={() => handleDownload('markdown')}
              disabled={!finalReport}
              className="w-full py-2 bg-[#1A1A1A] hover:bg-black text-white text-xs font-mono uppercase tracking-wider flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
            >
              {downloadedFormat === 'markdown' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Download className="h-3.5 w-3.5" />}
              <span>{downloadedFormat === 'markdown' ? 'Descargado' : 'Descargar .MD'}</span>
            </button>
          </div>

          {/* 2. LaTeX Full Paper */}
          <div className="p-4 border border-black/20 bg-[#FAF8F5] flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center space-x-2 text-[#1A1A1A] font-serif font-bold text-base">
                <Code className="h-4 w-4 text-[#E63946]" />
                <span>Artículo LaTeX (.tex)</span>
              </div>
              <p className="text-xs font-serif italic text-gray-600 mt-1">
                Código fuente LaTeX académico listo para compilar en Overleaf con tablas y fórmulas.
              </p>
            </div>
            <button
              onClick={() => handleDownload('latex')}
              disabled={!finalReport}
              className="w-full py-2 bg-[#1A1A1A] hover:bg-black text-white text-xs font-mono uppercase tracking-wider flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
            >
              {downloadedFormat === 'latex' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Download className="h-3.5 w-3.5" />}
              <span>{downloadedFormat === 'latex' ? 'Descargado' : 'Descargar .TEX'}</span>
            </button>
          </div>

          {/* 3. Decision Log JSON */}
          <div className="p-4 border border-black/20 bg-[#FAF8F5] flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center space-x-2 text-[#1A1A1A] font-serif font-bold text-base">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                <span>Log Decisiones (.json)</span>
              </div>
              <p className="text-xs font-serif italic text-gray-600 mt-1">
                Registro inmutable de trazabilidad con timestamp, semillas y parámetros de cada capa.
              </p>
            </div>
            <button
              onClick={() => handleDownload('json')}
              className="w-full py-2 bg-[#1A1A1A] hover:bg-black text-white text-xs font-mono uppercase tracking-wider flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              {downloadedFormat === 'json' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Download className="h-3.5 w-3.5" />}
              <span>{downloadedFormat === 'json' ? 'Descargado' : 'Descargar .JSON'}</span>
            </button>
          </div>

          {/* 4. Cleaned Dataset CSV */}
          <div className="p-4 border border-black/20 bg-[#FAF8F5] flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center space-x-2 text-[#1A1A1A] font-serif font-bold text-base">
                <Database className="h-4 w-4 text-[#E63946]" />
                <span>Dataset Saneado (.csv)</span>
              </div>
              <p className="text-xs font-serif italic text-gray-600 mt-1">
                Datos procesados ({cleanedRows.length} filas) tras imputación heurística y depuración.
              </p>
            </div>
            <button
              onClick={() => handleDownload('csv')}
              disabled={cleanedRows.length === 0}
              className="w-full py-2 bg-[#1A1A1A] hover:bg-black text-white text-xs font-mono uppercase tracking-wider flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
            >
              {downloadedFormat === 'csv' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Download className="h-3.5 w-3.5" />}
              <span>{downloadedFormat === 'csv' ? 'Descargado' : 'Descargar .CSV'}</span>
            </button>
          </div>
        </div>

        {/* Print / PDF Option */}
        <div className="p-4 bg-[#1A1A1A] text-white flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-mono uppercase font-bold text-white flex items-center space-x-1.5">
              <Printer className="h-3.5 w-3.5 text-[#E63946]" />
              <span>Imprimir / Guardar como PDF</span>
            </div>
            <div className="text-[11px] font-serif italic text-white/60">
              Usa el diálogo del navegador para exportar un PDF ejecutivo formal.
            </div>
          </div>
          <button
            onClick={() => handleDownload('print')}
            className="px-4 py-2 bg-[#E63946] hover:bg-[#D90429] text-white font-mono text-xs uppercase font-bold rounded transition cursor-pointer"
          >
            Imprimir PDF
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-black/10">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-black/30 text-xs font-mono uppercase tracking-wider hover:border-black cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
