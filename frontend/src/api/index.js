const API_BASE = '/api';

async function fetchJSON(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
}

export const api = {
  users: {
    get: (name) => fetchJSON(`/users/${encodeURIComponent(name)}`),
    list: () => fetchJSON('/users'),
    update: (name, data) => fetchJSON(`/users/${encodeURIComponent(name)}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    leaderboard: () => fetchJSON('/users/techs/leaderboard')
  },
  
  tickets: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetchJSON(`/tickets${query ? `?${query}` : ''}`);
    },
    get: (id) => fetchJSON(`/tickets/${id}`),
    create: (data) => fetchJSON('/tickets', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id, data) => fetchJSON(`/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    delete: (id) => fetchJSON(`/tickets/${id}`, { method: 'DELETE' })
  },
  
  ratings: {
    getForTech: (name) => fetchJSON(`/ratings/tech/${encodeURIComponent(name)}`),
    create: (data) => fetchJSON('/ratings', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  
  hireRequests: {
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetchJSON(`/hire-requests${query ? `?${query}` : ''}`);
    },
    create: (data) => fetchJSON('/hire-requests', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id, data) => fetchJSON(`/hire-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  },
  
  stats: {
    get: (name) => fetchJSON(`/stats/${encodeURIComponent(name)}`)
  }
};
