/**
 * Capa 0: Ingesta & Inspección de Esquema
 * - Detecta automáticamente separador, encoding y tipos de datos por columna
 * - Calcula ficha de esquema (% de nulos, cardinalidad única, estadísticas base)
 * - Provee vista previa fiel de las primeras 20 filas
 */

import { ColumnSchema, IngestSummary } from '../../types/pipeline';
import { DataSource, LoadedData } from './data-sources';

export class IngestionEngine {
  static async ingest(dataSource: DataSource): Promise<IngestSummary> {
    const loaded: LoadedData = await dataSource.load();
    const rows = loaded.rows;
    const columns = loaded.columns;

    const columnSchemas: ColumnSchema[] = columns.map(col => {
      return analyzeColumn(col, rows);
    });

    const previewRows = rows.slice(0, 20);

    return {
      fileName: dataSource.name,
      fileSize: loaded.rawText ? new Blob([loaded.rawText]).size : rows.length * columns.length * 12,
      fileType: (loaded.metadata.sourceType as any) || 'csv',
      delimiter: loaded.metadata.delimiter,
      encoding: loaded.metadata.encoding || 'UTF-8',
      rowCount: rows.length,
      columnCount: columns.length,
      sheetNames: loaded.metadata.sheets,
      selectedSheet: loaded.metadata.selectedSheet,
      columns: columnSchemas,
      previewRows,
      rawText: loaded.rawText,
      ingestedAt: new Date().toISOString(),
    };
  }
}

function analyzeColumn(colName: string, rows: Record<string, any>[]): ColumnSchema {
  const total = rows.length;
  let nullCount = 0;
  const values: any[] = [];
  const nonNullStrings: string[] = [];

  for (const row of rows) {
    const val = row[colName];
    if (val === null || val === undefined || val === '' || (typeof val === 'string' && val.trim() === '') || (typeof val === 'string' && ['nan', 'null', 'none', 'na', 'n/a'].includes(val.trim().toLowerCase()))) {
      nullCount++;
    } else {
      values.push(val);
      nonNullStrings.push(String(val).trim());
    }
  }

  const nullPercentage = total > 0 ? +((nullCount / total) * 100).toFixed(2) : 0;
  const uniqueSet = new Set(nonNullStrings);
  const uniqueCount = uniqueSet.size;
  const sampleValues = Array.from(uniqueSet).slice(0, 5);

  // Type inference heuristics
  let numericMatches = 0;
  let booleanMatches = 0;
  let dateMatches = 0;
  let currencyNumericMatches = 0;
  const numericValues: number[] = [];

  for (const val of values) {
    if (typeof val === 'number' && !isNaN(val)) {
      numericMatches++;
      numericValues.push(val);
    } else if (typeof val === 'boolean') {
      booleanMatches++;
    } else if (typeof val === 'string') {
      const s = val.trim();
      // Check currency / numeric with comma format (e.g. "$ 1,250.00" or "4.500 €")
      const cleanedNumStr = s.replace(/[$€£¥,]/g, '').trim();
      const parsedNum = Number(cleanedNumStr);
      
      if (!isNaN(parsedNum) && cleanedNumStr !== '') {
        if (/[$€£¥]/.test(s) || s.includes(',')) {
          currencyNumericMatches++;
        }
        numericMatches++;
        numericValues.push(parsedNum);
      } else if (/^(true|false|si|no|yes|no|1|0)$/i.test(s)) {
        booleanMatches++;
      } else if (!isNaN(Date.parse(s)) && s.length > 5 && /[\/\-]/.test(s)) {
        dateMatches++;
      }
    }
  }

  const validCount = values.length;
  let detectedType: ColumnSchema['detectedType'] = 'categorical';
  let isNumericCandidate = false;

  const lowerName = colName.toLowerCase();
  const isIdName = lowerName.endsWith('_id') || lowerName.startsWith('id_') || lowerName === 'id' || lowerName.includes('uuid') || lowerName.includes('codigo');

  if (validCount > 0) {
    if (numericMatches / validCount >= 0.85) {
      if (isIdName && uniqueCount > validCount * 0.9) {
        detectedType = 'id';
      } else if (uniqueCount <= 2 && numericValues.every(v => v === 0 || v === 1)) {
        detectedType = 'boolean';
      } else {
        detectedType = 'numeric';
      }
      isNumericCandidate = true;
    } else if (booleanMatches / validCount >= 0.85) {
      detectedType = 'boolean';
    } else if (dateMatches / validCount >= 0.85) {
      detectedType = 'datetime';
    } else if (isIdName && uniqueCount > validCount * 0.8) {
      detectedType = 'id';
    } else if (uniqueCount > validCount * 0.85 && validCount > 30) {
      detectedType = 'text';
    } else {
      detectedType = 'categorical';
    }
  }

  // Calculate descriptive stats for numeric
  let min: number | undefined;
  let max: number | undefined;
  let mean: number | undefined;
  let median: number | undefined;
  let std: number | undefined;

  if (numericValues.length > 0 && (detectedType === 'numeric' || isNumericCandidate)) {
    const sorted = [...numericValues].sort((a, b) => a - b);
    min = sorted[0];
    max = sorted[sorted.length - 1];
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    mean = +(sum / sorted.length).toFixed(2);
    
    const mid = Math.floor(sorted.length / 2);
    median = sorted.length % 2 !== 0 ? sorted[mid] : +((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2);
    
    const variance = sorted.reduce((acc, v) => acc + Math.pow(v - (mean || 0), 2), 0) / sorted.length;
    std = +Math.sqrt(variance).toFixed(2);
  }

  // Top categories
  let topCategories: ColumnSchema['topCategories'];
  if (detectedType === 'categorical' || detectedType === 'boolean') {
    const freqMap: Record<string, number> = {};
    for (const s of nonNullStrings) {
      freqMap[s] = (freqMap[s] || 0) + 1;
    }
    topCategories = Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value, count]) => ({
        value,
        count,
        percentage: +((count / (validCount || 1)) * 100).toFixed(1),
      }));
  }

  return {
    name: colName,
    detectedType,
    nullCount,
    nullPercentage,
    uniqueCount,
    sampleValues,
    isNumericCandidate: currencyNumericMatches > 0 || isNumericCandidate,
    min,
    max,
    mean,
    median,
    std,
    topCategories,
  };
}
