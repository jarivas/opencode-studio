import React, { useState } from 'react';
import { Search, Sparkles, Check, Cpu, CheckCircle2 } from 'lucide-react';
import { ModelCategory } from '../types';

interface ModelsCatalogProps {
  modelsData: ModelCategory | null;
  activeModel: string;
  onSelectModel: (modelName: string) => void;
}

export const ModelsCatalog: React.FC<ModelsCatalogProps> = ({
  modelsData,
  activeModel,
  onSelectModel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');

  const providerTags = [
    { id: 'all', label: 'Todos los Proveedores' },
    { id: 'google', label: 'Google Gemini' },
    { id: 'anthropic', label: 'Anthropic Claude' },
    { id: 'openai', label: 'OpenAI' },
    { id: 'deepseek', label: 'DeepSeek' },
    { id: 'free', label: 'Comunidad Gratuita' },
  ];

  // Metadata enrichment for models
  const modelMetadata: Record<string, { desc: string; context: string; speed: string }> = {
    'google/gemini-2.5-flash': {
      desc: 'Modelo insignia de Google de latencia ultra baja y alta precisión en código y razonamiento multimodal.',
      context: '1M tokens',
      speed: 'Ultra rápido',
    },
    'google/gemini-2.5-pro': {
      desc: 'El modelo más capaz de Google para tareas complejas de ingeniería de software, arquitectura y matemáticas.',
      context: '2M tokens',
      speed: 'Balanceado',
    },
    'google/gemini-3-flash-preview': {
      desc: 'Vista previa de la arquitectura Gemini 3 optimizada para agentes autónomos y ejecución de herramientas.',
      context: '1M tokens',
      speed: 'Muy rápido',
    },
    'anthropic/claude-3-7-sonnet': {
      desc: 'Modelo insignia de Anthropic con capacidad híbrida de pensamiento continuo y refactorización masiva.',
      context: '200k tokens',
      speed: 'Rápido',
    },
    'anthropic/claude-3-5-sonnet': {
      desc: 'El estándar de la industria en codificación autónoma, edición de archivos precisos y depuración.',
      context: '200k tokens',
      speed: 'Rápido',
    },
    'openai/gpt-4o': {
      desc: 'Modelo multimodal omnidireccional insignia de OpenAI con soporte completo de análisis de código.',
      context: '128k tokens',
      speed: 'Rápido',
    },
    'openai/o3-mini': {
      desc: 'Modelo de razonamiento avanzado y resolución matemática de problemas de OpenAI.',
      context: '128k tokens',
      speed: 'Reflexivo',
    },
    'deepseek/deepseek-r1': {
      desc: 'Modelo de razonamiento abierto de DeepSeek para lógica densa y diseño algorítmico.',
      context: '64k tokens',
      speed: 'Moderado',
    },
    'opencode/deepseek-v4.1-flash-free': {
      desc: 'Inferencia libre provista por la comunidad de OpenCode para pruebas rápidas sin requerir API key.',
      context: '32k tokens',
      speed: 'Gratuito',
    },
  };

  // Compile full model list
  const fullList: { id: string; provider: string }[] = [];

  if (modelsData) {
    modelsData.google?.forEach((m) => fullList.push({ id: m, provider: 'google' }));
    modelsData.anthropic?.forEach((m) => fullList.push({ id: m, provider: 'anthropic' }));
    modelsData.openai?.forEach((m) => fullList.push({ id: m, provider: 'openai' }));
    modelsData.deepseek?.forEach((m) => fullList.push({ id: m, provider: 'deepseek' }));
    modelsData.free?.forEach((m) => fullList.push({ id: m, provider: 'free' }));
  }

  // Deduplicate and filter
  const uniqueModels = Array.from(new Map(fullList.map((m) => [m.id, m])).values());

  const filtered = uniqueModels.filter((item) => {
    const matchesSearch = item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvider = filterProvider === 'all' || item.provider === filterProvider;
    return matchesSearch && matchesProvider;
  });

  return (
    <div className="space-y-6 pb-16">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <Cpu className="w-5 h-5" />
          <span>Catálogo de Modelos & Proveedores de OpenCode</span>
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          OpenCode admite más de 75 modelos de IA comerciales y comunitarios. Selecciona tu modelo favorito para activarlo como predeterminado.
        </p>

        {/* Filter & Search Bar */}
        <div className="mt-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Provider Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {providerTags.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterProvider(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  filterProvider === tab.id
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar modelo..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const isSelected = activeModel === item.id;
          const meta = modelMetadata[item.id] || {
            desc: `Modelo provisto por la integración con ${item.provider}. Totalmente compatible con la CLI de OpenCode.`,
            context: 'Estándar',
            speed: 'Alta velocidad',
          };

          return (
            <div
              key={item.id}
              className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-neutral-900 dark:border-white bg-white dark:bg-neutral-900 shadow-xs ring-1 ring-neutral-900 dark:ring-white'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400 dark:hover:border-neutral-600'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100 break-all">
                    {item.id}
                  </span>
                  {isSelected && (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Activo
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-500 leading-relaxed mb-4">
                  {meta.desc}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono mb-3">
                  <span>Ventana: {meta.context}</span>
                  <span aria-hidden="true">·</span>
                  <span>{meta.speed}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectModel(item.id)}
                  disabled={isSelected}
                  className={`w-full py-2 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 cursor-default'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Modelo Seleccionado</span>
                    </>
                  ) : (
                    <span>Establecer como Predeterminado</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-neutral-500 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <p className="text-sm font-medium">No se encontraron modelos con ese criterio de búsqueda.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterProvider('all');
            }}
            className="mt-2 text-xs text-neutral-900 dark:text-white underline cursor-pointer"
          >
            Restablecer filtros
          </button>
        </div>
      )}
    </div>
  );
};
