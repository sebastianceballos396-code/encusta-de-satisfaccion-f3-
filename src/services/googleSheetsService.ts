import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  SPREADSHEET_17_HEADERS,
  SurveyResponse,
  responseTo17Columns
} from '../data/surveyConfig';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');

export const TARGET_SHEET_NAME = 'resultados f3';

let isSigningIn = false;
let cachedAccessToken: string | null = (() => {
  try {
    return localStorage.getItem('cab_buga_google_token_v1') || null;
  } catch {
    return null;
  }
})();

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (!cachedAccessToken) {
        try {
          cachedAccessToken = localStorage.getItem('cab_buga_google_token_v1');
        } catch {}
      }
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      try {
        localStorage.removeItem('cab_buga_google_token_v1');
      } catch {}
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google. Por favor intente nuevamente.');
    }

    cachedAccessToken = credential.accessToken;
    try {
      localStorage.setItem('cab_buga_google_token_v1', cachedAccessToken);
    } catch {}

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error al iniciar sesión con Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (!cachedAccessToken) {
    try {
      cachedAccessToken = localStorage.getItem('cab_buga_google_token_v1');
    } catch {}
  }
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  try {
    localStorage.removeItem('cab_buga_google_token_v1');
  } catch {}
};

/**
 * Extrae el ID de una URL de Google Sheets o devuelve el string limpio si ya es un ID
 */
export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

export interface GoogleSpreadsheetMeta {
  id: string;
  title: string;
  sheets: { title: string; sheetId: number }[];
}

/**
 * Crea una nueva hoja de cálculo directamente en el Google Drive del usuario autenticado
 * con la pestaña "resultados f3" preconfigurada.
 */
export async function createSpreadsheetInDrive(
  token: string,
  title = 'resultados f3'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; title: string; meta: GoogleSpreadsheetMeta }> {
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title
      },
      sheets: [
        {
          properties: {
            title: TARGET_SHEET_NAME
          }
        }
      ]
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `No se pudo crear la hoja de cálculo en Drive (${res.status})`
    );
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const sheets = (data.sheets || []).map((s: any) => ({
    title: s.properties?.title || TARGET_SHEET_NAME,
    sheetId: s.properties?.sheetId || 0
  }));

  const meta: GoogleSpreadsheetMeta = {
    id: spreadsheetId,
    title: data.properties?.title || title,
    sheets
  };

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    title: meta.title,
    meta
  };
}

/**
 * Obtiene la metadata del libro de Google Sheets usando el ID
 */
export async function getSpreadsheetDetails(
  spreadsheetId: string,
  token: string
): Promise<GoogleSpreadsheetMeta> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    if (res.status === 401) {
      throw new Error('Su sesión de Google ha expirado. Por favor haga clic en "Iniciar sesión con Google".');
    }
    if (res.status === 403) {
      throw new Error(
        'Permiso denegado en Google Sheets. Asegúrese de que su cuenta de Google tiene acceso de edición a esta hoja de cálculo.'
      );
    }
    if (res.status === 404) {
      throw new Error(`Hoja de cálculo no encontrada con ID "${cleanId}". Verifique el ID o enlace.`);
    }
    throw new Error(
      errorData.error?.message ||
        `Error al acceder a la hoja de cálculo (${res.status}). Verifique el ID y permisos.`
    );
  }

  const data = await res.json();
  const sheets = (data.sheets || []).map((s: any) => ({
    title: s.properties?.title || TARGET_SHEET_NAME,
    sheetId: s.properties?.sheetId || 0
  }));

  return {
    id: cleanId,
    title: data.properties?.title || 'Hoja de Cálculo sin título',
    sheets
  };
}

/**
 * Busca si existe una pestaña que coincida con "resultados f3" (insensible a mayúsculas)
 */
export function findMatchingTabName(
  sheets: { title: string }[],
  target = TARGET_SHEET_NAME
): string | null {
  const cleanTarget = target.trim().toLowerCase();
  // 1. Coincidencia exacta insensible a mayúsculas (ej: "resultados f3" o "Resultados F3")
  const exact = sheets.find((s) => s.title.trim().toLowerCase() === cleanTarget);
  if (exact) return exact.title;

  // 2. Coincidencia que contenga 'resultado' y 'f3' (ej: "Resultados Ambiente F3")
  const partial = sheets.find((s) => {
    const t = s.title.trim().toLowerCase();
    return t.includes('resultado') && t.includes('f3');
  });
  if (partial) return partial.title;

  // 3. Coincidencia que contenga 'resultado'
  const anyResultado = sheets.find((s) => s.title.trim().toLowerCase().includes('resultado'));
  if (anyResultado) return anyResultado.title;

  // 4. Si el usuario aún tiene la pestaña anterior 'encuesta f3'
  const anyEncuesta = sheets.find((s) => {
    const t = s.title.trim().toLowerCase();
    return t.includes('encuesta') && t.includes('f3');
  });
  if (anyEncuesta) return anyEncuesta.title;

  return null;
}

/**
 * Asegura que la pestaña "encuesta f3" exista en el documento de Google Sheets.
 * Si no existe, la crea automáticamente con la API de Google Sheets.
 */
export async function ensureSheetTabExists(
  spreadsheetId: string,
  token: string,
  preferredTab = TARGET_SHEET_NAME
): Promise<string> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const meta = await getSpreadsheetDetails(cleanId, token);
  const existingName = findMatchingTabName(meta.sheets, preferredTab);

  if (existingName) {
    return existingName;
  }

  // Si no existe, crear la pestaña "encuesta f3" usando batchUpdate
  try {
    const createRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: preferredTab
                }
              }
            }
          ]
        })
      }
    );

    if (createRes.ok) {
      return preferredTab;
    }

    const errData = await createRes.json().catch(() => ({}));
    console.warn('No se pudo crear automáticamente la pestaña:', errData);
    return meta.sheets[0]?.title || preferredTab;
  } catch (err) {
    console.warn('Error al llamar batchUpdate para crear pestaña:', err);
    return meta.sheets[0]?.title || preferredTab;
  }
}

/**
 * Lee los valores de la pestaña "encuesta f3" (o la pestaña activa) de Google Sheets
 */
export async function readSheetValues(
  spreadsheetId: string,
  token: string,
  tabName = TARGET_SHEET_NAME
): Promise<string[][]> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const encodedTab = encodeURIComponent(tabName);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/'${encodedTab}'!A1:R500`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!res.ok) {
    // Si la pestaña específica no se encuentra, intentar leer el rango general sin nombre de pestaña
    const fallbackRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/A1:R500`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    if (!fallbackRes.ok) return [];
    const fallbackData = await fallbackRes.json();
    return fallbackData.values || [];
  }

  const data = await res.json();
  return data.values || [];
}

/**
 * Inicializa los 18 encabezados oficiales en la pestaña "encuesta f3" si la fila 1 está vacía
 */
export async function initializeHeadersIfEmpty(
  spreadsheetId: string,
  token: string,
  tabName = TARGET_SHEET_NAME
): Promise<boolean> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const currentValues = await readSheetValues(cleanId, token, tabName);

  if (currentValues.length === 0 || !currentValues[0] || currentValues[0].length === 0) {
    const encodedTab = encodeURIComponent(tabName);
    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/'${encodedTab}'!A1:R1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [SPREADSHEET_17_HEADERS]
        })
      }
    );
    return updateRes.ok;
  }

  return true;
}

/**
 * Escribe o actualiza de forma completa todos los resultados en la pestaña "encuesta f3" de Google Sheets
 * Coloca los encabezados en la Fila 1 y todas las respuestas a partir de la Fila 2.
 */
export async function syncAllResponsesToDrive(
  spreadsheetId: string,
  token: string,
  responses: SurveyResponse[],
  tabName = TARGET_SHEET_NAME
): Promise<{ success: boolean; rowsWritten: number; updatedRange?: string; tabUsed?: string; error?: string }> {
  try {
    const cleanId = extractSpreadsheetId(spreadsheetId);
    const targetTab = await ensureSheetTabExists(cleanId, token, tabName);

    const rows = [
      SPREADSHEET_17_HEADERS,
      ...responses.map((r) => responseTo17Columns(r))
    ];

    const rangeStr = `'${targetTab}'!A1:R${Math.max(rows.length, 1)}`;
    const encodedRange = encodeURIComponent(rangeStr);

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodedRange}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range: rangeStr,
          majorDimension: 'ROWS',
          values: rows
        })
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        rowsWritten: 0,
        error: err.error?.message || `Error al sincronizar con pestaña "${targetTab}" (${res.status})`
      };
    }

    const data = await res.json();
    return {
      success: true,
      rowsWritten: responses.length,
      updatedRange: data.updatedRange || rangeStr,
      tabUsed: targetTab
    };
  } catch (error: any) {
    return {
      success: false,
      rowsWritten: 0,
      error: error.message || 'Error de conexión con Google Sheets API'
    };
  }
}

/**
 * Agrega una nueva fila de respuesta a la hoja "resultados f3" de Google Sheets usando el Spreadsheet ID
 */
export async function appendResponseToGoogleSheet(
  spreadsheetId: string,
  token: string,
  response: SurveyResponse,
  tabName = TARGET_SHEET_NAME
): Promise<{ success: boolean; updatedRange?: string; tabUsed?: string; error?: string }> {
  try {
    const cleanId = extractSpreadsheetId(spreadsheetId);

    // 1. Asegurar que la pestaña exista
    const targetTab = await ensureSheetTabExists(cleanId, token, tabName);

    // 2. Asegurar que los encabezados existan en la fila 1
    await initializeHeadersIfEmpty(cleanId, token, targetTab);

    // 3. Convertir los 10 campos a las 18 columnas oficiales de la hoja
    const rowValues = responseTo17Columns(response);
    const rangeStr = `'${targetTab}'!A1`;
    const encodedRange = encodeURIComponent(rangeStr);

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range: rangeStr,
          majorDimension: 'ROWS',
          values: [rowValues]
        })
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 401) {
        return {
          success: false,
          error: 'Sesión expirada con Google. Haga clic en Iniciar sesión con Google para renovar el permiso.'
        };
      }
      if (res.status === 403) {
        return {
          success: false,
          error: 'Permiso denegado. Asegúrese de que su cuenta de Google tiene permiso de editor en la hoja de cálculo.'
        };
      }
      return {
        success: false,
        error:
          err.error?.message ||
          `Error al guardar en la pestaña "${targetTab}" de Google Sheets (${res.status})`
      };
    }

    const data = await res.json();
    return {
      success: true,
      updatedRange: data.updates?.updatedRange,
      tabUsed: targetTab
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error de conexión con Google Sheets API'
    };
  }
}
