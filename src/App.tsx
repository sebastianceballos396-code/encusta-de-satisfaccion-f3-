import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  INITIAL_RESPONSES,
  SurveyResponse,
  generateStandaloneHtmlCode
} from './data/surveyConfig';
import { SurveyFormView } from './components/SurveyFormView';
import { SpreadsheetView } from './components/SpreadsheetView';
import { HtmlAndScriptGeneratorView } from './components/HtmlAndScriptGeneratorView';
import { GoogleSheetsConnectBar } from './components/GoogleSheetsConnectBar';
import {
  initAuth,
  logoutGoogle,
  getSpreadsheetDetails,
  readSheetValues,
  initializeHeadersIfEmpty,
  ensureSheetTabExists,
  GoogleSpreadsheetMeta,
  TARGET_SHEET_NAME
} from './services/googleSheetsService';

const STORAGE_KEY_RESPONSES = 'cab_buga_sala_f3_responses_v4';
const STORAGE_KEY_SCRIPT_URL = 'cab_buga_sala_f3_script_url_v1';
const STORAGE_KEY_SPREADSHEET_ID = 'cab_buga_spreadsheet_id_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'sheet' | 'form' | 'code'>('sheet');

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_SPREADSHEET_ID) || '';
    } catch {
      return '';
    }
  });

  const [spreadsheetMeta, setSpreadsheetMeta] = useState<GoogleSpreadsheetMeta | null>(null);

  const [responses, setResponses] = useState<SurveyResponse[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RESPONSES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_RESPONSES;
  });

  const [scriptUrl, setScriptUrl] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_SCRIPT_URL) || '';
    } catch {
      return '';
    }
  });

  // Escuchar estado de autenticación de Google (en memoria)
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Guardar datos en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RESPONSES, JSON.stringify(responses));
    } catch {
      // Ignore storage quota
    }
  }, [responses]);

  useEffect(() => {
    try {
      if (spreadsheetId) {
        localStorage.setItem(STORAGE_KEY_SPREADSHEET_ID, spreadsheetId);
      } else {
        localStorage.removeItem(STORAGE_KEY_SPREADSHEET_ID);
      }
    } catch {
      // Ignore
    }
  }, [spreadsheetId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SCRIPT_URL, scriptUrl);
    } catch {
      // Ignore
    }
  }, [scriptUrl]);

  // Si hay token y spreadsheetId, verificar metadata del libro en Google Sheets en la pestaña 'encuesta f3'
  const refreshSpreadsheetData = useCallback(async () => {
    if (!spreadsheetId || !token) return;
    setIsSyncing(true);
    try {
      const meta = await getSpreadsheetDetails(spreadsheetId, token);
      setSpreadsheetMeta(meta);

      // Asegurar que la pestaña "encuesta f3" exista
      const targetTab = await ensureSheetTabExists(spreadsheetId, token, TARGET_SHEET_NAME);

      // Asegurar que la fila 1 de la pestaña tenga los 18 encabezados oficiales
      await initializeHeadersIfEmpty(spreadsheetId, token, targetTab);

      // Leer valores actuales de la pestaña
      const values = await readSheetValues(spreadsheetId, token, targetTab);
      if (values && values.length > 1) {
        const remoteResponses: SurveyResponse[] = values.slice(1).map((row, idx) => {
          return {
            id: `sheet-row-${idx + 1}`,
            timestamp: row[0] || new Date().toLocaleString('es-CO'),
            source: 'CSV Adjunto',
            syncedToGoogleSheets: true,
            q1_rol: row[1] || 'Aprendiz',
            q2_frecuencia: row[2] || 'Varias veces por semana',
            q3_uso_principal: row[3] || 'Formación y aprendizaje',
            q4_instalaciones_limpieza: Number(row[4]) || 5,
            q5_equipos_conectividad: Number(row[6]) || 5,
            q6_comodidad_ambiente: Number(row[7]) || 5,
            q7_disponibilidad_apoyo: Number(row[10]) || 4,
            q8_satisfaccion_general: Number(row[12]) || 5,
            q9_recomendacion: row[13] || 'Sí, completamente recomendado',
            q10_comentarios_mejoras: `Aspectos que funcionan bien: ${row[15] || 'TODO'} | Dificultades: ${row[16] || 'NINGUNA'} | Mejoras: ${row[17] || 'NINGUNA'}`
          };
        });
        if (remoteResponses.length > 0) {
          setResponses(remoteResponses);
        }
      }
    } catch (err) {
      console.warn('No se pudo verificar la pestaña en Sheets:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [spreadsheetId, token]);

  useEffect(() => {
    if (spreadsheetId && token && !spreadsheetMeta) {
      refreshSpreadsheetData();
    }
  }, [spreadsheetId, token, spreadsheetMeta, refreshSpreadsheetData]);

  const handleLinkSuccess = (cleanId: string, meta: GoogleSpreadsheetMeta) => {
    setSpreadsheetId(cleanId);
    setSpreadsheetMeta(meta);
    try {
      localStorage.setItem(STORAGE_KEY_SPREADSHEET_ID, cleanId);
    } catch {
      // Ignore
    }
  };

  const handleUnlink = () => {
    setSpreadsheetId('');
    setSpreadsheetMeta(null);
    try {
      localStorage.removeItem(STORAGE_KEY_SPREADSHEET_ID);
    } catch {
      // Ignore
    }
  };

  const handleAddResponse = (newResponse: SurveyResponse) => {
    setResponses((prev) => [newResponse, ...prev]);
  };

  const handleDeleteResponse = (id: string) => {
    setResponses((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddQuickSample = () => {
    const roles = ['Aprendiz', 'Instructor(a)', 'Personal Administrativo', 'Investigador / SENNOVA'];
    const freqs = ['Todos los días', 'Varias veces por semana', 'Una vez por semana'];
    const usos = [
      'Formación y aprendizaje',
      'Prácticas de software y programación',
      'Investigación y formulación de proyectos'
    ];
    const randomRole = roles[Math.floor(Math.random() * roles.length)];
    const randomFreq = freqs[Math.floor(Math.random() * freqs.length)];
    const randomUso = usos[Math.floor(Math.random() * usos.length)];

    const now = new Date().toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const sampleRow: SurveyResponse = {
      id: `resp-sim-${Date.now()}`,
      timestamp: now,
      source: 'Formulario Web',
      syncedToGoogleSheets: true,
      q1_rol: randomRole,
      q2_frecuencia: randomFreq,
      q3_uso_principal: randomUso,
      q4_instalaciones_limpieza: 5,
      q5_equipos_conectividad: 5,
      q6_comodidad_ambiente: 5,
      q7_disponibilidad_apoyo: 5,
      q8_satisfaccion_general: 5,
      q9_recomendacion: 'Sí, completamente recomendado',
      q10_comentarios_mejoras: 'Aspectos que funcionan bien: TODO | Dificultades: NINGUNA | Mejoras: NINGUNA'
    };

    setResponses((prev) => [sampleRow, ...prev]);
  };

  const handleDownloadStandaloneHtml = () => {
    const htmlContent = generateStandaloneHtmlCode(scriptUrl);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'encuesta_sala_f3_buga.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Top Bar Contract */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-4">
          {/* Zone 1: Wordmark */}
          <a
            href="#resultados-f3"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('sheet');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Sala F3 · CAB Buga
          </a>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a
              href="#resultados-f3"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('sheet');
              }}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'sheet'
                  ? 'border-emerald-700 text-slate-900 font-semibold'
                  : 'border-transparent'
              }`}
            >
              Pestaña "{TARGET_SHEET_NAME}" ({responses.length})
            </a>
            <a
              href="#formulario"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('form');
              }}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'form'
                  ? 'border-emerald-700 text-slate-900 font-semibold'
                  : 'border-transparent'
              }`}
            >
              Formulario (10 Preguntas)
            </a>
            <a
              href="#codigo-html"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('code');
              }}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'code'
                  ? 'border-emerald-700 text-slate-900 font-semibold'
                  : 'border-transparent'
              }`}
            >
              Código HTML y Apps Script
            </a>
            <a
              href="/assets/aistudio/Encuesta_de_satisfaccion_de_sobre_la_sala_f3_d91d85e5"
              download="Encuesta_de_satisfaccion_de_sobre_la_sala_f3_original.csv"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent"
            >
              CSV Original (17 preguntas)
            </a>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 hidden sm:inline font-mono">
                  {user.displayName || user.email}
                </span>
                <button
                  type="button"
                  onClick={logoutGoogle}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : null}
            <button
              type="button"
              onClick={handleDownloadStandaloneHtml}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Descargar .HTML
            </button>
          </div>
        </div>
      </header>

      {/* Barra de Vinculación Permanente con el ID de Google Sheets */}
      <GoogleSheetsConnectBar
        user={user}
        token={token}
        spreadsheetId={spreadsheetId}
        spreadsheetMeta={spreadsheetMeta}
        responses={responses}
        onLinkSuccess={handleLinkSuccess}
        onUnlink={handleUnlink}
        onRefreshData={refreshSpreadsheetData}
        isSyncing={isSyncing}
      />

      {/* Selector de vista y barra de contexto */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-800">Centro Agropecuario de Buga</span>
            <span aria-hidden="true">·</span>
            <span>Ambiente F3</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-emerald-800 font-bold">
              Pestaña activa: "{TARGET_SHEET_NAME}" ({responses.length} resultados)
            </span>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('sheet')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'sheet'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Pestaña "{TARGET_SHEET_NAME}"
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'form'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Formulario Web
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Código HTML + Google Script
            </button>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {activeTab === 'sheet' && (
          <SpreadsheetView
            responses={responses}
            onDeleteResponse={handleDeleteResponse}
            onAddQuickSample={handleAddQuickSample}
            onNavigateToForm={() => setActiveTab('form')}
            spreadsheetId={spreadsheetId}
            token={token}
          />
        )}

        {activeTab === 'form' && (
          <SurveyFormView
            scriptUrl={scriptUrl}
            onScriptUrlChange={setScriptUrl}
            onAddResponse={handleAddResponse}
            onNavigateTab={setActiveTab}
            totalResponsesCount={responses.length}
            spreadsheetId={spreadsheetId}
            spreadsheetMeta={spreadsheetMeta}
            token={token}
          />
        )}

        {activeTab === 'code' && (
          <HtmlAndScriptGeneratorView
            scriptUrl={scriptUrl}
            onScriptUrlChange={setScriptUrl}
          />
        )}
      </main>

      {/* Pie de Página Institucional */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Centro Agropecuario de Buga · Sala de Computación Ambiente F3 · Pestaña de respuestas: <strong>{TARGET_SHEET_NAME}</strong>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('sheet')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Pestaña {TARGET_SHEET_NAME}
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Formulario
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Apps Script
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
