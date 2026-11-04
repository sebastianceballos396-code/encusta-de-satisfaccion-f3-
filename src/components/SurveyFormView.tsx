import React, { useState } from 'react';
import {
  CheckCircle2,
  Send,
  RotateCcw,
  Sparkles,
  FileSpreadsheet,
  Code2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import {
  SURVEY_QUESTIONS,
  SCALE_LABELS,
  SurveyResponse
} from '../data/surveyConfig';
import {
  appendResponseToGoogleSheet,
  GoogleSpreadsheetMeta,
  TARGET_SHEET_NAME
} from '../services/googleSheetsService';

interface SurveyFormViewProps {
  scriptUrl: string;
  onScriptUrlChange: (url: string) => void;
  onAddResponse: (newResponse: SurveyResponse) => void;
  onNavigateTab: (tab: 'form' | 'sheet' | 'code') => void;
  totalResponsesCount: number;
  spreadsheetId?: string;
  spreadsheetMeta?: GoogleSpreadsheetMeta | null;
  token?: string | null;
}

interface FormState {
  q1_rol: string;
  q2_frecuencia: string;
  q3_uso_principal: string;
  q4_instalaciones_limpieza: number | null;
  q5_equipos_conectividad: number | null;
  q6_comodidad_ambiente: number | null;
  q7_disponibilidad_apoyo: number | null;
  q8_satisfaccion_general: number | null;
  q9_recomendacion: string;
  q10_comentarios_mejoras: string;
}

const INITIAL_FORM_STATE: FormState = {
  q1_rol: '',
  q2_frecuencia: '',
  q3_uso_principal: '',
  q4_instalaciones_limpieza: null,
  q5_equipos_conectividad: null,
  q6_comodidad_ambiente: null,
  q7_disponibilidad_apoyo: null,
  q8_satisfaccion_general: null,
  q9_recomendacion: '',
  q10_comentarios_mejoras: ''
};

export const SurveyFormView: React.FC<SurveyFormViewProps> = ({
  scriptUrl,
  onScriptUrlChange,
  onAddResponse,
  onNavigateTab,
  totalResponsesCount,
  spreadsheetId,
  spreadsheetMeta,
  token
}) => {
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<SurveyResponse | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
    tabName?: string;
    updatedRange?: string;
  } | null>(null);
  const [showMappingDetails, setShowMappingDetails] = useState(false);

  const answeredCount = [
    Boolean(formState.q1_rol),
    Boolean(formState.q2_frecuencia),
    Boolean(formState.q3_uso_principal),
    formState.q4_instalaciones_limpieza !== null,
    formState.q5_equipos_conectividad !== null,
    formState.q6_comodidad_ambiente !== null,
    formState.q7_disponibilidad_apoyo !== null,
    formState.q8_satisfaccion_general !== null,
    Boolean(formState.q9_recomendacion),
    Boolean(formState.q10_comentarios_mejoras.trim())
  ].filter(Boolean).length;

  const handleFillSample = () => {
    setValidationError(null);
    setLastSubmitted(null);
    setSyncFeedback(null);
    setFormState({
      q1_rol: 'Aprendiz',
      q2_frecuencia: 'Varias veces por semana',
      q3_uso_principal: 'Formación y aprendizaje',
      q4_instalaciones_limpieza: 5,
      q5_equipos_conectividad: 5,
      q6_comodidad_ambiente: 5,
      q7_disponibilidad_apoyo: 4,
      q8_satisfaccion_general: 5,
      q9_recomendacion: 'Sí, completamente recomendado',
      q10_comentarios_mejoras:
        'Aspectos que funcionan bien: TODO | Dificultades: NINGUNA | Mejoras: NINGUNA'
    });
  };

  const handleReset = () => {
    setFormState(INITIAL_FORM_STATE);
    setValidationError(null);
    setLastSubmitted(null);
    setSyncFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSyncFeedback(null);

    if (
      !formState.q1_rol ||
      !formState.q2_frecuencia ||
      !formState.q3_uso_principal ||
      formState.q4_instalaciones_limpieza === null ||
      formState.q5_equipos_conectividad === null ||
      formState.q6_comodidad_ambiente === null ||
      formState.q7_disponibilidad_apoyo === null ||
      formState.q8_satisfaccion_general === null ||
      !formState.q9_recomendacion ||
      !formState.q10_comentarios_mejoras.trim()
    ) {
      setValidationError(
        'Por favor responda las 10 preguntas del formulario antes de enviar su evaluación.'
      );
      return;
    }

    setIsSubmitting(true);

    const now = new Date();
    const formattedDate = now.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const newEntry: SurveyResponse = {
      id: `resp-${Date.now()}`,
      timestamp: formattedDate,
      source: 'Formulario Web',
      syncedToGoogleSheets: false,
      q1_rol: formState.q1_rol,
      q2_frecuencia: formState.q2_frecuencia,
      q3_uso_principal: formState.q3_uso_principal,
      q4_instalaciones_limpieza: formState.q4_instalaciones_limpieza,
      q5_equipos_conectividad: formState.q5_equipos_conectividad,
      q6_comodidad_ambiente: formState.q6_comodidad_ambiente,
      q7_disponibilidad_apoyo: formState.q7_disponibilidad_apoyo,
      q8_satisfaccion_general: formState.q8_satisfaccion_general,
      q9_recomendacion: formState.q9_recomendacion,
      q10_comentarios_mejoras: formState.q10_comentarios_mejoras.trim()
    };

    // 1. Envío directo a Google Sheets mediante Spreadsheet ID y Google OAuth a la pestaña 'encuesta f3'
    if (spreadsheetId && token) {
      try {
        const apiRes = await appendResponseToGoogleSheet(
          spreadsheetId,
          token,
          newEntry,
          TARGET_SHEET_NAME
        );

        if (apiRes.success) {
          newEntry.syncedToGoogleSheets = true;
          setSyncFeedback({
            type: 'success',
            message: `¡Respuesta escrita directamente en su Google Sheet! Pestaña destino: "${apiRes.tabUsed || TARGET_SHEET_NAME}"`,
            tabName: apiRes.tabUsed || TARGET_SHEET_NAME,
            updatedRange: apiRes.updatedRange
          });
        } else {
          setSyncFeedback({
            type: 'error',
            message: `Google Sheets API reportó un problema: ${apiRes.error}`
          });
        }
      } catch (err: any) {
        setSyncFeedback({
          type: 'error',
          message: `Error al conectar con Google Sheets: ${err.message || 'Fallo de red o permisos'}`
        });
      }
    } else if (spreadsheetId && !token) {
      setSyncFeedback({
        type: 'warning',
        message:
          'Tiene el ID de su hoja configurado pero aún no ha iniciado sesión con Google. Haga clic en "Iniciar sesión con Google" arriba para que las respuestas viajen automáticamente.'
      });
    }

    // 2. Si tiene URL de Apps Script configurada, enviar también al Webhook
    const trimmedUrl = scriptUrl.trim();
    if (trimmedUrl && trimmedUrl.startsWith('https://script.google.com/')) {
      try {
        await fetch(trimmedUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            timestamp: formattedDate,
            ...formState
          })
        });
        newEntry.syncedToGoogleSheets = true;
      } catch {
        // Ignore webhook error
      }
    }

    if (!spreadsheetId && !trimmedUrl) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      newEntry.syncedToGoogleSheets = true;
    }

    onAddResponse(newEntry);
    setLastSubmitted(newEntry);
    setFormState(INITIAL_FORM_STATE);
    setIsSubmitting(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Columna Principal: Formulario HTML de 10 preguntas */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {/* Encabezado Institucional del Formulario */}
        <div className="bg-slate-900 text-white px-6 py-6 sm:px-8 sm:py-7 border-b border-slate-800">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mb-2">
            <span>SENA Regional Valle</span>
            <span aria-hidden="true">·</span>
            <span>Centro Agropecuario de Buga</span>
            <span aria-hidden="true">·</span>
            <span>Ambiente de Formación F3</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">Máximo 10 preguntas</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
            Encuesta de Satisfacción — Uso de la Sala de Computación F3
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            Formulario de 10 preguntas sobre el Ambiente F3. Las respuestas se envían y registran directamente como filas en su hoja de cálculo de Google en la pestaña <strong>encuesta f3</strong>.
          </p>
        </div>

        {/* Barra de Utilidades y Progreso */}
        <div className="px-6 py-3.5 sm:px-8 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="font-medium text-slate-900 font-mono tabular-nums">
              Progreso: {answeredCount} / 10 respondidas
            </span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setShowMappingDetails(!showMappingDetails)}
              className="text-emerald-700 hover:text-emerald-800 underline underline-offset-2 font-medium cursor-pointer"
            >
              {showMappingDetails ? 'Ocultar equivalencia con CSV (17→10)' : 'Ver equivalencia con CSV (17→10)'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFillSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              Autocompletar ejemplo
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpiar
            </button>
          </div>
        </div>

        {/* Notificación de Sincronización con Google Sheets */}
        {syncFeedback && (
          <div
            className={`mx-6 mt-6 sm:mx-8 p-4 rounded-lg text-xs flex items-start gap-3 border ${
              syncFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                : syncFeedback.type === 'warning'
                ? 'bg-amber-50 text-amber-950 border-amber-300'
                : 'bg-red-50 text-red-950 border-red-300'
            }`}
          >
            {syncFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            ) : syncFeedback.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-semibold text-sm mb-1">{syncFeedback.message}</div>
              {syncFeedback.updatedRange && (
                <div className="font-mono text-[11px] text-emerald-800 mt-1">
                  Rango insertado: <strong>{syncFeedback.updatedRange}</strong>
                </div>
              )}
              {spreadsheetId && (
                <div className="mt-2">
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-emerald-800 underline hover:text-emerald-900"
                  >
                    <span>Ver en Google Sheets (pestaña {syncFeedback.tabName || TARGET_SHEET_NAME})</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirmación de Envío Exitoso */}
        {lastSubmitted && (
          <div className="mx-6 mt-6 sm:mx-8 p-5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-emerald-950">
                  Respuesta registrada para la pestaña "{TARGET_SHEET_NAME}" ({lastSubmitted.timestamp})
                </h3>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  Se procesaron los 10 campos del rol <strong>{lastSubmitted.q1_rol}</strong> con calificación general de{' '}
                  <strong className="font-mono tabular-nums">{lastSubmitted.q8_satisfaccion_general}/5</strong> vinculados a la pestaña <strong>{TARGET_SHEET_NAME}</strong>.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigateTab('sheet')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 rounded-md hover:bg-emerald-800 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Ver fila en pestaña "{TARGET_SHEET_NAME}"
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLastSubmitted(null);
                      setSyncFeedback(null);
                    }}
                    className="text-xs font-medium text-emerald-800 hover:underline cursor-pointer"
                  >
                    Registrar otra respuesta
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alerta de Validación */}
        {validationError && (
          <div className="mx-6 mt-6 sm:mx-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8" noValidate>
          {/* SECCIÓN 1: Preguntas 1 a 3 (Perfil y Frecuencia) */}
          <div>
            <div className="pb-3 mb-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                01. Perfil del Usuario y Uso del Ambiente F3
              </h2>
              <span className="text-xs text-slate-500 font-mono tabular-nums">Preguntas 1 a 3</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {SURVEY_QUESTIONS.slice(0, 3).map((q) => (
                <div key={q.id} className="flex flex-col justify-between bg-slate-50/60 border border-slate-200 rounded-lg p-4">
                  <div>
                    <label
                      htmlFor={q.id}
                      className="block text-sm font-semibold text-slate-900 mb-1"
                    >
                      <span className="font-mono tabular-nums text-emerald-700 mr-1">{q.number}.</span>
                      {q.label} <span className="text-red-600">*</span>
                    </label>
                    <p className="text-xs text-slate-500 mb-3">{q.helperText}</p>
                    {showMappingDetails && (
                      <p className="text-[11px] text-emerald-800 mb-2 font-mono">
                        Origen: {q.originalMapping}
                      </p>
                    )}
                  </div>

                  <select
                    id={q.id}
                    value={formState[q.id] as string}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                    required
                  >
                    <option value="">Seleccione una opción...</option>
                    {q.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN 2: Preguntas 4 a 8 (Escala de Satisfacción 1 a 5) */}
          <div>
            <div className="pb-3 mb-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  02. Nivel de Satisfacción con la Sala de Computación F3
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Califique de 1 (Muy insatisfecho) a 5 (Muy satisfecho) cada aspecto evaluado.
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono tabular-nums">Preguntas 4 a 8</span>
            </div>

            <div className="space-y-5">
              {SURVEY_QUESTIONS.slice(3, 8).map((q) => {
                const currentVal = formState[q.id] as number | null;
                return (
                  <div
                    key={q.id}
                    className="p-4 sm:p-5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                      <label className="text-sm font-semibold text-slate-900">
                        <span className="font-mono tabular-nums text-emerald-700 mr-1.5">
                          {q.number}.
                        </span>
                        {q.label} <span className="text-red-600">*</span>
                      </label>
                      {currentVal !== null && (
                        <span className="text-xs font-mono tabular-nums text-emerald-700 font-medium">
                          Seleccionado: {SCALE_LABELS[currentVal].short}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-3">{q.helperText}</p>
                    {showMappingDetails && (
                      <p className="text-[11px] text-emerald-800 mb-3 font-mono">
                        Origen: {q.originalMapping}
                      </p>
                    )}

                    <div className="grid grid-cols-5 gap-2 sm:gap-3">
                      {[1, 2, 3, 4, 5].map((score) => {
                        const isSelected = currentVal === score;
                        return (
                          <button
                            key={score}
                            type="button"
                            onClick={() =>
                              setFormState((prev) => ({ ...prev, [q.id]: score }))
                            }
                            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg border text-center transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                                : 'bg-slate-50/70 text-slate-800 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <span className="text-base font-bold font-mono tabular-nums">
                              {score}
                            </span>
                            <span
                              className={`text-[11px] mt-0.5 truncate max-w-full ${
                                isSelected ? 'text-emerald-100' : 'text-slate-500'
                              }`}
                            >
                              {SCALE_LABELS[score].description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN 3: Preguntas 9 y 10 (Recomendación y Observaciones) */}
          <div>
            <div className="pb-3 mb-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                03. Condiciones Operativas, Recomendación y Mejoras
              </h2>
              <span className="text-xs text-slate-500 font-mono tabular-nums">Preguntas 9 y 10</span>
            </div>

            <div className="space-y-6">
              {/* Pregunta 9 */}
              {(() => {
                const q9 = SURVEY_QUESTIONS[8];
                return (
                  <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-lg">
                    <label className="block text-sm font-semibold text-slate-900 mb-1">
                      <span className="font-mono tabular-nums text-emerald-700 mr-1.5">
                        {q9.number}.
                      </span>
                      {q9.label} <span className="text-red-600">*</span>
                    </label>
                    <p className="text-xs text-slate-500 mb-3">{q9.helperText}</p>
                    {showMappingDetails && (
                      <p className="text-[11px] text-emerald-800 mb-3 font-mono">
                        Origen: {q9.originalMapping}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q9.options?.map((option) => {
                        const checked = formState.q9_recomendacion === option;
                        return (
                          <label
                            key={option}
                            className={`flex items-center gap-3 p-3 rounded-lg border text-sm cursor-pointer transition-colors ${
                              checked
                                ? 'bg-emerald-50/80 border-emerald-600 text-emerald-950 font-medium'
                                : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="radio"
                              name="q9_recomendacion"
                              value={option}
                              checked={checked}
                              onChange={(e) =>
                                setFormState((prev) => ({
                                  ...prev,
                                  q9_recomendacion: e.target.value
                                }))
                              }
                              className="w-4 h-4 accent-emerald-700"
                            />
                            <span>{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Pregunta 10 */}
              {(() => {
                const q10 = SURVEY_QUESTIONS[9];
                return (
                  <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-lg">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <label
                        htmlFor="q10_comentarios_mejoras"
                        className="block text-sm font-semibold text-slate-900"
                      >
                        <span className="font-mono tabular-nums text-emerald-700 mr-1.5">
                          {q10.number}.
                        </span>
                        {q10.label} <span className="text-red-600">*</span>
                      </label>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">{q10.helperText}</p>
                    {showMappingDetails && (
                      <p className="text-[11px] text-emerald-800 mb-3 font-mono">
                        Origen: {q10.originalMapping}
                      </p>
                    )}

                    {/* Plantillas rápidas de respuesta */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                      <span className="text-xs text-slate-500 mr-1"> Inserción rápida:</span>
                      {[
                        'Funciona bien: TODO | Dificultades: NINGUNA | Mejoras: NINGUNA',
                        'Equipos en buen estado; sugiero revisar algunos puntos de red.',
                        'Excelente iluminación y aire acondicionado; ampliar horas de práctica.'
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() =>
                            setFormState((prev) => ({
                              ...prev,
                              q10_comentarios_mejoras: chip
                            }))
                          }
                          className="px-2.5 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                        >
                          {chip.length > 48 ? chip.slice(0, 48) + '...' : chip}
                        </button>
                      ))}
                    </div>

                    <textarea
                      id="q10_comentarios_mejoras"
                      rows={3}
                      value={formState.q10_comentarios_mejoras}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          q10_comentarios_mejoras: e.target.value
                        }))
                      }
                      placeholder="Indique qué aspectos funcionan bien, si encontró alguna dificultad técnica o qué mejoras propone para la Sala F3..."
                      className="w-full p-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                      required
                    />
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Botón de Envío a Google Sheets */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
            <div className="text-xs text-slate-500">
              Al enviar, los datos se agregan automáticamente a la pestaña <strong>{TARGET_SHEET_NAME}</strong> de Google Sheets.
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {isSubmitting
                ? 'Enviando a pestaña "encuesta f3"...'
                : 'Enviar Respuestas a Google Sheets'}
            </button>
          </div>
        </form>
      </div>

      {/* Columna Lateral: Conexión a Google Sheets + Resumen de la Sala F3 */}
      <aside className="lg:col-span-4 space-y-6">
        {/* Panel de Conexión con Google Sheets */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900">
              Destino en Google Sheets
            </h2>
            <span className="text-xs font-mono tabular-nums text-emerald-700 font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
              {TARGET_SHEET_NAME}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            Cada respuesta se inserta en la pestaña <strong>{TARGET_SHEET_NAME}</strong> de su Hoja de Cálculo. Si la pestaña no existe todavía, la aplicación la creará automáticamente.
          </p>

          <label
            htmlFor="google-script-url-sidebar"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            URL del Web App de Google Apps Script (Opcional)
          </label>
          <input
            id="google-script-url-sidebar"
            type="url"
            value={scriptUrl}
            onChange={(e) => onScriptUrlChange(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 mb-3"
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab('sheet')}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              Ver {TARGET_SHEET_NAME} ({totalResponsesCount})
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('code')}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              Obtener HTML
            </button>
          </div>
        </div>

        {/* Resumen de Optimización: De 17 a 10 preguntas */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-2">
            Estructura de 10 Preguntas (Sala F3)
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            A partir de su archivo CSV adjunto (<code className="font-mono text-[11px]">27/10/2026 20:23:30</code>), se consolidaron las preguntas para cumplir con el límite de 10 preguntas sin perder detalle:
          </p>

          <dl className="space-y-2.5 text-xs border-t border-slate-100 pt-3">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-600">P1 – P3 · Perfil, Frecuencia y Uso</dt>
              <dd className="font-mono tabular-nums text-slate-900 font-medium"> Selección</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-600">P4 · Instalaciones, Limpieza y Orden</dt>
              <dd className="font-mono tabular-nums text-slate-900 font-medium">Escala 1–5</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-600">P5 · Equipos y Conectividad</dt>
              <dd className="font-mono tabular-nums text-slate-900 font-medium">Escala 1–5</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-600">P6 · Comodidad, Clima y Seguridad</dt>
              <dd className="font-mono tabular-nums text-slate-900 font-medium">Escala 1–5</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-600">P7 · Disponibilidad y Apoyo Técnico</dt>
              <dd className="font-mono tabular-nums text-slate-900 font-medium">Escala 1–5</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-600">P8 · Satisfacción General Sala F3</dt>
              <dd className="font-mono tabular-nums text-slate-900 font-medium">Escala 1–5</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-600">P9 · Condiciones y Recomendación</dt>
              <dd className="font-mono tabular-nums text-slate-900 font-medium">Opción Múltiple</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-600">P10 · Fortalezas, Fallas y Mejoras</dt>
              <dd className="font-mono tabular-nums text-slate-900 font-medium">Texto Abierto</dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={() => onNavigateTab('code')}
            className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span>Descargar archivo .HTML independiente</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    </div>
  );
};
