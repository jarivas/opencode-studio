import React, { useState } from 'react';
import {
  Key,
  Shield,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Sparkles,
  Bot,
  FileCode,
  Server,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { OpenCodeConfig, OpenCodeStatus } from '../types';

interface ControlPanelProps {
  config: OpenCodeConfig;
  status: OpenCodeStatus | null;
  onSaveConfig: (newConfig: Partial<OpenCodeConfig> & { apiKeys?: any }) => Promise<void>;
  onTestKey: (provider: string, key: string) => Promise<{ success: boolean; message: string }>;
  onRefreshStatus: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  status,
  onSaveConfig,
  onTestKey,
  onRefreshStatus,
}) => {
  // Local form state
  const [model, setModel] = useState(config.model || 'google/gemini-2.5-flash');
  const [agent, setAgent] = useState<'build' | 'plan'>(config.agent || 'build');
  const [autoApprove, setAutoApprove] = useState(config.autoApprove ?? true);
  const [thinking, setThinking] = useState(config.thinking ?? true);
  const [logLevel, setLogLevel] = useState(config.logLevel || 'info');
  const [standalone, setStandalone] = useState(config.standalone ?? true);
  const [customBaseUrl, setCustomBaseUrl] = useState(config.customBaseUrl || '');
  const [systemPrompt, setSystemPrompt] = useState(config.systemPrompt || '');

  // API Keys state
  const [keys, setKeys] = useState({
    geminiKey: config.keys.geminiKey || '',
    anthropicKey: config.keys.anthropicKey || '',
    openaiKey: config.keys.openaiKey || '',
    deepseekKey: config.keys.deepseekKey || '',
    groqKey: config.keys.groqKey || '',
    openrouterKey: config.keys.openrouterKey || '',
  });

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<'keys' | 'agent' | 'rules' | 'advanced'>('keys');

  const toggleShowKey = (provider: string) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleTestKey = async (provider: string) => {
    const keyVal = (keys as any)[`${provider}Key`];
    if (!keyVal) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: { success: false, message: 'Por favor introduce una clave para probar' },
      }));
      return;
    }

    setTestingKey(provider);
    try {
      const res = await onTestKey(provider, keyVal);
      setTestResults((prev) => ({ ...prev, [provider]: res }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: { success: false, message: err.message || 'Error de conexión' },
      }));
    } finally {
      setTestingKey(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveConfig({
        model,
        agent,
        autoApprove,
        thinking,
        logLevel,
        standalone,
        customBaseUrl,
        systemPrompt,
        apiKeys: keys,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const applyTemplate = (templatePrompt: string) => {
    setSystemPrompt(templatePrompt);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Overview Metadata Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Panel de Control de OpenCode
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              <span>OpenCode CLI {status?.cli?.version || 'Detectando...'}</span>
              <span aria-hidden="true">·</span>
              <span>Ruta: {status?.cli?.path || '/usr/local/bin/opencode'}</span>
              <span aria-hidden="true">·</span>
              <span>Configuración: ~/.config/opencode/opencode.json</span>
              <span aria-hidden="true">·</span>
              <span>Workspace: {status?.workspaceDir || '/app/applet'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRefreshStatus}
              className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-xs flex items-center gap-1.5"
              title="Refrescar estado de OpenCode"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Recargar</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-4 py-2 text-xs font-semibold rounded-lg text-white transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
                saveSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
              }`}
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Parámetros'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs for Configuration */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs">
          <button
            onClick={() => setActiveSection('keys')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeSection === 'keys'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            Claves API & Proveedores
          </button>
          <button
            onClick={() => setActiveSection('agent')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeSection === 'agent'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            Modo de Agente & Ejecución
          </button>
          <button
            onClick={() => setActiveSection('rules')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeSection === 'rules'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            Reglas del Proyecto (AGENTS.md)
          </button>
          <button
            onClick={() => setActiveSection('advanced')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeSection === 'advanced'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            Configuración JSON
          </button>
        </div>
      </div>

      {/* SECTION 1: API KEYS & PROVIDERS */}
      {activeSection === 'keys' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Proveedores de Modelos & Claves API
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                OpenCode utiliza estas claves para comunicarse con los modelos de IA. Se guardan en variables de entorno seguras del servidor y en opencode.json.
              </p>
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {status?.envKeys?.hasGemini ? 'Gemini conectado por entorno' : 'Configura al menos un proveedor'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Google Gemini Card */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 bg-white dark:bg-neutral-900">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                    G
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      Google Gemini
                    </h3>
                    <span className="text-xs text-neutral-500">Gemini 2.5 Flash, 2.5 Pro, 3 Flash</span>
                  </div>
                </div>
                {status?.envKeys?.hasGemini && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Activa
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={showKeys.gemini ? 'text' : 'password'}
                    value={keys.geminiKey}
                    onChange={(e) => setKeys({ ...keys, geminiKey: e.target.value })}
                    placeholder="AIzaSy... o detectada automáticamente"
                    className="w-full text-xs font-mono px-3 py-2.5 pr-10 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('gemini')}
                    className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    {showKeys.gemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleTestKey('gemini')}
                    disabled={testingKey === 'gemini'}
                    className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white font-medium flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${testingKey === 'gemini' ? 'animate-spin' : ''}`} />
                    <span>{testingKey === 'gemini' ? 'Verificando...' : 'Probar Conexión'}</span>
                  </button>

                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300 underline"
                  >
                    Obtener API Key
                  </a>
                </div>

                {testResults.gemini && (
                  <div
                    className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                      testResults.gemini.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {testResults.gemini.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    )}
                    <span>{testResults.gemini.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Anthropic Claude Card */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 bg-white dark:bg-neutral-900">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                    A
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      Anthropic Claude
                    </h3>
                    <span className="text-xs text-neutral-500">Claude 3.7 Sonnet, 3.5 Sonnet, Haiku</span>
                  </div>
                </div>
                {status?.envKeys?.hasAnthropic && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Activa
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={showKeys.anthropic ? 'text' : 'password'}
                    value={keys.anthropicKey}
                    onChange={(e) => setKeys({ ...keys, anthropicKey: e.target.value })}
                    placeholder="sk-ant-api03-..."
                    className="w-full text-xs font-mono px-3 py-2.5 pr-10 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('anthropic')}
                    className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    {showKeys.anthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleTestKey('anthropic')}
                    disabled={testingKey === 'anthropic'}
                    className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white font-medium flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${testingKey === 'anthropic' ? 'animate-spin' : ''}`} />
                    <span>{testingKey === 'anthropic' ? 'Verificando...' : 'Probar Conexión'}</span>
                  </button>

                  <a
                    href="https://console.anthropic.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300 underline"
                  >
                    Consola Anthropic
                  </a>
                </div>

                {testResults.anthropic && (
                  <div
                    className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                      testResults.anthropic.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {testResults.anthropic.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    )}
                    <span>{testResults.anthropic.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* OpenAI Card */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 bg-white dark:bg-neutral-900">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                    O
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      OpenAI
                    </h3>
                    <span className="text-xs text-neutral-500">GPT-4o, GPT-4o-mini, o3-mini</span>
                  </div>
                </div>
                {status?.envKeys?.hasOpenAI && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Activa
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={showKeys.openai ? 'text' : 'password'}
                    value={keys.openaiKey}
                    onChange={(e) => setKeys({ ...keys, openaiKey: e.target.value })}
                    placeholder="sk-proj-..."
                    className="w-full text-xs font-mono px-3 py-2.5 pr-10 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('openai')}
                    className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    {showKeys.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleTestKey('openai')}
                    disabled={testingKey === 'openai'}
                    className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white font-medium flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${testingKey === 'openai' ? 'animate-spin' : ''}`} />
                    <span>{testingKey === 'openai' ? 'Verificando...' : 'Probar Conexión'}</span>
                  </button>

                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300 underline"
                  >
                    Plataforma OpenAI
                  </a>
                </div>

                {testResults.openai && (
                  <div
                    className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                      testResults.openai.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {testResults.openai.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    )}
                    <span>{testResults.openai.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* DeepSeek Card */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 bg-white dark:bg-neutral-900">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                    D
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      DeepSeek
                    </h3>
                    <span className="text-xs text-neutral-500">DeepSeek-R1 (Razonamiento), V3</span>
                  </div>
                </div>
                {status?.envKeys?.hasDeepSeek && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Activa
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={showKeys.deepseek ? 'text' : 'password'}
                    value={keys.deepseekKey}
                    onChange={(e) => setKeys({ ...keys, deepseekKey: e.target.value })}
                    placeholder="sk-..."
                    className="w-full text-xs font-mono px-3 py-2.5 pr-10 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('deepseek')}
                    className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    {showKeys.deepseek ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleTestKey('deepseek')}
                    disabled={testingKey === 'deepseek'}
                    className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white font-medium flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${testingKey === 'deepseek' ? 'animate-spin' : ''}`} />
                    <span>{testingKey === 'deepseek' ? 'Verificando...' : 'Probar Conexión'}</span>
                  </button>

                  <a
                    href="https://platform.deepseek.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300 underline"
                  >
                    DeepSeek Platform
                  </a>
                </div>
              </div>
            </div>

            {/* Groq / OpenRouter / Custom */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 bg-white dark:bg-neutral-900 md:col-span-2">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                Endpoints Personalizados, Groq & OpenRouter
              </h3>
              <p className="text-xs text-neutral-500 mb-4">
                Configura inferencia ultra rápida con Groq o accede a más de 100 modelos a través de OpenRouter o servidores locales compatibles con OpenAI.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Groq API Key (Llama 3.3 70B a 500 tokens/s)
                  </label>
                  <input
                    type="password"
                    value={keys.groqKey}
                    onChange={(e) => setKeys({ ...keys, groqKey: e.target.value })}
                    placeholder="gsk_..."
                    className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    OpenRouter API Key
                  </label>
                  <input
                    type="password"
                    value={keys.openrouterKey}
                    onChange={(e) => setKeys({ ...keys, openrouterKey: e.target.value })}
                    placeholder="sk-or-v1-..."
                    className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    URL Base Personalizada (Ollama, vLLM, LMStudio o Proxy corporativo)
                  </label>
                  <input
                    type="text"
                    value={customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    placeholder="http://localhost:11434/v1 o https://api.custom-proxy.internal/v1"
                    className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: AGENT SETTINGS & EXECUTION PARAMETERS */}
      {activeSection === 'agent' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Parámetros de Ejecución del Agente
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Controla el comportamiento de OpenCode: permisos automáticos, arquitectura de doble agente (Build vs Plan), razonamiento profundo y verbosidad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Modelo Predeterminado */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 bg-white dark:bg-neutral-900">
              <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                Modelo Predeterminado
              </label>
              <p className="text-xs text-neutral-500 mb-3">
                Modelo utilizado por omisión al lanzar comandos o sesiones interactivas con OpenCode.
              </p>

              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden"
              >
                <optgroup label="Google Gemini">
                  <option value="google/gemini-2.5-flash">google/gemini-2.5-flash (Recomendado: balance perfecto)</option>
                  <option value="google/gemini-2.5-pro">google/gemini-2.5-pro (Máxima capacidad de razonamiento)</option>
                  <option value="google/gemini-3-flash-preview">google/gemini-3-flash-preview (Última generación)</option>
                  <option value="google/gemini-3.8-flash">google/gemini-3.8-flash</option>
                  <option value="google/gemini-2.5-flash-lite">google/gemini-2.5-flash-lite (Ultra rápido)</option>
                </optgroup>
                <optgroup label="Anthropic">
                  <option value="anthropic/claude-3-7-sonnet">anthropic/claude-3-7-sonnet (Híbrido razonamiento)</option>
                  <option value="anthropic/claude-3-5-sonnet">anthropic/claude-3-5-sonnet (Referente en código)</option>
                  <option value="anthropic/claude-3-5-haiku">anthropic/claude-3-5-haiku</option>
                </optgroup>
                <optgroup label="OpenAI">
                  <option value="openai/gpt-4o">openai/gpt-4o</option>
                  <option value="openai/o3-mini">openai/o3-mini (Razonamiento profundo)</option>
                  <option value="openai/gpt-4o-mini">openai/gpt-4o-mini</option>
                </optgroup>
                <optgroup label="DeepSeek">
                  <option value="deepseek/deepseek-r1">deepseek/deepseek-r1</option>
                  <option value="deepseek/deepseek-v3">deepseek/deepseek-v3</option>
                </optgroup>
                <optgroup label="OpenCode Free Community">
                  <option value="opencode/deepseek-v4.1-flash-free">opencode/deepseek-v4.1-flash-free</option>
                  <option value="opencode/beam-free">opencode/beam-free</option>
                  <option value="opencode/flint-40b-free">opencode/flint-40b-free</option>
                </optgroup>
              </select>
            </div>

            {/* Modo de Agente: Build vs Plan */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 bg-white dark:bg-neutral-900">
              <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                Arquitectura de Agente
              </label>
              <p className="text-xs text-neutral-500 mb-3">
                Selecciona la modalidad operativa del agente según tu objetivo.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAgent('build')}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    agent === 'build'
                      ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Bot className="w-4 h-4 text-neutral-900 dark:text-white" />
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">Build Agent</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Lectura y escritura completa. Crea archivos, refactoriza y ejecuta comandos bash.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAgent('plan')}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    agent === 'plan'
                      ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-neutral-900 dark:text-white" />
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">Plan Agent</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Modo solo lectura. Analiza arquitectura, elabora planes de refactor y no modifica código.
                  </p>
                </button>
              </div>
            </div>

            {/* Toggles & Permissions */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 bg-white dark:bg-neutral-900 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Permisos & Razonamiento
              </h3>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={(e) => setAutoApprove(e.target.checked)}
                    className="mt-0.5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 dark:border-neutral-700"
                  />
                  <div>
                    <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 block">
                      Auto-aprobar Permisos (--auto)
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Permite que OpenCode aplique cambios de archivos y comandos sin requerir confirmación interactiva en cada paso.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={thinking}
                    onChange={(e) => setThinking(e.target.checked)}
                    className="mt-0.5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 dark:border-neutral-700"
                  />
                  <div>
                    <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 block">
                      Bloques de Pensamiento (--thinking)
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Muestra la cadena de razonamiento y deliberación interna del modelo antes de ejecutar acciones.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={standalone}
                    onChange={(e) => setStandalone(e.target.checked)}
                    className="mt-0.5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 dark:border-neutral-700"
                  />
                  <div>
                    <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 block">
                      Modo Aislado (--standalone)
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Ejecuta en un proceso privado con entorno limpio en lugar del daemon de fondo persistente.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Log Level & Runtime Options */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 bg-white dark:bg-neutral-900 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Nivel de Registro & Diagnóstico
              </h3>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Nivel de Logs (--log-level)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['info', 'debug', 'warn', 'error'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLogLevel(lvl)}
                      className={`py-1.5 text-xs font-mono uppercase rounded-md border text-center transition-colors cursor-pointer ${
                        logLevel === lvl
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold border-transparent'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <span className="text-xs text-neutral-500 leading-relaxed block">
                  El servidor de OpenCode almacena las sesiones y el historial de ejecución en <code className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">~/.local/share/opencode</code>.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: PROJECT RULES & SYSTEM PROMPT (AGENTS.MD) */}
      {activeSection === 'rules' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Reglas del Proyecto (AGENTS.md)
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Instrucciones que OpenCode carga automáticamente en cada interacción para mantener el estilo, las convenciones y los requisitos de calidad de tu equipo.
              </p>
            </div>

            {/* Template selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-neutral-500 mr-1">Plantillas:</span>
              <button
                type="button"
                onClick={() =>
                  applyTemplate(
                    `# Reglas de Proyecto - TypeScript Estricto\n\n1. Código en TypeScript con tipado estricto (noAny).\n2. Estilo funcional y hooks en React.\n3. Tailwind CSS para todo el estilado.\n4. Priorizar código legible, sin dependencias innecesarias.\n5. Siempre verificar compilación antes de terminar.`
                  )
                }
                className="px-2 py-1 text-[11px] rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 cursor-pointer"
              >
                TypeScript Estricto
              </button>
              <button
                type="button"
                onClick={() =>
                  applyTemplate(
                    `# Reglas de Calidad y Pruebas\n\n1. Diseñar con arquitectura modular y principios SOLID.\n2. Incluir pruebas unitarias para lógica compleja.\n3. Documentar contratos de API y tipos de datos.\n4. Manejar estados de carga, error y vacío en la UI.`
                  )
                }
                className="px-2 py-1 text-[11px] rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 cursor-pointer"
              >
                Arquitectura & Tests
              </button>
            </div>
          </div>

          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900">
            <div className="bg-neutral-50 dark:bg-neutral-800/60 px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-600 dark:text-neutral-300">
                <FileCode className="w-4 h-4 text-neutral-500" />
                <span>AGENTS.md (Workspace Root)</span>
              </div>
              <span className="text-[11px] text-neutral-400">
                {systemPrompt.length} caracteres
              </span>
            </div>

            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="# Escribe aquí las instrucciones personalizadas para OpenCode...&#10;&#10;- Usa TypeScript estricto&#10;- No utilices paquetes sin preguntar&#10;- Escribe comentarios explicativos en español"
              rows={12}
              className="w-full p-4 text-xs font-mono bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-hidden resize-y leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* SECTION 4: ADVANCED JSON CONFIG */}
      {activeSection === 'advanced' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Configuración Cruda (~/.config/opencode/opencode.json)
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Representación JSON directa que OpenCode CLI lee al iniciar.
              </p>
            </div>
          </div>

          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-neutral-950 text-neutral-100">
            <div className="px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-xs font-mono">
              <span>opencode.json</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    JSON.stringify(
                      {
                        model,
                        agent,
                        autoApprove,
                        thinking,
                        logLevel,
                        standalone,
                        customBaseUrl,
                        systemPrompt,
                      },
                      null,
                      2
                    )
                  );
                }}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                Copiar JSON
              </button>
            </div>
            <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed text-emerald-400">
              {JSON.stringify(
                {
                  model,
                  agent,
                  autoApprove,
                  thinking,
                  logLevel,
                  standalone,
                  customBaseUrl,
                  systemPrompt: systemPrompt ? systemPrompt.slice(0, 100) + '...' : '',
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
