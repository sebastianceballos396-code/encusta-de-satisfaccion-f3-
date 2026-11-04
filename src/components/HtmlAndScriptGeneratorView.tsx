import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  Code2,
  FileCode,
  CheckCircle2
} from 'lucide-react';
import {
  generateStandaloneHtmlCode,
  generateGoogleAppsScriptCode
} from '../data/surveyConfig';

interface HtmlAndScriptGeneratorViewProps {
  scriptUrl: string;
  onScriptUrlChange: (url: string) => void;
}

export const HtmlAndScriptGeneratorView: React.FC<HtmlAndScriptGeneratorViewProps> = ({
  scriptUrl,
  onScriptUrlChange
}) => {
  const [sheetName, setSheetName] = useState<string>('resultados f3');
  const [activeCodeTab, setActiveCodeTab] = useState<'html' | 'gs'>('html');
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);
  const [copiedGs, setCopiedGs] = useState<boolean>(false);

  const htmlCode = generateStandaloneHtmlCode(scriptUrl);
  const gsCode = generateGoogleAppsScriptCode(sheetName);

  const handleCopyCode = async (type: 'html' | 'gs') => {
    try {
      await navigator.clipboard.writeText(type === 'html' ? htmlCode : gsCode);
      if (type === 'html') {
        setCopiedHtml(true);
        setTimeout(() => setCopiedHtml(false), 2500);
      } else {
        setCopiedGs(true);
        setTimeout(() => setCopiedGs(false), 2500);
      }
    } catch {
      // Ignore clipboard error
    }
  };

  const handleDownloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Guía en 3 Pasos para Conectar el HTML con Google Sheets */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="mb-5">
          <h2 className="text-base font-bold text-slate-900">
            Cómo conectar su Formulario HTML con una Hoja de Cálculo de Google
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Siga estos 3 pasos para que su hoja de Google reciba automáticamente las 10 respuestas de la Sala de Computación F3 sin necesidad de servidores adicionales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs font-mono tabular-nums font-bold text-emerald-700 mb-1">
              01. Preparar Google Sheets
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
              Abra Extensiones → Apps Script
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cree una Hoja de Cálculo de Google nueva, abra el menú <strong>Extensiones &gt; Apps Script</strong> y pegue el código de la pestaña <strong>Código.gs (Google Script)</strong> que se incluye abajo.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs font-mono tabular-nums font-bold text-emerald-700 mb-1">
              02. Publicar como Aplicación Web
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
              Implementar → Nueva implementación
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Elija tipo <strong>Aplicación web</strong>, configure <em>Ejecutar como: Yo</em> y en <em>Quién tiene acceso</em> seleccione <strong>Cualquier persona</strong>. Copie la URL terminada en <code className="font-mono">/exec</code>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs font-mono tabular-nums font-bold text-emerald-700 mb-1">
              03. Descargar el Formulario HTML
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
              Pegar URL y descargar .HTML
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pegue su URL en el campo inferior; el archivo <code className="font-mono">encuesta_sala_f3_buga.html</code> se actualizará automáticamente listo para abrir en cualquier computador de la Sala F3.
            </p>
          </div>
        </div>

        {/* Configurador Rápido de Variables del Código */}
        <div className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-7">
            <label
              htmlFor="custom-script-url"
              className="block text-xs font-semibold text-slate-800 mb-1"
            >
              URL de su Aplicación Web de Google Apps Script (se inyecta en el código HTML)
            </label>
            <input
              id="custom-script-url"
              type="url"
              value={scriptUrl}
              onChange={(e) => onScriptUrlChange(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="md:col-span-5">
            <label
              htmlFor="custom-sheet-name"
              className="block text-xs font-semibold text-slate-800 mb-1"
            >
              Pestaña destino en Google Sheets (resultados f3)
            </label>
            <input
              id="custom-sheet-name"
              type="text"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              placeholder="resultados f3"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Visor y Descarga de Código HTML + Apps Script */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveCodeTab('html')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeCodeTab === 'html'
                  ? 'bg-emerald-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <FileCode className="w-4 h-4" />
              1. Archivo Formulario HTML (encuesta_sala_f3_buga.html)
            </button>

            <button
              type="button"
              onClick={() => setActiveCodeTab('gs')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeCodeTab === 'gs'
                  ? 'bg-emerald-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Code2 className="w-4 h-4" />
              2. Receptor Google Sheets (Código.gs)
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeCodeTab === 'html' ? (
              <>
                <button
                  type="button"
                  onClick={() => handleCopyCode('html')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedHtml ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>HTML Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar HTML</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadFile(
                      htmlCode,
                      'encuesta_sala_f3_buga.html',
                      'text/html;charset=utf-8'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar .HTML</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleCopyCode('gs')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedGs ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Script Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Código.gs</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadFile(
                      gsCode,
                      'Codigo_Google_Sheets_Sala_F3.gs',
                      'text/plain;charset=utf-8'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Código.gs</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>
              {activeCodeTab === 'html'
                ? 'Código HTML5 autónomo completo con estilos CSS y envío fetch() a Google Sheets para las 10 preguntas.'
                : 'Script para Google Sheets que crea automáticamente los 11 encabezados (Marca temporal + 10 preguntas) y guarda cada respuesta.'}
            </span>
          </div>
          <span className="font-mono tabular-nums text-slate-500">UTF-8</span>
        </div>

        <pre className="p-6 bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto max-h-[540px] leading-relaxed">
          <code>{activeCodeTab === 'html' ? htmlCode : gsCode}</code>
        </pre>
      </div>
    </div>
  );
};
