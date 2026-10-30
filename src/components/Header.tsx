import React from 'react';
import { Menu, Folder, Cpu, Sliders, GitBranch } from 'lucide-react';
import { ProjectConfig } from '../types';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  activeProject: ProjectConfig | null;
  viewMode: 'chat' | 'files' | 'git';
  onOpenSettings: () => void;
  onOpenGit?: () => void;
  gitBranch?: string;
  gitChangesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileSidebar,
  activeProject,
  viewMode,
  onOpenSettings,
  onOpenGit,
  gitBranch,
  gitChangesCount,
}) => {
  const getViewTitle = () => {
    switch (viewMode) {
      case 'chat':
        return 'Chat';
      case 'files':
        return 'Archivos';
      case 'git':
        return 'Git';
      default:
        return 'Chat';
    }
  };

  return (
    <header className="h-12 w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0">
      {/* Left zone: Mobile toggle & Breadcrumb */}
      <div className="flex items-center gap-2.5 truncate">
        {/* Mobile Hamburger toggle */}
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center -ml-1.5"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Clean Breadcrumb */}
        <div className="flex items-center gap-2 text-xs truncate">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 truncate">
            <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">{activeProject?.name || 'Proyecto Principal'}</span>
          </span>
          <span className="text-neutral-300 dark:text-neutral-700">/</span>
          <span className="text-neutral-500 truncate">{getViewTitle()}</span>
        </div>
      </div>

      {/* Right zone: Git branch pill, Model indicator and Individual Project Settings button */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quick Git Branch Indicator */}
        {gitBranch && onOpenGit && (
          <button
            onClick={onOpenGit}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-colors cursor-pointer border ${
              viewMode === 'git'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-2xs'
                : 'bg-neutral-100/90 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
            title={`Rama actual: ${gitBranch}. Clic para abrir Git.`}
          >
            <GitBranch className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="truncate max-w-[90px]">{gitBranch}</span>
            {gitChangesCount !== undefined && gitChangesCount > 0 && (
              <span className="ml-0.5 px-1 py-0.2 rounded-full text-[9px] bg-amber-500 text-white font-bold leading-none">
                {gitChangesCount}
              </span>
            )}
          </button>
        )}

        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-100/80 dark:bg-neutral-800/60 font-mono">
          <Cpu className="w-3 h-3 text-neutral-400" />
          <span className="truncate max-w-[130px]">{activeProject?.model || 'OpenCode'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5" title="Listo" />
        </div>

        {/* Individual Project Settings trigger button */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer shadow-2xs"
          title={`Ajustes de ${activeProject?.name || 'este proyecto'}`}
        >
          <Sliders className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          <span>Ajustes</span>
        </button>
      </div>
    </header>
  );
};
