import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { MockApiConfig, CreateMockApiDto, UpdateMockApiDto, HttpMethod, RequestLog } from './types';

const app = express();
const PORT = 3001;
const MAX_LOGS = 100;

app.use(cors());
app.use(express.json());

let mockApis: MockApiConfig[] = [];
let requestLogs: RequestLog[] = [];
const mockRoutes = new Map<string, (req: Request, res: Response) => void>();

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function normalizePath(path: string): string {
  let normalized = path.startsWith('/') ? path : '/' + path;
  normalized = '/mock' + normalized;
  return normalized;
}

function addLog(log: Omit<RequestLog, 'id' | 'timestamp'>) {
  const newLog: RequestLog = {
    ...log,
    id: generateId(),
    timestamp: Date.now()
  };
  requestLogs.unshift(newLog);
  if (requestLogs.length > MAX_LOGS) {
    requestLogs = requestLogs.slice(0, MAX_LOGS);
  }
}

function createMockHandler(config: MockApiConfig) {
  return async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    if (!config.isEnabled) {
      const responseTime = Date.now() - startTime;
      addLog({
        method: config.method,
        path: normalizePath(config.path),
        statusCode: 404,
        responseTime,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      });
      return res.status(404).json({ error: 'Mock API not found' });
    }

    if (config.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, config.delay));
    }

    const responseTime = Date.now() - startTime;
    addLog({
      method: config.method,
      path: normalizePath(config.path),
      statusCode: config.statusCode,
      responseTime,
      ip: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    });

    res.status(config.statusCode).json(config.responseData);
  };
}

function registerMockRoute(config: MockApiConfig) {
  const fullPath = normalizePath(config.path);
  const routeKey = `${config.method}:${fullPath}`;
  
  if (mockRoutes.has(routeKey)) {
    const existingIndex = mockApis.findIndex(
      api => api.method === config.method && normalizePath(api.path) === fullPath && api.id !== config.id
    );
    if (existingIndex !== -1) {
      mockApis[existingIndex].isEnabled = false;
    }
  }

  const handler = createMockHandler(config);
  mockRoutes.set(routeKey, handler);

  const method = config.method.toLowerCase() as keyof typeof app;
  if (typeof app[method] === 'function') {
    (app[method] as any)(fullPath, handler);
  }
}

app.get('/api/mock-apis', (req: Request, res: Response) => {
  res.json({ data: mockApis });
});

app.get('/api/mock-apis/:id', (req: Request, res: Response) => {
  const api = mockApis.find(a => a.id === req.params.id);
  if (!api) {
    return res.status(404).json({ error: 'Mock API not found' });
  }
  res.json({ data: api });
});

app.post('/api/mock-apis', (req: Request, res: Response) => {
  const dto: CreateMockApiDto = req.body;
  
  const newApi: MockApiConfig = {
    id: generateId(),
    name: dto.name,
    method: dto.method,
    path: dto.path,
    delay: dto.delay,
    statusCode: dto.statusCode,
    responseData: dto.responseData,
    isEnabled: true,
    createdAt: Date.now()
  };

  mockApis.push(newApi);
  registerMockRoute(newApi);

  res.status(201).json({ data: newApi });
});

app.put('/api/mock-apis/:id', (req: Request, res: Response) => {
  const index = mockApis.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Mock API not found' });
  }

  const dto: UpdateMockApiDto = req.body;
  mockApis[index] = { ...mockApis[index], ...dto };
  
  registerMockRoute(mockApis[index]);

  res.json({ data: mockApis[index] });
});

app.delete('/api/mock-apis/:id', (req: Request, res: Response) => {
  const index = mockApis.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Mock API not found' });
  }

  const deleted = mockApis.splice(index, 1)[0];
  const fullPath = normalizePath(deleted.path);
  const routeKey = `${deleted.method}:${fullPath}`;
  mockRoutes.delete(routeKey);

  res.json({ data: deleted });
});

app.post('/api/mock-apis/:id/toggle', (req: Request, res: Response) => {
  const api = mockApis.find(a => a.id === req.params.id);
  if (!api) {
    return res.status(404).json({ error: 'Mock API not found' });
  }

  api.isEnabled = !api.isEnabled;
  res.json({ data: api });
});

app.get('/api/logs', (req: Request, res: Response) => {
  res.json({ data: requestLogs });
});

app.delete('/api/logs', (req: Request, res: Response) => {
  requestLogs = [];
  res.json({ success: true });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', port: PORT });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Mock Server running on http://localhost:${PORT}`);
  console.log(`Mock API base path: http://localhost:${PORT}/mock/*`);
  console.log(`Management API: http://localhost:${PORT}/api/*`);
  console.log(`Logs API: http://localhost:${PORT}/api/logs`);
});
