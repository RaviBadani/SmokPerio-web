/**
 * SmokPerio AI — Executive Clinical Dashboard (Ultra-Premium Interface)
 */

const Dashboard = (function () {
  let riskChart = null;

  async function render(container) {
    const user = Api.getUser() || { name: 'Doctor' };
    const practitionerId = user.id || 1;

    const todayStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    container.innerHTML = `
      <!-- Top Clinical Hero Banner -->
      <div style="background:linear-gradient(135deg, #1A3557 0%, #0B132B 60%, #0D9488 100%);border-radius:var(--radius-xl);padding:32px 36px;color:white;margin-bottom:32px;box-shadow:var(--shadow-card);position:relative;overflow:hidden;">
        <div style="position:absolute;top:-40px;right:-40px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle, rgba(45,212,191,0.18) 0%, transparent 70%);pointer-events:none;"></div>
        
        <div style="display:flex;justify-content:space-between;align-items:flex-start;position:relative;z-index:2;">
          <div>
            <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(45,212,191,0.15);padding:4px 12px;border-radius:var(--radius-full);color:#2DD4BF;font-size:11.5px;font-weight:800;letter-spacing:0.5px;margin-bottom:12px;">
              <span>📅</span> <span>${todayStr}</span>
            </div>
            <h1 style="font-size:28px;font-weight:900;color:#FFFFFF;margin-bottom:6px;font-family:'Outfit',sans-serif;">Good morning, ${user.name}</h1>
            <p style="font-size:14px;color:#B0DEFF;max-width:560px;line-height:1.5;">
              Clinical Periodontal Command Center. Real-time patient disease monitoring, radiograph computer vision, and risk progression analytics.
            </p>
          </div>

          <div style="display:flex;gap:12px;">
            <button class="btn btn-outline btn-sm" style="color:white;border-color:rgba(255,255,255,0.3);" onclick="Patients.showAddModal()">
              <span>+ Add Patient</span>
            </button>
            <button class="btn btn-primary btn-sm" style="background:#0D9488;" onclick="App.navigate('predictor')">
              <span>🧠 Run AI Assessment</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 4 Glowing KPI Metric Cards -->
      <div class="kpi-metrics-grid">
        <div class="kpi-metric-box">
          <div class="kpi-metric-icon navy">👥</div>
          <div>
            <div class="kpi-metric-val" id="statTotal">--</div>
            <div class="kpi-metric-lbl">Total Patients</div>
          </div>
        </div>

        <div class="kpi-metric-box">
          <div class="kpi-metric-icon teal">🎯</div>
          <div>
            <div class="kpi-metric-val" id="statAssessed">--</div>
            <div class="kpi-metric-lbl">AI Assessed</div>
          </div>
        </div>

        <div class="kpi-metric-box">
          <div class="kpi-metric-icon red">⚠️</div>
          <div>
            <div class="kpi-metric-val" id="statHighRisk">--</div>
            <div class="kpi-metric-lbl">High Risk Cases</div>
          </div>
        </div>

        <div class="kpi-metric-box">
          <div class="kpi-metric-icon amber">📉</div>
          <div>
            <div class="kpi-metric-val" id="statBoneLoss">--</div>
            <div class="kpi-metric-lbl">Mean Bone Loss</div>
          </div>
        </div>
      </div>

      <!-- Split View: Interactive Chart & Recent Patient Cohort Table -->
      <div style="display:grid;grid-template-columns:1fr 1.8fr;gap:28px;align-items:start;">
        <!-- Left: Risk Distribution Chart Card -->
        <div class="clinical-card" style="margin:0;">
          <div class="card-header-flex">
            <h2 class="card-heading-title">Risk Stratification</h2>
            <span style="font-size:12px;color:var(--primary);cursor:pointer;font-weight:700;" onclick="App.navigate('analytics')">Explore Analytics →</span>
          </div>
          <div style="height:230px;position:relative;">
            <canvas id="dashPieCanvas"></canvas>
          </div>
        </div>

        <!-- Right: Recent Patients Table Card -->
        <div class="clinical-card" style="margin:0;">
          <div class="card-header-flex">
            <h2 class="card-heading-title">Recent Patient Cohort</h2>
            <button class="btn btn-outline btn-sm" onclick="Patients.showAddModal()">+ New Patient</button>
          </div>
          <div class="table-scrollable">
            <table class="modern-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Age / Sex</th>
                  <th>Smoking Profile</th>
                  <th>Bone Loss</th>
                  <th>Risk Tier</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="recentPatientsBody">
                <tr><td colspan="6" style="text-align:center;color:var(--text-tertiary);padding:32px;">Loading recent patient records...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    loadDashboardData(practitionerId);
  }

  async function loadDashboardData(practitionerId) {
    try {
      const patients = await Api.listPatients(practitionerId);
      renderKpis(patients);
      renderRecentTable(patients);
    } catch (err) {
      console.warn('Dashboard load fallback:', err);
    }
  }

  function renderKpis(patients) {
    const total = patients.length;
    let assessed = 0, high = 0, med = 0, low = 0;
    let totalBl = 0;

    patients.forEach(p => {
      totalBl += (p.radiographic_bone_loss || 0);
      if (p.predictions && p.predictions.length > 0) {
        assessed++;
        const res = p.predictions[0].result;
        if (res) {
          if (res.risk_level === 'HIGH') high++;
          else if (res.risk_level === 'MODERATE' || res.risk_level === 'MEDIUM') med++;
          else low++;
        }
      }
    });

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statAssessed').textContent = assessed;
    document.getElementById('statHighRisk').textContent = high;
    document.getElementById('statBoneLoss').textContent = total > 0 ? (totalBl / total).toFixed(1) + '%' : '--';

    initChart(high, med, low);
  }

  function initChart(high, med, low) {
    const ctx = document.getElementById('dashPieCanvas');
    if (!ctx) return;

    if (riskChart) riskChart.destroy();

    if (high === 0 && med === 0 && low === 0) {
      high = 1; med = 1; low = 1;
    }

    riskChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['High Risk', 'Moderate Risk', 'Low Risk'],
        datasets: [{
          data: [high, med, low],
          backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
          borderWidth: 3,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              font: { family: 'Inter', size: 12, weight: 600 },
              color: '#475569'
            }
          }
        }
      }
    });
  }

  function renderRecentTable(patients) {
    const tbody = document.getElementById('recentPatientsBody');
    if (!patients || patients.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-tertiary);padding:32px;">No patients added yet.</td></tr>';
      return;
    }

    const recent = patients.slice(0, 5);
    tbody.innerHTML = recent.map(p => {
      let riskBadge = '<span class="pill-badge low">LOW RISK</span>';
      if (p.predictions && p.predictions.length > 0 && p.predictions[0].result) {
        const r = p.predictions[0].result.risk_level;
        if (r === 'HIGH') riskBadge = '<span class="pill-badge high">HIGH RISK</span>';
        else if (r === 'MODERATE' || r === 'MEDIUM') riskBadge = '<span class="pill-badge moderate">MODERATE</span>';
      }

      return `
        <tr>
          <td>
            <strong style="color:var(--navy);cursor:pointer;font-weight:700;" onclick="Patients.showDetail(${p.id})">${p.name}</strong>
          </td>
          <td>${p.age} yrs · ${p.gender || 'M'}</td>
          <td>
            <span style="font-size:12.5px;font-weight:600;color:${p.cigarettes_per_day >= 15 ? 'var(--risk-high)' : 'var(--text-secondary)'};">
              ${p.smoking_status || 'Smoker'} (${p.cigarettes_per_day || 0} cigs/d)
            </span>
          </td>
          <td><strong>${p.radiographic_bone_loss || 0}%</strong></td>
          <td>${riskBadge}</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="Patients.showDetail(${p.id})">Open File</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  return { render };
})();
