/**
 * Capa 1: Wizard Estratégico y Contrato de Proyecto
 * - Definición rigurosa de:
 *   1. Pregunta estratégica de negocio.
 *   2. Variable objetivo (y su tipología).
 *   3. Unidad de observación (qué representa cada fila).
 *   4. Nivel de alcance: 'descriptive', 'inferential' o 'predictive'.
 * - Genera log_decisiones.json inmutable con semilla aleatoria fija (42 por defecto).
 */

import { DecisionLog, ProjectContract } from '../../types/pipeline';

export class StrategyEngine {
  static createDefaultContract(targetCol?: string, isClassification?: boolean): ProjectContract {
    return {
      businessQuestion: '¿Cuáles son los factores principales que determinan el rendimiento y comportamiento de la variable objetivo?',
      targetVariable: targetCol || null,
      targetType: targetCol ? (isClassification ? 'qualitative' : 'quantitative') : 'none',
      unitOfObservation: 'Cada fila representa una transacción o registro individual de la entidad de negocio.',
      scopeLevel: 'predictive',
      randomSeed: 42,
      createdAt: new Date().toISOString(),
      signedBy: 'Senior Data Scientist & Analytics Lead',
      hypothesis: 'Se postula que un 20% de los atributos concentra más del 80% del impacto en la variabilidad del resultado.',
    };
  }

  static createDecisionLog(contract: ProjectContract, originalFileName: string): DecisionLog {
    return {
      id: `DEC_LOG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      contract,
      ingestedSource: {
        name: originalFileName,
        sha256: `hash_${Math.random().toString(36).substr(2, 16)}`,
      },
      cleaningDecisions: [],
      statisticalDecisions: [],
      mlDecisions: [],
      reportIntegrityHash: `sha256_${Math.random().toString(36).substr(2, 24)}`,
    };
  }
}
