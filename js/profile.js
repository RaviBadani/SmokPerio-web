/**
 * SmokPerio AI — Executive Doctor Profile & Clinical Settings Center
 */

const Profile = (function () {
  async function render(container) {
    const user = Api.getUser() || {
      name: 'Dr. Ravi Kumar',
      email: 'doctor@simats.edu',
      specialization: 'Periodontist Specialist',
      clinic_name: 'SIMATS Institute of Dental Sciences',
      phone: '+91 98765 43210'
    };

    const initial = user.name ? user.name.charAt(0).toUpperCase() : 'D';

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;">
        <div>
          <h1 style="font-size:26px;color:var(--navy);margin-bottom:4px;">Doctor Profile &amp; Clinical Settings</h1>
          <p style="color:var(--text-secondary);font-size:13.5px;">Manage practitioner credentials, hospital affiliation, and diagnostic parameters</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1.8fr;gap:28px;align-items:start;">
        <!-- Left: Executive Clinician Profile Card -->
        <div>
          <div class="clinical-card" style="text-align:center;padding:36px 24px;border-top:4px solid var(--primary);position:relative;overflow:hidden;">
            <!-- Background glow aura -->
            <div style="position:absolute;top:-30px;right:-30px;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle, rgba(13,148,136,0.15) 0%, transparent 70%);pointer-events:none;"></div>

            <!-- Avatar -->
            <div style="position:relative;width:96px;height:96px;margin:0 auto 18px;">
              <div style="width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg, #1A3557, #0D9488);display:flex;align-items:center;justify-content:center;font-size:38px;font-weight:900;color:white;box-shadow:0 8px 24px var(--primary-glow);border:3px solid white;">
                ${initial}
              </div>
              <div style="position:absolute;bottom:4px;right:4px;width:18px;height:18px;border-radius:50%;background:#10B981;border:3px solid white;" title="Active Clinician"></div>
            </div>

            <h2 style="font-size:22px;color:var(--navy);font-family:'Outfit',sans-serif;margin-bottom:4px;">${user.name}</h2>
            <div style="display:inline-flex;align-items:center;gap:6px;background:var(--primary-surface);color:var(--primary);padding:4px 12px;border-radius:var(--radius-full);font-size:12px;font-weight:800;letter-spacing:0.5px;margin-bottom:12px;">
              <span>Verified Periodontist</span>
            </div>
            
            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:24px;">
              ${user.clinic_name || 'SIMATS Dental Hospital'}
            </div>

            <!-- Profile Attributes List -->
            <div style="border-top:1px solid var(--border);padding-top:20px;text-align:left;display:flex;flex-direction:column;gap:12px;font-size:13px;">
              <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#F8FAFC;border-radius:var(--radius-md);border:1px solid var(--border);">
                <span style="font-size:16px;">📧</span>
                <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                  <div style="font-size:10.5px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;">Primary Email</div>
                  <strong style="color:var(--navy);font-size:12.5px;">${user.email}</strong>
                </div>
              </div>

              <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#F8FAFC;border-radius:var(--radius-md);border:1px solid var(--border);">
                <span style="font-size:16px;">📱</span>
                <div>
                  <div style="font-size:10.5px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;">Contact Phone</div>
                  <strong style="color:var(--navy);font-size:12.5px;">${user.phone || '+91 98765 43210'}</strong>
                </div>
              </div>

              <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#F8FAFC;border-radius:var(--radius-md);border:1px solid var(--border);">
                <span style="font-size:16px;">🏛️</span>
                <div>
                  <div style="font-size:10.5px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;">Specialization</div>
                  <strong style="color:var(--navy);font-size:12.5px;">${user.specialization || 'Periodontal Risk Specialist'}</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- System Info Card -->
          <div class="clinical-card" style="background:linear-gradient(135deg, #1A3557 0%, #0B132B 100%);color:white;padding:24px;">
            <div style="font-size:12px;font-weight:800;color:#2DD4BF;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Platform Status</div>
            <div style="font-size:15px;font-weight:700;margin-bottom:4px;">SmokPerio AI v2.0 Production</div>
            <div style="font-size:12px;color:#B0DEFF;line-height:1.6;">
              Connected to SIMATS Institute of Dental Sciences Periodontal Core. Real-time data sync with Native Android Suite.
            </div>
          </div>
        </div>

        <!-- Right: Edit Profile & Clinical Settings Form -->
        <div>
          <!-- Edit Form Card -->
          <div class="clinical-card" style="margin-bottom:28px;">
            <h3 class="card-heading-title" style="margin-bottom:20px;">Practitioner Clinical Information</h3>

            <form id="profileForm" onsubmit="Profile.handleSave(event)">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Clinician Full Name</label>
                  <div class="input-with-icon">
                    <span class="input-icon-left">👤</span>
                    <input type="text" id="profName" class="form-control" value="${user.name || ''}" placeholder="Dr. Ravi Kumar" required />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Medical Specialization</label>
                  <div class="input-with-icon">
                    <span class="input-icon-left">🩺</span>
                    <input type="text" id="profSpec" class="form-control" value="${user.specialization || 'Periodontist'}" placeholder="Periodontist Specialist" />
                  </div>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Hospital / Clinic Name</label>
                  <div class="input-with-icon">
                    <span class="input-icon-left">🏥</span>
                    <input type="text" id="profClinic" class="form-control" value="${user.clinic_name || 'SIMATS Dental Hospital'}" placeholder="Hospital Name" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Contact Phone</label>
                  <div class="input-with-icon">
                    <span class="input-icon-left">📞</span>
                    <input type="tel" id="profPhone" class="form-control" value="${user.phone || ''}" placeholder="+91 98765 43210" />
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Registered Email Address (Verified)</label>
                <div class="input-with-icon">
                  <span class="input-icon-left">🔒</span>
                  <input type="email" class="form-control" value="${user.email || ''}" readonly style="background:#E2E8F0;color:var(--navy);font-weight:600;" />
                </div>
              </div>

              <div style="display:flex;justify-content:flex-end;margin-top:28px;">
                <button type="submit" id="btnSaveProfile" class="btn btn-primary" style="max-width:240px;">
                  <span>💾 Save Profile Changes</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Diagnostic Engine Preferences Card -->
          <div class="clinical-card">
            <h3 class="card-heading-title" style="margin-bottom:18px;">Diagnostic Engine Preferences</h3>

            <div style="display:flex;flex-direction:column;gap:14px;">
              <div style="display:flex;justify-content:space-between;align-items:center;padding:14px;background:#F8FAFC;border:1px solid var(--border);border-radius:var(--radius-md);">
                <div>
                  <strong style="font-size:14px;color:var(--navy);display:block;">AAP/EFP 2017 World Workshop Classification</strong>
                  <span style="font-size:12px;color:var(--text-secondary);">Enforce Stage I–IV and Grade A–C progression scoring</span>
                </div>
                <span class="pill-badge low">ENABLED</span>
              </div>

              <div style="display:flex;justify-content:space-between;align-items:center;padding:14px;background:#F8FAFC;border:1px solid var(--border);border-radius:var(--radius-md);">
                <div>
                  <strong style="font-size:14px;color:var(--navy);display:block;">Mandatory Dental Radiograph (X-Ray) CV</strong>
                  <span style="font-size:12px;color:var(--text-secondary);">Alveolar crest radiolucency &amp; bone loss measurement</span>
                </div>
                <span class="pill-badge low">ACTIVE</span>
              </div>

              <div style="display:flex;justify-content:space-between;align-items:center;padding:14px;background:#F8FAFC;border:1px solid var(--border);border-radius:var(--radius-md);">
                <div>
                  <strong style="font-size:14px;color:var(--navy);display:block;">Direct Personal Gmail SMTP Forwarder</strong>
                  <span style="font-size:12px;color:var(--text-secondary);">Zero 3rd-party API dependencies for OTP security codes</span>
                </div>
                <span class="pill-badge low">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function handleSave(e) {
    e.preventDefault();
    const user = Api.getUser() || {};
    const name = document.getElementById('profName').value.trim();
    const spec = document.getElementById('profSpec').value.trim();
    const clinic = document.getElementById('profClinic').value.trim();
    const phone = document.getElementById('profPhone').value.trim();

    const btn = document.getElementById('btnSaveProfile');
    btn.disabled = true;
    btn.innerHTML = 'Saving updates...';

    try {
      await Api.updateProfile({
        id: user.id,
        name,
        specialization: spec,
        clinic_name: clinic,
        phone
      });

      user.name = name;
      user.specialization = spec;
      user.clinic_name = clinic;
      user.phone = phone;
      Api.setSession(Api.getToken(), user);

      Api.showToast('Profile updated successfully!', 'success');
      App.updateSidebarUser();
      render(document.getElementById('viewport'));
    } catch (err) {
      alert('Update failed: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '💾 Save Profile Changes';
    }
  }

  return { render, handleSave };
})();
