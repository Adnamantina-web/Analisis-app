import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle, 
  FileText, 
  Hash, 
  Calendar, 
  Tag, 
  ArrowRight,
  RefreshCw,
  Info,
  Layers,
  FileCheck
} from 'lucide-react';
import { ColumnSchema, IngestSummary } from '../types/pipeline';
import { SAMPLE_DATASETS } from '../lib/data-engine/sample-datasets';

interface Capa0IngestionProps {
  ingestSummary: IngestSummary | null;
  onFileUpload: (file: File) => Promise<void>;
  onSelectSampleDataset: (id: string) => void;
  selectedSampleId: string;
  onProceedToNext: () => void;
  isProcessing: boolean;
}

export const Capa0Ingestion: React.FC<Capa0IngestionProps> = ({
  ingestSummary,
  onFileUpload,
  onSelectSampleDataset,
  selectedSampleId,
  onProceedToNext,
  isProcessing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await onFileUpload(e.target.files[0]);
    }
  };

  const filteredColumns = ingestSummary?.columns.filter(col =>
    col.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8">
      {/* Top Banner: Editorial Header */}
      <div className="bg-white p-6 sm:p-8 border border-black/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 bg-black text-white">
              Capa 00 // Ingesta
            </span>
            <span className="text-xs font-mono text-gray-500">DataSource Abstraction & Schema Heuristics</span>
          </div>
          <h3 className="text-2xl font-serif font-light text-[#1A1A1A]">
            Lectura Universal e Inferencia de Esquema
          </h3>
          <p className="text-sm font-serif italic text-gray-600 max-w-3xl mt-1">
            Lectura y decodificación de fuentes crudas. Clasificación atómica de tipos de datos, cuantificación de valores faltantes e inspección inicial antes de fijar el contrato.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Soporte Universal</div>
          <div className="text-xs font-mono font-bold text-[#1A1A1A]">CSV • TSV • XLSX • JSON</div>
        </div>
      </div>

      {/* Upload and Sample Pickers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`col-span-1 md:col-span-2 bg-white border-2 border-dashed rounded-none p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[180px] ${
            isDragging
              ? 'border-[#E63946] bg-[#FAF8F5]'
              : 'border-black/20 hover:border-black bg-white hover:bg-[#FAF8F5]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.xlsx,.xls,.json"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="h-12 w-12 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center mb-3 shadow-2xs">
            {isProcessing ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          </div>
          <div className="text-base font-serif font-bold text-[#1A1A1A]">
            Arrastra tu archivo aquí o haz clic para examinar
          </div>
          <p className="text-xs font-mono text-gray-500 mt-1">
            Formatos soportados: CSV, TSV, Excel (.xlsx, .xls) o JSON plano.
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div className="bg-[#1A1A1A] text-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-widest text-white/60 mb-3">
              <Database className="h-3.5 w-3.5 text-[#E63946]" />
              <span>Datasets Pre-cargados</span>
            </div>
            <div className="space-y-2">
              {SAMPLE_DATASETS.map((ds) => (
                <button
                  key={ds.id}
                  onClick={() => onSelectSampleDataset(ds.id)}
                  className={`w-full text-left text-xs px-3 py-2.5 transition flex items-center justify-between border ${
                    selectedSampleId === ds.id
                      ? 'border-[#E63946] bg-[#E63946]/20 text-white font-bold'
                      : 'border-white/10 hover:border-white/40 text-white/70 hover:text-white bg-white/5'
                  }`}
                >
                  <span className="truncate pr-2 font-serif text-sm">{ds.name.split(':')[0]}</span>
                  <span className="font-mono text-[10px] text-white/50 shrink-0">{ds.format.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="text-[10px] font-mono text-white/40 mt-4 pt-3 border-t border-white/10">
            Diseñados para poner a prueba todas las capas del pipeline.
          </div>
        </div>
      </div>

      {/* Dataset Summary Cards */}
      {ingestSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-6 border border-black/10 border-l-4 border-l-black shadow-sm">
            <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Total Filas</div>
            <div className="text-3xl font-serif font-light text-[#1A1A1A] mt-1">
              {ingestSummary.rowCount.toLocaleString()}
            </div>
            <div className="text-[11px] font-mono text-gray-500 mt-1">Observaciones crudas</div>
          </div>

          <div className="bg-white p-6 border border-black/10 border-l-4 border-l-black shadow-sm">
            <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Total Columnas</div>
            <div className="text-3xl font-serif font-light text-[#1A1A1A] mt-1">
              {ingestSummary.columnCount}
            </div>
            <div className="text-[11px] font-mono text-gray-500 mt-1">
              {ingestSummary.columns.filter(c => c.detectedType === 'numeric').length} num / {ingestSummary.columns.filter(c => c.detectedType !== 'numeric').length} cat
            </div>
          </div>

          <div className="bg-white p-6 border border-black/10 border-l-4 border-l-black shadow-sm">
            <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Formato & Encoding</div>
            <div className="text-3xl font-serif font-light text-[#1A1A1A] mt-1 uppercase">
              {ingestSummary.fileType}
            </div>
            <div className="text-[11px] font-mono text-gray-500 mt-1">
              {ingestSummary.encoding} • Delim: &apos;{ingestSummary.delimiter || ','}&apos;
            </div>
          </div>

          <div className="bg-white p-6 border border-black/10 border-l-4 border-l-[#E63946] shadow-sm">
            <div className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Tasa de Nulos</div>
            <div className="text-3xl font-serif font-light text-[#E63946] mt-1">
              {(() => {
                const totalCells = ingestSummary.rowCount * ingestSummary.columnCount;
                const totalNulls = ingestSummary.columns.reduce((a, b) => a + b.nullCount, 0);
                const nullPct = totalCells > 0 ? (totalNulls / totalCells) * 100 : 0;
                return `${nullPct.toFixed(1)}%`;
              })()}
            </div>
            <div className="text-[11px] font-mono text-gray-500 mt-1">Celdas vacías detectadas</div>
          </div>
        </div>
      )}

      {/* Schema Detection Table */}
      {ingestSummary && (
        <div className="bg-white border border-black/10 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">
                Esquema de Variables y Diagnóstico Heurístico ({ingestSummary.columns.length} atributos)
              </h3>
              <p className="text-xs font-serif italic text-gray-500">
                Inferencia de tipos, porcentaje de valores faltantes y cardinalidad categórica.
              </p>
            </div>
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Filtrar variables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-black/20 text-xs font-mono px-3 py-2 text-[#1A1A1A] focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-black/10 text-gray-500 uppercase font-mono text-[10px] tracking-wider">
                  <th className="py-3 px-4">Variable</th>
                  <th className="py-3 px-4">Tipo Detectado</th>
                  <th className="py-3 px-4">Valores Nulos</th>
                  <th className="py-3 px-4">Cardinalidad</th>
                  <th className="py-3 px-4">Muestra de Valores</th>
                  <th className="py-3 px-4">Estadísticas Base</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 font-sans">
                {filteredColumns.map((col) => {
                  return (
                    <tr key={col.name} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#1A1A1A]">
                        {col.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-black/5 text-black border border-black/10">
                          {col.detectedType === 'numeric' && <Hash className="h-3 w-3 text-black" />}
                          {col.detectedType === 'datetime' && <Calendar className="h-3 w-3 text-black" />}
                          {col.detectedType === 'categorical' && <Tag className="h-3 w-3 text-black" />}
                          <span>{col.detectedType}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center space-x-2">
                          <span className={col.nullCount > 0 ? 'text-[#E63946] font-bold' : 'text-gray-500'}>
                            {col.nullCount} ({col.nullPercentage}%)
                          </span>
                          {col.nullPercentage > 20 && (
                            <span className="text-[9px] bg-[#E63946]/10 text-[#E63946] px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                              Elevado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-700">
                        {col.uniqueCount} únicos
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-gray-600 font-mono text-[11px]">
                        {col.sampleValues.slice(0, 3).map(v => String(v ?? 'null')).join(', ')}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-700">
                        {col.detectedType === 'numeric' && col.mean !== undefined ? (
                          <span>μ={col.mean.toFixed(1)} | σ={col.std?.toFixed(1) || 0}</span>
                        ) : col.topCategories && col.topCategories.length > 0 ? (
                          <span>Moda: {col.topCategories[0].value} ({col.topCategories[0].percentage}%)</span>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Raw Data Preview (First 8 Rows) */}
      {ingestSummary && ingestSummary.previewRows.length > 0 && (
        <div className="bg-white border border-black/10 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-black/10 flex items-center justify-between">
            <div>
              <h3 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">
                Muestra Cruda Inicial (Primeras 8 Observaciones)
              </h3>
              <p className="text-xs font-serif italic text-gray-500">
                Visualización de las filas leídas del archivo antes de cualquier transformación.
              </p>
            </div>
            <span className="text-xs font-mono text-gray-600 bg-[#FAF8F5] px-3 py-1 border border-black/10">
              {ingestSummary.previewRows.length} de {ingestSummary.rowCount} filas
            </span>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-black/10 text-gray-500 sticky top-0">
                  <th className="py-2.5 px-3">#</th>
                  {ingestSummary.columns.slice(0, 10).map((col) => (
                    <th key={col.name} className="py-2.5 px-3 whitespace-nowrap font-bold text-[#1A1A1A]">
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 text-[#1A1A1A]">
                {ingestSummary.previewRows.slice(0, 8).map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF8F5]">
                    <td className="py-2 px-3 text-gray-400">{idx + 1}</td>
                    {ingestSummary.columns.slice(0, 10).map((col) => {
                      const val = row[col.name];
                      const isNull = val === null || val === undefined || val === '';
                      return (
                        <td
                          key={col.name}
                          className={`py-2 px-3 whitespace-nowrap ${isNull ? 'text-[#E63946] italic font-bold' : ''}`}
                        >
                          {isNull ? 'NaN / null' : String(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-end pt-4">
        <button
          id="btn-proceed-to-contract"
          onClick={onProceedToNext}
          disabled={!ingestSummary || isProcessing}
          className="flex items-center space-x-2 px-6 py-3 bg-[#1A1A1A] hover:bg-black active:bg-neutral-800 disabled:opacity-50 text-white font-mono text-xs uppercase tracking-widest transition-colors cursor-pointer shadow-sm"
        >
          <span>Confirmar Ingesta y Proceder al Contrato (Capa 01)</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
