/**
 * Exportador de Artefactos del Pipeline:
 * - dataset_limpio.csv
 * - log_decisiones.json
 * - informe_final.md (Markdown)
 * - informe_final.tex (LaTeX)
 * - informe_final.docx
 */

import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { FinalReport, ProjectContract, DecisionLogEntry } from '../../types/pipeline';

export class PipelineExporter {
  static exportCSV(rows: Record<string, any>[], filename = 'dataset_limpio.csv'): void {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        headers
          .map(h => {
            const val = row[h] ?? '';
            const escaped = String(val).replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(',')
      ),
    ].join('\n');

    downloadBlob(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }), filename);
  }

  static exportJSON(data: any, filename = 'log_decisiones.json'): void {
    const jsonStr = JSON.stringify(data, null, 2);
    downloadBlob(new Blob([jsonStr], { type: 'application/json;charset=utf-8;' }), filename);
  }

  static generateMarkdownReport(report: FinalReport, contractOrLog: ProjectContract | any): string {
    const contract = 'contract' in contractOrLog && contractOrLog.contract ? contractOrLog.contract : contractOrLog;
    const seed = contract?.randomSeed ?? contractOrLog?.randomSeed ?? 42;
    return `# ${report.title}
**Fecha:** ${report.createdAt} | **Alcance:** ${(report.scopeLevel || contract?.scopeLevel || 'predictive').toUpperCase()} | **Semilla RNG:** ${seed}

---

## 1. Resumen Ejecutivo
${report.executiveSummary}

## 2. Contexto de Negocio y Contrato Metodológico
- **Pregunta de Negocio:** ${contract?.businessQuestion || report.businessQuestion}
- **Variable Objetivo (Target):** ${contract?.targetVariable || report.targetVariable || 'No especificada'} (${contract?.targetType || 'multivariado'})
- **Unidad de Observación:** ${contract?.unitOfObservation || 'Una observación'}

${report.businessContext}

## 3. Diagnóstico de Calidad y Tratamiento de Datos
${report.methodologyDataTreatment}

## 4. Hallazgos de la Exploración Visual (Pareto EDA)
${report.exploratoryFindings}

## 5. Evidencia Estadística e Inferencial
${report.statisticalEvidence}

## 6. Desempeño del Modelo Predictivo y Segmentación
${report.modelPerformance}

## 7. Recomendaciones Estratégicas Accionables (Pareto 20/80)
${report.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

---
*Documento generado por Pareto Analytics Suite. 100% verificado con ${report.groundedMetricCounter} evidencias cuantitativas.*
`;
  }

  static generateLatexReport(report: FinalReport, contractOrLog: ProjectContract | any): string {
    const contract = 'contract' in contractOrLog && contractOrLog.contract ? contractOrLog.contract : contractOrLog;
    const seed = contract?.randomSeed ?? contractOrLog?.randomSeed ?? 42;
    return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{amsmath,amssymb}
\\usepackage{booktabs}
\\usepackage{geometry}
\\geometry{margin=2.5cm}

\\title{\\textbf{${report.title}}}
\\author{Pareto Data Science Suite \\\\ \\small Semilla RNG: ${seed}}
\\date{${report.createdAt}}

\\begin{document}
\\maketitle

\\begin{abstract}
${report.executiveSummary}
\\end{abstract}

\\section{Contexto de Negocio y Pregunta de Investigación}
${report.businessContext}

\\section{Saneamiento y Tratamiento de Datos}
${report.methodologyDataTreatment}

\\section{Análisis Exploratorio y Hallazgos Visuales}
${report.exploratoryFindings}

\\section{Inferencia Estadística y Pruebas de Hipótesis}
${report.statisticalEvidence}

\\section{Modelado Predictivo y Validación}
${report.modelPerformance}

\\section{Recomendaciones Estratégicas}
\\begin{enumerate}
${report.recommendations.map(r => `  \\item ${r}`).join('\n')}
\\end{enumerate}

\\end{document}`;
  }

  static exportDecisionLogJson(logs: any, contractOrLog?: any): void {
    const seed = contractOrLog?.randomSeed ?? contractOrLog?.contract?.randomSeed ?? 42;
    const payload = Array.isArray(logs) ? {
      app: 'Pareto Analytics Engine v1.0.4',
      generatedAt: new Date().toISOString(),
      randomSeed: seed,
      contract: contractOrLog || {},
      totalDecisionCount: logs.length,
      logs: logs,
    } : logs;
    PipelineExporter.exportJSON(payload, `log_decisiones_seed${seed}.json`);
  }

  static async generateAndDownloadDocx(report: FinalReport, contractOrLog: ProjectContract | any): Promise<void> {
    const contract = 'contract' in contractOrLog && contractOrLog.contract ? contractOrLog.contract : contractOrLog;
    const seed = contract?.randomSeed ?? contractOrLog?.randomSeed ?? 42;
    const scope = (report.scopeLevel || contract?.scopeLevel || 'predictive').toUpperCase();

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: report.title,
              heading: HeadingLevel.TITLE,
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Fecha: `, bold: true }),
                new TextRun(report.createdAt),
                new TextRun({ text: ` | Alcance: `, bold: true }),
                new TextRun(scope),
                new TextRun({ text: ` | Semilla RNG: `, bold: true }),
                new TextRun(String(seed)),
              ],
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: '1. Resumen Ejecutivo',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 300, after: 150 },
            }),
            new Paragraph({
              text: report.executiveSummary,
              spacing: { after: 200 },
            }),
            new Paragraph({
              text: '2. Contexto de Negocio',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 300, after: 150 },
            }),
            new Paragraph({
              text: report.businessContext,
              spacing: { after: 200 },
            }),
            new Paragraph({
              text: '3. Metodología y Tratamiento de Datos',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 300, after: 150 },
            }),
            new Paragraph({
              text: report.methodologyDataTreatment,
              spacing: { after: 200 },
            }),
            new Paragraph({
              text: '4. Resultados Exploratorios (Pareto)',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 300, after: 150 },
            }),
            new Paragraph({
              text: report.exploratoryFindings,
              spacing: { after: 200 },
            }),
            new Paragraph({
              text: '5. Evidencia Estadística',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 300, after: 150 },
            }),
            new Paragraph({
              text: report.statisticalEvidence,
              spacing: { after: 200 },
            }),
            new Paragraph({
              text: '6. Modelo Predictivo y Factores Clave',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 300, after: 150 },
            }),
            new Paragraph({
              text: report.modelPerformance,
              spacing: { after: 200 },
            }),
            new Paragraph({
              text: '7. Recomendaciones Estratégicas Accionables',
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 300, after: 150 },
            }),
            ...report.recommendations.map(
              (rec, i) =>
                new Paragraph({
                  children: [
                    new TextRun({ text: `• Acción ${i + 1}: `, bold: true }),
                    new TextRun(rec),
                  ],
                  spacing: { after: 120 },
                })
            ),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, 'informe_final_negocio.docx');
  }
}

export const exportCSV = PipelineExporter.exportCSV;
export const exportCleanedCsv = PipelineExporter.exportCSV;
export const exportJSON = PipelineExporter.exportJSON;
export const exportDecisionLogJson = PipelineExporter.exportDecisionLogJson;
export const generateMarkdownReport = PipelineExporter.generateMarkdownReport;
export const generateLatexReport = PipelineExporter.generateLatexReport;
export const generateAndDownloadDocx = PipelineExporter.generateAndDownloadDocx;
export const ReportExporters = PipelineExporter;

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
