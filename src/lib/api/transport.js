// ─── HTTP transport — defaults to the PHP backend in local development ─────
// Token lives in localStorage (demo-grade XSS tradeoff, documented in Privacy).
// Every request carries it as `Authorization: Bearer …` when present.
import { readApiResponse } from '../http';

const DEFAULT_BASE = 'http://127.0.0.1:8888';
const BASE = (import.meta.env?.VITE_API_URL || DEFAULT_BASE).replace(/\/$/, '');
export const useRemote = true;

function headers(extra = {}) {
  const h = { 'Content-Type': 'application/json', ...extra };
  try {
    const raw = localStorage.getItem('sh_token');
    if (raw) h.Authorization = `Bearer ${raw}`;
  } catch { /* ignore */ }
  return h;
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, { ...options, headers: headers(options.headers) });
  const data = await readApiResponse(res);
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export const http = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  del: (path) => request(path, { method: 'DELETE' }),
  setToken: (token) => {
    try {
      if (token) localStorage.setItem('sh_token', token);
      else localStorage.removeItem('sh_token');
    } catch { /* ignore */ }
  },
};
