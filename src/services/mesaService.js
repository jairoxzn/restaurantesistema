import api from './api';

export const mesaService = {
  getAll: () => api.get('/mesas'),
  create: (data) => api.post('/mesas', data),
  update: (id, data) => api.put(`/mesas/${id}`, data),
  remove: (id) => api.delete(`/mesas/${id}`),
  getCuenta: (id) => api.get(`/mesas/${id}/cuenta`),
  cobrar: (id, pagos) => api.post(`/mesas/${id}/cobrar`, { pagos }),
};
