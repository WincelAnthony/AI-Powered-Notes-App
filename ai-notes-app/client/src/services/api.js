// All HTTP lives here. Components never call fetch directly.
// Note: no API keys anywhere. The browser only holds an httpOnly session cookie it cannot read.
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Network error. Check your connection and try again.', 0, 'NETWORK');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error?.message || 'Something went wrong.', res.status, data?.error?.code);
  return data;
}

const qs = (params) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v));
  const s = new URLSearchParams(clean).toString();
  return s ? `?${s}` : '';
};

export const api = {
  auth: {
    register: (b) => request('/auth/register', { method: 'POST', body: b }),
    login: (b) => request('/auth/login', { method: 'POST', body: b }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me'),
  },
  notes: {
    list: (params = {}) => request(`/notes${qs(params)}`),
    stats: () => request('/notes/stats'),
    get: (id) => request(`/notes/${id}`),
    create: (b) => request('/notes', { method: 'POST', body: b }),
    update: (id, b) => request(`/notes/${id}`, { method: 'PUT', body: b }),
    remove: (id) => request(`/notes/${id}`, { method: 'DELETE' }),
    archive: (id) => request(`/notes/${id}/archive`, { method: 'PATCH' }),
    history: (id) => request(`/notes/${id}/ai-history`),
  },
  ai: {
    run: (path, body) => request(`/ai/${path}`, { method: 'POST', body }),
    usage: () => request('/ai/usage'),
  },
};
