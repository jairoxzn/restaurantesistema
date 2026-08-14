import api from './api';

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getTopProducts: () => api.get('/dashboard/top-products'),
  getSalesChart: () => api.get('/dashboard/sales-chart'),
};
