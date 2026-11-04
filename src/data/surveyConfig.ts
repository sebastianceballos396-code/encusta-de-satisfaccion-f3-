export interface SurveyResponse {
  id: string;
  timestamp: string;
  source: 'CSV Adjunto' | 'Formulario Web' | 'Registro Institucional';
  syncedToGoogleSheets: boolean;
  q1_rol: string;
  q2_frecuencia: string;
  q3_uso_principal: string;
  q4_instalaciones_limpieza: number;
  q5_equipos_conectividad: number;
  q6_comodidad_ambiente: number;
  q7_disponibilidad_apoyo: number;
  q8_satisfaccion_general: number;
  q9_recomendacion: string;
  q10_comentarios_mejoras: string;
}

export interface QuestionDefinition {
  id: keyof Omit<SurveyResponse, 'id' | 'timestamp' | 'source' | 'syncedToGoogleSheets'>;
  number: number;
  section: string;
  label: string;
  helperText: string;
  originalMapping: string;
  type: 'select' | 'scale' | 'radio' | 'textarea';
  options?: string[];
  required: boolean;
}

export const SURVEY_QUESTIONS: QuestionDefinition[] = [
  {
    id: 'q1_rol',
    number: 1,
    section: 'Perfil y Uso del Ambiente',
    label: '¿Cuál es su rol en el Centro Agropecuario de Buga?',
    helperText: 'Seleccione el perfil con el que accede habitualmente a la Sala de Computación F3.',
    originalMapping: 'Pregunta 1 original',
    type: 'select',
    options: [
      'Aprendiz',
      'Instructor(a)',
      'Personal Administrativo',
      'Investigador / SENNOVA',
      'Contratista / Apoyo Técnico'
    ],
    required: true
  },
  {
    id: 'q2_frecuencia',
    number: 2,
    section: 'Perfil y Uso del Ambiente',
    label: '¿Con qué frecuencia utiliza la Sala de Computación (Ambiente F3)?',
    helperText: 'Indique la regularidad de uso durante el trimestre actual.',
    originalMapping: 'Pregunta 2 original',
    type: 'select',
    options: [
      'Todos los días',
      'Varias veces por semana',
      'Una vez por semana',
      'Quincenal o mensualmente',
      'Primera vez que la utilizo'
    ],
    required: true
  },
  {
    id: 'q3_uso_principal',
    number: 3,
    section: 'Perfil y Uso del Ambiente',
    label: '¿Para qué utiliza principalmente la Sala de Computación F3?',
    helperText: 'Actividad principal desarrollada dentro del ambiente de formación.',
    originalMapping: 'Pregunta 3 original',
    type: 'select',
    options: [
      'Formación y aprendizaje',
      'Prácticas de software y programación',
      'Investigación y formulación de proyectos',
      'Actividades administrativas o evaluación',
      'Capacitación complementaria'
    ],
    required: true
  },
  {
    id: 'q4_instalaciones_limpieza',
    number: 4,
    section: 'Evaluación del Ambiente y Recursos (Escala 1 a 5)',
    label: '¿Qué tan satisfecho(a) está con el estado físico de las instalaciones, la limpieza y el orden?',
    helperText: '1 = Muy insatisfecho(a) · 5 = Muy satisfecho(a)',
    originalMapping: 'Integra Preguntas 4 y 5 originales (Instalaciones + Limpieza y orden)',
    type: 'scale',
    required: true
  },
  {
    id: 'q5_equipos_conectividad',
    number: 5,
    section: 'Evaluación del Ambiente y Recursos (Escala 1 a 5)',
    label: '¿Qué tan satisfecho(a) está con la disponibilidad, el rendimiento y el estado de los equipos de cómputo?',
    helperText: 'Evalúe computadores, periféricos, software instalado y red en la Sala F3.',
    originalMapping: 'Pregunta 6 original (Disponibilidad y estado de los equipos)',
    type: 'scale',
    required: true
  },
  {
    id: 'q6_comodidad_ambiente',
    number: 6,
    section: 'Evaluación del Ambiente y Recursos (Escala 1 a 5)',
    label: '¿Qué tan satisfecho(a) está con la comodidad, iluminación, ventilación y seguridad del ambiente?',
    helperText: 'Evalúe mobiliario, climatización, iluminación y condiciones de seguridad física.',
    originalMapping: 'Integra Preguntas 7, 8 y 9 originales (Comodidad + Iluminación/Ventilación + Seguridad)',
    type: 'scale',
    required: true
  },
  {
    id: 'q7_disponibilidad_apoyo',
    number: 7,
    section: 'Evaluación del Ambiente y Recursos (Escala 1 a 5)',
    label: '¿Qué tan satisfecho(a) está con la disponibilidad de la Sala F3 cuando la necesita y el apoyo recibido?',
    helperText: 'Evalúe facilidad de préstamo/asignación de sala y soporte del personal encargado.',
    originalMapping: 'Integra Preguntas 10 y 11 originales (Disponibilidad de sala + Apoyo recibido)',
    type: 'scale',
    required: true
  },
  {
    id: 'q8_satisfaccion_general',
    number: 8,
    section: 'Evaluación del Ambiente y Recursos (Escala 1 a 5)',
    label: 'En general, ¿qué tan satisfecho(a) está con la Sala de Computación F3 y sus condiciones operativas?',
    helperText: 'Calificación global de su experiencia en el Ambiente F3.',
    originalMapping: 'Integra Preguntas 12 y 13 originales (Satisfacción general + Condiciones necesarias)',
    type: 'scale',
    required: true
  },
  {
    id: 'q9_recomendacion',
    number: 9,
    section: 'Recomendación y Mejora Continua',
    label: '¿Recomendaría el uso del Ambiente F3 y considera que cumple las condiciones para sus actividades?',
    helperText: 'Seleccione la opción que mejor describa su percepción integral.',
    originalMapping: 'Integra Preguntas 13 y 14 originales (Condiciones necesarias + Recomendación)',
    type: 'radio',
    options: [
      'Sí, completamente recomendado',
      'Sí, aunque requiere mejoras puntuales',
      'Neutral / Cumple parcialmente',
      'No lo recomendaría actualmente'
    ],
    required: true
  },
  {
    id: 'q10_comentarios_mejoras',
    number: 10,
    section: 'Recomendación y Mejora Continua',
    label: '¿Qué aspectos funcionan bien, qué dificultades ha tenido o qué mejoras propone para la Sala F3?',
    helperText: 'Espacio abierto para destacar fortalezas, reportar fallas de equipos o sugerir mejoras.',
    originalMapping: 'Integra Preguntas 15, 16 y 17 originales (Aspectos positivos + Dificultades + Mejoras)',
    type: 'textarea',
    required: true
  }
];

export const SCALE_LABELS: Record<number, { short: string; description: string }> = {
  1: { short: '1 · Muy insatisfecho', description: 'Deficiente' },
  2: { short: '2 · Insatisfecho', description: 'Regular' },
  3: { short: '3 · Neutral', description: 'Aceptable' },
  4: { short: '4 · Satisfecho', description: 'Bueno' },
  5: { short: '5 · Muy satisfecho', description: 'Excelente' }
};

export const INITIAL_RESPONSES: SurveyResponse[] = [
  {
    id: 'resp-csv-1',
    timestamp: '27/10/2026 20:23:30',
    source: 'CSV Adjunto',
    syncedToGoogleSheets: true,
    q1_rol: 'Aprendiz',
    q2_frecuencia: 'Varias veces por semana',
    q3_uso_principal: 'Formación y aprendizaje',
    q4_instalaciones_limpieza: 5,
    q5_equipos_conectividad: 5,
    q6_comodidad_ambiente: 5,
    q7_disponibilidad_apoyo: 4,
    q8_satisfaccion_general: 5,
    q9_recomendacion: 'Sí, completamente recomendado',
    q10_comentarios_mejoras: 'Aspectos que funcionan bien: TODO | Dificultades: NINGUNA | Mejoras: NINGUNA'
  }
];

export const SPREADSHEET_17_HEADERS = [
  'Marca temporal',
  '1. ¿Cuál es su rol en el Centro Agropecuario de Buga?',
  '2. ¿Con qué frecuencia utiliza el Ambiente F3?',
  '3. ¿Para qué utiliza principalmente el Ambiente F3?',
  '4. ¿Qué tan satisfecho(a) está con el estado general de las instalaciones?',
  '5. ¿Qué tan satisfecho(a) está con la limpieza y el orden?',
  '6. ¿Qué tan satisfecho(a) está con la disponibilidad y el estado de los equipos?',
  '7. ¿Qué tan satisfecho(a) está con la comodidad y las condiciones del ambiente?',
  '8. ¿Qué tan satisfecho(a) está con la iluminación y la ventilación?',
  '9. ¿Qué tan satisfecho(a) está con la seguridad del ambiente?',
  '10. ¿Qué tan satisfecho(a) está con la disponibilidad del Ambiente F3 cuando lo necesita?',
  '11. ¿Qué tan satisfecho(a) está con el apoyo recibido para utilizar el ambiente?',
  '12. En general, ¿qué tan satisfecho(a) está con el Ambiente F3?',
  '13. ¿El Ambiente F3 cuenta con las condiciones necesarias para desarrollar sus actividades?',
  '14. ¿Recomendaría el uso del Ambiente F3 para las actividades de formación o trabajo que correspondan?',
  '15. ¿Qué aspectos del Ambiente F3 considera que funcionan bien?',
  '16. ¿Qué dificultades ha encontrado al utilizar el Ambiente F3?',
  '17. ¿Qué mejoras propone para el Ambiente F3?'
];

export function responseTo17Columns(r: SurveyResponse): (string | number)[] {
  // Si es la fila original del CSV, devolver los valores exactos
  if (r.id === 'resp-csv-1') {
    return [
      '27/10/2026 20:23:30',
      'Aprendiz',
      'Varias veces por semana',
      'Formación y aprendizaje',
      5,
      5,
      5,
      5,
      5,
      5,
      4,
      5,
      5,
      'Sí, completamente',
      'Sí',
      'TODO ',
      'NINGUNA ',
      'NINGUNA '
    ];
  }

  return [
    r.timestamp,
    r.q1_rol,
    r.q2_frecuencia,
    r.q3_uso_principal,
    r.q4_instalaciones_limpieza,
    r.q4_instalaciones_limpieza,
    r.q5_equipos_conectividad,
    r.q6_comodidad_ambiente,
    r.q6_comodidad_ambiente,
    r.q6_comodidad_ambiente,
    r.q7_disponibilidad_apoyo,
    r.q7_disponibilidad_apoyo,
    r.q8_satisfaccion_general,
    r.q9_recomendacion.toLowerCase().includes('no') ? 'No' : 'Sí, completamente',
    r.q9_recomendacion.toLowerCase().includes('no') ? 'No' : 'Sí',
    r.q10_comentarios_mejoras.includes('TODO') ? 'TODO ' : (r.q10_comentarios_mejoras || 'TODO '),
    r.q10_comentarios_mejoras.includes('NINGUNA') ? 'NINGUNA ' : 'NINGUNA ',
    r.q10_comentarios_mejoras.includes('NINGUNA') ? 'NINGUNA ' : (r.q10_comentarios_mejoras || 'NINGUNA ')
  ];
}

export const ORIGINAL_CSV_RECORD = {
  headers: [
    'Marca temporal',
    '1. ¿Cuál es su rol en el Centro Agropecuario de Buga?',
    '2. ¿Con qué frecuencia utiliza el Ambiente F3?',
    '3. ¿Para qué utiliza principalmente el Ambiente F3?',
    '4. ¿Qué tan satisfecho(a) está con el estado general de las instalaciones?',
    '5. ¿Qué tan satisfecho(a) está con la limpieza y el orden?',
    '6. ¿Qué tan satisfecho(a) está con la disponibilidad y el estado de los equipos?',
    '7. ¿Qué tan satisfecho(a) está con la comodidad y las condiciones del ambiente?',
    '8. ¿Qué tan satisfecho(a) está con la iluminación y la ventilación?',
    '9. ¿Qué tan satisfecho(a) está con la seguridad del ambiente?',
    '10. ¿Qué tan satisfecho(a) está con la disponibilidad del Ambiente F3 cuando lo necesita?',
    '11. ¿Qué tan satisfecho(a) está con el apoyo recibido para utilizar el ambiente?',
    '12. En general, ¿qué tan satisfecho(a) está con el Ambiente F3?',
    '13. ¿El Ambiente F3 cuenta con las condiciones necesarias para desarrollar sus actividades?',
    '14. ¿Recomendaría el uso del Ambiente F3 para las actividades de formación o trabajo que correspondan?',
    '15. ¿Qué aspectos del Ambiente F3 considera que funcionan bien?',
    '16. ¿Qué dificultades ha encontrado al utilizar el Ambiente F3?',
    '17. ¿Qué mejoras propone para el Ambiente F3?'
  ],
  row: [
    '27/10/2026 20:23:30',
    'Aprendiz',
    'Varias veces por semana',
    'Formación y aprendizaje',
    '5',
    '5',
    '5',
    '5',
    '5',
    '5',
    '4',
    '5',
    '5',
    'Sí, completamente',
    'Sí',
    'TODO',
    'NINGUNA',
    'NINGUNA'
  ]
};

export function generateGoogleAppsScriptCode(sheetName = 'resultados f3'): string {
  return `/**
 * GOOGLE APPS SCRIPT - ENCUESTA DE SATISFACCIÓN SALA DE COMPUTACIÓN F3
 * Centro Agropecuario de Buga (SENA) - Versión Optimizada (10 Preguntas)
 *
 * Configurado para escribir directamente en la pestaña: "${sheetName}"
 *
 * INSTRUCCIONES:
 * 1. Abra su Hoja de Cálculo de Google (Google Sheets).
 * 2. Vaya a Extensiones > Apps Script.
 * 3. Borre el contenido actual y pegue este código completo.
 * 4. Haga clic en "Implementar" > "Nueva implementación".
 * 5. Seleccione tipo "Aplicación web":
 *    - Ejecutar como: "Yo"
 *    - Quién tiene acceso: "Cualquier persona"
 * 6. Copie la URL de la Aplicación Web generada y péguela en su formulario HTML.
 */

const SHEET_NAME = '${sheetName}';

const HEADERS = [
  'Marca temporal',
  '1. ¿Cuál es su rol en el Centro Agropecuario de Buga?',
  '2. ¿Con qué frecuencia utiliza el Ambiente F3?',
  '3. ¿Para qué utiliza principalmente el Ambiente F3?',
  '4. ¿Qué tan satisfecho(a) está con el estado general de las instalaciones?',
  '5. ¿Qué tan satisfecho(a) está con la limpieza y el orden?',
  '6. ¿Qué tan satisfecho(a) está con la disponibilidad y el estado de los equipos?',
  '7. ¿Qué tan satisfecho(a) está con la comodidad y las condiciones del ambiente?',
  '8. ¿Qué tan satisfecho(a) está con la iluminación y la ventilación?',
  '9. ¿Qué tan satisfecho(a) está con la seguridad del ambiente?',
  '10. ¿Qué tan satisfecho(a) está con la disponibilidad del Ambiente F3 cuando lo necesita?',
  '11. ¿Qué tan satisfecho(a) está con el apoyo recibido para utilizar el ambiente?',
  '12. En general, ¿qué tan satisfecho(a) está con el Ambiente F3?',
  '13. ¿El Ambiente F3 cuenta con las condiciones necesarias para desarrollar sus actividades?',
  '14. ¿Recomendaría el uso del Ambiente F3 para las actividades de formación o trabajo que correspondan?',
  '15. ¿Qué aspectos del Ambiente F3 considera que funcionan bien?',
  '16. ¿Qué dificultades ha encontrado al utilizar el Ambiente F3?',
  '17. ¿Qué mejoras propone para el Ambiente F3?'
];

function getOrCreateSheet() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  // Busca primero por la pestaña "resultados f3", o variantes con mayúsculas
  let sheet = doc.getSheetByName(SHEET_NAME) ||
              doc.getSheetByName('resultados f3') ||
              doc.getSheetByName('Resultados F3') ||
              doc.getSheetByName('RESULTADOS F3') ||
              doc.getSheetByName('encuesta f3') ||
              doc.getSheetByName('Hoja 1') ||
              doc.getSheets()[0];
  if (!sheet) {
    sheet = doc.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#15803D')
      .setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const sheet = getOrCreateSheet();
    let data = {};

    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else {
      data = e.parameter || {};
    }

    const timestamp = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone() || 'America/Bogota',
      'dd/MM/yyyy HH:mm:ss'
    );

    const p4_inst = Number(data.q4_instalaciones_limpieza) || '';
    const p5_eq = Number(data.q5_equipos_conectividad) || '';
    const p6_com = Number(data.q6_comodidad_ambiente) || '';
    const p7_apoyo = Number(data.q7_disponibilidad_apoyo) || '';
    const p8_sat = Number(data.q8_satisfaccion_general) || '';
    const p9_rec = String(data.q9_recomendacion || '');
    const p10_com = String(data.q10_comentarios_mejoras || '');

    // Fila completa de 18 columnas para esta hoja de cálculo (Hoja 1)
    const newRow17 = [
      data.timestamp || timestamp,
      data.q1_rol || '',
      data.q2_frecuencia || '',
      data.q3_uso_principal || '',
      p4_inst,
      p4_inst,
      p5_eq,
      p6_com,
      p6_com,
      p6_com,
      p7_apoyo,
      p7_apoyo,
      p8_sat,
      p9_rec.indexOf('No') !== -1 ? 'No' : 'Sí, completamente',
      p9_rec.indexOf('No') !== -1 ? 'No' : 'Sí',
      p10_com || 'TODO ',
      'NINGUNA ',
      p10_com || 'NINGUNA '
    ];

    sheet.appendRow(newRow17);

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Respuesta registrada correctamente en la Hoja 1 de Google Sheets',
        rowNumber: sheet.getLastRow()
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'online',
      service: 'Encuesta Sala F3 - Centro Agropecuario de Buga (10 Preguntas)'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}`;
}

export function generateStandaloneHtmlCode(scriptUrl: string): string {
  const targetUrl = scriptUrl.trim() || 'PEGAR_AQUI_TU_URL_DE_GOOGLE_APPS_SCRIPT';
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Encuesta de Satisfacción - Sala de Computación F3 | Centro Agropecuario de Buga</title>
  <style>
    :root {
      --primary: #15803D;
      --primary-hover: #166534;
      --bg: #F8FAFC;
      --surface: #FFFFFF;
      --text: #0F172A;
      --muted: #475569;
      --border: #E2E8F0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 2rem 1rem;
    }
    .container {
      max-width: 780px;
      margin: 0 auto;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
    }
    .header {
      background: #0F172A;
      color: #FFFFFF;
      padding: 2rem;
      border-bottom: 4px solid var(--primary);
    }
    .header-meta {
      font-size: 0.8rem;
      color: #94A3B8;
      margin-bottom: 0.5rem;
    }
    .header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .header p {
      font-size: 0.925rem;
      color: #CBD5E1;
    }
    form { padding: 2rem; }
    .question-block {
      padding-bottom: 1.5rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
    }
    .question-label {
      display: block;
      font-weight: 600;
      font-size: 0.975rem;
      margin-bottom: 0.35rem;
    }
    .question-helper {
      font-size: 0.825rem;
      color: var(--muted);
      margin-bottom: 0.85rem;
    }
    select, textarea, input[type="text"] {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 0.95rem;
      background: #FFF;
      color: var(--text);
    }
    select:focus, textarea:focus {
      outline: 2px solid var(--primary);
      border-color: transparent;
    }
    .scale-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0.5rem;
    }
    .scale-option input { display: none; }
    .scale-option span {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0.65rem 0.25rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.95rem;
      transition: all 0.15s ease;
    }
    .scale-option small {
      font-weight: 400;
      font-size: 0.7rem;
      color: var(--muted);
      margin-top: 2px;
    }
    .scale-option input:checked + span {
      background: var(--primary);
      color: #FFF;
      border-color: var(--primary);
    }
    .scale-option input:checked + span small {
      color: #DCFCE7;
    }
    .radio-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .radio-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.65rem 0.85rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
    }
    .btn-submit {
      width: 100%;
      padding: 0.9rem 1.5rem;
      background: var(--primary);
      color: #FFFFFF;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .btn-submit:hover { background: var(--primary-hover); }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .status-msg {
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 8px;
      display: none;
      font-size: 0.9rem;
    }
    .status-success {
      display: block;
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      color: #166534;
    }
    .status-error {
      display: block;
      background: #FEF2F2;
      border: 1px solid #FECACA;
      color: #991B1B;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-meta">Centro Agropecuario de Buga · SENA Regional Valle · Ambiente F3</div>
      <h1>Encuesta de Satisfacción — Sala de Computación F3</h1>
      <p>Su opinión nos permite mejorar continuamente los equipos, instalaciones y el servicio del Ambiente F3. (10 preguntas)</p>
    </div>

    <form id="encuestaF3Form">
      <!-- Pregunta 1 -->
      <div class="question-block">
        <label class="question-label" for="q1_rol">1. ¿Cuál es su rol en el Centro Agropecuario de Buga? *</label>
        <p class="question-helper">Seleccione su perfil institucional actual.</p>
        <select id="q1_rol" name="q1_rol" required>
          <option value="">Seleccione una opción...</option>
          <option value="Aprendiz">Aprendiz</option>
          <option value="Instructor(a)">Instructor(a)</option>
          <option value="Personal Administrativo">Personal Administrativo</option>
          <option value="Investigador / SENNOVA">Investigador / SENNOVA</option>
          <option value="Contratista / Apoyo Técnico">Contratista / Apoyo Técnico</option>
        </select>
      </div>

      <!-- Pregunta 2 -->
      <div class="question-block">
        <label class="question-label" for="q2_frecuencia">2. ¿Con qué frecuencia utiliza la Sala de Computación (Ambiente F3)? *</label>
        <p class="question-helper">Indique la regularidad de uso durante el trimestre.</p>
        <select id="q2_frecuencia" name="q2_frecuencia" required>
          <option value="">Seleccione una opción...</option>
          <option value="Todos los días">Todos los días</option>
          <option value="Varias veces por semana">Varias veces por semana</option>
          <option value="Una vez por semana">Una vez por semana</option>
          <option value="Quincenal o mensualmente">Quincenal o mensualmente</option>
          <option value="Primera vez que la utilizo">Primera vez que la utilizo</option>
        </select>
      </div>

      <!-- Pregunta 3 -->
      <div class="question-block">
        <label class="question-label" for="q3_uso_principal">3. ¿Para qué utiliza principalmente la Sala de Computación F3? *</label>
        <p class="question-helper">Seleccione el propósito principal de sus sesiones.</p>
        <select id="q3_uso_principal" name="q3_uso_principal" required>
          <option value="">Seleccione una opción...</option>
          <option value="Formación y aprendizaje">Formación y aprendizaje</option>
          <option value="Prácticas de software y programación">Prácticas de software y programación</option>
          <option value="Investigación y formulación de proyectos">Investigación y formulación de proyectos</option>
          <option value="Actividades administrativas o evaluación">Actividades administrativas o evaluación</option>
          <option value="Capacitación complementaria">Capacitación complementaria</option>
        </select>
      </div>

      <!-- Pregunta 4 -->
      <div class="question-block">
        <span class="question-label">4. ¿Qué tan satisfecho(a) está con el estado físico de las instalaciones, la limpieza y el orden? *</span>
        <p class="question-helper">Escala: 1 = Muy insatisfecho(a) a 5 = Muy satisfecho(a)</p>
        <div class="scale-grid">
          <label class="scale-option"><input type="radio" name="q4_instalaciones_limpieza" value="1" required /><span>1<small>Deficiente</small></span></label>
          <label class="scale-option"><input type="radio" name="q4_instalaciones_limpieza" value="2" /><span>2<small>Regular</small></span></label>
          <label class="scale-option"><input type="radio" name="q4_instalaciones_limpieza" value="3" /><span>3<small>Aceptable</small></span></label>
          <label class="scale-option"><input type="radio" name="q4_instalaciones_limpieza" value="4" /><span>4<small>Bueno</small></span></label>
          <label class="scale-option"><input type="radio" name="q4_instalaciones_limpieza" value="5" /><span>5<small>Excelente</small></span></label>
        </div>
      </div>

      <!-- Pregunta 5 -->
      <div class="question-block">
        <span class="question-label">5. ¿Qué tan satisfecho(a) está con la disponibilidad, el rendimiento y el estado de los equipos de cómputo? *</span>
        <p class="question-helper">Evalúe computadores, periféricos, software y conectividad.</p>
        <div class="scale-grid">
          <label class="scale-option"><input type="radio" name="q5_equipos_conectividad" value="1" required /><span>1<small>Deficiente</small></span></label>
          <label class="scale-option"><input type="radio" name="q5_equipos_conectividad" value="2" /><span>2<small>Regular</small></span></label>
          <label class="scale-option"><input type="radio" name="q5_equipos_conectividad" value="3" /><span>3<small>Aceptable</small></span></label>
          <label class="scale-option"><input type="radio" name="q5_equipos_conectividad" value="4" /><span>4<small>Bueno</small></span></label>
          <label class="scale-option"><input type="radio" name="q5_equipos_conectividad" value="5" /><span>5<small>Excelente</small></span></label>
        </div>
      </div>

      <!-- Pregunta 6 -->
      <div class="question-block">
        <span class="question-label">6. ¿Qué tan satisfecho(a) está con la comodidad, iluminación, ventilación y seguridad del ambiente? *</span>
        <p class="question-helper">Evalúe mobiliario, climatización, iluminación y seguridad física.</p>
        <div class="scale-grid">
          <label class="scale-option"><input type="radio" name="q6_comodidad_ambiente" value="1" required /><span>1<small>Deficiente</small></span></label>
          <label class="scale-option"><input type="radio" name="q6_comodidad_ambiente" value="2" /><span>2<small>Regular</small></span></label>
          <label class="scale-option"><input type="radio" name="q6_comodidad_ambiente" value="3" /><span>3<small>Aceptable</small></span></label>
          <label class="scale-option"><input type="radio" name="q6_comodidad_ambiente" value="4" /><span>4<small>Bueno</small></span></label>
          <label class="scale-option"><input type="radio" name="q6_comodidad_ambiente" value="5" /><span>5<small>Excelente</small></span></label>
        </div>
      </div>

      <!-- Pregunta 7 -->
      <div class="question-block">
        <span class="question-label">7. ¿Qué tan satisfecho(a) está con la disponibilidad de la Sala F3 cuando la necesita y el apoyo recibido? *</span>
        <p class="question-helper">Evalúe programación de horarios y soporte técnico/logístico.</p>
        <div class="scale-grid">
          <label class="scale-option"><input type="radio" name="q7_disponibilidad_apoyo" value="1" required /><span>1<small>Deficiente</small></span></label>
          <label class="scale-option"><input type="radio" name="q7_disponibilidad_apoyo" value="2" /><span>2<small>Regular</small></span></label>
          <label class="scale-option"><input type="radio" name="q7_disponibilidad_apoyo" value="3" /><span>3<small>Aceptable</small></span></label>
          <label class="scale-option"><input type="radio" name="q7_disponibilidad_apoyo" value="4" /><span>4<small>Bueno</small></span></label>
          <label class="scale-option"><input type="radio" name="q7_disponibilidad_apoyo" value="5" /><span>5<small>Excelente</small></span></label>
        </div>
      </div>

      <!-- Pregunta 8 -->
      <div class="question-block">
        <span class="question-label">8. En general, ¿qué tan satisfecho(a) está con la Sala de Computación F3 y sus condiciones operativas? *</span>
        <p class="question-helper">Calificación global de satisfacción con el Ambiente F3.</p>
        <div class="scale-grid">
          <label class="scale-option"><input type="radio" name="q8_satisfaccion_general" value="1" required /><span>1<small>Deficiente</small></span></label>
          <label class="scale-option"><input type="radio" name="q8_satisfaccion_general" value="2" /><span>2<small>Regular</small></span></label>
          <label class="scale-option"><input type="radio" name="q8_satisfaccion_general" value="3" /><span>3<small>Aceptable</small></span></label>
          <label class="scale-option"><input type="radio" name="q8_satisfaccion_general" value="4" /><span>4<small>Bueno</small></span></label>
          <label class="scale-option"><input type="radio" name="q8_satisfaccion_general" value="5" /><span>5<small>Excelente</small></span></label>
        </div>
      </div>

      <!-- Pregunta 9 -->
      <div class="question-block">
        <span class="question-label">9. ¿Recomendaría el uso del Ambiente F3 y considera que cumple las condiciones para sus actividades? *</span>
        <p class="question-helper">Seleccione una alternativa.</p>
        <div class="radio-list">
          <label class="radio-item"><input type="radio" name="q9_recomendacion" value="Sí, completamente recomendado" required /> <span>Sí, completamente recomendado</span></label>
          <label class="radio-item"><input type="radio" name="q9_recomendacion" value="Sí, aunque requiere mejoras puntuales" /> <span>Sí, aunque requiere mejoras puntuales</span></label>
          <label class="radio-item"><input type="radio" name="q9_recomendacion" value="Neutral / Cumple parcialmente" /> <span>Neutral / Cumple parcialmente</span></label>
          <label class="radio-item"><input type="radio" name="q9_recomendacion" value="No lo recomendaría actualmente" /> <span>No lo recomendaría actualmente</span></label>
        </div>
      </div>

      <!-- Pregunta 10 -->
      <div class="question-block">
        <label class="question-label" for="q10_comentarios_mejoras">10. ¿Qué aspectos funcionan bien, qué dificultades ha tenido o qué mejoras propone para la Sala F3? *</label>
        <p class="question-helper">Escriba sus observaciones o escriba "NINGUNA" si no tiene reparos adicionales.</p>
        <textarea id="q10_comentarios_mejoras" name="q10_comentarios_mejoras" rows="3" placeholder="Ej. Aspectos positivos, equipos por revisar o sugerencias de mejora..." required></textarea>
      </div>

      <button type="submit" class="btn-submit" id="submitBtn">Enviar Respuestas a Google Sheets</button>
      <div id="statusBox" class="status-msg"></div>
    </form>
  </div>

  <script>
    // URL del Web App de Google Apps Script
    const GOOGLE_SCRIPT_URL = "${targetUrl}";

    const form = document.getElementById('encuestaF3Form');
    const submitBtn = document.getElementById('submitBtn');
    const statusBox = document.getElementById('statusBox');

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando respuestas a Google Sheets...';
      statusBox.className = 'status-msg';
      statusBox.textContent = '';

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      payload.timestamp = new Date().toLocaleString('es-CO');

      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        statusBox.className = 'status-msg status-success';
        statusBox.textContent = '¡Gracias! Sus 10 respuestas fueron registradas correctamente en la Hoja de Cálculo de Google.';
        form.reset();
      } catch (error) {
        statusBox.className = 'status-msg status-error';
        statusBox.textContent = 'Ocurrió un error al conectar con Google Sheets. Verifique la URL del script.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar Respuestas a Google Sheets';
      }
    });
  </script>
</body>
</html>`;
}
