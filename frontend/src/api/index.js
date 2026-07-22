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
  },

  // Payments
  payments: {
    create: (data) => fetchJSON('/payments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    list: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetchJSON(`/payments${query ? `?${query}` : ''}`);
    },
    get: (id) => fetchJSON(`/payments/${id}`),
    release: (id) => fetchJSON(`/payments/${id}/release`, { method: 'PATCH' }),
    refund: (id) => fetchJSON(`/payments/${id}/refund`, { method: 'PATCH' }),
    dispute: (id) => fetchJSON(`/payments/${id}/dispute`, { method: 'PATCH' })
  },

  // Earnings
  earnings: {
    getSummary: (techName) => fetchJSON(`/earnings/${encodeURIComponent(techName)}`),
    getTransactions: (techName, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetchJSON(`/earnings/${encodeURIComponent(techName)}/transactions${query ? `?${query}` : ''}`);
    },
    getChart: (techName) => fetchJSON(`/earnings/${encodeURIComponent(techName)}/chart`),
    requestPayout: (data) => fetchJSON('/earnings/payouts', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getPayouts: (techName) => fetchJSON(`/earnings/payouts/${encodeURIComponent(techName)}`)
  },

  // CRM
  crm: {
    getContacts: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetchJSON(`/crm/contacts${query ? `?${query}` : ''}`);
    },
    getContact: (id) => fetchJSON(`/crm/contacts/${id}`),
    createContact: (data) => fetchJSON('/crm/contacts', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    updateContact: (id, data) => fetchJSON(`/crm/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    getContactInteractions: (id) => fetchJSON(`/crm/contacts/${id}/interactions`),
    getContactStats: (id) => fetchJSON(`/crm/contacts/${id}/stats`),
    createInteraction: (data) => fetchJSON('/crm/interactions', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // Admin
  admin: {
    getDashboard: () => fetchJSON('/admin/dashboard'),
    getUsers: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetchJSON(`/admin/users${query ? `?${query}` : ''}`);
    },
    updateUser: (id, data) => fetchJSON(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    getPayments: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetchJSON(`/admin/payments${query ? `?${query}` : ''}`);
    },
    getPayouts: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetchJSON(`/admin/payouts${query ? `?${query}` : ''}`);
    },
    updatePayout: (id, data) => fetchJSON(`/admin/payouts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    getLogs: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetchJSON(`/admin/logs${query ? `?${query}` : ''}`);
    },
    getSettings: () => fetchJSON('/admin/settings'),
    updateSettings: (settings) => fetchJSON('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings)
    }),
    getRevenueChart: (months) => fetchJSON(`/admin/revenue-chart?months=${months || 12}`)
  }
};
