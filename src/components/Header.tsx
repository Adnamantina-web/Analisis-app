import React from 'react';
import { 
  Sparkles, 
  Download, 
  Database, 
  Menu, 
  X, 
  Layers, 
  Play, 
  RefreshCw, 
  ShieldCheck 
} from 'lucide-react';
import { SAMPLE_DATASETS } from '../lib/data-engine/sample-datasets';
import { ProjectContract } from '../types/pipeline';

interface HeaderProps {
  contract: ProjectContract | null;
  selectedSampleId: string;
  onSelectSampleDataset: (id: string) => void;
  onRunFullPipeline: () => void;
  onOpenArtifactsModal: () => void;
  isProcessing: boolean;
  currentLayer: number;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  contract,
  selectedSampleId,
  onSelectSampleDataset,
  onRunFullPipeline,
  onOpenArtifactsModal,
  isProcessing,
  currentLayer,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const currentDataset = SAMPLE_DATASETS.find(d => d.id === selectedSampleId);
  const contractId = contract ? `PRJ-${String(contract.randomSeed).padStart(4, '0')}` : 'PRJ-PARETO';

  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-black/10 pb-6 mb-8 gap-6">
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-black border border-black/20 rounded hover:bg-black/5"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-gray-500">
            Proyecto Contract: <span className="font-semibold text-black">{contractId}</span>
          </div>
          {contract?.targetVariable && (
            <span className="hidden sm:inline-block px-2 py-0.5 bg-black/5 border border-black/10 rounded text-[11px] font-mono text-gray-700">
              Target: <span className="font-bold text-[#E63946]">{contract.targetVariable}</span>
            </span>
          )}
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-light leading-none tracking-tight text-[#1A1A1A]">
          {currentDataset ? (
            <>
              {currentDataset.name.split(':')[0]} <br />
              <span className="italic text-gray-400 text-2xl sm:text-3xl lg:text-4xl">
                {currentDataset.name.split(':')[1] || currentDataset.category}
              </span>
            </>
          ) : (
            <>
              Análisis Exploratorio & Inferencia <br />
              <span className="italic text-gray-400 text-2xl sm:text-3xl lg:text-4xl">
                {contract?.businessQuestion ? contract.businessQuestion.slice(0, 48) + '...' : 'Pipeline Analítico Pareto 20/80'}
              </span>
            </>
          )}
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
        {/* Sample Dataset Picker */}
        <div className="relative inline-flex items-center">
          <select
            value={selectedSampleId}
            onChange={(e) => onSelectSampleDataset(e.target.value)}
            disabled={isProcessing}
            className="appearance-none bg-white border border-black/30 rounded-full px-4 py-2 pr-8 text-xs font-mono font-medium uppercase tracking-wider text-[#1A1A1A] hover:border-black cursor-pointer focus:outline-none shadow-2xs"
          >
            <option value="custom">📁 Archivo Propio...</option>
            {SAMPLE_DATASETS.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.name.split(':')[0]} ({ds.category})
              </option>
            ))}
          </select>
          <Database className="h-3 w-3 absolute right-3 text-gray-500 pointer-events-none" />
        </div>

        {/* Run Full Pipeline */}
        <button
          id="btn-run-full-pipeline"
          onClick={onRunFullPipeline}
          disabled={isProcessing}
          className="flex items-center space-x-2 px-4 py-2 bg-[#E63946] hover:bg-[#D90429] active:bg-[#C90022] text-white rounded-full text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
        >
          {isProcessing ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          <span>{isProcessing ? 'Procesando 6 Capas...' : 'Ejecutar 6 Capas'}</span>
        </button>

        {/* Export Full Report */}
        <button
          id="btn-export-full-report"
          onClick={onOpenArtifactsModal}
          className="px-4 py-2 border border-black rounded-full text-xs font-bold uppercase tracking-wider text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
        >
          Exportar Full Report
        </button>
      </div>
    </header>
  );
};
