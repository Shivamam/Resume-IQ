import api from './axios';

export const uploadResumes = (formData) =>
  api.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getResumes = () => api.get('/resumes/');

export const getParsedResume = (id) => api.get(`/resumes/${id}/parsed`);

export const deleteResume = (id) => api.delete(`/resumes/${id}`);

export const getCandidateDetail = (resumeId) =>
  api.get(`/resumes/${resumeId}/parsed`);

export const getResume = (resumeId) => api.get(`/resumes/${resumeId}`);
