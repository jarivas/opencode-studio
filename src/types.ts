export interface ProjectConfig {
  id: string;
  name: string;
  previewBaseUrl: string;
  workspaceDir: string;
  model: string;
  agent: 'build' | 'plan';
  autoApprove: boolean;
  thinking: boolean;
  logLevel: string;
  standalone: boolean;
  customBaseUrl?: string;
  systemPrompt?: string;
  keys: {
    geminiKey: string;
    anthropicKey: string;
    openaiKey: string;
    deepseekKey: string;
    groqKey: string;
    openrouterKey: string;
  };
  git?: {
    remoteUrl?: string;
    userName?: string;
    userEmail?: string;
  };
  updatedAt?: string;
}

export interface GitFileItem {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';
  staged: boolean;
}

export interface GitCommitItem {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  relativeTime: string;
  message: string;
}

export interface GitStatusInfo {
  isRepo: boolean;
  workspaceDir: string;
  branch: string;
  branches: string[];
  clean: boolean;
  stagedFiles: GitFileItem[];
  unstagedFiles: GitFileItem[];
  untrackedFiles: string[];
  ahead: number;
  behind: number;
  lastCommit?: GitCommitItem | null;
  remotes?: { name: string; url: string }[];
  userName?: string;
  userEmail?: string;
}

export interface ProjectsData {
  activeProjectId: string;
  projects: ProjectConfig[];
}

export interface OpenCodeStatus {
  cli: {
    installed: boolean;
    version?: string;
    path?: string;
  };
  service: {
    running: boolean;
    url?: string;
  };
  envKeys: {
    hasGemini: boolean;
    hasAnthropic: boolean;
    hasOpenAI: boolean;
    hasDeepSeek: boolean;
    hasGroq: boolean;
    hasOpenRouter: boolean;
  };
  workspaceDir: string;
  configFile: string;
  hasConfigFile: boolean;
  customConfig: any;
  modifiedFiles?: string[];
  activeProject?: ProjectConfig;
  projectsList?: { id: string; name: string; previewBaseUrl: string }[];
}

export interface OpenCodeConfig extends ProjectConfig {
  rawConfig?: any;
  projectsJsonContent?: string;
  modifiedFiles?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  model?: string;
  agent?: 'build' | 'plan';
  thinking?: string;
  toolActions?: { name: string; detail: string; status: 'pending' | 'success' | 'failed' }[];
  isStreaming?: boolean;
}

export interface ModelCategory {
  google: string[];
  anthropic: string[];
  openai: string[];
  deepseek: string[];
  free: string[];
  all: string[];
}

export interface WorkspaceItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  updatedAt?: string;
  children?: WorkspaceItem[];
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  prompt: string;
  model: string;
  agent: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  output: string;
  exitCode?: number;
}
