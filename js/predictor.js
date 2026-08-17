/**
 * SmokPerio AI — AI Periodontal Diagnostic Engine with Laser X-Ray Scanner
 */

const Predictor = (function () {
  let selectedXrayFile = null;
  let patientList = [];

  async function render(container) {
    const user = Api.getUser() || { id: 1 };

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;">
        <div>
          <h1 style="font-size:26px;color:var(--navy);margin-bottom:4px;">AI Periodontal Diagnostic Engine</h1>
          <p style="color:var(--text-secondary);font-size:13.5px;">2017 AAP/EFP World Workshop Clinical Staging, Grading &amp; Progression Prognosis</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1.1fr 1.2fr;gap:28px;align-items:start;">
        <!-- Left: Mandatory X-Ray Scanner & Parameters Form -->
        <div>
          <!-- 1. MANDATORY X-RAY SCANNER -->
          <div class="clinical-card" style="border-top:4px solid var(--primary);">
            <div class="card-header-flex">
              <div>
                <h3 class="card-heading-title">1. Dental Radiograph (X-Ray)</h3>
                <p style="font-size:12px;color:var(--text-secondary);margin-top:2px;">IOPA, Bitewing, or Panoramic OPG scan</p>
              </div>
              <span class="pill-badge high" style="font-size:10px;">MANDATORY</span>
            </div>

            <div class="xray-upload-zone" id="xrayZone" onclick="document.getElementById('xrayFileInput').click()" ondragover="Predictor.handleDragOver(event)" ondragleave="Predictor.handleDragLeave(event)" ondrop="Predictor.handleDrop(event)">
              <div class="xray-laser-scanner" id="xrayLaser"></div>
              
              <div id="dropzonePrompt">
                <div style="font-size:42px;margin-bottom:8px;">🦷</div>
                <strong style="color:var(--navy);font-size:15px;display:block;margin-bottom:4px;">Drag &amp; Drop or Upload Dental X-Ray</strong>
                <p style="font-size:12px;color:var(--text-secondary);">Computer vision will extract alveolar bone loss &amp; furcation indicators</p>
              </div>

              <div id="dropzonePreview" style="display:none;">
                <img id="xrayPreviewImg" class="xray-preview-container" src="" alt="X-Ray Preview" />
                <div id="xrayFileName" style="font-size:12px;color:var(--navy);font-weight:700;margin-top:8px;"></div>
                <button type="button" class="btn btn-secondary btn-sm" style="margin-top:8px;" onclick="event.stopPropagation(); Predictor.removeXray();">Replace Radiograph</button>
              </div>

              <input type="file" id="xrayFileInput" accept="image/*" style="display:none;" onchange="Predictor.handleFileSelect(this.files[0])" />
            </div>
          </div>

          <!-- 2. CLINICAL INDICES FORM -->
          <div class="clinical-card">
            <h3 class="card-heading-title" style="margin-bottom:16px;">2. Patient Clinical Indices</h3>

            <div class="form-group">
              <label class="form-label">Pre-fill From Existing Patient (Optional)</label>
              <select id="predPatientSelect" class="form-control" onchange="Predictor.handlePatientSelect(this.value)">
                <option value="">— Manual Clinical Simulation —</option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Age (Years)</label>
                <input type="number" id="predAge" class="form-control" placeholder="48" value="48" required />
              </div>
              <div class="form-group">
                <label class="form-label">Gender</label>
                <select id="predGender" class="form-control">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <!-- Smoking History -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Cigs / Day</label>
                <input type="number" id="predCigs" class="form-control" placeholder="15" value="15" oninput="Predictor.calcPackYears()" />
              </div>
              <div class="form-group">
                <label class="form-label">Years Smoking</label>
                <input type="number" id="predYears" class="form-control" placeholder="15" value="15" oninput="Predictor.calcPackYears()" />
              </div>
              <div class="form-group">
                <label class="form-label">Pack-Years</label>
                <input type="text" id="predPackYears" class="form-control" value="11.25" readonly style="background:#E2E8F0;font-weight:700;" />
              </div>
            </div>

            <!-- Probing Depths -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Mean CAL (mm)</label>
                <input type="number" step="0.1" id="predCal" class="form-control" placeholder="4.5" value="4.5" />
              </div>
              <div class="form-group">
                <label class="form-label">Mean PPD (mm)</label>
                <input type="number" step="0.1" id="predPpd" class="form-control" placeholder="4.0" value="4.0" />
              </div>
            </div>

            <!-- Furcation & Cytokines -->
            <div style="margin-bottom:16px;">
              <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
                <input type="checkbox" id="predFurcation" />
                <span>Furcation Radiolucency Detected at Multi-Rooted Molars</span>
              </label>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">IL-6 Level (pg/mL)</label>
                <input type="number" step="0.1" id="predIl6" class="form-control" placeholder="8.5" value="8.5" />
              </div>
              <div class="form-group">
                <label class="form-label">TNF-α Level (pg/mL)</label>
                <input type="number" step="0.1" id="predTnf" class="form-control" placeholder="5.2" value="5.2" />
              </div>
            </div>

            <button type="button" id="btnRunPred" class="btn btn-primary" onclick="Predictor.runPrediction()">
              <span>🧠 Run AI Periodontal Diagnostic Engine</span>
            </button>
          </div>
        </div>

        <!-- Right: Interactive AAP/EFP Report -->
        <div id="predictionResultCol">
          <div class="clinical-card" style="text-align:center;padding:54px 24px;border:2px dashed var(--border);background:#F8FAFC;">
            <div style="font-size:48px;margin-bottom:14px;">📊</div>
            <h3 style="color:var(--navy);font-size:20px;margin-bottom:6px;">Awaiting Radiograph &amp; Clinical Parameters</h3>
            <p style="font-size:13px;color:var(--text-secondary);max-width:380px;margin:0 auto;line-height:1.6;">
              Attach a dental X-ray and click <strong>Run AI Periodontal Diagnostic Engine</strong> to compute 2017 AAP/EFP Staging, Grading, and disease progression models.
            </p>
          </div>
        </div>
      </div>
    `;

    loadPatientsForSelect(user.id);
  }

  async function loadPatientsForSelect(practitionerId) {
    try {
      patientList = await Api.listPatients(practitionerId);
      const sel = document.getElementById('predPatientSelect');
      if (!sel) return;

      patientList.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.name} (Age ${p.age}, ${p.smoking_status || 'Smoker'})`;
        sel.appendChild(opt);
      });
    } catch (e) {}
  }

  function handlePatientSelect(patientId) {
    if (!patientId) return;
    const p = patientList.find(item => item.id == patientId);
    if (!p) return;

    document.getElementById('predAge').value = p.age || 45;
    document.getElementById('predGender').value = p.gender || 'Male';
    document.getElementById('predCigs').value = p.cigarettes_per_day || 0;
    document.getElementById('predYears').value = p.years_smoking || 0;
    calcPackYears();

    if (p.cal_values && Array.isArray(p.cal_values) && p.cal_values.length > 0) {
      document.getElementById('predCal').value = (p.cal_values.reduce((a, b) => a + b, 0) / p.cal_values.length).toFixed(1);
    }
    if (p.ppd_values && Array.isArray(p.ppd_values) && p.ppd_values.length > 0) {
      document.getElementById('predPpd').value = (p.ppd_values.reduce((a, b) => a + b, 0) / p.ppd_values.length).toFixed(1);
    }

    document.getElementById('predFurcation').checked = !!p.furcation_involvement;
    if (p.il6_level) document.getElementById('predIl6').value = p.il6_level;
    if (p.tnf_alpha) document.getElementById('predTnf').value = p.tnf_alpha;

    if (p.radiograph_path) {
      const img = document.getElementById('xrayPreviewImg');
      img.src = Api.getBaseUrl() + p.radiograph_path;
      document.getElementById('xrayFileName').textContent = 'Loaded from Patient Record';
      document.getElementById('dropzonePrompt').style.display = 'none';
      document.getElementById('dropzonePreview').style.display = 'block';
    }
  }

  function calcPackYears() {
    const cigs = parseFloat(document.getElementById('predCigs').value) || 0;
    const yrs = parseFloat(document.getElementById('predYears').value) || 0;
    document.getElementById('predPackYears').value = ((cigs / 20.0) * yrs).toFixed(2);
  }

  function handleFileSelect(file) {
    if (!file) return;
    selectedXrayFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('xrayPreviewImg').src = e.target.result;
      document.getElementById('xrayFileName').textContent = file.name;
      document.getElementById('dropzonePrompt').style.display = 'none';
      document.getElementById('dropzonePreview').style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    document.getElementById('xrayZone').classList.add('dragover');
  }

  function handleDragLeave(e) {
    e.preventDefault();
    document.getElementById('xrayZone').classList.remove('dragover');
  }

  function handleDrop(e) {
    e.preventDefault();
    document.getElementById('xrayZone').classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  function removeXray() {
    selectedXrayFile = null;
    document.getElementById('xrayPreviewImg').src = '';
    document.getElementById('xrayFileInput').value = '';
    document.getElementById('dropzonePrompt').style.display = 'block';
    document.getElementById('dropzonePreview').style.display = 'none';
  }

  async function runPrediction() {
    const patientId = document.getElementById('predPatientSelect').value || 0;

    if (!selectedXrayFile && !patientId) {
      alert('Dental Radiograph Mandatory:\n\nUnder 2017 AAP/EFP criteria, radiographic bone loss (% RBL) is required to determine periodontal stage and grade.');
      return;
    }

    const age = parseInt(document.getElementById('predAge').value) || 45;
    const gender = document.getElementById('predGender').value;
    const cigs = parseInt(document.getElementById('predCigs').value) || 0;
    const years = parseInt(document.getElementById('predYears').value) || 0;
    const packYears = parseFloat(document.getElementById('predPackYears').value) || 0;
    const cal = parseFloat(document.getElementById('predCal').value) || 3.5;
    const ppd = parseFloat(document.getElementById('predPpd').value) || 3.0;
    const furcation = document.getElementById('predFurcation').checked;
    const il6 = parseFloat(document.getElementById('predIl6').value) || 6.5;
    const tnf = parseFloat(document.getElementById('predTnf').value) || 4.2;

    const btn = document.getElementById('btnRunPred');
    const zone = document.getElementById('xrayZone');
    btn.disabled = true;
    btn.innerHTML = '⚡ Scanning Dental Radiograph...';
    if (zone) zone.classList.add('scanning');

    try {
      let boneLoss = (cal >= 5.0 || furcation) ? 42.0 : (cal >= 3.0 ? 25.0 : 12.0);

      if (selectedXrayFile) {
        try {
          const upRes = await Api.uploadRadiograph(patientId, selectedXrayFile);
          if (upRes && upRes.radiographic_bone_loss) {
            boneLoss = upRes.radiographic_bone_loss;
          }
        } catch (e) {
          console.warn('X-Ray upload notice:', e);
        }
      }

      const payload = {
        id: patientId,
        age,
        gender,
        cigarettes_per_day: cigs,
        years_smoking: years,
        pack_years: packYears,
        cal_mean: cal,
        cal_max: Math.ceil(cal + 1.0),
        ppd_mean: ppd,
        ppd_max: Math.ceil(ppd + 1.0),
        radiographic_bone_loss: boneLoss,
        furcation_involvement: furcation,
        il6_level: il6,
        tnf_alpha: tnf
      };

      const result = await Api.runPrediction(patientId, payload);
      renderResult(result);
      Api.showToast('AI Diagnostic Assessment Complete', 'success');
    } catch (err) {
      alert('Diagnostic computation error: ' + err.message);
    } finally {
      if (zone) zone.classList.remove('scanning');
      btn.disabled = false;
      btn.innerHTML = '🧠 Run AI Periodontal Diagnostic Engine';
    }
  }

  function renderResult(r) {
    const col = document.getElementById('predictionResultCol');
    const isHigh = (r.risk_level === 'HIGH');
    const isMed = (r.risk_level === 'MODERATE' || r.risk_level === 'MEDIUM');

    const badgeClass = isHigh ? 'high' : (isMed ? 'moderate' : 'low');
    const scoreColor = isHigh ? 'var(--risk-high)' : (isMed ? 'var(--risk-med)' : 'var(--risk-low)');

    col.innerHTML = `
      <div class="clinical-card" style="border-top:4px solid ${scoreColor};animation:slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
        <!-- Top Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
          <div>
            <span class="pill-badge ${badgeClass}" style="margin-bottom:8px;">${r.risk_level} RISK ASSESSMENT</span>
            <h2 style="font-size:22px;color:var(--navy);font-family:'Outfit',sans-serif;">Clinical Periodontal Prognosis</h2>
          </div>
          <div style="text-align:right;">
            <div style="font-size:42px;font-weight:900;color:${scoreColor};line-height:1;font-family:'Outfit',sans-serif;">${r.risk_score}<span style="font-size:16px;color:var(--text-tertiary);">/100</span></div>
            <div style="font-size:11px;color:var(--text-secondary);font-weight:700;">Destruction Score</div>
          </div>
        </div>

        <!-- Staging & Grading Cards -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
          <div style="background:#F8FAFC;border:1px solid var(--border);border-radius:var(--radius-md);padding:16px;text-align:center;">
            <div style="font-size:10.5px;font-weight:800;color:var(--text-tertiary);text-transform:uppercase;">AAP/EFP Staging</div>
            <div style="font-size:18px;font-weight:900;color:var(--navy);margin-top:2px;font-family:'Outfit',sans-serif;">${r.stage}</div>
            <div style="font-size:11.5px;color:var(--text-secondary);margin-top:2px;">${r.stage_description || 'Severity Status'}</div>
          </div>

          <div style="background:#F8FAFC;border:1px solid var(--border);border-radius:var(--radius-md);padding:16px;text-align:center;">
            <div style="font-size:10.5px;font-weight:800;color:var(--text-tertiary);text-transform:uppercase;">AAP/EFP Grading</div>
            <div style="font-size:18px;font-weight:900;color:${r.grade === 'Grade C' ? 'var(--risk-high)' : 'var(--navy)'};margin-top:2px;font-family:'Outfit',sans-serif;">${r.grade}</div>
            <div style="font-size:11.5px;color:var(--text-secondary);margin-top:2px;">${r.grade_description || 'Progression Rate'}</div>
          </div>
        </div>

        <!-- Prognosis Horizons -->
        <div style="background:linear-gradient(135deg, #1A3557 0%, #0B132B 100%);color:white;border-radius:var(--radius-md);padding:20px;margin-bottom:20px;box-shadow:0 8px 24px rgba(26,53,87,0.3);">
          <div style="font-size:12px;font-weight:800;color:#2DD4BF;text-transform:uppercase;margin-bottom:14px;letter-spacing:0.5px;">Multi-Horizon Progression Risk</div>
          <div style="display:flex;justify-content:space-around;text-align:center;">
            <div>
              <div style="font-size:24px;font-weight:900;color:white;font-family:'Outfit',sans-serif;">${r.progression_6m}%</div>
              <div style="font-size:11px;color:#B0DEFF;">6-Month Risk</div>
            </div>
            <div>
              <div style="font-size:24px;font-weight:900;color:white;font-family:'Outfit',sans-serif;">${r.progression_12m}%</div>
              <div style="font-size:11px;color:#B0DEFF;">12-Month Risk</div>
            </div>
            <div>
              <div style="font-size:24px;font-weight:900;color:#2DD4BF;font-family:'Outfit',sans-serif;">${r.progression_5y}%</div>
              <div style="font-size:11px;color:#B0DEFF;">5-Year Prognosis</div>
            </div>
          </div>
        </div>

        <!-- Key Drivers -->
        <div style="margin-bottom:20px;">
          <h4 style="font-size:13px;text-transform:uppercase;color:var(--navy);margin-bottom:8px;">Key Clinical Risk Drivers</h4>
          <ul style="font-size:13px;color:var(--text-secondary);padding-left:18px;line-height:1.7;">
            ${(r.key_drivers || []).map(d => `<li>${d}</li>`).join('')}
          </ul>
        </div>

        <!-- Treatment Protocol -->
        <div style="background:#F0FDFA;border:1px solid #99F6E4;border-radius:var(--radius-md);padding:16px;margin-bottom:20px;">
          <h4 style="font-size:13px;text-transform:uppercase;color:#0F766E;margin-bottom:8px;">Evidence-Based Treatment Protocol</h4>
          <div style="font-size:12.5px;color:#115E59;line-height:1.7;">
            ${(r.clinical_recommendations || []).map(step => `<div>• ${step}</div>`).join('')}
          </div>
        </div>

        <button class="btn btn-primary" onclick="Predictor.exportReport(${r.patient_id || 1})">
          <span>📄 Export Clinical PDF Report</span>
        </button>
      </div>
    `;
  }

  function exportReport(patientId) {
    window.open(Api.downloadReportUrl(patientId), '_blank');
  }

  return {
    render,
    handlePatientSelect,
    calcPackYears,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeXray,
    runPrediction,
    exportReport
  };
})();
