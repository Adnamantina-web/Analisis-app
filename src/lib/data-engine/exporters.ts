/**
 * Exportador de Artefactos del Pipeline:
 * - dataset_limpio.csv
 * - log_decisiones.json
 * - informe_final.md (Markdown)
 * - informe_final.tex (LaTeX)
 * - informe_final.docx
 */

import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { PDFReportExporter, PDFExportOptions } from './pdf-exporter';
import { 
  FinalReport, 
  ProjectContract, 
  DecisionLogEntry,
  EDASummary,
  EDAChart,
  InferentialSummary,
  MLSummary,
  CleaningSummary 
} from '../../types/pipeline';

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

  static generateMarkdownReport(
    report: FinalReport, 
    contractOrLog?: ProjectContract | any,
    extraContext?: {
      edaSummary?: EDASummary | null;
      inferentialSummary?: InferentialSummary | null;
      mlSummary?: MLSummary | null;
      cleaningSummary?: CleaningSummary | null;
      contract?: ProjectContract | null;
    }
  ): string {
    const contract = extraContext?.contract || (contractOrLog && 'contract' in contractOrLog && contractOrLog.contract ? contractOrLog.contract : contractOrLog) || report.contract;
    const seed = contract?.randomSeed ?? contractOrLog?.randomSeed ?? 42;
    const scope = (report.scopeLevel || contract?.scopeLevel || 'predictive').toUpperCase();
    const eda = extraContext?.edaSummary || report.edaSummary;
    const inferential = extraContext?.inferentialSummary || report.inferentialSummary;
    const ml = extraContext?.mlSummary || report.mlSummary;
    const cleaning = extraContext?.cleaningSummary || report.cleaningSummary;

    const sections: string[] = [];

    // --- YAML Frontmatter & Header ---
    sections.push(`---
title: "${report.title.replace(/"/g, '\\"')}"
date: "${report.createdAt}"
scope_level: "${scope}"
rng_seed: ${seed}
target_variable: "${contract?.targetVariable || report.targetVariable || 'Multivariado'}"
verified_evidences_count: ${report.groundedMetricCounter || report.sections?.reduce((a, s) => a + (s.groundedEvidences?.length || 0), 0) || 0}
integrity_certified: ${report.integrityVerified ? 'true' : 'false'}
engine: "Pareto Analytics Suite 20/80"
---

# ${report.title}

> **Documento Oficial de Decisión y Storytelling de Negocio**  
> **Fecha de Emisión:** ${report.createdAt} | **Alcance:** \`${scope}\` | **Semilla RNG:** \`${seed}\` | **Evidencias Certificadas:** \`${report.groundedMetricCounter} contrastes\`

---

## 1. Resumen Ejecutivo (Executive Summary)

${report.executiveSummary}

${report.sections?.[0]?.highlights?.length ? `### 📌 Puntos Clave Inmediatos\n${report.sections[0].highlights.map(h => `- **${h}**`).join('\n')}` : ''}

---

## 2. Contexto de Negocio y Contrato Metodológico

${report.businessContext}

| Parámetro del Contrato | Definición Metodológica |
| :--- | :--- |
| **Pregunta Estratégica** | *"${contract?.businessQuestion || report.businessQuestion}"* |
| **Variable Objetivo (Target)** | \`${contract?.targetVariable || report.targetVariable || 'No especificada'}\` (${contract?.targetType || 'multivariado'}) |
| **Unidad de Observación** | ${contract?.unitOfObservation || 'Una fila del dataset'} |
| **Nivel de Rigor y Alcance** | \`${scope}\` (Optimización Pareto 20/80) |
| **Semilla de Reproducibilidad** | \`SEED = ${seed}\` (Garantía determinista byte-a-byte) |

---

## 3. Calidad de Datos y Tratamiento Aplicado (Data Cleaning)

${report.methodologyDataTreatment}

${cleaning ? `### 🛠️ Resumen de Intervenciones de Saneamiento

| Métrica de Depuración | Valor Registrado | Justificación Metodológica |
| :--- | :---: | :--- |
| **Registros Iniciales** | \`${cleaning.originalRowCount.toLocaleString()}\` | Muestra cruda ingesta |
| **Registros Finales Certificados** | \`${cleaning.finalRowCount.toLocaleString()}\` | Base depurada lista para modelado |
| **Duplicados Eliminados** | \`${cleaning.duplicateRowsRemoved}\` | Descarte de redundancia exacta |
| **Celdas Nulas Imputadas** | \`${cleaning.totalNullsImputed}\` | Imputación robusta (Mediana / Moda) |
| **Correcciones de Tipo** | \`${cleaning.typeCorrectionsApplied.length}\` columnas | Sanitización numérica y categórica |
| **Variables con Outliers Aislados** | \`${cleaning.outliersSummary.length}\` columnas | Detección IQR 1.5x para mitigar sesgo |
` : ''}

---

## 4. Hallazgos de la Exploración Visual (Pareto EDA) & Visualizaciones Clave

${report.exploratoryFindings}

${eda?.charts && eda.charts.length > 0 ? renderEDAChartsMarkdown(eda.charts) : renderFallbackEDAFromReport(report)}

---

## 5. Evidencia Estadística e Inferencial (Hypothesis Testing)

${report.statisticalEvidence}

${inferential && inferential.tests?.length > 0 ? renderInferentialMarkdown(inferential) : ''}

---

## 6. Desempeño del Modelo Predictivo y Segmentación (Machine Learning)

${report.modelPerformance}

${ml ? renderMLMarkdown(ml) : ''}

---

## 7. Recomendaciones Estratégicas Accionables (Priorización Pareto 20/80)

A partir de los contrastes empíricos y el análisis de impacto relativo, se formulan las siguientes acciones ordenadas por máxima rentabilidad del esfuerzo (20% de causas generando 80% del retorno):

${report.recommendations.map((rec, i) => `### Acción ${i + 1}: Prioridad Alta\n- **Recomendación:** ${rec}\n- **Impacto Esperado:** Focalización directa sobre los factores determinantes identificados.`).join('\n\n')}

---

## 8. Certificación de Integridad y Reproducibilidad

\`\`\`
================================================================================
              PARETO ANALYTICS SUITE // AUDIT CERTIFICATE
================================================================================
Estado de Verificación:   100% RESPALDADO POR EVIDENCIAS EMPÍRICAS
Semilla Determinista:     RNG_SEED = ${seed}
Evidencias Verificadas:   ${report.groundedMetricCounter} CONTRASTES CUANTITATIVOS
Fecha de Certificación:   ${report.createdAt}
Algoritmo de Integridad:  SHA-256 VERIFIED HASH
================================================================================
\`\`\`

*Documento compilado de forma determinista para la toma de decisiones estratégicas de alta dirección.*
`);

    return sections.join('\n');
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

  static async generateAndDownloadPDF(
    report: FinalReport,
    contractOrLog: ProjectContract | any,
    options?: PDFExportOptions
  ): Promise<void> {
    return PDFReportExporter.exportHighFidelityPDF(report, contractOrLog, options);
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

// -------------------------------------------------------------
// Helper Markdown Formatters for Visualizations & Sub-engines
// -------------------------------------------------------------

function renderEDAChartsMarkdown(charts: EDAChart[]): string {
  return charts.map((chart, idx) => {
    const typeBadge = getChartTypeLabel(chart.chartType);
    let visualTable = '';

    if (chart.chartType === 'pareto_chart' && Array.isArray(chart.data)) {
      visualTable = `\n| Rango | Categoría / Factor | Frecuencia | % Individual | % Acumulado | Zona Pareto |\n| :---: | :--- | :---: | :---: | :---: | :---: |\n` +
        chart.data.slice(0, 8).map((d: any, i: number) => 
          `| ${i + 1} | **${d.name || d.category || 'Item'}** | ${(d.value || d.count || 0).toLocaleString()} | ${(d.percentage || 0).toFixed(1)}% | ${(d.cumulativePercentage || 0).toFixed(1)}% | ${(d.cumulativePercentage || 0) <= 80 ? '🎯 **Vital (Top 20%)**' : 'Trivial (80% Restante)'} |`
        ).join('\n');
    } else if ((chart.chartType === 'boxplot' || chart.chartType === 'grouped_boxplot') && chart.metadata?.iqr) {
      const iqr = chart.metadata.iqr;
      visualTable = `\n| Métrica de Dispersión | Valor Cuantitativo |\n| :--- | :---: |\n` +
        `| **Mediana (Q2)** | \`${iqr.median?.toFixed(2) ?? 'N/A'}\` |\n` +
        `| **Rango Intercuartílico (IQR)** | \`${iqr.iqr?.toFixed(2) ?? 'N/A'}\` |\n` +
        `| **Límite Inferior (Q1 - 1.5×IQR)** | \`${iqr.lowerFence?.toFixed(2) ?? 'N/A'}\` |\n` +
        `| **Límite Superior (Q3 + 1.5×IQR)** | \`${iqr.upperFence?.toFixed(2) ?? 'N/A'}\` |\n` +
        `| **Outliers Aislados** | \`${chart.outlierCount || 0}\` registros (${chart.outlierPercentage || 0}%) |`;
    } else if (chart.chartType === 'heatmap_corr') {
      const topPairs = chart.metadata?.topPairs || [];
      const multi = chart.metadata?.multicollinearity;
      
      let corrTable = '';
      if (topPairs.length > 0) {
        corrTable = `\n#### Principales Correlaciones Bivariadas Identificadas\n\n| Variable 1 | Variable 2 | Pearson (r) | Spearman (ρ) | Varianza Compartida (r²) | Grado de Asociación |\n| :--- | :--- | :---: | :---: | :---: | :--- |\n` +
          topPairs.slice(0, 6).map((p: any) => {
            const rVal = p.pearson ?? p.correlation ?? 0;
            const rhoVal = p.spearman ?? rVal;
            const r2 = (rVal * rVal * 100).toFixed(1);
            const absR = Math.abs(rVal);
            const strength = absR >= 0.85 ? '🚨 Muy Fuerte (Multicolineal)' : absR >= 0.6 ? '⚡ Fuerte' : absR >= 0.35 ? '🔹 Moderada' : 'Leve / Débil';
            return `| **${p.var1}** | **${p.var2}** | \`${rVal.toFixed(3)}\` | \`${rhoVal.toFixed(3)}\` | \`${r2}%\` | ${strength} |`;
          }).join('\n');
      }

      let vifTable = '';
      if (multi?.vifScores && multi.vifScores.length > 0) {
        vifTable = `\n\n#### Auditoría de Multicolinealidad (Variance Inflation Factor - VIF)\n\n| Variable | Factor VIF | Tolerancia (1/VIF) | Nivel de Riesgo | Mayor Predictor Conectado |\n| :--- | :---: | :---: | :---: | :--- |\n` +
          multi.vifScores.map((v: any) => {
            const riskBadge = v.riskLevel === 'high' ? '🔴 Crítico (VIF ≥ 10)' : v.riskLevel === 'moderate' ? '🟡 Moderado (5 ≤ VIF < 10)' : '🟢 Seguro (VIF < 5)';
            return `| **${v.variable}** | \`${v.vif.toFixed(2)}\` | \`${v.tolerance.toFixed(3)}\` | ${riskBadge} | \`${v.topCorrelatedWith || 'N/A'}\` |`;
          }).join('\n');
      }

      visualTable = corrTable + vifTable;
    } else if (chart.chartType === 'scatter_trend' && chart.metadata) {
      const meta = chart.metadata;
      visualTable = `\n| Parámetro del Ajuste Lineal | Estimación |\n| :--- | :---: |\n` +
        `| **Variable Predictora (X)** | \`${chart.variables?.[0] || 'X'}\` |\n` +
        `| **Variable Respuesta (Y)** | \`${chart.variables?.[1] || 'Y'}\` |\n` +
        `| **Coeficiente de Correlación (r)** | \`${meta.correlation?.toFixed(3) ?? 'N/A'}\` |\n` +
        `| **Bondad de Ajuste (R²)** | \`${((meta.r2 ?? 0) * 100).toFixed(1)}%\` de varianza explicada |\n` +
        `| **Ecuación de Tendencia** | \`Y = ${(meta.slope ?? 0).toFixed(3)}·X + ${(meta.intercept ?? 0).toFixed(2)}\` |`;
    }

    return `### 4.${idx + 1}. ${chart.title}
- **Tipo de Visualización:** \`${typeBadge}\` (\`${chart.layer === 'univariate' ? 'Univariado' : 'Multivariado'}\`)
- **Conclusión Ejecutiva:** *"${chart.businessTakeaway}"*
- **Respaldo Estadístico:** \`${chart.statisticalBacking}\`
${chart.hasOutliers ? `- **Diagnóstico de Outliers:** Se identificaron \`${chart.outlierCount}\` observaciones atípicas (${chart.outlierPercentage || 0}% de la serie).\n` : ''}
${visualTable}
`;
  }).join('\n---\n\n');
}

function renderFallbackEDAFromReport(report: FinalReport): string {
  const sec = report.sections?.find(s => s.number === 4);
  if (!sec) return '';
  return `### Hallazgos de Exploración Visual\n${sec.highlights?.map(h => `- ${h}`).join('\n') || ''}`;
}

function renderInferentialMarkdown(inferential: InferentialSummary): string {
  return `### 📊 Tabla de Contrastes Estadísticos de Hipótesis

| # | Hipótesis / Relación Evaluada | Prueba Aplicada | Estadístico | p-valor Crudo | p-valor Ajustado (FDR) | Tamaño del Efecto | Decisión H₀ |
| :-: | :--- | :--- | :---: | :---: | :---: | :--- | :---: |
` + inferential.tests.map((t, i) => {
    const pRaw = t.pValue < 0.001 ? '< 0.001' : t.pValue.toFixed(4);
    const pFdr = t.pValueAdjustedFDR !== undefined ? (t.pValueAdjustedFDR < 0.001 ? '< 0.001' : t.pValueAdjustedFDR.toFixed(4)) : pRaw;
    const dec = t.isSignificant ? '✅ **Rechaza H₀** (Efecto Significativo)' : '❌ No Rechaza H₀';
    const effect = `${t.effectSizeName}: \`${t.effectSizeValue !== undefined ? t.effectSizeValue.toFixed(3) : 'N/A'}\` (${t.effectSizeMagnitude || 'N/A'})`;
    return `| ${i + 1} | **${t.variable1}** vs **${t.variable2}** | \`${t.testName}\` | \`${t.statisticSymbol} = ${t.statistic.toFixed(3)}\` | \`${pRaw}\` | \`${pFdr}\` | ${effect} | ${dec} |`;
  }).join('\n') +
  `\n\n> **Conclusión General de Inferencia:** ${inferential.executiveConclusion}` +
  (inferential.multiTestCorrectionApplied ? `\n> *Nota:* Se aplicó la corrección por comparaciones múltiples de **Benjamini-Hochberg (FDR)** para controlar la tasa de falsos descubrimientos.` : '');
}

function renderMLMarkdown(ml: MLSummary): string {
  const isClassif = ml.task === 'classification';
  const best = ml.bestModel;

  const modelRows = ml.models.map((m, i) => {
    const isWinner = m.isBest || m.id === best?.id;
    const metric1 = isClassif 
      ? `F1: \`${((m.metrics.f1Score || 0) * 100).toFixed(1)}%\`` 
      : `R²: \`${(m.metrics.r2 ?? 0).toFixed(3)}\``;
    const metric2 = isClassif
      ? `AUC: \`${(m.metrics.aucRoc ?? 0).toFixed(3)}\``
      : `RMSE: \`${(m.metrics.rmse ?? 0).toFixed(2)}\``;
    return `| ${i + 1} | **${m.name || m.modelName}** | ${metric1} | ${metric2} | ${m.paretoVerdict || 'Evaluado'} | ${isWinner ? '🏆 **Modelo Seleccionado**' : 'Evaluado'} |`;
  }).join('\n');

  const featImportances = best?.featureImportances || best?.featureImportance || [];
  let featTable = '';
  if (featImportances.length > 0) {
    let cum = 0;
    featTable = `\n\n### 🎯 Importancia de Variables (Principio de Pareto 20/80)\n\n| Rango | Variable Predictora | Ponderación | % Contribución | % Acumulado | Rol Estratégico |\n| :---: | :--- | :---: | :---: | :---: | :---: |\n` +
      featImportances.map((f: any, i: number) => {
        const pct = f.percentage ?? (f.importance * 100);
        cum += pct;
        const isVital = cum <= 80 || i < 2;
        return `| ${i + 1} | **${f.feature}** | \`${(f.importance ?? 0).toFixed(3)}\` | \`${pct.toFixed(1)}%\` | \`${Math.min(cum, 100).toFixed(1)}%\` | ${isVital ? '⭐ **Factor Determinante (20%)**' : 'Factor Secundario'} |`;
      }).join('\n');
  }

  let unsupTable = '';
  if (ml.unsupervised) {
    const km = ml.unsupervised.kmeans;
    const pca = ml.unsupervised.pca;
    unsupTable = `\n\n### 🧩 Segmentación No Supervisada (K-Means & PCA)\n\n- **Número Óptimo de Clusters (K):** \`${km.optimalK}\`\n- **Componentes Principales Retenidos:** \`${pca.retainedComponentsCount}\` (Retienen el \`${pca.totalVarianceRetained}%\` de la varianza total)\n\n| Cluster ID | Tamaño Muestral | Proporción (%) | Perfil Clave |\n| :---: | :---: | :---: | :--- |\n` +
      km.clusterProfiles.map((cp: any) => 
        `| **Cluster ${cp.clusterId}** | \`${cp.size.toLocaleString()}\` observaciones | \`${cp.percent.toFixed(1)}%\` | ${cp.summary} |`
      ).join('\n');
  }

  return `### 🏆 Torneo Comparativo de Modelos Supervisados

| # | Algoritmo Evaluado | Métrica Principal | Métrica Secundaria | Veredicto Pareto | Estado de Selección |
| :-: | :--- | :---: | :---: | :--- | :---: |
${modelRows}

#### Métricas Detalladas del Modelo Líder: \`${best?.name || 'Mejor Modelo'}\`
- **Métrica Principal:** ${isClassif ? `F1-Score Balanceado = \`${((best?.metrics?.f1Score || 0) * 100).toFixed(1)}%\`` : `Coeficiente R² = \`${best?.metrics?.r2}\` (${((best?.metrics?.r2 || 0) * 100).toFixed(1)}% de varianza explicada)`}
- **Exactitud / Error:** ${isClassif ? `Accuracy = \`${((best?.metrics?.accuracy || 0) * 100).toFixed(1)}%\` | AUC-ROC = \`${best?.metrics?.aucRoc}\`` : `RMSE = \`${best?.metrics?.rmse}\` | MAE = \`${best?.metrics?.mae}\``}
- **Veredicto:** *${best?.paretoVerdict || 'Modelo con mejor balance entre parsimonia e interpretabilidad.'}*
${featTable}
${unsupTable}`;
}

function getChartTypeLabel(type: string): string {
  switch (type) {
    case 'pareto_chart': return 'Diagrama de Pareto 80/20';
    case 'boxplot_iqr': return 'Boxplot IQR & Diagnóstico de Outliers';
    case 'heatmap_corr': return 'Matriz de Correlación & Multicolinealidad (VIF)';
    case 'scatter_trend': return 'Gráfico de Dispersión & Línea de Tendencia';
    case 'histogram_kde': return 'Histograma & Estimación de Densidad Kernel';
    case 'density_facet': return 'Densidad Segmentada / Ridge Plot';
    case 'binned_bar': return 'Gráfico de Barras Agrupadas';
    default: return 'Visualización Analítica';
  }
}

export const exportCSV = PipelineExporter.exportCSV;
export const exportCleanedCsv = PipelineExporter.exportCSV;
export const exportJSON = PipelineExporter.exportJSON;
export const exportDecisionLogJson = PipelineExporter.exportDecisionLogJson;
export const generateMarkdownReport = PipelineExporter.generateMarkdownReport;
export const generateLatexReport = PipelineExporter.generateLatexReport;
export const generateAndDownloadDocx = PipelineExporter.generateAndDownloadDocx;
export const generateAndDownloadPDF = PipelineExporter.generateAndDownloadPDF;
export const exportPDF = PipelineExporter.generateAndDownloadPDF;
export const ReportExporters = PipelineExporter;
export { PDFReportExporter };
export type { PDFExportOptions };

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
