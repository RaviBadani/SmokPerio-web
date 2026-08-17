/**
 * SmokPerio AI — Ultra-Premium Authentication & OTP Flow Controller
 */

const Auth = (function () {
  let pendingResetEmail = '';
  let pendingOtp = '';
  let resendCountdown = 60;
  let countdownTimer = null;

  function renderLogin() {
    return `
      <div class="auth-viewport">
        <div class="auth-ambient-glow"></div>
        <div class="auth-split-container">
          <!-- Left Hero Showcase -->
          <div class="auth-hero-showcase">
            <div>
              <div class="auth-brand-badge">
                <span>🦷</span>
                <span>SmokPerio AI Clinical Platform</span>
              </div>

              <div class="auth-hero-main">
                <h1 class="auth-hero-headline">AI-Powered Periodontal Risk Intelligence</h1>
                <p class="auth-hero-sub">
                  Next-generation diagnostic platform translating dental radiographs and clinical indices into <strong>2017 AAP/EFP Staging &amp; Grading</strong> disease progression models.
                </p>
              </div>

              <div class="auth-feature-pill">
                <span>📊</span>
                <div>
                  <strong>AAP/EFP 2017 Risk Stratification</strong>
                  <div style="font-size:11px;color:#94A3B8;">Multi-horizon 6m, 12m &amp; 5-year progression rates</div>
                </div>
              </div>

              <div class="auth-feature-pill">
                <span>⚡</span>
                <div>
                  <strong>Mandatory Dental Radiograph CV</strong>
                  <div style="font-size:11px;color:#94A3B8;">Alveolar bone loss &amp; furcation radiolucency detection</div>
                </div>
              </div>
            </div>

            <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#94A3B8;">
              <span>SIMATS Institute of Dental Sciences</span>
              <span>v2.0 Clinical Suite</span>
            </div>
          </div>

          <!-- Right Auth Form -->
          <div class="auth-form-card">
            <h2 class="auth-form-title">Doctor Sign In</h2>
            <p class="auth-form-subtitle">Enter your clinician credentials to access the diagnostic portal</p>

            <form id="loginForm" onsubmit="Auth.handleLogin(event)">
              <div class="form-group">
                <label class="form-label">Practitioner Email</label>
                <div class="input-with-icon">
                  <span class="input-icon-left">✉️</span>
                  <input type="email" id="loginEmail" class="form-control" placeholder="doctor@simats.edu" value="doctor@simats.edu" required />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Password</label>
                <div class="input-with-icon">
                  <span class="input-icon-left">🔒</span>
                  <input type="password" id="loginPassword" class="form-control" placeholder="••••••••" value="password123" required />
                </div>
              </div>

              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;font-size:13px;">
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;color:var(--text-secondary);">
                  <input type="checkbox" checked />
                  <span>Remember session</span>
                </label>
                <a style="color:var(--primary);font-weight:700;cursor:pointer;text-decoration:none;" onclick="Auth.showForgotPassword()">Forgot password?</a>
              </div>

              <div id="loginError" style="color:var(--risk-high);font-size:13px;margin-bottom:14px;display:none;"></div>

              <button type="submit" id="btnLogin" class="btn btn-primary">
                <span>Sign In to Clinical Portal</span>
              </button>
            </form>

            <div style="margin-top:28px;text-align:center;font-size:13.5px;color:var(--text-secondary);">
              New practitioner? <strong style="color:var(--primary);cursor:pointer;" onclick="Auth.showSignup()">Register Account</strong>
            </div>

            <div style="margin-top:20px;padding:12px;background:#F8FAFC;border:1px dashed var(--border);border-radius:var(--radius-md);text-align:center;font-size:12px;color:var(--text-secondary);">
              <strong>Demo Doctor:</strong> <code>doctor@simats.edu</code> / <code>password123</code>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderSignup() {
    return `
      <div class="auth-viewport">
        <div class="auth-ambient-glow"></div>
        <div class="auth-split-container">
          <!-- Left Hero Showcase -->
          <div class="auth-hero-showcase">
            <div>
              <div class="auth-brand-badge">
                <span>🦷</span>
                <span>SmokPerio AI Practitioner Registration</span>
              </div>
              <div class="auth-hero-main">
                <h1 class="auth-hero-headline">Join the Clinical Dental Diagnostic Network</h1>
                <p class="auth-hero-sub">
                  Empower your periodontal practice with AI-assisted alveolar destruction modeling and evidence-based patient recall schedules.
                </p>
              </div>
            </div>
            <div style="font-size:11px;color:#94A3B8;">SIMATS University • Department of Periodontics</div>
          </div>

          <!-- Right Signup Form -->
          <div class="auth-form-card">
            <h2 class="auth-form-title">Create Account</h2>
            <p class="auth-form-subtitle">Register your clinician profile for AI diagnostics</p>

            <form id="signupForm" onsubmit="Auth.handleSignup(event)">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <div class="input-with-icon">
                  <span class="input-icon-left">👤</span>
                  <input type="text" id="regName" class="form-control" placeholder="Dr. Ravi Kumar" required />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Email Address</label>
                <div class="input-with-icon">
                  <span class="input-icon-left">✉️</span>
                  <input type="email" id="regEmail" class="form-control" placeholder="doctor@hospital.org" required />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Security Password</label>
                <div class="input-with-icon">
                  <span class="input-icon-left">🔒</span>
                  <input type="password" id="regPassword" class="form-control" placeholder="Minimum 6 characters" minlength="6" required />
                </div>
              </div>

              <div id="signupError" style="color:var(--risk-high);font-size:13px;margin-bottom:14px;display:none;"></div>

              <button type="submit" id="btnSignup" class="btn btn-primary">
                <span>Create Practitioner Account</span>
              </button>
            </form>

            <div style="margin-top:24px;text-align:center;font-size:13.5px;color:var(--text-secondary);">
              Already registered? <strong style="color:var(--primary);cursor:pointer;" onclick="Auth.showLogin()">Sign In</strong>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderForgotPassword() {
    return `
      <div class="auth-viewport">
        <div class="auth-ambient-glow"></div>
        <div class="auth-split-container" style="max-width:540px;grid-template-columns:1fr;">
          <div class="auth-form-card" style="padding:48px 36px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="font-size:44px;margin-bottom:8px;">🔒</div>
              <h2 class="auth-form-title">Reset Password</h2>
              <p class="auth-form-subtitle" style="margin-bottom:0;">
                Enter your email address to receive a 6-digit OTP code directly from our Gmail SMTP system.
              </p>
            </div>

            <form onsubmit="Auth.handleForgotPassword(event)">
              <div class="form-group">
                <label class="form-label">Registered Email</label>
                <div class="input-with-icon">
                  <span class="input-icon-left">✉️</span>
                  <input type="email" id="forgotEmail" class="form-control" placeholder="doctor@simats.edu" required />
                </div>
              </div>

              <div id="forgotError" style="color:var(--risk-high);font-size:13px;margin-bottom:14px;display:none;"></div>

              <button type="submit" id="btnSendOtp" class="btn btn-primary">
                <span>Send 6-Digit OTP Code</span>
              </button>
            </form>

            <div style="margin-top:24px;text-align:center;font-size:13.5px;">
              Remember your password? <strong style="color:var(--primary);cursor:pointer;" onclick="Auth.showLogin()">Sign In</strong>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderVerifyOtp(email) {
    return `
      <div class="auth-viewport">
        <div class="auth-ambient-glow"></div>
        <div class="auth-split-container" style="max-width:540px;grid-template-columns:1fr;">
          <div class="auth-form-card" style="padding:48px 36px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="font-size:44px;margin-bottom:8px;">🔑</div>
              <h2 class="auth-form-title">Verify Security Code</h2>
              <p class="auth-form-subtitle" style="margin-bottom:0;">
                Enter the 6-digit security code sent to <strong>${email}</strong>
              </p>
            </div>

            <form onsubmit="Auth.handleVerifyOtp(event)">
              <div class="form-group">
                <input type="text" id="otpCodeInput" class="form-control" placeholder="000000" maxlength="6" style="text-align:center;font-size:26px;font-weight:800;letter-spacing:8px;padding-left:16px;height:54px;" required />
              </div>

              <div style="text-align:center;margin-bottom:20px;font-size:13.5px;">
                <span id="resendTimerText" style="color:var(--text-secondary);">Resend code in <strong id="timerSec">60</strong>s</span>
                <span id="resendOtpBtn" style="color:var(--primary);font-weight:700;cursor:pointer;display:none;" onclick="Auth.resendOtpCode()">Resend Code</span>
              </div>

              <div id="verifyError" style="color:var(--risk-high);font-size:13px;margin-bottom:14px;display:none;"></div>

              <button type="submit" id="btnVerifyOtp" class="btn btn-primary">
                <span>Verify OTP Code</span>
              </button>
            </form>

            <div style="margin-top:24px;text-align:center;font-size:13.5px;">
              <a style="color:var(--primary);font-weight:700;cursor:pointer;" onclick="Auth.showForgotPassword()">Entered wrong email? Change Email</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderResetPassword() {
    return `
      <div class="auth-viewport">
        <div class="auth-ambient-glow"></div>
        <div class="auth-split-container" style="max-width:540px;grid-template-columns:1fr;">
          <div class="auth-form-card" style="padding:48px 36px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="font-size:44px;margin-bottom:8px;">🛡️</div>
              <h2 class="auth-form-title">Set New Password</h2>
              <p class="auth-form-subtitle" style="margin-bottom:0;">
                Enter your new secure account password below.
              </p>
            </div>

            <form onsubmit="Auth.handleResetPassword(event)">
              <div class="form-group">
                <label class="form-label">New Password</label>
                <div class="input-with-icon">
                  <span class="input-icon-left">🔒</span>
                  <input type="password" id="newPassword" class="form-control" placeholder="New Password (min 6 chars)" minlength="6" required />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Confirm Password</label>
                <div class="input-with-icon">
                  <span class="input-icon-left">🔒</span>
                  <input type="password" id="confirmPassword" class="form-control" placeholder="Confirm Password" minlength="6" required />
                </div>
              </div>

              <div id="resetError" style="color:var(--risk-high);font-size:13px;margin-bottom:14px;display:none;"></div>

              <button type="submit" id="btnSubmitReset" class="btn btn-primary">
                <span>Update Password</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  // Handlers
  async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errEl = document.getElementById('loginError');
    const btn = document.getElementById('btnLogin');

    errEl.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = 'Authenticating...';

    try {
      const res = await Api.login(email, password);
      Api.setSession(res.token, res.user);
      Api.showToast(`Welcome back, ${res.user.name}!`, 'success');
      App.init();
    } catch (err) {
      errEl.textContent = err.message || 'Login failed. Invalid credentials.';
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = 'Sign In to Clinical Portal';
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const errEl = document.getElementById('signupError');
    const btn = document.getElementById('btnSignup');

    errEl.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = 'Registering clinician...';

    try {
      const res = await Api.signup({
        name,
        specialization: 'Periodontist Specialist',
        clinic_name: 'SIMATS Dental Hospital',
        phone: '+91 98765 43210',
        email,
        password
      });

      if (res.token && res.user) {
        Api.setSession(res.token, res.user);
      } else {
        const loginRes = await Api.login(email, password);
        Api.setSession(loginRes.token, loginRes.user);
      }
      Api.showToast('Account created successfully!', 'success');
      App.init();
    } catch (err) {
      errEl.textContent = err.message || 'Registration failed.';
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = 'Create Practitioner Account';
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value.trim();
    const errEl = document.getElementById('forgotError');
    const btn = document.getElementById('btnSendOtp');

    errEl.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = 'Sending OTP via Gmail...';

    try {
      await Api.forgotPassword(email);
      pendingResetEmail = email;
      showVerifyOtp(email);
      startResendTimer();
      Api.showToast('OTP sent to ' + email, 'info');
    } catch (err) {
      errEl.textContent = err.message || 'Failed to dispatch OTP.';
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = 'Send 6-Digit OTP Code';
    }
  }

  function startResendTimer() {
    resendCountdown = 60;
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      resendCountdown--;
      const secEl = document.getElementById('timerSec');
      if (secEl) secEl.textContent = resendCountdown;
      if (resendCountdown <= 0) {
        clearInterval(countdownTimer);
        const timerText = document.getElementById('resendTimerText');
        const resendBtn = document.getElementById('resendOtpBtn');
        if (timerText) timerText.style.display = 'none';
        if (resendBtn) resendBtn.style.display = 'inline-block';
      }
    }, 1000);
  }

  async function resendOtpCode() {
    try {
      await Api.forgotPassword(pendingResetEmail);
      Api.showToast('New OTP dispatched!', 'info');
      document.getElementById('resendTimerText').style.display = 'inline-block';
      document.getElementById('resendOtpBtn').style.display = 'none';
      startResendTimer();
    } catch (e) {
      alert('Resend failed: ' + e.message);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    const otp = document.getElementById('otpCodeInput').value.trim();
    const errEl = document.getElementById('verifyError');
    const btn = document.getElementById('btnVerifyOtp');

    if (otp.length !== 6) {
      errEl.textContent = 'Please enter all 6 digits.';
      errEl.style.display = 'block';
      return;
    }

    errEl.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = 'Verifying...';

    try {
      await Api.verifyOtp(pendingResetEmail, otp);
      pendingOtp = otp;
      showResetPassword();
    } catch (err) {
      errEl.textContent = err.message || 'Invalid OTP code.';
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = 'Verify OTP Code';
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    const p1 = document.getElementById('newPassword').value.trim();
    const p2 = document.getElementById('confirmPassword').value.trim();
    const errEl = document.getElementById('resetError');
    const btn = document.getElementById('btnSubmitReset');

    if (p1 !== p2) {
      errEl.textContent = 'Passwords do not match.';
      errEl.style.display = 'block';
      return;
    }

    errEl.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = 'Updating...';

    try {
      await Api.resetPassword(pendingResetEmail, pendingOtp, p1);
      Api.showToast('Password reset successfully! Please sign in.', 'success');
      showLogin();
    } catch (err) {
      errEl.textContent = err.message || 'Failed to update password.';
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = 'Update Password';
    }
  }

  return {
    renderLogin,
    renderSignup,
    renderForgotPassword,
    renderVerifyOtp,
    renderResetPassword,
    showLogin: () => { document.getElementById('app').innerHTML = renderLogin(); },
    showSignup: () => { document.getElementById('app').innerHTML = renderSignup(); },
    showForgotPassword: () => { document.getElementById('app').innerHTML = renderForgotPassword(); },
    showVerifyOtp: (email) => { document.getElementById('app').innerHTML = renderVerifyOtp(email); },
    showResetPassword: () => { document.getElementById('app').innerHTML = renderResetPassword(); },
    handleLogin,
    handleSignup,
    handleForgotPassword,
    handleVerifyOtp,
    handleResetPassword,
    resendOtpCode,
    logout: () => {
      Api.clearSession();
      Api.showToast('Signed out of session', 'info');
      document.getElementById('app').innerHTML = renderLogin();
    }
  };
})();
