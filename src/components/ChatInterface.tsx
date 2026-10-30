import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Bot,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { ChatMessage, OpenCodeConfig } from '../types';

interface ChatInterfaceProps {
  config: OpenCodeConfig;
  onOpenSettings: () => void;
  onRunPrompt: (prompt: string, agentOverride?: 'build' | 'plan') => Promise<void>;
  isRunning: boolean;
  onStop: () => void;
  messages: ChatMessage[];
  currentStreamingText: string;
}

// Clean ANSI sequences
function cleanAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  config,
  onRunPrompt,
  isRunning,
  onStop,
  messages,
  currentStreamingText,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openThinking, setOpenThinking] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const previewUrl = config.previewBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStreamingText]);

  // Handle textarea enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || isRunning) return;
    const text = inputText;
    setInputText('');
    onRunPrompt(text);
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleThinking = (id: string) => {
    setOpenThinking((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 w-full overflow-hidden">
      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-5xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 py-12 text-neutral-400 dark:text-neutral-500">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
              <Bot className="w-6 h-6 text-neutral-600 dark:text-neutral-300" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
              {config.name}
            </h3>
            <p className="text-xs max-w-md mb-4 text-neutral-500 dark:text-neutral-400">
              Escribe cualquier petición para que OpenCode modifique o cree archivos en el proyecto.
            </p>

            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <Globe className="w-4 h-4 text-blue-500" />
              <span>Ver vista previa ({previewUrl})</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
            </a>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {/* Role badge */}
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-neutral-400 font-mono">
                {msg.role === 'user' ? (
                  <>
                    <span>Tú</span>
                    <span aria-hidden="true">·</span>
                    <span>{msg.timestamp}</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-3 h-3 text-neutral-700 dark:text-neutral-300" />
                    <span>OpenCode</span>
                    <span aria-hidden="true">·</span>
                    <span>{msg.model || config.model}</span>
                    <span aria-hidden="true">·</span>
                    <span>{msg.timestamp}</span>
                  </>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-2xs ${
                  msg.role === 'user'
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-tr-xs'
                    : 'bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-tl-xs'
                }`}
              >
                {/* Thinking process if available */}
                {msg.thinking && (
                  <div className="mb-3 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-white/50 dark:bg-neutral-900/50">
                    <button
                      onClick={() => toggleThinking(msg.id)}
                      className="w-full px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 bg-neutral-100/50 dark:bg-neutral-800/50 cursor-pointer"
                    >
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Razonamiento del Agente</span>
                      </span>
                      {openThinking[msg.id] ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>
                    {openThinking[msg.id] && (
                      <div className="p-3 text-[11px] font-mono text-neutral-600 dark:text-neutral-300 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {msg.thinking}
                      </div>
                    )}
                  </div>
                )}

                {/* Content body */}
                <div className="whitespace-pre-wrap break-words font-sans selection:bg-neutral-300 dark:selection:bg-neutral-700">
                  {cleanAnsi(msg.content)}
                </div>

                {/* Copy button */}
                <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-end">
                  <button
                    onClick={() => copyMessage(msg.id, msg.content)}
                    className="text-[10px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar respuesta</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Live Streaming Chunk */}
        {isRunning && currentStreamingText && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-neutral-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>OpenCode procesando...</span>
            </div>
            <div className="max-w-[92%] sm:max-w-[85%] rounded-2xl rounded-tl-xs p-4 text-xs leading-relaxed bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono whitespace-pre-wrap break-words">
              {cleanAnsi(currentStreamingText)}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input box & Execution Bar */}
      <div className="p-3 sm:p-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="max-w-5xl mx-auto w-full">
          <div className="relative border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800/90 shadow-xs focus-within:ring-1 focus-within:ring-neutral-900 dark:focus-within:ring-white">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe una instrucción para OpenCode... (Enter para enviar, Shift+Enter para nueva línea)"
              rows={2}
              disabled={isRunning}
              className="w-full p-3 text-xs bg-transparent text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden resize-none leading-relaxed"
            />

            <div className="px-3 pb-2 pt-1 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[11px] text-neutral-400">
                <span className="hidden sm:inline">Enter para enviar</span>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors underline cursor-pointer"
                >
                  <Globe className="w-3 h-3 text-blue-500" />
                  <span>Vista previa ↗</span>
                </a>
              </div>

              <div className="flex items-center gap-2">
                {isRunning ? (
                  <button
                    type="button"
                    onClick={onStop}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Detener</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                      inputText.trim()
                        ? 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-3 h-3" />
                    <span>Enviar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
