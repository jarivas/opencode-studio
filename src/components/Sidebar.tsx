import React, { useState } from 'react';
import {
  Terminal,
  MessageSquare,
  FolderTree,
  Folder,
  Check,
  Plus,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
} from 'lucide-react';
import { ProjectConfig, OpenCodeStatus } from '../types';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsedDesktop: boolean;
  onToggleCollapseDesktop: () => void;
  viewMode: 'chat' | 'files';
  setViewMode: (mode: 'chat' | 'files') => void;
  activeProject: ProjectConfig | null;
  projectsList: { id: string; name: string; previewBaseUrl: string }[];
  onSwitchProject: (id: string) => void;
  onCreateProject: (name: string, previewBaseUrl?: string) => Promise<void>;
  onNewSession: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  status: OpenCodeStatus | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenMobile,
  onCloseMobile,
  isCollapsedDesktop,
  onToggleCollapseDesktop,
  viewMode,
  setViewMode,
  activeProject,
  projectsList,
  onSwitchProject,
  onCreateProject,
  onNewSession,
  darkMode,
  setDarkMode,
  status,
}) => {
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectUrl, setNewProjectUrl] = useState('http://localhost:3000');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateProject(newProjectName.trim(), newProjectUrl.trim());
      setNewProjectName('');
      setIsCreatingInline(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transition-all duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsedDesktop ? 'lg:w-18' : 'lg:w-64'} w-72 max-w-[85vw]`}
      >
        {/* Top Header in Sidebar */}
        <div className="h-12 border-b border-neutral-200 dark:border-neutral-800 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-900 shrink-0 shadow-xs">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            {!isCollapsedDesktop && (
              <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100 tracking-tight truncate whitespace-nowrap">
                OpenCode Studio
              </span>
            )}
          </div>

          {/* Close button on mobile / Collapse on desktop */}
          <div className="flex items-center gap-1">
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              title="Cerrar menú"
            >
              <X className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleCollapseDesktop}
              className="hidden lg:flex p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
              title={isCollapsedDesktop ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
            >
              {isCollapsedDesktop ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Primary Action Button: Nuevo Chat */}
        <div className="p-3 pb-1 shrink-0">
          <button
            onClick={() => {
              onNewSession();
              setViewMode('chat');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors cursor-pointer shadow-xs ${
              isCollapsedDesktop ? 'px-0' : ''
            }`}
            title="Iniciar nuevo chat"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!isCollapsedDesktop && <span>Nuevo Chat</span>}
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {/* Main Navigation Views */}
          <div className="space-y-1">
            {!isCollapsedDesktop && (
              <div className="px-2 pb-1 text-[10px] font-bold uppercase text-neutral-400 tracking-wider">
                Vistas
              </div>
            )}

            {/* Chat View Button */}
            <button
              onClick={() => {
                setViewMode('chat');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'chat'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title={isCollapsedDesktop ? 'Chat' : undefined}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              {!isCollapsedDesktop && <span className="truncate">Chat</span>}
            </button>

            {/* Files View Button */}
            <button
              onClick={() => {
                setViewMode('files');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'files'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title={isCollapsedDesktop ? 'Archivos' : undefined}
            >
              <FolderTree className="w-4 h-4 shrink-0" />
              {!isCollapsedDesktop && <span className="truncate">Archivos</span>}
            </button>
          </div>

          {/* Dedicated Projects Section with Direct Preview Links */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 pb-1">
              {!isCollapsedDesktop ? (
                <>
                  <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">
                    Proyectos
                  </span>
                  <button
                    onClick={() => setIsCreatingInline(!isCreatingInline)}
                    className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="Nuevo Proyecto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <div className="w-full flex justify-center">
                  <span className="h-0.5 w-6 bg-neutral-200 dark:bg-neutral-800 rounded" />
                </div>
              )}
            </div>

            {/* Inline Project Creation Form (if toggled) */}
            {isCreatingInline && !isCollapsedDesktop && (
              <form
                onSubmit={handleCreateSubmit}
                className="p-2.5 mb-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 space-y-2 animate-in fade-in duration-150"
              >
                <div className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
                  Nuevo Proyecto
                </div>
                <input
                  type="text"
                  placeholder="Nombre..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                  required
                  autoFocus
                />
                <input
                  type="url"
                  placeholder="http://localhost:3000"
                  value={newProjectUrl}
                  onChange={(e) => setNewProjectUrl(e.target.value)}
                  className="w-full text-xs font-mono px-2.5 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                />
                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingInline(false)}
                    className="px-2 py-1 text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 cursor-pointer"
                  >
                    {isSubmitting ? 'Creando...' : 'Crear'}
                  </button>
                </div>
              </form>
            )}

            {/* Projects List */}
            <div className="space-y-1">
              {projectsList.map((p) => {
                const isActive = p.id === activeProject?.id;

                if (isCollapsedDesktop) {
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSwitchProject(p.id)}
                      className={`w-full h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer relative ${
                        isActive
                          ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold'
                          : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                      }`}
                      title={`${p.name} (${p.previewBaseUrl})`}
                    >
                      <Folder className={`w-4 h-4 ${isActive ? 'text-amber-500' : 'text-neutral-400'}`} />
                      {isActive && (
                        <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  );
                }

                return (
                  <div
                    key={p.id}
                    onClick={() => onSwitchProject(p.id)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-center justify-between group cursor-pointer ${
                      isActive
                        ? 'bg-neutral-100 dark:bg-neutral-800/90 text-neutral-900 dark:text-white font-medium border border-neutral-200 dark:border-neutral-700 shadow-2xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 hover:text-neutral-900 dark:hover:text-neutral-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0 pr-1">
                      <Folder
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-amber-500' : 'text-neutral-400 group-hover:text-amber-500'
                        }`}
                      />
                      <div className="truncate min-w-0">
                        <span className="block truncate text-xs font-semibold leading-tight">
                          {p.name}
                        </span>
                        <span className="block truncate text-[10px] text-neutral-400 font-mono mt-0.5">
                          {p.previewBaseUrl.replace(/^https?:\/\//, '')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Direct External Preview link right from sidebar */}
                      <a
                        href={p.previewBaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                        title={`Abrir vista previa de ${p.name}`}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      {isActive && (
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-0.5" />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add Project Button (Expanded) */}
              {!isCollapsedDesktop && !isCreatingInline && (
                <button
                  onClick={() => setIsCreatingInline(true)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-2 cursor-pointer mt-0.5"
                >
                  <Plus className="w-3 h-3 text-neutral-400" />
                  <span>Nuevo Proyecto...</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer in Sidebar */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2 shrink-0">
          {!isCollapsedDesktop ? (
            <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1">
              <span className="truncate">{status?.cli?.version || 'OpenCode v2.2.2'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="CLI Activo" />
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="CLI Activo" />
            </div>
          )}

          {/* Theme Switcher Button */}
          <button
            onClick={() => setDarkMode((prev) => !prev)}
            className="w-full flex items-center justify-center gap-2 p-1.5 rounded-lg text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
            title={darkMode ? 'Modo claro' : 'Modo oscuro'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            {!isCollapsedDesktop && (
              <span className="text-[11px] font-medium">
                {darkMode ? 'Tema Claro' : 'Tema Oscuro'}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
