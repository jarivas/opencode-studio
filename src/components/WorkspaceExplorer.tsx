import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  File,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { WorkspaceItem } from '../types';

interface WorkspaceExplorerProps {
  onSendToStudio?: (filePath: string) => void;
}

export const WorkspaceExplorer: React.FC<WorkspaceExplorerProps> = ({
  onSendToStudio,
}) => {
  const [tree, setTree] = useState<WorkspaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    src: true,
  });

  const fetchTree = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/workspace');
      const data = await res.json();
      if (data.tree) {
        setTree(data.tree);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  const handleSelectFile = async (path: string) => {
    setSelectedFile(path);
    setIsLoadingFile(true);
    try {
      const res = await fetch(`/api/workspace/file?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      setFileContent(data.content || '');
    } catch (err) {
      setFileContent('Error al leer el archivo.');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render tree node recursive
  const renderItem = (item: WorkspaceItem, depth: number = 0) => {
    const isFolder = item.type === 'directory';
    const isOpen = !!openFolders[item.path];
    const isSelected = selectedFile === item.path;

    return (
      <div key={item.path} style={{ paddingLeft: `${depth * 12}px` }}>
        {isFolder ? (
          <div>
            <button
              onClick={() => toggleFolder(item.path)}
              className="w-full flex items-center gap-1.5 py-1.5 px-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-xs text-neutral-700 dark:text-neutral-300 transition-colors text-left font-medium"
            >
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              )}
              {isOpen ? (
                <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              )}
              <span className="truncate">{item.name}</span>
            </button>

            {isOpen && item.children && (
              <div className="space-y-0.5 mt-0.5">
                {item.children.map((child) => renderItem(child, depth + 1))}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => handleSelectFile(item.path)}
            className={`w-full flex items-center gap-1.5 py-1.5 px-2 rounded text-xs transition-colors text-left font-mono ${
              isSelected
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 shrink-0 opacity-70" />
            <span className="truncate">{item.name}</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Explorador de Archivos del Workspace
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Inspecciona el código fuente, la configuración y los archivos sobre los que opera OpenCode.
          </p>
        </div>

        <button
          onClick={fetchTree}
          disabled={isLoading}
          className="p-2 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs flex items-center gap-1.5"
          title="Recargar árbol de archivos"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        {/* File tree sidebar */}
        <div className="lg:col-span-4 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 bg-white dark:bg-neutral-900 overflow-y-auto max-h-[600px]">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 px-2">
            Archivos del Proyecto
          </div>
          <div className="space-y-0.5">
            {tree.map((item) => renderItem(item, 0))}
          </div>
        </div>

        {/* Code viewer pane */}
        <div className="lg:col-span-8 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-neutral-950 text-neutral-100 flex flex-col justify-between shadow-xs">
          <div className="px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-300">
              {selectedFile || 'Selecciona un archivo del árbol'}
            </span>

            {selectedFile && (
              <button
                onClick={handleCopyContent}
                className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors text-xs flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            )}
          </div>

          <div className="p-4 font-mono text-xs overflow-auto flex-1 max-h-[550px] leading-relaxed select-text">
            {isLoadingFile ? (
              <div className="text-neutral-500 py-12 text-center">Cargando archivo...</div>
            ) : selectedFile ? (
              <pre className="text-neutral-200 whitespace-pre-wrap">{fileContent}</pre>
            ) : (
              <div className="text-neutral-500 py-24 text-center">
                Haz clic en cualquier archivo a la izquierda para visualizar su contenido aquí.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
