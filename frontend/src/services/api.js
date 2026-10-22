export const API_URL = (import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`).replace(/\/$/, '');
export async function request(path, options = {}) {
  const start = performance.now();
  const response = await fetch(`${API_URL}${path}`, { ...options, signal: AbortSignal.timeout(8000) });
  const body = await response.json();
  return { method: options.method || 'GET', url: `${API_URL}${path}`, status: response.status, statusText: response.statusText, body, headers: Object.fromEntries(response.headers), elapsed: Math.round(performance.now() - start) };
}
