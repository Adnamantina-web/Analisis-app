import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { StatisticalValidator } from "./src/lib/data-engine/statistical-validator";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      hasGeminiApiKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // Gemini API Status
  app.get("/api/gemini/status", (req, res) => {
    res.json({
      hasApiKey: !!process.env.GEMINI_API_KEY,
      model: "gemini-3.7-flash",
      capabilityLevel: "Nivel II (Interpretación y Redacción Generativa con LLM)",
    });
  });

  // Statistical Verification Benchmark Endpoint
  app.get("/api/benchmarks/statistics", (req, res) => {
    const benchmarks = StatisticalValidator.runBenchmarks();
    res.json(benchmarks);
  });

  // Storytelling Generative AI Endpoint
  app.post("/api/storytelling/generate", async (req, res) => {
    const { contract, cleaning, eda, inferential, ml, ingest } = req.body;

    if (!contract) {
      return res.status(400).json({ error: "Missing project contract in request payload" });
    }

    const ai = getGeminiClient();

    if (!ai || !process.env.GEMINI_API_KEY) {
      return res.json({
        success: true,
        provenance: "grounded-engine",
        message: "Motor Analítico Determinista por Reglas Certificadas (Grounded Engine)",
        note: "Para activar la redacción generativa con LLM Nivel II, adjunte GEMINI_API_KEY en Settings > Secrets.",
      });
    }

    try {
      const prompt = `
Actúa como un Lead Data Scientist y Consultor Ejecutivo de Negocio. Redacta el Informe Final Ejecutivo de Negocio de 7 secciones basado EXCLUSIVAMENTE en la evidencia empírica real provista a continuación.

REGLAS ESTRICTAS DE RESPETO Y NO ALUCINACIÓN:
1. No inventes ningún número, métrica ni p-valor.
2. Cada afirmación de negocio debe estar respaldada por los datos empíricos calculados en el pipeline.
3. El resumen ejecutivo debe tener un máximo de 3 frases contundentes y cero tecnicismos.
4. Aplica el Principio de Pareto (20/80) para destacar los factores críticos.
5. El tono debe ser ejecutivo, formal, no técnico y orientado a decisiones estratégicas.

DATOS EMPÍRICOS CALCULADOS DEL PIPELINE:
- Contrato de Proyecto:
  - Pregunta de Negocio: "${contract.businessQuestion}"
  - Variable Objetivo: "${contract.targetVariable || 'Análisis Multivariado Global'}"
  - Unidad de Observación: "${contract.unitOfObservation}"
  - Alcance: "${contract.scopeLevel}"
- Ingesta y Limpieza:
  - Archivo original: "${ingest?.fileName || 'dataset.csv'}" con ${ingest?.rowCount || cleaning?.finalRowCount} filas y ${ingest?.columnCount || cleaning?.finalColumnCount} columnas.
  - Duplicados eliminados: ${cleaning?.duplicateRowsRemoved ?? 0}
  - Celdas nulas imputadas: ${cleaning?.totalNullsImputed ?? 0}
  - Registros finales limpios: ${cleaning?.finalRowCount} observaciones certificadas.
- Hallazgos Exploratorios (EDA):
  - Gráficos clave: ${(eda?.charts || []).slice(0, 3).map((c: any) => `${c.title} (${c.businessTakeaway})`).join('; ')}
  - Principales correlaciones: ${(eda?.correlationMatrix?.topPairs || []).slice(0, 2).map((p: any) => `${p.var1} con ${p.var2} (r=${p.r})`).join('; ')}
- Inferencia Estadística:
  - Pruebas ejecutadas: ${inferential?.testsCount ?? 0}
  - Corrección multiplicidad: ${inferential?.correctionMethod || 'Ninguna'}
  - Pruebas significativas: ${(inferential?.tests || []).filter((t: any) => t.isSignificant).map((t: any) => `${t.variable1} vs ${t.variable2}: ${t.testName}, p=${t.pValue}${t.pValueAdjustedFDR ? ` (FDR=${t.pValueAdjustedFDR})` : ''}, Efecto=${t.effectSizeName} (${t.effectSizeMagnitude})`).join('; ') || 'Ninguna significativa'}
- Machine Learning (si aplica):
  - Mejor modelo: ${ml?.bestModel ? `${ml.bestModel.name} (R²=${ml.bestModel.metrics?.r2 ?? 'N/D'}, F1=${ml.bestModel.metrics?.f1Score ?? 'N/D'}, AUC=${ml.bestModel.metrics?.aucRoc ?? 'N/D'})` : 'No requerido por alcance'}
  - Top Factores Importantes: ${(ml?.bestModel?.featureImportances || []).slice(0, 3).map((f: any) => `${f.feature} (${f.percentage}%)`).join(', ')}

Genera un JSON estructurado con los 7 apartados oficiales.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction: "Eres un analista de datos sénior especializado en redacción ejecutiva rigurosa para alta dirección.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveSummary: {
                type: Type.STRING,
                description: "Resumen ejecutivo en máximo 3 frases concisas sin tecnicismos.",
              },
              businessContext: {
                type: Type.STRING,
                description: "Contexto de negocio y objetivo del contrato.",
              },
              methodologyDataTreatment: {
                type: Type.STRING,
                description: "Tratamiento de datos, limpieza e imputaciones.",
              },
              exploratoryFindings: {
                type: Type.STRING,
                description: "Hallazgos visuales clave de la exploración EDA.",
              },
              statisticalEvidence: {
                type: Type.STRING,
                description: "Evidencia estadística inferencial con p-valores reales.",
              },
              modelPerformance: {
                type: Type.STRING,
                description: "Desempeño del modelo predictivo y factores clave.",
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "4 recomendaciones estratégicas accionables prioritarias.",
              },
            },
            required: [
              "executiveSummary",
              "businessContext",
              "methodologyDataTreatment",
              "exploratoryFindings",
              "statisticalEvidence",
              "modelPerformance",
              "recommendations",
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");

      res.json({
        success: true,
        provenance: "gemini-3.7-flash",
        aiDraft: parsed,
      });
    } catch (err: any) {
      console.error("Gemini API generation error:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Error al invocar Gemini API",
        fallbackAvailable: true,
      });
    }
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});

