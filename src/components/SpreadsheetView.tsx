import React, { useState, useMemo } from 'react';
import {
  Download,
  Copy,
  Check,
  Search,
  Plus,
  Trash2,
  FileSpreadsheet,
  Table2,
  HelpCircle,
  BarChart3,
  CheckCircle2,
  Info,
  AlertCircle,
  UploadCloud,
  ExternalLink
} from 'lucide-react';
import {
  SurveyResponse,
  SURVEY_QUESTIONS,
  ORIGINAL_CSV_RECORD,
  SPREADSHEET_17_HEADERS,
  responseTo17Columns
} from '../data/surveyConfig';
import { TARGET_SHEET_NAME, syncAllResponsesToDrive, googleSignIn } from '../services/googleSheetsService';

interface SpreadsheetViewProps {
  responses: SurveyResponse[];
  onDeleteResponse: (id: string) => void;
  onAddQuickSample: () => void;
  onNavigateToForm: () => void;
  spreadsheetId?: string;
  token?: string | null;
}

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({
  responses,
  onDeleteResponse,
  onAddQuickSample,
  onNavigateToForm,
  spreadsheetId,
  token
}) => {
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedTsv, setCopiedTsv] = useState<boolean>(false);
  const [sheetViewMode, setSheetViewMode] = useState<'17q_csv' | '10q'>('17q_csv');
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(true);
  const [isWriting, setIsWriting] = useState<boolean>(false);
  const [writeFeedback, setWriteFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const handleWriteToDrive = async () => {
    if (!spreadsheetId) {
      setWriteFeedback({
        success: false,
        msg: 'Primero debes vincular o crear tu hoja de cálculo arriba en la barra de conexión.'
      });
      return;
    }

    setIsWriting(true);
    setWriteFeedback(null);

    try {
      let activeToken = token;
      if (!activeToken) {
        const authRes = await googleSignIn();
        if (!authRes) throw new Error('Se requiere iniciar sesión con Google');
        activeToken = authRes.accessToken;
      }

      const res = await syncAllResponsesToDrive(
        spreadsheetId,
        activeToken,
        responses,
        TARGET_SHEET_NAME
      );

      if (res.success) {
        setWriteFeedback({
          success: true,
          msg: `¡Éxito! Se escribieron ${res.rowsWritten} respuesta(s) en la pestaña "${TARGET_SHEET_NAME}" de tu Google Drive.`
        });
      } else {
        setWriteFeedback({
          success: false,
          msg: res.error || 'Error al escribir en Google Drive'
        });
      }
    } catch (err: any) {
      setWriteFeedback({
        success: false,
        msg: err.message || 'Error de autenticación o conexión con Google Drive'
      });
    } finally {
      setIsWriting(false);
    }
  };

  const filteredResponses = useMemo(() => {
    return responses.filter((item) => {
      const matchesRole = roleFilter === 'ALL' || item.q1_rol === roleFilter;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesRole;
      return (
        matchesRole &&
        (item.q1_rol.toLowerCase().includes(q) ||
          item.q2_frecuencia.toLowerCase().includes(q) ||
          item.q3_uso_principal.toLowerCase().includes(q) ||
          item.q9_recomendacion.toLowerCase().includes(q) ||
          item.q10_comentarios_mejoras.toLowerCase().includes(q) ||
          item.timestamp.toLowerCase().includes(q))
      );
    });
  }, [responses, roleFilter, searchQuery]);

  // Cálculo de métricas agregadas
  const stats = useMemo(() => {
    if (responses.length === 0) {
      return {
        avgGeneral: '0.00',
        avgEquipos: '0.00',
        avgInstalaciones: '0.00',
        avgComodidad: '0.00',
        avgApoyo: '0.00',
        recommendRate: '0%',
        pct5Stars: '0%'
      };
    }
    const sumGen = responses.reduce((acc, r) => acc + r.q8_satisfaccion_general, 0);
    const sumEq = responses.reduce((acc, r) => acc + r.q5_equipos_conectividad, 0);
    const sumInst = responses.reduce((acc, r) => acc + r.q4_instalaciones_limpieza, 0);
    const sumCom = responses.reduce((acc, r) => acc + r.q6_comodidad_ambiente, 0);
    const sumAp = responses.reduce((acc, r) => acc + r.q7_disponibilidad_apoyo, 0);

    const recCount = responses.filter((r) =>
      r.q9_recomendacion.toLowerCase().startsWith('sí')
    ).length;

    const topRatings = responses.filter((r) => r.q8_satisfaccion_general === 5).length;

    return {
      avgGeneral: (sumGen / responses.length).toFixed(2),
      avgEquipos: (sumEq / responses.length).toFixed(2),
      avgInstalaciones: (sumInst / responses.length).toFixed(2),
      avgComodidad: (sumCom / responses.length).toFixed(2),
      avgApoyo: (sumAp / responses.length).toFixed(2),
      recommendRate: `${Math.round((recCount / responses.length) * 100)}%`,
      pct5Stars: `${Math.round((topRatings / responses.length) * 100)}%`
    };
  }, [responses]);

  const handleDownloadCsv = () => {
    const escapeCsv = (val: string | number) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    if (sheetViewMode === '17q_csv') {
      const rows17 = responses.map((r) => responseTo17Columns(r));
      const csvContent =
        '\uFEFF' +
        [
          SPREADSHEET_17_HEADERS.map(escapeCsv).join(','),
          ...rows17.map((row) => row.map(escapeCsv).join(','))
        ].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Resultados_f3_completo.csv';
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const headers = [
      'Marca temporal',
      ...SURVEY_QUESTIONS.map((q) => `${q.number}. ${q.label}`)
    ];

    const rows = responses.map((r) => [
      r.timestamp,
      r.q1_rol,
      r.q2_frecuencia,
      r.q3_uso_principal,
      r.q4_instalaciones_limpieza,
      r.q5_equipos_conectividad,
      r.q6_comodidad_ambiente,
      r.q7_disponibilidad_apoyo,
      r.q8_satisfaccion_general,
      r.q9_recomendacion,
      r.q10_comentarios_mejoras
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.map(escapeCsv).join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join(
        '\r\n'
      );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Resultados_f3_10preguntas.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyForGoogleSheets = async () => {
    let tsvContent = '';

    if (sheetViewMode === '17q_csv') {
      const rows17 = responses.map((r) =>
        responseTo17Columns(r).map((cell) => String(cell).replace(/\r?\n/g, ' '))
      );
      tsvContent = [
        SPREADSHEET_17_HEADERS.join('\t'),
        ...rows17.map((r) => r.join('\t'))
      ].join('\n');
    } else {
      const headers = [
        'Marca temporal',
        ...SURVEY_QUESTIONS.map((q) => `${q.number}. ${q.label}`)
      ];
      const rows = responses.map((r) => [
        r.timestamp,
        r.q1_rol,
        r.q2_frecuencia,
        r.q3_uso_principal,
        r.q4_instalaciones_limpieza,
        r.q5_equipos_conectividad,
        r.q6_comodidad_ambiente,
        r.q7_disponibilidad_apoyo,
        r.q8_satisfaccion_general,
        r.q9_recomendacion,
        r.q10_comentarios_mejoras.replace(/\r?\n/g, ' ')
      ]);
      tsvContent = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
    }

    try {
      await navigator.clipboard.writeText(tsvContent);
      setCopiedTsv(true);
      setTimeout(() => setCopiedTsv(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6">
      {/* Explicación destacada: ¿Qué pasa en la hoja encuesta f3? */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg shrink-0 mt-0.5">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900">
                  ¿Cómo se organizan los resultados en la hoja "{TARGET_SHEET_NAME}"?
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold font-mono">
                  Google Sheets · {TARGET_SHEET_NAME}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                En la pestaña <strong>{TARGET_SHEET_NAME}</strong> de Google Sheets se reciben y almacenan automáticamente todas las filas de respuestas de la Encuesta de Satisfacción de la Sala de Computación F3 (Centro Agropecuario de Buga).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-medium cursor-pointer self-start sm:self-auto"
          >
            {showHowItWorks ? 'Ocultar flujo' : 'Ver flujo de datos'}
          </button>
        </div>

        {showHowItWorks && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 font-mono mb-1">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[11px]">1</span>
                El usuario envía la encuesta
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                El aprendiz o evaluador completa las 10 preguntas en los computadores del Ambiente F3 o desde su teléfono.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 font-mono mb-1">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[11px]">2</span>
                Se escribe en "{TARGET_SHEET_NAME}"
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                La API de Google Sheets localiza o crea la pestaña <strong>{TARGET_SHEET_NAME}</strong> y añade la nueva fila con los valores correspondientes.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 font-mono mb-1">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[11px]">3</span>
                Resultados y Métricas en Vivo
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Los promedios de satisfacción (1 a 5), porcentajes de recomendación y observaciones se actualizan en tiempo real.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Panel de Resultados Consolidados de la pestaña encuesta f3 */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-900">
              Resultados Consolidados de la Sala de Computación F3 ({TARGET_SHEET_NAME})
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            Total respuestas registradas: {responses.length}
          </span>
        </div>

        {/* 4 KPIs principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Satisfacción General (P8)</div>
            <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
              {stats.avgGeneral} <span className="text-xs font-normal text-slate-500">/ 5.00</span>
            </div>
            <div className="text-xs text-slate-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{stats.pct5Stars} calificación máxima (5/5)</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Equipos y Conectividad (P5)</div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats.avgEquipos} <span className="text-xs font-normal text-slate-500">/ 5.00</span>
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Disponibilidad de PCs y software
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Instalaciones y Limpieza (P4)</div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats.avgInstalaciones} <span className="text-xs font-normal text-slate-500">/ 5.00</span>
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Comodidad y clima: {stats.avgComodidad}/5.00
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Tasa de Recomendación (P9)</div>
            <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
              {stats.recommendRate}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Usuarios que recomiendan el ambiente
            </div>
          </div>
        </div>

        {/* Desglose cualitativo del registro oficial del CSV adjunto */}
        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-emerald-800" />
            <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
              Resultado Oficial Registrado en el CSV Adjunto (27/10/2026 20:23:30)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Rol y uso principal:</span>
              <span className="font-semibold text-slate-800">Aprendiz · Formación y aprendizaje</span>
            </div>
            <div>
              <span className="text-slate-500 block">Aspectos que funcionan bien:</span>
              <span className="font-semibold text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded font-mono">TODO</span>
            </div>
            <div>
              <span className="text-slate-500 block">Dificultades encontradas:</span>
              <span className="font-semibold text-slate-800 bg-slate-200/60 px-2 py-0.5 rounded font-mono">NINGUNA</span>
            </div>
            <div>
              <span className="text-slate-500 block">Mejoras propuestas:</span>
              <span className="font-semibold text-slate-800 bg-slate-200/60 px-2 py-0.5 rounded font-mono">NINGUNA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor Principal Estilo Google Sheets con Pestaña Activa: encuesta f3 */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {/* Barra Superior de la Hoja de Cálculo */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Hoja de Respuestas — Sala F3
                </h2>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded font-mono border border-emerald-300">
                  Pestaña: {TARGET_SHEET_NAME}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pestaña que recibe y muestra todas las respuestas vinculadas a Google Sheets.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Selector de Vista: 17 preguntas (columnas A-R) vs Vista resumida (10 preguntas) */}
            <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg">
              <button
                type="button"
                onClick={() => setSheetViewMode('17q_csv')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  sheetViewMode === '17q_csv'
                    ? 'bg-white text-emerald-900 shadow-xs border-b-2 border-emerald-700'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pestaña "{TARGET_SHEET_NAME}" (18 Columnas · A a R)
              </button>
              <button
                type="button"
                onClick={() => setSheetViewMode('10q')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  sheetViewMode === '10q'
                    ? 'bg-white text-emerald-900 shadow-xs border-b-2 border-emerald-700'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Vista de 10 Preguntas
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyForGoogleSheets}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedTsv ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span>¡Copiado! Pega con Ctrl+V</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar para Google Sheets</span>
                </>
              )}
            </button>

            {spreadsheetId && (
              <button
                type="button"
                onClick={handleWriteToDrive}
                disabled={isWriting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <UploadCloud className={`w-3.5 h-3.5 ${isWriting ? 'animate-bounce' : ''}`} />
                <span>
                  {isWriting ? 'Escribiendo en Drive...' : `Escribir en "${TARGET_SHEET_NAME}" en Drive`}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar CSV</span>
            </button>
          </div>
        </div>

        {/* Notificación de escritura en Google Drive */}
        {writeFeedback && (
          <div
            className={`px-6 py-3 border-b text-xs flex items-center justify-between gap-3 ${
              writeFeedback.success
                ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                : 'bg-red-50 text-red-950 border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {writeFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="font-medium">{writeFeedback.msg}</span>
            </div>
            {spreadsheetId && writeFeedback.success && (
              <a
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold text-emerald-800 underline hover:text-emerald-900 shrink-0"
              >
                <span>Abrir pestaña en Google Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {sheetViewMode === '10q' ? (
          <>
            {/* Barra de Filtros y Búsqueda */}
            <div className="px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-white">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'ALL', label: 'Todos los roles' },
                  { id: 'Aprendiz', label: 'Aprendices' },
                  { id: 'Instructor(a)', label: 'Instructores' },
                  { id: 'Personal Administrativo', label: 'Administrativos' },
                  { id: 'Investigador / SENNOVA', label: 'SENNOVA' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRoleFilter(tab.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      roleFilter === tab.id
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Filtrar respuestas en ${TARGET_SHEET_NAME}...`}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={onAddQuickSample}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Simular Fila
                </button>
              </div>
            </div>

            {/* Grilla de 10 preguntas */}
            {filteredResponses.length === 0 ? (
              <div className="p-12 text-center">
                <Table2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  No se encontraron filas con el filtro aplicado
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Puede limpiar el buscador o agregar una nueva respuesta desde el formulario.
                </p>
                <button
                  type="button"
                  onClick={onNavigateToForm}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
                >
                  Ir al Formulario de Encuesta
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    {/* Letras de Columnas tipo Google Sheets */}
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-500 font-mono text-[11px] text-center select-none">
                      <th className="w-10 py-1 border-r border-slate-300 bg-slate-200/70">#</th>
                      {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].map((colLetter) => (
                        <th key={colLetter} className="py-1 px-3 border-r border-slate-200 font-medium">
                          {colLetter}
                        </th>
                      ))}
                      <th className="py-1 px-2">Acción</th>
                    </tr>
                    {/* Encabezados */}
                    <tr className="bg-emerald-900 text-white">
                      <th className="py-2.5 px-2 text-center font-mono text-[11px] border-r border-emerald-800">
                        1
                      </th>
                      <th className="py-2.5 px-3 font-semibold min-w-[145px] border-r border-emerald-800">
                        A: Marca temporal
                      </th>
                      <th className="py-2.5 px-3 font-semibold min-w-[150px] border-r border-emerald-800">
                        B: 1. Rol en CAB Buga
                      </th>
                      <th className="py-2.5 px-3 font-semibold min-w-[160px] border-r border-emerald-800">
                        C: 2. Frecuencia de uso
                      </th>
                      <th className="py-2.5 px-3 font-semibold min-w-[180px] border-r border-emerald-800">
                        D: 3. Uso principal Sala F3
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-right min-w-[115px] border-r border-emerald-800">
                        E: 4. Instalaciones
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-right min-w-[115px] border-r border-emerald-800">
                        F: 5. Equipos/Cómputo
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-right min-w-[115px] border-r border-emerald-800">
                        G: 6. Comodidad/Clima
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-right min-w-[115px] border-r border-emerald-800">
                        H: 7. Disponibilidad/Apoyo
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-right min-w-[115px] border-r border-emerald-800">
                        I: 8. Satisfacción Gral.
                      </th>
                      <th className="py-2.5 px-3 font-semibold min-w-[180px] border-r border-emerald-800">
                        J: 9. Recomendación
                      </th>
                      <th className="py-2.5 px-3 font-semibold min-w-[260px] border-r border-emerald-800">
                        K: 10. Comentarios y mejoras
                      </th>
                      <th className="py-2.5 px-2 text-center font-semibold">Borrar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredResponses.map((row, idx) => (
                      <tr
                        key={row.id}
                        className={`hover:bg-emerald-50/50 transition-colors ${
                          row.source === 'CSV Adjunto' ? 'bg-emerald-50/20' : ''
                        }`}
                      >
                        <td className="py-2.5 px-2 text-center font-mono tabular-nums text-slate-400 bg-slate-50 border-r border-slate-200">
                          {idx + 2}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700 border-r border-slate-200 whitespace-nowrap">
                          {row.timestamp}
                          {row.source === 'CSV Adjunto' && (
                            <span className="ml-1.5 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-sans font-medium">
                              Oficial
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900 border-r border-slate-200">
                          {row.q1_rol}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 border-r border-slate-200">
                          {row.q2_frecuencia}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 border-r border-slate-200">
                          {row.q3_uso_principal}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 border-r border-slate-200">
                          {row.q4_instalaciones_limpieza}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 border-r border-slate-200">
                          {row.q5_equipos_conectividad}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 border-r border-slate-200">
                          {row.q6_comodidad_ambiente}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 border-r border-slate-200">
                          {row.q7_disponibilidad_apoyo}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-emerald-700 border-r border-slate-200">
                          {row.q8_satisfaccion_general}
                        </td>
                        <td className="py-2.5 px-3 text-slate-800 border-r border-slate-200">
                          {row.q9_recomendacion}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200 max-w-xs truncate" title={row.q10_comentarios_mejoras}>
                          {row.q10_comentarios_mejoras}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => onDeleteResponse(row.id)}
                            title="Eliminar fila"
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          /* Vista de la Pestaña "encuesta f3" con los Resultados de las 17 preguntas (18 Columnas completas) */
          <div>
            <div className="px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-white">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-800">
                  Pestaña "{TARGET_SHEET_NAME}" (18 Columnas · A a R):
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {filteredResponses.length} fila(s) de resultados
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/assets/aistudio/Encuesta_de_satisfaccion_de_sobre_la_sala_f3_d91d85e5"
                  download="Resultados_Oficiales_Sala_F3_Buga.csv"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar CSV Original
                </a>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  {/* Fila de Letras de Columnas tipo Google Sheets (A a R) */}
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-500 font-mono text-[11px] text-center select-none">
                    <th className="w-10 py-1 border-r border-slate-300 bg-slate-200/70">#</th>
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'].map((colLetter) => (
                      <th key={colLetter} className="py-1 px-3 border-r border-slate-200 font-medium">
                        {colLetter}
                      </th>
                    ))}
                    <th className="py-1 px-2">Acción</th>
                  </tr>
                  {/* Fila 1: Encabezados Oficiales de la Hoja encuesta f3 */}
                  <tr className="bg-emerald-900 text-white">
                    <th className="py-2.5 px-2 text-center font-mono text-[11px] border-r border-emerald-800">
                      1
                    </th>
                    {SPREADSHEET_17_HEADERS.map((header, hIdx) => (
                      <th
                        key={header}
                        className={`py-2.5 px-3 font-semibold border-r border-emerald-800 ${
                          hIdx === 0
                            ? 'min-w-[145px]'
                            : hIdx >= 4 && hIdx <= 12
                            ? 'min-w-[110px] text-right'
                            : 'min-w-[190px]'
                        }`}
                        title={header}
                      >
                        {String.fromCharCode(65 + hIdx)}: {header}
                      </th>
                    ))}
                    <th className="py-2.5 px-2 text-center font-semibold">Borrar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredResponses.map((item, idx) => {
                    const cells = responseTo17Columns(item);
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-emerald-50/50 transition-colors ${
                          item.source === 'CSV Adjunto' ? 'bg-emerald-50/30' : ''
                        }`}
                      >
                        <td className="py-2.5 px-2 text-center font-mono tabular-nums text-slate-400 bg-slate-50 border-r border-slate-200 font-semibold">
                          {idx + 2}
                        </td>
                        {cells.map((cellVal, cIdx) => (
                          <td
                            key={cIdx}
                            className={`py-2.5 px-3 border-r border-slate-200 whitespace-nowrap ${
                              cIdx >= 4 && cIdx <= 12
                                ? 'text-right font-mono tabular-nums font-bold text-slate-900'
                                : 'text-slate-800'
                            } ${
                              cIdx === 0
                                ? 'font-mono tabular-nums font-semibold text-slate-900'
                                : ''
                            } ${
                              cIdx === 1
                                ? 'font-semibold text-emerald-950'
                                : ''
                            }`}
                          >
                            {cellVal}
                            {cIdx === 0 && item.source === 'CSV Adjunto' && (
                              <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-sans font-medium">
                                Adjunto
                              </span>
                            )}
                          </td>
                        ))}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => onDeleteResponse(item.id)}
                            title="Eliminar fila"
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pestaña inferior estilo Google Sheets */}
        <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white border border-slate-300 font-semibold text-emerald-800 shadow-2xs">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              {TARGET_SHEET_NAME}
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-xs text-slate-500">
              {responses.length} fila(s) en la pestaña "{TARGET_SHEET_NAME}"
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopyForGoogleSheets}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-2 cursor-pointer"
            >
              Copiar resultados para pegar en tu Google Sheet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
