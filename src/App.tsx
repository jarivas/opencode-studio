/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';
import { ConfigDrawer } from './components/ConfigDrawer';
import { WorkspaceExplorer } from './components/WorkspaceExplorer';
import { OpenCodeConfig, OpenCodeStatus, ChatMessage } from './types';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [viewMode, setViewMode] = useState<'chat' | 'files'>('chat');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsedDesktop, setIsCollapsedDesktop] = useState(false);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [status, setStatus] = useState<OpenCodeStatus | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Projects State
  const [projectsList, setProjectsList] = useState<{ id: string; name: string; previewBaseUrl: string }[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('default');

  const [config, setConfig] = useState<OpenCodeConfig>({
    id: 'default',
    name: 'Proyecto Principal',
    previewBaseUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    workspaceDir: '/app/applet',
    model: 'google/gemini-3.8-flash',
    agent: 'build',
    autoApprove: true,
    thinking: true,
    logLevel: 'info',
    standalone: true,
    customBaseUrl: '',
    systemPrompt: '',
    keys: {
      geminiKey: '',
      anthropicKey: '',
      openaiKey: '',
      deepseekKey: '',
      groqKey: '',
      openrouterKey: '',
    },
  });

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStreamingText, setCurrentStreamingText] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.projectsList) {
          setProjectsList(data.projectsList);
        }
      }
    } catch (e) {
      console.error('Error al obtener estado de OpenCode:', e);
    }
  };

  // Fetch projects and current active configuration
  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setActiveProjectId(data.activeProjectId);
        if (data.projects) {
          setProjectsList(
            data.projects.map((p: any) => ({
              id: p.id,
              name: p.name,
              previewBaseUrl: p.previewBaseUrl,
            }))
          );

          const active = data.projects.find((p: any) => p.id === data.activeProjectId) || data.projects[0];
          if (active) {
            setConfig({
              ...active,
              projectsJsonContent: data.projectsJsonContent,
            });
          }
        }
      }
    } catch (e) {
      console.error('Error al cargar proyectos en JSON:', e);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchProjects();
  }, []);

  // Switch active project
  const handleSwitchProject = async (projectId: string) => {
    try {
      const res = await fetch('/api/projects/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveProjectId(projectId);
        if (data.activeProject) {
          setConfig((prev) => ({
            ...prev,
            ...data.activeProject,
          }));
        }
        showToast(data.message || `Cambiado a proyecto: ${projectId}`);
        fetchProjects();
      }
    } catch (e: any) {
      showToast(`Error al cambiar de proyecto: ${e.message}`, 'error');
    }
  };

  // Create new project
  const handleCreateProject = async (name: string, previewBaseUrl?: string) => {
    try {
      const res = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          previewBaseUrl:
            previewBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
          model: config.model,
          agent: config.agent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Proyecto "${name}" creado exitosamente`);
        await fetchProjects();
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast(`Error al crear proyecto: ${e.message}`, 'error');
      throw e;
    }
  };

  // Delete project
  const handleDeleteProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Proyecto eliminado del JSON');
        await fetchProjects();
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast(`Error al eliminar: ${e.message}`, 'error');
    }
  };

  // Save config handler - alters opencode.projects.json
  const handleSaveConfig = async (newConfig: Partial<OpenCodeConfig> & { apiKeys?: any; projectName?: string }) => {
    try {
      const res = await fetch('/api/projects/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeProjectId,
          name: newConfig.projectName || config.name,
          previewBaseUrl: newConfig.previewBaseUrl !== undefined ? newConfig.previewBaseUrl : config.previewBaseUrl,
          model: newConfig.model || config.model,
          agent: newConfig.agent || config.agent,
          autoApprove: newConfig.autoApprove !== undefined ? newConfig.autoApprove : config.autoApprove,
          thinking: newConfig.thinking !== undefined ? newConfig.thinking : config.thinking,
          systemPrompt: newConfig.systemPrompt !== undefined ? newConfig.systemPrompt : config.systemPrompt,
          keys: newConfig.apiKeys || config.keys,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Configuración guardada en opencode.projects.json');
        await fetchProjects();
        await fetchStatus();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showToast(`Error al guardar: ${err.message}`, 'error');
      throw err;
    }
  };

  // Test API key handler
  const handleTestKey = async (provider: string, key: string) => {
    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key }),
      });
      const data = await res.json();
      if (data.success) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || data.message || 'Error en la conexión' };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Error en la solicitud' };
    }
  };

  // Run Prompt / Chat stream
  const handleRunPrompt = async (promptText: string, agentOverride?: 'build' | 'plan') => {
    if (!promptText.trim() || isRunning) return;

    const chosenAgent = agentOverride || config.agent;
    const userMsgId = 'user_' + Date.now();
    const assistantMsgId = 'assistant_' + (Date.now() + 1);

    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsRunning(true);
    setCurrentStreamingText('');

    const runId = 'chat_' + Date.now();
    setActiveRunId(runId);

    setTerminalLogs((prev) => [
      ...prev,
      `\n[${new Date().toLocaleTimeString()}] [${config.name}] > opencode run --model ${config.model} --agent ${chosenAgent} "${promptText}"`,
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          model: config.model,
          agent: chosenAgent,
          autoApprove: config.autoApprove ?? true,
          thinking: config.thinking ?? true,
          standalone: config.standalone ?? true,
        }),
      });

      if (!response.ok || !response.body) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Error HTTP ${response.status}`);
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
              if (data.type === 'token' && data.text) {
                accumulatedOutput += data.text;
                setCurrentStreamingText((prev) => prev + data.text);
                setTerminalLogs((prev) => [...prev, data.text]);
              } else if (data.type === 'done') {
                setTerminalLogs((prev) => [
                  ...prev,
                  `\n✔ Salida de OpenCode terminada con código: ${data.code}`,
                ]);
              } else if (data.type === 'error') {
                setTerminalLogs((prev) => [...prev, `\n✖ Error de OpenCode: ${data.message}`]);
              }
            } catch (e) {
              // ignore
            }
          }
        }
      }

      const finalAssistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: accumulatedOutput || 'Comando ejecutado exitosamente.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: config.model,
        agent: chosenAgent,
      };

      setMessages((prev) => [...prev, finalAssistantMsg]);
      setCurrentStreamingText('');
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          content: `Error al procesar la tarea: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model: config.model,
        },
      ]);
    } finally {
      setIsRunning(false);
      setActiveRunId(null);
    }
  };

  const handleStop = async () => {
    if (!activeRunId) return;
    try {
      await fetch(`/api/stop/${activeRunId}`, { method: 'POST' });
      setTerminalLogs((prev) => [...prev, '\n⚠ Proceso detenido por el usuario.']);
    } catch (e) {
      // ignore
    } finally {
      setIsRunning(false);
      setActiveRunId(null);
    }
  };

  const handleNewSession = () => {
    setMessages([]);
    setCurrentStreamingText('');
    showToast('Nueva sesión de chat iniciada');
  };

  return (
    <div className="h-screen w-screen flex bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans overflow-hidden">
      {/* Responsive Left Sidebar */}
      <Sidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsedDesktop={isCollapsedDesktop}
        onToggleCollapseDesktop={() => setIsCollapsedDesktop((prev) => !prev)}
        viewMode={viewMode}
        setViewMode={setViewMode}
        activeProject={config}
        projectsList={projectsList}
        onSwitchProject={handleSwitchProject}
        onCreateProject={handleCreateProject}
        onNewSession={handleNewSession}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        status={status}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Streamlined Header with Project Settings trigger */}
        <Header
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          activeProject={config}
          viewMode={viewMode}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Workspace Body: Full-width Chat or Workspace Explorer */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {viewMode === 'files' ? (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl mx-auto w-full">
              <WorkspaceExplorer onSendToStudio={() => setViewMode('chat')} />
            </div>
          ) : (
            <div className="flex-1 h-full overflow-hidden">
              <ChatInterface
                config={config}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onRunPrompt={handleRunPrompt}
                isRunning={isRunning}
                onStop={handleStop}
                messages={messages}
                currentStreamingText={currentStreamingText}
              />
            </div>
          )}
        </div>
      </div>

      {/* Individual Project Settings Modal */}
      <ConfigDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        status={status}
        onSaveConfig={handleSaveConfig}
        onTestKey={handleTestKey}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-xl border text-xs font-medium bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 ml-2 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
