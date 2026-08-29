import React from 'react';
import { 
  Database, 
  Sparkles, 
  Download, 
  FileText, 
  RefreshCw, 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  HelpCircle 
} from 'lucide-react';
import { SAMPLE_DATASETS } from '../lib/data-engine/sample-datasets';

interface NavbarProps {
  currentLayer: number;
  onSelectLayer: (layer: number) => void;
  onSelectSampleDataset: (id: string) => void;
  selectedSampleId: string;
  onRunFullPipeline: () => void;
  isProcessing: boolean;
  onOpenArtifactsModal: () => void;
  randomSeed: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLayer,
  onSelectLayer,
  onSelectSampleDataset,
  selectedSampleId,
  onRunFullPipeline,
  isProcessing,
  onOpenArtifactsModal,
  randomSeed,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-inner">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold tracking-tight text-white text-lg">DataFlow</span>
                <span className="bg-cyan-500/20 text-cyan-400 text-xs px-2 py-0.5 rounded-full font-mono font-medium border border-cyan-500/30">
                  Pareto 20/80
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Pipeline Analítico de 6 Capas & Inferencia</p>
            </div>
          </div>

          {/* Dataset Selector & Quick Actions */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-md text-xs">
              <Database className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-slate-400 font-medium">Dataset:</span>
              <select
                value={selectedSampleId}
                onChange={(e) => onSelectSampleDataset(e.target.value)}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option value="custom" className="bg-slate-900 text-slate-200">
                  📁 Archivo Personalizado...
                </option>
                {SAMPLE_DATASETS.map((ds) => (
                  <option key={ds.id} value={ds.id} className="bg-slate-900 text-slate-200">
                    {ds.name} ({ds.format.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Seed badge */}
            <div className="hidden md:flex items-center space-x-1.5 bg-slate-800/60 border border-slate-700/80 px-2.5 py-1.5 rounded-md text-xs font-mono text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Semilla={randomSeed}</span>
            </div>

            {/* Run full pipeline */}
            <button
              id="btn-run-full-pipeline"
              onClick={onRunFullPipeline}
              disabled={isProcessing}
              className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 disabled:opacity-50 text-white text-xs font-medium px-3.5 py-1.5 rounded-md shadow-sm transition"
            >
              {isProcessing ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span>{isProcessing ? 'Procesando...' : 'Ejecutar 6 Capas'}</span>
            </button>

            {/* Artifacts export modal */}
            <button
              id="btn-open-artifacts"
              onClick={onOpenArtifactsModal}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-md border border-slate-700 transition"
              title="Descargar datasets, informe y log de decisiones"
            >
              <Download className="h-3.5 w-3.5 text-slate-300" />
              <span className="hidden sm:inline">Artefactos</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
