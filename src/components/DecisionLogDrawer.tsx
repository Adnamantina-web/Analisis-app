import React from 'react';
import { 
  X, 
  Terminal, 
  Download, 
  ShieldCheck, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  Layers, 
  Clock, 
  Hash 
} from 'lucide-react';
import { DecisionLogEntry, ProjectContract } from '../types/pipeline';
import { ReportExporters } from '../lib/data-engine/exporters';

interface DecisionLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: DecisionLogEntry[];
  contract: ProjectContract | null;
}

export const DecisionLogDrawer: React.FC<DecisionLogDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  contract,
}) => {
  if (!isOpen) return null;

  const handleExportJson = () => {
    ReportExporters.exportDecisionLogJson(logs, contract);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
      <div className="bg-[#1A1A1A] text-white w-full max-w-xl h-full shadow-2xl flex flex-col justify-between border-l border-white/20 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-6 border-b border-white/10 flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#E63946] font-bold">
              <Terminal className="h-3.5 w-3.5" />
              <span>Auditoría Científica</span>
            </div>
            <h3 className="text-xl font-serif font-light text-white mt-1">
              Registro Inmutable de Decisiones
            </h3>
            <p className="text-xs font-mono text-white/50 mt-0.5">
              log_decisiones.json • {logs.length} eventos registrados
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/60 hover:text-white border border-transparent hover:border-white/20 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Logs List Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-white/40 italic font-serif">
              Inicia la ingesta o ejecuta las capas para ver el registro en vivo.
            </div>
          ) : (
            logs.map((log) => (
              <div 
                key={log.id}
                className="p-4 bg-white/5 border border-white/10 space-y-2 hover:border-white/30 transition"
              >
                <div className="flex items-center justify-between text-[10px] text-white/50">
                  <span className="px-2 py-0.5 bg-white/10 text-white uppercase font-bold">
                    Capa 0{log.layerNumber} // {log.layer}
                  </span>
                  <span>{new Date(log.timestamp).toLocaleTimeString('es-ES')}</span>
                </div>

                <div className="text-sm font-serif font-bold text-white">
                  {log.action}
                </div>

                <div className="text-xs font-sans text-white/70 leading-relaxed">
                  <strong className="text-white">Justificación:</strong> {log.rationale}
                </div>

                {log.parameterChanges && (
                  <div className="p-2 bg-black/40 border border-white/5 text-[11px] text-[#E63946] overflow-x-auto">
                    <code>{JSON.stringify(log.parameterChanges)}</code>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-6 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-mono">
            <ShieldCheck className="h-4 w-4" />
            <span>Trazabilidad 100%</span>
          </div>

          <button
            onClick={handleExportJson}
            disabled={logs.length === 0}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white text-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#FAF8F5] transition cursor-pointer disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};
