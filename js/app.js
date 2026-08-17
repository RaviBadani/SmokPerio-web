/**
 * SmokPerio AI — Next-Gen Main Application Lifecycle & Router
 */

const App = (function () {
  let currentRoute = 'dashboard';

  function init() {
    const root = document.getElementById('app');

    if (!Api.isAuthenticated()) {
      root.innerHTML = Auth.renderLogin();
      return;
    }

    renderWorkspace();
  }

  function renderWorkspace() {
    const root = document.getElementById('app');
    const user = Api.getUser() || { name: 'Doctor' };

    root.innerHTML = `
      <!-- Sidebar -->
      <aside class="app-sidebar">
        <div class="sidebar-brand-box">
          <div class="sidebar-logo">🦷</div>
          <div>
            <div class="sidebar-brand-name">SmokPerio AI</div>
            <div class="sidebar-brand-tag">Clinical Diagnostic Suite</div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a class="nav-link-item active" data-route="dashboard" onclick="App.navigate('dashboard')">
            <span class="nav-link-icon">📊</span>
            <span>Dashboard</span>
          </a>
          <a class="nav-link-item" data-route="patients" onclick="App.navigate('patients')">
            <span class="nav-link-icon">👥</span>
            <span>Patient Cohort</span>
          </a>
          <a class="nav-link-item" data-route="predictor" onclick="App.navigate('predictor')">
            <span class="nav-link-icon">🧠</span>
            <span>AI Predictor</span>
          </a>
          <a class="nav-link-item" data-route="analytics" onclick="App.navigate('analytics')">
            <span class="nav-link-icon">📈</span>
            <span>Analytics Hub</span>
          </a>
          <a class="nav-link-item" data-route="appointments" onclick="App.navigate('appointments')">
            <span class="nav-link-icon">📅</span>
            <span>Consultations</span>
          </a>
          <a class="nav-link-item" data-route="notifications" onclick="App.navigate('notifications')">
            <span class="nav-link-icon">🔔</span>
            <span>Clinical Alerts</span>
          </a>
          <a class="nav-link-item" data-route="profile" onclick="App.navigate('profile')">
            <span class="nav-link-icon">⚙️</span>
            <span>Settings</span>
          </a>
        </nav>

        <div class="sidebar-user-footer">
          <div class="doctor-profile-card">
            <div class="doctor-avatar-circle" id="sidebarAvatar">${user.name ? user.name.charAt(0) : 'D'}</div>
            <div class="doctor-meta">
              <div class="doctor-name-text" id="sidebarName">${user.name}</div>
              <div class="doctor-role-text" id="sidebarSpec">${user.specialization || 'Periodontist'}</div>
            </div>
            <button onclick="Auth.logout()" title="Sign Out" style="background:none;border:none;color:#94A3B8;cursor:pointer;font-size:16px;padding:4px;">
              🚪
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Workspace -->
      <main class="app-main">
        <header class="topbar-header">
          <div class="topbar-title-wrap">
            <div class="topbar-page-title" id="topbarPageTitle">Clinical Dashboard</div>
          </div>

          <div class="topbar-actions-group">
            <button class="btn btn-outline btn-sm" onclick="App.navigate('predictor')">
              <span>🧠 Run AI Assessment</span>
            </button>
            <button class="btn btn-secondary btn-sm" onclick="Auth.logout()">
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        <div class="content-viewport" id="viewport"></div>
      </main>
    `;

    navigate('dashboard');
  }

  function navigate(route) {
    currentRoute = route;

    document.querySelectorAll('.nav-link-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-route') === route);
    });

    const titleMap = {
      dashboard: 'Clinical Dashboard',
      patients: 'Patient Cohort Directory',
      predictor: 'AI Periodontal Diagnostic Engine',
      analytics: 'Cohort Analytics & Statistics',
      appointments: 'Consultation & Recall Schedule',
      notifications: 'Clinical Alerts & Notifications',
      profile: 'Doctor Profile & Settings'
    };

    const titleEl = document.getElementById('topbarPageTitle');
    if (titleEl && titleMap[route]) titleEl.textContent = titleMap[route];

    const viewport = document.getElementById('viewport');
    if (!viewport) return;

    switch (route) {
      case 'dashboard':
        Dashboard.render(viewport);
        break;
      case 'patients':
        Patients.render(viewport);
        break;
      case 'predictor':
        Predictor.render(viewport);
        break;
      case 'analytics':
        Analytics.render(viewport);
        break;
      case 'appointments':
        Appointments.render(viewport);
        break;
      case 'notifications':
        Notifications.render(viewport);
        break;
      case 'profile':
        Profile.render(viewport);
        break;
      default:
        Dashboard.render(viewport);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateSidebarUser() {
    const user = Api.getUser();
    if (!user) return;
    const nameEl = document.getElementById('sidebarName');
    const specEl = document.getElementById('sidebarSpec');
    const avEl = document.getElementById('sidebarAvatar');
    if (nameEl) nameEl.textContent = user.name;
    if (specEl) specEl.textContent = user.specialization || 'Periodontist';
    if (avEl) avEl.textContent = user.name ? user.name.charAt(0) : 'D';
  }

  return { init, navigate, updateSidebarUser };
})();

window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
