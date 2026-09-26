import axios from 'axios';

function getBase() {
  const env = import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const h = window.location.hostname;
    const isLocal = h === 'localhost' || h === '127.0.0.1';
    if (!isLocal) return (env && !env.includes('localhost')) ? env : '/api';
  }
  return env || '/api';
}

export const api = axios.create({
  baseURL: getBase(),
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

export async function request(method, path, data) {
  try {
    return (await api({ method, url: path, data })).data;
  } catch (err) {
    const msg = err.response?.data?.message
      || (err.code === 'ERR_NETWORK' ? 'Unable to connect to the server.' : err.message || 'Something went wrong.');
    const e = new Error(msg);
    e.code   = err.response?.data?.code;
    e.status = err.response?.status;
    e.data   = err.response?.data?.data;
    throw e;
  }
}

// ─── Auth ──────────────────────────────────────────────────────────────
export const authApi = {
  me:                   ()      => request('get',   '/auth/me'),
  login:                (d)     => request('post',  '/auth/login', d),
  register:             (d)     => request('post',  '/auth/register', d),
  logout:               ()      => request('post',  '/auth/logout'),
  forgotPassword:       (d)     => request('post',  '/auth/forgot-password', d),
  resetPassword:        (d)     => request('post',  '/auth/reset-password', d),
  verifyEmail:          (token) => request('get',   `/auth/verify-email/${token}`),
  resendVerification:   (d)     => request('post',  '/auth/resend-verification', d),
};

// ─── Dashboard ─────────────────────────────────────────────────────────
export const dashboardApi = {
  getSummary:   () => request('get', '/dashboard/summary'),
  getMultiFarm: () => request('get', '/dashboard/multi-farm'),
};

// ─── Farms & Fields ────────────────────────────────────────────────────
export const farmApi = {
  list:        ()          => request('get',    '/farms'),
  mapData:     ()          => request('get',    '/farms/map-data'),
  create:      (d)         => request('post',   '/farms', d),
  update:      (id, d)     => request('patch',  `/farms/${id}`, d),
  remove:      (id)        => request('delete', `/farms/${id}`),
  getFields:   (farmId)    => request('get',    `/farms/${farmId}/fields`),
  addField:    (farmId, d) => request('post',   `/farms/${farmId}/fields`, d),
  updateField: (farmId, fieldId, d) => request('patch',  `/farms/${farmId}/fields/${fieldId}`, d),
  removeField: (farmId, fieldId)    => request('delete', `/farms/${farmId}/fields/${fieldId}`),
};

// ─── ML / Predictions ──────────────────────────────────────────────────
export const mlApi = {
  predict:      (d) => request('post', '/ml/predict', d),
  whatIf:       (d) => request('post', '/ml/what-if', d),
  explain:      (d) => request('post', '/ml/explain', d),
  dataQuality:  (d) => request('post', '/ml/data-quality', d),
  performance:  ()  => request('get',  '/ml/performance'),
};

export const predictionApi = {
  list:         (params) => request('get', `/predictions${params ? '?' + new URLSearchParams(params) : ''}`),
  getDetails:   (id)     => request('get', `/predictions/${id}`),
  save:         (d)      => request('post', '/predictions', d),
  remove:       (id)     => request('delete', `/predictions/${id}`),
  historyGraph: ()       => request('get', '/predictions/history-graph'),
};

export const yieldLossApi = {
  analyze: (predId) => request('get', `/yield-loss/analysis${predId ? `?prediction_id=${predId}` : ''}`),
};

export const cropIntelApi = {
  tracker: (fieldId) => request('get', `/crop-records/${fieldId}/tracker`),
};

export const irrigationApi = {
  decisionSupport: (p) => request('get', `/irrigation/decision-support${p ? '?' + new URLSearchParams(p) : ''}`),
};

export const historicalYieldApi = {
  analytics: (variety) => request('get', `/analytics/historical-yield${variety ? `?variety=${encodeURIComponent(variety)}` : ''}`),
};

export const advisorApi = {
  suggestions: () => request('get', '/advisor/suggestions'),
};

// ─── Weather ───────────────────────────────────────────────────────────
export const weatherApi = {
  current: (loc) => request('get', `/weather/current?location=${encodeURIComponent(loc || 'Kolhapur')}`),
  forecast:(loc) => request('get', `/weather/forecast?location=${encodeURIComponent(loc || 'Kolhapur')}`),
  history: ()    => request('get', '/weather/history'),
  impact:  (p)   => request('get', `/weather/impact?temperature=${p.temperature}&rainfall=${p.rainfall}&humidity=${p.humidity}`),
};

// ─── Soil ──────────────────────────────────────────────────────────────
export const soilApi = {
  getAll:    ()         => request('get', '/soil'),
  getScore:  (p)        => request('get', `/soil/score?ph=${p.ph}&moisture=${p.moisture}&nitrogen=${p.nitrogen||''}&phosphorus=${p.phosphorus||''}&potassium=${p.potassium||''}&soil_type=${p.soil_type||''}`),
  getByField:(fieldId)  => request('get', `/soil/field/${fieldId}`),
};

// ─── Varieties ─────────────────────────────────────────────────────────
export const varietyApi = {
  list:      ()    => request('get',  '/varieties'),
  compare:   (d)   => request('post', '/varieties/compare', d),
  recommend: (d)   => request('post', '/varieties/recommend', d),
};

// ─── Alerts ────────────────────────────────────────────────────────────
export const alertApi = {
  list:         (severity) => request('get', `/alerts${severity ? `?severity=${severity}` : ''}`),
  generate:     ()         => request('post',  '/alerts/generate'),
  markRead:     (id)       => request('patch', `/alerts/${id}/read`),
  markAllRead:  ()         => request('patch', '/alerts/read-all'),
  remove:       (id)       => request('delete', `/alerts/${id}`),
};

// ─── Reports ───────────────────────────────────────────────────────────
export const reportApi = {
  list:     ()           => request('get',  '/reports'),
  generate: (d)          => request('post', '/reports/generate', d),
  download: (id, format) => request('get', `/reports/${id}/download?format=${format || 'PDF'}`),
};

// ─── Chat ──────────────────────────────────────────────────────────────
export const chatApi = {
  send: (message) => request('post', '/chat/message', { message }),
};

// ─── Profile ───────────────────────────────────────────────────────────
export const profileApi = {
  get:            ()  => request('get',   '/profile'),
  update:         (d) => request('patch', '/profile', d),
  changePassword: (d) => request('post',  '/profile/change-password', d),
};

// ─── Admin ─────────────────────────────────────────────────────────────
export const adminApi = {
  stats:            ()           => request('get',   '/admin/stats'),
  getStats:         ()           => request('get',   '/admin/stats'),
  users:            ()           => request('get',   '/admin/users'),
  getUsers:         ()           => request('get',   '/admin/users'),
  updateUserStatus: (id, status) => request('patch', `/admin/users/${id}/status`, { status }),
  toggleUserStatus: (id, status) => request('patch', `/admin/users/${id}/status`, { status }),
  varieties:        ()           => request('get',   '/admin/varieties'),
  mlPerf:           ()           => request('get',   '/admin/ml-performance'),
  getMlPerformance: ()           => request('get',   '/admin/ml-performance'),
};

// ─── Agricultural Officer ───────────────────────────────────────────────
export const officerApi = {
  farms:             () => request('get', '/officer/farms'),
  getFarms:          () => request('get', '/officer/farms'),
  highRiskFields:    () => request('get', '/officer/high-risk-fields'),
  getHighRiskFields: () => request('get', '/officer/high-risk-fields'),
  analytics:         () => request('get', '/officer/analytics'),
  getAnalytics:      () => request('get', '/officer/analytics'),
};

