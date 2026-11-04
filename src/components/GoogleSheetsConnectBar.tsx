import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Link2,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  PlusCircle,
  UploadCloud,
  Sparkles
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  extractSpreadsheetId,
  getSpreadsheetDetails,
  googleSignIn,
  createSpreadsheetInDrive,
  syncAllResponsesToDrive,
  GoogleSpreadsheetMeta,
  TARGET_SHEET_NAME
} from '../services/googleSheetsService';
import { SurveyResponse } from '../data/surveyConfig';

interface GoogleSheetsConnectBarProps {
  user: User | null;
  token: string | null;
  spreadsheetId: string;
  spreadsheetMeta: GoogleSpreadsheetMeta | null;
  responses: SurveyResponse[];
  onLinkSuccess: (cleanId: string, meta: GoogleSpreadsheetMeta) => void;
  onUnlink: () => void;
  onRefreshData?: () => void;
  isSyncing?: boolean;
}

export const GoogleSheetsConnectBar: React.FC<GoogleSheetsConnectBarProps> = ({
  user,
  token,
  spreadsheetId,
  spreadsheetMeta,
  responses,
  onLinkSuccess,
  onUnlink,
  onRefreshData,
  isSyncing = false
}) => {
  const [inputId, setInputId] = useState<string>(spreadsheetId);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  const formatAuthError = (err: any): string => {
    if (err?.code === 'auth/unauthorized-domain' || err?.message?.toLowerCase().includes('unauthorized domain')) {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'tu-app.vercel.app';
      return `Dominio "${currentHost}" no autorizado en Firebase. Agrega "${currentHost}" en Firebase Console > Authentication > Settings > Authorized domains.`;
    }
    if (err?.code === 'auth/popup-blocked') {
      return 'El navegador bloqueó la ventana emergente de Google. Por favor permite las ventanas emergentes (pop-ups) para iniciar sesión.';
    }
    if (err?.code === 'auth/popup-closed-by-user') {
      return 'La ventana de inicio de sesión se cerró antes de completar la autorización.';
    }
    return err?.message || 'Error al autenticar con Google';
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await googleSignIn();
      if (res && inputId.trim()) {
        const cleanId = extractSpreadsheetId(inputId);
        const meta = await getSpreadsheetDetails(cleanId, res.accessToken);
        onLinkSuccess(cleanId, meta);
      }
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkSpreadsheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputId.trim()) {
      setErrorMsg('Por favor ingrese el ID o la URL completa de su Hoja de Cálculo de Google.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessBanner(null);

    try {
      let activeToken = token;
      if (!activeToken || !user) {
        const authRes = await googleSignIn();
        if (!authRes) throw new Error('Se requiere autenticación con Google');
        activeToken = authRes.accessToken;
      }

      const cleanId = extractSpreadsheetId(inputId);
      const meta = await getSpreadsheetDetails(cleanId, activeToken);
      onLinkSuccess(cleanId, meta);

      // Escribir automáticamente las respuestas existentes en la pestaña 'encuesta f3'
      const pushRes = await syncAllResponsesToDrive(cleanId, activeToken, responses, TARGET_SHEET_NAME);
      if (pushRes.success) {
        setSuccessBanner(
          `¡Hoja vinculada con éxito! Se escribieron ${pushRes.rowsWritten} respuesta(s) en la pestaña "${TARGET_SHEET_NAME}".`
        );
      }
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewSheetInDrive = async () => {
    setIsCreating(true);
    setErrorMsg(null);
    setSuccessBanner(null);

    try {
      let activeToken = token;
      if (!activeToken || !user) {
        const authRes = await googleSignIn();
        if (!authRes) throw new Error('Se requiere autenticación con Google');
        activeToken = authRes.accessToken;
      }

      // 1. Crear nueva hoja de cálculo en el Google Drive del usuario llamada 'resultados f3'
      const created = await createSpreadsheetInDrive(
        activeToken,
        'resultados f3'
      );

      // 2. Escribir encabezados oficiales y todas las respuestas en la pestaña 'encuesta f3'
      const pushRes = await syncAllResponsesToDrive(
        created.spreadsheetId,
        activeToken,
        responses,
        TARGET_SHEET_NAME
      );

      // 3. Vincular y guardar en la aplicación
      setInputId(created.spreadsheetId);
      onLinkSuccess(created.spreadsheetId, created.meta);

      setSuccessBanner(
        `¡Hoja creada con éxito en tu Google Drive! Pestaña "${TARGET_SHEET_NAME}" con ${pushRes.rowsWritten} respuesta(s) registradas.`
      );
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setIsCreating(false);
    }
  };

  const handleSyncAllToDriveNow = async () => {
    if (!spreadsheetId) return;
    setIsPushing(true);
    setErrorMsg(null);
    setSuccessBanner(null);

    try {
      let activeToken = token;
      if (!activeToken || !user) {
        const authRes = await googleSignIn();
        if (!authRes) throw new Error('Se requiere autenticación con Google');
        activeToken = authRes.accessToken;
      }

      const res = await syncAllResponsesToDrive(
        spreadsheetId,
        activeToken,
        responses,
        TARGET_SHEET_NAME
      );

      if (res.success) {
        setSuccessBanner(
          `¡Sincronización completa! Se escribieron ${res.rowsWritten} respuesta(s) en la pestaña "${TARGET_SHEET_NAME}".`
        );
      } else {
        setErrorMsg(res.error || 'No se pudieron escribir las respuestas en la hoja de cálculo.');
      }
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setIsPushing(false);
    }
  };

  const handleCopyId = async () => {
    if (!spreadsheetId) return;
    try {
      await navigator.clipboard.writeText(spreadsheetId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // Ignore
    }
  };

  const isConnected = Boolean(spreadsheetId && spreadsheetMeta);

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Banner de Éxito al sincronizar */}
        {successBanner && (
          <div className="mb-3 p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between gap-3 text-xs text-emerald-950">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="font-medium">{successBanner}</span>
            </div>
            {spreadsheetId && (
              <a
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold text-emerald-800 underline hover:text-emerald-900 shrink-0"
              >
                <span>Ver hoja en Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {/* Banner de Error */}
        {errorMsg && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-3 text-xs text-red-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            {!user && (
              <button
                type="button"
                onClick={handleLogin}
                className="font-bold underline text-red-800 hover:text-red-900 cursor-pointer"
              >
                Iniciar sesión con Google
              </button>
            )}
          </div>
        )}

        {isConnected ? (
          /* Estado Conectado y Guardado Permanentemente */
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    Hoja Vinculada en Google Drive
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold px-2 py-0.5 rounded font-mono">
                    Pestaña: {TARGET_SHEET_NAME}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <h2 className="text-sm font-bold text-slate-900">
                    {spreadsheetMeta?.title || 'Google Spreadsheet'}
                  </h2>
                  <span className="text-xs text-slate-400 font-mono">
                    (ID: {spreadsheetId.slice(0, 10)}...{spreadsheetId.slice(-6)})
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    title="Copiar ID"
                    className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {copiedId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              {/* Botón principal: Escribir todas las respuestas a Drive de inmediato */}
              <button
                type="button"
                onClick={handleSyncAllToDriveNow}
                disabled={isPushing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <UploadCloud className={`w-4 h-4 ${isPushing ? 'animate-bounce' : ''}`} />
                <span>
                  {isPushing
                    ? 'Escribiendo en pestaña...'
                    : `Escribir resultados en "${TARGET_SHEET_NAME}" (${responses.length})`}
                </span>
              </button>

              {onRefreshData && (
                <button
                  type="button"
                  onClick={onRefreshData}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Leer los datos actuales de Google Sheets"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-700' : ''}`} />
                  <span>{isSyncing ? 'Leyendo...' : 'Recargar'}</span>
                </button>
              )}

              <a
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
              >
                <span>Abrir en Google Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={onUnlink}
                className="text-xs text-slate-500 hover:text-red-700 underline underline-offset-2 ml-1 cursor-pointer"
              >
                Cambiar ID
              </button>
            </div>
          </div>
        ) : (
          /* Estado de Vinculación: Permite vincular por ID o crear una nueva en Drive con 1 clic */
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-emerald-700" />
                  Conectar con tu Hoja de Cálculo en Google Drive
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Los resultados de la encuesta se registrarán en la pestaña <strong>{TARGET_SHEET_NAME}</strong>. Puedes conectar una hoja existente o crear una automáticamente en tu Google Drive.
                </p>
              </div>

              {!user && (
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.28-2.1 3.66-5.18 3.66-9.12z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.26 21.36 7.36 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                    />
                  </svg>
                  <span>Iniciar sesión con Google</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Opción 1: Pegar ID o URL */}
              <form onSubmit={handleLinkSpreadsheet} className="md:col-span-8 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={inputId}
                  onChange={(e) => setInputId(e.target.value)}
                  placeholder="Pega el enlace o ID de tu Google Sheet (ej: https://docs.google.com/spreadsheets/d/...)"
                  className="flex-1 px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>{isLoading ? 'Conectando...' : 'Vincular y Guardar'}</span>
                </button>
              </form>

              {/* Separador "O" */}
              <div className="md:col-span-4 flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleCreateNewSheetInDrive}
                  disabled={isCreating}
                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-700" />
                  <span>
                    {isCreating ? 'Creando en Google Drive...' : 'Crear Hoja nueva en mi Drive'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
