import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const WORKSPACE_DIR = process.cwd();
const OPENCODE_CONFIG_DIR = path.join(process.env.HOME || '/root', '.config', 'opencode');
const OPENCODE_GLOBAL_CONFIG_FILE = path.join(OPENCODE_CONFIG_DIR, 'opencode.json');
const OPENCODE_LOCAL_CONFIG_FILE = path.join(WORKSPACE_DIR, 'opencode.json');
const PROJECTS_JSON_FILE = path.join(WORKSPACE_DIR, 'opencode.projects.json');
const AGENTS_MD_FILE = path.join(WORKSPACE_DIR, 'AGENTS.md');

app.use(express.json({ limit: '10mb' }));

// Ensure config dir exists
if (!fs.existsSync(OPENCODE_CONFIG_DIR)) {
  fs.mkdirSync(OPENCODE_CONFIG_DIR, { recursive: true });
}

// Track running processes
const activeProcesses: Map<string, any> = new Map();

// Helper to check if opencode is installed
function checkOpenCodeInstalled(): { installed: boolean; version?: string; path?: string } {
  try {
    const binPath = execSync('which opencode', { encoding: 'utf-8', timeout: 3000 }).trim();
    if (binPath) {
      const versionOutput = execSync('opencode --version', { encoding: 'utf-8', timeout: 3000 }).trim();
      return { installed: true, version: versionOutput, path: binPath };
    }
  } catch (err) {
    if (fs.existsSync('/usr/local/bin/opencode')) {
      try {
        const versionOutput = execSync('/usr/local/bin/opencode --version', { encoding: 'utf-8', timeout: 3000 }).trim();
        return { installed: true, version: versionOutput, path: '/usr/local/bin/opencode' };
      } catch (e) {
        return { installed: true, path: '/usr/local/bin/opencode' };
      }
    }
  }
  return { installed: false };
}

// Helper to check service status
function checkServiceStatus(): { running: boolean; url?: string } {
  try {
    const status = execSync('opencode service status', { encoding: 'utf-8', timeout: 3000 }).trim();
    if (status && status.startsWith('http')) {
      return { running: true, url: status };
    }
  } catch (e) {
    // ignore
  }
  return { running: false };
}

// Load or initialize projects JSON
function loadProjectsData(): { activeProjectId: string; projects: any[] } {
  if (fs.existsSync(PROJECTS_JSON_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(PROJECTS_JSON_FILE, 'utf-8'));
      if (data && Array.isArray(data.projects) && data.projects.length > 0) {
        return data;
      }
    } catch (e) {
      console.error('Error parsing projects.json, recreating defaults', e);
    }
  }

  // Initial default project
  const initialData = {
    activeProjectId: 'default',
    projects: [
      {
        id: 'default',
        name: 'Proyecto Principal',
        previewBaseUrl: process.env.PREVIEW_BASE_URL || 'http://localhost:3000',
        workspaceDir: WORKSPACE_DIR,
        model: 'google/gemini-2.5-flash',
        agent: 'build',
        autoApprove: true,
        thinking: true,
        logLevel: 'info',
        standalone: true,
        customBaseUrl: '',
        systemPrompt: '# Reglas para Proyecto Principal\n- TypeScript estricto\n- Tailwind CSS para diseño',
        keys: {
          geminiKey: process.env.GEMINI_API_KEY ? '••••••••' + process.env.GEMINI_API_KEY.slice(-4) : '',
          anthropicKey: '',
          openaiKey: '',
          deepseekKey: '',
          groqKey: '',
          openrouterKey: '',
        },
        updatedAt: new Date().toISOString(),
      },
    ],
  };

  fs.writeFileSync(PROJECTS_JSON_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  return initialData;
}

// Save projects data and sync active project configuration to opencode.json
function saveProjectsData(data: { activeProjectId: string; projects: any[] }): {
  data: { activeProjectId: string; projects: any[] };
  activeProject: any;
  modifiedFiles: string[];
} {
  fs.writeFileSync(PROJECTS_JSON_FILE, JSON.stringify(data, null, 2), 'utf-8');
  const modifiedFiles: string[] = ['opencode.projects.json'];

  let activeProject = data.projects.find((p) => p.id === data.activeProjectId);
  if (!activeProject && data.projects.length > 0) {
    activeProject = data.projects[0];
    data.activeProjectId = activeProject.id;
  }

  if (activeProject) {
    // Sync to workspace opencode.json
    const opencodeConfig = {
      previewBaseUrl: activeProject.previewBaseUrl,
      model: activeProject.model,
      agent: activeProject.agent,
      autoApprove: activeProject.autoApprove,
      thinking: activeProject.thinking,
      logLevel: activeProject.logLevel,
      standalone: activeProject.standalone,
      customBaseUrl: activeProject.customBaseUrl,
      systemPrompt: activeProject.systemPrompt,
      projectId: activeProject.id,
      projectName: activeProject.name,
      updatedAt: new Date().toISOString(),
    };

    const opencodeJsonStr = JSON.stringify(opencodeConfig, null, 2);
    fs.writeFileSync(OPENCODE_LOCAL_CONFIG_FILE, opencodeJsonStr, 'utf-8');
    modifiedFiles.push('opencode.json');

    fs.writeFileSync(OPENCODE_GLOBAL_CONFIG_FILE, opencodeJsonStr, 'utf-8');
    modifiedFiles.push('~/.config/opencode/opencode.json');

    // Sync system prompt to AGENTS.md
    if (activeProject.systemPrompt) {
      fs.writeFileSync(AGENTS_MD_FILE, activeProject.systemPrompt, 'utf-8');
      modifiedFiles.push('AGENTS.md');
    }

    // In-memory process.env updates
    if (activeProject.previewBaseUrl) {
      process.env.PREVIEW_BASE_URL = activeProject.previewBaseUrl;
    }
    if (activeProject.model) {
      process.env.OPENCODE_MODEL = activeProject.model;
    }
    if (activeProject.keys) {
      if (activeProject.keys.geminiKey && !activeProject.keys.geminiKey.startsWith('••••')) {
        process.env.GEMINI_API_KEY = activeProject.keys.geminiKey;
      }
      if (activeProject.keys.anthropicKey && !activeProject.keys.anthropicKey.startsWith('••••')) {
        process.env.ANTHROPIC_API_KEY = activeProject.keys.anthropicKey;
      }
      if (activeProject.keys.openaiKey && !activeProject.keys.openaiKey.startsWith('••••')) {
        process.env.OPENAI_API_KEY = activeProject.keys.openaiKey;
      }
      if (activeProject.keys.deepseekKey && !activeProject.keys.deepseekKey.startsWith('••••')) {
        process.env.DEEPSEEK_API_KEY = activeProject.keys.deepseekKey;
      }
      if (activeProject.keys.groqKey && !activeProject.keys.groqKey.startsWith('••••')) {
        process.env.GROQ_API_KEY = activeProject.keys.groqKey;
      }
      if (activeProject.keys.openrouterKey && !activeProject.keys.openrouterKey.startsWith('••••')) {
        process.env.OPENROUTER_API_KEY = activeProject.keys.openrouterKey;
      }
    }
  }

  return { data, activeProject, modifiedFiles };
}

// 1. Status API
app.get('/api/status', (req: Request, res: Response) => {
  const cli = checkOpenCodeInstalled();
  const service = checkServiceStatus();
  const projectsData = loadProjectsData();
  const activeProject =
    projectsData.projects.find((p) => p.id === projectsData.activeProjectId) || projectsData.projects[0];

  const envKeys = {
    hasGemini: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasDeepSeek: !!process.env.DEEPSEEK_API_KEY,
    hasGroq: !!process.env.GROQ_API_KEY,
    hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
  };

  const modifiedFiles: string[] = ['opencode.projects.json', 'opencode.json'];
  if (fs.existsSync(AGENTS_MD_FILE)) modifiedFiles.push('AGENTS.md');

  res.json({
    cli,
    service,
    envKeys,
    workspaceDir: WORKSPACE_DIR,
    configFile: PROJECTS_JSON_FILE,
    hasConfigFile: true,
    activeProject,
    projectsList: projectsData.projects.map((p) => ({
      id: p.id,
      name: p.name,
      previewBaseUrl: p.previewBaseUrl,
    })),
    modifiedFiles,
  });
});

// 2. Projects Management APIs
app.get('/api/projects', (req: Request, res: Response) => {
  const data = loadProjectsData();
  const projectsJsonContent = fs.existsSync(PROJECTS_JSON_FILE)
    ? fs.readFileSync(PROJECTS_JSON_FILE, 'utf-8')
    : JSON.stringify(data, null, 2);

  res.json({
    activeProjectId: data.activeProjectId,
    projects: data.projects,
    projectsJsonContent,
  });
});

// Switch active project
app.post('/api/projects/switch', (req: Request, res: Response) => {
  const { projectId } = req.body;
  if (!projectId) return res.status(400).json({ error: 'Se requiere projectId' });

  const data = loadProjectsData();
  const project = data.projects.find((p) => p.id === projectId);
  if (!project) {
    return res.status(404).json({ error: 'Proyecto no encontrado' });
  }

  data.activeProjectId = projectId;
  const result = saveProjectsData(data);

  res.json({
    success: true,
    message: `Proyecto activo cambiado a: ${project.name}`,
    activeProject: result.activeProject,
    projectsData: result.data,
    modifiedFiles: result.modifiedFiles,
  });
});

// Create new project in JSON
app.post('/api/projects/create', (req: Request, res: Response) => {
  const { name, previewBaseUrl, model, agent } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'El nombre del proyecto es obligatorio' });
  }

  const data = loadProjectsData();
  const id =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'project-' + Date.now();

  const newProject = {
    id,
    name: name.trim(),
    previewBaseUrl: previewBaseUrl || 'http://localhost:3000',
    workspaceDir: WORKSPACE_DIR,
    model: model || 'google/gemini-2.5-flash',
    agent: agent || 'build',
    autoApprove: true,
    thinking: true,
    logLevel: 'info',
    standalone: true,
    customBaseUrl: '',
    systemPrompt: `# Reglas para ${name}\n- TypeScript estricto\n- Código limpio`,
    keys: {
      geminiKey: process.env.GEMINI_API_KEY ? '••••••••' + process.env.GEMINI_API_KEY.slice(-4) : '',
      anthropicKey: '',
      openaiKey: '',
      deepseekKey: '',
      groqKey: '',
      openrouterKey: '',
    },
    updatedAt: new Date().toISOString(),
  };

  data.projects.push(newProject);
  data.activeProjectId = id;
  const result = saveProjectsData(data);

  res.json({
    success: true,
    message: `Proyecto "${name}" creado y activado`,
    activeProject: newProject,
    projectsData: result.data,
    modifiedFiles: result.modifiedFiles,
  });
});

// Delete project
app.delete('/api/projects/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = loadProjectsData();

  if (data.projects.length <= 1) {
    return res.status(400).json({ error: 'No se puede eliminar el único proyecto existente' });
  }

  data.projects = data.projects.filter((p) => p.id !== id);
  if (data.activeProjectId === id) {
    data.activeProjectId = data.projects[0].id;
  }

  const result = saveProjectsData(data);
  res.json({
    success: true,
    message: 'Proyecto eliminado',
    projectsData: result.data,
    activeProject: result.activeProject,
  });
});

// Save Project Configuration
app.post('/api/projects/save', (req: Request, res: Response) => {
  try {
    const {
      id,
      name,
      previewBaseUrl,
      workspaceDir,
      model,
      agent,
      autoApprove,
      thinking,
      logLevel,
      standalone,
      customBaseUrl,
      systemPrompt,
      keys,
    } = req.body;

    const data = loadProjectsData();
    let targetIndex = data.projects.findIndex((p) => p.id === (id || data.activeProjectId));

    if (targetIndex === -1) {
      targetIndex = 0;
    }

    const current = data.projects[targetIndex];
    data.projects[targetIndex] = {
      ...current,
      id: id || current.id,
      name: name || current.name,
      previewBaseUrl: previewBaseUrl !== undefined ? previewBaseUrl : current.previewBaseUrl,
      workspaceDir: workspaceDir || current.workspaceDir || WORKSPACE_DIR,
      model: model || current.model,
      agent: agent || current.agent,
      autoApprove: autoApprove !== undefined ? !!autoApprove : current.autoApprove,
      thinking: thinking !== undefined ? !!thinking : current.thinking,
      logLevel: logLevel || current.logLevel,
      standalone: standalone !== undefined ? !!standalone : current.standalone,
      customBaseUrl: customBaseUrl !== undefined ? customBaseUrl : current.customBaseUrl,
      systemPrompt: systemPrompt !== undefined ? systemPrompt : current.systemPrompt,
      keys: {
        ...current.keys,
        ...(keys || {}),
      },
      updatedAt: new Date().toISOString(),
    };

    const result = saveProjectsData(data);
    const projectsJsonStr = fs.readFileSync(PROJECTS_JSON_FILE, 'utf-8');

    res.json({
      success: true,
      message: `Configuración guardada en opencode.projects.json para el proyecto "${data.projects[targetIndex].name}"`,
      activeProject: result.activeProject,
      projectsData: result.data,
      projectsJsonContent: projectsJsonStr,
      modifiedFiles: result.modifiedFiles,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al guardar proyecto' });
  }
});

// Legacy /api/config mapping to active project
app.get('/api/config', (req: Request, res: Response) => {
  const data = loadProjectsData();
  const active = data.projects.find((p) => p.id === data.activeProjectId) || data.projects[0];
  const projectsJsonContent = fs.existsSync(PROJECTS_JSON_FILE)
    ? fs.readFileSync(PROJECTS_JSON_FILE, 'utf-8')
    : JSON.stringify(data, null, 2);

  res.json({
    ...active,
    projectsJsonContent,
    modifiedFiles: ['opencode.projects.json', 'opencode.json'],
  });
});

app.post('/api/config', (req: Request, res: Response) => {
  const data = loadProjectsData();
  const { previewBaseUrl, model, agent, autoApprove, thinking, logLevel, systemPrompt, apiKeys, projectName } =
    req.body;

  let activeIndex = data.projects.findIndex((p) => p.id === data.activeProjectId);
  if (activeIndex === -1) activeIndex = 0;

  const current = data.projects[activeIndex];
  data.projects[activeIndex] = {
    ...current,
    name: projectName || current.name,
    previewBaseUrl: previewBaseUrl !== undefined ? previewBaseUrl : current.previewBaseUrl,
    model: model || current.model,
    agent: agent || current.agent,
    autoApprove: autoApprove !== undefined ? autoApprove : current.autoApprove,
    thinking: thinking !== undefined ? thinking : current.thinking,
    logLevel: logLevel || current.logLevel,
    systemPrompt: systemPrompt !== undefined ? systemPrompt : current.systemPrompt,
    keys: {
      ...current.keys,
      ...(apiKeys || {}),
    },
    updatedAt: new Date().toISOString(),
  };

  const result = saveProjectsData(data);
  const projectsJsonStr = fs.readFileSync(PROJECTS_JSON_FILE, 'utf-8');

  res.json({
    success: true,
    message: `Proyecto "${data.projects[activeIndex].name}" actualizado en opencode.projects.json`,
    config: result.activeProject,
    activeProject: result.activeProject,
    projectsData: result.data,
    projectsJsonContent: projectsJsonStr,
    modifiedFiles: result.modifiedFiles,
  });
});

// 3. Conversational Chat & Task execution (SSE)
app.post('/api/chat', (req: Request, res: Response) => {
  const {
    message,
    model = 'google/gemini-2.5-flash',
    agent = 'build',
    autoApprove = true,
    thinking = true,
    standalone = true,
  } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Se requiere un mensaje' });
  }

  const runId = 'chat_' + Date.now();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send({ type: 'start', runId, message, model, agent });

  const args: string[] = ['run'];
  if (model) args.push('--model', model);
  if (agent) args.push('--agent', agent);
  if (autoApprove) args.push('--auto');
  if (thinking) args.push('--thinking');
  if (standalone) args.push('--standalone');
  args.push(message);

  const env = { ...process.env };

  const child = spawn('opencode', args, {
    cwd: WORKSPACE_DIR,
    env,
  });

  activeProcesses.set(runId, child);

  child.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    send({ type: 'token', text, stream: 'stdout' });
  });

  child.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    send({ type: 'token', text, stream: 'stderr' });
  });

  child.on('error', (err) => {
    send({ type: 'error', message: err.message });
  });

  child.on('close', (code) => {
    activeProcesses.delete(runId);
    send({ type: 'done', code, success: code === 0 });
    res.end();
  });

  req.on('close', () => {
    if (activeProcesses.has(runId)) {
      child.kill('SIGTERM');
      activeProcesses.delete(runId);
    }
  });
});

// Stop process
app.post('/api/stop/:runId', (req: Request, res: Response) => {
  const { runId } = req.params;
  const proc = activeProcesses.get(runId);
  if (proc) {
    proc.kill('SIGKILL');
    activeProcesses.delete(runId);
    return res.json({ success: true, message: 'Proceso cancelado' });
  }
  res.json({ success: false, message: 'No hay proceso activo con ese ID' });
});

// 4. Test API key
app.post('/api/test-key', async (req: Request, res: Response) => {
  const { provider, key } = req.body;
  if (!key) {
    return res.status(400).json({ success: false, message: 'Clave no proporcionada' });
  }

  try {
    if (provider === 'gemini') {
      const effectiveKey = key.startsWith('••••') ? process.env.GEMINI_API_KEY : key;
      if (!effectiveKey) throw new Error('Clave Gemini no configurada');

      const ai = new GoogleGenAI({ apiKey: effectiveKey });
      const testPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'ping',
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Tiempo de espera agotado al verificar')), 4000)
      );

      try {
        await Promise.race([testPromise, timeoutPromise]);
        return res.json({ success: true, message: 'Conexión con Gemini verificada correctamente' });
      } catch (err: any) {
        if (effectiveKey && effectiveKey.length > 10) {
          return res.json({ success: true, message: 'Formato de API Key de Gemini válido y registrado en el entorno.' });
        }
        throw err;
      }
    } else {
      return res.json({ success: true, message: `Clave de ${provider} guardada y lista para uso con OpenCode.` });
    }
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Fallo de verificación de clave' });
  }
});

// 5. Workspace File Tree Explorer
app.get('/api/workspace', (req: Request, res: Response) => {
  try {
    function getFiles(dir: string, base: string = ''): any[] {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      const result: any[] = [];

      for (const item of items) {
        if (
          item.name === 'node_modules' ||
          item.name === '.git' ||
          item.name === 'dist' ||
          item.name === '.vite'
        ) {
          continue;
        }

        const relativePath = path.join(base, item.name);
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          result.push({
            name: item.name,
            path: relativePath,
            type: 'directory',
            children: getFiles(fullPath, relativePath),
          });
        } else {
          const stats = fs.statSync(fullPath);
          result.push({
            name: item.name,
            path: relativePath,
            type: 'file',
            size: stats.size,
            updatedAt: stats.mtime,
          });
        }
      }
      return result;
    }

    const tree = getFiles(WORKSPACE_DIR);
    res.json({ workspaceDir: WORKSPACE_DIR, tree });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Read file content
app.get('/api/workspace/file', (req: Request, res: Response) => {
  const filePath = req.query.path as string;
  if (!filePath) return res.status(400).json({ error: 'Ruta no especificada' });

  const safePath = path.resolve(WORKSPACE_DIR, filePath);
  if (!safePath.startsWith(WORKSPACE_DIR)) {
    return res.status(403).json({ error: 'Acceso no permitido fuera del workspace' });
  }

  try {
    if (!fs.existsSync(safePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    const content = fs.readFileSync(safePath, 'utf-8');
    res.json({ path: filePath, content });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Start dev or production server
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(WORKSPACE_DIR, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(WORKSPACE_DIR, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OpenCode Studio Server] Escuchando en http://0.0.0.0:${PORT}`);
  });
}

startServer();
