import React, { useState } from 'react';
import {
  ExternalLink,
  Laptop,
  Tablet,
  Smartphone,
  Globe,
  Sliders,
  Terminal,
  FileCode,
  RotateCcw,
  Folder,
} from 'lucide-react';
import { OpenCodeConfig } from '../types';

interface LivePreviewProps {
  config: OpenCodeConfig;
  onOpenSettings: () => void;
  terminalLogs: string[];
  isRunning: boolean;
  onSwitchToChat?: () => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  config,
  onOpenSettings,
  terminalLogs,
  isRunning,
  onSwitchToChat,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'terminal' | 'files'>('preview');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [subPath, setSubPath] = useState('/');
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(false);

  // Compute effective base URL: use configured previewBaseUrl or fallback to window.location.origin
  const effectiveBaseUrl =
    config.previewBaseUrl && config.previewBaseUrl.trim()
      ? config.previewBaseUrl.replace(/\/+$/, '')
      : typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000';

  const fullUrl = `${effectiveBaseUrl}${subPath.startsWith('/') ? subPath : '/' + subPath}`;

  const handleRefresh = () => {
    setIframeLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handlePathKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRefresh();
    }
  };

  const handleOpenExternal = () => {
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  const getContainerWidth = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'w-[375px] h-[667px] shadow-2xl rounded-2xl border-4 border-neutral-800 dark:border-neutral-700';
      case 'tablet':
        return 'w-[768px] h-[90%] shadow-xl rounded-xl border-2 border-neutral-300 dark:border-neutral-700';
      default:
        return 'w-full h-full';
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-100 dark:bg-neutral-950 overflow-hidden">
      {/* Top Browser Chrome & Tooling Bar */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-3 py-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
        {/* Left: View Tabs */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Vista Previa</span>
          </button>

          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'terminal'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Terminal</span>
            {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'files'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>JSON Proyectos</span>
          </button>
        </div>

        {/* Center: URL address bar if preview tab */}
        {activeTab === 'preview' && (
          <div className="flex-1 max-w-xl flex items-center gap-1.5 px-2 py-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
            <button
              onClick={handleRefresh}
              title="Recargar vista previa"
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5 rounded cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${iframeLoading ? 'animate-spin' : ''}`} />
            </button>

            <span className="text-neutral-400 font-mono text-[11px] truncate max-w-[120px] sm:max-w-[200px]" title={effectiveBaseUrl}>
              {effectiveBaseUrl}
            </span>

            <input
              type="text"
              value={subPath}
              onChange={(e) => setSubPath(e.target.value)}
              onKeyDown={handlePathKeyDown}
              placeholder="/"
              className="flex-1 bg-transparent text-neutral-900 dark:text-neutral-100 font-mono text-[11px] focus:outline-hidden"
            />

            <button
              onClick={handleOpenExternal}
              title="Abrir URL completa en nueva pestaña"
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5 rounded cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Right: Device responsive toggles & settings link */}
        <div className="flex items-center gap-2 justify-end">
          {onSwitchToChat && (
            <button
              onClick={onSwitchToChat}
              className="lg:hidden text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white underline cursor-pointer mr-1"
            >
              ← Volver al chat
            </button>
          )}

          {activeTab === 'preview' && (
            <div className="hidden md:flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg text-neutral-500">
              <button
                onClick={() => setDeviceMode('desktop')}
                className={`p-1 rounded cursor-pointer ${
                  deviceMode === 'desktop' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs' : ''
                }`}
                title="Escritorio (100%)"
              >
                <Laptop className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeviceMode('tablet')}
                className={`p-1 rounded cursor-pointer ${
                  deviceMode === 'tablet' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs' : ''
                }`}
                title="Tableta (768px)"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeviceMode('mobile')}
                className={`p-1 rounded cursor-pointer ${
                  deviceMode === 'mobile' ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs' : ''
                }`}
                title="Móvil (375px)"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={onOpenSettings}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1 cursor-pointer"
            title="Ajustes de Proyectos y URL Base"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px] font-medium">Ajustes</span>
          </button>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-hidden relative flex items-center justify-center p-2">
        {/* TAB 1: LIVE PREVIEW IFRAME */}
        {activeTab === 'preview' && (
          <div className="w-full h-full flex items-center justify-center overflow-auto">
            <div className={`transition-all duration-200 bg-white dark:bg-neutral-900 overflow-hidden relative ${getContainerWidth()}`}>
              <iframe
                key={iframeKey}
                src={fullUrl}
                title="Live Application Preview"
                className="w-full h-full border-0"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                onLoad={() => setIframeLoading(false)}
              />
            </div>
          </div>
        )}

        {/* TAB 2: TERMINAL LOGS */}
        {activeTab === 'terminal' && (
          <div className="w-full h-full rounded-xl overflow-hidden bg-neutral-950 text-neutral-100 flex flex-col border border-neutral-800">
            <div className="px-4 py-2 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-xs font-mono text-neutral-400">
              <span className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Consola en tiempo real de OpenCode</span>
              </span>
              <span>{terminalLogs.length} líneas registradas</span>
            </div>

            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto leading-relaxed select-text space-y-1">
              {terminalLogs.length === 0 ? (
                <div className="text-neutral-500 py-16 text-center">
                  No hay comandos recientes. Envía una petición en el chat para ver la salida de OpenCode.
                </div>
              ) : (
                terminalLogs.map((log, i) => (
                  <pre key={i} className="whitespace-pre-wrap break-all text-neutral-200">
                    {log}
                  </pre>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PROJECT JSON FILES VIEWER */}
        {activeTab === 'files' && (
          <div className="w-full h-full rounded-xl overflow-hidden bg-white dark:bg-neutral-900 flex flex-col border border-neutral-200 dark:border-neutral-800">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <Folder className="w-4 h-4 text-amber-500" />
                  <span>Configuraciones Agrupadas por Proyectos en JSON</span>
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Archivo <code className="font-mono text-neutral-700 dark:text-neutral-300">opencode.projects.json</code> con los proyectos configurados.
                </p>
              </div>

              <button
                onClick={onOpenSettings}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-medium cursor-pointer"
              >
                Gestionar Proyectos
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-y-auto">
              {/* opencode.projects.json Card */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-neutral-950 text-neutral-100 flex flex-col">
                <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-mono flex items-center justify-between">
                  <span>opencode.projects.json (Multi-proyecto)</span>
                  <span className="text-emerald-400 text-[10px]">Activo</span>
                </div>
                <pre className="p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto flex-1 leading-relaxed">
                  {config.projectsJsonContent ||
                    JSON.stringify(
                      {
                        activeProjectId: config.id,
                        projects: [
                          {
                            id: config.id,
                            name: config.name,
                            previewBaseUrl: config.previewBaseUrl,
                            model: config.model,
                            agent: config.agent,
                          },
                        ],
                      },
                      null,
                      2
                    )}
                </pre>
              </div>

              {/* opencode.json Card (active project sync) */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-neutral-950 text-neutral-100 flex flex-col">
                <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-mono flex items-center justify-between">
                  <span>opencode.json (Sincronizado)</span>
                  <span className="text-amber-400 text-[10px]">{config.name}</span>
                </div>
                <pre className="p-3 font-mono text-[11px] text-amber-300 overflow-x-auto flex-1 leading-relaxed">
                  {JSON.stringify(
                    {
                      previewBaseUrl: config.previewBaseUrl,
                      model: config.model,
                      agent: config.agent,
                      autoApprove: config.autoApprove,
                      thinking: config.thinking,
                      projectId: config.id,
                      projectName: config.name,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
