import api from './api';

export const cajaService = {
  getEstado: () => api.get('/caja/estado'),
  abrirCaja: (data) => api.post('/caja/abrir', data),
  cerrarCaja: (id, data) => api.put(`/caja/cerrar/${id}`, data),
  agregarGasto: (data) => api.post('/caja/gastos', data),
  getGastos: (caja_id) => api.get(`/caja/gastos?caja_id=${caja_id}`),
  getHistorial: () => api.get('/caja/historial')
};
