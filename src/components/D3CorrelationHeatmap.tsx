import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  Layers, 
  Sliders, 
  Eye, 
  ArrowUpDown, 
  Info, 
  CheckCircle2, 
  TrendingUp, 
  HelpCircle,
  Maximize2,
  Table,
  Grid
} from 'lucide-react';
import { CorrelationPair, MulticollinearityAnalysis, VIFScore } from '../types/pipeline';

interface D3CorrelationHeatmapProps {
  columns: string[];
  matrix: number[][];
  spearmanMatrix?: number[][];
  pValuesMatrix?: number[][];
  topPairs: CorrelationPair[];
  multicollinearity?: MulticollinearityAnalysis;
  isExpanded?: boolean;
}

export const D3CorrelationHeatmap: React.FC<D3CorrelationHeatmapProps> = ({
  columns,
  matrix,
  spearmanMatrix,
  pValuesMatrix,
  topPairs,
  multicollinearity,
  isExpanded = false,
}) => {
  const [metricType, setMetricType] = useState<'pearson' | 'spearman'>('pearson');
  const [filterMode, setFilterMode] = useState<'all' | 'severe' | 'significant'>('all');
  const [minThreshold, setMinThreshold] = useState<number>(0.0);
  const [sortBy, setSortBy] = useState<'original' | 'vif' | 'alpha'>('vif');
  const [selectedCell, setSelectedCell] = useState<{ row: string; col: string; val: number; rho?: number; pVal?: number } | null>(null);
  const [viewTab, setViewTab] = useState<'heatmap' | 'vif_table' | 'pairs'>('heatmap');
  
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fallback multicollinearity analysis if not passed in
  const multiAnalysis = useMemo(() => {
    if (multicollinearity) return multicollinearity;
    // Simple local fallback calculation
    const vifScores: VIFScore[] = columns.map(c => ({
      variable: c,
      vif: 1.0,
      rSquared: 0,
      risk: 'low' as const,
      recommendation: 'Sin colinealidad detectada.',
    }));
    return {
      hasSevereMulticollinearity: false,
      maxVIF: 1.0,
      vifScores,
      highCorrelationPairs: topPairs.filter(p => Math.abs(p.pearsonR) >= 0.70),
      overallCollinearityScore: 10,
      summary: 'Estructura lineal estable con baja redundancia.',
      recommendedAction: 'Modelos paramétricos y de ensamble aptos para ejecución.',
    };
  }, [multicollinearity, columns, topPairs]);

  // Reorder columns based on sort option
  const sortedColumns = useMemo(() => {
    if (sortBy === 'alpha') {
      return [...columns].sort((a, b) => a.localeCompare(b));
    }
    if (sortBy === 'vif' && multiAnalysis.vifScores.length > 0) {
      const vifMap = new Map<string, number>(multiAnalysis.vifScores.map(v => [v.variable, v.vif]));
      return [...columns].sort((a, b) => Number(vifMap.get(b) ?? 0) - Number(vifMap.get(a) ?? 0));
    }
    return columns;
  }, [columns, sortBy, multiAnalysis]);

  // Map original indices
  const colIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    columns.forEach((c, idx) => map.set(c, idx));
    return map;
  }, [columns]);

  // Active matrix depending on metric toggle
  const activeMatrix = useMemo(() => {
    if (metricType === 'spearman' && spearmanMatrix && spearmanMatrix.length > 0) {
      return spearmanMatrix;
    }
    return matrix;
  }, [metricType, spearmanMatrix, matrix]);

  // Color interpolator using d3.interpolateRdBu reversed (-1: navy/blue, 0: neutral, +1: crimson/red)
  const colorScale = useMemo(() => {
    return (val: number) => {
      if (isNaN(val)) return '#FAF8F5';
      if (val === 1.0) return '#1A1A1A'; // diagonal anchor
      // Diverging custom palette for high visual clarity
      if (val > 0) {
        // Red / Crimson scale
        const t = Math.min(1, Math.max(0, val));
        return d3.interpolateRgb('#FAF8F5', '#E63946')(t);
      } else {
        // Deep Navy / Steel blue scale
        const t = Math.min(1, Math.max(0, Math.abs(val)));
        return d3.interpolateRgb('#FAF8F5', '#1D3557')(t);
      }
    };
  }, []);

  // Compute cell data for matrix
  const cellData = useMemo(() => {
    const cells: {
      row: string;
      col: string;
      rowIdx: number;
      colIdx: number;
      val: number;
      origRowIdx: number;
      origColIdx: number;
      rho: number;
      pVal: number;
      isDiagonal: boolean;
      isHighCollinear: boolean;
      isSevere: boolean;
      isSignificant: boolean;
      passesFilter: boolean;
    }[] = [];

    sortedColumns.forEach((rowName, r) => {
      const origR = colIndexMap.get(rowName) ?? 0;
      sortedColumns.forEach((colName, c) => {
        const origC = colIndexMap.get(colName) ?? 0;
        const val = activeMatrix[origR]?.[origC] ?? 0;
        const rho = spearmanMatrix?.[origR]?.[origC] ?? val;
        const pVal = pValuesMatrix?.[origR]?.[origC] ?? 0;
        const isDiagonal = rowName === colName;
        const absVal = Math.abs(val);

        const isHighCollinear = !isDiagonal && absVal >= 0.70;
        const isSevere = !isDiagonal && absVal >= 0.85;
        const isSignificant = isDiagonal || pVal < 0.05;

        let passesFilter = true;
        if (!isDiagonal) {
          if (absVal < minThreshold) passesFilter = false;
          if (filterMode === 'severe' && !isHighCollinear) passesFilter = false;
          if (filterMode === 'significant' && !isSignificant) passesFilter = false;
        }

        cells.push({
          row: rowName,
          col: colName,
          rowIdx: r,
          colIdx: c,
          val,
          origRowIdx: origR,
          origColIdx: origC,
          rho,
          pVal,
          isDiagonal,
          isHighCollinear,
          isSevere,
          isSignificant,
          passesFilter,
        });
      });
    });

    return cells;
  }, [sortedColumns, colIndexMap, activeMatrix, spearmanMatrix, pValuesMatrix, minThreshold, filterMode]);

  // Dimension measurements
  const numVars = sortedColumns.length;
  const cellSize = isExpanded ? Math.max(48, Math.min(76, 560 / Math.max(1, numVars))) : Math.max(38, Math.min(58, 360 / Math.max(1, numVars)));
  const margin = { top: 75, right: 30, bottom: 20, left: 95 };
  const width = margin.left + numVars * cellSize + margin.right;
  const height = margin.top + numVars * cellSize + margin.bottom;

  // D3 Scales
  const xScale = useMemo(() => {
    return d3.scaleBand()
      .domain(sortedColumns)
      .range([0, numVars * cellSize])
      .padding(0.04);
  }, [sortedColumns, numVars, cellSize]);

  const yScale = useMemo(() => {
    return d3.scaleBand()
      .domain(sortedColumns)
      .range([0, numVars * cellSize])
      .padding(0.04);
  }, [sortedColumns, numVars, cellSize]);

  // Handle cell click
  const handleCellClick = (cell: typeof cellData[0]) => {
    setSelectedCell({
      row: cell.row,
      col: cell.col,
      val: cell.val,
      rho: cell.rho,
      pVal: cell.pVal,
    });
  };

  // High Collinearity Counts
  const severePairsCount = multiAnalysis.highCorrelationPairs.length;
  const criticalVIFCount = multiAnalysis.vifScores.filter(v => v.risk === 'high').length;
  const moderateVIFCount = multiAnalysis.vifScores.filter(v => v.risk === 'moderate').length;

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* 1. Multicollinearity Status Alert Banner */}
      <div className={`p-4 border transition-all ${
        multiAnalysis.hasSevereMulticollinearity
          ? 'bg-rose-50/90 border-rose-300 text-rose-950'
          : moderateVIFCount > 0
          ? 'bg-amber-50/90 border-amber-300 text-amber-950'
          : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-start space-x-3">
            <div className="mt-0.5 shrink-0">
              {multiAnalysis.hasSevereMulticollinearity ? (
                <ShieldAlert className="h-5 w-5 text-[#E63946]" />
              ) : moderateVIFCount > 0 ? (
                <AlertTriangle className="h-5 w-5 text-amber-700" />
              ) : (
                <ShieldCheck className="h-5 w-5 text-emerald-700" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold uppercase tracking-widest text-[11px]">
                  {multiAnalysis.hasSevereMulticollinearity
                    ? 'Alerta Temprana: Multicolinealidad Severa Detectada'
                    : moderateVIFCount > 0
                    ? 'Diagnóstico: Colinealidad Moderada Identificada'
                    : 'Diagnóstico: Estructura Ortogonal Estable (Baja Colinealidad)'}
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 bg-black/10 rounded-xs">
                  VIF Máximo: {multiAnalysis.maxVIF.toFixed(2)}
                </span>
              </div>
              <p className="font-serif italic text-xs mt-1 leading-relaxed">
                {multiAnalysis.summary}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 font-mono text-[10px]">
            {severePairsCount > 0 && (
              <span className="px-2 py-1 bg-[#E63946] text-white font-bold uppercase tracking-wider">
                {severePairsCount} Pares |r| ≥ 0.70
              </span>
            )}
            {criticalVIFCount > 0 && (
              <span className="px-2 py-1 bg-black text-white font-bold uppercase tracking-wider">
                {criticalVIFCount} VIF ≥ 10
              </span>
            )}
            {severePairsCount === 0 && criticalVIFCount === 0 && (
              <span className="px-2 py-1 bg-emerald-700 text-white font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> VIFs Seguros (&lt; 5)
              </span>
            )}
          </div>
        </div>

        {/* Actionable recommendation */}
        <div className="mt-2.5 pt-2.5 border-t border-black/10 flex items-center justify-between text-[11px] font-mono">
          <span className="text-gray-700 font-semibold">
            Recomendación Modelado: <span className="font-normal">{multiAnalysis.recommendedAction}</span>
          </span>
        </div>
      </div>

      {/* 2. Interactive Controls & Tab Navigation */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-[#FAF8F5] p-3 border border-black/10">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 border border-black/15 p-1 bg-white">
          <button
            id="btn-heatmap-tab"
            onClick={() => setViewTab('heatmap')}
            className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-mono uppercase tracking-wider transition cursor-pointer ${
              viewTab === 'heatmap'
                ? 'bg-[#1A1A1A] text-white font-bold'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            <span>Heatmap D3 ({numVars}×{numVars})</span>
          </button>

          <button
            id="btn-vif-tab"
            onClick={() => setViewTab('vif_table')}
            className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-mono uppercase tracking-wider transition cursor-pointer ${
              viewTab === 'vif_table'
                ? 'bg-[#1A1A1A] text-white font-bold'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Factores VIF ({multiAnalysis.vifScores.length})</span>
          </button>

          <button
            id="btn-pairs-tab"
            onClick={() => setViewTab('pairs')}
            className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-mono uppercase tracking-wider transition cursor-pointer ${
              viewTab === 'pairs'
                ? 'bg-[#1A1A1A] text-white font-bold'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            <Table className="h-3.5 w-3.5" />
            <span>Ranking de Pares ({topPairs.length})</span>
          </button>
        </div>

        {/* Dynamic Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Pearson / Spearman Toggle */}
          <div className="flex items-center bg-white border border-black/15 p-0.5">
            <button
              onClick={() => setMetricType('pearson')}
              className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider transition cursor-pointer ${
                metricType === 'pearson' ? 'bg-[#1A1A1A] text-white' : 'text-gray-600 hover:text-black'
              }`}
              title="Coeficiente de Pearson: Correlación paramétrica lineal"
            >
              Pearson (r)
            </button>
            <button
              onClick={() => setMetricType('spearman')}
              className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider transition cursor-pointer ${
                metricType === 'spearman' ? 'bg-[#1A1A1A] text-white' : 'text-gray-600 hover:text-black'
              }`}
              title="Coeficiente de Spearman: Correlación monótona de rangos no lineal"
            >
              Spearman (ρ)
            </button>
          </div>

          {/* Sort Order */}
          <div className="flex items-center space-x-1 bg-white border border-black/15 px-2 py-1">
            <ArrowUpDown className="h-3 w-3 text-gray-500" />
            <span className="text-[10px] text-gray-500">Orden:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-[10px] font-mono bg-transparent font-bold text-black border-none focus:outline-hidden cursor-pointer"
            >
              <option value="vif">Por VIF (Mayor Riesgo)</option>
              <option value="original">Original</option>
              <option value="alpha">Alfabético</option>
            </select>
          </div>

          {/* Collinearity Filter */}
          <div className="flex items-center space-x-1 bg-white border border-black/15 px-2 py-1">
            <Sliders className="h-3 w-3 text-gray-500" />
            <span className="text-[10px] text-gray-500">Filtro:</span>
            <select
              value={filterMode}
              onChange={(e) => {
                setFilterMode(e.target.value as any);
                if (e.target.value === 'severe') setMinThreshold(0.70);
                else setMinThreshold(0.0);
              }}
              className="text-[10px] font-mono bg-transparent font-bold text-black border-none focus:outline-hidden cursor-pointer"
            >
              <option value="all">Todas</option>
              <option value="severe">Multicolinealidad (|r| ≥ 0.70)</option>
              <option value="significant">Significativas (p &lt; 0.05)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. TAB 1: D3 INTERACTIVE HEATMAP MATRIX */}
      {viewTab === 'heatmap' && (
        <div className="bg-white border border-black/10 p-4 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 border-b border-black/10 pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-black text-white font-bold">
                D3 Heatmap Engine
              </span>
              <span className="text-xs font-serif italic text-gray-600">
                Haga clic en cualquier celda para inspeccionar el par bivariado y su factor de inflación.
              </span>
            </div>

            {/* Heatmap Color Scale Legend */}
            <div className="flex items-center space-x-2 text-[10px] font-mono text-gray-500">
              <span>-1.0 (Inversa)</span>
              <div 
                className="w-24 h-3 border border-black/20 rounded-xs"
                style={{
                  background: 'linear-gradient(to right, #1D3557, #FAF8F5, #E63946)'
                }}
              />
              <span>+1.0 (Directa)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* SVG Matrix Container */}
            <div className={`overflow-x-auto ${selectedCell ? 'lg:col-span-8' : 'lg:col-span-12'} flex justify-center bg-[#FAF8F5] p-3 sm:p-4 border border-black/5`}>
              <svg
                ref={svgRef}
                width={width}
                height={height}
                className="select-none font-mono"
                style={{ minWidth: width, minHeight: height }}
              >
                <g transform={`translate(${margin.left}, ${margin.top})`}>
                  {/* Top Axis Column Labels */}
                  {sortedColumns.map((colName, cIdx) => {
                    const x = (xScale(colName) ?? 0) + cellSize / 2;
                    const vifItem = multiAnalysis.vifScores.find(v => v.variable === colName);
                    const isHighVif = vifItem && vifItem.vif >= 10;
                    return (
                      <g key={`top-${colName}`} transform={`translate(${x}, -10)`}>
                        <text
                          textAnchor="start"
                          transform="rotate(-40)"
                          className={`text-[10px] font-mono font-semibold ${isHighVif ? 'fill-[#E63946] font-bold' : 'fill-gray-700'}`}
                          title={`${colName} (VIF: ${vifItem?.vif || 1.0})`}
                        >
                          {colName.length > 12 ? `${colName.slice(0, 10)}…` : colName}
                          {isHighVif && ' ⚠'}
                        </text>
                      </g>
                    );
                  })}

                  {/* Left Axis Row Labels */}
                  {sortedColumns.map((rowName, rIdx) => {
                    const y = (yScale(rowName) ?? 0) + cellSize / 2;
                    const vifItem = multiAnalysis.vifScores.find(v => v.variable === rowName);
                    const isHighVif = vifItem && vifItem.vif >= 10;
                    return (
                      <g key={`left-${rowName}`} transform={`translate(-10, ${y})`}>
                        <text
                          textAnchor="end"
                          dominantBaseline="middle"
                          className={`text-[10px] font-mono font-semibold ${isHighVif ? 'fill-[#E63946] font-bold' : 'fill-gray-700'}`}
                          title={`${rowName} (VIF: ${vifItem?.vif || 1.0})`}
                        >
                          {rowName.length > 13 ? `${rowName.slice(0, 11)}…` : rowName}
                        </text>
                      </g>
                    );
                  })}

                  {/* Matrix Cells */}
                  {cellData.map((cell) => {
                    const x = xScale(cell.col) ?? 0;
                    const y = yScale(cell.row) ?? 0;
                    const isSelected = selectedCell && (
                      (selectedCell.row === cell.row && selectedCell.col === cell.col) ||
                      (selectedCell.row === cell.col && selectedCell.col === cell.row)
                    );

                    const bgColor = cell.passesFilter 
                      ? colorScale(cell.val) 
                      : '#F3F4F6';
                    
                    const textColor = !cell.passesFilter
                      ? '#9CA3AF'
                      : cell.isDiagonal || Math.abs(cell.val) > 0.45
                      ? '#FFFFFF'
                      : '#1A1A1A';

                    return (
                      <g
                        key={`cell-${cell.row}-${cell.col}`}
                        transform={`translate(${x}, ${y})`}
                        onClick={() => handleCellClick(cell)}
                        className="cursor-pointer transition-transform hover:opacity-90"
                      >
                        {/* Cell Background */}
                        <rect
                          width={cellSize}
                          height={cellSize}
                          fill={bgColor}
                          stroke={isSelected ? '#000000' : cell.isSevere ? '#E63946' : 'rgba(0,0,0,0.06)'}
                          strokeWidth={isSelected ? 2.5 : cell.isSevere ? 1.5 : 0.5}
                          rx={2}
                          ry={2}
                        />

                        {/* Collinearity Warning Marker Badge on Cell */}
                        {cell.isHighCollinear && cell.passesFilter && (
                          <circle
                            cx={cellSize - 5}
                            cy={5}
                            r={3}
                            fill={cell.isSevere ? '#E63946' : '#F59E0B'}
                            stroke="#FFFFFF"
                            strokeWidth={1}
                          />
                        )}

                        {/* Value Text */}
                        <text
                          x={cellSize / 2}
                          y={cellSize / 2}
                          dominantBaseline="central"
                          textAnchor="middle"
                          fill={textColor}
                          className={`text-[10px] font-mono select-none ${
                            cell.isDiagonal || isSelected ? 'font-bold' : ''
                          }`}
                        >
                          {cell.isDiagonal 
                            ? '1.0' 
                            : cell.passesFilter 
                            ? (cell.val > 0 ? `+${cell.val.toFixed(2)}` : cell.val.toFixed(2))
                            : '·'}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>

            {/* Selected Cell Deep Inspector Panel */}
            {selectedCell && (
              <div className="lg:col-span-4 bg-[#FAF8F5] p-4 sm:p-5 border border-black/15 space-y-4">
                <div className="flex items-center justify-between border-b border-black/10 pb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#E63946] font-bold">
                    Inspección de Par Bivariado
                  </span>
                  <button
                    onClick={() => setSelectedCell(null)}
                    className="text-gray-400 hover:text-black font-mono text-xs cursor-pointer"
                  >
                    ✕ Cerrar
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-mono text-gray-500">Variables Analizadas:</div>
                  <div className="text-sm font-serif font-bold text-[#1A1A1A]">
                    {selectedCell.row}
                  </div>
                  <div className="text-xs font-mono text-gray-400">↔ versus</div>
                  <div className="text-sm font-serif font-bold text-[#1A1A1A]">
                    {selectedCell.col}
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="space-y-2 font-mono text-xs bg-white p-3 border border-black/10">
                  <div className="flex justify-between items-center border-b border-black/5 pb-1.5">
                    <span className="text-gray-500">Pearson (r lineal):</span>
                    <span className={`font-bold text-sm ${
                      Math.abs(selectedCell.val) >= 0.70 ? 'text-[#E63946]' : 'text-gray-900'
                    }`}>
                      {selectedCell.val > 0 ? `+${selectedCell.val.toFixed(3)}` : selectedCell.val.toFixed(3)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-black/5 pb-1.5">
                    <span className="text-gray-500">Spearman (ρ monótono):</span>
                    <span className="font-bold text-gray-800">
                      {selectedCell.rho !== undefined ? (selectedCell.rho > 0 ? `+${selectedCell.rho.toFixed(3)}` : selectedCell.rho.toFixed(3)) : '—'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-black/5 pb-1.5">
                    <span className="text-gray-500">Varianza Compartida (r²):</span>
                    <span className="font-bold text-gray-800">
                      {(Math.pow(selectedCell.val, 2) * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Significancia (p-value):</span>
                    <span className="font-bold text-gray-800">
                      {selectedCell.pVal !== undefined ? (selectedCell.pVal < 0.001 ? '< 0.001' : selectedCell.pVal.toFixed(3)) : '—'}
                    </span>
                  </div>
                </div>

                {/* Collinearity Risk Assessment */}
                <div className={`p-3 border text-xs font-mono space-y-1 ${
                  Math.abs(selectedCell.val) >= 0.85
                    ? 'bg-rose-100 border-rose-300 text-rose-900'
                    : Math.abs(selectedCell.val) >= 0.70
                    ? 'bg-amber-100 border-amber-300 text-amber-900'
                    : 'bg-emerald-100 border-emerald-300 text-emerald-900'
                }`}>
                  <div className="font-bold uppercase text-[10px] tracking-wider">
                    {Math.abs(selectedCell.val) >= 0.85
                      ? '🔴 Riesgo Crítico de Multicolinealidad'
                      : Math.abs(selectedCell.val) >= 0.70
                      ? '🟡 Colinealidad Fuerte'
                      : '🟢 Relación Lineal Aceptable'}
                  </div>
                  <p className="text-[11px] font-serif italic">
                    {Math.abs(selectedCell.val) >= 0.85
                      ? 'Ambas variables comparten más del 72% de varianza idéntica. Incluir ambas en una regresión OLS causará inflación severa de errores estándar.'
                      : Math.abs(selectedCell.val) >= 0.70
                      ? 'Asociación sustancial. En modelos lineales evaluar si una variable es redundante; en Random Forest o Árboles no genera distorsión.'
                      : 'Independencia lineal adecuada para modelado paramétrico sin peligro de colinealidad destructiva.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. TAB 2: VIF (VARIANCE INFLATION FACTOR) AUDIT TABLE */}
      {viewTab === 'vif_table' && (
        <div className="bg-white border border-black/10 p-4 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-black/10 pb-3">
            <div>
              <h5 className="font-serif font-bold text-sm text-[#1A1A1A] uppercase tracking-wider">
                Auditoría de Factor de Inflación de Varianza (VIF)
              </h5>
              <p className="text-xs font-serif italic text-gray-500 mt-0.5">
                Diagnóstico cuantitativo de redundancia multivariada: VIF = 1 / (1 - R²_j).
              </p>
            </div>
            <span className="text-[10px] font-mono bg-[#FAF8F5] px-2.5 py-1 border border-black/10 text-gray-600">
              Criterio Estándar: VIF &lt; 5 (Óptimo) | 5 - 10 (Precaución) | ≥ 10 (Crítico)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border border-black/10">
              <thead>
                <tr className="bg-[#1A1A1A] text-white">
                  <th className="py-2.5 px-3 border-r border-white/20">Variable Predictora</th>
                  <th className="py-2.5 px-3 text-center border-r border-white/20">VIF Score</th>
                  <th className="py-2.5 px-3 text-center border-r border-white/20">Tolerancia (1/VIF)</th>
                  <th className="py-2.5 px-3 text-center border-r border-white/20">R² vs Resto</th>
                  <th className="py-2.5 px-3 text-center border-r border-white/20">Mayor Par Correlacionado</th>
                  <th className="py-2.5 px-3 text-center border-r border-white/20">Nivel de Riesgo</th>
                  <th className="py-2.5 px-3">Dictamen y Recomendación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {multiAnalysis.vifScores.map((score, idx) => {
                  const isHigh = score.risk === 'high';
                  const isMod = score.risk === 'moderate';
                  const tolerance = +(1 / score.vif).toFixed(3);

                  return (
                    <tr 
                      key={score.variable}
                      className={`hover:bg-neutral-50 ${
                        isHigh ? 'bg-rose-50/60' : isMod ? 'bg-amber-50/40' : idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF8F5]'
                      }`}
                    >
                      <td className="py-3 px-3 font-bold text-[#1A1A1A] border-r border-black/10">
                        {score.variable}
                      </td>

                      <td className="py-3 px-3 text-center border-r border-black/10 font-bold">
                        <span className={`text-sm ${
                          isHigh ? 'text-[#E63946]' : isMod ? 'text-amber-700' : 'text-emerald-700'
                        }`}>
                          {score.vif.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center border-r border-black/10 text-gray-700">
                        {tolerance.toFixed(3)}
                      </td>

                      <td className="py-3 px-3 text-center border-r border-black/10 text-gray-700">
                        {(score.rSquared * 100).toFixed(1)}%
                      </td>

                      <td className="py-3 px-3 text-center border-r border-black/10">
                        {score.topCorrelatedWith ? (
                          <span className="font-semibold text-gray-800">
                            {score.topCorrelatedWith} <span className="text-gray-500 font-normal">({score.maxCorrelation ? `r=${score.maxCorrelation.toFixed(2)}` : ''})</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center border-r border-black/10">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                          isHigh
                            ? 'bg-rose-100 text-rose-900 border-rose-300'
                            : isMod
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        }`}>
                          {isHigh ? 'Crítico (≥10)' : isMod ? 'Moderado (5-10)' : 'Bajo (<5)'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-[11px] font-serif italic text-gray-700">
                        {score.recommendation}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TAB 3: HIGH CORRELATION PAIRS RANKING */}
      {viewTab === 'pairs' && (
        <div className="bg-white border border-black/10 p-4 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-black/10 pb-3">
            <div>
              <h5 className="font-serif font-bold text-sm text-[#1A1A1A] uppercase tracking-wider">
                Ranking de Pares Bivariados por Fuerza de Asociación
              </h5>
              <p className="text-xs font-serif italic text-gray-500 mt-0.5">
                Ordenamiento de mayor a menor correlación absoluta para auditar redundancia y complementariedad.
              </p>
            </div>
            <span className="text-xs font-mono text-gray-500">
              {topPairs.length} pares evaluados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border border-black/10">
              <thead>
                <tr className="bg-[#1A1A1A] text-white">
                  <th className="py-2.5 px-3 border-r border-white/20">Variable 1</th>
                  <th className="py-2.5 px-3 border-r border-white/20">Variable 2</th>
                  <th className="py-2.5 px-3 text-center border-r border-white/20">Pearson (r)</th>
                  <th className="py-2.5 px-3 text-center border-r border-white/20">Spearman (ρ)</th>
                  <th className="py-2.5 px-3 text-center border-r border-white/20">Varianza Compartida (r²)</th>
                  <th className="py-2.5 px-3 text-center border-r border-white/20">Significancia</th>
                  <th className="py-2.5 px-3 text-center">Diagnóstico Colineal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {topPairs.map((pair, idx) => {
                  const absR = Math.abs(pair.pearsonR);
                  const isSevere = absR >= 0.85;
                  const isHigh = absR >= 0.70;

                  return (
                    <tr
                      key={`${pair.var1}-${pair.var2}`}
                      className={`hover:bg-neutral-50 ${
                        isSevere ? 'bg-rose-50/60' : isHigh ? 'bg-amber-50/40' : idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF8F5]'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-[#1A1A1A] border-r border-black/10">
                        {pair.var1}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#1A1A1A] border-r border-black/10">
                        {pair.var2}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-black/10">
                        <span className={`font-bold ${isHigh ? 'text-[#E63946]' : 'text-gray-800'}`}>
                          {pair.pearsonR > 0 ? `+${pair.pearsonR.toFixed(3)}` : pair.pearsonR.toFixed(3)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-black/10 text-gray-700">
                        {pair.spearmanRho > 0 ? `+${pair.spearmanRho.toFixed(3)}` : pair.spearmanRho.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-black/10 text-gray-700 font-semibold">
                        {(Math.pow(pair.pearsonR, 2) * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-black/10">
                        <span className={`text-[10px] px-2 py-0.5 font-bold ${
                          pair.isSignificant ? 'bg-emerald-100 text-emerald-900' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {pair.isSignificant ? 'p < 0.05' : 'No Sig.'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                          isSevere
                            ? 'bg-rose-100 text-rose-900 border-rose-300'
                            : isHigh
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {isSevere ? '🔴 Multicolinealidad Severa' : isHigh ? '🟡 Colinealidad Fuerte' : '🟢 Ortogonal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
