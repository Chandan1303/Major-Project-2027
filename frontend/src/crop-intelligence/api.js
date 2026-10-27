import { api } from '../services/api';

async function call(method, path, data, config = {}) {
  try {
    const response = await api({ method, url: `/crop-intelligence${path}`, data, ...config });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || 'Crop monitoring request failed.';
    const wrapped = new Error(message);
    wrapped.status = error.response?.status;
    wrapped.data = error.response?.data?.data;
    throw wrapped;
  }
}

export const cropIntelligenceApi = {
  fields: () => call('get', '/fields'),
  varieties: () => call('get', '/varieties'),
  stages: () => call('get', '/stages'),
  mitigations: () => call('get', '/mitigations'),
  cycles: () => call('get', '/cycles'),
  cycle: (id) => call('get', `/cycles/${id}`),
  createCycle: (data) => call('post', '/cycles', data),
  updateCycle: (id, data) => call('patch', `/cycles/${id}`, data),
  archiveCycle: (id) => call('delete', `/cycles/${id}`),
  observations: (id) => call('get', `/cycles/${id}/observations`),
  addObservation: (id, data) => call('post', `/cycles/${id}/observations`, data),
  correctObservation: (id, observationId, data) => call('patch', `/cycles/${id}/observations/${observationId}`, data),
  revisions: (id, observationId) => call('get', `/cycles/${id}/observations/${observationId}/revisions`),
  uploadPhoto: (id, observationId, file) => {
    const form = new FormData();
    form.append('photo', file);
    return call('post', `/cycles/${id}/observations/${observationId}/photo`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  photoUrl: (id, observationId) => `${api.defaults.baseURL}/crop-intelligence/cycles/${id}/observations/${observationId}/photo`,
  calendar: (id, params) => call('get', `/cycles/${id}/calendar?${new URLSearchParams(params)}`),
  comparison: (id) => call('get', `/cycles/${id}/comparison`),
  recommendations: (id) => call('get', `/cycles/${id}/recommendations`),
  tasks: (id) => call('get', `/cycles/${id}/tasks`),
  addTask: (id, data) => call('post', `/cycles/${id}/tasks`, data),
  updateTask: (id, taskId, data) => call('patch', `/cycles/${id}/tasks/${taskId}`, data),
  activities: (id) => call('get', `/cycles/${id}/activities`),
  addActivity: (id, data) => call('post', `/cycles/${id}/activities`, data),
  alerts: (id) => call('get', `/cycles/${id}/alerts`),
  updateAlert: (id, alertId, data) => call('patch', `/cycles/${id}/alerts/${alertId}`, data),
  previewImport: (id, file, mapping = {}) => {
    const form = new FormData();
    form.append('cycle_id', id);
    form.append('file', file);
    form.append('mapping', JSON.stringify(mapping));
    return call('post', '/imports/preview', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  confirmImport: (id, file, mapping = {}) => {
    const form = new FormData();
    form.append('cycle_id', id);
    form.append('file', file);
    form.append('mapping', JSON.stringify(mapping));
    return call('post', '/imports/confirm', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  templateUrl: () => `${api.defaults.baseURL}/crop-intelligence/imports/template.csv`,
  reports: (id) => call('get', `/cycles/${id}/reports`),
  createReport: (id, checkpointDay) => call('post', `/cycles/${id}/reports`, { checkpoint_day: checkpointDay }),
  exportUrl: (id) => `${api.defaults.baseURL}/crop-intelligence/cycles/${id}/export.csv`,
  saveVariety: (code, data) => call('put', `/varieties/${encodeURIComponent(code)}`, data),
  saveStage: (key, data) => call('put', `/stages/${key}`, data),
  saveMitigation: (key, data) => call('put', `/mitigations/${key}`, data),
};
