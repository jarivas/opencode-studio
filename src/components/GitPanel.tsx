import React, { useState, useEffect, useCallback } from 'react';
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  RefreshCw,
  Plus,
  Check,
  CheckCircle2,
  AlertCircle,
  FileCode,
  RotateCcw,
  Copy,
  Folder,
  Sliders,
  History,
  FileDiff,
  Globe,
  User,
  Mail,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { ProjectConfig, GitStatusInfo, GitCommitItem, GitFileItem } from '../types';

interface GitPanelProps {
  activeProject: ProjectConfig | null;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
  onOpenSettings?: () => void;
}

export const GitPanel: React.FC<GitPanelProps> = ({
  activeProject,
  onShowToast,
  onOpenSettings,
}) => {
  const [gitStatus, setGitStatus] = useState<GitStatusInfo | null>(null);
  const [commits, setCommits] = useState<GitCommitItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Active view tab in right column: 'diff' | 'history' | 'config'
  const [activeTab, setActiveTab] = useState<'diff' | 'history' | 'config'>('diff');

  // Selected file for diff view
  const [selectedFile, setSelectedFile] = useState<{ path: string; staged: boolean } | null>(null);
  const [diffContent, setDiffContent] = useState<string>('');
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);

  // Commit Form
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);

  // Branch creation inline
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [isBranchLoading, setIsBranchLoading] = useState(false);

  // Project Git user config
  const [gitUserName, setGitUserName] = useState('');
  const [gitUserEmail, setGitUserEmail] = useState('');
  const [gitRemoteUrl, setGitRemoteUrl] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const projectId = activeProject?.id || 'default';

  // Load Git status
  const fetchGitStatus = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/git/status`);
      if (res.ok) {
        const data: GitStatusInfo = await res.json();
        setGitStatus(data);
        setGitUserName(data.userName || activeProject?.git?.userName || '');
        setGitUserEmail(data.userEmail || activeProject?.git?.userEmail || '');
        setGitRemoteUrl(data.remotes?.[0]?.url || activeProject?.git?.remoteUrl || '');

        // Default file selection for diff if none selected
        if (!selectedFile) {
          if (data.stagedFiles.length > 0) {
            setSelectedFile({ path: data.stagedFiles[0].path, staged: true });
          } else if (data.unstagedFiles.length > 0) {
            setSelectedFile({ path: data.unstagedFiles[0].path, staged: false });
          }
        }
      }
    } catch (err: any) {
      console.error('Error al obtener estado git:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, activeProject]);

  // Load Commit Log
  const fetchCommits = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/git/log`);
      if (res.ok) {
        const data = await res.json();
        setCommits(data.commits || []);
      }
    } catch (err) {
      console.error('Error al obtener commits:', err);
    }
  }, [projectId]);

  // Load Diff for selected file
  const fetchDiff = useCallback(
    async (file?: string, staged?: boolean) => {
      if (!projectId || !gitStatus?.isRepo) return;
      setIsLoadingDiff(true);
      try {
        const params = new URLSearchParams();
        if (staged !== undefined) params.append('staged', staged ? 'true' : 'false');
        if (file) params.append('file', file);

        const res = await fetch(`/api/projects/${projectId}/git/diff?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setDiffContent(data.diff || '');
        }
      } catch (err) {
        console.error('Error al obtener diff:', err);
      } finally {
        setIsLoadingDiff(false);
      }
    },
    [projectId, gitStatus?.isRepo]
  );

  useEffect(() => {
    fetchGitStatus();
    fetchCommits();
  }, [fetchGitStatus, fetchCommits]);

  useEffect(() => {
    if (selectedFile) {
      fetchDiff(selectedFile.path, selectedFile.staged);
    } else {
      fetchDiff();
    }
  }, [selectedFile, fetchDiff]);

  // Actions
  const handleInitRepo = async () => {
    setIsInitializing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/git/init`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        onShowToast(data.message || 'Repositorio Git inicializado');
        await fetchGitStatus();
        await fetchCommits();
      } else {
        onShowToast(data.error || 'Error al inicializar Git', 'error');
      }
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleStageFile = async (filePath?: string, all?: boolean) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/git/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: filePath ? [filePath] : undefined, all }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchGitStatus();
        if (filePath) {
          setSelectedFile({ path: filePath, staged: true });
        }
      } else {
        onShowToast(data.error || 'Error al preparar archivo', 'error');
      }
    } catch (err: any) {
      onShowToast(err.message, 'error');
    }
  };

  const handleUnstageFile = async (filePath?: string, all?: boolean) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/git/unstage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: filePath ? [filePath] : undefined, all }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchGitStatus();
        if (filePath) {
          setSelectedFile({ path: filePath, staged: false });
        }
      } else {
        onShowToast(data.error || 'Error al quitar de preparación', 'error');
      }
    } catch (err: any) {
      onShowToast(err.message, 'error');
    }
  };

  const handleDiscardChanges = async (filePath: string) => {
    if (!confirm(`¿Descartar todos los cambios locales en "${filePath}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/projects/${projectId}/git/discard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: [filePath] }),
      });
      const data = await res.json();
      if (data.success) {
        onShowToast(`Cambios descartados en ${filePath}`);
        await fetchGitStatus();
        if (selectedFile?.path === filePath) {
          setSelectedFile(null);
        }
      } else {
        onShowToast(data.error || 'Error al descartar cambios', 'error');
      }
    } catch (err: any) {
      onShowToast(err.message, 'error');
    }
  };

  const handleCommit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commitMessage.trim()) {
      onShowToast('Escribe un mensaje de commit', 'error');
      return;
    }
    if ((gitStatus?.stagedFiles.length || 0) === 0) {
      onShowToast('Prepara archivos (Stage) antes de hacer commit', 'error');
      return;
    }

    setIsCommitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/git/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMessage.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        onShowToast('Commit realizado con éxito');
        setCommitMessage('');
        setSelectedFile(null);
        await fetchGitStatus();
        await fetchCommits();
      } else {
        onShowToast(data.error || 'Error al hacer commit', 'error');
      }
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleSwitchBranch = async (branchName: string) => {
    setIsBranchLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/git/branch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkout', branchName }),
      });
      const data = await res.json();
      if (data.success) {
        onShowToast(data.message);
        await fetchGitStatus();
        await fetchCommits();
      } else {
        onShowToast(data.error || 'Error al cambiar de rama', 'error');
      }
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setIsBranchLoading(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    setIsBranchLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/git/branch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', branchName: newBranchName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        onShowToast(data.message);
        setNewBranchName('');
        setIsCreatingBranch(false);
        await fetchGitStatus();
      } else {
        onShowToast(data.error || 'Error al crear rama', 'error');
      }
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setIsBranchLoading(false);
    }
  };

  const handleSaveGitConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/git/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: gitUserName.trim(),
          userEmail: gitUserEmail.trim(),
          remoteUrl: gitRemoteUrl.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        onShowToast('Configuración Git del proyecto actualizada');
        await fetchGitStatus();
      } else {
        onShowToast(data.error || 'Error al guardar configuración', 'error');
      }
    } catch (err: any) {
      onShowToast(err.message, 'error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleCopyCommitHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  const totalChanges =
    (gitStatus?.stagedFiles.length || 0) +
    (gitStatus?.unstagedFiles.length || 0) +
    (gitStatus?.untrackedFiles.length || 0);

  // Render Diff Lines with Syntax Highlighting
  const renderDiffContent = () => {
    if (isLoadingDiff) {
      return (
        <div className="p-8 flex items-center justify-center text-neutral-400 gap-2 text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
          <span>Calculando diferencias (diff)...</span>
        </div>
      );
    }

    if (!diffContent) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 text-neutral-400">
          <FileDiff className="w-10 h-10 stroke-[1.5] mb-2 opacity-40" />
          <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            {selectedFile ? 'Sin cambios detectados en este archivo' : 'Selecciona un archivo modificado para ver sus diferencias'}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1 max-w-sm">
            Los cambios preparados (staged) y no preparados se renderizan con resaltado de sintaxis línea por línea.
          </p>
        </div>
      );
    }

    const lines = diffContent.split('\n');
    return (
      <div className="font-mono text-xs leading-relaxed p-3 overflow-x-auto whitespace-pre selection:bg-neutral-800 selection:text-white">
        {lines.map((line, idx) => {
          let lineClass = 'text-neutral-700 dark:text-neutral-300';
          let bgClass = '';

          if (line.startsWith('+++') || line.startsWith('---')) {
            lineClass = 'font-bold text-neutral-500 dark:text-neutral-400';
          } else if (line.startsWith('@@')) {
            lineClass = 'text-sky-600 dark:text-sky-400 font-semibold';
            bgClass = 'bg-sky-50 dark:bg-sky-950/30';
          } else if (line.startsWith('+')) {
            lineClass = 'text-emerald-700 dark:text-emerald-300';
            bgClass = 'bg-emerald-50 dark:bg-emerald-950/35';
          } else if (line.startsWith('-')) {
            lineClass = 'text-rose-700 dark:text-rose-300';
            bgClass = 'bg-rose-50 dark:bg-rose-950/35';
          }

          return (
            <div key={idx} className={`px-2 py-0.5 rounded-xs ${bgClass} ${lineClass}`}>
              {line || ' '}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-neutral-900 overflow-hidden">
      {/* Top Bar for Git */}
      <div className="h-12 border-b border-neutral-200 dark:border-neutral-800 px-4 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-xs text-neutral-900 dark:text-neutral-100">
            <GitBranch className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Git / {activeProject?.name || 'Proyecto'}</span>
          </div>

          {gitStatus?.isRepo && (
            <div className="flex items-center gap-2">
              <span className="text-neutral-300 dark:text-neutral-700">|</span>

              {/* Branch Selector Dropdown */}
              <div className="relative flex items-center">
                <select
                  value={gitStatus.branch}
                  onChange={(e) => handleSwitchBranch(e.target.value)}
                  disabled={isBranchLoading}
                  className="appearance-none text-xs font-mono font-semibold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md pl-2 pr-6 py-1 text-neutral-800 dark:text-neutral-200 cursor-pointer shadow-2xs hover:border-neutral-300 focus:outline-hidden"
                >
                  {gitStatus.branches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-1.5 pointer-events-none" />
              </div>

              {/* New Branch Button */}
              {!isCreatingBranch ? (
                <button
                  onClick={() => setIsCreatingBranch(true)}
                  className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Crear nueva rama"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              ) : (
                <form onSubmit={handleCreateBranch} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    placeholder="nombre-rama..."
                    className="text-xs px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isBranchLoading || !newBranchName.trim()}
                    className="px-2 py-0.5 text-[11px] font-semibold rounded bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 cursor-pointer"
                  >
                    Crear
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingBranch(false)}
                    className="px-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Right actions in Git Header */}
        <div className="flex items-center gap-2">
          {gitStatus?.isRepo && (
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
              {totalChanges > 0 ? (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {totalChanges} cambios pendientes
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Check className="w-3 h-3 text-emerald-500" />
                  Árbol limpio
                </span>
              )}
            </div>
          )}

          <button
            onClick={() => {
              fetchGitStatus();
              fetchCommits();
              if (selectedFile) fetchDiff(selectedFile.path, selectedFile.staged);
            }}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Refrescar estado de Git"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {!gitStatus?.isRepo ? (
        /* Empty State: Not a Git Repo */
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto shadow-xs">
              <GitBranch className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Git no inicializado en este proyecto
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
                El directorio de trabajo de <span className="font-semibold text-neutral-800 dark:text-neutral-200">{activeProject?.name || 'este proyecto'}</span> aún no cuenta con un repositorio Git. Inicialízalo para comenzar a gestionar versiones, commits y ramas de forma aislada.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-900 text-[11px] text-neutral-600 dark:text-neutral-400 font-mono text-left truncate border border-neutral-200 dark:border-neutral-800">
              <span className="text-neutral-400 select-none mr-2">$</span>
              <span>Ruta: {gitStatus?.workspaceDir || activeProject?.workspaceDir || '/app/applet'}</span>
            </div>

            <button
              onClick={handleInitRepo}
              disabled={isInitializing}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors cursor-pointer shadow-sm"
            >
              {isInitializing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Inicializando Git...</span>
                </>
              ) : (
                <>
                  <GitCommit className="w-4 h-4" />
                  <span>Inicializar Repositorio Git (`git init`)</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Repo Active: Two Column Studio View */
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 dark:divide-neutral-800">
          
          {/* Left Column: Changes list & Commit Form */}
          <div className="w-full lg:w-80 xl:w-96 flex flex-col shrink-0 bg-neutral-50/40 dark:bg-neutral-900/40 overflow-hidden">
            
            {/* Commit Box Form */}
            <form onSubmit={handleCommit} className="p-3 border-b border-neutral-200 dark:border-neutral-800 space-y-2 bg-white dark:bg-neutral-900 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Nuevo Commit
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {gitStatus.stagedFiles.length} preparado(s)
                </span>
              </div>

              <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleCommit();
                  }
                }}
                placeholder="Mensaje del commit (Ctrl+Enter para guardar)..."
                rows={2}
                className="w-full text-xs p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:border-neutral-400 resize-none font-sans"
              />

              <div className="flex items-center gap-1.5">
                <button
                  type="submit"
                  disabled={isCommitting || !commitMessage.trim() || gitStatus.stagedFiles.length === 0}
                  className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <GitCommit className="w-3.5 h-3.5 shrink-0" />
                  <span>{isCommitting ? 'Guardando...' : 'Hacer Commit'}</span>
                </button>

                {gitStatus.unstagedFiles.length > 0 || gitStatus.untrackedFiles.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => handleStageFile(undefined, true)}
                    className="py-1.5 px-2 rounded-lg text-[11px] font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer whitespace-nowrap"
                    title="Preparar todos los cambios"
                  >
                    Stage All
                  </button>
                ) : null}
              </div>
            </form>

            {/* Scrollable Changes Explorer */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              
              {/* 1. Staged Changes */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 px-1">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <span>Preparados (Staged)</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/60 font-mono">
                      {gitStatus.stagedFiles.length}
                    </span>
                  </span>

                  {gitStatus.stagedFiles.length > 0 && (
                    <button
                      onClick={() => handleUnstageFile(undefined, true)}
                      className="text-[10px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                    >
                      Quitar todos
                    </button>
                  )}
                </div>

                {gitStatus.stagedFiles.length === 0 ? (
                  <div className="text-[11px] text-neutral-400 italic px-2 py-1">
                    Ningún cambio preparado
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {gitStatus.stagedFiles.map((file) => {
                      const isSelected = selectedFile?.path === file.path && selectedFile.staged;
                      return (
                        <div
                          key={`staged-${file.path}`}
                          onClick={() => {
                            setSelectedFile({ path: file.path, staged: true });
                            setActiveTab('diff');
                          }}
                          className={`group flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium'
                              : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate min-w-0 pr-1">
                            <span className="w-4 text-center font-mono font-bold text-[10px] text-emerald-600 dark:text-emerald-400">
                              {file.status === 'added' ? 'A' : file.status === 'deleted' ? 'D' : 'M'}
                            </span>
                            <span className="truncate font-mono text-[11px]">{file.path}</span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnstageFile(file.path);
                            }}
                            className="p-1 rounded text-neutral-400 hover:text-rose-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Quitar de stage (-)"
                          >
                            <span className="text-xs font-bold leading-none">-</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Unstaged Changes */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 px-1">
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <span>Modificados (Unstaged)</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/60 font-mono">
                      {gitStatus.unstagedFiles.length}
                    </span>
                  </span>

                  {gitStatus.unstagedFiles.length > 0 && (
                    <button
                      onClick={() => handleStageFile(undefined, true)}
                      className="text-[10px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                    >
                      Preparar todos
                    </button>
                  )}
                </div>

                {gitStatus.unstagedFiles.length === 0 ? (
                  <div className="text-[11px] text-neutral-400 italic px-2 py-1">
                    No hay modificaciones pendientes
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {gitStatus.unstagedFiles.map((file) => {
                      const isSelected = selectedFile?.path === file.path && !selectedFile.staged;
                      return (
                        <div
                          key={`unstaged-${file.path}`}
                          onClick={() => {
                            setSelectedFile({ path: file.path, staged: false });
                            setActiveTab('diff');
                          }}
                          className={`group flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium'
                              : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate min-w-0 pr-1">
                            <span className="w-4 text-center font-mono font-bold text-[10px] text-amber-600 dark:text-amber-400">
                              {file.status === 'deleted' ? 'D' : 'M'}
                            </span>
                            <span className="truncate font-mono text-[11px]">{file.path}</span>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDiscardChanges(file.path);
                              }}
                              className="p-1 rounded text-neutral-400 hover:text-rose-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                              title="Descartar cambios"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStageFile(file.path);
                              }}
                              className="p-1 rounded text-neutral-400 hover:text-emerald-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                              title="Preparar (+)"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Untracked Files */}
              {gitStatus.untrackedFiles.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 px-1">
                    <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <span>Sin seguimiento (Untracked)</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950/60 font-mono">
                        {gitStatus.untrackedFiles.length}
                      </span>
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    {gitStatus.untrackedFiles.map((path) => (
                      <div
                        key={`untracked-${path}`}
                        className="group flex items-center justify-between p-1.5 rounded-lg text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400"
                      >
                        <div className="flex items-center gap-2 truncate min-w-0 pr-1">
                          <span className="w-4 text-center font-mono font-bold text-[10px] text-blue-500">
                            ?
                          </span>
                          <span className="truncate font-mono text-[11px]">{path}</span>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => handleDiscardChanges(path)}
                            className="p-1 rounded text-neutral-400 hover:text-rose-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
                            title="Eliminar archivo sin seguimiento"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStageFile(path)}
                            className="p-1 rounded text-neutral-400 hover:text-emerald-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
                            title="Preparar (+)"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Diff / Commit Log / Git Configuration Tabs */}
          <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-neutral-900 overflow-hidden">
            {/* View Tabs */}
            <div className="h-10 border-b border-neutral-200 dark:border-neutral-800 px-4 flex items-center justify-between shrink-0 bg-neutral-50/30 dark:bg-neutral-900/30">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab('diff')}
                  className={`h-10 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'diff'
                      ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  <FileDiff className="w-3.5 h-3.5 text-amber-500" />
                  <span>Diferencias (Diff)</span>
                  {selectedFile && (
                    <span className="font-mono text-[10px] text-neutral-400 font-normal">
                      : {selectedFile.path}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('history')}
                  className={`h-10 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'history'
                      ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Historial de Commits</span>
                  <span className="text-[10px] text-neutral-400 font-mono">({commits.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('config')}
                  className={`h-10 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'config'
                      ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-blue-500" />
                  <span>Configuración Git</span>
                </button>
              </div>

              {selectedFile && activeTab === 'diff' && (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      selectedFile.staged
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {selectedFile.staged ? 'Staged' : 'Working Tree'}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      fetchDiff();
                    }}
                    className="text-[10px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                  >
                    Ver Diff Completo
                  </button>
                </div>
              )}
            </div>

            {/* Tab 1: Diff Viewer */}
            {activeTab === 'diff' && (
              <div className="flex-1 overflow-y-auto">
                {renderDiffContent()}
              </div>
            )}

            {/* Tab 2: Commit History (Log) */}
            {activeTab === 'history' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {commits.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-neutral-400">
                    <GitCommit className="w-10 h-10 stroke-[1.5] mb-2 opacity-40" />
                    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                      Aún no hay commits en este repositorio
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Prepara archivos en la columna izquierda y crea tu primer commit.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-w-3xl">
                    {commits.map((c) => (
                      <div
                        key={c.hash}
                        className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-1 min-w-0 pr-2">
                          <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 break-words">
                            {c.message}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono flex-wrap">
                            <span className="font-medium text-neutral-700 dark:text-neutral-300">
                              {c.author}
                            </span>
                            <span>•</span>
                            <span>{c.relativeTime || c.date}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleCopyCommitHash(c.hash)}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-[11px] font-mono text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
                            title="Copiar hash de commit"
                          >
                            <span>{c.shortHash}</span>
                            {copiedHash === c.hash ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3 text-neutral-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Project Git Configuration */}
            {activeTab === 'config' && (
              <div className="flex-1 overflow-y-auto p-6 max-w-xl">
                <form onSubmit={handleSaveGitConfig} className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Configuración Git para {activeProject?.name || 'este proyecto'}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Personaliza el autor de los commits y el repositorio remoto para este proyecto específico.
                    </p>
                  </div>

                  {/* User Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Nombre de usuario Git (user.name)</span>
                    </label>
                    <input
                      type="text"
                      value={gitUserName}
                      onChange={(e) => setGitUserName(e.target.value)}
                      placeholder="Ej: Developer OpenCode"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    />
                  </div>

                  {/* User Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Correo electrónico Git (user.email)</span>
                    </label>
                    <input
                      type="email"
                      value={gitUserEmail}
                      onChange={(e) => setGitUserEmail(e.target.value)}
                      placeholder="developer@opencode.local"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    />
                  </div>

                  {/* Remote URL */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Repositorio Remoto (origin URL)</span>
                    </label>
                    <input
                      type="text"
                      value={gitRemoteUrl}
                      onChange={(e) => setGitRemoteUrl(e.target.value)}
                      placeholder="https://github.com/usuario/mi-proyecto.git"
                      className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingConfig}
                      className="px-4 py-2 rounded-lg text-xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors cursor-pointer shadow-xs"
                    >
                      {isSavingConfig ? 'Guardando...' : 'Guardar Configuración Git'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
