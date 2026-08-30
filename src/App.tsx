import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Capa0Ingestion } from './components/Capa0Ingestion';
import { Capa1Strategy } from './components/Capa1Strategy';
import { Capa2Cleaning } from './components/Capa2Cleaning';
import { Capa3EDA } from './components/Capa3EDA';
import { Capa4Inference } from './components/Capa4Inference';
import { Capa5MachineLearning } from './components/Capa5MachineLearning';
import { Capa6Storytelling } from './components/Capa6Storytelling';
import { ArtifactsModal } from './components/ArtifactsModal';

import { 
  ColumnCleaningStrategy, 
  DecisionLog, 
  EDASummary, 
  FinalReport, 
  InferentialSummary, 
  IngestSummary, 
  MLSummary, 
  ProjectContract, 
  CleaningSummary 
} from './types/pipeline';
import { SAMPLE_DATASETS } from './lib/data-engine/sample-datasets';
import { DelimitedTextDataSource, JsonDataSource, XlsxDataSource } from './lib/data-engine/data-sources';
import { IngestionEngine } from './lib/data-engine/ingestion';
import { CleaningEngine } from './lib/data-engine/cleaning';
import { EDAEngine } from './lib/data-engine/eda';
import { StatisticsEngine } from './lib/data-engine/statistics';
import { MachineLearningEngine } from './lib/data-engine/machine-learning';
import { StorytellingEngine } from './lib/data-engine/storytelling';

export default function App() {
  const [currentLayer, setCurrentLayer] = useState<number>(0);
  const [completedLayers, setCompletedLayers] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isArtifactsModalOpen, setIsArtifactsModalOpen] = useState<boolean>(false);

  // Pipeline Data States
  const [selectedSampleId, setSelectedSampleId] = useState<string>('ecommerce_churn');
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [cleanedRows, setCleanedRows] = useState<Record<string, any>[]>([]);
  const [ingestSummary, setIngestSummary] = useState<IngestSummary | null>(null);
  const [contract, setContract] = useState<ProjectContract>({
    businessQuestion: '¿Qué factores clave predicen el abandono de clientes de alto valor y cómo optimizar la retención?',
    targetVariable: 'abandono_cliente',
    targetType: 'qualitative',
    unitOfObservation: 'Un cliente registrado en el CRM e-commerce',
    scopeLevel: 'predictive',
    randomSeed: 42,
    createdAt: new Date().toISOString().split('T')[0],
    signedBy: 'Lead Data Scientist & Arquitecto Analítico',
  });
  const [cleaningSummary, setCleaningSummary] = useState<CleaningSummary | null>(null);
  const [edaSummary, setEdaSummary] = useState<EDASummary | null>(null);
  const [inferentialSummary, setInferentialSummary] = useState<InferentialSummary | null>(null);
  const [mlSummary, setMlSummary] = useState<MLSummary | null>(null);
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
  const [decisionLog, setDecisionLog] = useState<DecisionLog | null>(null);

  // Load a sample dataset or user file
  const loadDataset = useCallback(async (sampleId: string) => {
    setIsProcessing(true);
    try {
      const sample = SAMPLE_DATASETS.find(d => d.id === sampleId) || SAMPLE_DATASETS[0];
      setSelectedSampleId(sample.id);

      // Create data source
      const ds = new DelimitedTextDataSource(sample.name, sample.rawCsv, ',');
      const loaded = await ds.load();
      const ingested = await IngestionEngine.ingest(ds);

      setRawRows(loaded.rows);
      setIngestSummary(ingested);

      // Update default contract for this dataset
      const newContract: ProjectContract = {
        businessQuestion: sample.suggestedQuestion,
        targetVariable: sample.suggestedTarget,
        targetType: sample.targetType,
        unitOfObservation: sample.unitOfObservation,
        scopeLevel: sample.scopeLevel,
        randomSeed: 42,
        createdAt: new Date().toISOString().split('T')[0],
        signedBy: 'Lead Data Scientist & Arquitecto Analítico',
      };
      setContract(newContract);

      // Auto-compute Initial Diagnostic for Layer 2
      const diag = CleaningEngine.diagnose(loaded.rows, ingested.columns);
      const cleanResult = CleaningEngine.applyCleaning(loaded.rows, ingested.columns, diag.strategies);
      setCleanedRows(cleanResult.cleanedRows);
      setCleaningSummary(cleanResult.summary);

      // Reset advanced layers
      setCompletedLayers([0]);
      setEdaSummary(null);
      setInferentialSummary(null);
      setMlSummary(null);
      setFinalReport(null);
    } catch (err) {
      console.error('Error loading dataset:', err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDataset('ecommerce_churn');
  }, [loadDataset]);

  // Handle custom file upload
  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setSelectedSampleId('custom');
    try {
      let ds;
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        ds = new XlsxDataSource(file.name, buffer);
      } else if (fileName.endsWith('.json')) {
        const text = await file.text();
        ds = new JsonDataSource(file.name, text);
      } else {
        const text = await file.text();
        const delim = fileName.endsWith('.tsv') ? '\t' : undefined;
        ds = new DelimitedTextDataSource(file.name, text, delim);
      }

      const loaded = await ds.load();
      const ingested = await IngestionEngine.ingest(ds);

      setRawRows(loaded.rows);
      setIngestSummary(ingested);

      // Auto contract
      const firstCol = ingested.columns[ingested.columns.length - 1];
      const autoContract: ProjectContract = {
        businessQuestion: `¿Cuáles son las relaciones y patrones determinantes en ${file.name}?`,
        targetVariable: firstCol?.name || null,
        targetType: firstCol?.detectedType === 'numeric' ? 'quantitative' : 'qualitative',
        unitOfObservation: 'Una observación en el conjunto de datos',
        scopeLevel: 'predictive',
        randomSeed: 42,
        createdAt: new Date().toISOString().split('T')[0],
        signedBy: 'Lead Data Scientist & Arquitecto Analítico',
      };
      setContract(autoContract);

      const diag = CleaningEngine.diagnose(loaded.rows, ingested.columns);
      const cleanResult = CleaningEngine.applyCleaning(loaded.rows, ingested.columns, diag.strategies);
      setCleanedRows(cleanResult.cleanedRows);
      setCleaningSummary(cleanResult.summary);

      setCompletedLayers([0]);
      setCurrentLayer(0);
    } catch (err) {
      console.error('Error ingesting file:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Run full 6 layers sequentially
  const handleRunFullPipeline = async () => {
    if (!ingestSummary || rawRows.length === 0) return;
    setIsProcessing(true);

    try {
      // Layer 2: Cleaning
      const diag = CleaningEngine.diagnose(rawRows, ingestSummary.columns);
      const cleanResult = CleaningEngine.applyCleaning(rawRows, ingestSummary.columns, diag.strategies);
      setCleanedRows(cleanResult.cleanedRows);
      setCleaningSummary(cleanResult.summary);

      // Layer 3: EDA
      const eda = EDAEngine.analyze(cleanResult.cleanedRows, cleanResult.summary.cleanedColumns, contract);
      setEdaSummary(eda);

      // Layer 4: Inference
      let inferential = null;
      if (contract.scopeLevel === 'inferential' || contract.scopeLevel === 'predictive') {
        inferential = StatisticsEngine.runInference(cleanResult.cleanedRows, cleanResult.summary.cleanedColumns, contract);
        setInferentialSummary(inferential);
      }

      // Layer 5: ML
      let ml = null;
      if (contract.scopeLevel === 'predictive') {
        ml = MachineLearningEngine.trainAndEvaluate(cleanResult.cleanedRows, cleanResult.summary.cleanedColumns, contract);
        setMlSummary(ml);
      }

      // Layer 6: Storytelling
      const report = StorytellingEngine.generateReport(
        contract,
        ingestSummary,
        cleanResult.summary,
        eda,
        inferential,
        ml
      );
      setFinalReport(report);

      // Build Decision Log
      const log: DecisionLog = {
        projectId: `PRJ-${String(contract.randomSeed).padStart(4, '0')}`,
        contract,
        ingestionMetadata: {
          fileName: ingestSummary.fileName,
          totalRawRows: ingestSummary.rowCount,
          totalRawColumns: ingestSummary.columnCount,
          encoding: ingestSummary.encoding,
        },
        cleaningDecisions: cleanResult.summary.strategies,
        edaTakeaways: eda.charts.map(c => ({ id: c.id, takeaway: c.businessTakeaway })),
        statisticalDecisions: inferential?.tests.map(t => ({
          test: t.testName,
          p: t.pValue,
          rejectNull: t.rejectNullHypothesis,
        })),
        mlDecisions: ml ? {
          bestModel: ml.bestModel.modelName,
          metrics: ml.bestModel.metrics,
          topFeatures: ml.bestModel.featureImportance.slice(0, 3),
        } : undefined,
        randomSeed: contract.randomSeed,
        certifiedTimestamp: new Date().toISOString(),
      };
      setDecisionLog(log);

      setCompletedLayers([0, 1, 2, 3, 4, 5, 6]);
      setCurrentLayer(6);
    } catch (err) {
      console.error('Error running full pipeline:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-run layer computations on step change
  const handleProceedToCleaning = () => {
    if (!ingestSummary) return;
    const diag = CleaningEngine.diagnose(rawRows, ingestSummary.columns);
    const cleanResult = CleaningEngine.applyCleaning(rawRows, ingestSummary.columns, diag.strategies);
    setCleanedRows(cleanResult.cleanedRows);
    setCleaningSummary(cleanResult.summary);
    setCompletedLayers(prev => Array.from(new Set([...prev, 1])));
    setCurrentLayer(2);
  };

  const handleApplyCleaningStrategies = (strategies: ColumnCleaningStrategy[]) => {
    if (!ingestSummary) return;
    const cleanResult = CleaningEngine.applyCleaning(rawRows, ingestSummary.columns, strategies);
    setCleanedRows(cleanResult.cleanedRows);
    setCleaningSummary(cleanResult.summary);
  };

  const handleProceedToEDA = () => {
    if (!cleaningSummary) return;
    const eda = EDAEngine.analyze(cleanedRows, cleaningSummary.cleanedColumns, contract);
    setEdaSummary(eda);
    setCompletedLayers(prev => Array.from(new Set([...prev, 2])));
    setCurrentLayer(3);
  };

  const handleProceedToInference = () => {
    if (!cleaningSummary) return;
    if (contract.scopeLevel === 'descriptive') {
      // Skip directly to storytelling
      handleProceedToReport();
      return;
    }
    const inferential = StatisticsEngine.runInference(cleanedRows, cleaningSummary.cleanedColumns, contract);
    setInferentialSummary(inferential);
    setCompletedLayers(prev => Array.from(new Set([...prev, 3])));
    setCurrentLayer(4);
  };

  const handleProceedToML = () => {
    if (!cleaningSummary) return;
    if (contract.scopeLevel === 'inferential') {
      handleProceedToReport();
      return;
    }
    const ml = MachineLearningEngine.trainAndEvaluate(cleanedRows, cleaningSummary.cleanedColumns, contract);
    setMlSummary(ml);
    setCompletedLayers(prev => Array.from(new Set([...prev, 4])));
    setCurrentLayer(5);
  };

  const handleProceedToReport = () => {
    if (!ingestSummary || !cleaningSummary || !edaSummary) return;
    const report = StorytellingEngine.generateReport(
      contract,
      ingestSummary,
      cleaningSummary,
      edaSummary,
      inferentialSummary,
      mlSummary
    );
    setFinalReport(report);

    const log: DecisionLog = {
      projectId: `PRJ-${String(contract.randomSeed).padStart(4, '0')}`,
      contract,
      ingestionMetadata: {
        fileName: ingestSummary.fileName,
        totalRawRows: ingestSummary.rowCount,
        totalRawColumns: ingestSummary.columnCount,
        encoding: ingestSummary.encoding,
      },
      cleaningDecisions: cleaningSummary.strategies,
      edaTakeaways: edaSummary.charts.map(c => ({ id: c.id, takeaway: c.businessTakeaway })),
      statisticalDecisions: inferentialSummary?.tests.map(t => ({
        test: t.testName,
        p: t.pValue,
        rejectNull: t.rejectNullHypothesis,
      })),
      mlDecisions: mlSummary ? {
        bestModel: mlSummary.bestModel.modelName,
        metrics: mlSummary.bestModel.metrics,
        topFeatures: mlSummary.bestModel.featureImportance.slice(0, 3),
      } : undefined,
      randomSeed: contract.randomSeed,
      certifiedTimestamp: new Date().toISOString(),
    };
    setDecisionLog(log);

    setCompletedLayers(prev => Array.from(new Set([...prev, 5, 6])));
    setCurrentLayer(6);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF8F5] font-sans antialiased text-[#1A1A1A]">
      {/* Editorial Sidebar Navigation */}
      <div className={`fixed inset-y-0 left-0 z-40 lg:static lg:block transition-transform duration-300 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <Sidebar
          currentLayer={currentLayer}
          onSelectLayer={(l) => {
            setCurrentLayer(l);
            setMobileMenuOpen(false);
          }}
          completedLayers={completedLayers}
          scopeLevel={contract.scopeLevel}
          contract={contract}
          randomSeed={contract.randomSeed}
          onOpenArtifactsModal={() => setIsArtifactsModalOpen(true)}
        />
      </div>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 max-w-7xl w-full mx-auto">
          {/* Editorial Top Header */}
          <Header
            contract={contract}
            selectedSampleId={selectedSampleId}
            onSelectSampleDataset={loadDataset}
            onRunFullPipeline={handleRunFullPipeline}
            onOpenArtifactsModal={() => setIsArtifactsModalOpen(true)}
            isProcessing={isProcessing}
            currentLayer={currentLayer}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
          />

          {/* Active Layer Screen */}
          {currentLayer === 0 && (
            <Capa0Ingestion
              ingestSummary={ingestSummary}
              onFileUpload={handleFileUpload}
              onSelectSampleDataset={loadDataset}
              selectedSampleId={selectedSampleId}
              onProceedToNext={() => {
                setCompletedLayers(prev => Array.from(new Set([...prev, 0])));
                setCurrentLayer(1);
              }}
              isProcessing={isProcessing}
            />
          )}

          {currentLayer === 1 && (
            <Capa1Strategy
              contract={contract}
              columns={ingestSummary?.columns || []}
              onUpdateContract={(up) => setContract(prev => ({ ...prev, ...up }))}
              onProceedToCleaning={handleProceedToCleaning}
              isProcessing={isProcessing}
            />
          )}

          {currentLayer === 2 && (
            <Capa2Cleaning
              cleaningSummary={cleaningSummary}
              onApplyCleaning={handleApplyCleaningStrategies}
              onProceedToEDA={handleProceedToEDA}
              isProcessing={isProcessing}
              originalRowCount={rawRows.length}
            />
          )}

          {currentLayer === 3 && (
            <Capa3EDA
              edaSummary={edaSummary}
              onProceedToInference={handleProceedToInference}
              isProcessing={isProcessing}
              scopeLevel={contract.scopeLevel}
            />
          )}

          {currentLayer === 4 && (
            <Capa4Inference
              inferentialSummary={inferentialSummary}
              onProceedToML={handleProceedToML}
              isProcessing={isProcessing}
              scopeLevel={contract.scopeLevel}
            />
          )}

          {currentLayer === 5 && (
            <Capa5MachineLearning
              mlSummary={mlSummary}
              onProceedToReport={handleProceedToReport}
              isProcessing={isProcessing}
            />
          )}

          {currentLayer === 6 && (
            <Capa6Storytelling
              report={finalReport}
              decisionLog={decisionLog}
              cleanedData={cleanedRows}
              rawData={rawRows}
              edaSummary={edaSummary}
              inferentialSummary={inferentialSummary}
              mlSummary={mlSummary}
              cleaningSummary={cleaningSummary}
              contract={contract}
              onOpenArtifactsModal={() => setIsArtifactsModalOpen(true)}
              isProcessing={isProcessing}
            />
          )}
        </main>
      </div>

      {/* Artifacts Download Modal */}
      <ArtifactsModal
        isOpen={isArtifactsModalOpen}
        onClose={() => setIsArtifactsModalOpen(false)}
        finalReport={finalReport}
        contract={contract}
        cleaningSummary={cleaningSummary}
        edaSummary={edaSummary}
        inferentialSummary={inferentialSummary}
        mlSummary={mlSummary}
        decisionLogs={decisionLog?.entries || []}
        cleanedRows={cleanedRows}
      />
    </div>
  );
}
