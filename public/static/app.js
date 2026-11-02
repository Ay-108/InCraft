/**
 * InCraft — The Art of Intelligent Inventory
 * Modern Application Client
 */

(function () {
  'use strict';

  // --- Utility Shortcuts ---
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

  // --- Initial State Extraction ---
  let initialState = {};
  try {
    const rawState = $('#incraft-initial')?.textContent;
    if (rawState) {
      initialState = JSON.parse(rawState);
    }
  } catch (e) {
    console.warn('Initial state could not be parsed:', e);
  }

  // --- Application State ---
  const state = {
    user: initialState.user || null,
    csrfToken: initialState.csrf_token || $('meta[name="csrf-token"]')?.getAttribute('content') || '',
    currentPage: initialState.page || 'dashboard',
    theme: localStorage.getItem('incraft_theme') || 'light',
    currency: localStorage.getItem('incraft_currency') || '₹',
    dashboardChart: null,
    dashboardTrendRequestId: 0,
    dashboardChartMetric: 'revenue',
    dashboardLastRefresh: null,
    products: [],
    sales: [],
    summary: {},
    stockDistribution: {},
    activities: [],
    insights: [],
    mlForecasts: [],
    mlRisks: [],
    mlReorders: []
  };

  // --- Helper: Format Currency ---
  function fmtMoney(amount) {
    const val = Number(amount || 0);
    return `${state.currency} ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // --- Helper: Format Date ---
  function fmtDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
        ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return String(dateStr);
    }
  }

  // --- Helper: Escape dynamic values before inserting them into HTML ---
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
  }

  // --- Helper: Show Toast Notification ---
  function toast(message, type = 'info') {
    const el = $('#toast');
    if (!el) return;
    el.textContent = message;
    el.className = `toast show ${type}`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      el.className = 'toast';
    }, 3800);
  }

  // --- Helper: API Fetch with CSRF & JSON handling ---
  async function api(url, options = {}) {
    options.headers = options.headers || {};
    options.headers['Accept'] = 'application/json';
    if (state.csrfToken) {
      options.headers['X-CSRFToken'] = state.csrfToken;
      options.headers['X-CSRF-Token'] = state.csrfToken;
    }
    if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    try {
      const res = await fetch(url, options);
      const data = await res.json().catch(() => null);

      if (res.status === 401 || res.status === 403) {
        if (data && data.message && data.message.includes('sign in')) {
          state.user = null;
          showLanding();
          toast(data.message, 'error');
          return null;
        }
      }
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.error('API Error:', err);
      return { ok: false, status: 0, data: null, error: err };
    }
  }

  // --- Modal Helpers ---
  function openModal(title, subtitle, contentHtml) {
    const backdrop = $('#backdrop');
    const modal = $('#modal');
    if (!backdrop || !modal) return;
    modal.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
        <h2>${title}</h2>
        <button id="closeModalBtn" style="border:0;background:none;font-size:22px;color:var(--muted);cursor:pointer;line-height:1;">✕</button>
      </div>
      <p class="modal-sub">${subtitle}</p>
      ${contentHtml}
    `;
    backdrop.classList.add('show');
    $('#closeModalBtn').onclick = closeModal;
    backdrop.onclick = (e) => {
      if (e.target === backdrop) closeModal();
    };
  }

  function closeModal() {
    const backdrop = $('#backdrop');
    if (backdrop) backdrop.classList.remove('show');
  }

  // --- Theme Management ---
  function applyTheme(themeName) {
    state.theme = themeName;
    localStorage.setItem('incraft_theme', themeName);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = themeName === 'dark' || (themeName === 'system' && prefersDark);
    document.body.classList.toggle('dark', isDark);
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    const themeBtn = $('#theme');
    if (themeBtn) {
      themeBtn.innerHTML = isDark
        ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>'
        : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
      themeBtn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    }
  }

  // --- Auth & Session Bootstrap ---
  async function checkSession() {
    if (state.user) return state.user;
    const res = await api('/api/auth/me');
    if (res && res.ok && res.data && res.data.authenticated) {
      state.user = res.data.user;
      if (res.data.csrf_token) state.csrfToken = res.data.csrf_token;
      return state.user;
    }
    return null;
  }

  // ============================================================
  // AUTH VIEWS (Landing, Login, Signup)
  // ============================================================

  function renderAuthShell(content) {
    document.body.innerHTML = `
      <div class="auth-shell">
        <div class="auth-brand">
          <div class="brand">
            <b>I</b>
            <div>
              <strong>InCraft</strong>
              <small>INTELLIGENT INVENTORY</small>
            </div>
          </div>
          <div class="auth-quote">
            <span>“</span>
            <h1>Clarity for every<br><em>stock decision.</em></h1>
            <p>A focused workspace for teams that want to move inventory with confidence.</p>
          </div>
          <div class="auth-footer">
            © 2024–2026 InCraft <span>Privacy</span><span>Support</span>
          </div>
        </div>
        <main class="auth-main">${content}</main>
      </div>
      <div id="toast" class="toast"></div>
    `;
  }

  function showLanding() {
    renderAuthShell(`
      <div class="landing">
        <div class="landing-top">
          <span class="eyebrow">The art of intelligent inventory</span>
          <span class="secure">◉ Secure workspace</span>
        </div>
        <h2>Run a sharper<br><em>operation.</em></h2>
        <p class="lead">InCraft brings products, sales and decisions into one calm, connected workspace.</p>
        <div class="feature-list">
          <div>
            <b>01</b>
            <span><strong>See what matters</strong>Keep your inventory health visible at a glance with real-time analytics.</span>
          </div>
          <div>
            <b>02</b>
            <span><strong>Move with confidence</strong>Turn daily activity into useful decisions with ML stockout predictions.</span>
          </div>
          <div>
            <b>03</b>
            <span><strong>Stay in control</strong>Give every team member role-appropriate access with audit trails.</span>
          </div>
        </div>
        <div class="landing-actions">
          <button class="btn primary" id="loginLink">Log in <span>→</span></button>
          <button class="btn" id="signupLink">Create an account <span>→</span></button>
        </div>
        <small class="legal">By continuing, you agree to InCraft’s terms and privacy policy.</small>
      </div>
    `);

    $('#loginLink').onclick = showLogin;
    $('#signupLink').onclick = showSignup;
    window.history.replaceState(null, '', '/login');
  }

  function showLogin() {
    renderAuthShell(`
      <div class="auth-card">
        <button class="back-link" id="backLink">← Back to home</button>
        <span class="eyebrow">Welcome to InCraft</span>
        <h2>Sign in</h2>
        <p class="auth-sub">Enter your credentials to access your inventory workspace.</p>
        <form id="loginForm">
          <label>
            Email address
            <input id="loginEmail" type="email" autocomplete="email" placeholder="you@company.com" required autofocus>
          </label>
          <label>
            Password
            <input id="loginPassword" type="password" autocomplete="current-password" placeholder="Enter your password" required>
          </label>
          <label>
            Role
            <select id="loginRole" style="height:42px;border:1px solid var(--line);border-radius:7px;padding:0 10px;background:var(--card);color:var(--ink);">
              <option value="admin">Administrator</option>
              <option value="staff">Staff Member</option>
            </select>
          </label>
          <div id="formMessage" class="form-message"></div>
          <button class="btn primary submit" type="submit">Sign in <span>→</span></button>
        </form>
        <p class="switch">New to InCraft? <button id="toSignupBtn">Create an account</button></p>
      </div>
    `);

    $('#backLink').onclick = showLanding;
    $('#toSignupBtn').onclick = showSignup;

    $('#loginForm').onsubmit = async (e) => {
      e.preventDefault();
      const email = $('#loginEmail').value.trim();
      const password = $('#loginPassword').value;
      const role = $('#loginRole').value;
      const msg = $('#formMessage');

      msg.textContent = 'Signing in...';
      msg.className = 'form-message';

      const res = await api('/login', {
        method: 'POST',
        body: { email, password, role }
      });

      if (res && res.ok && res.data && res.data.success) {
        state.user = res.data.user;
        toast('Welcome back!', 'success');
        showAppShell('dashboard');
      } else {
        const errorText = res?.data?.message || 'Invalid email, password, or account type.';
        msg.textContent = errorText;
        msg.className = 'form-message';
      }
    };
    window.history.replaceState(null, '', '/login');
  }

  function showSignup() {
    renderAuthShell(`
      <div class="auth-card">
        <button class="back-link" id="backLink">← Back to home</button>
        <span class="eyebrow">Workspace Setup</span>
        <h2>Create account</h2>
        <p class="auth-sub">Set up your workspace credentials in less than a minute.</p>
        <form id="signupForm">
          <label>
            Full name
            <input id="regName" type="text" autocomplete="name" placeholder="Arjun Rao" required autofocus>
          </label>
          <label>
            Email address
            <input id="regEmail" type="email" autocomplete="email" placeholder="arjun@example.com" required>
          </label>
          <label>
            Password
            <input id="regPassword" type="password" autocomplete="new-password" placeholder="At least 8 characters" minlength="8" required>
          </label>
          <label>
            Confirm password
            <input id="regConfirm" type="password" autocomplete="new-password" placeholder="Repeat your password" minlength="8" required>
          </label>
          <div id="formMessage" class="form-message"></div>
          <button class="btn primary submit" type="submit">Create account <span>→</span></button>
        </form>
        <p class="switch">Already have an account? <button id="toLoginBtn">Log in</button></p>
      </div>
    `);

    $('#backLink').onclick = showLanding;
    $('#toLoginBtn').onclick = showLogin;

    $('#signupForm').onsubmit = async (e) => {
      e.preventDefault();
      const name = $('#regName').value.trim();
      const email = $('#regEmail').value.trim();
      const password = $('#regPassword').value;
      const confirm = $('#regConfirm').value;
      const msg = $('#formMessage');

      if (password !== confirm) {
        msg.textContent = 'Passwords do not match.';
        return;
      }

      msg.textContent = 'Creating account...';
      msg.className = 'form-message';

      const res = await api('/register', {
        method: 'POST',
        body: { username: name, email, password, confirm_password: confirm }
      });

      if (res && res.ok && res.data && res.data.success) {
        toast('Account created! Please sign in.', 'success');
        showLogin();
      } else {
        const errorText = res?.data?.message || 'Registration failed. Check email or username.';
        msg.textContent = errorText;
      }
    };
    window.history.replaceState(null, '', '/register');
  }

  // ============================================================
  // WORKSPACE SHELL
  // ============================================================

  function showAppShell(initialPage = 'dashboard') {
    state.currentPage = initialPage;
    const name = state.user?.name || state.user?.username || 'Workspace User';
    const role = (state.user?.role || 'Administrator').toUpperCase();
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AR';

    document.body.innerHTML = `
      <div class="shell">
        <aside id="sidebar">
          <div class="brand">
            <b>I</b>
            <div>
              <strong>InCraft</strong>
              <small>INTELLIGENT INVENTORY</small>
            </div>
          </div>
          <small class="label">WORKSPACE</small>
          <nav>
            <button class="${initialPage === 'dashboard' ? 'active' : ''}" data-page="dashboard">⌂ <span>Dashboard</span></button>
            <button class="${initialPage === 'inventory' ? 'active' : ''}" data-page="inventory">▦ <span>Inventory</span></button>
            <button class="${initialPage === 'sales' ? 'active' : ''}" data-page="sales">↗ <span>Sales</span></button>
${state.user?.role === 'admin' ? `<button class="${initialPage === 'analytics' ? 'active' : ''}" data-page="analytics">◒ <span>Analytics</span></button>` : ''}
            <button class="${initialPage === 'activity' ? 'active' : ''}" data-page="activity">◷ <span>Activity history</span></button>
          </nav>
          <small class="label account">ACCOUNT</small>
          <nav>
            <button class="${initialPage === 'settings' ? 'active' : ''}" data-page="settings">⚙ <span>Settings</span></button>
          </nav>
          <div class="bottom">
            <div class="smart" id="smartInsightsSidebar" style="cursor:pointer;">
              ✦ <div><b>Smart insights</b><small>Make your next move count.</small></div> →
            </div>
            <div class="user">
              <b>${initials}</b>
              <div>
                <strong>${name}</strong>
                <small>${role}</small>
              </div>
              <button id="logout" title="Sign out" style="border:0;background:none;color:#888;cursor:pointer;font-size:16px;">↪</button>
            </div>
          </div>
        </aside>

        <main>
          <header>
            <button class="hamb" id="hamb" aria-label="Toggle navigation">☰</button>
            <div class="crumb">
              <span class="crumb-root">Workspace</span>
              <span class="crumb-sep">/</span>
              <b class="crumb-active" id="crumb">${initialPage[0].toUpperCase() + initialPage.slice(1)}</b>
            </div>
            <div class="tools">
              <label class="search-bar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input id="globalSearch" placeholder="Search products, records...">
                <kbd>⌘ K</kbd>
              </label>
              <button class="icon-btn" id="theme" title="Toggle theme"></button>
              <button class="icon-btn" id="bell" title="Notifications">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                <span class="notification-dot"></span>
              </button>
              <div class="profile-wrap">
                <button class="profile-btn" id="profileToggle" aria-expanded="false">
                  <div class="profile-avatar">${initials}</div>
                  <div class="profile-info">
                    <span class="profile-name">${name}</span>
                    <span class="profile-badge">${role}</span>
                  </div>
                  <svg class="chevron-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="profile-menu" id="profileMenu">
                  <div class="profile-menu-head">
                    <strong>${name}</strong>
                    <small>${state.user?.email || 'Signed in'}</small>
                  </div>
                  <button id="profileSettings">⚙ <span>Settings</span></button>
                  <button id="profileLogout">↪ <span>Sign out</span></button>
                </div>
              </div>
            </div>
          </header>
          <section id="content"></section>
        </main>
      </div>

      <div id="toast" class="toast"></div>
      <div id="backdrop"><div id="modal"></div></div>
    `;

    applyTheme(state.theme);
    wireGlobalHandlers();
    navigateTo(initialPage);
  }

  function wireGlobalHandlers() {
    if (!window.__incraftPopStateBound) {
      window.addEventListener('popstate', () => {
        const path = window.location.pathname.toLowerCase();
        const page = path.includes('inventory') ? 'inventory' : path.includes('sales') ? 'sales' :
          path.includes('analytics') ? 'analytics' : path.includes('activity') ? 'activity' :
          path.includes('settings') ? 'settings' : 'dashboard';
        navigateTo(page, { query: window.location.search, skipHistory: true });
      });
      window.__incraftPopStateBound = true;
    }
    // Nav buttons
    $$('[data-page]').forEach(btn => {
      btn.onclick = () => {
        const page = btn.dataset.page;
        navigateTo(page);
      };
    });

    // Mobile Hamburger
    $('#hamb').onclick = () => {
      $('aside').classList.toggle('open');
    };

    // Dark theme toggle
    $('#theme').onclick = () => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      toast(`Theme set to ${next}`);
    };

    // Notifications bell
    $('#bell').onclick = () => {
      navigateTo('activity');
      toast('Displaying recent activity and system events.');
    };

    // Smart insights card in sidebar
    $('#smartInsightsSidebar').onclick = () => {
      navigateTo('analytics');
    };

    // Profile Dropdown
    const toggle = $('#profileToggle');
    const menu = $('#profileMenu');
    toggle.onclick = (e) => {
      e.stopPropagation();
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    };
    document.addEventListener('click', () => {
      if (menu) menu.classList.remove('open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    });
    menu.onclick = (e) => e.stopPropagation();

    $('#profileSettings').onclick = () => {
      navigateTo('settings');
      menu.classList.remove('open');
    };

    const doLogout = async () => {
      await api('/logout', { method: 'POST' });
      state.user = null;
      toast('Signed out successfully.');
      showLanding();
    };

    $('#logout').onclick = doLogout;
    $('#profileLogout').onclick = doLogout;

    // Global Search (Cmd+K)
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        $('#globalSearch')?.focus();
      }
    });

    $('#globalSearch').onkeydown = (e) => {
      if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query) {
          navigateTo('inventory');
          setTimeout(() => {
            const invSearch = $('#inventorySearch');
            if (invSearch) {
              invSearch.value = query;
              invSearch.dispatchEvent(new Event('input'));
            }
          }, 100);
        }
      }
    };
  }

  function navigateTo(pageName, options = {}) {
    if (pageName === 'analytics' && state.user?.role !== 'admin') {
      pageName = 'sales';
      options = { ...options, query: '', skipHistory: false, replace: true };
      toast('Analytics access is restricted to administrators.', 'error');
    }
    state.currentPage = pageName;
    $$('[data-page]').forEach(btn => btn.classList.toggle('active', btn.dataset.page === pageName));
    const crumb = $('#crumb');
    if (crumb) crumb.textContent = pageName === 'dashboard' ? 'Dashboard' :
      pageName === 'inventory' ? 'Inventory' : pageName === 'sales' ? 'Sales' :
      pageName === 'analytics' ? 'Analytics' : pageName === 'activity' ? 'Activity history' : 'Settings';
    $('aside')?.classList.remove('open');

    const targetPath = pageName === 'dashboard' ? '/dashboard' : `/${pageName}`;
    const defaultQuery = window.location.pathname === targetPath ? window.location.search : '';
    const targetUrl = targetPath + (options.query !== undefined ? options.query : defaultQuery);
    if (!options.skipHistory && window.location.pathname + window.location.search !== targetUrl) {
      if (options.replace) window.history.replaceState({ page: pageName }, '', targetUrl);
      else window.history.pushState({ page: pageName }, '', targetUrl);
    }

    const content = $('#content');
    if (!content) return;
    if (pageName === 'dashboard') renderDashboard(content);
    else if (pageName === 'inventory') renderInventory(content);
    else if (pageName === 'sales') renderSales(content);
    else if (pageName === 'analytics') renderAnalytics(content);
    else if (pageName === 'activity') renderActivity(content);
    else if (pageName === 'settings') renderSettings(content);
  }

  // ============================================================
  // 1. DASHBOARD MODULE
  // ============================================================

  async function renderDashboard(container) {
    const name = escapeHtml((state.user?.name || state.user?.username || 'there').split(' ')[0]);
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const isAdmin = state.user?.role === 'admin';

    container.innerHTML = `
      <div class="head dash-heading">
        <div><div class="eyebrow">Your workspace · ${new Date().toLocaleDateString(undefined, { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</div>
          <h1>${greeting}, ${name}.</h1><p>Business performance, inventory health, and operational activity in one place.</p></div>
        <div class="actions dash-heading-actions">
          <button class="btn" id="dashRefreshBtn" type="button">↻ Refresh</button><button class="btn" id="dashPrintBtn" type="button">Print</button>
          ${isAdmin ? '<button class="btn" id="dashImportBtn" type="button">Import data</button><button class="btn" id="dashAddProductBtn" type="button">+ Add product</button>' : ''}
          <button class="btn primary" id="dashRecordSaleBtn" type="button">Record sale</button>
        </div>
      </div>
      <div class="dash-quick-links" aria-label="Dashboard shortcuts">
        <button class="dash-quick-link" data-dash-page="inventory">View inventory <span>→</span></button>
        <button class="dash-quick-link" data-dash-page="sales">View sales <span>→</span></button>
${isAdmin ? '<button class="dash-quick-link" data-dash-page="analytics">Analytics & reports <span>→</span></button>' : '<button class="dash-quick-link" data-dash-page="sales">Sales analysis <span>→</span></button>'}
        <button class="dash-quick-link" id="dashReportBtn" type="button">Generate report <span>↓</span></button>
        <a class="dash-quick-link" href="/inventory/export" target="_blank" rel="noopener">Export inventory <span>↓</span></a>
      </div>
      <section class="dash-kpi-grid" id="dashStats" aria-label="Business key performance indicators">
        <button class="dash-kpi" data-kpi="products" type="button"><span class="dash-kpi-icon">▦</span><span class="dash-kpi-label">Total products</span><strong id="dashTotalProd">—</strong><small>Active in catalog</small></button>
        <button class="dash-kpi" data-kpi="stock" type="button"><span class="dash-kpi-icon">▤</span><span class="dash-kpi-label">Total stock units</span><strong id="dashTotalStock">—</strong><small>Units available</small></button>
        ${isAdmin ? '<button class="dash-kpi" data-kpi="inventory-value" type="button"><span class="dash-kpi-icon">◈</span><span class="dash-kpi-label">Inventory value</span><strong id="dashValue">—</strong><small>Current stock valuation</small></button>' : ''}
        <button class="dash-kpi" data-kpi="revenue" type="button"><span class="dash-kpi-icon">₹</span><span class="dash-kpi-label">Total revenue</span><strong id="dashRevenue">—</strong><small>Visible transactions</small></button>
        <button class="dash-kpi" data-kpi="orders" type="button"><span class="dash-kpi-icon">↗</span><span class="dash-kpi-label">Total orders</span><strong id="dashOrders">—</strong><small>Completed transactions</small></button>
        <button class="dash-kpi" data-kpi="aov" type="button"><span class="dash-kpi-icon">◉</span><span class="dash-kpi-label">Average order value</span><strong id="dashAov">—</strong><small>Revenue per order</small></button>
        <button class="dash-kpi" data-kpi="today" type="button"><span class="dash-kpi-icon">◷</span><span class="dash-kpi-label">Today's sales</span><strong id="dashTodaySales">—</strong><small>Revenue recorded today</small></button>
        <button class="dash-kpi is-warning" data-kpi="low" type="button"><span class="dash-kpi-icon">⚠</span><span class="dash-kpi-label">Low stock</span><strong id="dashLowStock">—</strong><small>At or below minimum level</small></button>
        <button class="dash-kpi is-danger" data-kpi="out" type="button"><span class="dash-kpi-icon">!</span><span class="dash-kpi-label">Out of stock</span><strong id="dashOutOfStock">—</strong><small>Products with zero stock</small></button>
        <button class="dash-kpi" data-kpi="reorder" type="button"><span class="dash-kpi-icon">⟳</span><span class="dash-kpi-label">Pending reorders</span><strong id="dashPendingReorders">—</strong><small>Products requiring attention</small></button>
      </section>
      <section class="dash-main-grid">
        <article class="panel dash-chart-panel">
          <div class="panel-head dash-panel-head"><div><div class="panel-title">Sales trend</div><div class="panel-sub" id="chartSub">Database-backed performance over the last 7 days</div></div>
            <div class="dash-chart-controls"><label for="salesMetricSelect">Metric</label><select class="select" id="salesMetricSelect"><option value="revenue">Revenue</option><option value="orders">Sales orders</option><option value="units_sold">Units sold</option></select><label for="salesPeriodSelect">Period</label><select class="select" id="salesPeriodSelect"><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option></select></div>
          </div>
          <div class="dash-chart-summary"><span id="dashChartMetricLabel">Revenue in selected period</span><strong id="dashChartTotal">—</strong></div>
          <div class="dash-chart-canvas" id="salesChartBox" aria-live="polite"><div class="dash-loading">Loading sales trend…</div></div>
        </article>
        <article class="panel dash-inventory-panel"><div class="panel-head"><div><div class="panel-title">Inventory health</div><div class="panel-sub">Current active stock distribution</div></div></div><div class="donut-wrap" id="donutBox"><div class="dash-loading">Loading inventory health…</div></div></article>
      </section>
      <section class="dash-secondary-grid">
        <article class="panel dash-table-panel"><div class="panel-head"><div><div class="panel-title">Inventory alerts</div><div class="panel-sub">Products at or below their minimum stock level</div></div><button class="btn btn-sm" data-dash-page="inventory">View inventory →</button></div><div class="dash-table-wrap" id="dashInventoryAlerts"><div class="dash-loading">Loading inventory alerts…</div></div></article>
        <article class="panel dash-list-panel"><div class="panel-head"><div><div class="panel-title">Recent sales</div><div class="panel-sub">Latest completed transactions</div></div><button class="btn btn-sm" data-dash-page="sales">View all →</button></div><div id="dashRecentSales"><div class="dash-loading">Loading transactions…</div></div></article>
      </section>
      <section class="dash-secondary-grid">
        <article class="panel dash-list-panel"><div class="panel-head"><div><div class="panel-title">Top-selling products</div><div class="panel-sub">Units sold over the last 30 days</div></div>${isAdmin ? '<button class="btn btn-sm" data-dash-page="analytics">Analytics →</button>' : '<button class="btn btn-sm" data-dash-page="sales">Sales →</button>'}</div><div id="dashTopProducts"><div class="dash-loading">Loading product performance…</div></div></article>
        <article class="panel dash-list-panel"><div class="panel-head"><div><div class="panel-title">Recent activity</div><div class="panel-sub">Latest recorded workspace events</div></div><button class="btn btn-sm" data-dash-page="activity">View history →</button></div><div id="dashRecentActivity"><div class="dash-loading">Loading activity…</div></div></article>
      </section>
      <section class="panel dash-insights-panel"><div class="panel-head"><div><div class="panel-title">Smart Decision Support</div><div class="panel-sub">Recommendations based on current inventory and recorded sales</div></div>${isAdmin ? '<button class="btn btn-sm" data-dash-page="analytics">View analytics →</button>' : '<button class="btn btn-sm" data-dash-page="sales">View sales →</button>'}</div><div class="insights" id="insightsContainer"><div class="dash-loading">Checking business signals…</div></div></section>
      <div class="dash-footer"><span>Last data refresh: <strong id="dashLastRefresh">Not refreshed yet</strong></span><span>Dashboard values are sourced from your InCraft database.</span></div>
    `;

    $('#dashRecordSaleBtn').onclick = () => openRecordSaleModal();
    $('#dashAddProductBtn')?.addEventListener('click', () => openAddProductModal());
    $('#dashImportBtn')?.addEventListener('click', () => openImportModal());
    $('#dashPrintBtn').onclick = () => window.print();
    $('#dashReportBtn').onclick = () => downloadDashboardReport();
    $('#dashRefreshBtn').onclick = () => refreshDashboardData(true);
    $$('[data-dash-page]').forEach(button => button.addEventListener('click', () => navigateTo(button.dataset.dashPage)));
    $$('[data-kpi]').forEach(button => button.addEventListener('click', () => navigateFromKpi(button.dataset.kpi)));
    $('#salesPeriodSelect').onchange = event => loadSalesTrend(Number(event.target.value), state.dashboardChartMetric);
    $('#salesMetricSelect').onchange = event => { state.dashboardChartMetric = event.target.value; loadSalesTrend(Number($('#salesPeriodSelect')?.value || 7), state.dashboardChartMetric); };
    refreshDashboardData(false);
  }

  function navigateFromKpi(kpi) {
    const routes = {
      products: ['inventory', ''], stock: ['inventory', ''], 'inventory-value': ['inventory', ''],
      revenue: [state.user?.role === 'admin' ? 'analytics' : 'sales', ''], orders: ['sales', ''], aov: ['sales', ''], today: ['sales', ''],
      low: ['inventory', '?filter=low-stock'], out: ['inventory', '?filter=out-of-stock'],
      reorder: ['inventory', '?filter=low-stock']
    };
    const target = routes[kpi];
    if (target) navigateTo(target[0], { query: target[1] });
  }

  async function refreshDashboardData(showMessage = false) {
    if (showMessage) toast('Refreshing dashboard data…');
    await Promise.all([
      loadDashboardSummary(),
      loadSalesTrend(Number($('#salesPeriodSelect')?.value || 7), state.dashboardChartMetric),
      loadSmartInsights()
    ]);
    state.dashboardLastRefresh = new Date();
    const label = $('#dashLastRefresh');
    if (label) label.textContent = state.dashboardLastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (showMessage) toast('Dashboard data refreshed.', 'success');
  }

  function csvCell(value) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }

  async function downloadDashboardReport() {
    toast('Preparing the latest 90-day business report…');
    const [summaryRes, trendRes] = await Promise.all([
      api('/api/dashboard/summary'),
      api('/api/dashboard/sales?days=90')
    ]);
    if (!summaryRes?.ok || !summaryRes.data?.success || !trendRes?.ok || !trendRes.data?.success) {
      toast('The report could not be generated because live data is unavailable.', 'error');
      return;
    }

    const metrics = summaryRes.data.metrics || {};
    const trend = trendRes.data;
    const rows = [
      ['InCraft Business Report'],
      ['Generated at', new Date().toLocaleString()],
      ['Sales trend period', 'Last 90 days'],
      [],
      ['Key Metric', 'Value'],
      ['Active products', metrics.total_products ?? 0],
      ['Total stock units', metrics.total_stock ?? 0],
      ['Inventory value', metrics.inventory_value === null ? 'Restricted' : metrics.inventory_value],
      ['Total revenue', metrics.total_revenue ?? 0],
      ['Total orders', metrics.total_orders ?? 0],
      ['Average order value', metrics.average_order_value ?? 0],
      ["Today's sales", metrics.todays_sales ?? 0],
      ['Low-stock products', metrics.low_stock ?? 0],
      ['Out-of-stock products', metrics.out_of_stock ?? 0],
      [],
      ['Daily Sales Trend', 'Revenue', 'Orders', 'Units Sold'],
      ...(trend.labels || []).map((day, index) => [
        day,
        trend.revenue?.[index] ?? trend.values?.[index] ?? 0,
        trend.orders?.[index] ?? 0,
        trend.units_sold?.[index] ?? 0
      ]),
      [],
      ['Top-selling Products (Last 30 Days)', 'Product Code', 'Units Sold', 'Revenue'],
      ...(summaryRes.data.top_products || []).map(product => [
        product.name || '',
        product.product_code || '',
        product.units_sold ?? 0,
        product.revenue ?? 0
      ])
    ];

    const csv = rows.map(row => row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `incraft-business-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Business report generated.', 'success');
  }

  async function loadDashboardSummary() {
    const res = await api('/api/dashboard/summary');
    if (!res?.ok || !res.data?.success) {
      const message = res?.data?.message || 'Unable to load dashboard metrics.';
      ['dashTotalProd','dashTotalStock','dashValue','dashRevenue','dashOrders','dashAov','dashTodaySales','dashLowStock','dashOutOfStock','dashPendingReorders'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = '—';
      });
      const alertBox = $('#dashInventoryAlerts');
      if (alertBox) alertBox.innerHTML = `<div class="dash-empty">${escapeHtml(message)}</div>`;
      return;
    }
    const m = res.data.metrics || {};
    const d = res.data.stock_distribution || {};
    state.summary = m;
    state.stockDistribution = d;
    const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    setText('dashTotalProd', Number(m.total_products || 0).toLocaleString());
    setText('dashTotalStock', Number(m.total_stock || 0).toLocaleString());
    setText('dashValue', m.inventory_value === null ? 'Restricted' : fmtMoney(m.inventory_value));
    setText('dashRevenue', fmtMoney(m.total_revenue));
    setText('dashOrders', Number(m.total_orders || 0).toLocaleString());
    setText('dashAov', fmtMoney(m.average_order_value));
    setText('dashTodaySales', fmtMoney(m.todays_sales));
    setText('dashLowStock', Number(m.low_stock || 0).toLocaleString());
    setText('dashOutOfStock', Number(m.out_of_stock || 0).toLocaleString());
    setText('dashPendingReorders', Number(m.pending_reorders || 0).toLocaleString());
    renderDonutChart(d);
    renderDashboardSections(res.data);
  }

  function renderDashboardSections(data) {
    const alerts = $('#dashInventoryAlerts');
    if (alerts) {
      const items = data.inventory_alerts || [];
      alerts.innerHTML = items.length ? `
        <table class="dash-table"><thead><tr><th>Product</th><th>Available</th><th>Minimum</th><th>Status</th></tr></thead><tbody>
          ${items.map(product => `<tr class="dash-product-row" data-product-id="${Number(product.product_id)}" tabindex="0" role="button" aria-label="View ${escapeHtml(product.name)}"><td><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.product_code)}</small></td><td>${Number(product.quantity || 0)}</td><td>${Number(product.minimum_stock || 0)}</td><td><span class="dash-status ${Number(product.quantity || 0) <= 0 ? 'danger' : 'warning'}">${Number(product.quantity || 0) <= 0 ? 'Out of stock' : 'Low stock'}</span></td></tr>`).join('')}
        </tbody></table>` : '<div class="dash-empty">No low-stock products found.</div>';
      alerts.querySelectorAll('[data-product-id]').forEach(row => {
        row.addEventListener('click', () => openProductDetails(row.dataset.productId));
        row.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openProductDetails(row.dataset.productId); } });
      });
    }

    const salesBox = $('#dashRecentSales');
    if (salesBox) {
      const sales = data.recent_sales || [];
      salesBox.innerHTML = sales.length ? sales.map(sale => `<button class="dash-record-row" type="button" data-open-sales><span class="dash-record-icon">↗</span><span class="dash-record-main"><strong>${escapeHtml(sale.invoice_number || ('Sale #' + sale.sale_id))}</strong><small>${escapeHtml(sale.customer_name || 'Walk-in Customer')} · ${Number(sale.units_sold || 0)} units · ${escapeHtml(sale.payment_method || '—')}</small></span><span class="dash-record-end"><strong>${fmtMoney(sale.total_amount)}</strong><small>${escapeHtml(fmtDate(sale.sale_date))}</small></span></button>`).join('') : '<div class="dash-empty">No sales have been recorded yet.</div>';
      salesBox.querySelectorAll('[data-open-sales]').forEach(row => row.addEventListener('click', () => navigateTo('sales')));
    }

    const topBox = $('#dashTopProducts');
    if (topBox) {
      const products = data.top_products || [];
      topBox.innerHTML = products.length ? products.map((product, index) => `<button class="dash-record-row" type="button" data-product-id="${Number(product.product_id)}"><span class="dash-rank">${index + 1}</span><span class="dash-record-main"><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.product_code)} · ${escapeHtml(product.category)}</small></span><span class="dash-record-end"><strong>${Number(product.units_sold || 0).toLocaleString()} units</strong><small>${fmtMoney(product.revenue)}</small></span></button>`).join('') : '<div class="dash-empty">No product sales are available for the last 30 days.</div>';
      topBox.querySelectorAll('[data-product-id]').forEach(row => row.addEventListener('click', () => openProductDetails(row.dataset.productId)));
    }

    const activityBox = $('#dashRecentActivity');
    if (activityBox) {
      const activities = data.recent_activities || [];
      activityBox.innerHTML = activities.length ? activities.map(activity => `<button class="dash-record-row" type="button" data-activity-type="${escapeHtml(activity.entity_type || '')}"><span class="dash-record-icon">◷</span><span class="dash-record-main"><strong>${escapeHtml(activity.description || activity.action || 'Workspace activity')}</strong><small>${escapeHtml(activity.entity_type || 'Activity')} · ${escapeHtml(fmtDate(activity.created_at))}</small></span><span class="dash-record-arrow">→</span></button>`).join('') : '<div class="dash-empty">No recent activity is available.</div>';
      activityBox.querySelectorAll('[data-activity-type]').forEach(row => row.addEventListener('click', () => {
        const entity = (row.dataset.activityType || '').toLowerCase();
        navigateTo(entity.includes('product') || entity.includes('inventory') ? 'inventory' : entity.includes('sale') ? 'sales' : 'activity');
      }));
    }
  }

  async function openProductDetails(productId) {
    const id = Number(productId);
    if (!Number.isInteger(id) || id <= 0) return;
    const res = await api(`/api/products/${id}`);
    if (!res?.ok || !res.data?.success || !res.data.product) {
      toast(res?.data?.message || 'Unable to open this product.', 'error');
      return;
    }
    const product = res.data.product;
    openModal(escapeHtml(product.name || 'Product details'), `Product code: ${escapeHtml(product.product_code || '—')}`, `
      <div class="dash-detail-grid">
        <div><small>Category</small><strong>${escapeHtml(product.category || '—')}</strong></div>
        <div><small>Available stock</small><strong>${Number(product.quantity || 0)}</strong></div>
        <div><small>Minimum stock</small><strong>${Number(product.minimum_stock || 0)}</strong></div>
        <div><small>Unit price</small><strong>${fmtMoney(product.price)}</strong></div>
        <div><small>Stock value</small><strong>${fmtMoney(product.stock_value)}</strong></div>
        <div><small>Status</small><strong>${escapeHtml(product.stock_status || '—')}</strong></div>
      </div><div class="modal-actions"><button type="button" class="btn" id="productDetailsClose">Close</button><button type="button" class="btn primary" id="productDetailsInventory">Open inventory</button></div>`
    );
    $('#productDetailsClose').onclick = closeModal;
    $('#productDetailsInventory').onclick = () => { closeModal(); navigateTo('inventory', { query: `?search=${encodeURIComponent(product.product_code || product.name || '')}` }); };
  }

  function renderDonutChart(dist) {
    const box = $('#donutBox');
    if (!box) return;
    const inCount = Number(dist.stock_in_count || 0);
    const lowCount = Number(dist.stock_low_count || 0);
    const outCount = Number(dist.stock_out_count || 0);
    const total = inCount + lowCount + outCount;
    if (total === 0) { box.innerHTML = '<div class="dash-empty">No product stock data available yet.</div>'; return; }
    const healthy = Math.round((inCount / total) * 100);
    const low = Math.round((lowCount / total) * 100);
    box.innerHTML = `
      <div class="donut" style="background:conic-gradient(var(--green) 0% ${healthy}%,var(--o) ${healthy}% ${healthy + low}%,var(--red) ${healthy + low}% 100%)"><span>${healthy}%<small>HEALTHY</small></span></div>
      <div class="legend">
        <button type="button" class="dash-legend-item" data-stock-filter="in-stock"><b style="background:var(--green)"></b>In stock <strong>${inCount}</strong></button>
        <button type="button" class="dash-legend-item" data-stock-filter="low-stock"><b style="background:var(--o)"></b>Low stock <strong>${lowCount}</strong></button>
        <button type="button" class="dash-legend-item" data-stock-filter="out-of-stock"><b style="background:var(--red)"></b>Out of stock <strong>${outCount}</strong></button>
      </div>`;
    box.querySelectorAll('[data-stock-filter]').forEach(button => button.addEventListener('click', () => navigateTo('inventory', { query: `?filter=${button.dataset.stockFilter}` })));
  }

  async function loadSalesTrend(days = 7, metric = 'revenue') {
    const box = $('#salesChartBox');
    if (!box) return;
    const requestId = ++state.dashboardTrendRequestId;
    state.dashboardChart?.destroy();
    state.dashboardChart = null;
    const sub = $('#chartSub');
    const label = $('#dashChartMetricLabel');
    const totalEl = $('#dashChartTotal');
    const metricLabels = { revenue: 'Revenue', orders: 'Sales orders', units_sold: 'Units sold' };
    if (sub) sub.textContent = `Daily ${metricLabels[metric] || 'sales'} performance over the last ${days} days`;
    if (label) label.textContent = `${metricLabels[metric] || 'Sales'} in selected period`;
    box.innerHTML = '<div class="dash-loading">Loading live sales data…</div>';
    const res = await api(`/api/dashboard/sales?days=${days}`);
    if (requestId !== state.dashboardTrendRequestId || !$('#salesChartBox')) return;
    if (!res?.ok || !res.data?.success) {
      box.innerHTML = `<div class="dash-empty dash-error">${escapeHtml(res?.data?.message || 'Sales trend could not be loaded.')}<button class="btn btn-sm" id="retrySalesTrend">Retry</button></div>`;
      $('#retrySalesTrend')?.addEventListener('click', () => loadSalesTrend(days, metric));
      if (totalEl) totalEl.textContent = '—';
      return;
    }
    const payload = res.data;
    const values = metric === 'revenue' ? (payload.revenue || payload.values || []) : metric === 'orders' ? (payload.orders || []) : (payload.units_sold || []);
    const labels = payload.labels || [];
    const total = payload.totals?.[metric] ?? payload.total ?? 0;
    if (totalEl) totalEl.textContent = metric === 'revenue' ? fmtMoney(total) : Number(total).toLocaleString();
    if (!values.length || values.every(value => Number(value) === 0)) {
      state.dashboardChart?.destroy();
      state.dashboardChart = null;
      box.innerHTML = '<div class="dash-empty">No transactions are recorded in this period.</div>';
      return;
    }
    const ready = window.InCraftChartReady ? await window.InCraftChartReady : Boolean(window.Chart);
    if (requestId !== state.dashboardTrendRequestId || !$('#salesChartBox')) return;
    if (!ready || !window.Chart) {
      box.innerHTML = '<div class="dash-empty dash-error">Chart.js could not be loaded. Check your connection and retry.<button class="btn btn-sm" id="retrySalesTrend">Retry</button></div>';
      $('#retrySalesTrend')?.addEventListener('click', () => loadSalesTrend(days, metric));
      return;
    }
    state.dashboardChart?.destroy();
    state.dashboardChart = null;
    box.innerHTML = '<canvas id="salesTrendCanvas" role="img" aria-label="Daily sales trend chart"></canvas>';
    const context = $('#salesTrendCanvas')?.getContext('2d');
    if (!context) { box.innerHTML = '<div class="dash-empty dash-error">The chart canvas could not be initialized.</div>'; return; }
    const isRevenue = metric === 'revenue';
    state.dashboardChart = new window.Chart(context, {
      type: isRevenue ? 'line' : 'bar',
      data: { labels, datasets: [{ label: metricLabels[metric], data: values.map(value => Number(value || 0)), borderColor: '#F47521', backgroundColor: isRevenue ? 'rgba(244,117,33,0.14)' : 'rgba(244,117,33,0.72)', borderWidth: isRevenue ? 2.5 : 1, fill: isRevenue, tension: 0.32, pointRadius: isRevenue ? 2.5 : 0, pointHoverRadius: 5, borderRadius: isRevenue ? 0 : 5, maxBarThickness: 28 }] },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => isRevenue ? `Revenue: ${fmtMoney(context.parsed.y)}` : `${metricLabels[metric]}: ${Number(context.parsed.y).toLocaleString()}` } } },
        scales: { x: { grid: { display: false }, ticks: { color: '#8B9098', maxTicksLimit: days === 7 ? 7 : 10 } }, y: { beginAtZero: true, grid: { color: 'rgba(130,136,145,0.16)' }, ticks: { color: '#8B9098', callback: value => isRevenue ? `${state.currency}${Number(value).toLocaleString()}` : Number(value).toLocaleString() } } }
      }
    });
  }

  async function loadSmartInsights() {
    const container = $('#insightsContainer');
    if (!container) return;
    const res = await api('/api/dashboard/insights');
    if (!res?.ok || !res.data?.success) {
      container.innerHTML = `<div class="dash-empty">${escapeHtml(res?.data?.message || 'Decision support is temporarily unavailable.')}</div>`;
      return;
    }
    const insights = res.data.insights || [];
    if (!insights.length) { container.innerHTML = '<div class="dash-empty">No actionable insights were returned for the current records.</div>'; return; }
    container.innerHTML = insights.map(insight => {
      const data = insight.data || {};
      const product = data.product || (data.products && data.products[0]) || {};
      const productId = data.product_id || product.product_id || null;
      const destination = productId ? 'product' : (['restock','slow-moving','optimization'].includes(insight.type) ? 'inventory' : 'analytics');
      return `<article class="dash-insight-card priority-${escapeHtml(insight.priority || 'low')}"><div class="dash-insight-top"><span class="dash-priority">${escapeHtml(insight.priority || 'low')}</span><span class="dash-insight-metric">${escapeHtml(insight.metric || '')}</span></div><strong>${escapeHtml(insight.title || 'Business insight')}</strong><p>${escapeHtml(insight.message || '')}</p><button class="btn btn-sm" type="button" data-insight-destination="${destination}" data-product-id="${Number(productId || 0)}">${productId ? 'View product' : 'View analysis'} →</button></article>`;
    }).join('');
    container.querySelectorAll('[data-insight-destination]').forEach(button => button.addEventListener('click', () => {
      if (button.dataset.insightDestination === 'product' && Number(button.dataset.productId) > 0) openProductDetails(button.dataset.productId);
      else if (button.dataset.insightDestination === 'inventory') navigateTo('inventory', { query: '?filter=low-stock' });
      else navigateTo(state.user?.role === 'admin' ? 'analytics' : 'sales');
    }));
  }


  // ============================================================
  // 2. INVENTORY MODULE
  // ============================================================

  async function renderInventory(container) {
    container.innerHTML = `
      <div class="head">
        <div>
          <div class="eyebrow">Workspace / Inventory</div>
          <h1>Inventory</h1>
          <p>Product catalog, stock status, and replenishment tracking.</p>
        </div>
        <div class="actions">
          <button class="btn" id="invImportBtn">Import CSV</button>
          <a class="btn" href="/inventory/export" target="_blank" download>Export CSV</a>
          <button class="btn primary" id="invAddBtn">+ Add product</button>
        </div>
      </div>

      <div class="filter">
        <label>
          ⌕ <input id="inventorySearch" placeholder="Search by name, code, category, supplier...">
        </label>
        <select class="select" id="invCategoryFilter" style="height:37px;min-width:140px;">
          <option value="">All Categories</option>
        </select>
        <select class="select" id="invStatusFilter" style="height:37px;min-width:130px;">
          <option value="">All Statuses</option>
          <option value="in">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      <div class="panel table-panel">
        <div class="table-head">
          <div class="panel-title">Product Catalog (<span id="invCount">0</span>)</div>
          <button class="btn btn-sm" id="refreshInvBtn">↻ Refresh</button>
        </div>
        <div class="table-scroll">
          <table class="table" id="inventoryTable">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Quantity</th>
                <th>Status</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody id="inventoryTbody">
              <tr><td colspan="6" style="text-align:center;padding:30px;color:var(--muted);">Loading products...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    $('#invAddBtn').onclick = () => openAddProductModal();
    $('#invImportBtn').onclick = () => openImportModal();
    $('#refreshInvBtn').onclick = () => loadInventoryData();

    $('#inventorySearch').oninput = filterProducts;
    $('#invCategoryFilter').onchange = filterProducts;
    $('#invStatusFilter').onchange = filterProducts;

    const params = new URLSearchParams(window.location.search);
    const incomingFilter = params.get('filter');
    const filterMap = { 'low-stock': 'low', low: 'low', 'out-of-stock': 'out', out: 'out', 'in-stock': 'in', in: 'in' };
    if (incomingFilter && filterMap[incomingFilter]) $('#invStatusFilter').value = filterMap[incomingFilter];
    const incomingSearch = params.get('search');
    if (incomingSearch) $('#inventorySearch').value = incomingSearch;
    loadInventoryData().then(() => filterProducts());
  }

  async function loadInventoryData() {
    const res = await api('/inventory');
    if (!res || !res.ok || !res.data) {
      $('#inventoryTbody').innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--muted);">Unable to load inventory records.</td></tr>`;
      return;
    }

    state.products = res.data.products || [];
    $('#invCount').textContent = state.products.length;

    // Populate category dropdown
    const categories = Array.from(new Set(state.products.map(p => p.category).filter(Boolean))).sort();
    const catSelect = $('#invCategoryFilter');
    if (catSelect) {
      catSelect.innerHTML = `<option value="">All Categories</option>` +
        categories.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    renderProductRows(state.products);
  }

  function filterProducts() {
    const q = ($('#inventorySearch')?.value || '').toLowerCase().trim();
    const cat = $('#invCategoryFilter')?.value || '';
    const st = $('#invStatusFilter')?.value || '';

    const filtered = state.products.filter(p => {
      const matchQ = !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.product_code && p.product_code.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.supplier && p.supplier.toLowerCase().includes(q));

      const matchCat = !cat || p.category === cat;

      const qty = Number(p.quantity || 0);
      const min = Number(p.minimum_stock || 10);
      let statusKey = 'in';
      if (qty <= 0) statusKey = 'out';
      else if (qty <= min) statusKey = 'low';

      const matchSt = !st || statusKey === st;
      return matchQ && matchCat && matchSt;
    });

    renderProductRows(filtered);
  }

  function renderProductRows(products) {
    const tbody = $('#inventoryTbody');
    if (!tbody) return;

    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--muted);">No matching products found.</td></tr>`;
      return;
    }

    tbody.innerHTML = products.map(p => {
      const qty = Number(p.quantity || 0);
      const min = Number(p.minimum_stock || 10);
      let statusClass = 'in';
      let statusText = 'In Stock';

      if (qty <= 0) {
        statusClass = 'out';
        statusText = 'Out of Stock';
      } else if (qty <= min) {
        statusClass = 'low';
        statusText = 'Low Stock';
      }

      return `
        <tr>
          <td>
            <div class="prod">
              <div class="thumb">📦</div>
              <div>
                <strong>${p.name || 'Unnamed Product'}</strong>
                <small>${p.product_code || 'PRD-#'}</small>
              </div>
            </div>
          </td>
          <td>${p.category || 'General'}</td>
          <td><strong>${fmtMoney(p.price)}</strong></td>
          <td>
            <strong>${qty}</strong>
            <small style="color:var(--muted);display:block;font-size:10px;">Min: ${min}</small>
          </td>
          <td><span class="status ${statusClass}">${statusText}</span></td>
          <td style="text-align:right;">
            <button class="btn btn-sm edit-prod-btn" data-id="${p.product_id}">Edit</button>
            <button class="btn btn-sm btn-danger del-prod-btn" data-id="${p.product_id}">Delete</button>
          </td>
        </tr>
      `;
    }).join('');

    $$('.edit-prod-btn').forEach(btn => {
      btn.onclick = () => {
        const prod = state.products.find(p => String(p.product_id) === btn.dataset.id);
        if (prod) openEditProductModal(prod);
      };
    });

    $$('.del-prod-btn').forEach(btn => {
      btn.onclick = () => {
        const prod = state.products.find(p => String(p.product_id) === btn.dataset.id);
        if (prod) confirmDeleteProduct(prod);
      };
    });
  }

  function openAddProductModal() {
    openModal(
      'Add New Product',
      'Enter product information to register it in inventory.',
      `
      <form id="addProductForm">
        <div class="form-grid">
          <label>
            Product Name *
            <input id="addProdName" required placeholder="Mechanical Keyboard">
          </label>
          <label>
            Product Code *
            <input id="addProdCode" required placeholder="PRD-KEY-01">
          </label>
        </div>
        <div class="form-grid">
          <label>
            Category *
            <input id="addProdCat" required placeholder="Electronics">
          </label>
          <label>
            Supplier
            <input id="addProdSupplier" placeholder="TechDist Co.">
          </label>
        </div>
        <div class="form-grid">
          <label>
            Unit Price ($) *
            <input id="addProdPrice" type="number" step="0.01" min="0" required placeholder="49.99">
          </label>
          <label>
            Initial Quantity *
            <input id="addProdQty" type="number" min="0" required placeholder="50">
          </label>
        </div>
        <label>
          Minimum Reorder Stock *
          <input id="addProdMinStock" type="number" min="1" value="10" required>
        </label>
        <div class="modal-actions">
          <button type="button" class="btn" id="cancelModalBtn">Cancel</button>
          <button type="submit" class="btn primary">Save product</button>
        </div>
      </form>
      `
    );

    $('#cancelModalBtn').onclick = closeModal;
    $('#addProductForm').onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        name: $('#addProdName').value.trim(),
        product_code: $('#addProdCode').value.trim(),
        category: $('#addProdCat').value.trim(),
        supplier: $('#addProdSupplier').value.trim(),
        price: $('#addProdPrice').value,
        quantity: $('#addProdQty').value,
        minimum_stock: $('#addProdMinStock').value
      };

      const res = await api('/inventory/add', {
        method: 'POST',
        body: payload
      });

      if (res && res.ok && res.data && res.data.success) {
        toast('Product added successfully!', 'success');
        closeModal();
        if (state.currentPage === 'dashboard') refreshDashboardData(false);
        else loadInventoryData();
      } else {
        toast(res?.data?.message || 'Error adding product.', 'error');
      }
    };
  }

  function openEditProductModal(prod) {
    openModal(
      `Edit ${prod.name}`,
      'Update stock, pricing, and product metadata.',
      `
      <form id="editProductForm">
        <div class="form-grid">
          <label>
            Product Name *
            <input id="editProdName" value="${prod.name || ''}" required>
          </label>
          <label>
            Product Code *
            <input id="editProdCode" value="${prod.product_code || ''}" required disabled>
          </label>
        </div>
        <div class="form-grid">
          <label>
            Category *
            <input id="editProdCat" value="${prod.category || ''}" required>
          </label>
          <label>
            Supplier
            <input id="editProdSupplier" value="${prod.supplier || ''}">
          </label>
        </div>
        <div class="form-grid">
          <label>
            Unit Price ($) *
            <input id="editProdPrice" type="number" step="0.01" min="0" value="${prod.price || 0}" required>
          </label>
          <label>
            Current Quantity *
            <input id="editProdQty" type="number" min="0" value="${prod.quantity || 0}" required>
          </label>
        </div>
        <label>
          Minimum Reorder Stock *
          <input id="editProdMinStock" type="number" min="1" value="${prod.minimum_stock || 10}" required>
        </label>
        <div class="modal-actions">
          <button type="button" class="btn" id="cancelEditBtn">Cancel</button>
          <button type="submit" class="btn primary">Save changes</button>
        </div>
      </form>
      `
    );

    $('#cancelEditBtn').onclick = closeModal;
    $('#editProductForm').onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        name: $('#editProdName').value.trim(),
        category: $('#editProdCat').value.trim(),
        supplier: $('#editProdSupplier').value.trim(),
        price: $('#editProdPrice').value,
        quantity: $('#editProdQty').value,
        minimum_stock: $('#editProdMinStock').value
      };

      const res = await api(`/inventory/edit/${prod.product_id}`, {
        method: 'POST',
        body: payload
      });

      if (res && res.ok && res.data && res.data.success) {
        toast('Product updated successfully!', 'success');
        closeModal();
        if (state.currentPage === 'dashboard') refreshDashboardData(false);
        else loadInventoryData();
      } else {
        toast(res?.data?.message || 'Error updating product.', 'error');
      }
    };
  }

  function confirmDeleteProduct(prod) {
    openModal(
      `Delete ${prod.name}?`,
      'This will archive the product from active inventory.',
      `
      <p style="font-size:13px;color:var(--muted);line-height:1.5;">Are you sure you want to remove <strong>${prod.name}</strong> (${prod.product_code})? Active transactions referencing this item will be preserved.</p>
      <div class="modal-actions" style="margin-top:24px;">
        <button class="btn" id="cancelDelBtn">Cancel</button>
        <button class="btn primary" id="confirmDelBtn" style="background:var(--red);border-color:var(--red);">Yes, delete product</button>
      </div>
      `
    );

    $('#cancelDelBtn').onclick = closeModal;
    $('#confirmDelBtn').onclick = async () => {
      const res = await api(`/inventory/delete/${prod.product_id}`, { method: 'POST' });
      if (res && res.ok) {
        toast('Product deleted.', 'info');
        closeModal();
        if (state.currentPage === 'dashboard') refreshDashboardData(false);
        else loadInventoryData();
      } else {
        toast('Failed to delete product.', 'error');
      }
    };
  }

  function openImportModal() {
    openModal(
      'Import Products from CSV',
      'Upload a CSV file containing inventory products.',
      `
      <form id="importForm" enctype="multipart/form-data">
        <p style="font-size:12px;color:var(--muted);margin-bottom:14px;">CSV columns expected: <code>product_code, name, category, quantity, price, minimum_stock, supplier</code></p>
        <label>
          Select CSV File
          <input type="file" id="csvFileInput" accept=".csv" required style="padding-top:8px;">
        </label>
        <div class="modal-actions" style="margin-top:20px;">
          <button type="button" class="btn" id="cancelImportBtn">Cancel</button>
          <button type="submit" class="btn primary">Upload & Import</button>
        </div>
      </form>
      `
    );

    $('#cancelImportBtn').onclick = closeModal;
    $('#importForm').onsubmit = async (e) => {
      e.preventDefault();
      const fileInput = $('#csvFileInput');
      if (!fileInput.files.length) return;

      const fd = new FormData();
      fd.append('file', fileInput.files[0]);

      toast('Importing CSV file...', 'info');
      const res = await api('/inventory/import', {
        method: 'POST',
        body: fd
      });

      if (res && res.ok) {
        toast('Inventory imported successfully!', 'success');
        closeModal();
        if (state.currentPage === 'dashboard') refreshDashboardData(false);
        else loadInventoryData();
      } else {
        toast(res?.data?.message || 'Error importing CSV.', 'error');
      }
    };
  }

  // ============================================================
  // 3. SALES MODULE
  // ============================================================

  async function renderSales(container) {
    container.innerHTML = `
      <div class="head">
        <div>
          <div class="eyebrow">Workspace / Sales</div>
          <h1>Sales</h1>
          <p>Record transactions and monitor revenue generation.</p>
        </div>
        <div class="actions">
          <a class="btn" href="/sales/export" target="_blank" download>Export sales</a>
          <button class="btn primary" id="recordSaleBtn">+ Record sale</button>
        </div>
      </div>

      <div class="stats" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px;">
        <div class="stat"><div class="stat-top"><span>Today's sales</span><b class="stat-icon">↗</b></div><strong id="salesTodayVal">—</strong><small>Daily volume</small></div>
        <div class="stat"><div class="stat-top"><span>Total orders</span><b class="stat-icon">📦</b></div><strong id="salesOrdersCount">—</strong><small>All-time orders</small></div>
        <div class="stat"><div class="stat-top"><span>Total revenue</span><b class="stat-icon">◈</b></div><strong id="salesTotalVal">—</strong><small>Lifetime revenue</small></div>
      </div>

      <div class="panel table-panel">
        <div class="table-head">
          <div class="panel-title">Sales Transactions (<span id="salesCount">0</span>)</div>
          <button class="btn btn-sm" id="refreshSalesBtn">↻ Refresh</button>
        </div>
        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th>Sale ID</th>
                <th>Customer</th>
                <th>Products / Quantity</th>
                <th>Total Amount</th>
                <th>Payment Method</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody id="salesTbody">
              <tr><td colspan="6" style="text-align:center;padding:30px;color:var(--muted);">Loading transactions...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    $('#recordSaleBtn').onclick = () => openRecordSaleModal();
    $('#refreshSalesBtn').onclick = () => loadSalesData();

    loadSalesData();
  }

  async function loadSalesData() {
    const res = await api('/sales');
    if (!res || !res.ok || !res.data) {
      $('#salesTbody').innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--muted);">Unable to load sales records.</td></tr>`;
      return;
    }

    state.sales = res.data.sales || [];
    const sum = res.data.summary || {};

    $('#salesCount').textContent = state.sales.length;
    $('#salesTodayVal').textContent = fmtMoney(sum.todays_sales);
    $('#salesOrdersCount').textContent = sum.total_orders || state.sales.length;
    $('#salesTotalVal').textContent = fmtMoney(sum.total_revenue);

    const tbody = $('#salesTbody');
    if (state.sales.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--muted);">No sales recorded yet. Click "Record sale" to begin.</td></tr>`;
      return;
    }

    tbody.innerHTML = state.sales.map(s => `
      <tr>
        <td><strong>#${s.sale_id}</strong></td>
        <td>${s.customer_name || 'Walk-in Customer'}</td>
        <td>
          <strong>${s.product_name || s.items_summary || 'Order items'}</strong>
          <small style="display:block;color:var(--muted);">${s.total_quantity || s.quantity || 1} units</small>
        </td>
        <td><strong style="color:var(--green);">${fmtMoney(s.total_amount)}</strong></td>
        <td><span class="badge-role">${s.payment_method || 'Cash'}</span></td>
        <td style="color:var(--muted);font-size:11px;">${fmtDate(s.sale_date || s.created_at)}</td>
      </tr>
    `).join('');
  }

  async function openRecordSaleModal() {
    // Fetch fresh active products list
    const res = await api('/inventory');
    const products = res?.data?.products || state.products || [];
    const activeProds = products.filter(p => Number(p.quantity || 0) > 0);

    if (activeProds.length === 0) {
      toast('No products currently in stock to sell. Please add or restock inventory first.', 'error');
      return;
    }

    openModal(
      'Record New Sale',
      'Select a product and record the transaction.',
      `
      <form id="recordSaleForm">
        <label>
          Select Product *
          <select id="saleProductSelect" required style="height:42px;border:1px solid var(--line);border-radius:8px;padding:0 10px;background:var(--card);color:var(--ink);">
            <option value="">-- Choose in-stock product --</option>
            ${activeProds.map(p => `
              <option value="${p.product_id}" data-price="${p.price}" data-stock="${p.quantity}">
                ${p.name} (${p.quantity} available) — ${fmtMoney(p.price)}
              </option>
            `).join('')}
          </select>
        </label>
        <div class="form-grid">
          <label>
            Quantity to Sell *
            <input id="saleQuantity" type="number" min="1" max="1" value="1" required>
          </label>
          <label>
            Total Calculation
            <input id="saleTotalPreview" readonly value="${fmtMoney(0)}" style="background:var(--bg);font-weight:700;color:var(--green);">
          </label>
        </div>
        <div class="form-grid">
          <label>
            Customer Name
            <input id="saleCustomerName" placeholder="Client or Walk-in">
          </label>
          <label>
            Payment Method *
            <select id="salePaymentMethod" style="height:42px;border:1px solid var(--line);border-radius:8px;padding:0 10px;background:var(--card);color:var(--ink);">
              <option value="cash">Cash</option>
              <option value="card">Credit / Debit Card</option>
              <option value="upi">UPI / Digital</option>
              <option value="netbanking">Net Banking</option>
            </select>
          </label>
        </div>
        <div class="modal-actions" style="margin-top:20px;">
          <button type="button" class="btn" id="cancelSaleBtn">Cancel</button>
          <button type="submit" class="btn primary">Complete sale <span>→</span></button>
        </div>
      </form>
      `
    );

    const sel = $('#saleProductSelect');
    const qtyInput = $('#saleQuantity');
    const totalPreview = $('#saleTotalPreview');

    function updateTotal() {
      const opt = sel.options[sel.selectedIndex];
      if (!opt || !opt.dataset.price) {
        totalPreview.value = fmtMoney(0);
        return;
      }
      const price = Number(opt.dataset.price);
      const maxStock = Number(opt.dataset.stock);
      qtyInput.max = maxStock;
      const qty = Math.min(Math.max(1, Number(qtyInput.value || 1)), maxStock);
      qtyInput.value = qty;
      totalPreview.value = fmtMoney(price * qty);
    }

    sel.onchange = updateTotal;
    qtyInput.oninput = updateTotal;

    $('#cancelSaleBtn').onclick = closeModal;
    $('#recordSaleForm').onsubmit = async (e) => {
      e.preventDefault();
      const productId = sel.value;
      const qty = qtyInput.value;
      const customer = $('#saleCustomerName').value.trim() || 'Walk-in Customer';
      const payment = $('#salePaymentMethod').value;

      if (!productId) {
        toast('Please select an in-stock product.', 'error');
        return;
      }

      const res = await api('/sales/create', {
        method: 'POST',
        body: {
          product_id: productId,
          quantity: qty,
          payment_method: payment,
          customer_name: customer,
          idempotency_key: (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now())
        }
      });

      if (res && res.ok && res.data && res.data.success) {
        toast(`Sale of ${qty} units completed successfully!`, 'success');
        closeModal();
        if (state.currentPage === 'sales') loadSalesData();
        else if (state.currentPage === 'dashboard') refreshDashboardData(false);
      } else {
        toast(res?.data?.message || 'Error completing sale transaction.', 'error');
      }
    };
  }

  // ============================================================
  // 4. ANALYTICS MODULE
  // ============================================================

  async function renderAnalytics(container) {
    container.innerHTML = `
      <div class="head">
        <div>
          <div class="eyebrow">Workspace / Analytics</div>
          <h1>Analytics & Machine Learning</h1>
          <p>Sales trends, product velocities, and predictive demand insights.</p>
        </div>
        <div class="actions">
          <select class="select" id="analyticsPeriod">
            <option value="6">Period: Last 6 months</option>
            <option value="3">Period: Last 3 months</option>
            <option value="12">Period: Last 12 months</option>
          </select>
        </div>
      </div>

      <div class="grid" style="margin-bottom:24px;">
        <div class="panel">
          <div class="panel-head">
            <div>
              <div class="panel-title">Monthly Revenue Performance</div>
              <div class="panel-sub">Aggregated sales by calendar month</div>
            </div>
          </div>
          <div id="analyticsMonthlyChart" style="height:220px;display:grid;place-items:center;color:var(--muted);font-size:12px;">Loading trends...</div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <div>
              <div class="panel-title">Top Revenue Contributors</div>
              <div class="panel-sub">Highest grossing products</div>
            </div>
          </div>
          <div id="topProductsList" style="display:grid;gap:12px;padding-top:6px;">
            <div style="color:var(--muted);font-size:12px;">Loading contributors...</div>
          </div>
        </div>
      </div>

      <div class="head" style="margin-bottom:14px;">
        <div>
          <div class="panel-title" style="font-size:18px;">Machine Learning Forecasting & Stockout Risks</div>
          <div class="panel-sub">AI models predicting 30-day demand and replenishment urgency.</div>
        </div>
      </div>

      <div class="insights" id="mlInsightsContainer">
        <div class="insight"><b>✦</b><strong>Evaluating models...</strong><span>Calculating risk scores from sales velocity.</span></div>
      </div>
    `;

    $('#analyticsPeriod').onchange = (e) => loadAnalyticsData(Number(e.target.value));
    loadAnalyticsData(6);
    loadMLModels();
  }

  async function loadAnalyticsData(months = 6) {
    const res = await api(`/api/analytics?months=${months}`);
    if (!res || !res.ok || !res.data) return;

    const { monthly_sales, top_products } = res.data;

    // Monthly Chart
    const chartBox = $('#analyticsMonthlyChart');
    if (chartBox) {
      if (!monthly_sales || monthly_sales.length === 0) {
        chartBox.innerHTML = `No historical monthly sales records available yet.`;
      } else {
        const maxVal = Math.max(...monthly_sales.map(m => m.revenue || m.total || 0), 10);
        chartBox.innerHTML = `
          <div style="display:flex;align-items:flex-end;gap:14px;height:100%;padding:10px 0;">
            ${monthly_sales.map(m => {
              const val = m.revenue || m.total || 0;
              const hPct = Math.max(12, Math.round((val / maxVal) * 100));
              return `
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;">
                  <div style="width:100%;height:${hPct}%;background:var(--o);border-radius:6px 6px 0 0;" title="${m.month}: ${fmtMoney(val)}"></div>
                  <small style="font-size:10px;color:var(--muted);">${m.month || ''}</small>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }
    }

    // Top Products
    const topBox = $('#topProductsList');
    if (topBox) {
      if (!top_products || top_products.length === 0) {
        topBox.innerHTML = `<div style="color:var(--muted);font-size:12px;">No sales by product recorded yet.</div>`;
      } else {
        topBox.innerHTML = top_products.slice(0, 5).map((p, idx) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--line);">
            <div style="display:flex;gap:10px;align-items:center;">
              <span style="font-weight:700;color:var(--o);font-size:12px;">0${idx + 1}</span>
              <div>
                <strong>${p.name}</strong>
                <small style="display:block;color:var(--muted);font-size:10px;">${p.quantity_sold || p.total_units || 0} units sold</small>
              </div>
            </div>
            <strong>${fmtMoney(p.revenue || p.total_revenue || 0)}</strong>
          </div>
        `).join('');
      }
    }
  }

  async function loadMLModels() {
    const box = $('#mlInsightsContainer');
    if (!box) return;

    if (state.user?.role !== 'admin') {
      box.innerHTML = '<div class="insight"><b>◈ ADMINISTRATOR ACCESS</b><strong>Machine learning recommendations are restricted</strong><span>Ask an administrator to review forecasting and reorder recommendations.</span></div>';
      return;
    }

    const [forecastRes, riskRes, reorderRes] = await Promise.all([
      api('/api/ml/forecast'),
      api('/api/ml/stockout-risk'),
      api('/api/ml/reorder-recommendations')
    ]);

    const cards = [];

    const risks = riskRes?.ok ? (riskRes.data?.risks || []) : [];
    const forecasts = forecastRes?.ok ? (forecastRes.data?.forecasts || []) : [];
    const recommendations = reorderRes?.ok ? (reorderRes.data?.recommendations || []) : [];
    const riskByProduct = new Map(risks.map(item => [String(item.product_id), item]));
    const forecastByProduct = new Map(forecasts.map(item => [String(item.product_id), item]));
    const reorderByProduct = new Map(recommendations.map(item => [String(item.product_id), item]));
    const ids = Array.from(new Set([...risks, ...forecasts, ...recommendations].map(item => String(item.product_id))));
    ids.slice(0, 8).forEach(id => {
      const risk = riskByProduct.get(id), forecast = forecastByProduct.get(id), reorder = reorderByProduct.get(id);
      const product = risk || forecast || reorder;
      const details = [];
      if (forecast) details.push(`7-day demand ${Number(forecast.forecast_units_7d || 0)} units; 30-day demand ${Number(forecast.forecast_units_30d || 0)} units; ${escapeHtml(forecast.confidence || 'unknown')} confidence`);
      if (risk) details.push(`Stockout risk ${escapeHtml(risk.risk_level || 'unknown')} (${Number(risk.risk_score || 0)}/100); ${escapeHtml(risk.reason || '')}`);
      if (reorder && reorder.reorder_now) details.push(`Recommended reorder ${Number(reorder.recommended_order_quantity || 0)} units; ${escapeHtml(reorder.urgency || 'monitor')} urgency`);
      cards.push(`<article class="insight dash-ml-card"><b>${risk?.risk_level === 'high' ? '⚠ HIGH STOCKOUT RISK' : '◈ INVENTORY INTELLIGENCE'}</b><strong>${escapeHtml(product?.name || 'Product')}</strong><span>Current stock: ${Number(product?.current_stock || 0)} units. ${details.join(' · ')}</span><button type="button" class="btn btn-sm" data-ml-product="${Number(product?.product_id || 0)}">View product →</button></article>`);
    });
    if (!cards.length) {
      const failed = [forecastRes, riskRes, reorderRes].some(result => !result?.ok);
      cards.push(`<div class="insight"><b>✦ INVENTORY INTELLIGENCE</b><strong>${failed ? 'Some model results are unavailable' : 'No product recommendations'}</strong><span>${failed ? 'One or more ML services could not return results. Retry the analysis later.' : 'The models returned no products requiring a recommendation for current inventory.'}</span></div>`);
    }
    box.innerHTML = cards.join('');
    box.querySelectorAll('[data-ml-product]').forEach(button => button.addEventListener('click', () => openProductDetails(button.dataset.mlProduct)));
  }

  // ============================================================
  // 5. ACTIVITY HISTORY MODULE
  // ============================================================

  async function renderActivity(container) {
    container.innerHTML = `
      <div class="head">
        <div>
          <div class="eyebrow">Workspace / Activity</div>
          <h1>Activity History</h1>
          <p>Auditable tracking of inventory operations, sales, and user logins.</p>
        </div>
        <div class="actions">
          <button class="btn btn-sm" id="refreshActBtn">↻ Refresh</button>
        </div>
      </div>

      <div class="panel">
        <div class="activity" id="activityList">
          <div style="padding:20px;text-align:center;color:var(--muted);">Loading audit logs...</div>
        </div>
      </div>
    `;

    $('#refreshActBtn').onclick = () => loadActivityData();
    loadActivityData();
  }

  async function loadActivityData() {
    const res = await api('/activity');
    const list = $('#activityList');
    if (!list) return;

    if (!res || !res.ok || !res.data || !res.data.activities) {
      list.innerHTML = `<div style="padding:30px;text-align:center;color:var(--muted);">No activity history records available.</div>`;
      return;
    }

    const items = res.data.activities;
    if (items.length === 0) {
      list.innerHTML = `<div style="padding:30px;text-align:center;color:var(--muted);">No audit events recorded yet.</div>`;
      return;
    }

    list.innerHTML = items.map(act => {
      const actType = (act.action || 'EVENT').toUpperCase();
      let icon = '✦';
      let iconColor = 'var(--o)';

      if (actType.includes('SALE')) {
        icon = '↗';
        iconColor = 'var(--green)';
      } else if (actType.includes('DELETE')) {
        icon = '✕';
        iconColor = 'var(--red)';
      } else if (actType.includes('LOGIN')) {
        icon = '🔒';
        iconColor = 'var(--o)';
      } else if (actType.includes('ADD')) {
        icon = '+';
        iconColor = 'var(--green)';
      }

      return `
        <div class="event">
          <i style="color:${iconColor};">${icon}</i>
          <div>
            <strong>${act.description || act.action || 'System action'}</strong>
            <small>${act.username ? `By ${act.username} • ` : ''}${fmtDate(act.created_at)}</small>
          </div>
        </div>
      `;
    }).join('');
  }

  // ============================================================
  // 6. SETTINGS MODULE
  // ============================================================

  async function renderSettings(container) {
    const res = await api('/settings');
    const user = res?.data?.user || state.user || {};

    container.innerHTML = `
      <div class="head">
        <div>
          <div class="eyebrow">Workspace / Preferences</div>
          <h1>Settings</h1>
          <p>Personalize your workspace and configure inventory preferences.</p>
        </div>
        <button class="btn primary" id="saveSettingsBtn">Save changes</button>
      </div>

      <div class="settings-grid">
        <div class="panel setting-card">
          <div class="panel-title">Account settings</div>
          <div class="panel-sub">Profile and user credentials</div>
          <div class="settings-fields">
            <label>
              Full name
              <input id="settingName" value="${user.username || user.name || ''}" placeholder="Your full name">
            </label>
            <label>
              Email address
              <input value="${user.email || 'user@company.com'}" disabled title="Email is managed by administrator">
            </label>
            <label>
              Account role
              <input value="${(user.role || 'Administrator').toUpperCase()}" disabled>
            </label>
            <label>
              Security status
              <input value="Active & Authenticated" disabled style="color:var(--green);font-weight:600;">
            </label>
          </div>
        </div>

        <div class="panel setting-card">
          <div class="panel-title">Appearance</div>
          <div class="panel-sub">Choose visual display theme</div>
          <div class="choice-list">
            <label>
              <input type="radio" name="appearanceRadio" value="light" ${state.theme === 'light' ? 'checked' : ''}>
              Light theme <small>Clean, crisp, high contrast</small>
            </label>
            <label>
              <input type="radio" name="appearanceRadio" value="dark" ${state.theme === 'dark' ? 'checked' : ''}>
              Dark theme <small>Obsidian dark palette</small>
            </label>
            <label>
              <input type="radio" name="appearanceRadio" value="system" ${state.theme === 'system' ? 'checked' : ''}>
              System theme <small>Matches device settings</small>
            </label>
          </div>
          <label class="setting-check" style="margin-top:14px;">
            <input type="checkbox" id="compactTablesCheck"> Compact table density
          </label>
        </div>

        <div class="panel setting-card">
          <div class="panel-title">Inventory & Currency</div>
          <div class="panel-sub">Display defaults and reorder thresholds</div>
          <div class="settings-fields">
            <label>
              Currency Symbol
              <select id="currencySelect">
                <option value="$" ${state.currency === '$' ? 'selected' : ''}>USD — $</option>
                <option value="₹" ${state.currency === '₹' ? 'selected' : ''}>INR — ₹</option>
                <option value="€" ${state.currency === '€' ? 'selected' : ''}>EUR — €</option>
                <option value="£" ${state.currency === '£' ? 'selected' : ''}>GBP — £</option>
              </select>
            </label>
            <label>
              Default reorder level
              <input id="defaultReorderInput" type="number" value="10">
            </label>
          </div>
        </div>

        <div class="panel setting-card">
          <div class="panel-title">Notifications & Security</div>
          <div class="panel-sub">System alert triggers</div>
          <div class="toggle-list">
            <label>Low stock alerts <input type="checkbox" checked></label>
            <label>Out of stock notifications <input type="checkbox" checked></label>
            <label>Sale transaction completed <input type="checkbox" checked></label>
          </div>
        </div>
      </div>
    `;

    // Appearance change
    $$('input[name="appearanceRadio"]').forEach(radio => {
      radio.onchange = () => {
        applyTheme(radio.value);
        toast(`Appearance updated to ${radio.value} mode.`);
      };
    });

    $('#saveSettingsBtn').onclick = async () => {
      const btn = $('#saveSettingsBtn');
      const newName = $('#settingName')?.value.trim();
      const curr = $('#currencySelect')?.value || '$';

      // Validate
      if (!newName) {
        toast('Full name cannot be empty.', 'error');
        $('#settingName')?.focus();
        return;
      }

      // Save currency preference locally
      state.currency = curr;
      localStorage.setItem('incraft_currency', curr);

      // Disable button & show loading state
      btn.disabled = true;
      btn.textContent = 'Saving\u2026';

      try {
        const res = await api('/settings', {
          method: 'POST',
          body: {
            username: newName,
            email: state.user?.email || ''
          }
        });

        if (res && res.ok) {
          // Update in-memory state
          state.user.name = newName;
          state.user.username = newName;
          // Refresh header avatar & display name
          const avatarEl = $('#headerAvatar');
          const nameEl = $('#profileName');
          if (avatarEl) avatarEl.textContent = newName.slice(0, 2).toUpperCase();
          if (nameEl) nameEl.textContent = newName;
          toast('Settings saved successfully!', 'success');
        } else {
          const msg = res?.data?.message || 'Could not save settings. Please try again.';
          toast(msg, 'error');
        }
      } catch (e) {
        toast('An error occurred. Please try again.', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Save changes';
      }
    };
  }

  // ============================================================
  // APP INITIALIZATION
  // ============================================================

  async function init() {
    const user = await checkSession();
    const pathname = window.location.pathname.toLowerCase();

    if (!user) {
      if (pathname.includes('register')) {
        showSignup();
      } else if (pathname.includes('login')) {
        showLogin();
      } else {
        showLanding();
      }
      return;
    }

    // Determine target page from URL, respecting the existing Analytics role restriction.
    let targetPage = 'dashboard';
    if (pathname.includes('inventory')) targetPage = 'inventory';
    else if (pathname.includes('sales')) targetPage = 'sales';
    else if (pathname.includes('analytics')) targetPage = state.user?.role === 'admin' ? 'analytics' : 'sales';
    else if (pathname.includes('activity')) targetPage = 'activity';
    else if (pathname.includes('settings')) targetPage = 'settings';

    if (pathname.includes('analytics') && targetPage === 'sales') {
      window.history.replaceState({ page: 'sales' }, '', '/sales');
    }
    showAppShell(targetPage);
  }

  // Start application on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
