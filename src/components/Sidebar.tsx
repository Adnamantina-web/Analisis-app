import React from 'react';
import { 
  FileSpreadsheet, 
  Target, 
  Sparkles, 
  BarChart2, 
  Scale, 
  BrainCircuit, 
  FileCheck2, 
  Check, 
  Layers, 
  ShieldCheck, 
  Download, 
  Terminal 
} from 'lucide-react';
import { 
  ProjectContract, 
  IngestSummary, 
  CleaningSummary, 
  EDASummary, 
  InferentialSummary, 
  MLSummary, 
  FinalReport 
} from '../types/pipeline';

interface SidebarProps {
  currentLayer: number;
  setCurrentLayer: (layer: number) => void;
  contract: ProjectContract | null;
  ingestSummary?: IngestSummary | null;
  cleaningSummary?: CleaningSummary | null;
  edaSummary?: EDASummary | null;
  inferentialSummary?: InferentialSummary | null;
  mlSummary?: MLSummary | null;
  finalReport?: FinalReport | null;
  decisionLogCount?: number;
  onOpenDecisionLogs?: () => void;
  onOpenArtifactsModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentLayer,
  setCurrentLayer,
  contract,
  ingestSummary,
  cleaningSummary,
  edaSummary,
  inferentialSummary,
  mlSummary,
  finalReport,
  decisionLogCount = 0,
  onOpenDecisionLogs,
  onOpenArtifactsModal,
}) => {
  const steps = [
    { index: 0, num: '00', name: 'Ingesta', desc: 'DataSource & Esquema', isDone: Boolean(ingestSummary) },
    { index: 1, num: '01', name: 'Estrategia', desc: 'Contrato de Negocio', isDone: Boolean(contract?.businessQuestion) },
    { index: 2, num: '02', name: 'Limpieza', desc: 'Nulos, Outliers & Tipos', isDone: Boolean(cleaningSummary) },
    { index: 3, num: '03', name: 'EDA', desc: 'Visual 80/20 & KDE', isDone: Boolean(edaSummary) },
    { index: 4, num: '04', name: 'Inferencia', desc: 'Supuestos & Tests (FDR)', isDone: Boolean(inferentialSummary) },
    { index: 5, num: '05', name: 'M. Learning', desc: 'Split 70/30 & K-Means', isDone: Boolean(mlSummary) },
    { index: 6, num: '06', name: 'Informe', desc: 'Storytelling 7 Partes', isDone: Boolean(finalReport) },
  ];

  const phaseNames: Record<number, string> = {
    0: 'Capa 0: Ingesta & Esquema',
    1: 'Capa 1: Contrato de Negocio',
    2: 'Capa 2: Saneamiento de Datos',
    3: 'Capa 3: Exploración Pareto',
    4: 'Capa 4: Evidencia Estadística',
    5: 'Capa 5: Modelado Predictivo',
    6: 'Capa 6: Deliverables & Reporte',
  };

  const scopeLevel = contract?.scopeLevel || 'predictive';

  return (
    <aside className="bg-[#1A1A1A] text-white p-6 sm:p-8 border border-black shadow-sm flex flex-col justify-between select-none">
      <div className="space-y-8">
        {/* Brand */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/50 mb-1">
            Data Science Suite
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif italic leading-tight tracking-tight text-white">
            Pareto<br />Analytics
          </h2>
          <div className="mt-2 inline-flex items-center space-x-1.5 px-2 py-0.5 bg-white/10 border border-white/20 text-[10px] font-mono text-white/80">
            <span>Principio 20/80</span>
            <span>•</span>
            <span>SEED={contract?.randomSeed || 42}</span>
          </div>
        </div>

        {/* Layer Navigation */}
        <nav className="space-y-4" aria-label="Pipeline Layers Navigation">
          {steps.map((step) => {
            const isActive = currentLayer === step.index;
            const isDisabled =
              (scopeLevel === 'descriptive' && (step.index === 4 || step.index === 5)) ||
              (scopeLevel === 'inferential' && step.index === 5);

            return (
              <button
                key={step.index}
                id={`sidebar-step-${step.index}`}
                onClick={() => !isDisabled && setCurrentLayer(step.index)}
                disabled={isDisabled}
                className={`w-full flex items-center justify-between text-left transition group p-2 border ${
                  isActive
                    ? 'bg-white text-black border-white font-bold'
                    : step.isDone
                    ? 'bg-white/5 border-white/10 text-white hover:border-white/30'
                    : 'bg-transparent border-transparent text-white/40 hover:text-white/70'
                } ${isDisabled ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`text-xs font-mono transition-colors ${
                      isActive
                        ? 'text-[#E63946] font-bold'
                        : step.isDone
                        ? 'text-emerald-400 font-semibold'
                        : 'text-white/40'
                    }`}
                  >
                    {step.num}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-wider font-semibold">
                      {step.name}
                    </span>
                    <span className={`text-[10px] font-serif italic ${isActive ? 'text-gray-700' : 'text-white/40'}`}>
                      {step.desc}
                    </span>
                  </div>
                </div>

                {step.isDone && !isActive && (
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                )}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E63946] animate-pulse shrink-0"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="border-t border-white/20 pt-6 mt-6 space-y-4">
        <div>
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
            Capa Activa
          </div>
          <div className="text-sm font-serif italic text-white/90 truncate">
            {phaseNames[currentLayer] || 'Capa Activa'}
          </div>
        </div>

        {onOpenDecisionLogs && (
          <button
            onClick={onOpenDecisionLogs}
            className="w-full flex items-center justify-between py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/20 text-xs font-mono uppercase tracking-wider text-white transition cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Terminal className="h-3.5 w-3.5 text-[#E63946]" />
              <span>Log Decisiones</span>
            </div>
            <span className="px-1.5 py-0.2 bg-[#E63946] text-white text-[10px] font-bold rounded-full">
              {decisionLogCount}
            </span>
          </button>
        )}

        <button
          onClick={onOpenArtifactsModal}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-[#E63946] hover:bg-[#D90429] text-white text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer shadow-sm"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Exportar Suite</span>
        </button>

        <div className="text-[9px] font-mono text-white/30 tracking-tight flex items-center justify-between">
          <span>v1.0.4 • 6-Capas</span>
          <span className="text-emerald-400 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Determinista</span>
          </span>
        </div>
      </div>
    </aside>
  );
};
