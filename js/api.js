/**
 * SmokPerio AI — High-Performance API Client & Central State Manager
 */

const Api = (function () {
  let baseUrl = window.location.pathname.includes('/smokperio/')
    ? window.location.origin + '/smokperio/'
    : window.location.origin + '/';

  if (!window.location.pathname.includes('/smokperio/')) {
    baseUrl = 'http://localhost/smokperio/';
  }

  const TOKEN_KEY = 'smokperio_token';
  const USER_KEY  = 'smokperio_user';

  function getToken() { return localStorage.getItem(TOKEN_KEY); }

  function getUser() {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch (e) { return null; }
  }

  function setSession(token, user) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user)  localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function isAuthenticated() { return !!getUser(); }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-message';
    const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  async function request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : (baseUrl + endpoint.replace(/^\//, ''));
    const headers = options.headers || {};

    const token = getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    options.headers = headers;

    try {
      const response = await fetch(url, options);
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/pdf')) {
        return await response.blob();
      }

      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || `Request failed (${response.status})`);
        }
        return data;
      }

      const text = await response.text();
      try { return JSON.parse(text); } catch (e) { return text; }
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  }

  return {
    getBaseUrl: () => baseUrl,
    getToken,
    getUser,
    setSession,
    clearSession,
    isAuthenticated,
    showToast,

    // Auth
    login: (email, password) => request('auth/login.php', { method: 'POST', body: JSON.stringify({ email, password }) }),
    signup: (data) => request('auth/signup.php', { method: 'POST', body: JSON.stringify(data) }),
    forgotPassword: (email) => request('auth/forgot_password.php', { method: 'POST', body: JSON.stringify({ email }) }),
    verifyOtp: (email, otp) => request('auth/verify_otp.php', { method: 'POST', body: JSON.stringify({ email, otp }) }),
    resetPassword: (email, otp, new_password) => request('auth/reset_password.php', { method: 'POST', body: JSON.stringify({ email, otp, new_password }) }),
    updateProfile: (data) => request('auth/update_profile.php', { method: 'POST', body: JSON.stringify(data) }),

    // Patients
    listPatients: (practitionerId) => request(`patients/index.php?practitioner_id=${practitionerId || ''}`),
    getPatient: (id) => request(`patients/index.php?id=${id}`),
    createPatient: (data) => request('patients/index.php', { method: 'POST', body: JSON.stringify(data) }),
    updatePatient: (id, data) => request(`patients/index.php?id=${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePatient: (id) => request(`patients/index.php?id=${id}`, { method: 'DELETE' }),
    uploadRadiograph: (patientId, file) => {
      const formData = new FormData();
      formData.append('file', file);
      return request(`patients/upload.php?id=${patientId || 0}`, {
        method: 'POST',
        headers: {},
        body: formData
      });
    },

    // Predict & Reports
    runPrediction: (patientId, payload) => request(`predict/index.php?id=${patientId || 0}`, { method: 'POST', body: JSON.stringify(payload) }),
    downloadReportUrl: (patientId) => `${baseUrl}report/index.php?id=${patientId || 1}`,

    // Notifications & Appointments
    getNotifications: () => request('notifications/index.php'),
    markAllNotificationsRead: () => request('notifications/mark_all_read.php', { method: 'POST' }),
    getAppointments: () => request('appointments/index.php'),
    createAppointment: (data) => request('appointments/index.php', { method: 'POST', body: JSON.stringify(data) })
  };
})();
