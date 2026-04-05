import api from './axios';

export const getCandidates = (params) => api.get('/candidates/', { params });

export const getCandidatesByIds = (ids) =>
  api.get('/candidates/', {
    params: {
      page: 1,
      page_size: ids.length,
      resume_ids: ids.join(','),
    },
  })

export const matchJD = (formData) =>
  api.post('/jd/match', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getSessionStatus = (sessionId) =>
  api.get(`/jd/session/${sessionId}/status`);
