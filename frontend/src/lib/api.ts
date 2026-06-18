import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const ORG_HEADER = 'x-org-id';

export const api = axios.create({ baseURL: BASE_URL });

// Attach tokens
api.interceptors.request.use(config => {
  const token = localStorage.getItem('cp_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const orgId = localStorage.getItem('cp_active_org');
  if (orgId) config.headers[ORG_HEADER] = orgId;
  return config;
});

// Auto-refresh on 401 TOKEN_EXPIRED
let refreshing: Promise<string> | null = null;
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.data?.error === 'TOKEN_EXPIRED' && !err.config._retry) {
      err.config._retry = true;
      if (!refreshing) {
        const rt = localStorage.getItem('cp_refresh_token');
        refreshing = axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: rt })
          .then(r => { localStorage.setItem('cp_access_token', r.data.accessToken); return r.data.accessToken; })
          .finally(() => { refreshing = null; });
      }
      const token = await refreshing;
      err.config.headers.Authorization = `Bearer ${token}`;
      return api(err.config);
    }
    return Promise.reject(err);
  }
);

// Auth API
export const authApi = {
  register: (data: { name: string; email: string; password: string; orgName?: string }) =>
    api.post('/auth/register', data).then(r => r.data),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then(r => r.data),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
  updateMe: (data: Partial<{ name: string; currency: string; timezone: string; avatar: string }>) =>
    api.patch('/auth/me', data).then(r => r.data),
};

// Accounts API
export const accountsApi = {
  list: () => api.get('/accounts').then(r => r.data),
  create: (data: object) => api.post('/accounts', data).then(r => r.data),
  get: (id: string) => api.get(`/accounts/${id}`).then(r => r.data),
  update: (id: string, data: object) => api.patch(`/accounts/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/accounts/${id}`).then(r => r.data),
};

// Transactions API
export const transactionsApi = {
  list: (params?: object) => api.get('/transactions', { params }).then(r => r.data),
  create: (data: object) => api.post('/transactions', data).then(r => r.data),
  get: (id: string) => api.get(`/transactions/${id}`).then(r => r.data),
  update: (id: string, data: object) => api.patch(`/transactions/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/transactions/${id}`).then(r => r.data),
};

// Invoices API
export const invoicesApi = {
  list: (params?: object) => api.get('/invoices', { params }).then(r => r.data),
  create: (data: object) => api.post('/invoices', data).then(r => r.data),
  get: (id: string) => api.get(`/invoices/${id}`).then(r => r.data),
  update: (id: string, data: object) => api.patch(`/invoices/${id}`, data).then(r => r.data),
  markPaid: (id: string, data?: object) => api.post(`/invoices/${id}/mark-paid`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/invoices/${id}`).then(r => r.data),
};

// Bills API
export const billsApi = {
  list: (params?: object) => api.get('/bills', { params }).then(r => r.data),
  create: (data: object) => api.post('/bills', data).then(r => r.data),
  update: (id: string, data: object) => api.patch(`/bills/${id}`, data).then(r => r.data),
  pay: (id: string, data?: object) => api.post(`/bills/${id}/pay`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/bills/${id}`).then(r => r.data),
};

// Forecast API
export const forecastApi = {
  get: (days?: number) => api.get('/forecast', { params: { days } }).then(r => r.data),
};

// Alerts API
export const alertsApi = {
  list: (params?: object) => api.get('/alerts', { params }).then(r => r.data),
  runChecks: () => api.post('/alerts/run-checks').then(r => r.data),
  markRead: (id: string) => api.patch(`/alerts/${id}/read`).then(r => r.data),
  markAllRead: () => api.patch('/alerts/read-all').then(r => r.data),
  resolve: (id: string) => api.patch(`/alerts/${id}/resolve`).then(r => r.data),
};

// Reports API
export const reportsApi = {
  dashboard: () => api.get('/reports/dashboard').then(r => r.data),
  cashFlow: (params?: object) => api.get('/reports/cash-flow', { params }).then(r => r.data),
  accountSummary: () => api.get('/reports/account-summary').then(r => r.data),
};

// Team API
export const teamApi = {
  list: () => api.get('/team').then(r => r.data),
  invite: (email: string, role: string) => api.post('/team/invite', { email, role }).then(r => r.data),
  updateRole: (userId: string, role: string) => api.patch(`/team/${userId}/role`, { role }).then(r => r.data),
  remove: (userId: string) => api.delete(`/team/${userId}`).then(r => r.data),
  updateOrgSettings: (data: object) => api.patch('/team/org/settings', data).then(r => r.data),
};
