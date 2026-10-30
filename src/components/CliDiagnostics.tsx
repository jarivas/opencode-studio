import React, { useState } from 'react';
import {
  Wrench,
  Download,
  RotateCw,
  Power,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Activity,
  Layers,
  FileText,
  Server,
} from 'lucide-react';
import { OpenCodeStatus } from '../types';

interface CliDiagnosticsProps {
  status: OpenCodeStatus | null;
  onRefresh: () => void;
}

export const CliDiagnostics: React.FC<CliDiagnosticsProps> = ({
  status,
  onRefresh,
}) => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [installLogs, setInstallLogs] = useState<string[]>([]);
  const [serviceActionLoading, setServiceActionLoading] = useState<string | null>(null);
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);

  const handleInstall = async () => {
    setIsInstalling(true);
    setInstallLogs(['Conectando con el instalador de OpenCode...\n']);

    try {
      const response = await fetch('/api/install', { method: 'POST' });
      if (!response.body) throw new Error('No body returned');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.message) {
                setInstallLogs((prev) => [...prev, data.message]);
              }
            } catch (e) {
              // ignore
            }
          }
        }
      }
      onRefresh();
    } catch (err: any) {
      setInstallLogs((prev) => [...prev, `\nError durante la instalación: ${err.message}`]);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleServiceAction = async (action: 'start' | 'restart' | 'stop') => {
    setServiceActionLoading(action);
    setServiceMessage(null);
    try {
      const res = await fetch(`/api/service/${action}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setServiceMessage(`Servicio: acción ${action} ejecutada correctamente.`);
        onRefresh();
      } else {
        setServiceMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setServiceMessage(`Error: ${err.message}`);
    } finally {
      setServiceActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            <span>Diagnóstico & Gestión del Motor OpenCode</span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Comprueba el estado del binario de OpenCode, gestiona el demonio de fondo y ejecuta instalaciones o actualizaciones automáticas.
          </p>
        </div>

        <button
          onClick={handleInstall}
          disabled={isInstalling}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{isInstalling ? 'Instalando CLI...' : 'Instalar / Actualizar OpenCode'}</span>
        </button>
      </div>

      {/* Status metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 bg-white dark:bg-neutral-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Estado de CLI
            </span>
            {status?.cli?.installed ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Instalado
              </span>
            ) : (
              <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                No detectado
              </span>
            )}
          </div>
          <div className="font-mono text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {status?.cli?.version || 'N/D'}
          </div>
          <p className="text-[11px] text-neutral-500 font-mono mt-1 truncate">
            {status?.cli?.path || 'Sin binario'}
          </p>
        </div>

        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 bg-white dark:bg-neutral-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Servicio de Fondo
            </span>
            {status?.service?.running ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                Activo
              </span>
            ) : (
              <span className="text-xs text-neutral-400 font-semibold">Inactivo</span>
            )}
          </div>
          <div className="font-mono text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
            {status?.service?.url || 'Inactivo (Modo Standalone)'}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => handleServiceAction('restart')}
              disabled={!!serviceActionLoading}
              className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 hover:underline flex items-center gap-1"
            >
              <RotateCw className="w-3 h-3" />
              <span>Reiniciar</span>
            </button>
            <span className="text-neutral-300 dark:text-neutral-700">|</span>
            <button
              onClick={() => handleServiceAction('stop')}
              disabled={!!serviceActionLoading}
              className="text-[11px] font-medium text-rose-600 hover:underline flex items-center gap-1"
            >
              <Power className="w-3 h-3" />
              <span>Detener</span>
            </button>
          </div>
        </div>

        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 bg-white dark:bg-neutral-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Workspace & Config
            </span>
            <span className="text-xs text-neutral-400 font-mono">OK</span>
          </div>
          <div className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
            {status?.workspaceDir}
          </div>
          <p className="text-[11px] text-neutral-500 font-mono mt-1 truncate">
            {status?.configFile}
          </p>
        </div>
      </div>

      {serviceMessage && (
        <div className="p-3 rounded-lg text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
          {serviceMessage}
        </div>
      )}

      {/* Terminal of Installation Logs if running */}
      {installLogs.length > 0 && (
        <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950 text-neutral-100">
          <div className="px-4 py-2 bg-neutral-900 border-b border-neutral-800 text-xs font-mono text-neutral-400">
            Registro de Instalación de OpenCode
          </div>
          <div className="p-4 font-mono text-xs max-h-60 overflow-y-auto leading-relaxed select-text space-y-1">
            {installLogs.map((log, i) => (
              <div key={i} className="text-neutral-300">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diagnostic FAQ & Tips */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 bg-white dark:bg-neutral-900 space-y-4">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Información Técnica sobre OpenCode
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-neutral-600 dark:text-neutral-400">
          <div className="space-y-1">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 block">
              ¿Cómo gestiona OpenCode los permisos?
            </span>
            <p className="leading-relaxed">
              Por defecto, OpenCode solicita confirmación antes de modificar archivos o ejecutar comandos de shell. Con el flag <code className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">--auto</code> habilitado desde el panel de control, OpenCode aprueba de manera autónoma las acciones seguras.
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 block">
              ¿Qué diferencia hay entre Build Agent y Plan Agent?
            </span>
            <p className="leading-relaxed">
              El <strong>Build Agent</strong> tiene acceso total de lectura y escritura para implementar soluciones de código. El <strong>Plan Agent</strong> opera en modo de solo lectura para explorar bases de código y diseñar planes de trabajo sin alterar ningún archivo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
