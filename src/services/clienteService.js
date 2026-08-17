import api from './api';

export const clienteService = {
  getAll: (params) => api.get('/clientes', { params }),
  getById: (id) => api.get(`/clientes/${id}`),
  buscarPorTelefono: (telefono) => api.get('/clientes/buscar', { params: { telefono } }),
  create: (data) => api.post('/clientes', data),
  update: (id, data) => api.put(`/clientes/${id}`, data),
  remove: (id) => api.delete(`/clientes/${id}`),
  registrarPublico: (data) => api.post('/clientes/publico', data),
};
