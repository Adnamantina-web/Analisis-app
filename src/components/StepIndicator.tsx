import React from 'react';
import { 
  FileSpreadsheet, 
  Target, 
  Sparkles, 
  BarChart2, 
  Scale, 
  BrainCircuit, 
  FileCheck2, 
  Check 
} from 'lucide-react';

export interface StepDef {
  index: number;
  label: string;
  shortName: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  isComplete: boolean;
}

interface StepIndicatorProps {
  currentLayer: number;
  onSelectLayer: (layer: number) => void;
  completedLayers: number[];
  scopeLevel: 'descriptive' | 'inferential' | 'predictive';
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentLayer,
  onSelectLayer,
  completedLayers,
  scopeLevel,
}) => {
  const steps: StepDef[] = [
    {
      index: 0,
      label: 'Capa 0: Ingesta',
      shortName: '00. Ingesta',
      icon: FileSpreadsheet,
      description: 'DataSource & Esquema',
      isComplete: completedLayers.includes(0),
    },
    {
      index: 1,
      label: 'Capa 1: Contrato',
      shortName: '01. Estrategia',
      icon: Target,
      description: 'Pregunta & Contrato',
      isComplete: completedLayers.includes(1),
    },
    {
      index: 2,
      label: 'Capa 2: Limpieza',
      shortName: '02. Limpieza',
      icon: Sparkles,
      description: 'Nulos, Outliers & Tipos',
      isComplete: completedLayers.includes(2),
    },
    {
      index: 3,
      label: 'Capa 3: EDA Visual',
      shortName: '03. EDA 80/20',
      icon: BarChart2,
      description: 'Suite Pareto & KDE',
      isComplete: completedLayers.includes(3),
    },
    {
      index: 4,
      label: 'Capa 4: Inferencia',
      shortName: '04. Inferencia',
      icon: Scale,
      description: 'Supuestos & Tests (FDR)',
      isComplete: completedLayers.includes(4),
    },
    {
      index: 5,
      label: 'Capa 5: ML Models',
      shortName: '05. Predictivo',
      icon: BrainCircuit,
      description: '70/30 Split & K-Means',
      isComplete: completedLayers.includes(5),
    },
    {
      index: 6,
      label: 'Capa 6: Informe',
      shortName: '06. Informe',
      icon: FileCheck2,
      description: 'Storytelling 7 Partes',
      isComplete: completedLayers.includes(6),
    },
  ];

  return (
    <div className="bg-white border-b border-black/10 px-4 py-2 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[720px] gap-2">
        {steps.map((step) => {
          const isActive = currentLayer === step.index;
          const isDone = step.isComplete;
          const isDisabled = (scopeLevel === 'descriptive' && (step.index === 4 || step.index === 5))
            || (scopeLevel === 'inferential' && step.index === 5);

          return (
            <button
              key={step.index}
              id={`step-nav-${step.index}`}
              onClick={() => !isDisabled && onSelectLayer(step.index)}
              disabled={isDisabled}
              className={`flex-1 flex items-center p-2 border transition text-left ${
                isActive
                  ? 'bg-[#1A1A1A] border-black text-white'
                  : isDone
                  ? 'bg-[#FAF8F5] border-black/20 text-[#1A1A1A] hover:border-black'
                  : 'bg-white border-black/10 text-gray-400 hover:border-black/30'
              } ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="overflow-hidden">
                <div className="flex items-center space-x-1.5">
                  <span className={`text-[11px] font-mono uppercase font-bold tracking-wider ${isActive ? 'text-[#E63946]' : isDone ? 'text-emerald-700' : 'text-gray-400'}`}>
                    {step.shortName}
                  </span>
                  {isDone && !isActive && (
                    <Check className="h-3 w-3 text-emerald-600 inline shrink-0" />
                  )}
                </div>
                <p className={`text-[10px] font-serif italic truncate ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                  {step.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
