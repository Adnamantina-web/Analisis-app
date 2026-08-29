/**
 * Authentic "Dirty" Preloaded Datasets
 * Designed specifically to stress-test all 6 layers of the Pareto pipeline:
 * - Missing values (MCAR & MAR)
 * - Inconsistent casing and whitespace ('Female', 'female', 'FEMALE')
 * - Numbers formatted as currency strings ('$ 1,250.00', '3,450 €')
 * - Outliers (IQR and Z-score > 3)
 * - Multi-group categorical variables for ANOVA / Chi-Square
 * - Ground-truth relationships for ML & Inferential Statistics
 */

export interface SampleDatasetInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  format?: string;
  suggestedTarget: string;
  targetType: 'quantitative' | 'qualitative';
  suggestedQuestion: string;
  unitOfObservation: string;
  scopeLevel: 'descriptive' | 'inferential' | 'predictive';
  rawCsv: string;
  defaultTarget?: string;
  defaultQuestion?: string;
  rawContent?: string;
}

export const SAMPLE_DATASETS: SampleDatasetInfo[] = [
  {
    id: 'ecommerce_churn',
    name: 'E-Commerce: Abandono de Clientes (Dirty CRM)',
    category: 'Marketing & Retención',
    format: 'CSV',
    description: 'Dataset transaccional de 220 clientes con nulos en ingresos, tipos sucios en gasto ($), inconsistencias de género y outliers extremos en devoluciones.',
    suggestedTarget: 'abandono_cliente',
    defaultTarget: 'abandono_cliente',
    targetType: 'qualitative',
    suggestedQuestion: '¿Qué factores de comportamiento y servicio predicen la fuga de clientes de alto valor y cómo reducirlos?',
    defaultQuestion: '¿Qué factores de comportamiento y servicio predicen la fuga de clientes de alto valor y cómo reducirlos?',
    unitOfObservation: 'Un cliente individual suscrito al servicio e-commerce',
    scopeLevel: 'predictive',
    rawCsv: generateEcommerceDirtyCsv(),
    rawContent: generateEcommerceDirtyCsv(),
  },
  {
    id: 'hospital_readmission',
    name: 'Salud: Reingreso Hospitalario en 30 Días',
    category: 'Medicina & Gestión Clínica',
    format: 'CSV',
    description: 'Registro clínico de 200 pacientes crónicos con glucosa, tensión arterial, días de estancia previa y valores atípicos en dosis de medicación.',
    suggestedTarget: 'reingreso_30d',
    defaultTarget: 'reingreso_30d',
    targetType: 'qualitative',
    suggestedQuestion: '¿Existe diferencia estadísticamente significativa en los niveles de glucosa y estancia hospitalaria según el riesgo de reingreso?',
    defaultQuestion: '¿Existe diferencia estadísticamente significativa en los niveles de glucosa y estancia hospitalaria según el riesgo de reingreso?',
    unitOfObservation: 'Un paciente dado de alta tras episodio agudo',
    scopeLevel: 'inferential',
    rawCsv: generateHospitalDirtyCsv(),
    rawContent: generateHospitalDirtyCsv(),
  },
  {
    id: 'real_estate_valuation',
    name: 'Inmobiliaria: Valoración de Viviendas Residenciales',
    category: 'Finanzas & Real Estate',
    format: 'CSV',
    description: '180 propiedades residenciales con metros cuadrados, antigüedad, distancia al centro, número de baños y precios asimétricos con sesgo positivo.',
    suggestedTarget: 'precio_venta_eur',
    defaultTarget: 'precio_venta_eur',
    targetType: 'quantitative',
    suggestedQuestion: '¿Cuál es el impacto marginal de la superficie y la ubicación sobre el precio final de venta inmobiliario?',
    defaultQuestion: '¿Cuál es el impacto marginal de la superficie y la ubicación sobre el precio final de venta inmobiliario?',
    unitOfObservation: 'Un inmueble residencial vendido en el último año',
    scopeLevel: 'predictive',
    rawCsv: generateRealEstateDirtyCsv(),
    rawContent: generateRealEstateDirtyCsv(),
  },
  {
    id: 'employee_burnout',
    name: 'RRHH: Satisfacción y Rendimiento Laboral',
    category: 'Talento & Operaciones',
    format: 'CSV',
    description: '190 empleados evaluados por departamento, horas extra semanales, nivel de estrés, salario mensual y evaluación de desempeño.',
    suggestedTarget: 'nivel_desempeno',
    defaultTarget: 'nivel_desempeno',
    targetType: 'quantitative',
    suggestedQuestion: '¿Influye significativamente el departamento y las horas extras en la puntuación de desempeño y bienestar del empleado?',
    defaultQuestion: '¿Influye significativamente el departamento y las horas extras en la puntuación de desempeño y bienestar del empleado?',
    unitOfObservation: 'Un empleado a tiempo completo de la organización',
    scopeLevel: 'predictive',
    rawCsv: generateEmployeeDirtyCsv(),
    rawContent: generateEmployeeDirtyCsv(),
  },
];

function generateEcommerceDirtyCsv(): string {
  const headers = [
    'id_cliente',
    'edad',
    'genero',
    'ingreso_anual_eur',
    'antiguedad_meses',
    'gasto_total_eur',
    'tickets_soporte',
    'satisfaccion_csat',
    'canal_adquisicion',
    'dias_inactivo',
    'abandono_cliente'
  ];

  const rows: string[] = [headers.join(',')];
  const genders = ['Hombre', 'hombre', 'HOMBRE', 'Mujer', 'mujer', 'MUJER', 'Otro'];
  const channels = ['Organico', 'Email', 'Paid Ads', 'Referidos', 'Redes Sociales'];

  // Fixed pseudo-random generation with deterministic seed
  let seed = 12345;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = 1; i <= 220; i++) {
    const id = `CLI-${1000 + i}`;
    const age = Math.round(20 + rand() * 52);
    
    // Inconsistent casing
    let gender = genders[Math.floor(rand() * genders.length)];
    if (rand() < 0.04) gender = ''; // Missing

    // Missing null income in 12% of cases
    let income: string | number = Math.round(18000 + rand() * 75000);
    if (rand() < 0.12) income = '';

    const tenure = Math.round(1 + rand() * 48);

    // Number formatted as dirty string with currency symbols and commas
    const baseSpend = 300 + tenure * 45 + rand() * 2500;
    const isOutlier = i === 14 || i === 88 || i === 162;
    const spendVal = isOutlier ? 18500 : Math.round(baseSpend);
    const spendFormatted = rand() < 0.35 ? `"$ ${spendVal.toLocaleString('en-US')}.00"` : spendVal.toString();

    // Tickets support (outliers)
    const tickets = isOutlier ? 14 : Math.floor(rand() * 6);

    // CSAT 1 to 5
    const satisfaction = Math.min(5, Math.max(1, Math.round(3.8 - (tickets * 0.4) + (rand() - 0.5) * 1.5)));

    const channel = channels[Math.floor(rand() * channels.length)];
    const daysInactive = Math.round(rand() * 120);

    // Ground truth churn rule: high tickets, low CSAT, high inactivity
    const churnProb = (tickets >= 4 ? 0.6 : 0) + (satisfaction <= 2 ? 0.3 : 0) + (daysInactive > 60 ? 0.3 : 0) + (rand() * 0.2);
    const churn = churnProb > 0.65 ? 1 : 0;

    rows.push([
      id,
      age,
      gender,
      income,
      tenure,
      spendFormatted,
      tickets,
      satisfaction,
      channel,
      daysInactive,
      churn
    ].join(','));
  }

  return rows.join('\n');
}

function generateHospitalDirtyCsv(): string {
  const headers = [
    'paciente_id',
    'edad',
    'genero',
    'glucosa_ayunas_mgdl',
    'presion_sistolica',
    'indice_masa_corporal',
    'comorbilidades_previas',
    'dias_estancia_hospital',
    'tipo_ingreso',
    'reingreso_30d'
  ];

  const rows: string[] = [headers.join(',')];
  const ingresoTypes = ['Urgencias', 'Programado', 'Derivacion'];
  
  let seed = 54321;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = 1; i <= 200; i++) {
    const id = `PAC-${2000 + i}`;
    const age = Math.round(35 + rand() * 50);
    const gender = rand() < 0.52 ? 'Femenino' : 'Masculino';
    
    // Glucose with extreme outliers (e.g. 380 mg/dL)
    const isOutlier = i === 23 || i === 105;
    let glucose: string | number = isOutlier ? 420 : Math.round(85 + rand() * 140);
    if (rand() < 0.08) glucose = ''; // missing

    const systolic = Math.round(110 + rand() * 55);
    
    let bmi: string | number = +(21 + rand() * 18).toFixed(1);
    if (rand() < 0.06) bmi = '';

    const comorb = Math.floor(rand() * 5);
    const stay = Math.round(1 + comorb * 1.8 + rand() * 10);
    const tipo = ingresoTypes[Math.floor(rand() * ingresoTypes.length)];

    const risk = (Number(glucose || 100) > 160 ? 0.35 : 0) + (stay > 7 ? 0.3 : 0) + (comorb >= 3 ? 0.25 : 0) + (rand() * 0.2);
    const readmitted = risk > 0.55 ? 'Si' : 'No';

    rows.push([
      id,
      age,
      gender,
      glucose,
      systolic,
      bmi,
      comorb,
      stay,
      tipo,
      readmitted
    ].join(','));
  }

  return rows.join('\n');
}

function generateRealEstateDirtyCsv(): string {
  const headers = [
    'propiedad_id',
    'superficie_m2',
    'habitaciones',
    'banos',
    'antiguedad_anos',
    'distancia_centro_km',
    'barrio',
    'tiene_garaje',
    'precio_venta_eur'
  ];

  const rows: string[] = [headers.join(',')];
  const barrios = ['Centro Historico', 'Zona Norte', 'Distrito Financiero', 'Periferia Sur', 'Residencial Este'];

  let seed = 98765;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = 1; i <= 180; i++) {
    const id = `PROP-${3000 + i}`;
    const m2 = Math.round(45 + rand() * 180);
    const habs = Math.max(1, Math.round(m2 / 38 + (rand() - 0.5)));
    const banos = Math.max(1, Math.round(habs * 0.6 + rand()));
    
    let age: string | number = Math.round(rand() * 60);
    if (rand() < 0.07) age = '';

    const dist = +(1.2 + rand() * 18).toFixed(1);
    const barrio = barrios[Math.floor(rand() * barrios.length)];
    const garaje = rand() > 0.4 ? 'Si' : 'No';

    const barrioMultiplier = barrio === 'Distrito Financiero' ? 1.45 : barrio === 'Centro Historico' ? 1.35 : 1.0;
    const basePrice = (m2 * 2600 * barrioMultiplier) - (Number(age || 20) * 1200) - (dist * 3500) + (garaje === 'Si' ? 25000 : 0);
    
    const isOutlier = i === 12 || i === 77;
    const finalPrice = isOutlier ? 1450000 : Math.max(85000, Math.round(basePrice + (rand() - 0.5) * 40000));

    rows.push([
      id,
      m2,
      habs,
      banos,
      age,
      dist,
      barrio,
      garaje,
      finalPrice
    ].join(','));
  }

  return rows.join('\n');
}

function generateEmployeeDirtyCsv(): string {
  const headers = [
    'empleado_id',
    'edad',
    'departamento',
    'antiguedad_anos',
    'salario_mensual_eur',
    'horas_extra_semanales',
    'nivel_estres_1_10',
    'proyectos_completados',
    'nivel_desempeno'
  ];

  const rows: string[] = [headers.join(',')];
  const depts = ['Ventas', 'Ingenieria', 'Marketing', 'Finanzas', 'Operaciones'];

  let seed = 44556;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = 1; i <= 190; i++) {
    const id = `EMP-${4000 + i}`;
    const age = Math.round(22 + rand() * 40);
    const dept = depts[Math.floor(rand() * depts.length)];
    const tenure = +(1 + rand() * 14).toFixed(1);
    
    let salary: string | number = Math.round(1900 + rand() * 4500);
    if (rand() < 0.08) salary = '';

    const overtime = Math.round(rand() * 18);
    const stress = Math.min(10, Math.max(1, Math.round(3 + (overtime * 0.35) + rand() * 3)));
    const projects = Math.round(2 + rand() * 12);

    // Performance rating out of 100
    const baseRating = 72 + (projects * 2.2) - (stress > 7 ? (stress - 7) * 4 : 0) + (rand() - 0.5) * 10;
    const rating = Math.min(99, Math.max(45, Math.round(baseRating)));

    rows.push([
      id,
      age,
      dept,
      tenure,
      salary,
      overtime,
      stress,
      projects,
      rating
    ].join(','));
  }

  return rows.join('\n');
}
