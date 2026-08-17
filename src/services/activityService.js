import api from './api';

export const activityService = {
  getAll: (params) => api.get('/activity', { params }),
};
