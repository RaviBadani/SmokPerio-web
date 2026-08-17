/**
 * SmokPerio AI — Notifications Controller
 */

const Notifications = (function () {
  async function render(container) {
    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
        <div>
          <h1 style="font-size:24px;margin-bottom:4px;">Notifications &amp; Clinical Alerts</h1>
          <p style="color:var(--text-secondary);font-size:13px;">Automated diagnostic updates, appointment reminders, and sync status</p>
        </div>
        <button class="btn btn-outline btn-sm" onclick="Notifications.markAllRead()">
          <span>✓ Mark All as Read</span>
        </button>
      </div>

      <div class="card" id="notificationsListCard">
        <div style="text-align:center;padding:30px;color:var(--text-muted);">Loading notifications...</div>
      </div>
    `;

    loadNotifications();
  }

  async function loadNotifications() {
    try {
      const list = await Api.getNotifications();
      const container = document.getElementById('notificationsListCard');
      if (!container) return;

      if (!list || list.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:36px;color:var(--text-muted);">No new notifications.</div>';
        return;
      }

      container.innerHTML = list.map(n => {
        const icon = n.type === 'alert' ? '⚠️' : (n.type === 'success' ? '✅' : 'ℹ️');
        const bg = n.is_read ? 'transparent' : '#F0FDFA';
        return `
          <div style="display:flex;gap:16px;align-items:center;padding:16px;border-bottom:1px solid var(--border-color);background:${bg};border-radius:var(--radius-md);">
            <div style="font-size:24px;">${icon}</div>
            <div style="flex:1;">
              <strong style="font-size:14px;color:var(--navy);display:block;margin-bottom:2px;">${n.title}</strong>
              <p style="font-size:12px;color:var(--text-secondary);margin:0;">${n.body}</p>
            </div>
            <span style="font-size:11px;color:var(--text-muted);">${n.created_at || 'Recent'}</span>
          </div>
        `;
      }).join('');
    } catch (e) {
      console.warn('Notifications notice:', e);
    }
  }

  async function markAllRead() {
    try {
      await Api.markAllNotificationsRead();
      loadNotifications();
    } catch (e) {}
  }

  return { render, markAllRead };
})();
