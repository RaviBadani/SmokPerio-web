/**
 * SmokPerio AI — Appointments Controller
 */

const Appointments = (function () {
  async function render(container) {
    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
        <div>
          <h1 style="font-size:24px;margin-bottom:4px;">Periodontal Consultations &amp; Recalls</h1>
          <p style="color:var(--text-secondary);font-size:13px;">Manage 3-month and 6-month clinical maintenance recall schedules</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="Appointments.showScheduleModal()">
          <span>+ Schedule Appointment</span>
        </button>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="clinical-table">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Date</th>
                <th>Time</th>
                <th>Clinical Notes / Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="appointmentsTableBody">
              <tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:30px;">Loading appointments...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    loadAppointments();
  }

  async function loadAppointments() {
    try {
      const list = await Api.getAppointments();
      const tbody = document.getElementById('appointmentsTableBody');
      if (!tbody) return;

      if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:30px;">No scheduled appointments found.</td></tr>';
        return;
      }

      tbody.innerHTML = list.map(a => `
        <tr>
          <td><strong style="color:var(--navy);">${a.patient_name || 'Patient'}</strong></td>
          <td>${a.date}</td>
          <td>${a.time}</td>
          <td><span style="font-size:12px;color:var(--text-secondary);">${a.notes || 'Routine follow-up'}</span></td>
          <td>
            <span class="badge-risk ${a.status === 'Completed' ? 'low' : (a.status === 'Cancelled' ? 'high' : 'moderate')}">
              ${a.status || 'Scheduled'}
            </span>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      console.warn('Appointments notice:', e);
    }
  }

  function showScheduleModal() {
    const modalHtml = `
      <div class="modal-overlay" id="appointmentModal">
        <div class="modal-content" style="max-width:480px;">
          <h3 style="color:var(--navy);margin-bottom:16px;">Schedule Consultation</h3>
          <form onsubmit="Appointments.handleSchedule(event)">
            <div class="form-group">
              <label class="form-label">Patient Name</label>
              <input type="text" id="apPatientName" class="form-input" placeholder="e.g. John Doe" required />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Date</label>
                <input type="date" id="apDate" class="form-input" required />
              </div>
              <div class="form-group">
                <label class="form-label">Time</label>
                <input type="time" id="apTime" class="form-input" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Clinical Note</label>
              <textarea id="apNotes" class="form-input" style="height:80px;padding-top:10px;" placeholder="3-month SRP maintenance recall..."></textarea>
            </div>
            <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
              <button type="button" class="btn btn-secondary" onclick="Appointments.closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Book Consultation</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  function closeModal() {
    const m = document.getElementById('appointmentModal');
    if (m) m.remove();
  }

  async function handleSchedule(e) {
    e.preventDefault();
    const user = Api.getUser() || { id: 1 };
    const patient_name = document.getElementById('apPatientName').value.trim();
    const date = document.getElementById('apDate').value;
    const time = document.getElementById('apTime').value;
    const notes = document.getElementById('apNotes').value.trim();

    try {
      await Api.createAppointment({
        practitioner_id: user.id,
        patient_name,
        date,
        time,
        notes,
        status: 'Scheduled'
      });
      closeModal();
      loadAppointments();
    } catch (err) {
      alert('Failed to schedule: ' + err.message);
    }
  }

  return { render, showScheduleModal, closeModal, handleSchedule };
})();
