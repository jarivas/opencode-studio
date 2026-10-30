import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  Play,
  Square,
  Trash2,
  Copy,
  Check,
  Bot,
  Shield,
  ExternalLink,
  ChevronRight,
  Code2,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { OpenCodeConfig, ExecutionLog } from '../types';

interface StudioTerminalProps {
  config: OpenCodeConfig;
  onRunPrompt: (
    prompt: string,
    options: { model?: string; agent?: string; autoApprove?: boolean; thinking?: boolean }
  ) => Promise<ReadableStreamDefaultReader<Uint8Array> | void>;
  onPairWeb: () => Promise<{ pairLink: string | null; serviceUrl?: string }>;
}

// Clean ANSI escape sequences for crisp display
function cleanAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

export const StudioTerminal: React.FC<StudioTerminalProps> = ({
  config,
  onPairWeb,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState(config.model || 'google/gemini-2.5-flash');
  const [activeAgent, setActiveAgent] = useState<'build' | 'plan'>(config.agent || 'build');
  const [outputLogs, setOutputLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<ExecutionLog[]>([]);
  const [pairInfo, setPairInfo] = useState<{ pairLink: string | null; serviceUrl?: string } | null>(null);
  const [isPairing, setIsPairing] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputLogs]);

  // Quick preset tasks
  const presets = [
    {
      title: 'Explicar Arquitectura',
      desc: 'Analiza la estructura del proyecto y explica sus módulos clave',
      prompt: 'Analiza el workspace y describe la arquitectura general, dependencias clave y flujo de datos.',
      agent: 'plan' as const,
    },
    {
      title: 'Auditar TypeScript & Errores',
      desc: 'Ejecuta verificación de tipos y reporta discrepancias',
      prompt: 'Verifica la integridad de TypeScript en el workspace y lista cualquier advertencia o incompatibilidad.',
      agent: 'plan' as const,
    },
    {
      title: 'Optimizar Rendimiento',
      desc: 'Busca cuellos de botella y propone mejoras de velocidad',
      prompt: 'Revisa el código en src/ y propone refactorizaciones concretas para mejorar rendimiento y legibilidad.',
      agent: 'build' as const,
    },
    {
      title: 'Generar Tests Unitarios',
      desc: 'Escribe pruebas para funciones críticas del proyecto',
      prompt: 'Crea una suite de pruebas unitarias para los componentes y utilidades del proyecto.',
      agent: 'build' as const,
    },
  ];

  const handleLaunchPrompt = async (textToRun: string = prompt, overrideAgent?: 'build' | 'plan') => {
    if (!textToRun.trim() || isRunning) return;

    const chosenAgent = overrideAgent || activeAgent;
    setIsRunning(true);
    const runId = 'run_' + Date.now();
    setCurrentRunId(runId);

    setOutputLogs((prev) => [
      ...prev,
      `\n┌─ [OpenCode ${chosenAgent.toUpperCase()} AGENT] ──────────────────────────────────────────┐`,
      `│ Modelo: ${activeModel}`,
      `│ Prompt: ${textToRun}`,
      `└─────────────────────────────────────────────────────────────────────────────┘\n`,
    ]);

    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToRun,
          model: activeModel,
          agent: chosenAgent,
          autoApprove: config.autoApprove ?? true,
          thinking: config.thinking ?? true,
          standalone: config.standalone ?? true,
        }),
      });

      if (!response.ok || !response.body) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedOutput = '';

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
              if (data.type === 'chunk' && data.text) {
                const cleaned = cleanAnsi(data.text);
                accumulatedOutput += cleaned;
                setOutputLogs((prev) => [...prev, cleaned]);
              } else if (data.type === 'done') {
                setOutputLogs((prev) => [
                  ...prev,
                  `\n✔ Tarea finalizada con código de salida: ${data.code}`,
                ]);
              } else if (data.type === 'error') {
                setOutputLogs((prev) => [...prev, `\n✖ Error: ${data.message}`]);
              }
            } catch (e) {
              // ignore parse errors on partial streams
            }
          }
        }
      }

      // Save to session history
      setHistory((prev) => [
        {
          id: runId,
          timestamp: new Date().toLocaleTimeString(),
          prompt: textToRun,
          model: activeModel,
          agent: chosenAgent,
          status: 'completed',
          output: accumulatedOutput,
        },
        ...prev.slice(0, 9),
      ]);
    } catch (err: any) {
      setOutputLogs((prev) => [...prev, `\n✖ Fallo al ejecutar: ${err.message}`]);
    } finally {
      setIsRunning(false);
      setCurrentRunId(null);
    }
  };

  const handleStopRun = async () => {
    if (!currentRunId) return;
    try {
      await fetch(`/api/stop/${currentRunId}`, { method: 'POST' });
      setOutputLogs((prev) => [...prev, '\n⚠ Tarea cancelada por el usuario.']);
    } catch (e) {
      // ignore
    } finally {
      setIsRunning(false);
      setCurrentRunId(null);
    }
  };

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(outputLogs.join(''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearTerminal = () => {
    setOutputLogs([]);
  };

  const handleOpenNativePair = async () => {
    setIsPairing(true);
    try {
      const res = await onPairWeb();
      setPairInfo(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPairing(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Studio Header & Model / Agent Selector */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <TerminalIcon className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
              <span>Studio Terminal de OpenCode</span>
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Interactúa con el agente de OpenCode en tiempo real. Envía prompts para codificar, refactorizar o planificar arquitecturas.
            </p>
          </div>

          {/* Quick controls: Model selector & Agent mode */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Agent Mode Toggle */}
            <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveAgent('build')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeAgent === 'build'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Build Agent</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAgent('plan')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeAgent === 'plan'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Plan Agent</span>
              </button>
            </div>

            {/* Model select */}
            <select
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg font-mono text-xs text-neutral-900 dark:text-neutral-100 focus:outline-hidden"
            >
              <option value="google/gemini-2.5-flash">google/gemini-2.5-flash</option>
              <option value="google/gemini-2.5-pro">google/gemini-2.5-pro</option>
              <option value="google/gemini-3-flash-preview">google/gemini-3-flash-preview</option>
              <option value="anthropic/claude-3-7-sonnet">anthropic/claude-3-7-sonnet</option>
              <option value="anthropic/claude-3-5-sonnet">anthropic/claude-3-5-sonnet</option>
              <option value="openai/gpt-4o">openai/gpt-4o</option>
              <option value="deepseek/deepseek-r1">deepseek/deepseek-r1</option>
              <option value="opencode/deepseek-v4.1-flash-free">opencode/deepseek-v4.1-flash-free</option>
            </select>

            {/* Native OpenCode Web Pair button */}
            <button
              onClick={handleOpenNativePair}
              disabled={isPairing}
              className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium flex items-center gap-1.5 cursor-pointer"
              title="Obtener enlace de emparejamiento con OpenCode Web"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isPairing ? 'Conectando...' : 'Conectar Web TUI'}</span>
            </button>
          </div>
        </div>

        {/* Pairing link notification banner if opened */}
        {pairInfo?.pairLink && (
          <div className="mt-4 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Servidor web OpenCode listo en {pairInfo.serviceUrl || '127.0.0.1:49374'}</span>
              </span>
              <span className="text-neutral-500 font-mono text-[11px] block truncate max-w-xl">
                Enlace de un solo uso (válido por 5 minutos): {pairInfo.pairLink}
              </span>
            </div>
            <a
              href={pairInfo.pairLink}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 rounded-md font-semibold whitespace-nowrap shrink-0 flex items-center gap-1 text-center"
            >
              <span>Abrir Interfaz Nativa</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* Quick Task Presets */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Tareas Rápidas Sugeridas
          </span>
          <span className="text-[11px] text-neutral-400">Haz clic para rellenar y ejecutar</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {presets.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setPrompt(p.prompt);
                handleLaunchPrompt(p.prompt, p.agent);
              }}
              disabled={isRunning}
              className="p-3 text-left rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-950 dark:group-hover:text-white">
                  {p.title}
                </span>
                <span className="text-[10px] uppercase font-mono text-neutral-400">
                  {p.agent}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed line-clamp-2">
                {p.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Prompt Input Box */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 shadow-xs">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleLaunchPrompt();
              }
            }}
            placeholder={`Escribe una instrucción para OpenCode... (Ej: "Crea una función para procesar datos", "Revisa src/App.tsx", o pulsa Ctrl+Enter)`}
            rows={3}
            disabled={isRunning}
            className="w-full p-4 text-xs font-mono bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-hidden resize-none leading-relaxed"
          />
        </div>

        <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/60 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
            <span>Presiona <kbd className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">Ctrl+Enter</kbd> para enviar</span>
            <span aria-hidden="true">·</span>
            <span>Permisos: {config.autoApprove ? 'Auto-aprobados' : 'Manual'}</span>
          </div>

          <div className="flex items-center gap-2">
            {isRunning ? (
              <button
                type="button"
                onClick={handleStopRun}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Detener Proceso</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleLaunchPrompt()}
                disabled={!prompt.trim()}
                className={`px-4 py-2 text-xs font-semibold rounded-lg text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  prompt.trim()
                    ? 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100'
                    : 'bg-neutral-300 dark:bg-neutral-700 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Ejecutar con OpenCode</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Terminal Output Viewer */}
      <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950 text-neutral-100 shadow-md">
        {/* Terminal Header */}
        <div className="px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xs font-mono text-neutral-400 ml-2">
              opencode stdout / stderr stream
            </span>
            {isRunning && (
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 ml-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Ejecutando...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLogs}
              disabled={outputLogs.length === 0}
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors text-xs flex items-center gap-1"
              title="Copiar logs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
            </button>

            <button
              onClick={handleClearTerminal}
              disabled={outputLogs.length === 0}
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors text-xs flex items-center gap-1"
              title="Limpiar consola"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          </div>
        </div>

        {/* Console output body */}
        <div className="p-4 font-mono text-xs min-h-[300px] max-h-[500px] overflow-y-auto leading-relaxed select-text space-y-1">
          {outputLogs.length === 0 ? (
            <div className="text-neutral-500 py-12 text-center space-y-2">
              <Code2 className="w-8 h-8 mx-auto opacity-40 mb-2" />
              <p>Consola lista para recibir tareas.</p>
              <p className="text-[11px] text-neutral-600">
                Selecciona una tarea rápida arriba o escribe un prompt para iniciar la ejecución con OpenCode.
              </p>
            </div>
          ) : (
            outputLogs.map((chunk, idx) => (
              <pre
                key={idx}
                className="whitespace-pre-wrap break-all text-neutral-200 font-mono text-xs leading-relaxed"
              >
                {chunk}
              </pre>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* Previous Sessions History */}
      {history.length > 0 && (
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 bg-white dark:bg-neutral-900">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-500" />
            <span>Historial de Sesiones Recientes</span>
          </h2>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {history.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs gap-4">
                <div className="truncate flex-1">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 block truncate">
                    {item.prompt}
                  </span>
                  <div className="text-[11px] text-neutral-500 flex items-center gap-2 mt-0.5">
                    <span>{item.timestamp}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{item.model}</span>
                    <span aria-hidden="true">·</span>
                    <span className="uppercase">{item.agent}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPrompt(item.prompt);
                    handleLaunchPrompt(item.prompt, item.agent as any);
                  }}
                  className="px-2.5 py-1 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded font-medium transition-colors"
                >
                  Re-ejecutar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
