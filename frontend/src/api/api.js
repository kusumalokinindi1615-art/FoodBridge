import api from './axiosConfig';

/** Attach JWT to every request if present */
export const getToken = () => localStorage.getItem('foodbridge_token');
export const setToken = (t) => (t ? localStorage.setItem('foodbridge_token', t) : localStorage.removeItem('foodbridge_token'));

api.interceptors.request.use((cfg) => {
  const token = getToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

/* ─── Auth ───────────────────────────────────────────── */
export const authAPI = {
  login: async (email, password) => (await api.post('/api/auth/login', { email, password })).data,
  register: async (payload) => (await api.post('/api/auth/register', payload)).data,
  me: async () => (await api.get('/api/auth/me')).data,
  updateProfile: async (payload) => (await api.patch('/api/auth/profile', payload)).data,
  forgotPassword: async (email) => (await api.post('/api/auth/forgot-password', { email })).data,
  resetPassword: async (token, password) => (await api.post(`/api/auth/reset-password/${token}`, { password })).data,
};

/* ─── Uploads (multipart) ───────────────────────────── */
export const uploadsAPI = {
  image: async (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return (await api.post('/api/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
  },
};

/* ─── Donations ──────────────────────────────────────── */
export const donationsAPI = {
  list: async (params = {}) => (await api.get('/api/donations', { params })).data,
  get: async (id) => (await api.get(`/api/donations/${id}`)).data,
  create: async (payload) => (await api.post('/api/donations', payload)).data,
  updateStatus: async (id, status, extra = {}) =>
    (await api.patch(`/api/donations/${id}/status`, { status, ...extra })).data,
  tracking: async (id) => (await api.get(`/api/donations/${id}/tracking`)).data,
  pushNgoLocation: async (id, lat, lng) =>
    (await api.patch(`/api/donations/${id}/ngo-location`, { lat, lng })).data,
  pushVolunteerLocation: async (id, lat, lng) =>
    (await api.patch(`/api/donations/${id}/volunteer-location`, { lat, lng })).data,
  shareWithVolunteers: async (id) => (await api.post(`/api/donations/${id}/share`)).data,
};

/* ─── Notifications ──────────────────────────────────── */
export const notificationsAPI = {
  list: async () => (await api.get('/api/notifications')).data,
  markAllRead: async () => (await api.patch('/api/notifications/read-all')).data,
};

/* ─── Admin ──────────────────────────────────────────── */
export const adminAPI = {
  stats: async () => (await api.get('/api/admin/stats')).data,
  users: async () => (await api.get('/api/admin/users')).data,
  donations: async () => (await api.get('/api/admin/donations')).data,
  activity: async () => (await api.get('/api/admin/activity')).data,
  verifyUser: async (id, isVerified = true) =>
    (await api.patch(`/api/admin/users/${id}/verify`, { isVerified })).data,
  deleteUser: async (id) => (await api.delete(`/api/admin/users/${id}`)).data,
};

/* ─── Public stats (landing page) ────────────────────── */
export const statsAPI = {
  get: async () => (await api.get('/api/stats')).data,
};
