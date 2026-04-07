import type { BuildSession, BuildLog, BuildFile } from '../types/build';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function post<T>(path: string, body?: object): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export const buildApi = {
  start: (prompt: string) =>
    post<{ success: boolean; session: BuildSession }>('/api/build/start', { prompt }),

  stop: () =>
    post<{ success: boolean; session: BuildSession }>('/api/build/stop'),

  continue: () =>
    post<{ success: boolean; session: BuildSession }>('/api/build/continue'),

  sendInstruction: (content: string) =>
    post<{ success: boolean; session: BuildSession }>('/api/build/instruction', { content }),

  getStatus: () =>
    get<BuildSession | { status: 'idle' }>('/api/build/status'),

  getLogs: () =>
    get<{ logs: BuildLog[] }>('/api/build/logs'),

  getFiles: () =>
    get<{ files: BuildFile[] }>('/api/build/files'),
};
