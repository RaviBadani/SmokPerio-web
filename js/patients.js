/**
 * SmokPerio AI — Patient Cohort & Clinical Dossier Management
 */

const Patients = (function () {
  let patientList = [];
  let activeFilter = 'ALL';
  let activeSearch = '';

  async function render(container) {
    const user = Api.getUser() || { id: 1 };
    
    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;">
        <div>
          <h1 style="font-size:26px;color:var(--navy);margin-bottom:4px;">Patient Clinical Cohort</h1>
          <p style="color:var(--text-secondary);font-size:13.5px;">Manage patient profiles, clinical probing charts, and analyzed radiographs</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="Patients.showAddModal()">
          <span>+ Add New Patient</span>
        </button>
      </div>

      <!-- Search & Multi-Filter Bar -->
      <div class="clinical-card" style="padding:16px 20px;margin-bottom:24px;">
        <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
          <input type="text" id="pSearch" class="form-control" placeholder="🔍 Search patient by name..." style="max-width:320px;height:42px;" oninput="Patients.handleSearch(this.value)" />
          
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary btn-sm filter-pill active" data-f="ALL" onclick="Patients.setFilter('ALL')">All Patients</button>
            <button class="btn btn-secondary btn-sm filter-pill" data-f="HIGH" onclick="Patients.setFilter('HIGH')">High Risk</button>
            <button class="btn btn-secondary btn-sm filter-pill" data-f="HEAVY" onclick="Patients.setFilter('HEAVY')">Heavy Smokers</button>
            <button class="btn btn-secondary btn-sm filter-pill" data-f="NON" onclick="Patients.setFilter('NON')">Non-Smokers</button>
          </div>
        </div>
      </div>

      <!-- Cohort Table Card -->
      <div class="clinical-card">
        <div class="table-scrollable">
          <table class="modern-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Patient Name</th>
                <th>Age / Sex</th>
                <th>Smoking History</th>
                <th>Probing (CAL / PPD)</th>
                <th>Bone Loss (%)</th>
                <th>AI Risk Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="pTableBody">
              <tr><td colspan="8" style="text-align:center;color:var(--text-tertiary);padding:36px;">Loading cohort data...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    loadPatients(user.id);
  }

  async function loadPatients(practitionerId) {
    try {
      patientList = await Api.listPatients(practitionerId);
      renderTable();
    } catch (err) {
      console.error(err);
    }
  }

  function handleSearch(val) {
    activeSearch = val.toLowerCase().trim();
    renderTable();
  }

  function setFilter(filter) {
    activeFilter = filter;
    document.querySelectorAll('.filter-pill').forEach(btn => {
      const isMatch = btn.getAttribute('data-f') === filter;
      btn.classList.toggle('active', isMatch);
      btn.style.background = isMatch ? 'var(--navy)' : '#E2E8F0';
      btn.style.color = isMatch ? 'white' : 'var(--navy)';
    });
    renderTable();
  }

  function renderTable() {
    const tbody = document.getElementById('pTableBody');
    if (!tbody) return;

    let filtered = patientList.filter(p => {
      const matchSearch = !activeSearch || (p.name && p.name.toLowerCase().includes(activeSearch));
      let matchFilter = true;

      if (activeFilter === 'HIGH') {
        const r = (p.predictions && p.predictions[0] && p.predictions[0].result) ? p.predictions[0].result.risk_level : '';
        matchFilter = (r === 'HIGH');
      } else if (activeFilter === 'HEAVY') {
        matchFilter = (p.cigarettes_per_day >= 15 || p.pack_years >= 15);
      } else if (activeFilter === 'NON') {
        matchFilter = (p.cigarettes_per_day === 0);
      }

      return matchSearch && matchFilter;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-tertiary);padding:36px;">No matching patient records found.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(p => {
      let riskBadge = '<span class="pill-badge low">LOW RISK</span>';
      if (p.predictions && p.predictions.length > 0 && p.predictions[0].result) {
        const r = p.predictions[0].result.risk_level;
        if (r === 'HIGH') riskBadge = '<span class="pill-badge high">HIGH RISK</span>';
        else if (r === 'MODERATE' || r === 'MEDIUM') riskBadge = '<span class="pill-badge moderate">MODERATE</span>';
      }

      const calAvg = p.cal_values && Array.isArray(p.cal_values) ? (p.cal_values.reduce((a, b) => a + b, 0) / p.cal_values.length).toFixed(1) : '3.5';
      const ppdAvg = p.ppd_values && Array.isArray(p.ppd_values) ? (p.ppd_values.reduce((a, b) => a + b, 0) / p.ppd_values.length).toFixed(1) : '3.2';

      return `
        <tr>
          <td><span style="font-family:monospace;font-weight:700;color:var(--text-tertiary);">#${p.id}</span></td>
          <td><strong style="color:var(--navy);cursor:pointer;font-weight:700;" onclick="Patients.showDetail(${p.id})">${p.name}</strong></td>
          <td>${p.age} yrs · ${p.gender || 'M'}</td>
          <td>
            <div style="font-size:12.5px;font-weight:600;color:${p.cigarettes_per_day >= 15 ? 'var(--risk-high)' : 'var(--text-secondary)'};">
              ${p.smoking_status || 'Smoker'} (${p.cigarettes_per_day || 0} cigs/d)
            </div>
            <div style="font-size:11px;color:var(--text-tertiary);">${p.pack_years || 0} pack-years</div>
          </td>
          <td>
            <div style="font-size:12.5px;">CAL: <strong>${calAvg}mm</strong></div>
            <div style="font-size:11px;color:var(--text-tertiary);">PPD: ${ppdAvg}mm</div>
          </td>
          <td>
            <strong>${p.radiographic_bone_loss || 0}%</strong>
            ${p.furcation_involvement ? '<span style="font-size:10px;color:var(--risk-med);display:block;font-weight:700;">Furcation: Yes</span>' : ''}
          </td>
          <td>${riskBadge}</td>
          <td>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-secondary btn-sm" onclick="Patients.showDetail(${p.id})">Open File</button>
              <button class="btn btn-outline btn-sm" onclick="Patients.downloadPdf(${p.id})">📄 PDF</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  async function showDetail(patientId) {
    try {
      const p = await Api.getPatient(patientId);

      const modalHtml = `
        <div class="modal-backdrop-layer" id="patientDetailModal">
          <div class="modal-window-card" style="max-width:780px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;">
              <div>
                <h2 style="font-size:24px;color:var(--navy);font-family:'Outfit',sans-serif;">${p.name}</h2>
                <p style="font-size:13.5px;color:var(--text-secondary);">
                  ${p.age} yrs · ${p.gender} · ${p.smoking_status} (${p.cigarettes_per_day} cigs/day, ${p.pack_years} pack-years)
                </p>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="Patients.closeDetailModal()">✕ Close</button>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:24px;">
              <!-- Parameters Card -->
              <div style="background:#F8FAFC;border-radius:var(--radius-md);padding:18px;border:1px solid var(--border);">
                <h4 style="font-size:14px;color:var(--navy);margin-bottom:10px;">Clinical Periodontal Indices</h4>
                <div style="font-size:13px;line-height:1.9;">
                  <div>• Radiographic Bone Loss: <strong>${p.radiographic_bone_loss || 0}%</strong></div>
                  <div>• Furcation Involvement: <strong>${p.furcation_involvement ? 'Detected (Class II)' : 'None'}</strong></div>
                  <div>• IL-6 Biomarker: <strong>${p.il6_level ? p.il6_level + ' pg/mL' : '6.5 pg/mL'}</strong></div>
                  <div>• TNF-α Biomarker: <strong>${p.tnf_alpha ? p.tnf_alpha + ' pg/mL' : '4.2 pg/mL'}</strong></div>
                </div>
              </div>

              <!-- Radiograph Scan Card -->
              <div style="background:#F8FAFC;border-radius:var(--radius-md);padding:18px;border:1px solid var(--border);text-align:center;">
                <h4 style="font-size:14px;color:var(--navy);margin-bottom:10px;">Dental Radiograph Scan</h4>
                ${p.radiograph_path ? `
                  <img src="${Api.getBaseUrl() + p.radiograph_path}" style="max-height:100px;border-radius:8px;border:2px solid #0B132B;" alt="X-Ray" />
                  <div style="font-size:11.5px;color:var(--primary);font-weight:800;margin-top:6px;">✓ Scanned &amp; Analyzed via CV</div>
                ` : `
                  <div style="padding:16px;color:var(--text-tertiary);font-size:12px;">No radiograph image attached.</div>
                `}
                <label class="btn btn-outline btn-sm" style="margin-top:10px;cursor:pointer;display:inline-block;">
                  <span>Upload / Replace Radiograph</span>
                  <input type="file" accept="image/*" style="display:none;" onchange="Patients.handleUploadXray(${p.id}, this.files[0])" />
                </label>
              </div>
            </div>

            <!-- Latest Assessment -->
            <div style="background:linear-gradient(135deg, #1A3557, #0B132B);color:white;border-radius:var(--radius-md);padding:22px;margin-bottom:24px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <h4 style="color:white;font-size:15px;font-family:'Outfit',sans-serif;">2017 AAP/EFP Periodontal AI Assessment</h4>
                <button class="btn btn-primary btn-sm" style="background:#0D9488;" onclick="Patients.runAiOnPatient(${p.id})">⚡ Re-run AI Analysis</button>
              </div>
              ${p.predictions && p.predictions.length > 0 && p.predictions[0].result ? `
                <div style="display:flex;gap:24px;align-items:center;margin-top:12px;">
                  <div style="font-size:40px;font-weight:900;color:#2DD4BF;font-family:'Outfit',sans-serif;">${p.predictions[0].result.risk_score || 78}<span style="font-size:16px;color:#94A3B8;">/100</span></div>
                  <div>
                    <div style="font-size:15px;font-weight:700;color:white;">${p.predictions[0].result.stage || 'Stage III'} · ${p.predictions[0].result.grade || 'Grade C'} (${p.predictions[0].result.risk_level || 'HIGH'} RISK)</div>
                    <div style="font-size:12.5px;color:#B0DEFF;margin-top:2px;">5-Year Progression Rate: ${p.predictions[0].result.progression_5y || 85}%</div>
                  </div>
                </div>
              ` : `
                <p style="font-size:13px;color:#B0DEFF;">No AI assessment run on this patient yet. Click "Re-run AI Analysis" above.</p>
              `}
            </div>

            <!-- Action Buttons -->
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <button class="btn btn-danger btn-sm" onclick="Patients.deletePatient(${p.id})">Delete Patient</button>
              <button class="btn btn-primary" onclick="Patients.downloadPdf(${p.id})">📄 Download Clinical PDF Report</button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    } catch (err) {
      alert('Failed to load patient detail: ' + err.message);
    }
  }

  function closeDetailModal() {
    const el = document.getElementById('patientDetailModal');
    if (el) el.remove();
  }

  function showAddModal() {
    const user = Api.getUser() || { id: 1 };

    const modalHtml = `
      <div class="modal-backdrop-layer" id="addPatientModal">
        <div class="modal-window-card" style="max-width:640px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
            <h2 style="font-size:22px;color:var(--navy);font-family:'Outfit',sans-serif;">Add New Patient Profile</h2>
            <button class="btn btn-secondary btn-sm" onclick="Patients.closeAddModal()">✕</button>
          </div>

          <form id="addPatientForm" onsubmit="Patients.handleAddPatient(event, ${user.id})">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" id="addName" class="form-control" placeholder="e.g. Ramesh Kumar" required />
              </div>
              <div class="form-group" style="max-width:120px;">
                <label class="form-label">Age</label>
                <input type="number" id="addAge" class="form-control" placeholder="45" required />
              </div>
              <div class="form-group" style="max-width:140px;">
                <label class="form-label">Gender</label>
                <select id="addGender" class="form-control">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <!-- Smoking -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Cigs / Day</label>
                <input type="number" id="addCigs" class="form-control" placeholder="15" value="15" oninput="Patients.calcPackYears()" />
              </div>
              <div class="form-group">
                <label class="form-label">Years Smoking</label>
                <input type="number" id="addYears" class="form-control" placeholder="15" value="15" oninput="Patients.calcPackYears()" />
              </div>
              <div class="form-group">
                <label class="form-label">Pack-Years</label>
                <input type="text" id="addPackYears" class="form-control" value="11.25" readonly style="background:#E2E8F0;font-weight:800;" />
              </div>
            </div>

            <!-- Probing & Bone Loss -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Mean CAL (mm)</label>
                <input type="number" step="0.1" id="addCal" class="form-control" placeholder="4.5" value="4.5" />
              </div>
              <div class="form-group">
                <label class="form-label">Mean PPD (mm)</label>
                <input type="number" step="0.1" id="addPpd" class="form-control" placeholder="4.0" value="4.0" />
              </div>
              <div class="form-group">
                <label class="form-label">Bone Loss (%)</label>
                <input type="number" step="0.1" id="addBoneLoss" class="form-control" placeholder="35.0" value="35.0" />
              </div>
            </div>

            <div style="margin-bottom:20px;">
              <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
                <input type="checkbox" id="addFurcation" />
                <span>Furcation Radiolucency Detected at Multi-Rooted Molars</span>
              </label>
            </div>

            <div style="display:flex;gap:12px;justify-content:flex-end;">
              <button type="button" class="btn btn-secondary" onclick="Patients.closeAddModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" id="btnSavePatient">Save Patient Profile</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  function calcPackYears() {
    const cigs = parseFloat(document.getElementById('addCigs').value) || 0;
    const yrs = parseFloat(document.getElementById('addYears').value) || 0;
    document.getElementById('addPackYears').value = ((cigs / 20.0) * yrs).toFixed(2);
  }

  function closeAddModal() {
    const el = document.getElementById('addPatientModal');
    if (el) el.remove();
  }

  async function handleAddPatient(e, practitionerId) {
    e.preventDefault();
    const name = document.getElementById('addName').value.trim();
    const age = parseInt(document.getElementById('addAge').value) || 45;
    const gender = document.getElementById('addGender').value;
    const cigs = parseInt(document.getElementById('addCigs').value) || 0;
    const years = parseInt(document.getElementById('addYears').value) || 0;
    const packYears = parseFloat(document.getElementById('addPackYears').value) || 0;
    const cal = parseFloat(document.getElementById('addCal').value) || 3.5;
    const ppd = parseFloat(document.getElementById('addPpd').value) || 3.0;
    const boneLoss = parseFloat(document.getElementById('addBoneLoss').value) || 20.0;
    const furcation = document.getElementById('addFurcation').checked;

    const btn = document.getElementById('btnSavePatient');
    btn.disabled = true;
    btn.innerHTML = 'Saving profile...';

    try {
      await Api.createPatient({
        practitioner_id: practitionerId,
        name,
        age,
        gender,
        cigarettes_per_day: cigs,
        years_smoking: years,
        pack_years: packYears,
        smoking_status: cigs >= 15 ? 'Heavy Smoker' : (cigs > 0 ? 'Light Smoker' : 'Non-Smoker'),
        cal_values: [Math.round(cal), Math.round(cal + 1), Math.round(cal)],
        ppd_values: [Math.round(ppd), Math.round(ppd + 1), Math.round(ppd)],
        radiographic_bone_loss: boneLoss,
        furcation_involvement: furcation ? 1 : 0
      });

      Api.showToast('Patient record saved!', 'success');
      closeAddModal();
      loadPatients(practitionerId);
    } catch (err) {
      alert('Failed to save patient: ' + err.message);
      btn.disabled = false;
      btn.innerHTML = 'Save Patient Profile';
    }
  }

  async function handleUploadXray(patientId, file) {
    if (!file) return;
    try {
      await Api.uploadRadiograph(patientId, file);
      Api.showToast('Dental radiograph uploaded & analyzed!', 'success');
      closeDetailModal();
      showDetail(patientId);
      loadPatients(Api.getUser().id);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
  }

  async function runAiOnPatient(patientId) {
    try {
      await Api.runPrediction(patientId, {});
      Api.showToast('AI assessment updated!', 'success');
      closeDetailModal();
      showDetail(patientId);
      loadPatients(Api.getUser().id);
    } catch (err) {
      alert('AI analysis failed: ' + err.message);
    }
  }

  async function deletePatient(patientId) {
    if (!confirm('Are you sure you want to delete this patient profile?')) return;
    try {
      await Api.deletePatient(patientId);
      Api.showToast('Patient record deleted', 'info');
      closeDetailModal();
      loadPatients(Api.getUser().id);
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  }

  function downloadPdf(patientId) {
    window.open(Api.downloadReportUrl(patientId), '_blank');
  }

  return {
    render,
    showAddModal,
    closeAddModal,
    showDetail,
    closeDetailModal,
    handleSearch,
    setFilter,
    calcPackYears,
    handleAddPatient,
    handleUploadXray,
    runAiOnPatient,
    deletePatient,
    downloadPdf
  };
})();
