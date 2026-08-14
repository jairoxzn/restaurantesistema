import api from './api';

export const kdsService = {
  getOrders: () => api.get('/kds/orders'),
  updateStatus: (id, estado) => api.put(`/kds/orders/${id}/status`, { estado })
};
