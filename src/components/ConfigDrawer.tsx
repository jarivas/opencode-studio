import React, { useState, useEffect } from 'react';
import {
  X,
  Globe,
  Key,
  Folder,
  ExternalLink,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
  FileCode,
  Save,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Sparkles,
  GitBranch,
} from 'lucide-react';
import { OpenCodeConfig, OpenCodeStatus } from '../types';

interface ConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: OpenCodeConfig;
  status: OpenCodeStatus | null;
  onSaveConfig: (newConfig: Partial<OpenCodeConfig> & { apiKeys?: any; projectName?: string }) => Promise<void>;
  onTestKey: (provider: string, key: string) => Promise<{ success: boolean; message: string }>;
  onOpenGit?: () => void;
}

export const ConfigDrawer: React.FC<ConfigDrawerProps> = ({
  isOpen,
  onClose,
  config,
  status,
  onSaveConfig,
  onTestKey,
  onOpenGit,
}) => {
  if (!isOpen) return null;

  // Tabs: 1) General & Preview, 2) API Keys, 3) Git
  const [activeTab, setActiveTab] = useState<'general' | 'keys' | 'git'>('general');

  // Form values for this individual project
  const [projectName, setProjectName] = useState(config.name || 'Proyecto Principal');
  const [previewBaseUrl, setPreviewBaseUrl] = useState(config.previewBaseUrl || 'http://localhost:3000');
  const [model, setModel] = useState(config.model || 'google/gemini-2.5-flash');
  const [agent, setAgent] = useState<'build' | 'plan'>(config.agent || 'build');
  const [systemPrompt, setSystemPrompt] = useState(config.systemPrompt || '');

  // Advanced raw JSON view toggle
  const [showRawJson, setShowRawJson] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Keys state
  const [keys, setKeys] = useState({
    geminiKey: config.keys?.geminiKey || '',
    anthropicKey: config.keys?.anthropicKey || '',
    openaiKey: config.keys?.openaiKey || '',
    deepseekKey: config.keys?.deepseekKey || '',
    groqKey: config.keys?.groqKey || '',
    openrouterKey: config.keys?.openrouterKey || '',
  });

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Git state for this project
  const [gitUserName, setGitUserName] = useState(config.git?.userName || '');
  const [gitUserEmail, setGitUserEmail] = useState(config.git?.userEmail || '');
  const [gitRemoteUrl, setGitRemoteUrl] = useState(config.git?.remoteUrl || '');
  const [workspaceDir, setWorkspaceDir] = useState(config.workspaceDir || '');

  // Sync state whenever active project config changes
  useEffect(() => {
    setProjectName(config.name || 'Proyecto Principal');
    setPreviewBaseUrl(config.previewBaseUrl || 'http://localhost:3000');
    setModel(config.model || 'google/gemini-2.5-flash');
    setAgent(config.agent || 'build');
    setSystemPrompt(config.systemPrompt || '');
    setGitUserName(config.git?.userName || '');
    setGitUserEmail(config.git?.userEmail || '');
    setGitRemoteUrl(config.git?.remoteUrl || '');
    setWorkspaceDir(config.workspaceDir || '');
    setKeys({
      geminiKey: config.keys?.geminiKey || '',
      anthropicKey: config.keys?.anthropicKey || '',
      openaiKey: config.keys?.openaiKey || '',
      deepseekKey: config.keys?.deepseekKey || '',
      groqKey: config.keys?.groqKey || '',
      openrouterKey: config.keys?.openrouterKey || '',
    });
  }, [config]);

  const toggleShowKey = (provider: string) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleTestKey = async (provider: string) => {
    const keyVal = (keys as any)[`${provider}Key`];
    if (!keyVal) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: { success: false, message: 'Ingresa una clave antes de verificar' },
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
        projectName,
        previewBaseUrl,
        model,
        agent,
        systemPrompt,
        workspaceDir: workspaceDir || undefined,
        git: {
          userName: gitUserName,
          userEmail: gitUserEmail,
          remoteUrl: gitRemoteUrl,
        },
        apiKeys: keys,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyJson = () => {
    const projectJson = JSON.stringify(
      {
        id: config.id,
        name: projectName,
        previewBaseUrl,
        model,
        agent,
        systemPrompt,
      },
      null,
      2
    );
    navigator.clipboard.writeText(projectJson);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl flex flex-col border border-neutral-200 dark:border-neutral-800 max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header - Individual per project */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-amber-500 shrink-0">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Ajustes de {config.name || 'Proyecto'}
              </h2>
              <p className="text-[11px] text-neutral-500">
                Configuración individual guardada en <code className="font-mono text-neutral-700 dark:text-neutral-300">opencode.projects.json</code>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Cerrar ajustes"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-6 bg-neutral-50/30 dark:bg-neutral-900/30 gap-6">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'general'
                ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-500" />
            <span>Configuración y Vista Previa</span>
          </button>

          <button
            onClick={() => setActiveTab('keys')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'keys'
                ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Key className="w-4 h-4 text-amber-500" />
            <span>Claves de API</span>
          </button>

          <button
            onClick={() => setActiveTab('git')}
            className={`py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'git'
                ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <GitBranch className="w-4 h-4 text-amber-500" />
            <span>Git / Repositorio</span>
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* TAB 1: GENERAL & PREVIEW */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              
              {/* Project Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
                  Nombre de este Proyecto
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Ej: E-Commerce, Blog, API..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10"
                />
              </div>

              {/* Preview URL */}
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      URL de Vista Previa
                    </label>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Dirección a la que apunta el enlace de vista previa en el chat.
                    </p>
                  </div>
                  {previewBaseUrl && (
                    <a
                      href={previewBaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <span>Probar enlace</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="relative">
                  <Globe className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={previewBaseUrl}
                    onChange={(e) => setPreviewBaseUrl(e.target.value)}
                    placeholder="http://localhost:3000"
                    className="w-full text-xs font-mono pl-9 pr-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10"
                  />
                </div>

                {/* Quick suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-neutral-500 mr-1">Atajos:</span>
                  <button
                    type="button"
                    onClick={() => setPreviewBaseUrl('http://localhost:3000')}
                    className="px-2 py-1 text-[11px] font-mono rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                  >
                    http://localhost:3000
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewBaseUrl(window.location.origin)}
                    className="px-2 py-1 text-[11px] font-mono rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                  >
                    Origen actual ({window.location.port ? `:${window.location.port}` : 'web'})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewBaseUrl('http://localhost:5173')}
                    className="px-2 py-1 text-[11px] font-mono rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                  >
                    http://localhost:5173 (Vite)
                  </button>
                </div>
              </div>

              {/* AI Model selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Modelo de IA para este proyecto</span>
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10"
                >
                  <option value="google/gemini-2.5-flash">Google Gemini 2.5 Flash (Recomendado - Rápido)</option>
                  <option value="google/gemini-2.5-pro">Google Gemini 2.5 Pro (Razonamiento profundo)</option>
                  <option value="google/gemini-3-flash-preview">Google Gemini 3 Flash Preview</option>
                  <option value="anthropic/claude-3-7-sonnet">Anthropic Claude 3.7 Sonnet</option>
                  <option value="anthropic/claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet</option>
                  <option value="openai/gpt-4o">OpenAI GPT-4o</option>
                  <option value="deepseek/deepseek-r1">DeepSeek R1</option>
                </select>
              </div>

              {/* Agent Mode Cards */}
              <div>
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
                  Modo de Asistencia
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAgent('build')}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      agent === 'build'
                        ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800/80 shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-neutral-900 dark:text-white mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Constructor (Build)</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Genera, edita archivos y ejecuta comandos directamente.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAgent('plan')}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      agent === 'plan'
                        ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800/80 shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-neutral-900 dark:text-white mb-1">
                      <Layers className="w-3.5 h-3.5 text-blue-500" />
                      <span>Planificador (Plan)</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Solo lectura. Diseña y propone planes sin modificar archivos.
                    </p>
                  </button>
                </div>
              </div>

              {/* Custom instructions / prompt */}
              <div>
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
                  Instrucciones Personalizadas para este Proyecto (Opcional)
                </label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Ej: Utilizar siempre TypeScript estricto y Tailwind CSS..."
                  rows={2}
                  className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10 resize-none"
                />
              </div>

            </div>
          )}

          {/* TAB 2: API KEYS */}
          {activeTab === 'keys' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                  <span className="font-semibold">Clave de Google Gemini activa:</span> Proporcionada automáticamente por el entorno de AI Studio. Solo necesitas ingresar claves adicionales si deseas usar Claude o GPT-4.
                </div>
              </div>

              {/* Gemini Key */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 bg-white dark:bg-neutral-800/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    Google Gemini API Key
                  </label>
                  {status?.envKeys?.hasGemini && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Activa por entorno
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showKeys.gemini ? 'text' : 'password'}
                    value={keys.geminiKey}
                    onChange={(e) => setKeys({ ...keys, geminiKey: e.target.value })}
                    placeholder="AIzaSy... (o déjalo vacío para usar el entorno)"
                    className="w-full text-xs font-mono px-3 py-2.5 pr-10 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('gemini')}
                    className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    {showKeys.gemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {keys.geminiKey && (
                  <div className="pt-1 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleTestKey('gemini')}
                      disabled={testingKey === 'gemini'}
                      className="text-xs text-neutral-700 dark:text-neutral-300 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${testingKey === 'gemini' ? 'animate-spin' : ''}`} />
                      <span>{testingKey === 'gemini' ? 'Probando...' : 'Comprobar clave'}</span>
                    </button>
                  </div>
                )}
                {testResults.gemini && (
                  <div className={`p-2.5 rounded-lg text-xs ${testResults.gemini.success ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'}`}>
                    {testResults.gemini.message}
                  </div>
                )}
              </div>

              {/* Anthropic Key */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 bg-white dark:bg-neutral-800/30 space-y-2">
                <label className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
                  Anthropic API Key (Claude)
                </label>
                <div className="relative">
                  <input
                    type={showKeys.anthropic ? 'text' : 'password'}
                    value={keys.anthropicKey}
                    onChange={(e) => setKeys({ ...keys, anthropicKey: e.target.value })}
                    placeholder="sk-ant-..."
                    className="w-full text-xs font-mono px-3 py-2.5 pr-10 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('anthropic')}
                    className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    {showKeys.anthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* OpenAI Key */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 bg-white dark:bg-neutral-800/30 space-y-2">
                <label className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
                  OpenAI API Key (GPT-4o)
                </label>
                <div className="relative">
                  <input
                    type={showKeys.openai ? 'text' : 'password'}
                    value={keys.openaiKey}
                    onChange={(e) => setKeys({ ...keys, openaiKey: e.target.value })}
                    placeholder="sk-proj-..."
                    className="w-full text-xs font-mono px-3 py-2.5 pr-10 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('openai')}
                    className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    {showKeys.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ADVANCED COLLAPSIBLE: Raw JSON View of this project */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setShowRawJson(!showRawJson)}
              className="flex items-center justify-between w-full py-1 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" />
                <span>Ver JSON de este proyecto (Avanzado)</span>
              </span>
              {showRawJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showRawJson && (
              <div className="mt-3 space-y-2">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="text-[11px] px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedJson ? <Check className="w-3 h-3 text-emerald-500" /> : <FileCode className="w-3 h-3" />}
                    <span>{copiedJson ? 'Copiado' : 'Copiar JSON'}</span>
                  </button>
                </div>
                <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950 p-3 text-neutral-100 font-mono text-[11px] leading-relaxed max-h-40 overflow-y-auto">
                  <pre className="text-emerald-400 whitespace-pre-wrap">
                    {JSON.stringify(
                      {
                        id: config.id,
                        name: projectName,
                        previewBaseUrl,
                        model,
                        agent,
                        systemPrompt,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* TAB 3: GIT & VERSION CONTROL */}
          {activeTab === 'git' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <GitBranch className="w-4 h-4 text-amber-500" />
                    <span>Control de Versiones del Proyecto</span>
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Gestión independiente de commits, ramas y diffs para {projectName}.
                  </p>
                </div>

                {onOpenGit && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenGit();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors cursor-pointer shrink-0 shadow-2xs"
                  >
                    Abrir Gestor Git
                  </button>
                )}
              </div>

              {/* Workspace directory */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Directorio de Trabajo (Workspace)
                </label>
                <input
                  type="text"
                  value={workspaceDir}
                  onChange={(e) => setWorkspaceDir(e.target.value)}
                  placeholder="/app/applet"
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
                <p className="text-[11px] text-neutral-400">
                  Ruta donde se ejecutarán los comandos git y las operaciones de OpenCode para este proyecto.
                </p>
              </div>

              {/* Git User Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Nombre de Autor (user.name)
                </label>
                <input
                  type="text"
                  value={gitUserName}
                  onChange={(e) => setGitUserName(e.target.value)}
                  placeholder="OpenCode Developer"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              {/* Git User Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Correo Electrónico de Autor (user.email)
                </label>
                <input
                  type="email"
                  value={gitUserEmail}
                  onChange={(e) => setGitUserEmail(e.target.value)}
                  placeholder="developer@opencode.local"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>

              {/* Git Remote URL */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Repositorio Remoto (origin URL)
                </label>
                <input
                  type="text"
                  value={gitRemoteUrl}
                  onChange={(e) => setGitRemoteUrl(e.target.value)}
                  placeholder="https://github.com/usuario/repositorio.git"
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
          <div>
            {saveSuccess && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Ajustes guardados para {projectName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                saveSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100'
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
