const API_BASE = '/api';

// Get auth token from storage
function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Wrapper for authenticated fetch
async function fetchJSON(url, options = {}, requiresAuth = true) {
  const headers = {
    'Content-Type': 'application/json',
    ...(requiresAuth ? getAuthHeaders() : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  // Handle token expiration
  if (response.status === 401) {
    const data = await response.json().catch(() => ({}));
    if (data.expired) {
      // Try to refresh the token
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry the request with new token
        const newHeaders = {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
          ...options.headers
        };
        const retryResponse = await fetch(`${API_BASE}${url}`, {
          ...options,
          headers: newHeaders
        });
        
        if (!retryResponse.ok) {
          const error = await retryResponse.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(error.error || 'Request failed');
        }
        return retryResponse.json();
      }
    }
    // Token is invalid, clear and redirect
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
}

// Refresh access token
async function refreshToken() {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('auth_token', data.token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export const api = {
  // Auth API
  auth: {
    login: async (email, password) => {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(error.error || 'Login failed');
      }
      
      const data = await response.json();
      localStorage.setItem('auth_token', data.token);
      return data;
    },
    
    register: async (email, password, name, role) => {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Registration failed' }));
        throw new Error(error.error || 'Registration failed');
      }
      
      const data = await response.json();
      localStorage.setItem('auth_token', data.token);
      return data;
    },
    
    logout: async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include'
        });
      }
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    },
    
    verify: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No token');
      
      return fetchJSON('/auth/verify', {}, true);
    },

      createAdmin: async (email, password, name) => {
      const response = await fetch(`${API_BASE}/auth/create-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to create admin' }));
        throw new Error(error.error || 'Failed to create admin');
      }

      const data = await response.json();
      localStorage.setItem('auth_token', data.token);
      return data;
    },
    
    refresh: refreshToken
  },

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
    getPayouts: (techName) => fetchJSON(`/earnings/payouts/${encodeURIComponent(techName)}`),
    processPayout: (payoutId, data) => fetchJSON(`/earnings/payouts/${payoutId}/process`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    completePayout: (payoutId, data) => fetchJSON(`/earnings/payouts/${payoutId}/complete`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
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
  },

  // Discussions
  discussions: {
    get: (ticketId, userName, userRole) => fetchJSON(`/discussions/${ticketId}?user_name=${encodeURIComponent(userName)}&user_role=${userRole}`),
    send: (data) => fetchJSON('/discussions', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    addSystem: (data) => fetchJSON('/discussions/system', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // Categories & Templates
  categories: {
    list: () => fetchJSON('/categories'),
    getTemplates: (category) => {
      const query = category ? `?category=${encodeURIComponent(category)}` : '';
      return fetchJSON(`/categories/templates${query}`);
    },
    getTemplate: (id) => fetchJSON(`/categories/templates/${id}`),
    useTemplate: (id) => fetchJSON(`/categories/templates/${id}/use`, { method: 'POST' })
  },

  // Notifications
  notifications: {
    get: (userName, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetchJSON(`/notifications/${encodeURIComponent(userName)}${query ? `?${query}` : ''}`);
    },
    getCount: (userName) => fetchJSON(`/notifications/${encodeURIComponent(userName)}/count`),
    markRead: (id) => fetchJSON(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: (userName) => fetchJSON(`/notifications/${encodeURIComponent(userName)}/read-all`, { method: 'PATCH' })
  },

  // Ticket History
  ticketHistory: {
    get: (ticketId, limit = 100) => fetchJSON(`/ticket-history/${ticketId}?limit=${limit}`),
    getUserActivity: (userName, days = 7) => fetchJSON(`/ticket-history/user/${encodeURIComponent(userName)}?days=${days}`)
  },

  // CSAT Surveys
  surveys: {
    get: (ticketId) => fetchJSON(`/surveys/ticket/${ticketId}`),
    submit: (data) => fetchJSON('/surveys', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getTechSurveys: (techName, days = 30) => fetchJSON(`/surveys/tech/${encodeURIComponent(techName)}?days=${days}`),
    getTechStats: (techName, days = 30) => fetchJSON(`/surveys/tech/${encodeURIComponent(techName)}/stats?days=${days}`)
  },

  // Chatbot
  chatbot: {
    chat: (data) => fetchJSON('/chatbot/chat', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getFaqs: () => fetchJSON('/chatbot/faqs'),
    getTopics: () => fetchJSON('/chatbot/topics'),
    getHistory: (sessionId) => fetchJSON(`/chatbot/history/${sessionId}`)
  },

  // Credits
  credits: {
    getBalance: (userName) => fetchJSON(`/credits/balance/${encodeURIComponent(userName)}`),
    getHistory: (userName, limit = 50) => fetchJSON(`/credits/history/${encodeURIComponent(userName)}?limit=${limit}`),
    add: (data) => fetchJSON('/credits/add', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    deduct: (data) => fetchJSON('/credits/deduct', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    transfer: (data) => fetchJSON('/credits/transfer', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    donate: (data) => fetchJSON('/credits/donate', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getPackages: () => fetchJSON('/credits/packages'),
    purchase: (data) => fetchJSON('/credits/purchase', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getCost: (priority, basePay) => fetchJSON(`/credits/cost?priority=${priority}&base_pay=${basePay}`),
    check: (userName, priority, basePay) => fetchJSON(`/credits/check?user_name=${encodeURIComponent(userName)}&priority=${priority}&base_pay=${basePay}`),
    getSettings: () => fetchJSON('/credits/settings')
  },

  // Topics (Hierarchical Categories)
  topics: {
    getSuggestions: (limit = 10) => fetchJSON(`/topics/suggest?limit=${limit}`),
    addSuggestion: (data) => fetchJSON('/topics/suggest', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getCategories: () => fetchJSON('/topics/categories'),
    createCategory: (data) => fetchJSON('/topics/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getExpertise: (techName) => fetchJSON(`/topics/expertise/${encodeURIComponent(techName)}`),
    addExpertise: (data) => fetchJSON('/topics/expertise', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    removeExpertise: (data) => fetchJSON('/topics/expertise', {
      method: 'DELETE',
      body: JSON.stringify(data)
    })
  },

  // Agent Requests
  agents: {
    requestCustomer: (data) => fetchJSON('/agents/request-customer', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    getPendingRequests: (customerName) => fetchJSON(`/agents/requests/pending?customer_name=${encodeURIComponent(customerName)}`),
    getSentRequests: (techName) => fetchJSON(`/agents/requests/sent?tech_name=${encodeURIComponent(techName)}`),
    approveRequest: (id, data = {}) => fetchJSON(`/agents/requests/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    rejectRequest: (id, data = {}) => fetchJSON(`/agents/requests/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
    getRequest: (id) => fetchJSON(`/agents/requests/${id}`)
  }
};
