import React from 'react';
import { 
  Target, 
  HelpCircle, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  ArrowRight, 
  Lock, 
  Sparkles, 
  Scale, 
  BrainCircuit, 
  Check 
} from 'lucide-react';
import { ColumnSchema, ProjectContract } from '../types/pipeline';

interface Capa1StrategyProps {
  contract: ProjectContract;
  columns: ColumnSchema[];
  onUpdateContract: (updated: Partial<ProjectContract>) => void;
  onProceedToCleaning: () => void;
  isProcessing: boolean;
}

export const Capa1Strategy: React.FC<Capa1StrategyProps> = ({
  contract,
  columns,
  onUpdateContract,
  onProceedToCleaning,
  isProcessing,
}) => {
  const numCols = columns.filter(c => c.detectedType === 'numeric');
  const catCols = columns.filter(c => c.detectedType === 'categorical' || c.detectedType === 'boolean');

  const handleTargetChange = (varName: string) => {
    if (varName === 'none' || !varName) {
      onUpdateContract({ targetVariable: null, targetType: 'none' });
      return;
    }
    const found = columns.find(c => c.name === varName);
    const isNum = found?.detectedType === 'numeric';
    onUpdateContract({
      targetVariable: varName,
      targetType: isNum ? 'quantitative' : 'qualitative',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 border border-black/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 bg-black text-white">
              Capa 01 // Estrategia
            </span>
            <span className="text-xs font-mono text-gray-500">Contrato de Proyecto Inmutable</span>
          </div>
          <h3 className="text-2xl font-serif font-light text-[#1A1A1A]">
            Definición del Contrato Analítico y Alcance Metodológico
          </h3>
          <p className="text-sm font-serif italic text-gray-600 max-w-3xl mt-1">
            Bloqueante metodológico: Ningún análisis posterior se ejecuta a ciegas. El contrato formaliza la pregunta de negocio, el target y el nivel de rigor del pipeline.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold flex items-center justify-end space-x-1">
            <Lock className="h-3.5 w-3.5" />
            <span>Contrato Firmado</span>
          </div>
          <div className="text-xs font-mono text-gray-500">log_decisiones.json</div>
        </div>
      </div>

      {/* Contract Form Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form Parameters */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Business Question */}
          <div className="bg-white p-6 sm:p-8 border border-black/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1A1A1A] uppercase tracking-[0.2em] font-mono flex items-center space-x-2">
                <span className="h-5 w-5 bg-black text-white flex items-center justify-center text-xs">1</span>
                <span>Pregunta Estratégica de Negocio</span>
              </label>
              <span className="text-[11px] font-serif italic text-gray-500">Guía todo el informe final</span>
            </div>
            <textarea
              rows={2}
              value={contract.businessQuestion}
              onChange={(e) => onUpdateContract({ businessQuestion: e.target.value })}
              className="w-full bg-[#FAF8F5] border border-black/20 p-4 text-sm font-serif text-[#1A1A1A] focus:outline-none focus:border-black transition"
              placeholder="Ej: ¿Cuáles son las variables clave que incrementan la probabilidad de conversión o de alta satisfacción?"
            />
          </div>

          {/* 2. Target Variable & Type */}
          <div className="bg-white p-6 sm:p-8 border border-black/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1A1A1A] uppercase tracking-[0.2em] font-mono flex items-center space-x-2">
                <span className="h-5 w-5 bg-black text-white flex items-center justify-center text-xs">2</span>
                <span>Variable Objetivo (Target de Negocio)</span>
              </label>
              {contract.targetVariable && (
                <span className="text-[11px] font-mono px-2 py-0.5 bg-black/5 text-black border border-black/10">
                  {contract.targetType === 'quantitative' ? 'Cuantitativa (Regresión/ANOVA)' : 'Cualitativa (Clasificación/Chi²)'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-1.5 block">Columna Target:</label>
                <select
                  value={contract.targetVariable || 'none'}
                  onChange={(e) => handleTargetChange(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-black/20 p-2.5 text-xs font-mono text-[#1A1A1A] focus:outline-none focus:border-black cursor-pointer"
                >
                  <option value="none">-- Sin variable objetivo única (EDA Global) --</option>
                  <optgroup label="Variables Cuantitativas (Numéricas)">
                    {numCols.map(c => (
                      <option key={c.name} value={c.name}>
                        {c.name} (Numérica, μ={c.mean?.toFixed(1) || 0})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Variables Cualitativas (Categóricas / Boolean)">
                    {catCols.map(c => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.detectedType}, {c.uniqueCount} categorías)
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-1.5 block">Naturaleza del Target:</label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => onUpdateContract({ targetType: 'quantitative' })}
                    disabled={!contract.targetVariable}
                    className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider border transition ${
                      contract.targetType === 'quantitative'
                        ? 'bg-[#1A1A1A] border-black text-white font-bold'
                        : 'bg-[#FAF8F5] border-black/20 text-gray-700 hover:border-black'
                    }`}
                  >
                    Cuantitativo
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateContract({ targetType: 'qualitative' })}
                    disabled={!contract.targetVariable}
                    className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider border transition ${
                      contract.targetType === 'qualitative'
                        ? 'bg-[#1A1A1A] border-black text-white font-bold'
                        : 'bg-[#FAF8F5] border-black/20 text-gray-700 hover:border-black'
                    }`}
                  >
                    Cualitativo
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Unit of Observation & Scope Level */}
          <div className="bg-white p-6 sm:p-8 border border-black/10 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1A1A1A] uppercase tracking-[0.2em] font-mono flex items-center space-x-2">
                <span className="h-5 w-5 bg-black text-white flex items-center justify-center text-xs">3</span>
                <span>Unidad de Observación & Alcance</span>
              </label>
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-1.5 block">
                ¿Qué representa exactamente cada fila del dataset?
              </label>
              <input
                type="text"
                value={contract.unitOfObservation}
                onChange={(e) => onUpdateContract({ unitOfObservation: e.target.value })}
                className="w-full bg-[#FAF8F5] border border-black/20 p-2.5 text-xs font-serif text-[#1A1A1A] focus:outline-none focus:border-black"
                placeholder="Ej: Cada fila representa una transacción de cliente en el portal e-commerce."
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-2 block">
                Nivel de Profundidad (Alcance Metodológico):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Descriptive */}
                <button
                  type="button"
                  onClick={() => onUpdateContract({ scopeLevel: 'descriptive' })}
                  className={`p-4 border text-left transition flex flex-col justify-between ${
                    contract.scopeLevel === 'descriptive'
                      ? 'bg-[#1A1A1A] border-black text-white'
                      : 'bg-[#FAF8F5] border-black/20 text-[#1A1A1A] hover:border-black'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono uppercase">1. Descriptivo</span>
                      {contract.scopeLevel === 'descriptive' && <Check className="h-3.5 w-3.5 text-[#E63946]" />}
                    </div>
                    <p className={`text-xs font-serif italic mt-2 ${contract.scopeLevel === 'descriptive' ? 'text-white/70' : 'text-gray-600'}`}>
                      Capas 0 a 3: Limpieza rigurosa y suite visual Pareto 20/80.
                    </p>
                  </div>
                </button>

                {/* Inferential */}
                <button
                  type="button"
                  onClick={() => onUpdateContract({ scopeLevel: 'inferential' })}
                  className={`p-4 border text-left transition flex flex-col justify-between ${
                    contract.scopeLevel === 'inferential'
                      ? 'bg-[#1A1A1A] border-black text-white'
                      : 'bg-[#FAF8F5] border-black/20 text-[#1A1A1A] hover:border-black'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono uppercase">2. Inferencial</span>
                      {contract.scopeLevel === 'inferential' && <Check className="h-3.5 w-3.5 text-[#E63946]" />}
                    </div>
                    <p className={`text-xs font-serif italic mt-2 ${contract.scopeLevel === 'inferential' ? 'text-white/70' : 'text-gray-600'}`}>
                      Capas 0 a 4: Comprobación de supuestos y tests estadísticos con FDR.
                    </p>
                  </div>
                </button>

                {/* Predictive */}
                <button
                  type="button"
                  onClick={() => onUpdateContract({ scopeLevel: 'predictive' })}
                  className={`p-4 border text-left transition flex flex-col justify-between ${
                    contract.scopeLevel === 'predictive'
                      ? 'bg-[#1A1A1A] border-black text-white'
                      : 'bg-[#FAF8F5] border-black/20 text-[#1A1A1A] hover:border-black'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono uppercase">3. Predictivo</span>
                      {contract.scopeLevel === 'predictive' && <Check className="h-3.5 w-3.5 text-[#E63946]" />}
                    </div>
                    <p className={`text-xs font-serif italic mt-2 ${contract.scopeLevel === 'predictive' ? 'text-white/70' : 'text-gray-600'}`}>
                      Capas 0 a 6: Modelos supervisados 70/30, K-Means & PCA e Informe final.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Contract Summary & Reproducibility Audit */}
        <div className="space-y-6">
          {/* Certificate Card */}
          <div className="bg-[#1A1A1A] text-white p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex items-center space-x-2 text-[#E63946]">
              <ShieldCheck className="h-4 w-4" />
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] font-mono text-white">
                Certificado de Contrato
              </h4>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Firmado por:</span>
                <span className="text-white font-medium">{contract.signedBy}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Semilla Aleatoria:</span>
                <span className="text-[#E63946] font-bold">RNG={contract.randomSeed}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Reproducibilidad:</span>
                <span className="text-emerald-400">Byte-a-Byte Exacta</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Principio Metodológico:</span>
                <span className="text-white font-bold">Pareto 20/80</span>
              </div>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 text-[11px] text-white/70 space-y-1 font-serif italic">
              <div className="font-mono text-white font-bold uppercase text-[10px] tracking-wider not-italic">
                Regla de Trazabilidad Total:
              </div>
              <p>
                Ninguna conclusión del informe final describirá un efecto no sustentado en este contrato y respaldado por una métrica generada por el pipeline.
              </p>
            </div>
          </div>

          {/* Random Seed Config */}
          <div className="bg-white p-6 border border-black/10 shadow-sm space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider font-mono text-[#1A1A1A] flex items-center justify-between">
              <span>Semilla Fija (PRNG Seed):</span>
              <span className="font-mono text-[#E63946] text-xs">RNG={contract.randomSeed}</span>
            </label>
            <input
              type="number"
              value={contract.randomSeed}
              onChange={(e) => onUpdateContract({ randomSeed: parseInt(e.target.value) || 42 })}
              className="w-full bg-[#FAF8F5] border border-black/20 px-3 py-2 text-xs font-mono text-[#1A1A1A] focus:outline-none focus:border-black"
            />
            <p className="text-[10px] font-mono text-gray-500">
              Garantiza splits de entrenamiento y remuestreos deterministas e idénticos.
            </p>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end pt-4">
        <button
          id="btn-sign-contract-proceed"
          onClick={onProceedToCleaning}
          disabled={isProcessing}
          className="flex items-center space-x-2 px-6 py-3 bg-[#1A1A1A] hover:bg-black active:bg-neutral-800 disabled:opacity-50 text-white font-mono text-xs uppercase tracking-widest transition-colors cursor-pointer shadow-sm"
        >
          <span>Firmar Contrato y Pasar a Saneamiento (Capa 02)</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
