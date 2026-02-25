// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const modal = document.getElementById('detailModal');

// Utility Functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  }).format(amount);
}

function formatNumber(number) {
  return new Intl.NumberFormat('ru-RU').format(number);
}

function calculateWorkExperience(startDate) {
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = Math.abs(now - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);

  if (years > 0) {
    return `${years} г. ${months} мес.`;
  }
  return `${months} мес.`;
}

function getInitials(name) {
  return name.split(' ').map(word => word[0]).join('').toUpperCase();
}

// Navigation
function initNavigation() {
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabName = item.dataset.tab;
      switchTab(tabName);
    });
  });

  sidebarToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });
}

function switchTab(tabName) {
  // Update active nav item
  navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabName);
  });

  // Update active tab content
  tabContents.forEach(content => {
    content.classList.toggle('active', content.id === tabName);
  });

  currentTab = tabName;

  // Initialize tab-specific content
  switch (tabName) {
    case 'status':
      initStatusTab();
      break;
    case 'finance':
      setTimeout(() => {
        initFinanceTab();
      }, 100);
      break;
    case 'employees':
      initEmployeesTab();
      break;
    case 'clients':
      initClientsTab();
      break;
    case 'leads':
      initLeadsTab();
      break;
    case 'insights':
      initInsightsTab();
      break;
      case 'settings':
  initSettingsTab();
  break;
    case 'receivables':
      initReceivablesTab();
      break;
  }
}

// Status Tab
function initStatusTab() {
  Promise.resolve()
    .then(() => initKanbanBoard())
    .catch((err) => {
      console.error('initKanbanBoard failed', err);
      showToast('Ошибка загрузки канбана', 'error');
    });

  updateMetricsByPeriod();
}

function updateMetricsByPeriod() {
  const metrics = statusBoardState.metrics || {};
  const nearestPayments = Number(metrics.nearest_payments || 0);
  const confirmedTotal = Number(metrics.confirmed_total || 0);
  const mrr = Number(metrics.mrr || 0);

  const nearestPaymentsElement = document.getElementById('nearestPaymentsValue');
  const confirmedTotalElement = document.getElementById('confirmedTotalValue');
  const mrrElement = document.getElementById('mrrValue');
  const revenueElement = document.getElementById('totalRevenueValue');

  if (nearestPaymentsElement) {
    nearestPaymentsElement.textContent = formatCurrency(nearestPayments);
  }

  if (confirmedTotalElement) {
    confirmedTotalElement.textContent = formatCurrency(confirmedTotal);
  }

  if (revenueElement) revenueElement.textContent = formatCurrency(confirmedTotal);
  if (mrrElement) mrrElement.textContent = formatCurrency(mrr);
}

function initRevenueChart() {
  const ctx = document.getElementById('revenueChart');
  if (!ctx) return;

  if (charts.revenue) {
    charts.revenue.destroy();
  }

  const monthlyData = generateMonthlyData();

  charts.revenue = new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthlyData.labels,
      datasets: [{
        label: 'Выручка',
        data: monthlyData.data,
        borderColor: '#32D0E6',
        backgroundColor: 'rgba(50, 208, 230, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#32D0E6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        },
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          }
        }
      },
      animation: {
        duration: 2000,
        easing: 'easeInOutCubic'
      }
    }
  });
}

function generateMonthlyData() {
  // Generate realistic monthly revenue data
  const months = ['Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь'];
  const baseRevenue = 955650;
  const data = [];

  for (let i = 0; i < 6; i++) {
    const variation = (Math.random() - 0.5) * 0.3;
    const revenue = baseRevenue * (1 + variation);
    data.push(Math.round(revenue));
  }

  data[data.length - 1] = baseRevenue; // Current month actual data

  return { labels: months, data };
}

const INVOICE_PLAN_STATUS = {
  planned: 'planned',
  waiting: 'sent_waiting_payment',
  paid: 'paid'
};

let invoicePlanState = {
  items: [],
  draggedPlanId: null,
  selectedClientId: null,
  mode: 'send',
  currentPlan: null,
  workCategories: [],
  clientOptions: []
};

let statusBoardState = {
  projects: [],
  endMonth: [],
  waitingRecent: [],
  waitingOverdue: [],
  metrics: {},
  meta: {}
};
let actsBootstrapLoading = false;
let projectStatusOptions = [];

async function initKanbanBoard() {
  await loadStatusBoard();
  bindInvoicePlanModalActions();
  bindStatusActions();
}

async function ensureProjectStatuses() {
  if (Array.isArray(projectStatusOptions) && projectStatusOptions.length > 0) return;
  try {
    const resp = await fetch('/api.php/finance/project-statuses', {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });
    const result = await resp.json().catch(() => null);
    const rows = Array.isArray(result?.data) ? result.data : [];
    if (resp.ok && rows.length > 0) {
      projectStatusOptions = rows;
    } else {
      projectStatusOptions = [
        { code: 'in_progress', name: 'В работе' },
        { code: 'to_pay', name: 'Выставить счет' }
      ];
    }
  } catch (e) {
    projectStatusOptions = [
      { code: 'in_progress', name: 'В работе' },
      { code: 'to_pay', name: 'Выставить счет' }
    ];
  }
}

function populateProjectStatusOptions(selectedCode = 'in_progress') {
  const select = document.getElementById('projectStatus');
  if (!select) return;
  const rows = Array.isArray(projectStatusOptions) && projectStatusOptions.length
    ? projectStatusOptions
    : [
      { code: 'in_progress', name: 'В работе' },
      { code: 'to_pay', name: 'Выставить счет' }
    ];
  select.innerHTML = rows.map((r) => `<option value="${escapeHtml(r.code || '')}">${escapeHtml(r.name || r.code || '')}</option>`).join('');
  select.value = selectedCode;
}


async function ensureInvoicePlanWorkCategories() {
  if (Array.isArray(invoicePlanState.workCategories) && invoicePlanState.workCategories.length) return;
  try {
    const resp = await fetch('/api.php/settings', { credentials: 'same-origin' });
    const result = await resp.json();
    if (resp.ok && result && result.success && result.data && Array.isArray(result.data.work_categories)) {
      invoicePlanState.workCategories = result.data.work_categories;
      if (result.data.settings) {
        window.crmSettings = result.data.settings;
      }
    }
  } catch (e) {
    console.warn('ensureInvoicePlanWorkCategories failed', e);
  }
}

async function ensureInvoicePlanClients(forceReload = false) {
  if (!forceReload) {
    const source = Array.isArray(clientsData) ? clientsData : [];
    if (source.length > 0) {
      invoicePlanState.clientOptions = source;
      return;
    }

    if (Array.isArray(invoicePlanState.clientOptions) && invoicePlanState.clientOptions.length > 0) {
      return;
    }
  }

  if (typeof loadClientsFromApi === 'function') {
    try {
      await loadClientsFromApi();
      const loaded = Array.isArray(clientsData) ? clientsData : [];
      if (loaded.length > 0) {
        invoicePlanState.clientOptions = loaded;
        return;
      }
    } catch (e) {
      console.warn('loadClientsFromApi in popup failed', e);
    }
  }

  try {
    const resp = await fetch('/api.php/clients', {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });
    const result = await resp.json().catch(() => null);

    const fetched = (result && result.data && Array.isArray(result.data.clients))
      ? result.data.clients
      : (result && Array.isArray(result.data) ? result.data : []);

    if (resp.ok && fetched.length > 0) {
      invoicePlanState.clientOptions = fetched;
      clientsData = fetched;
      return;
    }
  } catch (e) {
    console.warn('ensureInvoicePlanClients failed', e);
  }

  const fromPlans = (Array.isArray(invoicePlanState.items) ? invoicePlanState.items : [])
    .map((p) => ({
      id: Number(p.client_id || 0),
      name: p.client_name || '',
      email: p.email || '',
      send_invoice_telegram: p.can_send_telegram ? 1 : 0,
      send_invoice_diadoc: p.can_send_diadoc ? 1 : 0,
      invoice_use_end_month_date: Number(p.invoice_use_end_month_date || 0)
    }))
    .filter((c) => c.id > 0 && c.name);

  const uniq = [];
  const seen = new Set();
  fromPlans.forEach((c) => {
    if (seen.has(c.id)) return;
    seen.add(c.id);
    uniq.push(c);
  });
  invoicePlanState.clientOptions = uniq;
}

function getInvoicePlanClientsSource() {
  const source = Array.isArray(clientsData) ? clientsData : [];
  if (source.length > 0) return source;
  return Array.isArray(invoicePlanState.clientOptions) ? invoicePlanState.clientOptions : [];
}

function normalizeClientNameForSearch(name) {
  return String(name || '').trim().toLowerCase();
}

function normalizeInvoicePlanRow(item) {
  const out = { ...item };
  const rows = Array.isArray(item.items_snapshot) ? item.items_snapshot : [];
  out.items_snapshot = rows;
  out.total_sum = rows.reduce((sum, line) => sum + Number(line.amount || 0), 0);
  return out;
}

async function loadStatusBoard() {
  try {
    const bust = Date.now();
    const resp = await fetch(`/api.php/finance/status-board?_=${bust}`, {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`failed to load status board: HTTP ${resp.status} ${text.slice(0, 200)}`);
    }

    const data = await resp.json();
    const board = data && data.data ? data.data : {};
    statusBoardState.projects = Array.isArray(board.projects_in_work) ? board.projects_in_work : [];
    statusBoardState.endMonth = Array.isArray(board.end_month) ? board.end_month.map(normalizeInvoicePlanRow) : [];
    statusBoardState.waitingRecent = Array.isArray(board.waiting_recent) ? board.waiting_recent.map(normalizeInvoicePlanRow) : [];
    statusBoardState.waitingOverdue = Array.isArray(board.waiting_overdue) ? board.waiting_overdue.map(normalizeInvoicePlanRow) : [];
    statusBoardState.meta = board.meta || {};
    statusBoardState.metrics = board.metrics || {};

    invoicePlanState.items = []
      .concat(statusBoardState.endMonth)
      .concat(statusBoardState.waitingRecent)
      .concat(statusBoardState.waitingOverdue);

    renderInvoicePlanBoard();
    updateMetricsByPeriod();
  } catch (err) {
    console.error('loadStatusBoard error', err);
    showToast('Не удалось загрузить статус-доску', 'error');
  }
}

function renderInvoicePlanBoard() {
  const projectsContainer = document.getElementById('kanban-projects');
  const endMonthContainer = document.getElementById('kanban-end-month');
  const waitingRecentContainer = document.getElementById('kanban-waiting-recent');
  const waitingOverdueContainer = document.getElementById('kanban-waiting-overdue');

  if (!projectsContainer || !endMonthContainer || !waitingRecentContainer || !waitingOverdueContainer) {
    console.warn('Kanban containers not found');
    return;
  }

  projectsContainer.innerHTML = '';
  endMonthContainer.innerHTML = '';
  waitingRecentContainer.innerHTML = '';
  waitingOverdueContainer.innerHTML = '';

  statusBoardState.projects.forEach((item) => projectsContainer.appendChild(createProjectCard(item)));
  statusBoardState.endMonth.forEach((item) => endMonthContainer.appendChild(createEndMonthCard(item)));
  statusBoardState.waitingRecent.forEach((item) => waitingRecentContainer.appendChild(createWaitingCard(item, false)));
  statusBoardState.waitingOverdue.forEach((item) => waitingOverdueContainer.appendChild(createWaitingCard(item, true)));

  const plannedCount = document.getElementById('kanban-projects-count');
  const endMonthCount = document.getElementById('kanban-end-month-count');
  const endMonthDate = document.getElementById('kanban-end-month-date');
  const waitingCount = document.getElementById('kanban-waiting-count');
  if (plannedCount) plannedCount.textContent = String(statusBoardState.projects.length);
  if (endMonthCount) endMonthCount.textContent = String(statusBoardState.endMonth.length);
  if (waitingCount) waitingCount.textContent = String(statusBoardState.waitingRecent.length + statusBoardState.waitingOverdue.length);

  if (endMonthDate) {
    const first = statusBoardState.endMonth[0];
    const label = first && first.planned_send_date
      ? `Дата отправки: ${String(first.planned_send_date).slice(0, 10)}`
      : 'Дата отправки: —';
    endMonthDate.textContent = label;
  }
}

function createProjectCard(item) {
  const card = document.createElement('div');
  card.className = 'kanban-card';
  const projectId = Number(item.id);
  const actionable = Number.isFinite(projectId) && projectId > 0;
  const statusCode = String(item.status || 'in_progress');
  const canInvoice = statusCode === 'to_pay';
  const statusText = String(item.status_name || '').trim() || (statusCode === 'to_pay' ? 'Выставить счет' : 'В работе');

  card.innerHTML = `
    <h5>${escapeHtml(item.client_name || '—')}</h5>
    <div class="category">Проект: ${escapeHtml(item.name || '—')}</div>
    <div class="amount">${formatCurrency(Number(item.amount || 0))}</div>
    <div class="status status--${canInvoice ? 'warning' : 'info'}">${escapeHtml(statusText)}</div>
    <div class="kanban-card-actions">
      ${actionable ? `<button type="button" class="action-btn action-btn--edit" onclick="openProjectInvoiceModal(${projectId})">Выставить счет</button>` : ''}
      ${actionable ? `<button type="button" class="action-btn action-btn--edit" onclick="openProjectEdit(${projectId})">Редактировать</button>` : ''}
      ${actionable ? `<button type="button" class="action-btn action-btn--delete" onclick="deleteProject(${projectId})">Удалить</button>` : ''}
    </div>
  `;

  return card;
}

function createEndMonthCard(item) {
  const card = document.createElement('div');
  card.className = 'kanban-card';
  const planId = Number(item.id);
  const actionable = Number.isFinite(planId) && planId > 0;
  card.draggable = false;
  card.dataset.planId = String(item.id);

  card.innerHTML = `
    <h5>${escapeHtml(item.client_name || '—')}</h5>
    <div class="category">Период: ${escapeHtml(item.period_label || '—')}</div>
    <div class="amount">${formatCurrency(Number(item.total_sum || 0))}</div>
    <div class="category">План отправки: ${escapeHtml(item.planned_send_date || '—')}</div>
    <div class="kanban-card-actions">
      ${actionable ? `<button type="button" class="action-btn action-btn--edit" onclick="openInvoicePlanEdit(${planId})">Редактировать</button>` : ''}
      ${actionable ? `<button type="button" class="action-btn action-btn--delete" onclick="deleteInvoicePlan(${planId})">Удалить</button>` : ''}
    </div>
  `;

  return card;
}

function createWaitingCard(item, forceOverdue) {
  const card = document.createElement('div');
  card.className = `kanban-card ${forceOverdue ? 'overdue' : ''}`;
  const planId = Number(item.id);
  const actionable = Number.isFinite(planId) && planId > 0;
  const isOverdue = forceOverdue || (Number(item.days_since_sent || 0) > Number(item.payment_due_days || 7));
  const paymentLabel = isOverdue ? 'Просрочен' : 'Не оплачен';

  card.innerHTML = `
    <h5>${escapeHtml(item.client_name || '—')}</h5>
    <div class="category">Период: ${escapeHtml(item.period_label || '—')}</div>
    <div class="amount">${formatCurrency(Number(item.total_sum || 0))}</div>
    <div class="category">Отправлен: ${escapeHtml(item.sent_date || '—')}</div>
    <div class="category">${Number(item.days_since_sent || 0)} дн. назад выставлен</div>
    <div class="status status--${isOverdue ? 'error' : 'info'}">${paymentLabel}</div>
    <div class="kanban-card-actions">
      ${actionable ? `<button type="button" class="action-btn action-btn--edit" onclick="openInvoicePlanEdit(${planId})">Редактировать</button>` : ''}
      ${actionable ? `<button type="button" class="action-btn action-btn--delete" onclick="deleteInvoicePlan(${planId})">Удалить</button>` : ''}
      ${actionable ? `<button type="button" class="action-btn action-btn--edit" onclick="sendReminder(${planId}, event)">Напомнить</button>` : ''}
    </div>
  `;

  return card;
}

function bindInvoicePlanDnD() {
  const waitingColumn = document.getElementById('kanban-waiting-recent') || document.getElementById('kanban-payment');
  if (!waitingColumn || waitingColumn.dataset.dndBind === '1') return;

  waitingColumn.dataset.dndBind = '1';
  waitingColumn.addEventListener('dragover', (event) => {
    event.preventDefault();
    waitingColumn.classList.add('kanban-drop-target');
  });
  waitingColumn.addEventListener('dragleave', () => {
    waitingColumn.classList.remove('kanban-drop-target');
  });
  waitingColumn.addEventListener('drop', (event) => {
    event.preventDefault();
    waitingColumn.classList.remove('kanban-drop-target');
    if (!invoicePlanState.draggedPlanId) return;
    const plan = statusBoardState.endMonth.find((x) => Number(x.id) === Number(invoicePlanState.draggedPlanId));
    if (!plan || plan.status !== INVOICE_PLAN_STATUS.planned) return;
    openInvoicePlanSendModal(plan, 'send');
  });
}

function bindStatusActions() {
  const addProjectBtn = document.getElementById('kanbanAddProjectBtn');
  if (addProjectBtn && addProjectBtn.dataset.bind !== '1') {
    addProjectBtn.dataset.bind = '1';
    addProjectBtn.addEventListener('click', () => { openProjectQuickCreate(); });
  }

  const sendNowBtn = document.getElementById('kanbanEndMonthSendNowBtn');
  if (sendNowBtn && sendNowBtn.dataset.bind !== '1') {
    sendNowBtn.dataset.bind = '1';
    sendNowBtn.addEventListener('click', () => { sendEndMonthNow(); });
  }
}

function bindInvoicePlanModalActions() {
  const modal = document.getElementById('invoicePlanSendModal');
  if (!modal || modal.dataset.bind === '1') return;
  modal.dataset.bind = '1';

  const closeBtn = document.getElementById('invoicePlanSendClose');
  const cancelBtn = document.getElementById('invoicePlanSendCancel');
  const addLineBtn = document.getElementById('invoicePlanLineAddBtn');
  const form = document.getElementById('invoicePlanSendForm');
  const clientSearch = document.getElementById('invoicePlanClientSearch');

  const close = () => {
    modal.classList.remove('active');
    form?.reset();
    invoicePlanState.mode = 'send';
    invoicePlanState.currentPlan = null;
    invoicePlanState.selectedClientId = null;
    const planId = document.getElementById('invoicePlanSendPlanId');
    if (planId) planId.value = '';
    renderInvoicePlanLinesRows([]);
    renderInvoicePlanClientSuggestions('');
  };

  closeBtn?.addEventListener('click', close);
  cancelBtn?.addEventListener('click', close);

  const appendInvoicePlanRow = () => {
    const container = document.getElementById('invoicePlanLinesRows');
    if (!container) return;
    container.appendChild(createInvoicePlanLineRow({}, true));
    refreshInvoicePlanRowDeleteButtons();
  };

  addLineBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    appendInvoicePlanRow();
  });

  modal.addEventListener('click', (e) => {
    const target = e.target;
    const clientItem = target && target.closest ? target.closest('.invoice-plan-client-item') : null;
    if (clientItem) {
      const clientId = Number(clientItem.dataset.clientId || 0);
      selectInvoicePlanClient(clientId);
      renderInvoicePlanClientSuggestions('');
    }
  });

  clientSearch?.addEventListener('input', async () => {
    await ensureInvoicePlanClients(true);
    renderInvoicePlanClientSuggestions(clientSearch.value || '');
  });

  clientSearch?.addEventListener('focus', async () => {
    await ensureInvoicePlanClients(true);
    renderInvoicePlanClientSuggestions(clientSearch.value || '');
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const mode = document.getElementById('invoicePlanSendMode')?.value || 'send';
    const planId = Number(document.getElementById('invoicePlanSendPlanId')?.value || 0);
    const projectStatus = document.getElementById('projectStatus')?.value || 'in_progress';
    const payload = {
      email: document.getElementById('invoicePlanSendEmail')?.value || '',
      items_snapshot: collectInvoicePlanLinesRows(),
      send_telegram: !!document.getElementById('invoicePlanSendTelegram')?.checked,
      send_diadoc: !!document.getElementById('invoicePlanSendDiadoc')?.checked,
      send_date: document.getElementById('invoicePlanSendDate')?.value || '',
      send_now: !!document.getElementById('invoicePlanSendNow')?.checked
    };

    let createdPlanId = 0;

    try {
      if (mode === 'project_create') {
        const clientId = Number(invoicePlanState.selectedClientId || 0);
        if (!clientId) {
          showToast('Выберите клиента', 'error');
          return;
        }
        if (!Array.isArray(payload.items_snapshot) || payload.items_snapshot.length === 0) {
          showToast('Добавьте минимум одну строку работ', 'error');
          return;
        }
        const total = payload.items_snapshot.reduce((sum, line) => sum + Number(line.amount || 0), 0);
        if (!Number.isFinite(total) || total <= 0) {
          showToast('Сумма проекта должна быть больше 0', 'error');
          return;
        }
        const projectName = String(payload.items_snapshot[0]?.name || '').trim() || 'Проект';
        const resp = await fetch('/api.php/finance/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            client_id: clientId,
            name: projectName,
            amount: total,
            work_items: payload.items_snapshot
          })
        });
        if (!resp.ok) throw new Error('create project failed');
        showToast('Проект добавлен', 'success');
      } else if (mode === 'project_edit') {
        if (!planId) return;
        if (!Array.isArray(payload.items_snapshot) || payload.items_snapshot.length === 0) {
          showToast('Добавьте минимум одну строку работ', 'error');
          return;
        }
        const total = payload.items_snapshot.reduce((sum, line) => sum + Number(line.amount || 0), 0);
        if (!Number.isFinite(total) || total <= 0) {
          showToast('Сумма проекта должна быть больше 0', 'error');
          return;
        }
        const projectName = String(payload.items_snapshot[0]?.name || '').trim() || 'Проект';
        const resp = await fetch(`/api.php/finance/projects/${planId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            name: projectName,
            amount: total,
            status: projectStatus,
            work_items: payload.items_snapshot
          })
        });
        if (!resp.ok) throw new Error('project update failed');
        showToast('Проект сохранен', 'success');
      } else if (mode === 'project_invoice') {
        if (!planId) return;
        if (!Array.isArray(payload.items_snapshot) || payload.items_snapshot.length === 0) {
          showToast('Добавьте минимум одну строку работ', 'error');
          return;
        }
        const resp = await fetch(`/api.php/finance/projects/${planId}/invoice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(payload)
        });
        if (!resp.ok) {
          const result = await resp.json().catch(() => null);
          const msg = result?.error?.message || 'Не удалось выставить счет по проекту';
          throw new Error(msg);
        }
        const result = await resp.json().catch(() => null);
        createdPlanId = Number(result?.plan?.plan_id || 0);
        showToast('Счет по проекту выставлен', 'success');
      } else if (mode === 'create') {
        const clientId = Number(invoicePlanState.selectedClientId || 0);
        if (!clientId) {
          showToast('Выберите клиента', 'error');
          return;
        }
        const createResp = await fetch('/api.php/finance/invoice-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ ...payload, client_id: clientId })
        });
        if (!createResp.ok) throw new Error('create failed');
        const createData = await createResp.json().catch(() => null);
        createdPlanId = Number(createData?.plan_id || createData?.id || 0);
        showToast(payload.send_now ? 'Счет выставлен' : 'Карточка добавлена', 'success');
      } else if (mode === 'edit') {
        if (!planId) return;
        if (payload.send_now) {
          const sendResp = await fetch(`/api.php/finance/invoice-plans/${planId}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(payload)
          });
          if (!sendResp.ok) throw new Error('send failed');
          showToast('Счет выставлен и отправлен', 'success');
        } else {
          const resp = await fetch(`/api.php/finance/invoice-plans/${planId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(payload)
          });
          if (!resp.ok) throw new Error('update failed');
          showToast('Карточка сохранена', 'success');
        }
      } else {
        if (!planId) return;
        const resp = await fetch(`/api.php/finance/invoice-plans/${planId}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(payload)
        });
        if (!resp.ok) throw new Error('send failed');
        showToast('Счет выставлен и отправлен', 'success');
      }
      close();
      await loadStatusBoard();

      if (mode === 'create' && payload.send_now && createdPlanId > 0) {
        const hasCreatedCard = invoicePlanState.items.some((item) => Number(item.id) === createdPlanId);
        if (!hasCreatedCard) {
          await new Promise((resolve) => setTimeout(resolve, 700));
          await loadStatusBoard();
        }
      }
      if (mode === 'project_invoice' && createdPlanId > 0) {
        const hasMovedCard = invoicePlanState.items.some((item) => Number(item.id) === createdPlanId);
        if (!hasMovedCard) {
          await new Promise((resolve) => setTimeout(resolve, 700));
          await loadStatusBoard();
        }
      }
    } catch (err) {
      console.error(err);
      showToast(err?.message || 'Не удалось сохранить карточку', 'error');
    }
  });
}

function buildNearestInvoiceDate(client) {
  const now = new Date();
  const useEndMonth = Number(client?.invoice_use_end_month_date || 0) === 1;

  if (useEndMonth) {
    const endCurrent = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endCurrent.setHours(0, 0, 0, 0);
    if (now <= endCurrent) {
      return endCurrent;
    }
    const endNext = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    endNext.setHours(0, 0, 0, 0);
    return endNext;
  }

  const firstCurrent = new Date(now.getFullYear(), now.getMonth(), 1);
  firstCurrent.setHours(0, 0, 0, 0);
  if (now <= firstCurrent) {
    return firstCurrent;
  }

  const firstNext = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  firstNext.setHours(0, 0, 0, 0);
  return firstNext;
}

function formatDateForInput(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function renderInvoicePlanClientSuggestions(query) {
  const box = document.getElementById('invoicePlanClientSearchSuggestions');
  if (!box) return;
  const value = String(query || '').trim().toLowerCase();

  const source = getInvoicePlanClientsSource();
  if (!source.length) {
    box.style.display = 'none';
    box.innerHTML = '';
    return;
  }

  const candidates = value.length === 0
    ? []
    : source.filter((c) => normalizeClientNameForSearch(c.name).startsWith(value)).slice(0, 10);

  if (!candidates.length) {
    box.style.display = 'none';
    box.innerHTML = '';
    return;
  }

  box.innerHTML = candidates.map((c) => `
    <div class="dadata-suggestion-item invoice-plan-client-item" data-client-id="${Number(c.id || 0)}">
      <span class="dadata-suggestion-title">${escapeHtml(c.name || '')}</span>
      <span class="dadata-suggestion-subtitle">${escapeHtml(c.email || 'Без email')}</span>
    </div>
  `).join('');
  box.style.display = 'block';
}

function selectInvoicePlanClient(clientId) {
  const client = getInvoicePlanClientsSource().find((c) => Number(c.id) === Number(clientId));
  if (!client) return;
  invoicePlanState.selectedClientId = Number(client.id);
  const search = document.getElementById('invoicePlanClientSearch');
  const email = document.getElementById('invoicePlanSendEmail');
  const tg = document.getElementById('invoicePlanSendTelegram');
  const diadoc = document.getElementById('invoicePlanSendDiadoc');
  const dateInput = document.getElementById('invoicePlanSendDate');
  if (search) search.value = client.name || '';
  if (email) email.value = client.email || '';
  if (tg) tg.checked = Number(client.send_invoice_telegram || 0) === 1;
  if (diadoc) diadoc.checked = Number(client.send_invoice_diadoc || 0) === 1;
  if (dateInput) dateInput.value = formatDateForInput(buildNearestInvoiceDate(client));
}

function renderInvoicePlanModalMeta(mode, plan) {
  const modeInput = document.getElementById('invoicePlanSendMode');
  const title = document.querySelector('#invoicePlanSendModal .modal-header h3');
  const titleWrap = document.getElementById('invoicePlanClientTitleWrap');
  const titleEl = document.getElementById('invoicePlanClientTitle');
  const searchWrap = document.getElementById('invoicePlanClientSearchWrap');
  const submitBtn = document.getElementById('invoicePlanSendSubmitBtn');
  const docsWrap = document.getElementById('invoicePlanDocLinks');
  const docsBody = document.getElementById('invoicePlanDocLinksBody');
  const dateRow = document.getElementById('invoicePlanSendDate')?.closest('.form-row');
  const projectStatusWrap = document.getElementById('projectStatusWrap');
  const projectStatus = document.getElementById('projectStatus');

  if (modeInput) modeInput.value = mode;
  if (mode === 'project_create') {
    populateProjectStatusOptions('in_progress');
    if (title) title.textContent = 'Добавить проект';
    if (titleWrap) titleWrap.style.display = 'none';
    if (searchWrap) searchWrap.style.display = '';
    if (submitBtn) submitBtn.textContent = 'Сохранить';
    if (docsWrap) docsWrap.style.display = 'none';
    if (dateRow) dateRow.style.display = 'none';
    if (projectStatusWrap) projectStatusWrap.style.display = '';
    if (projectStatus) projectStatus.value = 'in_progress';
    invoicePlanState.selectedClientId = null;
  } else if (mode === 'project_edit') {
    populateProjectStatusOptions(String(plan?.status || 'in_progress'));
    if (title) title.textContent = 'Редактировать проект';
    if (titleWrap) titleWrap.style.display = '';
    if (searchWrap) searchWrap.style.display = 'none';
    if (titleEl) titleEl.textContent = plan?.client_name || '—';
    if (submitBtn) submitBtn.textContent = 'Сохранить';
    if (docsWrap) docsWrap.style.display = 'none';
    if (dateRow) dateRow.style.display = 'none';
    if (projectStatusWrap) projectStatusWrap.style.display = '';
    if (projectStatus) projectStatus.value = String(plan?.status || 'in_progress');
  } else if (mode === 'project_invoice') {
    if (title) title.textContent = 'Выставить счет';
    if (titleWrap) titleWrap.style.display = '';
    if (searchWrap) searchWrap.style.display = 'none';
    if (titleEl) titleEl.textContent = plan?.client_name || '—';
    if (submitBtn) submitBtn.textContent = 'Выставить счет';
    if (docsWrap) docsWrap.style.display = 'none';
    if (dateRow) dateRow.style.display = '';
    if (projectStatusWrap) projectStatusWrap.style.display = 'none';
  } else if (mode === 'create') {
    if (title) title.textContent = 'Добавить счет к выставлению';
    if (titleWrap) titleWrap.style.display = 'none';
    if (searchWrap) searchWrap.style.display = '';
    if (submitBtn) submitBtn.textContent = 'Сохранить';
    if (docsWrap) docsWrap.style.display = 'none';
    if (dateRow) dateRow.style.display = '';
    if (projectStatusWrap) projectStatusWrap.style.display = 'none';
    invoicePlanState.selectedClientId = null;
  } else if (mode === 'edit') {
    if (title) title.textContent = 'Редактировать счет';
    if (titleWrap) titleWrap.style.display = '';
    if (searchWrap) searchWrap.style.display = 'none';
    if (titleEl) titleEl.textContent = plan?.client_name || '—';
    if (submitBtn) submitBtn.textContent = 'Сохранить';
    if (dateRow) dateRow.style.display = '';
    if (projectStatusWrap) projectStatusWrap.style.display = 'none';
  } else {
    if (title) title.textContent = 'Подтверждение выставления счета';
    if (titleWrap) titleWrap.style.display = '';
    if (searchWrap) searchWrap.style.display = 'none';
    if (titleEl) titleEl.textContent = plan?.client_name || '—';
    if (submitBtn) submitBtn.textContent = 'Выставить счет';
    if (dateRow) dateRow.style.display = '';
    if (projectStatusWrap) projectStatusWrap.style.display = 'none';
  }

  if (docsWrap && docsBody) {
    const links = [];
    if (plan?.invoice_download_url) links.push(`<a class="invoice-plan-doc-link" href="${escapeHtml(plan.invoice_download_url)}" target="_blank" rel="noopener">Счет PDF</a>`);
    if (plan?.act_download_url) links.push(`<a class="invoice-plan-doc-link" href="${escapeHtml(plan.act_download_url)}" target="_blank" rel="noopener">Акт PDF</a>`);
    docsBody.innerHTML = links.join('');
    docsWrap.style.display = (mode === 'edit' && plan?.status === INVOICE_PLAN_STATUS.waiting && links.length) ? '' : 'none';
  }
}

function createInvoicePlanLineRow(line = {}, canDelete = true) {
  const row = document.createElement('div');
  row.className = 'invoice-plan-line-row';
  const categories = Array.isArray(invoicePlanState.workCategories) ? invoicePlanState.workCategories : [];
  const options = ['<option value="">Категория</option>']
    .concat(categories.map((c) => `<option value="${escapeHtml(c.name || '')}" ${String(line.category || '') === String(c.name || '') ? 'selected' : ''}>${escapeHtml(c.name || '')}</option>`))
    .join('');
  row.innerHTML = `
    <div class="invoice-plan-line-row__main">
      <input type="text" class="invoice-plan-line-name" placeholder="Название" value="${escapeHtml(line.name || '')}" />
    </div>
    <div class="invoice-plan-line-row__sub">
      <input type="number" step="0.01" class="invoice-plan-line-amount" placeholder="Сумма" value="${line.amount || ''}" />
      <select class="invoice-plan-line-category">${options}</select>
      <button type="button" class="action-btn action-btn--delete invoice-plan-line-remove" title="Удалить" ${canDelete ? '' : 'disabled'}>🗑️</button>
    </div>
  `;

  const removeBtn = row.querySelector('.invoice-plan-line-remove');
  removeBtn?.addEventListener('click', () => {
    const container = document.getElementById('invoicePlanLinesRows');
    if (!container) return;
    if (container.querySelectorAll('.invoice-plan-line-row').length <= 1) return;
    row.remove();
    refreshInvoicePlanRowDeleteButtons();
  });

  return row;
}

function refreshInvoicePlanRowDeleteButtons() {
  const rows = Array.from(document.querySelectorAll('#invoicePlanLinesRows .invoice-plan-line-row'));
  rows.forEach((row, idx) => {
    const btn = row.querySelector('.invoice-plan-line-remove');
    if (!btn) return;
    btn.disabled = idx === 0;
  });
}

function renderInvoicePlanLinesRows(lines) {
  const container = document.getElementById('invoicePlanLinesRows');
  if (!container) return;
  container.innerHTML = '';

  const normalized = Array.isArray(lines) && lines.length
    ? lines
    : [{ name: '', amount: '', category: '' }];

  normalized.forEach((line, idx) => {
    container.appendChild(createInvoicePlanLineRow(line, idx !== 0));
  });

  if (!container.querySelector('.invoice-plan-line-row')) {
    container.appendChild(createInvoicePlanLineRow({}, false));
  }

  refreshInvoicePlanRowDeleteButtons();
}

function collectInvoicePlanLinesRows() {
  const rows = Array.from(document.querySelectorAll('#invoicePlanLinesRows .invoice-plan-line-row'));
  const collected = rows
    .map((row) => ({
      name: row.querySelector('.invoice-plan-line-name')?.value?.trim() || '',
      amount: Number((row.querySelector('.invoice-plan-line-amount')?.value || '0').replace(',', '.')) || 0,
      category: row.querySelector('.invoice-plan-line-category')?.value?.trim() || ''
    }))
    .filter((line) => line.name !== '' || line.amount > 0 || line.category !== '')
    .map((line) => ({
      name: line.name || 'Работа',
      amount: line.amount,
      category: line.category
    }));

  if (collected.length === 0) {
    renderInvoicePlanLinesRows([]);
  }

  return collected;
}

async function openInvoicePlanCreateModal() {
  const modal = document.getElementById('invoicePlanSendModal');
  if (!modal) return;
  await ensureInvoicePlanWorkCategories();
  await ensureInvoicePlanClients();
  const planId = document.getElementById('invoicePlanSendPlanId');
  const email = document.getElementById('invoicePlanSendEmail');
  const tg = document.getElementById('invoicePlanSendTelegram');
  const diadoc = document.getElementById('invoicePlanSendDiadoc');
  const sendNow = document.getElementById('invoicePlanSendNow');
  const sendDate = document.getElementById('invoicePlanSendDate');

  invoicePlanState.mode = 'create';
  invoicePlanState.currentPlan = null;
  if (planId) planId.value = '';
  if (email) email.value = '';
  if (tg) tg.checked = false;
  if (diadoc) diadoc.checked = false;
  if (sendNow) sendNow.checked = false;
  if (sendDate) sendDate.value = formatDateForInput(buildNearestInvoiceDate(null));
  renderInvoicePlanModalMeta('create', null);
  renderInvoicePlanLinesRows([]);
  modal.classList.add('active');
}

async function openInvoicePlanSendModal(plan, mode = 'send') {
  const modal = document.getElementById('invoicePlanSendModal');
  if (!modal) return;
  await ensureInvoicePlanWorkCategories();
  const idInput = document.getElementById('invoicePlanSendPlanId');
  const emailInput = document.getElementById('invoicePlanSendEmail');
  const telegramInput = document.getElementById('invoicePlanSendTelegram');
  const diadocInput = document.getElementById('invoicePlanSendDiadoc');
  const sendNowInput = document.getElementById('invoicePlanSendNow');
  const dateInput = document.getElementById('invoicePlanSendDate');

  invoicePlanState.mode = mode;
  invoicePlanState.currentPlan = plan;
  if (idInput) idInput.value = String(plan.id);
  if (emailInput) emailInput.value = plan.email || '';
  const lines = Array.isArray(plan.items_snapshot) ? plan.items_snapshot : [];
  renderInvoicePlanLinesRows(lines);
  if (telegramInput) telegramInput.checked = !!plan.can_send_telegram;
  if (diadocInput) diadocInput.checked = !!plan.can_send_diadoc;
  if (sendNowInput) sendNowInput.checked = mode === 'send';
  if (dateInput) {
    if (plan.planned_send_date) {
      dateInput.value = String(plan.planned_send_date).slice(0, 10);
    } else {
      dateInput.value = formatDateForInput(buildNearestInvoiceDate(plan));
    }
  }

  renderInvoicePlanModalMeta(mode, plan);
  modal.classList.add('active');
}

async function openInvoicePlanEdit(planId) {
  const plan = invoicePlanState.items.find((x) => Number(x.id) === Number(planId));
  if (!plan) return;
  await openInvoicePlanSendModal(plan, 'edit');
}

async function deleteInvoicePlan(planId) {
  if (!confirm('Удалить карточку счета?')) return;
  try {
    const resp = await fetch(`/api.php/finance/invoice-plans/${planId}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });
    if (!resp.ok) throw new Error('delete failed');
    showToast('Карточка удалена', 'success');
    await loadStatusBoard();
  } catch (err) {
    console.error(err);
    showToast('Ошибка удаления карточки', 'error');
  }
}

async function openProjectQuickCreate() {
  const modal = document.getElementById('invoicePlanSendModal');
  if (!modal) return;

  await ensureInvoicePlanWorkCategories();
  await ensureInvoicePlanClients(true);
  await ensureProjectStatuses();
  const clients = getInvoicePlanClientsSource();
  if (!Array.isArray(clients) || clients.length === 0) {
    showToast('Сначала добавьте клиента', 'error');
    return;
  }

  invoicePlanState.mode = 'project_create';
  invoicePlanState.currentPlan = null;
  invoicePlanState.selectedClientId = null;

  const idInput = document.getElementById('invoicePlanSendPlanId');
  const emailInput = document.getElementById('invoicePlanSendEmail');
  const telegramInput = document.getElementById('invoicePlanSendTelegram');
  const diadocInput = document.getElementById('invoicePlanSendDiadoc');
  const sendNowInput = document.getElementById('invoicePlanSendNow');
  const dateInput = document.getElementById('invoicePlanSendDate');
  const clientSearch = document.getElementById('invoicePlanClientSearch');
  const projectStatus = document.getElementById('projectStatus');

  if (idInput) idInput.value = '';
  if (emailInput) emailInput.value = '';
  if (telegramInput) telegramInput.checked = false;
  if (diadocInput) diadocInput.checked = false;
  if (sendNowInput) sendNowInput.checked = false;
  if (dateInput) dateInput.value = '';
  if (clientSearch) clientSearch.value = '';
  if (projectStatus) projectStatus.value = 'in_progress';

  renderInvoicePlanModalMeta('project_create', null);
  renderInvoicePlanLinesRows([]);
  renderInvoicePlanClientSuggestions('');
  modal.classList.add('active');
}

async function openProjectEdit(projectId) {
  const project = statusBoardState.projects.find((x) => Number(x.id) === Number(projectId));
  if (!project) return;
  const modal = document.getElementById('invoicePlanSendModal');
  if (!modal) return;
  await ensureInvoicePlanWorkCategories();
  await ensureProjectStatuses();

  invoicePlanState.mode = 'project_edit';
  invoicePlanState.currentPlan = project;
  invoicePlanState.selectedClientId = Number(project.client_id || 0);

  const idInput = document.getElementById('invoicePlanSendPlanId');
  const emailInput = document.getElementById('invoicePlanSendEmail');
  const telegramInput = document.getElementById('invoicePlanSendTelegram');
  const diadocInput = document.getElementById('invoicePlanSendDiadoc');
  const sendNowInput = document.getElementById('invoicePlanSendNow');
  const dateInput = document.getElementById('invoicePlanSendDate');
  const projectStatus = document.getElementById('projectStatus');

  if (idInput) idInput.value = String(project.id || '');
  if (emailInput) emailInput.value = project.email || '';
  if (telegramInput) telegramInput.checked = Number(project.send_invoice_telegram || 0) === 1;
  if (diadocInput) diadocInput.checked = Number(project.send_invoice_diadoc || 0) === 1;
  if (sendNowInput) sendNowInput.checked = false;
  if (dateInput) dateInput.value = '';
  if (projectStatus) projectStatus.value = String(project.status || 'in_progress');

  const lines = Array.isArray(project.work_items) ? project.work_items : [];
  renderInvoicePlanLinesRows(lines.length ? lines : [{ name: project.name || '', amount: project.amount || 0, category: '' }]);
  renderInvoicePlanModalMeta('project_edit', project);
  modal.classList.add('active');
}

async function openProjectInvoiceModal(projectId) {
  const project = statusBoardState.projects.find((x) => Number(x.id) === Number(projectId));
  if (!project) return;
  const modal = document.getElementById('invoicePlanSendModal');
  if (!modal) return;
  await ensureInvoicePlanWorkCategories();

  invoicePlanState.mode = 'project_invoice';
  invoicePlanState.currentPlan = project;

  const idInput = document.getElementById('invoicePlanSendPlanId');
  const emailInput = document.getElementById('invoicePlanSendEmail');
  const telegramInput = document.getElementById('invoicePlanSendTelegram');
  const diadocInput = document.getElementById('invoicePlanSendDiadoc');
  const sendNowInput = document.getElementById('invoicePlanSendNow');
  const dateInput = document.getElementById('invoicePlanSendDate');

  if (idInput) idInput.value = String(project.id || '');
  if (emailInput) emailInput.value = project.email || '';
  if (telegramInput) telegramInput.checked = Number(project.send_invoice_telegram || 0) === 1;
  if (diadocInput) diadocInput.checked = Number(project.send_invoice_diadoc || 0) === 1;
  if (sendNowInput) sendNowInput.checked = true;
  if (dateInput) dateInput.value = formatDateForInput(new Date());

  const lines = Array.isArray(project.work_items) ? project.work_items : [];
  renderInvoicePlanLinesRows(lines.length ? lines : [{ name: project.name || '', amount: project.amount || 0, category: '' }]);
  renderInvoicePlanModalMeta('project_invoice', project);
  modal.classList.add('active');
}

async function deleteProject(projectId) {
  if (!confirm('Удалить проект?')) return;
  try {
    const resp = await fetch(`/api.php/finance/projects/${projectId}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });
    if (!resp.ok) throw new Error('project delete failed');
    showToast('Проект удален', 'success');
    await loadStatusBoard();
  } catch (err) {
    console.error(err);
    showToast('Не удалось удалить проект', 'error');
  }
}

async function sendEndMonthNow() {
  if (!confirm('Отправить все карточки из "Конца месяца" сейчас?')) return;
  try {
    const resp = await fetch('/api.php/finance/invoice-plans/send-end-month-now', {
      method: 'POST',
      credentials: 'same-origin'
    });
    if (!resp.ok) throw new Error('mass send failed');
    const data = await resp.json().catch(() => null);
    const sent = Number(data?.sent || 0);
    showToast(`Отправлено: ${sent}`, 'success');
    await loadStatusBoard();
  } catch (err) {
    console.error(err);
    showToast('Не удалось выполнить массовую отправку', 'error');
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Finance Tab
function initFinanceTab() {
  initFinanceSubcategories();
  switchFinanceSubcategory('overview');
}

function initFinanceSubcategories() {
  const subcategoryBtns = document.querySelectorAll('#finance .subcategory-btn');
  subcategoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const subcategory = btn.dataset.subcategory;
      switchFinanceSubcategory(subcategory);
    });
  });
}

function switchFinanceSubcategory(subcategory) {
  // Update active button
  const subcategoryBtns = document.querySelectorAll('#finance .subcategory-btn');
  subcategoryBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.subcategory === subcategory);
  });

  // Update active content
  const subcategoryContents = document.querySelectorAll('#finance .subcategory-content');
  subcategoryContents.forEach(content => {
    content.classList.remove('active');
    content.style.display = 'none';
  });

  // Show active section
  const activeContent = document.getElementById(`finance-${subcategory}`);
  if (activeContent) {
    activeContent.classList.add('active');
    activeContent.style.display = 'block';
  }

  currentFinanceSubcategory = subcategory;

  // Initialize subcategory-specific content
  switch (subcategory) {
    case 'overview':
      initFinanceOverview();
      break;
    case 'payments-history':
      initPaymentsHistory();
      break;
    case 'receivables':
      initReceivablesSubcategory();
      break;
    case 'acts':
      initActsSubcategory();
      break;
  }
}

function initActsSubcategory() {
  const root = document.getElementById('financeActsTable');
  if (!root) return;

  if (!invoicePlanState.items.length && !actsBootstrapLoading) {
    actsBootstrapLoading = true;
    loadStatusBoard()
      .finally(() => {
        actsBootstrapLoading = false;
        initActsSubcategory();
      });
    root.innerHTML = '<div class="loading-indicator active">Загрузка данных...</div>';
    return;
  }

  const plans = Array.isArray(invoicePlanState.items) ? invoicePlanState.items : [];
  const waiting = plans.filter((p) => String(p.status || '') === INVOICE_PLAN_STATUS.waiting);

  if (waiting.length === 0) {
    root.innerHTML = '<div class="no-data">Нет данных по актам</div>';
    return;
  }

  const rows = waiting.map((p) => {
    const hasAct = !!p.act_download_url;
    const period = p.period_label || '—';
    const client = p.client_name || '—';
    const link = hasAct
      ? `<a href="${escapeHtml(p.act_download_url)}" target="_blank" rel="noopener">Акт PDF</a>`
      : '—';
    const status = hasAct ? 'Доступен' : 'Нет акта';
    return `<tr>
      <td>${escapeHtml(period)}</td>
      <td>${escapeHtml(client)}</td>
      <td>${link}</td>
      <td>${escapeHtml(status)}</td>
    </tr>`;
  }).join('');

  root.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Период</th>
          <th>Клиент</th>
          <th>Акт PDF</th>
          <th>Статус</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function initFinanceOverview() {
  initCategoryChart();
  initIncomeExpenseChart();
  initRevenueTable();
  initFinanceFilters();
  initRevenueTrendsChart();
}

function initPaymentsHistory() {
  initHistoryPeriodSelector();
  updatePaymentsHistory();
}

function initHistoryPeriodSelector() {
  const periodSelect = document.getElementById('historyPeriodSelect');
  const yearSelect = document.getElementById('historyYearSelect');
  const monthSelect = document.getElementById('historyMonthSelect');
  const customDateRange = document.getElementById('customDateRange');
  const monthlySelectors = document.getElementById('monthlySelectors');
  const monthSelector = document.getElementById('monthSelector');

  if (periodSelect) {
    periodSelect.addEventListener('change', (e) => {
      currentHistoryPeriod = e.target.value;

      if (e.target.value === 'custom') {
        customDateRange.style.display = 'flex';
        monthlySelectors.style.display = 'none';
        monthSelector.style.display = 'none';
      } else if (e.target.value === 'monthly') {
        customDateRange.style.display = 'none';
        monthlySelectors.style.display = 'flex';
        monthSelector.style.display = 'flex';
      } else {
        customDateRange.style.display = 'none';
        monthlySelectors.style.display = 'none';
        monthSelector.style.display = 'none';
      }

      updatePaymentsHistory();
    });
  }

  if (yearSelect) {
    yearSelect.addEventListener('change', (e) => {
      currentHistoryYear = parseInt(e.target.value);
      updatePaymentsHistory();
    });
  }

  if (monthSelect) {
    monthSelect.addEventListener('change', (e) => {
      currentHistoryMonth = parseInt(e.target.value);
      updatePaymentsHistory();
    });
  }
}

function updatePaymentsHistory() {
  // Show loading indicator
  showLoadingIndicator();

  // Simulate loading delay for better UX
  setTimeout(() => {
    let payments = [];
    let totalAmount = 0;
    let count = 0;

    if (currentHistoryPeriod === 'monthly') {
      const periodKey = `${currentHistoryYear}-${currentHistoryMonth.toString().padStart(2, '0')}`;
      const periodData = appData.payment_history[periodKey];

      if (periodData) {
        payments = periodData.payments || [];
        totalAmount = periodData.total || 0;
        count = periodData.count || payments.length;
      } else {
        // Generate sample data for other periods
        payments = generateSamplePayments(currentHistoryYear, currentHistoryMonth);
        totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
        count = payments.length;
      }
    } else {
      // Handle other period types
      payments = getPaymentsByPeriod(currentHistoryPeriod);
      totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
      count = payments.length;
    }

    const averageAmount = count > 0 ? totalAmount / count : 0;

    // Update stats
    const countElement = document.getElementById('paymentCount');
    const totalElement = document.getElementById('paymentTotal');
    const averageElement = document.getElementById('averagePayment');

    if (countElement) countElement.textContent = count;
    if (totalElement) totalElement.textContent = formatCurrency(totalAmount);
    if (averageElement) averageElement.textContent = formatCurrency(Math.round(averageAmount));

    // Update table
    renderPaymentsHistoryTable(payments);

    // Hide loading indicator
    hideLoadingIndicator();
  }, 300);
}

function getPaymentsByPeriod(period) {
  const allPayments = [];
  const currentDate = new Date();

  // Collect all payments from available data
  Object.values(appData.payment_history).forEach(periodData => {
    if (periodData.payments) {
      allPayments.push(...periodData.payments);
    }
  });

  // Filter by period
  switch (period) {
    case 'last_30_days':
      const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      return allPayments.filter(p => new Date(p.date) >= thirtyDaysAgo);

    case 'last_3_months':
      const threeMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1);
      return allPayments.filter(p => new Date(p.date) >= threeMonthsAgo);

    case 'last_6_months':
      const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1);
      return allPayments.filter(p => new Date(p.date) >= sixMonthsAgo);

    case 'current_year':
      const currentYear = currentDate.getFullYear();
      return allPayments.filter(p => new Date(p.date).getFullYear() === currentYear);

    case 'previous_year':
      const previousYear = currentDate.getFullYear() - 1;
      return allPayments.filter(p => new Date(p.date).getFullYear() === previousYear);

    case 'custom':
      if (customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        return allPayments.filter(p => {
          const paymentDate = new Date(p.date);
          return paymentDate >= start && paymentDate <= end;
        });
      }
      return [];

    default:
      return allPayments;
  }
}

function generateSamplePayments(year, month) {
  const sampleClients = ['Frankie', 'ORDO', 'Erwin', 'Global Catering', 'Nagoya', 'Gaia', 'SQ Clinic', 'New White Smile'];
  const sampleDescriptions = ['Разработка сайта', 'SEO продвижение', 'Поддержка сайта', 'Техподдержка', 'Разработка портала'];

  // Return empty array for periods without data to show "no data" message
  if (year < 2023 || (year === 2024 && month > 10) || (year > 2024)) {
    return [];
  }

  const payments = [];
  const paymentCount = Math.floor(Math.random() * 8) + 5; // 5-12 payments

  for (let i = 0; i < paymentCount; i++) {
    const day = Math.floor(Math.random() * 28) + 1;
    const client = sampleClients[Math.floor(Math.random() * sampleClients.length)];
    const description = sampleDescriptions[Math.floor(Math.random() * sampleDescriptions.length)];
    const amount = Math.floor(Math.random() * 150000) + 10000; // 10k-160k

    payments.push({
      client: client,
      amount: amount,
      date: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
      description: description
    });
  }

  // Sort by date
  payments.sort((a, b) => new Date(a.date) - new Date(b.date));

  return payments;
}

function renderPaymentsHistoryTable(data) {
  const container = document.getElementById('paymentsHistoryTable');
  if (!container) return;

  if (data.length === 0) {
    container.innerHTML = '<div class="no-data">Нет данных за выбранный период</div>';
    return;
  }

  const table = document.createElement('table');
  table.className = 'data-table';

  table.innerHTML = `
    <thead>
      <tr>
        <th style="cursor: pointer;" onclick="sortPaymentsTable('date')">Дата ↕</th>
        <th style="cursor: pointer;" onclick="sortPaymentsTable('client')">Клиент ↕</th>
        <th>Описание</th>
        <th style="cursor: pointer;" onclick="sortPaymentsTable('amount')">Сумма ↕</th>
      </tr>
    </thead>
    <tbody>
      ${data.map(payment => `
        <tr>
          <td>${new Date(payment.date).toLocaleDateString('ru-RU')}</td>
          <td>${payment.client}</td>
          <td>${payment.description}</td>
          <td style="text-align: right;">${formatCurrency(payment.amount)}</td>
        </tr>
      `).join('')}
    </tbody>
  `;

  container.innerHTML = '';
  container.appendChild(table);
}

// Global function for custom date range
function applyCustomDateRange() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  if (startDate && endDate) {
    customStartDate = startDate;
    customEndDate = endDate;
    updatePaymentsHistory();
  } else {
    alert('Пожалуйста, выберите начальную и конечную даты');
  }
}

let paymentsSortOrder = { field: null, direction: 'asc' };

function sortPaymentsTable(field) {
  let payments = [];

  if (currentHistoryPeriod === 'monthly') {
    const periodKey = `${currentHistoryYear}-${currentHistoryMonth.toString().padStart(2, '0')}`;
    const periodData = appData.payment_history[periodKey];

    if (periodData) {
      payments = [...periodData.payments];
    } else {
      payments = generateSamplePayments(currentHistoryYear, currentHistoryMonth);
    }
  } else {
    payments = getPaymentsByPeriod(currentHistoryPeriod);
  }

  if (paymentsSortOrder.field === field) {
    paymentsSortOrder.direction = paymentsSortOrder.direction === 'asc' ? 'desc' : 'asc';
  } else {
    paymentsSortOrder.field = field;
    paymentsSortOrder.direction = 'asc';
  }

  payments.sort((a, b) => {
    let aVal, bVal;

    switch (field) {
      case 'date':
        aVal = new Date(a.date);
        bVal = new Date(b.date);
        break;
      case 'client':
        aVal = a.client.toLowerCase();
        bVal = b.client.toLowerCase();
        break;
      case 'amount':
        aVal = a.amount;
        bVal = b.amount;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return paymentsSortOrder.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return paymentsSortOrder.direction === 'asc' ? 1 : -1;
    return 0;
  });

  renderPaymentsHistoryTable(payments);
}

function initCategoryChart() {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;

  if (charts.category) {
    charts.category.destroy();
  }

  const categoryTotals = {};
  appData.revenue.forEach(item => {
    categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
  });

  const colors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F'];

  charts.category = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(categoryTotals),
      datasets: [{
        data: Object.values(categoryTotals),
        backgroundColor: colors,
        borderWidth: 0,
        hoverBorderWidth: 2,
        hoverBorderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: 'rgba(255, 255, 255, 0.8)',
            padding: 20,
            font: {
              size: 12
            }
          }
        }
      },
      animation: {
        duration: 1500,
        easing: 'easeInOutCubic'
      }
    }
  });
}

function initIncomeExpenseChart() {
  const ctx = document.getElementById('incomeExpenseChart');
  if (!ctx) return;

  if (charts.incomeExpense) {
    charts.incomeExpense.destroy();
  }

  const totalExpenses = appData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalRevenue = appData.revenue.reduce((sum, item) => sum + item.amount, 0);

  charts.incomeExpense = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Доходы', 'Расходы', 'Прибыль'],
      datasets: [{
        data: [totalRevenue, totalExpenses, totalRevenue - totalExpenses],
        backgroundColor: ['#10B981', '#EF4444', '#3B82F6'],
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          }
        }
      },
      animation: {
        duration: 1500,
        easing: 'easeInOutCubic'
      }
    }
  });
}

function initRevenueTable() {
  updateRevenueTable();
}

function updateRevenueTable() {
  const container = document.getElementById('revenueTable');
  if (!container) return;

  const table = document.createElement('table');
  table.className = 'data-table';

  table.innerHTML = `
    <thead>
      <tr>
        <th>Проект</th>
        <th>Категория</th>
        <th>Статус</th>
        <th>Сумма</th>
      </tr>
    </thead>
    <tbody>
      ${filteredData.revenue.map(item => `
        <tr>
          <td>${item.name}</td>
          <td>${item.category}</td>
          <td><span class="status status--${getStatusClass(item.status)}">${item.status}</span></td>
          <td>${formatCurrency(item.amount)}</td>
        </tr>
      `).join('')}
    </tbody>
  `;

  container.innerHTML = '';
  container.appendChild(table);
}

function getStatusClass(status) {
  const mapping = {
    'В работе': 'status-working',
    'Выставить счет': 'status-invoice',
    'Конец месяца': 'status-month-end',
    'Ожидание оплаты': 'error'
  };
  return mapping[status] || 'info';
}

// Получаем текст статуса для отображения
function getStatusText(status) {
  return status;
}

// Сортировка таблицы топ должников
let topDebtorsNewSortOrder = { field: null, direction: 'asc' };

function sortTopDebtorsTableNew(field) {
  if (topDebtorsNewSortOrder.field === field) {
    topDebtorsNewSortOrder.direction = topDebtorsNewSortOrder.direction === 'asc' ? 'desc' : 'asc';
  } else {
    topDebtorsNewSortOrder.field = field;
    topDebtorsNewSortOrder.direction = 'asc';
  }

  const sortedDebtors = [...RECEIVABLES_STRUCTURE_DATA.top_debtors].sort((a, b) => {
    let aVal, bVal;

    switch (field) {
      case 'client':
        aVal = a.client.toLowerCase();
        bVal = b.client.toLowerCase();
        break;
      case 'amount':
        aVal = a.amount;
        bVal = b.amount;
        break;
      case 'days_overdue':
        aVal = a.days_overdue;
        bVal = b.days_overdue;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return topDebtorsNewSortOrder.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return topDebtorsNewSortOrder.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Временно обновляем данные и перерисовываем
  const originalData = RECEIVABLES_STRUCTURE_DATA.top_debtors;
  RECEIVABLES_STRUCTURE_DATA.top_debtors = sortedDebtors;
  renderTopDebtorsTableNew();
  RECEIVABLES_STRUCTURE_DATA.top_debtors = originalData;
}

// Перерисовываем таблицу топ должников с обновленными данными
function renderTopDebtorsTableNew() {
  const tableBody = document.querySelector('.top-debtors-table-new tbody');
  if (!tableBody) return;

  const debtors = RECEIVABLES_STRUCTURE_DATA.top_debtors;

  tableBody.innerHTML = debtors.map(debtor => {
    const statusClass = getStatusClassForButton(debtor.status, debtor.priority);
    return `
      <tr onclick="showDebtorDetailsNew('${debtor.client}')" style="cursor: pointer;">
        <td><strong>${debtor.client}</strong></td>
        <td style="text-align: right;">${formatCurrency(debtor.amount)}</td>
        <td>${debtor.days_overdue} дн.</td>
        <td><span class="status-btn ${statusClass}">${debtor.status}</span></td>
      </tr>
    `;
  }).join('');

  // Повторно применяем интерактивность
  initTopDebtorsTableInteractivity();
}

// Получаем класс для кнопки статуса с учетом приоритета
function getStatusClassForButton(status, priority) {
  if (status === 'Выставить счет' && priority === 'critical') {
    return 'status-invoice-critical';
  }

  const mapping = {
    'В работе': 'status-working',
    'Выставить счет': 'status-invoice',
    'Конец месяца': 'status-month-end'
  };
  return mapping[status] || 'status-working';
}

function initFinanceFilters() {
  const categoryFilter = document.querySelector('#finance .filter-category');
  const statusFilter = document.querySelector('#finance .filter-status');

  if (categoryFilter) {
    categoryFilter.addEventListener('change', applyFinanceFilters);
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', applyFinanceFilters);
  }
}

function applyFinanceFilters() {
  const categoryFilter = document.querySelector('#finance .filter-category')?.value || 'all';
  const statusFilter = document.querySelector('#finance .filter-status')?.value || 'all';

  filteredData.revenue = projectsData.filter(item => {
    const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;
    const statusMatch = statusFilter === 'all' || item.status === statusFilter;
    return categoryMatch && statusMatch;
  });

  updateRevenueTable();
}

function initEmployeesTab() {
  ensureCrmRolesForEmployeesLoaded(false);
  loadEmployeesFromApi();
}

function getExperienceMonths(startDateStr) {
  if (!startDateStr) return null;

  const parts = String(startDateStr).split('-');
  if (parts.length !== 3) return null;

  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);

  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;

  const start = new Date(y, m - 1, d);
  if (Number.isNaN(start.getTime())) return null;

  const now = new Date();
  if (now < start) return 0;

  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;

  return Math.max(0, months);
}

function formatExperienceFromMonths(totalMonths) {
  if (totalMonths === null) return 'н/д';

  const months = Math.max(0, parseInt(totalMonths, 10) || 0);
  const years = Math.floor(months / 12);
  const rem = months % 12;

  if (years > 0 && rem > 0) return `${years} г. ${rem} мес.`;
  if (years > 0) return `${years} г.`;
  return `${rem} мес.`;
}

function updateTeamStats() {
  const root = document.querySelector('.team-stats');
  if (!root) return;

  const list = Array.isArray(employeesData) ? employeesData : [];

  const totalEmployees = list.length;

  const monthlyCosts = list.reduce((sum, emp) => {
    const v = Number(emp && emp.current_salary ? emp.current_salary : 0);
    return sum + (Number.isFinite(v) ? v : 0);
  }, 0);

  let monthsSum = 0;
  let monthsCnt = 0;
  list.forEach(emp => {
    const mm = getExperienceMonths(emp && emp.start_date ? emp.start_date : null);
    if (mm === null) return;
    monthsSum += mm;
    monthsCnt += 1;
  });

  const avgMonths = monthsCnt > 0 ? Math.round(monthsSum / monthsCnt) : null;
  const avgExpText = formatExperienceFromMonths(avgMonths);

  const cards = root.querySelectorAll('.stat-card');
  cards.forEach(card => {
    const titleEl = card.querySelector('h3');
    const valueEl = card.querySelector('.stat-value');
    if (!titleEl || !valueEl) return;

    const title = (titleEl.textContent || '').trim();

    if (title === 'Всего сотрудников') {
      valueEl.textContent = String(totalEmployees);
      return;
    }

    if (title === 'Расходы на сотрудников в месяц') {
      valueEl.innerHTML = formatCurrency(monthlyCosts);
      return;
    }

    if (title === 'Средний стаж') {
      valueEl.textContent = avgExpText;
      return;
    }

    // "Доля от выручки" и "Общий показатель выполнения задач" не трогаем
  });
}


function formatExperienceFromMonths(totalMonths) {
  if (totalMonths === null || typeof totalMonths === 'undefined') return 'н/д';

  const months = Math.max(0, parseInt(totalMonths, 10) || 0);
  const years = Math.floor(months / 12);
  const rem = months % 12;

  if (years > 0 && rem > 0) return `${years} г. ${rem} мес.`;
  if (years > 0) return `${years} г.`;
  return `${rem} мес.`;
}

function updateTeamStats() {
  const list = Array.isArray(employeesData) ? employeesData : [];

  const totalEmployees = list.length;

  const monthlyCosts = list.reduce((sum, emp) => {
    const v = Number(emp && emp.current_salary ? emp.current_salary : 0);
    return sum + (Number.isFinite(v) ? v : 0);
  }, 0);

  let monthsSum = 0;
  let monthsCnt = 0;

  list.forEach(emp => {
    const m = getExperienceMonths(emp && emp.start_date ? emp.start_date : null);
    if (m === null) return;
    monthsSum += m;
    monthsCnt += 1;
  });

  const avgMonths = monthsCnt > 0 ? Math.round(monthsSum / monthsCnt) : null;
  const avgExpText = formatExperienceFromMonths(avgMonths);

  const elTotal = document.getElementById('statEmployeesTotal');
  if (elTotal) elTotal.textContent = String(totalEmployees);

  const elCosts = document.getElementById('statEmployeesMonthlyCosts');
  if (elCosts) elCosts.innerHTML = formatCurrency(monthlyCosts);

  const elAvg = document.getElementById('statEmployeesAvgExperience');
  if (elAvg) elAvg.textContent = avgExpText;
}




function renderEmployeeCards() {
  const container = document.getElementById('employeesGrid');
  if (!container) return;

  container.innerHTML = '';

  employeesData.forEach(employee => {
    const card = createEmployeeCard(employee);
    container.appendChild(card);
  });

  updateTeamStats();
}

function createEmployeeCard(employee) {
  const workDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // Реальные расчеты из расписания
  const schedule = employee.schedule || {};
  let workingDays = 0;
  let hoursPerWeek = 0;

  for (let weekday = 1; weekday <= 7; weekday += 1) {
    const info = schedule[weekday];

    if (!info || !info.enabled) {
      continue;
    }

    workingDays += 1;

    const from = Number.isInteger(info.from_hour) ? info.from_hour : null;
    const to = Number.isInteger(info.to_hour) ? info.to_hour : null;

if (from !== null && to !== null) {
  let diff = 0;

  if (to === from) {
    diff = 0;
  } else if (to > from) {
    diff = to - from;
  } else {
    diff = (to + 24) - from;
  }

  hoursPerWeek += diff;
}
  }

  const experience = calculateWorkExperience(employee.start_date);

  const salaryMonthly = Number(employee.current_salary) || 0;
  const hourlyRate = (salaryMonthly > 0 && hoursPerWeek > 0)
    ? (salaryMonthly / (hoursPerWeek * 4))
    : 0;

  const hourlyRateText = (salaryMonthly > 0 && hoursPerWeek > 0)
    ? `${hourlyRate.toFixed(2)} ₽/час`
    : 'н/д';

  const hoursPerWeekText = `${hoursPerWeek} ч/нед`;

  const card = document.createElement('div');
  card.className = 'employee-card';

  card.innerHTML = `
    <div class="employee-header">
<div class="employee-avatar">${
  employee.avatar_url
    ? `<img src="/public_html/${employee.avatar_url}" alt="" class="employee-avatar-img">`
    : getInitials(employee.name)
}</div>
      <div class="employee-info">
        <div class="employee-name">${employee.name}</div>
        <div class="employee-role">${employee.role}</div>
      </div>
    </div>
    <div class="employee-stats">
      <div class="employee-stat">
        <div class="employee-stat-value">${workingDays}</div>
        <div class="employee-stat-label">Рабочих дней</div>
      </div>
      <div class="employee-stat">
        <div class="employee-stat-value">${experience}</div>
        <div class="employee-stat-label">Опыт работы</div>
      </div>
    </div>
    <div class="employee-rates">
      <div class="employee-rate">
        <div class="employee-rate-value">${hoursPerWeekText}</div>
        <div class="employee-rate-label">Часы в неделю</div>
      </div>
      <div class="employee-rate">
        <div class="employee-rate-value">${hourlyRateText}</div>
        <div class="employee-rate-label">Часовая ставка</div>
      </div>
    </div>
    <div class="task-completion">
      <span class="task-completion-label">TODO % выполнения задач в срок:</span>
      <span class="task-completion-value" style="color: ${employee.task_completion_color};">${employee.task_completion_rate}%</span>
    </div>
    <div class="salary-section">
      <div class="salary-current">
        <span class="salary-label">Текущая зарплата:</span>
        <span class="salary-amount">${formatCurrency(employee.current_salary)}</span>
      </div>
      <div class="salary-history">
        <h5>История изменений:</h5>
     ${(Array.isArray(employee.salary_history) && employee.salary_history.length)
  ? employee.salary_history
      .slice() // копия массива
      .sort((a, b) => new Date(b.date) - new Date(a.date)) // новые сверху
      .slice(0, 2) // берем 2 последних
      .map(item => `
        <div class="salary-item">
          <span class="salary-date">${new Date(item.date).toLocaleDateString('ru-RU')}</span>
          <span class="salary-change">${formatCurrency(item.amount)}</span>
        </div>
      `).join('')
  : '<p>Нет данных</p>'}
      </div>
    </div>
    <div class="employee-schedule">
      <div class="employee-schedule-header">
        <h4>Расписание на неделю</h4>
        <button
          class="action-btn action-btn--edit"
          onclick="openEmployeeScheduleModal('${employee.id || employee.name}', event)"
          title="Редактировать расписание"
        >
          ✏️
        </button>
      </div>
      <div class="schedule-week">
        ${dayNames.map((dayName, index) => {
          const dayKey = workDays[index];
          const isWorking = employee[dayKey] === 'Рабочий';
          return `<div class="schedule-day ${isWorking ? 'working' : 'weekend'}">${dayName}</div>`;
        }).join('')}
      </div>
    </div>

    <div class="employee-actions">
      <button class="btn employee-btn btn--secondary" onclick="editEmployee('${employee.id || employee.name}', event)">
        Редактировать
      </button>
      <button class="btn employee-btn btn--error" onclick="deleteEmployee('${employee.id || employee.name}', event)">
        Удалить
      </button>
    </div>
  `;

  return card;
}


let currentScheduleEmployeeId = null;

function openEmployeeScheduleModal(employeeId, event) {
  if (event) {
    event.stopPropagation();
  }

  const modal = document.getElementById('employeeScheduleModal');
  if (!modal) return;

  currentScheduleEmployeeId = employeeId;

  const employee = employeesData.find(emp => String(emp.id || emp.name) === String(employeeId));
  const schedule = employee && employee.schedule ? employee.schedule : {};

  for (let day = 1; day <= 7; day += 1) {
    const checkbox = modal.querySelector(`input[type="checkbox"][data-day="${day}"]`);
    const fromInput = modal.querySelector(`input[data-day-from="${day}"]`);
    const toInput = modal.querySelector(`input[data-day-to="${day}"]`);

    let enabled = false;
    let fromVal = '';
    let toVal = '';

    const info = schedule[day] || null;

    if (info) {
      enabled = !!info.enabled;
      if (info.from_hour !== null && typeof info.from_hour !== 'undefined') {
        const h = String(info.from_hour).padStart(2, '0');
        fromVal = `${h}:00`;
      }
      if (info.to_hour !== null && typeof info.to_hour !== 'undefined') {
        const h = String(info.to_hour).padStart(2, '0');
        toVal = `${h}:00`;
      }
    } else {
      if (day >= 1 && day <= 5) {
        enabled = true;
        fromVal = '10:00';
        toVal = '19:00';
      }
    }

    if (checkbox) {
      checkbox.checked = enabled;
    }
    if (fromInput) {
      fromInput.disabled = !enabled;
      fromInput.value = fromVal;
    }
    if (toInput) {
      toInput.disabled = !enabled;
      toInput.value = toVal;
    }
  }

  modal.classList.add('active');
}

function closeEmployeeScheduleModal() {
  const modal = document.getElementById('employeeScheduleModal');
  if (!modal) return;

  modal.classList.remove('active');
  currentScheduleEmployeeId = null;
}


// Clients Tab
function initClientsTab() {
  initClientSubcategories();
  initClientModalSubcategories();
  switchClientSubcategory('overview');
    loadClientsFromApi();
}


function initClientSubcategories() {
  const root = document.getElementById('clients');
  if (!root) return;

  const subcategoryBtns = root.querySelectorAll('.client-subcategories .subcategory-btn');
  subcategoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const subcategory = btn.dataset.subcategory;
      switchClientSubcategory(subcategory);
    });
  });
}

function switchClientSubcategory(subcategory) {
  const root = document.getElementById('clients');
  if (!root) return;

  // Update active button
  const subcategoryBtns = root.querySelectorAll('.client-subcategories .subcategory-btn');
  subcategoryBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.subcategory === subcategory);
  });

  // Update active content
  const subcategoryContents = root.querySelectorAll('.client-subcategory-content .subcategory-content');
  subcategoryContents.forEach(content => {
    content.classList.toggle('active', content.id === `clients-${subcategory}`);
  });

  currentClientSubcategory = subcategory;

  // Initialize subcategory-specific content
  switch (subcategory) {
    case 'overview':
      initOverviewSubcategory();
      break;
    case 'ltv':
      initLTVSubcategory();
      break;
    case 'nps':
      initNPSSubcategory();
      break;
  }
}

function initOverviewSubcategory() {
  renderAllClientsTable();
}



function initLTVSubcategory() {
  // Update LTV metrics display with correct values
  updateLTVMetricsDisplay();
  setTimeout(() => {
    initLTVDistributionChart();
    renderLTVAnalysisTable();
  }, 100);
}

// Function to update LTV metrics display
function updateLTVMetricsDisplay() {
  const totalLTVElement = document.querySelector('#clients-ltv .stat-card:nth-child(1) .stat-value');
  const averageLTVElement = document.querySelector('#clients-ltv .stat-card:nth-child(2) .stat-value');
  const averageDurationElement = document.querySelector('#clients-ltv .stat-card:nth-child(3) .stat-value');

  if (totalLTVElement) {
    totalLTVElement.textContent = formatCurrency(ltvMetrics.total_ltv);
  }
  if (averageLTVElement) {
    averageLTVElement.textContent = formatCurrency(ltvMetrics.average_ltv);
  }
  if (averageDurationElement) {
    averageDurationElement.textContent = `${ltvMetrics.average_duration} мес.`;
  }
}

function initNPSSubcategory() {
  updateNPSOverviewStats();
  initNPSChart();
  setTimeout(() => {
    initNPSMonthlyChart();
    initNPSChartControls();
  }, 100);
  renderNPSDataTable();
}

// Initialize receivables subcategory
function initReceivablesSubcategory() {
  console.log('Инициализация нового раздела задолженности...');

  // Обновляем метрики в верхнем ряду
  updateReceivablesMetrics();

  // Добавляем интерактивность к возрастным корзинам
  initAgingBucketsInteractivity();

  // Инициализируем таблицу топ должников
  initTopDebtorsTableInteractivity();

  console.log('Новый раздел задолженности полностью инициализирован');
}

// Обновляем метрики в верхнем ряду
function updateReceivablesMetrics() {
  const data = RECEIVABLES_STRUCTURE_DATA.summary_metrics;

  // Метрики уже прописаны в HTML, но можно добавить анимации
  const metricCards = document.querySelectorAll('.receivables-metrics-grid .metric-card');
  metricCards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';

    setTimeout(() => {
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 100);
  });
}

// Интерактивность для возрастных корзин
function initAgingBucketsInteractivity() {
  const buckets = document.querySelectorAll('.aging-bucket-new');

  buckets.forEach((bucket, index) => {
    // Анимация появления
    bucket.style.opacity = '0';
    bucket.style.transform = 'translateY(20px)';

    setTimeout(() => {
      bucket.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      bucket.style.opacity = '1';
      bucket.style.transform = 'translateY(0)';
    }, (index + 4) * 100); // +4 чтобы начать после метрик

    // Клик по корзине - показываем детали
    bucket.addEventListener('click', () => {
      const bucketTitle = bucket.querySelector('h4').textContent;
      showAgingBucketDetails(bucketTitle);
    });

    // Курсор показывает что можно кликать
    bucket.style.cursor = 'pointer';
  });
}

// Интерактивность для таблицы топ должников
function initTopDebtorsTableInteractivity() {
  const tableRows = document.querySelectorAll('.top-debtors-table-new tbody tr');

  tableRows.forEach((row, index) => {
    // Анимация появления
    row.style.opacity = '0';
    row.style.transform = 'translateX(-20px)';

    setTimeout(() => {
      row.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      row.style.opacity = '1';
      row.style.transform = 'translateX(0)';
    }, (index + 8) * 50); // +8 чтобы начать после корзин
  });
}

// Показываем детали возрастной корзины
function showAgingBucketDetails(bucketTitle) {
  const modal = document.getElementById('detailModal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');

  const bucketData = getBucketDataByTitle(bucketTitle);

  title.textContent = `Анализ корзины: ${bucketTitle}`;
  body.innerHTML = `
    <div class="modal-details">
      <div class="bucket-summary">
        <h4>Общая информация</h4>
        <p><strong>Общая сумма:</strong> ${formatCurrency(bucketData.amount)}</p>
        <p><strong>Количество счетов:</strong> ${bucketData.count}</p>
        <p><strong>Процент от общей суммы:</strong> ${bucketData.percentage}%</p>
        <p><strong>Статус:</strong> <span style="color: ${bucketData.color}">${bucketData.status}</span></p>
      </div>

      <div class="bucket-recommendations">
        <h4>Рекомендации</h4>
        ${getBucketRecommendations(bucketTitle)}
      </div>

      <div class="bucket-actions">
        <h4>Доступные действия</h4>
        <button class="btn btn--primary" onclick="exportBucketData('${bucketTitle}')">Экспортировать данные</button>
        <button class="btn btn--secondary" onclick="filterByBucket('${bucketTitle}')">Показать список клиентов</button>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

// Получаем данные корзины по заголовку
function getBucketDataByTitle(title) {
  const mapping = {
    '0-30 дней': RECEIVABLES_STRUCTURE_DATA.aging_buckets['0_30_days'],
    '31-60 дней': RECEIVABLES_STRUCTURE_DATA.aging_buckets['31_60_days'],
    '61-90 дней': RECEIVABLES_STRUCTURE_DATA.aging_buckets['61_90_days'],
    '90+ дней': RECEIVABLES_STRUCTURE_DATA.aging_buckets['90_plus_days']
  };

  return mapping[title] || {};
}

// Получаем рекомендации для корзины
function getBucketRecommendations(bucketTitle) {
  const recommendations = {
    '0-30 дней': `
      <ul>
        <li style="color: #22C55E;">🟢 Обычный мониторинг</li>
        <li>📧 Отправлять напоминания за 3 дня до срока</li>
        <li>📅 Отслеживать переход в следующую корзину</li>
      </ul>
    `,
    '31-60 дней': `
      <ul>
        <li style="color: #F59E0B;">🟡 Усиленный контроль</li>
        <li>📞 Еженедельные звонки клиентам</li>
        <li>📧 Официальные напоминания</li>
        <li>💼 Обсудить план погашения</li>
      </ul>
    `,
    '61-90 дней': `
      <ul>
        <li style="color: #EF4444;">🔴 Критическое внимание</li>
        <li>📞 Ежедневные звонки</li>
        <li>🔍 Исследование причин просрочки</li>
        <li>📝 Подготовка к юридическим мерам</li>
      </ul>
    `,
    '90+ дней': `
      <ul>
        <li style="color: #DC2626;">⚠️ Критическая просрочка</li>
        <li>⚖️ Начать юридические процедуры</li>
        <li>💼 Личная встреча с клиентом</li>
        <li>🔒 Заморозка обслуживания</li>
      </ul>
    `
  };

  return recommendations[bucketTitle] || '<p>Нет специфичных рекомендаций</p>';
}

// Показываем детали должника (новая версия)
function showDebtorDetailsNew(clientName) {
  const debtor = RECEIVABLES_STRUCTURE_DATA.top_debtors.find(d => d.client === clientName);
  if (!debtor) {
    showToast(`Не найден клиент: ${clientName}`, 'error');
    return;
  }

  const modal = document.getElementById('detailModal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');

  title.textContent = `Детали должника: ${debtor.client}`;

  const priorityColor = getPriorityColor(debtor.priority);
  const statusText = getStatusText(debtor.status);

  body.innerHTML = `
    <div class="modal-details">
      <div class="debtor-summary">
        <h4>Общая информация</h4>
        <p><strong>Клиент:</strong> ${debtor.client}</p>
        <p><strong>Сумма задолженности:</strong> ${formatCurrency(debtor.amount)}</p>
        <p><strong>Дней просрочки:</strong> <span class="${debtor.days_overdue > 30 ? 'overdue-days' : 'due-soon-days'}">${debtor.days_overdue} дней</span></p>
        <p><strong>Текущий статус:</strong> <span class="status-btn ${getStatusClass(debtor.status)}">${debtor.status}</span></p>
        <p><strong>Приоритет:</strong> <span style="color: ${priorityColor}; font-weight: bold;">${getPriorityText(debtor.priority)}</span></p>
      </div>

      <div class="action-recommendations">
        <h4>Рекомендуемые действия</h4>
        ${getDebtorActionRecommendations(debtor)}
      </div>

      <div class="debtor-actions">
        <h4>Доступные действия</h4>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <button class="btn btn--primary" onclick="contactDebtor('${debtor.client}')">Связаться с клиентом</button>
          <button class="btn btn--secondary" onclick="sendPaymentReminder('${debtor.client}')">Отправить напоминание</button>
          <button class="btn btn--secondary" onclick="exportDebtorData('${debtor.client}')">Экспортировать данные</button>
        </div>
      </div>

      <div class="contact-history">
        <h4>История контактов</h4>
        <p style="color: var(--color-text-secondary); font-style: italic;">Функция в разработке. Здесь будет отображаться история всех контактов с клиентом.</p>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

// Вспомогательные функции
function getPriorityColor(priority) {
  const colors = {
    'critical': '#DC2626',
    'high': '#EF4444',
    'medium': '#F59E0B',
    'low': '#22C55E'
  };
  return colors[priority] || '#6B7280';
}

function getPriorityText(priority) {
  const texts = {
    'critical': 'Критический',
    'high': 'Высокий',
    'medium': 'Средний',
    'low': 'Низкий'
  };
  return texts[priority] || 'Неопределен';
}

function getDebtorActionRecommendations(debtor) {
  if (debtor.priority === 'critical') {
    return `
      <ul>
        <li style="color: #DC2626;">🔴 Немедленно связаться с клиентом</li>
        <li>📞 Назначить личную встречу</li>
        <li>📋 Рассмотреть план погашения</li>
        <li>⚖️ Подготовить документы для юридических действий</li>
      </ul>
    `;
  } else if (debtor.priority === 'high') {
    return `
      <ul>
        <li style="color: #F59E0B;">🟡 Связаться в течение 24 часов</li>
        <li>📧 Отправить официальное напоминание</li>
        <li>📋 Обсудить условия оплаты</li>
        <li>📅 Назначить контрольную дату</li>
      </ul>
    `;
  } else {
    return `
      <ul>
        <li style="color: #22C55E;">🟢 Стандартное напоминание</li>
        <li>📧 Отправить счет повторно</li>
        <li>📞 Связаться в течение недели</li>
        <li>📊 Мониторить статус</li>
      </ul>
    `;
  }
}

function updateReceivablesStats() {
  // Calculate stats from current invoices data
  const totalAmount = CURRENT_INVOICES_DATA.reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdueAmount = CURRENT_INVOICES_DATA
    .filter(invoice => invoice.overdue)
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalCount = CURRENT_INVOICES_DATA.length;
  const onTimeCount = CURRENT_INVOICES_DATA.filter(invoice => !invoice.overdue).length;
  const onTimePercentage = ((onTimeCount / totalCount) * 100).toFixed(1);

  // Update DOM elements
  const totalAmountEl = document.getElementById('totalReceivablesAmount');
  const overdueAmountEl = document.getElementById('overdueReceivablesAmount');
  const totalCountEl = document.getElementById('totalInvoicesCount');
  const onTimePercentageEl = document.getElementById('onTimePercentage');

  if (totalAmountEl) totalAmountEl.textContent = formatCurrency(totalAmount);
  if (overdueAmountEl) overdueAmountEl.textContent = formatCurrency(overdueAmount);
  if (totalCountEl) totalCountEl.textContent = totalCount;
  if (onTimePercentageEl) onTimePercentageEl.textContent = onTimePercentage + '%';
}

function renderCurrentInvoicesTable() {
  const container = document.getElementById('currentInvoicesTable');
  if (!container) return;

  const table = document.createElement('table');
  table.className = 'data-table';

  table.innerHTML = `
    <thead>
      <tr>
        <th>Номер счета</th>
        <th>Клиент</th>
        <th>Сумма</th>
        <th>Статус</th>
        <th>Менеджер</th>
        <th>До срока/Просрочка</th>
        <th>Действия</th>
      </tr>
    </thead>
    <tbody>
      ${CURRENT_INVOICES_DATA.map(invoice => {
        const daysText = invoice.overdue ?
          `${Math.abs(invoice.days_remaining)} дн. ПРОСРОЧКА` :
          `${invoice.days_remaining} дн. до срока`;
        const rowClass = invoice.overdue ? 'overdue-invoice' :
          (invoice.days_remaining <= 3 ? 'due-soon-invoice' : '');

        return `
          <tr class="${rowClass}" onclick="showInvoiceDetail('${invoice.id}')" style="cursor: pointer;">
            <td><strong>${invoice.id}</strong></td>
            <td>${invoice.client}</td>
            <td>${formatCurrency(invoice.amount)}</td>
            <td><span class="status status--${getStatusClass(invoice.status)}">${invoice.status}</span></td>
            <td>${invoice.manager}</td>
            <td>
              <span class="${invoice.overdue ? 'overdue-days' : (invoice.days_remaining <= 3 ? 'due-soon-days' : '')}">
                ${daysText}
              </span>
            </td>
            <td>
              <div class="table-actions">
                <button class="action-btn action-btn--edit" onclick="editInvoice('${invoice.id}', event)">Изменить</button>
                <button class="action-btn action-btn--delete" onclick="deleteInvoice('${invoice.id}', event)">Удалить</button>
              </div>
            </td>
          </tr>
        `;
      }).join('')}
    </tbody>
  `;

  container.innerHTML = '';
  container.appendChild(table);
}

function updateNPSOverviewStats() {
  // Update current month NPS data in overview
  const currentMonth = appData.nps_monthly[appData.nps_monthly.length - 1];

  const scoreElement = document.querySelector('#clients-nps .nps-overview .stat-card:nth-child(1) .stat-value');
  const promotersElement = document.querySelector('#clients-nps .nps-overview .stat-card:nth-child(2) .stat-value');
  const passivesElement = document.querySelector('#clients-nps .nps-overview .stat-card:nth-child(3) .stat-value');
  const detractorsElement = document.querySelector('#clients-nps .nps-overview .stat-card:nth-child(4) .stat-value');

  if (scoreElement) {
    scoreElement.textContent = currentMonth.nps_score;
    scoreElement.className = `stat-value ${currentMonth.nps_score >= 0 ? 'nps-positive' : 'nps-negative'}`;
  }
  if (promotersElement) promotersElement.textContent = currentMonth.promoters;
  if (passivesElement) passivesElement.textContent = currentMonth.passives;
  if (detractorsElement) detractorsElement.textContent = currentMonth.detractors;
}

function initNPSMonthlyChart() {
  const ctx = document.getElementById('npsMonthlyChart');
  if (!ctx) {
    console.warn('NPS Monthly chart canvas not found');
    return;
  }

  if (charts.npsMonthly) {
    charts.npsMonthly.destroy();
  }

  const monthlyData = appData.nps_monthly;
  const labels = monthlyData.map(d => d.month_name);
  const scores = monthlyData.map(d => d.nps_score);

  console.log('Initializing NPS Monthly chart with data:', { labels, scores });

  charts.npsMonthly = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'NPS Score',
        data: scores,
        borderColor: '#FF8C00',
        backgroundColor: 'rgba(255, 140, 0, 0.15)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: scores.map(score => score >= 0 ? '#22C55E' : '#DC2626'),
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#FF8C00',
          borderWidth: 1,
          callbacks: {
            title: function(context) {
              const dataPoint = monthlyData[context[0].dataIndex];
              return `${dataPoint.month_name} 2024 - NPS: ${dataPoint.nps_score}`;
            },
            afterLabel: function(context) {
              const dataPoint = monthlyData[context.dataIndex];
              return [
                '',
                `Всего ответов: ${dataPoint.total_responses}`,
                `Promoters: ${dataPoint.promoters} (${dataPoint.promoters_pct}%)`,
                `Passives: ${dataPoint.passives} (${dataPoint.passives_pct}%)`,
                `Detractors: ${dataPoint.detractors} (${dataPoint.detractors_pct}%)`
              ];
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: -20,
          max: 30,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
            drawBorder: false
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            callback: function(value) {
              return value;
            }
          }
        },
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
            drawBorder: false
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          }
        }
      },
      onClick: function(event, elements) {
        if (elements.length > 0) {
          const index = elements[0].index;
          const monthData = monthlyData[index];
          showNPSMonthDetails(monthData);
        }
      },
      animation: {
        duration: 2000,
        easing: 'easeInOutCubic'
      }
    }
  });

  console.log('NPS Monthly chart initialized successfully');
}

function showNPSMonthDetails(monthData) {
  const modal = document.getElementById('detailModal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');

  title.textContent = `NPS за ${monthData.month_name} 2024`;
  body.innerHTML = `
    <div class="modal-details">
      <div class="nps-detail-score">
        <h3>NPS Score: <span style="color: ${monthData.nps_score >= 0 ? '#22C55E' : '#DC2626'}">${monthData.nps_score}</span></h3>
      </div>
      <div class="nps-detail-breakdown">
        <div class="nps-breakdown-item">
          <span class="nps-category promoter">Promoters (9-10):</span>
          <span class="nps-count">${monthData.promoters} из ${monthData.total_responses} (${Math.round(monthData.promoters / monthData.total_responses * 100)}%)</span>
        </div>
        <div class="nps-breakdown-item">
          <span class="nps-category passive">Passives (7-8):</span>
          <span class="nps-count">${monthData.passives} из ${monthData.total_responses} (${Math.round(monthData.passives / monthData.total_responses * 100)}%)</span>
        </div>
        <div class="nps-breakdown-item">
          <span class="nps-category detractor">Detractors (0-6):</span>
          <span class="nps-count">${monthData.detractors} из ${monthData.total_responses} (${Math.round(monthData.detractors / monthData.total_responses * 100)}%)</span>
        </div>
      </div>
      <p><strong>Всего ответов:</strong> ${monthData.total_responses}</p>
      <p><strong>Расчет NPS:</strong> ${Math.round(monthData.promoters / monthData.total_responses * 100)}% - ${Math.round(monthData.detractors / monthData.total_responses * 100)}% = ${monthData.nps_score}%</p>
    </div>
  `;

  modal.classList.add('active');
}

function initNPSChartControls() {
  const periodSelect = document.getElementById('npsChartPeriod');
  if (periodSelect) {
    periodSelect.addEventListener('change', (e) => {
      updateNPSChartPeriod(e.target.value);
    });
  }
}

function updateNPSChartPeriod(period) {
  let dataToShow = appData.nps_monthly;

  switch (period) {
    case '3_months':
      dataToShow = appData.nps_monthly.slice(-3);
      break;
    case '6_months':
      dataToShow = appData.nps_monthly.slice(-6);
      break;
    case '10_months':
    default:
      dataToShow = appData.nps_monthly;
      break;
  }

  if (charts.npsMonthly) {
    charts.npsMonthly.data.labels = dataToShow.map(d => d.month_name);
    charts.npsMonthly.data.datasets[0].data = dataToShow.map(d => d.nps_score);
    charts.npsMonthly.update('active');
  }
}

function initClientsChart() {
  const ctx = document.getElementById('clientsChart');
  if (!ctx) return;

  if (charts.clients) {
    charts.clients.destroy();
  }

  // Group clients by LTV ranges
  const ranges = {
    '0-50k': 0,
    '50k-100k': 0,
    '100k-200k': 0,
    '200k+': 0
  };

  appData.support.forEach(client => {
    const ltv = client.total_remaining;
    if (ltv < 50000) ranges['0-50k']++;
    else if (ltv < 100000) ranges['50k-100k']++;
    else if (ltv < 200000) ranges['100k-200k']++;
    else ranges['200k+']++;
  });

  charts.clients = new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels: Object.keys(ranges),
      datasets: [{
        data: Object.values(ranges),
        backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#5D878F'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: 'rgba(255, 255, 255, 0.8)',
            padding: 20
          }
        }
      },
      animation: {
        duration: 1500,
        easing: 'easeInOutCubic'
      }
    }
  });
}

function renderClientsTable() {
  const container = document.getElementById('clientsTable');
  if (!container) return;

  const table = document.createElement('table');
  table.className = 'data-table';

  table.innerHTML = `
    <thead>
      <tr>
        <th>Клиент</th>
        <th>Ежемесячно</th>
        <th>Осталось месяцев</th>
        <th>LTV</th>
        <th>Статус</th>
      </tr>
    </thead>
    <tbody>
      ${filteredData.clients.map(client => `
        <tr>
          <td>${client.name}</td>
          <td>${formatCurrency(client.monthly)}</td>
          <td>${client.remaining_months}</td>
          <td>${formatCurrency(client.total_remaining)}</td>
          <td><span class="status status--${getStatusClass(client.status)}">${client.status}</span></td>
        </tr>
      `).join('')}
    </tbody>
  `;

  container.innerHTML = '';
  container.appendChild(table);
}

function initClientFilters() {
  const searchInput = document.getElementById('clientSearch');
  const statusFilter = document.querySelector('#clients .filter-status');
  const sortSelect = document.querySelector('#clients .sort-clients');

  if (searchInput) {
    searchInput.addEventListener('input', applyClientFilters);
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', applyClientFilters);
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', applyClientFilters);
  }
}

function applyClientFilters() {
  const searchTerm = (document.getElementById('clientSearch')?.value || '').toLowerCase();
  const statusFilter = document.querySelector('#clients .filter-status')?.value || 'all';
  const sortBy = document.querySelector('#clients .sort-clients')?.value || 'ltv-desc';

  // Filter clients
  filteredData.clients = appData.support.filter(client => {
    const nameMatch = client.name.toLowerCase().includes(searchTerm);
    const statusMatch = statusFilter === 'all' || client.status === statusFilter;
    return nameMatch && statusMatch;
  });

  // Sort clients
  filteredData.clients.sort((a, b) => {
    switch (sortBy) {
      case 'ltv-desc':
        return b.total_remaining - a.total_remaining;
      case 'ltv-asc':
        return a.total_remaining - b.total_remaining;
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });

  renderClientsTable();
}

// Modal Functions
function showItemDetails(item) {
  const modal = document.getElementById('detailModal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');

  title.textContent = item.name;
  body.innerHTML = `
    <div class="modal-details">
      <p><strong>Сумма:</strong> ${formatCurrency(item.amount)}</p>
      <p><strong>Категория:</strong> ${item.category}</p>
      <p><strong>Статус:</strong> ${item.status}</p>
      <p><strong>Период:</strong> ${item.period}</p>
    </div>
  `;

  modal.classList.add('active');
}

function showEmployeeDetails(employee) {
  const modal = document.getElementById('detailModal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');

  const workDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

  title.textContent = employee.name;
  body.innerHTML = `
    <div class="modal-details">
      <p><strong>Роль:</strong> ${employee.role}</p>
      <p><strong>Дата начала работы:</strong> ${new Date(employee.start_date).toLocaleDateString('ru-RU')}</p>
      <p><strong>Опыт работы:</strong> ${calculateWorkExperience(employee.start_date)}</p>
      <p><strong>Текущая зарплата:</strong> ${formatCurrency(employee.current_salary)}</p>

      <h4>История зарплаты:</h4>
      <ul>
        ${employee.salary_history.map(item =>
          `<li>${new Date(item.date).toLocaleDateString('ru-RU')}: ${formatCurrency(item.amount)} - ${item.reason}</li>`
        ).join('')}
      </ul>

      <h4>Прогноз повышений:</h4>
      <ul>
        ${employee.salary_forecast.map(item =>
          `<li>${new Date(item.date).toLocaleDateString('ru-RU')}: ${formatCurrency(item.amount)} - ${item.reason}</li>`
        ).join('')}
      </ul>

      <h4>Расписание:</h4>
      <ul>
        ${workDays.map((day, index) =>
          `<li>${dayNames[index]}: ${employee[day]}</li>`
        ).join('')}
      </ul>
    </div>
  `;

  modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('detailModal');
  modal.classList.remove('active');
}

// Event Listeners
function initEventListeners() {
  // Modal close
  const modalClose = document.querySelector('.modal-close');
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  // Click outside modal to close
  const modal = document.getElementById('detailModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // Escape key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

// Initialize Application
function initApp() {
  initNavigation();
  initEventListeners();
  initNotificationCenter();
  // Initialize leads data
  leadsData = [...leadsSystemData.leads];
  switchTab('status'); // Start with status tab
}

// Form validation helper
function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return false;

  const requiredFields = form.querySelectorAll('[required]');
  let isValid = true;

  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      field.style.borderColor = '#DC2626';
      isValid = false;
    } else {
      field.style.borderColor = '';
    }
  });

  if (!isValid) {
    showToast('Пожалуйста, заполните все обязательные поля', 'error');
  }

  return isValid;
}

// Update metrics on status tab to remove LTV support
function updateStatusMetrics() {
  // LTV support metric already removed from HTML
  console.log('Status metrics updated - LTV support metric removed');
}

// New functions for client subcategories
function formatClientType(type) {
  if (type === 'project') return 'Проект';
  return 'Поддержка';
}

function formatActiveText(isActive) {
  return String(isActive ?? '1') === '1' ? 'Активен' : 'Не активен';
}

function getClientAmountMonthly(client) {
  // Пока статично 0, позже замените на реальные данные
  return 0;
}

function getClientLtv(client) {
  // Пока статично 0, позже замените на реальные данные
  return 0;
}

function applyClientsFiltersAndSort(items) {
  let filtered = items.slice();

  // Фильтр по Тип
  if (clientsFilterState.type !== 'all') {
    filtered = filtered.filter(c => String(c.client_type || 'support') === clientsFilterState.type);
  }

  // Фильтр по Статус (Активен/Не активен)
  if (clientsFilterState.status !== 'all') {
    const wantActive = clientsFilterState.status === 'active';
    filtered = filtered.filter(c => (String(c.is_active ?? '1') === '1') === wantActive);
  }

  // Сортировка: всегда сначала активные, затем по выбранному ключу
  const dir = clientsSortState.dir === 'desc' ? -1 : 1;
  const key = clientsSortState.key;

  filtered.sort((a, b) => {
    const aAct = String(a.is_active ?? '1') === '1' ? 1 : 0;
    const bAct = String(b.is_active ?? '1') === '1' ? 1 : 0;

    if (aAct !== bAct) return bAct - aAct; // активные первыми

    if (key === 'amount') {
      const av = Number(getClientAmountMonthly(a) || 0);
      const bv = Number(getClientAmountMonthly(b) || 0);
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * dir;
    }

    // key === 'name'
    const an = String(a.name || '').toLowerCase();
    const bn = String(b.name || '').toLowerCase();
    if (an === bn) return 0;
    return (an > bn ? 1 : -1) * dir;
  });

  return filtered;
}

function renderAllClientsTable() {

  const container = document.getElementById('allClientsTable');
  if (!container) return;

  const escHtml = (str) => String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const getTypeText = (t) => (t === 'project' ? 'Проект' : 'Поддержка');
  const getTypeBadgeClass = (t) => (t === 'project' ? 'info' : 'success');

  const isActive = (c) => String(c.is_active ?? '1') === '1';
  const getActiveText = (c) => (isActive(c) ? 'Активен' : 'Не активен');
  const getActiveBadgeClass = (c) => (isActive(c) ? 'success' : 'error');

  const getAmountMonthly = (c) => 0; // пока статично
  const getLtv = (c) => 0; // пока статично

  // 1) Фильтрация
  let items = Array.isArray(clientsData) ? clientsData.slice() : [];

  if (allClientsTableState.filterType !== 'all') {
    items = items.filter(c => String(c.client_type || 'support') === allClientsTableState.filterType);
  }

  if (allClientsTableState.filterStatus !== 'all') {
    const wantActive = allClientsTableState.filterStatus === 'active';
    items = items.filter(c => isActive(c) === wantActive);
  }

  const searchPrefix = String(allClientsTableState.searchQuery || '').trim().toLowerCase();
  if (searchPrefix !== '') {
    items = items.filter(c => String(c.name || '').toLowerCase().startsWith(searchPrefix));
  }

  // 2) Сортировка: по умолчанию активные сверху, по клику глобальная
  const dir = allClientsTableState.sortDir === 'desc' ? -1 : 1;

  items.sort((a, b) => {
    if (allClientsTableState.groupActiveFirst) {
      const aAct = isActive(a) ? 1 : 0;
      const bAct = isActive(b) ? 1 : 0;
      if (aAct !== bAct) return bAct - aAct;
    }

    if (allClientsTableState.sortKey === 'amount') {
      const av = Number(getAmountMonthly(a) || 0);
      const bv = Number(getAmountMonthly(b) || 0);
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * dir;
    }

    const an = String(a.name || '').toLowerCase();
    const bn = String(b.name || '').toLowerCase();
    if (an === bn) return 0;
    return (an > bn ? 1 : -1) * dir;
  });

  // 3) Заголовок (как было)
  container.innerHTML = `
    <div class="table-header">
      <h3 style="margin-bottom: var(--header-to-content-spacing);">Общий список клиентов</h3>
    </div>
  `;

  const table = document.createElement('table');
  table.className = 'data-table';

  table.innerHTML = `
    <thead>
      <tr>
        <th data-sort="name" style="cursor:pointer;">
          <div class="clients-name-head" id="clientsNameHeadWrap">
            ${allClientsTableState.searchMode
              ? `
                <div class="clients-name-search" id="clientsNameSearchWrap">
                  <input
                    type="text"
                    id="clientsNameSearchInput"
                    class="clients-name-search__input"
                    placeholder="Поиск по названию"
                    value="${escHtml(allClientsTableState.searchQuery || '')}"
                    autocomplete="off"
                  >
                  <button type="button" class="clients-name-search__close" id="clientsNameSearchClose" aria-label="Закрыть поиск">&times;</button>
                </div>
              `
              : `
                <button type="button" class="clients-name-search-trigger" id="clientsNameSearchOpen" aria-label="Открыть поиск">🔍</button>
                <span>Клиент</span>
              `
            }
          </div>
        </th>

        <th>
          <select id="allClientsFilterTypeTh" class="table-filter-select" aria-label="Фильтр по типу">
            <option value="all">Тип</option>
            <option value="project">Проект</option>
            <option value="support">Поддержка</option>
          </select>
        </th>

        <th>
          <select id="allClientsFilterStatusTh" class="table-filter-select" aria-label="Фильтр по статусу">
            <option value="all">Статус</option>
            <option value="active">Активен</option>
            <option value="inactive">Не активен</option>
          </select>
        </th>

        <th data-sort="amount" style="cursor:pointer;">Сумма/Месячно</th>
        <th>LTV</th>
        <th>Действия</th>
      </tr>
    </thead>

    <tbody>
      ${
        items.length
          ? items.map(client => {
              const id = client.id;
              const type = String(client.client_type || 'support');

              return `
                <tr>
                  <td>${escHtml(client.name || '')}</td>
                  <td><span class="status status--${getTypeBadgeClass(type)}">${getTypeText(type)}</span></td>
                  <td><span class="status status--${getActiveBadgeClass(client)}">${getActiveText(client)}</span></td>
                  <td>${getAmountMonthly(client)}</td>
                  <td>${getLtv(client)}</td>
                  <td>
                    <div class="table-actions">
                      <button class="action-btn action-btn--edit" onclick="editClient('${id}', '${type}', event)" title="Редактировать">✏️</button>
                      <button class="action-btn action-btn--delete" onclick="deleteClient('${id}', '${type}', event)" title="Удалить">🗑️</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')
          : `
            <tr>
              <td colspan="6" style="padding: var(--space-16); color: var(--color-text-secondary);">
                Нет клиентов по выбранным условиям
              </td>
            </tr>
          `
      }
    </tbody>
  `;

  container.appendChild(table);

  // 4) Проставляем значения фильтров и навешиваем обработчики
  const typeSel = document.getElementById('allClientsFilterTypeTh');
  const statusSel = document.getElementById('allClientsFilterStatusTh');

  if (typeSel) {
    typeSel.value = allClientsTableState.filterType;
    typeSel.onchange = () => {
      allClientsTableState.filterType = typeSel.value;
      renderAllClientsTable();
    };
  }

  if (statusSel) {
    statusSel.value = allClientsTableState.filterStatus;
    statusSel.onchange = () => {
      allClientsTableState.filterStatus = statusSel.value;
      renderAllClientsTable();
    };
  }

  // 5) Сортировка по клику на заголовки (Клиент и Сумма/Месячно)
  table.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', (e) => {
      // Защита: если клик пришел изнутри select (теоретически), сортировку не дергаем
      const target = e.target;
      if (target && target.tagName && String(target.tagName).toLowerCase() === 'select') return;

      const key = th.getAttribute('data-sort');

      // При ручной сортировке делаем сортировку глобальной (без группировки активных)
      allClientsTableState.groupActiveFirst = false;

      if (allClientsTableState.sortKey === key) {
        allClientsTableState.sortDir = allClientsTableState.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        allClientsTableState.sortKey = key;
        allClientsTableState.sortDir = 'asc';
      }

      renderAllClientsTable();
    });
  });

  const searchOpenBtn = document.getElementById('clientsNameSearchOpen');
  if (searchOpenBtn) {
    searchOpenBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      allClientsTableState.searchMode = true;
      renderAllClientsTable();
    });
  }

  const searchInput = document.getElementById('clientsNameSearchInput');
  if (searchInput) {
    searchInput.addEventListener('click', (e) => e.stopPropagation());
    searchInput.addEventListener('input', (e) => {
      allClientsTableState.searchQuery = String(e.target.value || '');
      renderAllClientsTable();
    });

    requestAnimationFrame(() => {
      try {
        searchInput.focus();
        searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
      } catch (_) {}
    });
  }

  const searchCloseBtn = document.getElementById('clientsNameSearchClose');
  if (searchCloseBtn) {
    searchCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      allClientsTableState.searchMode = false;
      allClientsTableState.searchQuery = '';
      renderAllClientsTable();
    });
  }
}




function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function initLTVDistributionChart() {
  const ctx = document.getElementById('ltvDistributionChart');
  if (!ctx) return;

  if (charts.ltvDistribution) {
    charts.ltvDistribution.destroy();
  }

  // Group clients by LTV ranges
  const ranges = {
    '0-50k': { count: 0, total: 0 },
    '50k-100k': { count: 0, total: 0 },
    '100k-200k': { count: 0, total: 0 },
    '200k+': { count: 0, total: 0 }
  };

  clientsData.forEach(client => {
    const ltv = client.total_remaining;
    if (ltv < 50000) {
      ranges['0-50k'].count++;
      ranges['0-50k'].total += ltv;
    } else if (ltv < 100000) {
      ranges['50k-100k'].count++;
      ranges['50k-100k'].total += ltv;
    } else if (ltv < 200000) {
      ranges['100k-200k'].count++;
      ranges['100k-200k'].total += ltv;
    } else {
      ranges['200k+'].count++;
      ranges['200k+'].total += ltv;
    }
  });

  charts.ltvDistribution = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(ranges),
      datasets: [{
        data: Object.values(ranges).map(r => r.count),
        backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#5D878F'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: 'rgba(255, 255, 255, 0.8)',
            padding: 20
          }
        }
      }
    }
  });
}



function renderLTVAnalysisTable() {
  const container = document.getElementById('ltvAnalysisTable');
  if (!container) return;

  // Sort clients by LTV descending
  const sortedClients = [...clientsData].sort((a, b) => b.total_remaining - a.total_remaining);

  const table = document.createElement('table');
  table.className = 'data-table';

  table.innerHTML = `
    <thead>
      <tr>
        <th>Клиент</th>
        <th>Ежемесячно</th>
        <th>Осталось месяцев</th>
        <th>LTV</th>
        <th>% от общего LTV</th>

      </tr>
    </thead>
    <tbody>
      ${sortedClients.map(client => {
        const totalLTV = clientsData.reduce((sum, c) => sum + c.total_remaining, 0);
        const percentage = ((client.total_remaining / totalLTV) * 100).toFixed(1);
        return `
          <tr>
            <td>${client.name}</td>
            <td>${formatCurrency(client.monthly)}</td>
            <td>${client.remaining_months}</td>
            <td>${formatCurrency(client.total_remaining)}</td>
            <td>${percentage}%</td>

          </tr>
        `;
      }).join('')}
    </tbody>
  `;

  container.innerHTML = '<h3 style="margin-bottom: var(--header-to-content-spacing);">Анализ LTV клиентов</h3>';
  container.appendChild(table);
}

function initNPSChart() {
  const ctx = document.getElementById('npsChart');
  if (!ctx) return;

  if (charts.nps) {
    charts.nps.destroy();
  }

  const npsData = appData.nps_summary;

  charts.nps = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Promoters (9-10)', 'Passives (7-8)', 'Detractors (0-6)'],
      datasets: [{
        data: [npsData.promoters, npsData.passives, npsData.detractors],
        backgroundColor: ['#22C55E', '#F59E0B', '#DC2626'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: 'rgba(255, 255, 255, 0.8)',
            padding: 20
          }
        }
      }
    }
  });
}

function renderNPSDataTable() {
  const container = document.getElementById('npsDataTable');
  if (!container) return;

  // Sort NPS data by score descending
  const sortedNPS = [...appData.nps_data].sort((a, b) => b.score - a.score);

  const table = document.createElement('table');
  table.className = 'data-table';

  table.innerHTML = `
    <thead>
      <tr>
        <th>Клиент</th>
        <th>Оценка</th>
        <th>Категория</th>
        <th>Дата опроса</th>
        <th>Комментарий</th>

      </tr>
    </thead>
    <tbody>
      ${sortedNPS.map(nps => {
        const categoryClass = nps.category === 'Promoter' ? 'success' :
                            nps.category === 'Passive' ? 'warning' : 'error';
        const categoryText = nps.category === 'Promoter' ? 'Промоутер' :
                            nps.category === 'Passive' ? 'Нейтрал' : 'Критик';
        return `
          <tr>
            <td>${nps.client}</td>
            <td><strong>${nps.score}</strong></td>
            <td><span class="status status--${categoryClass}">${categoryText}</span></td>
            <td>${new Date(nps.survey_date).toLocaleDateString('ru-RU')}</td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${nps.comment}</td>

          </tr>
        `;
      }).join('')}
    </tbody>
  `;

  container.innerHTML = '<h3 style="margin-bottom: var(--header-to-content-spacing);">Данные NPS опросов</h3>';
  container.appendChild(table);
}

function getTaskCompletionClass(rate) {
  if (rate < 80) return 'red';
  if (rate >= 80 && rate <= 90) return 'orange';
  return 'green';
}

// Loading indicator functions
function showLoadingIndicator() {
  const indicator = document.querySelector('.loading-indicator');
  if (indicator) {
    indicator.classList.add('active');
  } else {
    // Create loading indicator if it doesn't exist
    const historyTable = document.getElementById('paymentsHistoryTable');
    if (historyTable) {
      historyTable.innerHTML = '<div class="loading-indicator active">Загрузка данных...</div>';
    }
  }
}

function hideLoadingIndicator() {
  const indicator = document.querySelector('.loading-indicator');
  if (indicator) {
    indicator.classList.remove('active');
  }
}

// Receivables subcategory initialization
function initReceivablesSubcategory() {
  console.log('Инициализация раздела задолженности...');

  // Принудительно показать раздел
  const receivablesSection = document.getElementById('finance-receivables');
  if (receivablesSection) {
    receivablesSection.style.display = 'block';
    console.log('Раздел задолженности показан');
  }

  // Немедленно загрузить все данные
  renderReceivablesOverview();
  renderAgingBucketsGrid();

  setTimeout(() => {
    initAgingBucketsChart();
  }, 100);

  setTimeout(() => {
    renderTopDebtorsTableFinance();
    renderInvoiceTimelineTableFinance();
    console.log('Все таблицы задолженности загружены');
  }, 200);
}

function renderReceivablesOverview() {
  console.log('Обновление обзора задолженности...');

  // Используем принудительные данные
  const data = FORCED_RECEIVABLES_DATA;

  // Update receivables overview stats
  const totalReceivablesElement = document.getElementById('totalReceivablesFinance');
  const overdueReceivablesElement = document.getElementById('overdueReceivables');
  const avgCollectionTimeElement = document.getElementById('avgCollectionTime');
  const collectionEfficiencyElement = document.getElementById('collectionEfficiency');

  if (totalReceivablesElement) {
    totalReceivablesElement.textContent = formatCurrency(data.total_receivables);
    console.log('Общая задолженность обновлена:', data.total_receivables);
  }
  if (overdueReceivablesElement) {
    overdueReceivablesElement.textContent = formatCurrency(data.total_overdue);
    console.log('Просроченная задолженность обновлена:', data.total_overdue);
  }
  if (avgCollectionTimeElement) {
    avgCollectionTimeElement.textContent = `${data.average_collection_time} дней`;
  }
  if (collectionEfficiencyElement) {
    collectionEfficiencyElement.textContent = `${data.collection_efficiency}%`;
  }

  console.log('Обзор задолженности полностью обновлен');
}

function renderAgingBucketsGrid() {
  console.log('Обновление возрастных корзин...');

  // Используем принудительные данные
  const buckets = FORCED_RECEIVABLES_DATA.aging_buckets;

  // Update 0-30 days bucket
  const bucket0_30Amount = document.getElementById('bucket-0-30-amount');
  const bucket0_30Count = document.getElementById('bucket-0-30-count');
  const bucket0_30Percentage = document.getElementById('bucket-0-30-percentage');

  if (bucket0_30Amount) bucket0_30Amount.textContent = formatCurrency(buckets['0-30'].amount);
  if (bucket0_30Count) bucket0_30Count.textContent = `${buckets['0-30'].count} счетов`;
  if (bucket0_30Percentage) bucket0_30Percentage.textContent = `${buckets['0-30'].percentage}%`;

  // Update 31-60 days bucket
  const bucket31_60Amount = document.getElementById('bucket-31-60-amount');
  const bucket31_60Count = document.getElementById('bucket-31-60-count');
  const bucket31_60Percentage = document.getElementById('bucket-31-60-percentage');

  if (bucket31_60Amount) bucket31_60Amount.textContent = formatCurrency(buckets['31-60'].amount);
  if (bucket31_60Count) bucket31_60Count.textContent = `${buckets['31-60'].count} счетов`;
  if (bucket31_60Percentage) bucket31_60Percentage.textContent = `${buckets['31-60'].percentage}%`;

  // Update 61-90 days bucket
  const bucket61_90Amount = document.getElementById('bucket-61-90-amount');
  const bucket61_90Count = document.getElementById('bucket-61-90-count');
  const bucket61_90Percentage = document.getElementById('bucket-61-90-percentage');

  if (bucket61_90Amount) bucket61_90Amount.textContent = formatCurrency(buckets['61-90'].amount);
  if (bucket61_90Count) bucket61_90Count.textContent = `${buckets['61-90'].count} счета`;
  if (bucket61_90Percentage) bucket61_90Percentage.textContent = `${buckets['61-90'].percentage}%`;

  // Update 90+ days bucket
  const bucket90PlusAmount = document.getElementById('bucket-90-plus-amount');
  const bucket90PlusCount = document.getElementById('bucket-90-plus-count');
  const bucket90PlusPercentage = document.getElementById('bucket-90-plus-percentage');

  if (bucket90PlusAmount) bucket90PlusAmount.textContent = formatCurrency(buckets['90+'].amount);
  if (bucket90PlusCount) bucket90PlusCount.textContent = `${buckets['90+'].count} счета`;
  if (bucket90PlusPercentage) bucket90PlusPercentage.textContent = `${buckets['90+'].percentage}%`;

  console.log('Возрастные корзины обновлены');
}


let settingsTabInitialized = false;
let currentSettingsSubcategory = 'general';

function initSettingsSubcategoryNavigation() {
  const root = document.getElementById('settings');
  if (!root) return;

  const btns = root.querySelectorAll('.settings-subcategories .subcategory-btn');
  btns.forEach(btn => {
    if (btn.__settingsBound) return;
    btn.__settingsBound = true;
    btn.addEventListener('click', () => {
      const subcategory = btn.dataset.subcategory;
      switchSettingsSubcategory(subcategory);
    });
  });
}

function switchSettingsSubcategory(subcategory) {
  const root = document.getElementById('settings');
  if (!root) return;

  const btns = root.querySelectorAll('.settings-subcategories .subcategory-btn');
  btns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.subcategory === subcategory);
  });

  const contents = root.querySelectorAll('.settings-subcategory-content .subcategory-content');
  contents.forEach(content => {
    content.classList.toggle('active', content.id === `settings-${subcategory}`);
  });

  currentSettingsSubcategory = subcategory;
}

function initSettingsTab() {
  const timeInput = document.getElementById('crmSchedulerStartTime');
  if (timeInput && !timeInput.value) timeInput.value = '09:00';

  if (!settingsTabInitialized) {
    settingsTabInitialized = true;

    const saveBtn = document.getElementById('crmSettingsSaveBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveCrmSettings);

    const reloadBtn = document.getElementById('crmSettingsReloadBtn');
    if (reloadBtn) reloadBtn.addEventListener('click', loadCrmSettings);
  }
  initSettingsSubcategoryNavigation();
  switchSettingsSubcategory(currentSettingsSubcategory);
  initCrmRolesUIOnce();
  initWorkCategoriesUIOnce();
  initProjectStatusesUIOnce();

  loadCrmSettings();
}

function resetCrmRolesUI() {
  const list = document.getElementById('crmRolesList');
  if (!list) return;

  list.innerHTML = `
    <div class="form-row" data-role-row="1" data-fixed="1">
      <div class="form-group">
        <input type="text" class="crmRoleName" placeholder="Роль" autocomplete="off">
      </div>
      <div class="form-group">
        <input type="text" class="crmRoleTag" placeholder="Тег роли" style="width: 90%;" autocomplete="off">
      <button class="action-btn action-btn--delete crmRoleRemoveBtn"   title="Удалить">🗑️</button>
      </div>

    </div>
  `;
}

function addCrmRoleRow(roleName, roleTag) {
  const list = document.getElementById('crmRolesList');
  if (!list) return;

  const row = document.createElement('div');
  row.className = 'form-row';
  row.setAttribute('data-role-row', '1');

  row.innerHTML = `
    <div class="form-group">
      <input type="text" class="crmRoleName" placeholder="Роль" autocomplete="off">
    </div>
    <div class="form-group">
      <input type="text" class="crmRoleTag" placeholder="Тег роли" style="width: 90%;" autocomplete="off">
     <button class="action-btn action-btn--delete crmRoleRemoveBtn"   title="Удалить">🗑️</button>
    </div>

  `;

  const nameEl = row.querySelector('.crmRoleName');
  const tagEl = row.querySelector('.crmRoleTag');

  if (nameEl) nameEl.value = roleName || '';
  if (tagEl) tagEl.value = roleTag || '';

  list.appendChild(row);
}

function collectCrmRoles() {
  const list = document.getElementById('crmRolesList');
  if (!list) return [];

  const rows = Array.from(list.querySelectorAll('[data-role-row="1"]'));
  const roles = [];

  rows.forEach((row, idx) => {
    const nameEl = row.querySelector('.crmRoleName');
    const tagEl = row.querySelector('.crmRoleTag');

    const name = nameEl ? String(nameEl.value || '').trim() : '';
    const tag = tagEl ? String(tagEl.value || '').trim() : '';

    if (name === '' && tag === '') return;

    roles.push({
      role_name: name,
      role_tag: tag,
      sort_order: idx
    });
  });

  return roles;
}

function fillCrmRolesFromApi(roles) {
  resetCrmRolesUI();

  const list = document.getElementById('crmRolesList');
  if (!list) return;

  const fixedRow = list.querySelector('[data-fixed="1"]');
  const fixedName = fixedRow ? fixedRow.querySelector('.crmRoleName') : null;
  const fixedTag = fixedRow ? fixedRow.querySelector('.crmRoleTag') : null;

  const arr = Array.isArray(roles) ? roles : [];

  if (arr.length === 0) {
    if (fixedName) fixedName.value = '';
    if (fixedTag) fixedTag.value = '';
    return;
  }

  if (fixedName) fixedName.value = arr[0].role_name || '';
  if (fixedTag) fixedTag.value = arr[0].role_tag || '';

  for (let i = 1; i < arr.length; i++) {
    addCrmRoleRow(arr[i].role_name || '', arr[i].role_tag || '');
  }
}

function initCrmRolesUIOnce() {
  const list = document.getElementById('crmRolesList');
  const addBtn = document.getElementById('crmAddRoleBtn');
  if (!list || !addBtn) return;

  if (addBtn.dataset.inited === '1') return;
  addBtn.dataset.inited = '1';

  addBtn.addEventListener('click', () => {
    addCrmRoleRow('', '');
  });

  list.addEventListener('click', (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('.crmRoleRemoveBtn') : null;
    if (!btn) return;

    const row = btn.closest('[data-role-row="1"]');
    if (!row) return;

    const isFixed = row.getAttribute('data-fixed') === '1';
    const rows = Array.from(list.querySelectorAll('[data-role-row="1"]'));

    if (isFixed) {
      if (rows.length === 1) {
        const n = row.querySelector('.crmRoleName');
        const t = row.querySelector('.crmRoleTag');
        if (n) n.value = '';
        if (t) t.value = '';
        return;
      }
      row.remove();
      return;
    }

    row.remove();
  });
}


let crmWorkCategoriesInitialized = false;
let crmProjectStatusesInitialized = false;

function resetWorkCategoriesUI() {
  const list = document.getElementById('crmWorkCategoriesList');
  if (!list) return;

  list.innerHTML = `
    <div class="form-row" data-work-category-row="1" data-fixed="1">
      <div class="form-group">
        <input type="text" class="crmWorkCategoryName" placeholder="Название категории" autocomplete="off">
      </div>
      <div class="form-group">
        <input type="text" class="crmWorkCategoryTag" placeholder="Тег категории" style="width: 90%;" autocomplete="off">
        <button class="action-btn action-btn--delete crmWorkCategoryRemoveBtn" title="Удалить">🗑️</button>
      </div>
    </div>
  `;
}

function addWorkCategoryRow(name, tag) {
  const list = document.getElementById('crmWorkCategoriesList');
  if (!list) return;

  const row = document.createElement('div');
  row.className = 'form-row';
  row.setAttribute('data-work-category-row', '1');
  row.innerHTML = `
    <div class="form-group">
      <input type="text" class="crmWorkCategoryName" placeholder="Название категории" autocomplete="off">
    </div>
    <div class="form-group">
      <input type="text" class="crmWorkCategoryTag" placeholder="Тег категории" style="width: 90%;" autocomplete="off">
      <button class="action-btn action-btn--delete crmWorkCategoryRemoveBtn" title="Удалить">🗑️</button>
    </div>
  `;

  const nameEl = row.querySelector('.crmWorkCategoryName');
  const tagEl = row.querySelector('.crmWorkCategoryTag');

  if (nameEl) nameEl.value = name || '';
  if (tagEl) tagEl.value = tag || '';

  list.appendChild(row);
}

function collectWorkCategories() {
  const list = document.getElementById('crmWorkCategoriesList');
  if (!list) return [];

  const rows = Array.from(list.querySelectorAll('[data-work-category-row="1"]'));
  const categories = [];

  rows.forEach((row, idx) => {
    const nameEl = row.querySelector('.crmWorkCategoryName');
    const tagEl = row.querySelector('.crmWorkCategoryTag');
    const name = nameEl ? String(nameEl.value || '').trim() : '';
    const tag = tagEl ? String(tagEl.value || '').trim() : '';

    if (name === '' && tag === '') return;

    categories.push({
      name,
      tag,
      sort_order: idx
    });
  });

  return categories;
}

function fillWorkCategoriesFromApi(items) {
  resetWorkCategoriesUI();

  const list = document.getElementById('crmWorkCategoriesList');
  if (!list) return;

  const fixedRow = list.querySelector('[data-fixed="1"]');
  const fixedName = fixedRow ? fixedRow.querySelector('.crmWorkCategoryName') : null;
  const fixedTag = fixedRow ? fixedRow.querySelector('.crmWorkCategoryTag') : null;

  const arr = Array.isArray(items) ? items : [];

  if (arr.length === 0) {
    if (fixedName) fixedName.value = '';
    if (fixedTag) fixedTag.value = '';
    return;
  }

  if (fixedName) fixedName.value = arr[0].name || '';
  if (fixedTag) fixedTag.value = arr[0].tag || '';

  for (let i = 1; i < arr.length; i++) {
    addWorkCategoryRow(arr[i].name || '', arr[i].tag || '');
  }
}

function initWorkCategoriesUIOnce() {
  const list = document.getElementById('crmWorkCategoriesList');
  const addBtn = document.getElementById('crmAddWorkCategoryBtn');
  if (!list || !addBtn) return;

  if (crmWorkCategoriesInitialized) return;
  crmWorkCategoriesInitialized = true;

  addBtn.addEventListener('click', () => {
    addWorkCategoryRow('', '');
  });

  list.addEventListener('click', (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('.crmWorkCategoryRemoveBtn') : null;
    if (!btn) return;

    const row = btn.closest('[data-work-category-row="1"]');
    if (!row) return;

    const rows = Array.from(list.querySelectorAll('[data-work-category-row="1"]'));
    const isFixed = row.getAttribute('data-fixed') === '1';

    if (isFixed) {
      if (rows.length === 1) {
        const n = row.querySelector('.crmWorkCategoryName');
        const t = row.querySelector('.crmWorkCategoryTag');
        if (n) n.value = '';
        if (t) t.value = '';
        return;
      }
      row.remove();
      return;
    }

    row.remove();
  });
}

function resetProjectStatusesUI() {
  const list = document.getElementById('crmProjectStatusesList');
  if (!list) return;

  list.innerHTML = `
    <div class="form-row" data-project-status-row="1" data-fixed="1">
      <div class="form-group">
        <input type="text" class="crmProjectStatusName" placeholder="Название статуса" autocomplete="off">
      </div>
      <div class="form-group">
        <input type="text" class="crmProjectStatusCode" placeholder="Код статуса" style="width: 90%;" autocomplete="off">
        <button class="action-btn action-btn--delete crmProjectStatusRemoveBtn" title="Удалить">🗑️</button>
      </div>
    </div>
  `;
}

function addProjectStatusRow(name, code) {
  const list = document.getElementById('crmProjectStatusesList');
  if (!list) return;

  const row = document.createElement('div');
  row.className = 'form-row';
  row.setAttribute('data-project-status-row', '1');
  row.innerHTML = `
    <div class="form-group">
      <input type="text" class="crmProjectStatusName" placeholder="Название статуса" autocomplete="off">
    </div>
    <div class="form-group">
      <input type="text" class="crmProjectStatusCode" placeholder="Код статуса" style="width: 90%;" autocomplete="off">
      <button class="action-btn action-btn--delete crmProjectStatusRemoveBtn" title="Удалить">🗑️</button>
    </div>
  `;

  const n = row.querySelector('.crmProjectStatusName');
  const c = row.querySelector('.crmProjectStatusCode');
  if (n) n.value = name || '';
  if (c) c.value = code || '';

  list.appendChild(row);
}

function collectProjectStatuses() {
  const list = document.getElementById('crmProjectStatusesList');
  if (!list) return [];

  const rows = Array.from(list.querySelectorAll('[data-project-status-row="1"]'));
  const out = [];

  rows.forEach((row, idx) => {
    const n = row.querySelector('.crmProjectStatusName');
    const c = row.querySelector('.crmProjectStatusCode');
    const name = n ? String(n.value || '').trim() : '';
    const code = c ? String(c.value || '').trim() : '';
    if (name === '' && code === '') return;
    out.push({
      name,
      code,
      sort_order: idx,
      is_active: 1
    });
  });

  return out;
}

function fillProjectStatusesFromApi(items) {
  resetProjectStatusesUI();

  const list = document.getElementById('crmProjectStatusesList');
  if (!list) return;

  const fixedRow = list.querySelector('[data-fixed="1"]');
  const fixedName = fixedRow ? fixedRow.querySelector('.crmProjectStatusName') : null;
  const fixedCode = fixedRow ? fixedRow.querySelector('.crmProjectStatusCode') : null;
  const arr = Array.isArray(items) ? items : [];

  if (arr.length === 0) {
    if (fixedName) fixedName.value = 'В работе';
    if (fixedCode) fixedCode.value = 'in_progress';
    addProjectStatusRow('Выставить счет', 'to_pay');
    return;
  }

  if (fixedName) fixedName.value = arr[0].name || '';
  if (fixedCode) fixedCode.value = arr[0].code || '';
  for (let i = 1; i < arr.length; i++) {
    addProjectStatusRow(arr[i].name || '', arr[i].code || '');
  }
}

function initProjectStatusesUIOnce() {
  const list = document.getElementById('crmProjectStatusesList');
  const addBtn = document.getElementById('crmAddProjectStatusBtn');
  if (!list || !addBtn) return;
  if (crmProjectStatusesInitialized) return;
  crmProjectStatusesInitialized = true;

  addBtn.addEventListener('click', () => {
    addProjectStatusRow('', '');
  });

  list.addEventListener('click', (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('.crmProjectStatusRemoveBtn') : null;
    if (!btn) return;
    const row = btn.closest('[data-project-status-row="1"]');
    if (!row) return;

    const rows = Array.from(list.querySelectorAll('[data-project-status-row="1"]'));
    const isFixed = row.getAttribute('data-fixed') === '1';
    if (isFixed && rows.length === 1) {
      const n = row.querySelector('.crmProjectStatusName');
      const c = row.querySelector('.crmProjectStatusCode');
      if (n) n.value = '';
      if (c) c.value = '';
      return;
    }
    row.remove();
  });
}

async function loadCrmSettings() {
  try {
    const resp = await fetch('/api.php/settings', {
      method: 'GET',
      credentials: 'same-origin'
    });

    const result = await resp.json().catch(() => null);
    if (!resp.ok || !result || !result.success || !result.data) {
      return;
    }

    const s = result.data.settings || {};
    window.crmSettings = s;
    const roles = result.data.roles || [];
    const workCategories = result.data.work_categories || [];
    const projectStatuses = result.data.project_statuses || [];
    invoicePlanState.workCategories = Array.isArray(workCategories) ? workCategories : [];

    const tinkoffEl = document.getElementById('crmTinkoffBusinessToken');
    const dadataEl = document.getElementById('crmDadataToken');
    const timeInput = document.getElementById('crmSchedulerStartTime');

    if (tinkoffEl) tinkoffEl.value = s.tinkoff_business_token || '';
    if (dadataEl) dadataEl.value = s.dadata_token || '';

    if (timeInput) {
      const h = Number(s.scheduler_start_hour ?? 9);
      const hh = (h < 10 ? '0' + h : String(h));
      timeInput.value = hh + ':00';
    }

    const setVal = (id, value) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = (value === null || value === undefined) ? '' : String(value);
    };

    // Финансы: общие
    setVal('financeCrmPublicUrl', s.crm_public_url);
    setVal('settingsAdminEmail', s.admin_email);
    setVal('settingsAdminTelegramId', s.admin_telegram_id);


    // Финансы: реквизиты отправителя
    setVal('financeLegalName', s.finance_legal_name);
    setVal('financeLegalInn', s.finance_legal_inn);
    setVal('financeLegalKpp', s.finance_legal_kpp);
    setVal('financeLegalAddress', s.finance_legal_address);
    setVal('financeLegalBankDetails', s.finance_legal_bank_details);

    // Финансы: нумерация
    setVal('financeInvoicePrefix', s.finance_invoice_number_prefix);
    setVal('financeActPrefix', s.finance_act_number_prefix);

    // Финансы: T-Bank
    setVal('financeTbankAccountNumber', s.finance_tbank_account_number);
    setVal('financeTbankInvoiceDueDays', s.finance_tbank_invoice_due_days);
    setVal('financeTbankUnitDefault', s.finance_tbank_unit_default);
    setVal('financeTbankVatDefault', s.finance_tbank_vat_default);
    setVal('financeTbankPaymentPurposeTemplate', s.finance_tbank_payment_purpose_template);

    // Финансы: Email
    setVal('financeEmailFromEmail', s.finance_email_from_email);
    setVal('financeEmailFromName', s.finance_email_from_name);
    setVal('financeEmailBcc', s.finance_email_bcc);
    setVal('financeEmailSubjectInvoice', s.finance_email_subject_invoice);
    setVal('financeEmailSubjectAct', s.finance_email_subject_act);
    setVal('financeEmailBodyInvoiceHtml', s.finance_email_body_invoice_html);
    setVal('financeEmailBodyActHtml', s.finance_email_body_act_html);

    // Финансы: Telegram
    setVal('financeTelegramBotToken', s.finance_telegram_bot_token);
    setVal('financeTelegramDefaultMessageInvoice', s.telegram_default_message_invoice);

    // Финансы: Диадок
    setVal('financeDiadocApiClientId', s.finance_diadoc_api_client_id);
    setVal('financeDiadocLogin', s.finance_diadoc_login);
    setVal('financeDiadocPassword', s.finance_diadoc_password);
    setVal('financeDiadocFromBoxId', s.finance_diadoc_from_box_id);

    if (typeof fillCrmRolesFromApi === 'function') {
      fillCrmRolesFromApi(roles);
    }
    if (typeof fillWorkCategoriesFromApi === 'function') {
      fillWorkCategoriesFromApi(workCategories);
    }
    if (typeof fillProjectStatusesFromApi === 'function') {
      fillProjectStatusesFromApi(projectStatuses);
      projectStatusOptions = Array.isArray(projectStatuses) ? projectStatuses.map((s) => ({ code: s.code, name: s.name })) : [];
    }
  } catch (e) {
    console.error('loadCrmSettings error', e);
  }
}




async function saveCrmSettings() {
  const tinkoffEl = document.getElementById('crmTinkoffBusinessToken');
  const dadataEl = document.getElementById('crmDadataToken');
  const timeInput = document.getElementById('crmSchedulerStartTime');

  const timeVal = timeInput ? String(timeInput.value || '').trim() : '';
  if (!/^\d{2}:\d{2}$/.test(timeVal)) {
    if (typeof showToast === 'function') showToast('Укажите время в формате ЧЧ:ММ', 'error');
    return;
  }

  const hour = parseInt(timeVal.slice(0, 2), 10);
  if (Number.isNaN(hour) || hour < 0 || hour > 23) {
    if (typeof showToast === 'function') showToast('Час должен быть в диапазоне 0-23', 'error');
    return;
  }

  const roles = (typeof collectCrmRoles === 'function') ? collectCrmRoles() : [];
  const workCategories = (typeof collectWorkCategories === 'function') ? collectWorkCategories() : [];
  const projectStatuses = (typeof collectProjectStatuses === 'function') ? collectProjectStatuses() : [];

  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  };

  const payload = {
    tinkoff_business_token: tinkoffEl ? tinkoffEl.value : '',
    dadata_token: dadataEl ? dadataEl.value : '',
    scheduler_start_hour: hour,

    // Финансы
    crm_public_url: getVal('financeCrmPublicUrl'),
    admin_email: getVal('settingsAdminEmail'),
    admin_telegram_id: getVal('settingsAdminTelegramId'),

    finance_tbank_account_number: getVal('financeTbankAccountNumber'),
    finance_tbank_invoice_due_days: (() => {
      const v = parseInt(getVal('financeTbankInvoiceDueDays'), 10);
      return Number.isNaN(v) ? 3 : v;
    })(),
    finance_tbank_unit_default: getVal('financeTbankUnitDefault') || 'Шт',
    finance_tbank_vat_default: getVal('financeTbankVatDefault') || 'None',
    finance_tbank_payment_purpose_template: getVal('financeTbankPaymentPurposeTemplate'),

    finance_invoice_number_prefix: getVal('financeInvoicePrefix') || 'INV-',
    finance_act_number_prefix: getVal('financeActPrefix') || 'ACT-',

    finance_legal_name: getVal('financeLegalName'),
    finance_legal_inn: getVal('financeLegalInn'),
    finance_legal_kpp: getVal('financeLegalKpp'),
    finance_legal_address: getVal('financeLegalAddress'),
    finance_legal_bank_details: getVal('financeLegalBankDetails'),

    finance_email_from_email: getVal('financeEmailFromEmail'),
    finance_email_from_name: getVal('financeEmailFromName'),
    finance_email_bcc: getVal('financeEmailBcc'),
    finance_email_subject_invoice: getVal('financeEmailSubjectInvoice'),
    finance_email_subject_act: getVal('financeEmailSubjectAct'),
    finance_email_body_invoice_html: getVal('financeEmailBodyInvoiceHtml'),
    finance_email_body_act_html: getVal('financeEmailBodyActHtml'),

    finance_telegram_bot_token: getVal('financeTelegramBotToken'),
    telegram_default_message_invoice: getVal('financeTelegramDefaultMessageInvoice'),

    finance_diadoc_api_client_id: getVal('financeDiadocApiClientId'),
    finance_diadoc_login: getVal('financeDiadocLogin'),
    finance_diadoc_password: getVal('financeDiadocPassword'),
    finance_diadoc_from_box_id: getVal('financeDiadocFromBoxId'),

    roles: roles,
    work_categories: workCategories,
    project_statuses: projectStatuses
  };

  try {
    const resp = await fetch('/api.php/settings', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await resp.json().catch(() => null);
    if (!resp.ok || !result || !result.success) {
      const msg = (result && result.error && result.error.message) ? result.error.message : 'Ошибка сохранения настроек';
      if (typeof showToast === 'function') showToast(msg, 'error');
      return;
    }

    if (result.data && typeof fillCrmRolesFromApi === 'function') {
      fillCrmRolesFromApi(result.data.roles || []);
    }
    if (result.data && typeof fillWorkCategoriesFromApi === 'function') {
      fillWorkCategoriesFromApi(result.data.work_categories || []);
    }
    if (result.data && typeof fillProjectStatusesFromApi === 'function') {
      fillProjectStatusesFromApi(result.data.project_statuses || []);
      projectStatusOptions = Array.isArray(result.data.project_statuses)
        ? result.data.project_statuses.map((s) => ({ code: s.code, name: s.name }))
        : [];
    }

    if (typeof showToast === 'function') showToast('Настройки сохранены', 'success');
  } catch (e) {
    console.error('saveCrmSettings error', e);
    if (typeof showToast === 'function') showToast('Ошибка сохранения настроек', 'error');
  }
}




const reloadBtn = document.getElementById('crmSettingsReloadBtn');
if (reloadBtn) {
  reloadBtn.addEventListener('click', loadCrmSettings);
}

// Updated Receivables Functions (now part of finance tab)
function initReceivablesTab() {
  // Legacy function - receivables moved to finance tab
  switchTab('finance');
  setTimeout(() => {
    switchFinanceSubcategory('receivables');
  }, 100);
}



function renderTopDebtorsTableFinance() {
  console.log('Рендеринг таблицы топ должников...');
  const container = document.getElementById('topDebtorsTableFinance');
  if (!container) {
    console.error('Контейнер topDebtorsTableFinance не найден');
    return;
  }

  // Используем принудительные данные
  const debtors = FORCED_RECEIVABLES_DATA.top_debtors;

  const table = document.createElement('table');
  table.className = 'data-table';

  table.innerHTML = `
    <thead>
      <tr>
        <th style="cursor: pointer;" onclick="sortTopDebtorsTable('client')">Клиент ↕</th>
        <th style="cursor: pointer;" onclick="sortTopDebtorsTable('amount')">Сумма ↕</th>
        <th style="cursor: pointer;" onclick="sortTopDebtorsTable('days_overdue')">Дней просрочки ↕</th>
        <th>Статус</th>
        <th>Приоритет</th>
      </tr>
    </thead>
    <tbody>
      ${debtors.map(debtor => {
        const priorityClass = debtor.priority === 'Критический' ? 'status--error' :
                             debtor.priority === 'Высокий' ? 'status--warning' :
                             debtor.priority === 'Средний' ? 'status--info' : 'status--success';
        return `
          <tr onclick="showDebtorDetails('${debtor.client}')" style="cursor: pointer;">
            <td>${debtor.client}</td>
            <td style="text-align: right;">${formatCurrency(debtor.amount)}</td>
            <td><span class="${debtor.days_overdue > 30 ? 'overdue-days' : 'due-soon-days'}">${debtor.days_overdue} дн.</span></td>
            <td><span class="status status--${getStatusClass(debtor.status)}">${debtor.status}</span></td>
            <td><span class="status ${priorityClass}">${debtor.priority}</span></td>
          </tr>
        `;
      }).join('')}
    </tbody>
  `;

  container.innerHTML = '';
  container.appendChild(table);
  console.log('Таблица топ должников создана, строк:', debtors.length);
}

function renderInvoiceTimelineTableFinance() {
  console.log('Рендеринг таблицы таймлайна счетов...');
  const container = document.getElementById('invoiceTimelineTableFinance');
  if (!container) {
    console.error('Контейнер invoiceTimelineTableFinance не найден');
    return;
  }

  // Используем принудительные данные
  const invoices = FORCED_RECEIVABLES_DATA.invoice_timeline;

  const table = document.createElement('table');
  table.className = 'data-table';

  table.innerHTML = `
    <thead>
      <tr>
        <th style="cursor: pointer;" onclick="sortInvoiceTimelineTable('client')">Клиент ↕</th>
        <th style="cursor: pointer;" onclick="sortInvoiceTimelineTable('amount')">Сумма ↕</th>
        <th>Статус</th>
        <th>Дней в статусе</th>
        <th style="cursor: pointer;" onclick="sortInvoiceTimelineTable('days_to_due')">До срока оплаты ↕</th>
        <th>Дата счета</th>
        <th>Срок оплаты</th>
      </tr>
    </thead>
    <tbody>
      ${invoices.map(invoice => {
        const dueDaysText = invoice.days_to_due >= 0
          ? `${invoice.days_to_due} дн.`
          : `${Math.abs(invoice.days_to_due)} дн. ПРОСРОЧКА`;
        const dueDaysClass = invoice.days_to_due >= 0 ?
          (invoice.days_to_due <= 3 ? 'due-soon-days' : '') : 'overdue-days';
        const rowClass = invoice.overdue ? 'style="background-color: rgba(220, 38, 38, 0.1);"' : '';

        return `
          <tr ${rowClass} onclick="showInvoiceDetails('${invoice.client}')" style="cursor: pointer;">
            <td>${invoice.client}</td>
            <td style="text-align: right;">${formatCurrency(invoice.amount)}</td>
            <td><span class="status status--${getStatusClass(invoice.status)}">${invoice.status}</span></td>
            <td>${invoice.days_in_status} дн.</td>
            <td><span class="${dueDaysClass}">${dueDaysText}</span></td>
            <td>${new Date(invoice.invoice_date).toLocaleDateString('ru-RU')}</td>
            <td ${invoice.overdue ? 'style="color: #DC2626;"' : ''}>${new Date(invoice.due_date).toLocaleDateString('ru-RU')}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  `;

  container.innerHTML = '';
  container.appendChild(table);
  console.log('Таблица таймлайна счетов создана, строк:', invoices.length);
}

// Make sortPaymentsTable global
window.sortPaymentsTable = sortPaymentsTable;

// Глобальная функция для принудительной загрузки задолженности
function forceLoadReceivables() {
  console.log('🔥 ПРИНУДИТЕЛЬНАЯ ЗАГРУЗКА РАЗДЕЛА ЗАДОЛЖЕННОСТИ');

  // Переключиться на финансы
  switchTab('finance');

  // Подождать немного и переключиться на задолженность
  setTimeout(() => {
    switchFinanceSubcategory('receivables');
    console.log('Раздел задолженности должен быть загружен');
  }, 500);
}

// New Receivables Tab Functions
function initReceivablesTab() {
  renderReceivablesOverviewNew();
  setTimeout(() => {
    initNewAgingChart();
  }, 100);
  renderCriticalAccountsTable();
  renderActionHistoryLog();
}

function renderReceivablesOverviewNew() {
  const data = NEW_RECEIVABLES_DATA.overview;

  const totalElement = document.getElementById('newTotalReceivables');
  const overdueElement = document.getElementById('newOverdueReceivables');
  const currentMonthElement = document.getElementById('newCurrentMonth');
  const collectionRateElement = document.getElementById('newCollectionRate');
  const averageDaysElement = document.getElementById('newAverageDays');

  if (totalElement) totalElement.textContent = formatCurrency(data.total_amount);
  if (overdueElement) overdueElement.textContent = formatCurrency(data.overdue_amount);
  if (currentMonthElement) currentMonthElement.textContent = formatCurrency(data.current_month);
  if (collectionRateElement) collectionRateElement.textContent = `${data.collection_rate}%`;
  if (averageDaysElement) averageDaysElement.textContent = `${data.average_days} дней`;
}

function initNewAgingChart() {
  const ctx = document.getElementById('newAgingChart');
  if (!ctx) return;

  if (charts.newAging) {
    charts.newAging.destroy();
  }

  const data = NEW_RECEIVABLES_DATA.aging_analysis;
  const labels = ['0-30 дней', '31-60 дней', '61-90 дней', 'Свыше 90 дней'];
  const amounts = [
    data['0_30_days'].amount,
    data['31_60_days'].amount,
    data['61_90_days'].amount,
    data['over_90_days'].amount
  ];
  const colors = ['#22C55E', '#F59E0B', '#EF4444', '#DC2626'];

  charts.newAging = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: amounts,
        backgroundColor: colors,
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: 'rgba(255, 255, 255, 0.8)',
            padding: 20
          }
        }
      }
    }
  });
}

function renderCriticalAccountsTable() {
  const container = document.getElementById('criticalAccountsTable');
  if (!container) return;

  const accounts = NEW_RECEIVABLES_DATA.critical_accounts;

  const table = document.createElement('table');
  table.className = 'data-table';

  table.innerHTML = `
    <thead>
      <tr>
        <th>Клиент</th>
        <th>Сумма</th>
        <th>Дней просрочки</th>
        <th>Уровень риска</th>
        <th>Последний контакт</th>
        <th>Требуемое действие</th>
      </tr>
    </thead>
    <tbody>
      ${accounts.map(account => {
        const riskClass = account.risk_level === 'Высокий' ? 'status--error' :
                         account.risk_level === 'Средний' ? 'status--warning' : 'status--success';
        return `
          <tr>
            <td>${account.client}</td>
            <td style="text-align: right;">${formatCurrency(account.amount)}</td>
            <td><span class="overdue-days">${account.days_overdue} дн.</span></td>
            <td><span class="status ${riskClass}">${account.risk_level}</span></td>
            <td>${new Date(account.last_contact).toLocaleDateString('ru-RU')}</td>
            <td>${account.action_required}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  `;

  container.innerHTML = '';
  container.appendChild(table);
}

function renderActionHistoryLog() {
  const container = document.getElementById('actionHistoryLog');
  if (!container) return;

  const actions = NEW_RECEIVABLES_DATA.collection_actions;

  container.innerHTML = actions.map(action => `
    <div class="action-item">
      <div class="action-date">${new Date(action.date).toLocaleDateString('ru-RU')}</div>
      <div class="action-details">
        <div class="action-client">${action.client}</div>
        <div class="action-description">${action.action}</div>
        <div class="action-result">${action.result}</div>
        <div class="action-next">Следующий шаг: ${action.next_action}</div>
      </div>
    </div>
  `).join('');
}

// CRUD Operations for Projects
function openAddProjectModal(status) {
  const modal = document.getElementById('addProjectModal');
  const title = document.getElementById('addProjectModalTitle');
  const form = document.getElementById('addProjectForm');

  title.textContent = `Добавить проект в "${status}"`;
  form.reset();
  currentEditingItem = null;
  currentEditingType = 'project';

  // Store the status for later use
  form.dataset.status = status;

  modal.classList.add('active');
}

function closeAddProjectModal() {
  const modal = document.getElementById('addProjectModal');
  modal.classList.remove('active');
}

// CRUD Operations for Employees
function openAddEmployeeModal() {
  const modal = document.getElementById('addEmployeeModal');
  const title = document.getElementById('employeeModalTitle');
  const form = document.getElementById('employeeForm');

  title.textContent = 'Добавить сотрудника';
  form.reset();
  currentEditingItem = null;
  currentEditingType = 'employee';

  ensureCrmRolesForEmployeesLoaded(false).then(() => {
    populateEmployeeRoleSelect('');
  });

  modal.classList.add('active');
}


function editEmployee(id, event) {
  if (event) {
    event.stopPropagation();
  }

  const safeId = String(id);

  // Ищем по строковому id чтобы не упереться в строгие типы
  const employee = employeesData.find(emp => String(emp.id || emp.name) === safeId);
  if (!employee) {
    console.warn('Employee not found for edit', id);
    return;
  }

  const modal = document.getElementById('addEmployeeModal');
  const title = document.getElementById('employeeModalTitle');
  const form = document.getElementById('employeeForm');

  if (!modal || !title || !form) {
    return;
  }
  const avatarInput = document.getElementById('employeeAvatarFile');
if (avatarInput) {
  avatarInput.value = '';
}

  title.textContent = 'Редактировать сотрудника';

  // Основные поля
  document.getElementById('employeeName').value =
    employee.full_name || employee.name || '';

ensureCrmRolesForEmployeesLoaded(false).then(() => {
  populateEmployeeRoleSelect(employee.employee_type || '');
});

  document.getElementById('employeeEmail').value = employee.email || '';
  document.getElementById('employeePhone').value = employee.phone || '';
  document.getElementById('employeeSalary').value = employee.current_salary || '';
  document.getElementById('employeeStartDate').value = employee.start_date || '';

  // Навыки
  let skillsStr = '';

if (Array.isArray(employee.skills) && employee.skills.length) {
  skillsStr = employee.skills.join(', ');
} else if (typeof employee.skills_raw === 'string' && employee.skills_raw.trim() !== '') {
  skillsStr = employee.skills_raw;
}

document.getElementById('employeeSkills').value = skillsStr;

  // Новые поля
  const tgInput = document.getElementById('employeeTelegramId');
  if (tgInput) {
    tgInput.value = employee.telegram_id || '';
  }

  const defaultCheckbox = document.getElementById('employeeIsDefault');
  if (defaultCheckbox) {
    defaultCheckbox.checked = !!employee.is_default;
  }

  const vacationCheckbox = document.getElementById('employeeIsOnVacation');
  if (vacationCheckbox) {
    vacationCheckbox.checked = !!employee.is_on_vacation;
  }

  currentEditingItem = employee;
  currentEditingType = 'employee';

  modal.classList.add('active');
}


function deleteEmployee(id, event) {
  if (event) {
    event.stopPropagation();
  }

  const safeId = String(id);
  const employee = employeesData.find(emp => String(emp.id || emp.name) === safeId);
  if (!employee) {
    console.warn('Employee not found for delete', id);
    return;
  }

  const title = 'Удаление сотрудника';
  const nameForMsg = employee.full_name || employee.name || '';
  const message = `Вы уверены, что хотите удалить сотрудника "${nameForMsg}"? Это действие нельзя отменить.`;

  showConfirmModal(title, message, async () => {
    const targetId = employee.id || employee.name;

    // Убираем из локального массива
    employeesData = employeesData.filter(
      emp => String(emp.id || emp.name) !== String(targetId)
    );
    renderEmployeeCards();
    if (typeof initEmployeeHeatmap === 'function') {
      initEmployeeHeatmap();
    }
    closeConfirmModal();
    showToast('Сотрудник успешно удален', 'success');

    // И отправляем запрос на удаление на сервер
    if (employee.id) {
      try {
        const response = await fetch(`/api.php/employees/${employee.id}`, {
          method: 'DELETE',
          credentials: 'same-origin'
        });

        if (!response.ok) {
          const text = await response.text().catch(() => '');
          console.error('Failed to delete employee on server', text);
          showToast('Не удалось удалить сотрудника на сервере', 'error');
        }
      } catch (err) {
        console.error('Error deleting employee', err);
        showToast('Ошибка при удалении сотрудника на сервере', 'error');
      }
    }
  });
}


function closeEmployeeModal() {
  const modal = document.getElementById('addEmployeeModal');
  modal.classList.remove('active');
}
async function populateClientManagerSelect(selectedId = 0) {
  const select = document.getElementById('clientManager');
  if (!select) return;

  select.innerHTML = '<option value="0">Выберите менеджера</option>';

  try {
    const response = await fetch('/api.php/employees', {
      method: 'GET',
      credentials: 'same-origin'
    });

    const result = await response.json().catch(() => null);
    const items = result && result.success && result.data && Array.isArray(result.data.employees)
      ? result.data.employees
      : [];

    items.forEach(emp => {
      const opt = document.createElement('option');
      opt.value = String(emp.id);
      opt.textContent = emp.full_name || emp.name || ('ID ' + emp.id);
      select.appendChild(opt);
    });
  } catch (e) {
    console.error('populateClientManagerSelect failed', e);
  }

  select.value = String(selectedId || 0);
}

async function loadClientsStatsFromApi() {
  try {
    const resp = await fetch('/api.php/clients/stats', {
      method: 'GET',
      credentials: 'same-origin'
    });

    const result = await resp.json().catch(() => null);
    if (!resp.ok || !result || !result.success) {
      console.error('loadClientsStatsFromApi failed', result);
      return;
    }

    const stats = result.data && result.data.stats ? result.data.stats : null;
    if (!stats) return;

    const totalEl = document.getElementById('totalClientsCount');
    const projectsEl = document.getElementById('activeProjectsCount');
    const supportEl = document.getElementById('supportClientsCount');

    if (totalEl) totalEl.textContent = String(stats.active_total ?? 0);
    if (projectsEl) projectsEl.textContent = String(stats.active_projects ?? 0);
    if (supportEl) supportEl.textContent = String(stats.active_support ?? 0);
  } catch (e) {
    console.error('loadClientsStatsFromApi error', e);
  }
}
async function loadClientsFromApi() {
  try {
    const resp = await fetch('/api.php/clients', {
      method: 'GET',
      credentials: 'same-origin'
    });

    const result = await resp.json().catch(() => null);
    if (!resp.ok || !result || !result.success) {
      console.error('loadClientsFromApi failed', result);
      return;
    }

    clientsData = (result.data && Array.isArray(result.data.clients)) ? result.data.clients : [];
loadClientsStatsFromApi();
    clientsLoadedOnce = true;

    // Перерисовываем таблицу, если пользователь на вкладке Клиенты
    if (typeof renderAllClientsTable === 'function') {
      renderAllClientsTable();
    }
  } catch (e) {
    console.error('loadClientsFromApi error', e);
  }
}
// CRUD Operations for Clients
function openAddClientModal(section) {
  const modal = document.getElementById('addClientModal');
  const title = document.getElementById('clientModalTitle');
  const form = document.getElementById('clientForm');

  title.textContent = 'Добавить клиента';
  form.reset();

  initClientSupportTabUI();
resetClientSupportTab();

  const typeSel = document.getElementById('clientType');
if (typeSel) typeSel.value = 'support';

  const dadataSearch = document.getElementById('clientDadataSearch');
if (dadataSearch) dadataSearch.value = '';

const legalName = document.getElementById('clientReqCompanyName');
if (legalName) legalName.value = '';

const inn = document.getElementById('clientReqInn');
if (inn) inn.value = '';

const kpp = document.getElementById('clientReqKpp');
if (kpp) kpp.value = '';

  form.dataset.section = section || 'overview';
  form.dataset.clientType = 'support';

  currentEditingItem = null;
  currentEditingType = 'client';

  const isActive = document.getElementById('clientIsActive');
  if (isActive) isActive.checked = true;

  const tracker = document.getElementById('clientTrackerProject');
  if (tracker) tracker.value = '0';

  populateClientManagerSelect(0);

  switchClientModalSubcategory('data');
  modal.classList.add('active');
}

async function editClient(id, type, event) {
  if (event && event.stopPropagation) event.stopPropagation();

  let client = null;

  try {
    const resp = await fetch('/api.php/clients/' + encodeURIComponent(String(id)), {
      method: 'GET',
      credentials: 'same-origin'
    });

    const result = await resp.json().catch(() => null);
    if (!resp.ok || !result || !result.success || !result.data || !result.data.client) {
      if (typeof showToast === 'function') showToast('Не удалось загрузить клиента', 'error');
      return;
    }

    client = result.data.client;
  } catch (e) {
    console.error('editClient load failed', e);
    if (typeof showToast === 'function') showToast('Не удалось загрузить клиента', 'error');
    return;
  }

  const modal = document.getElementById('addClientModal');
  const title = document.getElementById('clientModalTitle');
  const form = document.getElementById('clientForm');

  if (!modal || !title || !form) return;

  title.textContent = 'Редактировать клиента';

  document.getElementById('clientName').value = client.name || '';
  document.getElementById('clientContact').value = client.contact_person || '';
  document.getElementById('clientEmail').value = client.email || '';
  document.getElementById('clientAdditionalEmail').value = client.additional_email || '';
  document.getElementById('clientPhone').value = client.phone || '';
  document.getElementById('clientIndustry').value = client.industry || '';
  document.getElementById('clientWebsite').value = client.website || '';

  const legalName = document.getElementById('clientReqCompanyName');
  if (legalName) legalName.value = client.legal_name || '';

  const inn = document.getElementById('clientReqInn');
  if (inn) inn.value = client.inn || '';

  const kpp = document.getElementById('clientReqKpp');
  if (kpp) kpp.value = client.kpp || '';

  document.getElementById('clientTelegramId').value = client.telegram_id || '';
  document.getElementById('clientChatId').value = client.chat_id || '';

  const tracker = document.getElementById('clientTrackerProject');
  if (tracker) tracker.value = String(client.tracker_project_id || 0);

  const typeSel = document.getElementById('clientType');
  if (typeSel) typeSel.value = String(client.client_type || 'support');

  const isActive = document.getElementById('clientIsActive');
  if (isActive) isActive.checked = String(client.is_active ?? '1') === '1';

  document.getElementById('clientNotes').value = client.notes || '';

  if (typeof populateClientManagerSelect === 'function') {
    populateClientManagerSelect(client.manager_employee_id || 0);
  }

  if (typeof initClientSupportTabUI === 'function') initClientSupportTabUI();
  if (typeof fillClientSupportTabFromClient === 'function') fillClientSupportTabFromClient(client);

  currentEditingItem = client;
  currentEditingType = 'client';

  if (typeof switchClientModalSubcategory === 'function') switchClientModalSubcategory('data');
  modal.classList.add('active');
}



function deleteClient(id, type, event) {
  if (event && event.stopPropagation) event.stopPropagation();

  const client = (Array.isArray(clientsData) ? clientsData : []).find(c => String(c.id) === String(id));
  if (!client) {
    if (typeof showToast === 'function') showToast('Клиент не найден', 'error');
    return;
  }

  if (typeof showConfirmModal !== 'function') {
    // На случай если модалка подтверждения не инициализирована
    if (!window.confirm('Удалить клиента?')) return;
    return doDeleteClient(id);
  }

  showConfirmModal(
    'Удаление клиента',
    'Удалить клиента "' + (client.name || '') + '"? Действие необратимо.',
    async () => {
      try {
        await doDeleteClient(id);
      } finally {
        if (typeof closeConfirmModal === 'function') closeConfirmModal();
      }
    }
  );
}

async function doDeleteClient(id) {
  try {
    const resp = await fetch('/api.php/clients/' + encodeURIComponent(String(id)), {
      method: 'DELETE',
      credentials: 'same-origin'
    });

    const result = await resp.json().catch(() => null);

    if (!resp.ok || !result || !result.success) {
      const msg = (result && result.error && result.error.message) ? result.error.message : 'Ошибка удаления клиента';
      if (typeof showToast === 'function') showToast(msg, 'error');
      return;
    }

    // Удаляем из локального массива
    clientsData = (Array.isArray(clientsData) ? clientsData : []).filter(c => String(c.id) !== String(id));
loadClientsStatsFromApi();
    if (typeof showToast === 'function') showToast('Клиент удален', 'success');
    if (typeof renderAllClientsTable === 'function') renderAllClientsTable();
  } catch (e) {
    console.error('doDeleteClient error', e);
    if (typeof showToast === 'function') showToast('Ошибка удаления клиента', 'error');
  }
}


function initRuPhoneMask() {
  const input = document.getElementById('clientPhone');
  if (!input) return;

  if (input.dataset.maskInited === '1') return;
  input.dataset.maskInited = '1';

  function formatRuPhone(rawDigits) {
    let d = String(rawDigits || '').replace(/\D/g, '');

    // Если ввели 8xxxxxxxxxx или 7xxxxxxxxxx, приводим к 7xxxxxxxxxx
    if (d.length > 0 && d[0] === '8') d = '7' + d.slice(1);
    if (d.length > 0 && d[0] !== '7') d = '7' + d;

    // Оставляем максимум 11 цифр (7 + 10)
    d = d.slice(0, 11);

    const p = d.slice(1); // последние 10 цифр
    let out = '+7';

    if (p.length === 0) return out;

    out += ' (';
    out += p.slice(0, 3);
    if (p.length < 3) return out;

    out += ') ';
    out += p.slice(3, 6);
    if (p.length < 6) return out;

    out += '-';
    out += p.slice(6, 8);
    if (p.length < 8) return out;

    out += '-';
    out += p.slice(8, 10);

    return out;
  }

  function setFormattedFromCurrent() {
    const digits = input.value.replace(/\D/g, '');
    input.value = formatRuPhone(digits);
  }

  input.addEventListener('focus', () => {
    if (!input.value) input.value = '+7';
    setTimeout(() => {
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }, 0);
  });

  input.addEventListener('input', () => {
    const prev = input.value;
    setFormattedFromCurrent();

    // курсор в конец, чтобы не ломать UX простым способом
    if (prev !== input.value) {
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
  });

  input.addEventListener('paste', () => {
    setTimeout(() => {
      setFormattedFromCurrent();
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }, 0);
  });

  // При потере фокуса, если только "+7" без цифр, очищаем
  input.addEventListener('blur', () => {
    const digits = input.value.replace(/\D/g, '');
    if (digits === '' || digits === '7') input.value = '';
  });
}



function closeClientModal() {
  const modal = document.getElementById('addClientModal');
  modal.classList.remove('active');
}

function initClientDadataRequisites() {
  const modal = document.getElementById('addClientModal');
  if (!modal) return;

  const input = document.getElementById('clientDadataSearch');
  const list = document.getElementById('clientDadataSuggestions');

  if (!input || !list) return;
  if (input.dataset.inited === '1') return;
  input.dataset.inited = '1';

  let timer = null;
  let abortCtrl = null;

  function hideList() {
    list.style.display = 'none';
    list.innerHTML = '';
  }


function normalizeCompanyQuotes(str) {
  let s = String(str || '');

  // Меняем пары "..." на «...»
  s = s.replace(/"([^"]+)"/g, '«$1»');

  // Если остались одиночные ", заменяем по порядку: открывающая, закрывающая, и так далее
  let open = true;
  s = s.replace(/"/g, () => {
    const q = open ? '«' : '»';
    open = !open;
    return q;
  });

  return s;
}

  function renderItems(items) {
    if (!items || !items.length) {
      hideList();
      return;
    }

    list.innerHTML = '';
    items.forEach((item) => {
      const el = document.createElement('div');
      el.className = 'dadata-suggestion-item';

      const title = document.createElement('div');
      title.className = 'dadata-suggestion-title';
      title.textContent = item.name || item.value || '';

      const subtitle = document.createElement('div');
      subtitle.className = 'dadata-suggestion-subtitle';
      subtitle.textContent = (item.inn ? ('ИНН ' + item.inn) : '') + (item.kpp ? (', КПП ' + item.kpp) : '');

      el.appendChild(title);
      el.appendChild(subtitle);

      el.addEventListener('click', () => {
        const nameField = document.getElementById('clientReqCompanyName');
        const innField = document.getElementById('clientReqInn');
        const kppField = document.getElementById('clientReqKpp');

      const rawName = item.name || item.value || '';
const fixedName = normalizeCompanyQuotes(rawName);

if (nameField) nameField.value = fixedName;
if (innField) innField.value = item.inn || '';
if (kppField) kppField.value = item.kpp || '';

input.value = fixedName;
hideList();
      });

      list.appendChild(el);
    });

    list.style.display = 'block';
  }

  async function fetchSuggestions(query) {
    if (abortCtrl) abortCtrl.abort();
    abortCtrl = new AbortController();

    const url = '/api.php/dadata/party?q=' + encodeURIComponent(query);

    const resp = await fetch(url, {
      method: 'GET',
      credentials: 'same-origin',
      signal: abortCtrl.signal
    });

    const result = await resp.json().catch(() => null);
    if (!resp.ok || !result || !result.success) return [];

    const items = result.data && Array.isArray(result.data.items) ? result.data.items : [];
    return items;
  }

  input.addEventListener('input', () => {
    const q = (input.value || '').trim();

    if (timer) clearTimeout(timer);
    if (q.length < 2) {
      hideList();
      return;
    }

    timer = setTimeout(async () => {
      try {
        const items = await fetchSuggestions(q);
        renderItems(items);
      } catch (e) {
        if (e && e.name === 'AbortError') return;
        console.error('DaData suggest failed', e);
        hideList();
      }
    }, 250);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideList();
  });

  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!target) return;

    const within = target === input || (list.contains && list.contains(target)) || (input.closest && input.closest('.dadata-search-group') && input.closest('.dadata-search-group').contains(target));
    if (!within) hideList();
  });
}


function initClientSupportTabUI() {
  const modal = document.getElementById('addClientModal');
  if (!modal) return;

  if (modal.dataset.supportInited === '1') return;
  modal.dataset.supportInited = '1';

  const btnInv = document.getElementById('btnAddInvoiceLine');
  const btnAct = document.getElementById('btnAddActLine');

  if (btnInv) {
    btnInv.addEventListener('click', () => addClientSupportLine('invoice'));
  }
  if (btnAct) {
    btnAct.addEventListener('click', () => addClientSupportLine('act'));
  }

  modal.addEventListener('click', (e) => {
    const t = e.target;
    if (!t) return;

    if (t.classList && t.classList.contains('client-support-line__remove')) {
      const line = t.closest('.client-support-line');
      if (!line) return;

      if (line.dataset.fixed === '1') return;
      line.remove();
    }
  });
}

function addClientSupportLine(kind, name = '', value = '') {
  const containerId = (kind === 'invoice') ? 'clientInvoiceLines' : 'clientActLines';
  const container = document.getElementById(containerId);
  if (!container) return;

  const line = document.createElement('div');
  line.className = 'client-support-line';
  line.dataset.kind = kind;
  line.dataset.fixed = '0';

  const inpName = document.createElement('input');
  inpName.type = 'text';
  inpName.className = 'client-support-line__name';
  inpName.placeholder = 'Наименование услуги';
  inpName.value = name || '';

  const inpVal = document.createElement('input');
  inpVal.type = 'text';

  inpVal.className = 'client-support-line__value';
  inpVal.placeholder = (kind === 'invoice') ? 'Стоимость услуги' : 'Стоимость услуги';
  inpVal.value = (value !== null && value !== undefined) ? String(value) : '';

  const btnRemove = document.createElement('button');
  btnRemove.type = 'button';
  btnRemove.className = 'btn btn--secondary client-support-line__remove';
  btnRemove.textContent = 'Удалить';

  line.appendChild(inpName);
  line.appendChild(inpVal);
  line.appendChild(btnRemove);

  container.appendChild(line);
}

function resetClientSupportTab() {
  const ids = [
    'clientSendInvoiceSchedule',
    'clientInvoiceUseEndMonthDate',
    'clientSendInvoiceTelegram',
    'clientSendInvoiceDiadoc',
    'clientSendActDiadoc'
  ];

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.checked = false;
  });

  const inv = document.getElementById('clientInvoiceLines');
  const act = document.getElementById('clientActLines');

  if (inv) {
    inv.innerHTML = `
      <div class="client-support-line" data-kind="invoice" data-fixed="1">
        <input type="text" class="client-support-line__name" placeholder="Наименование услуги">
        <input type="text"  class="client-support-line__value" placeholder="Стоимость услуги">
        <button type="button" class="btn btn--secondary client-support-line__remove" style="display:none;">Удалить</button>
      </div>
    `;
  }

  if (act) {
    act.innerHTML = `
      <div class="client-support-line" data-kind="act" data-fixed="1">
        <input type="text" class="client-support-line__name" placeholder="Наименование услуги">
        <input type="text"  class="client-support-line__value" placeholder="Стоимость услуги">
        <button type="button" class="btn btn--secondary client-support-line__remove" style="display:none;">Удалить</button>
      </div>
    `;
  }
}

function collectClientSupportLines(kind) {
  const containerId = (kind === 'invoice') ? 'clientInvoiceLines' : 'clientActLines';
  const container = document.getElementById(containerId);
  if (!container) return [];

  const rows = Array.from(container.querySelectorAll('.client-support-line'));
  const items = [];

  rows.forEach((row) => {
    const nameEl = row.querySelector('.client-support-line__name');
    const valEl = row.querySelector('.client-support-line__value');

    const name = nameEl ? String(nameEl.value || '').trim() : '';
    const valRaw = valEl ? String(valEl.value || '').trim() : '';

    if (name === '') return;

    items.push({
      service_name: name,
      value: valRaw
    });
  });

  return items;
}

function fillClientSupportTabFromClient(client) {
  // Сначала сброс, потом установка значений
  resetClientSupportTab();

  const map = [
    ['clientSendInvoiceSchedule', 'send_invoice_schedule'],
    ['clientInvoiceUseEndMonthDate', 'invoice_use_end_month_date'],
    ['clientSendInvoiceTelegram', 'send_invoice_telegram'],
    ['clientSendInvoiceDiadoc', 'send_invoice_diadoc'],
    ['clientSendActDiadoc', 'send_act_diadoc']
  ];

  map.forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.checked = String(client[key] ?? '0') === '1';
  });

  const inv = Array.isArray(client.invoice_items) ? client.invoice_items : [];
  const act = Array.isArray(client.act_items) ? client.act_items : [];

  const invContainer = document.getElementById('clientInvoiceLines');
  const actContainer = document.getElementById('clientActLines');

  if (invContainer && inv.length > 0) {
    const firstRow = invContainer.querySelector('.client-support-line[data-fixed="1"]');
    if (firstRow) {
      const n = firstRow.querySelector('.client-support-line__name');
      const v = firstRow.querySelector('.client-support-line__value');
      if (n) n.value = inv[0].service_name || '';
      if (v) v.value = inv[0].service_price || '';
    }
    for (let i = 1; i < inv.length; i++) {
      addClientSupportLine('invoice', inv[i].service_name || '', inv[i].service_price || '');
    }
  }

  if (actContainer && act.length > 0) {
    const firstRow = actContainer.querySelector('.client-support-line[data-fixed="1"]');
    if (firstRow) {
      const n = firstRow.querySelector('.client-support-line__name');
      const v = firstRow.querySelector('.client-support-line__value');
      if (n) n.value = act[0].service_name || '';
      if (v) v.value = act[0].service_amount || '';
    }
    for (let i = 1; i < act.length; i++) {
      addClientSupportLine('act', act[i].service_name || '', act[i].service_amount || '');
    }
  }
}


function initClientModalSubcategories() {
  const modal = document.getElementById('addClientModal');
  if (!modal) return;

  if (modal.dataset.tabsInited === '1') return;
  modal.dataset.tabsInited = '1';

  const btns = modal.querySelectorAll('.client-modal-subcategories .subcategory-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const subcategory = btn.dataset.subcategory;
      switchClientModalSubcategory(subcategory);
    });
  });
 initClientDadataRequisites();
 initClientSupportTabUI();
 initRuPhoneMask();
  switchClientModalSubcategory('data');
}

function switchClientModalSubcategory(subcategory) {
  const modal = document.getElementById('addClientModal');
  if (!modal) return;

  const btns = modal.querySelectorAll('.client-modal-subcategories .subcategory-btn');
  btns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.subcategory === subcategory);
  });

  const contents = modal.querySelectorAll('.client-modal-subcategory-content .subcategory-content');
  contents.forEach(content => {
    content.classList.toggle('active', content.id === `client-modal-${subcategory}`);
  });
}


// Form Submission Handlers
document.addEventListener('DOMContentLoaded', () => {
  // Project form submission
  const projectForm = document.getElementById('addProjectForm');
  if (projectForm) {
    projectForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const newProject = {
        id: 'proj_' + Date.now(),
        name: document.getElementById('projectName').value,
        client: document.getElementById('projectClient').value,
        amount: parseInt(document.getElementById('projectAmount').value),
        category: document.getElementById('projectCategory').value,
        manager: document.getElementById('projectManager').value,
        status: e.target.dataset.status,
        period: 'Октябрь'
      };

      projectsData.push(newProject);
      initKanbanBoard();
      showToast('Проект успешно добавлен', 'success');
      closeAddProjectModal();
    });
  }



// Client form submission
const clientForm = document.getElementById('clientForm');
if (clientForm) {
  if (clientForm.dataset.boundSubmit !== '1') {
    clientForm.dataset.boundSubmit = '1';

    clientForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phoneInput = document.getElementById('clientPhone');
const phoneDigits = phoneInput ? String(phoneInput.value || '').replace(/\D/g, '') : '';

if (phoneDigits.length !== 11 || phoneDigits[0] !== '7') {
  if (typeof showToast === 'function') {
    showToast('Телефон должен быть заполнен полностью: +7 (999) 999-99-99', 'error');
  } else {
    alert('Телефон должен быть заполнен полностью: +7 (999) 999-99-99');
  }
  if (phoneInput) phoneInput.focus();
  return;
}

      const clientType = e.target.dataset.clientType || 'support';

      const payload = {
        name: document.getElementById('clientName').value,
        contact_person: document.getElementById('clientContact').value,
        email: document.getElementById('clientEmail').value,
        additional_email: document.getElementById('clientAdditionalEmail').value,
        phone: document.getElementById('clientPhone').value,
        industry: document.getElementById('clientIndustry').value,
        website: document.getElementById('clientWebsite').value,

  legal_name: (document.getElementById('clientReqCompanyName') ? document.getElementById('clientReqCompanyName').value : ''),
  inn: (document.getElementById('clientReqInn') ? document.getElementById('clientReqInn').value : ''),
  kpp: (document.getElementById('clientReqKpp') ? document.getElementById('clientReqKpp').value : ''),
        telegram_id: document.getElementById('clientTelegramId').value,
        chat_id: document.getElementById('clientChatId').value,
        tracker_project_id: parseInt(document.getElementById('clientTrackerProject').value, 10) || 0,
          client_type: (document.getElementById('clientType') ? document.getElementById('clientType').value : 'support'),
        manager_employee_id: parseInt(document.getElementById('clientManager').value, 10) || 0,
        is_active: document.getElementById('clientIsActive').checked ? 1 : 0,
        send_invoice_schedule: document.getElementById('clientSendInvoiceSchedule') && document.getElementById('clientSendInvoiceSchedule').checked ? 1 : 0,
invoice_use_end_month_date: document.getElementById('clientInvoiceUseEndMonthDate') && document.getElementById('clientInvoiceUseEndMonthDate').checked ? 1 : 0,
send_invoice_telegram: document.getElementById('clientSendInvoiceTelegram') && document.getElementById('clientSendInvoiceTelegram').checked ? 1 : 0,
send_invoice_diadoc: document.getElementById('clientSendInvoiceDiadoc') && document.getElementById('clientSendInvoiceDiadoc').checked ? 1 : 0,
send_act_diadoc: document.getElementById('clientSendActDiadoc') && document.getElementById('clientSendActDiadoc').checked ? 1 : 0,

invoice_items: collectClientSupportLines('invoice').map(x => ({
  service_name: x.service_name,
  service_price: x.value
})),
act_items: collectClientSupportLines('act').map(x => ({
  service_name: x.service_name,
  service_amount: x.value
})),
        notes: document.getElementById('clientNotes').value
      };



      // Сохранение клиента в БД через API
      try {
        const isUpdate = currentEditingItem && String(currentEditingItem.id || '').match(/^\d+$/);
        const url = isUpdate ? `/api.php/clients/${currentEditingItem.id}` : '/api.php/clients';

        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(payload)
        });

        const result = await resp.json().catch(() => null);
        if (!resp.ok || !result || !result.success) {
          const msg = (result && result.error && result.error.message) ? result.error.message : 'Ошибка сохранения клиента';
          showToast(msg, 'error');
          return;
        }

        const saved = result.data.client;

        // Данные для текущих таблиц (чтобы не ломать LTV-виды)
        const clientData = {
          ...saved,
          // сохранение LTV-заглушек из старой логики
          monthly: currentEditingItem && currentEditingItem.monthly ? currentEditingItem.monthly : 10000,
          remaining_months: currentEditingItem && currentEditingItem.remaining_months ? currentEditingItem.remaining_months : 12,
          total_remaining: currentEditingItem && currentEditingItem.total_remaining ? currentEditingItem.total_remaining : 120000,
          status: currentEditingItem && currentEditingItem.status ? currentEditingItem.status : 'Ожидание оплаты'
        };

        if (currentEditingItem) {
          const idx = clientsData.findIndex(c => String(c.id || c.name) === String(currentEditingItem.id || currentEditingItem.name));
          if (idx !== -1) clientsData[idx] = { ...currentEditingItem, ...clientData };
          showToast('Клиент успешно обновлен', 'success');
        } else {
          clientsData.push(clientData);
          showToast('Клиент успешно добавлен', 'success');
        }
if (typeof loadClientsStatsFromApi === 'function') loadClientsStatsFromApi();
        closeClientModal();

        // Перерисовка текущей вкладки клиентов
        if (typeof renderAllClientsTable === 'function') {
          renderAllClientsTable();
        }
      } catch (err) {
        console.error('Client save failed', err);
        showToast('Ошибка сохранения клиента', 'error');
      }
    });
  }
}

});

// Send Reminder Function
async function sendReminder(invoicePlanId, event) {
  event?.stopPropagation?.();

  try {
    const resp = await fetch(`/api.php/finance/invoice-plans/${invoicePlanId}/remind`, {
      method: 'POST',
      credentials: 'same-origin'
    });
    if (!resp.ok) throw new Error('remind failed');
    showToast('Напоминание отправлено', 'info');
    await loadStatusBoard();
  } catch (err) {
    console.error(err);
    showToast('Ошибка отправки напоминания', 'error');
  }
}

// Toast Notification System
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;

  const icon = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  }[type] || 'ℹ';

  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-icon">${icon}</div>
      <div class="toast-message">${message}</div>
      <button class="toast-close" onclick="removeToast(this.parentElement.parentElement)">&times;</button>
    </div>
  `;

  container.appendChild(toast);

  // Auto remove after 5 seconds
  setTimeout(() => {
    removeToast(toast);
  }, 5000);
}

function removeToast(toast) {
  if (toast && toast.parentElement) {
    toast.style.animation = 'toastSlideOut 0.3s ease-out';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }
}

// Confirmation Modal
function showConfirmModal(title, message, confirmCallback) {
  const modal = document.getElementById('confirmModal');
  const titleElement = document.getElementById('confirmModalTitle');
  const bodyElement = document.getElementById('confirmModalBody');
  const confirmBtn = document.getElementById('confirmAction');

  titleElement.textContent = title;
  bodyElement.textContent = message;

  // Remove existing event listeners
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

  // Add new event listener
  newConfirmBtn.addEventListener('click', confirmCallback);

  modal.classList.add('active');
}

function closeConfirmModal() {
  const modal = document.getElementById('confirmModal');
  modal.classList.remove('active');
}

// Fix spacing between headers and content
function fixHeaderSpacing() {
  // Apply consistent spacing to all section headers
  const sectionHeaders = document.querySelectorAll('.section-header, .table-header, .chart-header');
  sectionHeaders.forEach(header => {
    if (header.nextElementSibling) {
      header.style.marginBottom = 'var(--header-to-content-spacing)';
    }
  });

  // Fix specific client table headers
const clientTableHeaders = document.querySelectorAll('#allClientsTable h3, #ltvAnalysisTable h3, #npsDataTable h3');
  clientTableHeaders.forEach(header => {
    header.style.marginBottom = 'var(--header-to-content-spacing)';
  });

  // Apply section spacing
  const sections = document.querySelectorAll('.chart-section, .kanban-section, .finance-overview, .sales-funnel-section, .insights-carousel-section, .attention-section, .heatmap-section, .revenue-trends-section');
  sections.forEach(section => {
    section.style.marginBottom = 'var(--section-spacing)';
  });

  // Apply card margins
  const cards = document.querySelectorAll('.metric-card, .stat-card, .employee-card, .kanban-card');
  cards.forEach(card => {
    card.style.marginBottom = 'var(--card-margin)';
  });
}

// Enhanced app initialization
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  updateStatusMetrics();

  // Initialize tooltips and improved interactions
  initTooltips();
  initImprovedAnimations();

  // Add form submission handlers
  setupFormHandlers();

  // Fix spacing issues
  setTimeout(fixHeaderSpacing, 500);

  console.log('✅ Приложение полностью инициализировано с полной CRUD функциональностью и исправленными отступами');
});

// Setup form submission handlers
function setupFormHandlers() {
  // Employee form submission
  const employeeForm = document.getElementById('employeeForm');
  if (employeeForm) {
    employeeForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = employeeForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
      }

      const fullName = document.getElementById('employeeName').value.trim();
     const roleSelect = document.getElementById('employeeRole');
const roleCode = roleSelect.value;
const roleLabel = roleSelect.options[roleSelect.selectedIndex].textContent.trim();
      const email = document.getElementById('employeeEmail').value.trim();
      const phone = document.getElementById('employeePhone').value.trim();
      const salary = parseInt(document.getElementById('employeeSalary').value, 10) || 0;
      const startDate = document.getElementById('employeeStartDate').value || null;
      const telegramId = document.getElementById('employeeTelegramId').value.trim();
      const isDefault = document.getElementById('employeeIsDefault').checked;
      const isOnVacation = document.getElementById('employeeIsOnVacation').checked;
      const skillsInput = document.getElementById('employeeSkills').value;
      const skills = skillsInput
        ? skillsInput.split(',').map(s => s.trim()).filter(Boolean)
        : [];



if (!fullName || !roleCode || !email || !phone) {
  showToast('Заполните обязательные поля: ФИО, роль, email, телефон', 'error');
  if (submitBtn) {
    submitBtn.disabled = false;
  }
  return;
}

const payload = {
    full_name: fullName,
    position: roleLabel,            // что показываем в карточке
    email,
    phone,
    employee_type: roleCode,        // код: account_manager / support / designer
    telegram_id: telegramId,
    is_default: isDefault,
    is_on_vacation: isOnVacation,
    salary_monthly: salary,
    start_date: startDate,
    skills
};

      const isEdit = !!(currentEditingItem && currentEditingType === 'employee');
      const targetId = isEdit && currentEditingItem ? currentEditingItem.id : null;

      const url = isEdit && targetId
        ? `/api.php/employees/${targetId}`
        : '/api.php/employees';

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'same-origin',
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error && result.error.message ? result.error.message : 'Ошибка сохранения сотрудника');
        }

        const apiEmployee = result.data && result.data.employee ? result.data.employee : null;


let mapped = null; // обязательно до if

if (apiEmployee) {
  mapped = mapEmployeeFromApi(apiEmployee);

  if (isEdit && targetId) {
    employeesData = employeesData.map(emp =>
      String(emp.id || emp.name) === String(targetId) ? mapped : emp
    );
  } else {
    employeesData.push(mapped);
  }
} else {
  await loadEmployeesFromApi();
}

if (mapped && mapped.id && isDefault) {
  employeesData = employeesData.map(emp => ({
    ...emp,
    is_default: String(emp.id) === String(mapped.id) ? 1 : 0
  }));
}

const avatarInput = document.getElementById('employeeAvatarFile');
const avatarFile = avatarInput && avatarInput.files && avatarInput.files[0] ? avatarInput.files[0] : null;

if (avatarFile && mapped && mapped.id) {
  try {
    const fd = new FormData();
    fd.append('avatar', avatarFile);

    const resp = await fetch(`/api.php/employees/${mapped.id}/avatar`, {
      method: 'POST',
      body: fd,
      credentials: 'same-origin'
    });

    if (!resp.ok) {
      showToast('Сотрудник сохранен, но аватар не загрузился', 'error');
   closeEmployeeModal();
renderEmployeeCards();
initEmployeeHeatmap();
    } else {
      // Пытаемся распарсить JSON. Если не получилось, делаем reload сотрудников из API.
      let r = null;
      try {
        r = await resp.json();
      } catch (jsonErr) {
        r = null;
      }

      if (r && r.success && r.data && r.data.employee) {
        const updated = mapEmployeeFromApi(r.data.employee);

        // На всякий случай анти-кеш для мгновенного отображения
  if (updated.avatar_url) {
    const sep = updated.avatar_url.includes('?') ? '&' : '?';
    updated.avatar_url = `${updated.avatar_url}${sep}v=${Date.now()}`;
  }
        employeesData = employeesData.map(emp =>
          String(emp.id) === String(updated.id) ? updated : emp
        );
if (isDefault) {
  employeesData = employeesData.map(emp => ({
    ...emp,
    is_default: String(emp.id) === String(updated.id) ? 1 : 0
  }));
}

renderEmployeeCards();
  initEmployeeHeatmap();
      } else {
        // Фоллбек: гарантированно подтягиваем актуальные данные (в том числе avatar_url)
        await loadEmployeesFromApi();
      }
    }
  } catch (e) {
    console.error(e);
    // Даже если был сбой, пробуем подтянуть данные заново
    try {
      await loadEmployeesFromApi();
    } catch (e2) {
      console.error(e2);
    }
  } finally {
    if (avatarInput) {
      avatarInput.value = '';
    }
  }
}


        showToast(isEdit ? 'Сотрудник успешно обновлен' : 'Сотрудник успешно добавлен', 'success');
        closeEmployeeModal();
        renderEmployeeCards();
        initEmployeeHeatmap();
      } catch (err) {
        console.error(err);
        showToast('Ошибка сохранения сотрудника', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
        }
      }
    });
  }

  const scheduleForm = document.getElementById('employeeScheduleForm');
  if (scheduleForm) {
    scheduleForm.addEventListener('change', (e) => {
      if (e.target.matches('input[type="checkbox"][data-day]')) {
        const day = e.target.getAttribute('data-day');
        const fromInput = scheduleForm.querySelector(`input[data-day-from="${day}"]`);
        const toInput = scheduleForm.querySelector(`input[data-day-to="${day}"]`);
        const enabled = e.target.checked;

        if (fromInput) {
          fromInput.disabled = !enabled;
          if (!enabled) fromInput.value = '';
        }
        if (toInput) {
          toInput.disabled = !enabled;
          if (!enabled) toInput.value = '';
        }
      }
    });

    scheduleForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!currentScheduleEmployeeId) {
        closeEmployeeScheduleModal();
        return;
      }

      const schedule = {};
      for (let day = 1; day <= 7; day += 1) {
        const checkbox = scheduleForm.querySelector(`input[type="checkbox"][data-day="${day}"]`);
        const fromInput = scheduleForm.querySelector(`input[data-day-from="${day}"]`);
        const toInput = scheduleForm.querySelector(`input[data-day-to="${day}"]`);

        const enabled = checkbox && checkbox.checked;
        let fromHour = null;
        let toHour = null;

        if (enabled) {
          if (fromInput && fromInput.value) {
            fromHour = parseInt(fromInput.value.split(':')[0], 10);
          }
          if (toInput && toInput.value) {
            toHour = parseInt(toInput.value.split(':')[0], 10);
          }
        }

        schedule[day] = {
          enabled,
          from_hour: Number.isInteger(fromHour) ? fromHour : null,
          to_hour: Number.isInteger(toHour) ? toHour : null
        };
      }

      const employee = employeesData.find(emp => String(emp.id || emp.name) === String(currentScheduleEmployeeId));
      if (employee) {
        employee.schedule = schedule;
        const stats = getScheduleStats(employee.schedule);
employee.working_days = stats.workingDays;
employee.hours_per_week = stats.hoursPerWeek;

const rate = calcHourlyRate(employee.current_salary || 0, employee.hours_per_week || 0);
employee.hourly_rate = Math.round(rate * 100) / 100;

employee.experience = formatExperience(employee.start_date || '');

        const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        for (let i = 0; i < dayKeys.length; i += 1) {
          const weekday = i + 1;
          const key = dayKeys[i];
          employee[key] = schedule[weekday] && schedule[weekday].enabled ? 'Рабочий' : 'Выходной';
        }
      }

      if (employee && typeof employee.id === 'number') {
        try {
          await fetch(`/api.php/employees/${employee.id}/schedule`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({ schedule })
          });
        } catch (err) {
          console.error('Failed to save schedule', err);
        }
      }

      showToast('Расписание сохранено', 'success');
      closeEmployeeScheduleModal();
      renderEmployeeCards();
      initEmployeeHeatmap();
    });
  }


  // Client form submission
// Client form submission
const clientForm = document.getElementById('clientForm');
if (clientForm) {
  if (clientForm.dataset.boundSubmit !== '1') {
    clientForm.dataset.boundSubmit = '1';

    clientForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const clientType = e.target.dataset.clientType || 'support';

      const payload = {
        name: document.getElementById('clientName').value,
        contact_person: document.getElementById('clientContact').value,
        email: document.getElementById('clientEmail').value,
        additional_email: document.getElementById('clientAdditionalEmail').value,
        phone: document.getElementById('clientPhone').value,
        industry: document.getElementById('clientIndustry').value,
        website: document.getElementById('clientWebsite').value,

  legal_name: (document.getElementById('clientReqCompanyName') ? document.getElementById('clientReqCompanyName').value : ''),
  inn: (document.getElementById('clientReqInn') ? document.getElementById('clientReqInn').value : ''),
  kpp: (document.getElementById('clientReqKpp') ? document.getElementById('clientReqKpp').value : ''),
        telegram_id: document.getElementById('clientTelegramId').value,
        chat_id: document.getElementById('clientChatId').value,
        tracker_project_id: parseInt(document.getElementById('clientTrackerProject').value, 10) || 0,
          client_type: (document.getElementById('clientType') ? document.getElementById('clientType').value : 'support'),
        manager_employee_id: parseInt(document.getElementById('clientManager').value, 10) || 0,
        is_active: document.getElementById('clientIsActive').checked ? 1 : 0,
        send_invoice_schedule: document.getElementById('clientSendInvoiceSchedule') && document.getElementById('clientSendInvoiceSchedule').checked ? 1 : 0,
invoice_use_end_month_date: document.getElementById('clientInvoiceUseEndMonthDate') && document.getElementById('clientInvoiceUseEndMonthDate').checked ? 1 : 0,
send_invoice_telegram: document.getElementById('clientSendInvoiceTelegram') && document.getElementById('clientSendInvoiceTelegram').checked ? 1 : 0,
send_invoice_diadoc: document.getElementById('clientSendInvoiceDiadoc') && document.getElementById('clientSendInvoiceDiadoc').checked ? 1 : 0,
send_act_diadoc: document.getElementById('clientSendActDiadoc') && document.getElementById('clientSendActDiadoc').checked ? 1 : 0,

invoice_items: collectClientSupportLines('invoice').map(x => ({
  service_name: x.service_name,
  service_price: x.value
})),
act_items: collectClientSupportLines('act').map(x => ({
  service_name: x.service_name,
  service_amount: x.value
})),
        notes: document.getElementById('clientNotes').value
      };

      // Проекты не сохраняем в clients, оставляем старую локальную логику
      if (clientType === 'project') {
        const clientData = {
          id: currentEditingItem ? (currentEditingItem.id || currentEditingItem.name) : ('client_' + Date.now()),
          ...payload
        };

        if (currentEditingItem) {
          const idx = projectsData.findIndex(c => String(c.id || c.name) === String(currentEditingItem.id || currentEditingItem.name));
          if (idx !== -1) projectsData[idx] = { ...currentEditingItem, ...clientData };
          showToast('Клиент успешно обновлен', 'success');
        } else {
          clientData.amount = 50000;
          clientData.category = 'Разработка';
          clientData.period = 'Октябрь';
          clientData.status = 'В работе';
          projectsData.push(clientData);
          showToast('Клиент успешно добавлен', 'success');
        }

        if (typeof loadClientsStatsFromApi === 'function') loadClientsStatsFromApi();

        closeClientModal();
        renderAllClientsTable();
        return;
      }

      // Сохранение клиента в БД через API
      try {
        const isUpdate = currentEditingItem && String(currentEditingItem.id || '').match(/^\d+$/);
        const url = isUpdate ? `/api.php/clients/${currentEditingItem.id}` : '/api.php/clients';

        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(payload)
        });

        const result = await resp.json().catch(() => null);
        if (!resp.ok || !result || !result.success) {
          const msg = (result && result.error && result.error.message) ? result.error.message : 'Ошибка сохранения клиента';
          showToast(msg, 'error');
          return;
        }

        const saved = result.data.client;

        // Данные для текущих таблиц (чтобы не ломать LTV-виды)
        const clientData = {
          ...saved,
          // сохранение LTV-заглушек из старой логики
          monthly: currentEditingItem && currentEditingItem.monthly ? currentEditingItem.monthly : 10000,
          remaining_months: currentEditingItem && currentEditingItem.remaining_months ? currentEditingItem.remaining_months : 12,
          total_remaining: currentEditingItem && currentEditingItem.total_remaining ? currentEditingItem.total_remaining : 120000,
          status: currentEditingItem && currentEditingItem.status ? currentEditingItem.status : 'Ожидание оплаты'
        };

        if (currentEditingItem) {
          const idx = clientsData.findIndex(c => String(c.id || c.name) === String(currentEditingItem.id || currentEditingItem.name));
          if (idx !== -1) clientsData[idx] = { ...currentEditingItem, ...clientData };
          showToast('Клиент успешно обновлен', 'success');
        } else {
          clientsData.push(clientData);
          showToast('Клиент успешно добавлен', 'success');
        }

        closeClientModal();

        // Перерисовка текущей вкладки клиентов
        if (typeof renderAllClientsTable === 'function') {
          renderAllClientsTable();
        }
      } catch (err) {
        console.error('Client save failed', err);
        showToast('Ошибка сохранения клиента', 'error');
      }
    });
  }
}

}

// Tooltips for metrics
function initTooltips() {
  const metricCards = document.querySelectorAll('.metric-card, .stat-card');
  metricCards.forEach(card => {
    card.addEventListener('mouseenter', (e) => {
      if (e.target.dataset.tooltip) {
        showTooltip(e.target, e.target.dataset.tooltip);
      }
    });

    card.addEventListener('mouseleave', hideTooltip);
  });
}

function showTooltip(element, text) {
  const tooltip = document.createElement('div');
  tooltip.className = 'chart-tooltip';
  tooltip.textContent = text;
  tooltip.style.position = 'absolute';
  tooltip.style.zIndex = '10000';
  tooltip.style.pointerEvents = 'none';

  const rect = element.getBoundingClientRect();
  tooltip.style.left = rect.left + 'px';
  tooltip.style.top = (rect.top - 40) + 'px';

  document.body.appendChild(tooltip);
  element._tooltip = tooltip;
}

function hideTooltip(e) {
  if (e.target._tooltip) {
    e.target._tooltip.remove();
    delete e.target._tooltip;
  }
}

// Improved animations and transitions
function initImprovedAnimations() {
  // Add intersection observer for fade-in animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe all major sections
  const sections = document.querySelectorAll('.chart-section, .kanban-section, .finance-overview, .receivables-overview');
  sections.forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
  });
}

// Aging Buckets Chart
function initAgingBucketsChart() {
  console.log('Инициализация диаграммы возрастных корзин...');
  const ctx = document.getElementById('agingBucketsChart');
  if (!ctx) {
    console.error('Canvas agingBucketsChart не найден');
    return;
  }

  if (charts.agingBuckets) {
    charts.agingBuckets.destroy();
  }

  // Используем принудительные данные
  const buckets = FORCED_RECEIVABLES_DATA.aging_buckets;
  const labels = ['0-30 дней', '31-60 дней', '61-90 дней', '90+ дней'];
  const amounts = [buckets['0-30'].amount, buckets['31-60'].amount, buckets['61-90'].amount, buckets['90+'].amount];
  const colors = ['#22C55E', '#F59E0B', '#EF4444', '#DC2626'];

  charts.agingBuckets = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: amounts,
        backgroundColor: colors,
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverBorderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: 'rgba(255, 255, 255, 0.8)',
            padding: 20,
            font: {
              size: 12
            },
            generateLabels: function(chart) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label, i) => {
                  const dataset = data.datasets[0];
                  const value = dataset.data[i];
                  const percentage = buckets[Object.keys(buckets)[i]].percentage;
                  return {
                    text: `${label}: ${formatCurrency(value)} (${percentage}%)`,
                    fillStyle: dataset.backgroundColor[i],
                    strokeStyle: dataset.borderColor,
                    lineWidth: dataset.borderWidth,
                    hidden: false,
                    index: i
                  };
                });
              }
              return [];
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label;
              const value = context.raw;
              const bucketKey = Object.keys(buckets)[context.dataIndex];
              const count = buckets[bucketKey].count;
              const percentage = buckets[bucketKey].percentage;
              return [
                `${label}: ${formatCurrency(value)}`,
                `Счетов: ${count}`,
                `Процент: ${percentage}%`
              ];
            }
          }
        }
      },
      animation: {
        duration: 1500,
        easing: 'easeInOutCubic'
      }
    }
  });
}

// Sorting functions for receivables tables
let topDebtorsSortOrder = { field: null, direction: 'asc' };
let invoiceTimelineSortOrder = { field: null, direction: 'asc' };

function sortTopDebtorsTable(field) {
  if (topDebtorsSortOrder.field === field) {
    topDebtorsSortOrder.direction = topDebtorsSortOrder.direction === 'asc' ? 'desc' : 'asc';
  } else {
    topDebtorsSortOrder.field = field;
    topDebtorsSortOrder.direction = 'asc';
  }

  const sortedDebtors = [...appData.receivables.top_debtors].sort((a, b) => {
    let aVal, bVal;

    switch (field) {
      case 'client':
        aVal = a.client.toLowerCase();
        bVal = b.client.toLowerCase();
        break;
      case 'amount':
        aVal = a.amount;
        bVal = b.amount;
        break;
      case 'days_overdue':
        aVal = a.days_overdue;
        bVal = b.days_overdue;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return topDebtorsSortOrder.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return topDebtorsSortOrder.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Temporarily update the data and re-render
  const originalData = appData.receivables.top_debtors;
  appData.receivables.top_debtors = sortedDebtors;
  renderTopDebtorsTableFinance();
  appData.receivables.top_debtors = originalData;
}

function sortInvoiceTimelineTable(field) {
  if (invoiceTimelineSortOrder.field === field) {
    invoiceTimelineSortOrder.direction = invoiceTimelineSortOrder.direction === 'asc' ? 'desc' : 'asc';
  } else {
    invoiceTimelineSortOrder.field = field;
    invoiceTimelineSortOrder.direction = 'asc';
  }

  const sortedInvoices = [...appData.receivables.invoice_timeline].sort((a, b) => {
    let aVal, bVal;

    switch (field) {
      case 'client':
        aVal = a.client.toLowerCase();
        bVal = b.client.toLowerCase();
        break;
      case 'amount':
        aVal = a.amount;
        bVal = b.amount;
        break;
      case 'days_to_due':
        aVal = a.days_to_due;
        bVal = b.days_to_due;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return invoiceTimelineSortOrder.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return invoiceTimelineSortOrder.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Temporarily update the data and re-render
  const originalData = appData.receivables.invoice_timeline;
  appData.receivables.invoice_timeline = sortedInvoices;
  renderInvoiceTimelineTableFinance();
  appData.receivables.invoice_timeline = originalData;
}

// Detail modal functions for receivables
function showDebtorDetails(clientName) {
  const debtor = appData.receivables.top_debtors.find(d => d.client === clientName);
  if (!debtor) return;

  const modal = document.getElementById('detailModal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');

  title.textContent = `Детали должника: ${debtor.client}`;
  body.innerHTML = `
    <div class="modal-details">
      <div class="debtor-summary">
        <h4>Общая информация</h4>
        <p><strong>Сумма задолженности:</strong> ${formatCurrency(debtor.amount)}</p>
        <p><strong>Дней просрочки:</strong> <span class="${debtor.days_overdue > 30 ? 'overdue-days' : 'due-soon-days'}">${debtor.days_overdue} дней</span></p>
        <p><strong>Текущий статус:</strong> <span class="status status--${getStatusClass(debtor.status)}">${debtor.status}</span></p>
        <p><strong>Приоритет:</strong> <span class="priority-${debtor.priority.toLowerCase()}">${debtor.priority}</span></p>
      </div>

      <div class="action-recommendations">
        <h4>Рекомендуемые действия</h4>
        ${getDebtorRecommendations(debtor)}
      </div>

      <div class="contact-history">
        <h4>История контактов</h4>
        <p><em>Функция в разработке...</em></p>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function showInvoiceDetails(clientName) {
  const invoice = appData.receivables.invoice_timeline.find(i => i.client === clientName);
  if (!invoice) return;

  const modal = document.getElementById('detailModal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');

  title.textContent = `Детали счета: ${invoice.client}`;
  body.innerHTML = `
    <div class="modal-details">
      <div class="invoice-summary">
        <h4>Информация о счете</h4>
        <p><strong>Сумма:</strong> ${formatCurrency(invoice.amount)}</p>
        <p><strong>Дата выставления:</strong> ${new Date(invoice.invoice_date).toLocaleDateString('ru-RU')}</p>
        <p><strong>Срок оплаты:</strong> ${new Date(invoice.due_date).toLocaleDateString('ru-RU')}</p>
        <p><strong>Статус:</strong> <span class="status status--${getStatusClass(invoice.status)}">${invoice.status}</span></p>
        <p><strong>Дней в текущем статусе:</strong> ${invoice.days_in_status}</p>
        <p><strong>До срока оплаты:</strong>
          <span class="${invoice.days_to_due >= 0 ? (invoice.days_to_due <= 3 ? 'due-soon-days' : '') : 'overdue-days'}">
            ${invoice.days_to_due >= 0 ? `${invoice.days_to_due} дней` : `Просрочен на ${Math.abs(invoice.days_to_due)} дней`}
          </span>
        </p>
      </div>

      ${invoice.overdue ? `
        <div class="overdue-alert">
          <h4 style="color: #DC2626;">⚠️ Счет просрочен!</h4>
          <p>Требуется немедленное взыскание задолженности.</p>
        </div>
      ` : ''}

      <div class="next-actions">
        <h4>Следующие шаги</h4>
        ${getInvoiceRecommendations(invoice)}
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function getDebtorRecommendations(debtor) {
  if (debtor.priority === 'Критический') {
    return `
      <ul>
        <li style="color: #DC2626;">🔴 Немедленно связаться с клиентом</li>
        <li>📞 Назначить личную встречу</li>
        <li>📋 Рассмотреть план погашения</li>
        <li>⚖️ Подготовить документы для юридических действий</li>
      </ul>
    `;
  } else if (debtor.priority === 'Высокий') {
    return `
      <ul>
        <li style="color: #F59E0B;">🟡 Связаться в течение 24 часов</li>
        <li>📧 Отправить официальное напоминание</li>
        <li>📋 Обсудить условия оплаты</li>
        <li>📅 Назначить контрольную дату</li>
      </ul>
    `;
  } else {
    return `
      <ul>
        <li style="color: #22C55E;">🟢 Стандартное напоминание</li>
        <li>📧 Отправить счет повторно</li>
        <li>📞 Связаться в течение недели</li>
        <li>📊 Мониторить статус</li>
      </ul>
    `;
  }
}

function getInvoiceRecommendations(invoice) {
  if (invoice.overdue) {
    return `
      <ul>
        <li style="color: #DC2626;">🔴 Срочно связаться с клиентом</li>
        <li>📧 Отправить уведомление о просрочке</li>
        <li>💰 Начислить пени (если предусмотрено)</li>
        <li>📋 Подготовить план взыскания</li>
      </ul>
    `;
  } else if (invoice.days_to_due <= 3) {
    return `
      <ul>
        <li style="color: #F59E0B;">🟡 Отправить напоминание</li>
        <li>📞 Связаться с клиентом</li>
        <li>📧 Подтвердить готовность к оплате</li>
        <li>📅 Уточнить дату оплаты</li>
      </ul>
    `;
  } else {
    return `
      <ul>
        <li style="color: #22C55E;">🟢 Мониторить до срока оплаты</li>
        <li>📊 Обновить статус при изменениях</li>
        <li>📧 Стандартные напоминания</li>
        <li>📋 Подготовиться к следующему этапу</li>
      </ul>
    `;
  }
}

// Invoice management functions
function showInvoiceDetail(invoiceId) {
  const invoice = CURRENT_INVOICES_DATA.find(inv => inv.id === invoiceId);
  if (!invoice) return;

  const modal = document.getElementById('detailModal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');

  title.textContent = `Детали счета: ${invoice.id}`;
  body.innerHTML = `
    <div class="modal-details">
      <div class="invoice-summary">
        <h4>Информация о счете</h4>
        <p><strong>Клиент:</strong> ${invoice.client}</p>
        <p><strong>Сумма:</strong> ${formatCurrency(invoice.amount)}</p>
        <p><strong>Статус:</strong> <span class="status status--${getStatusClass(invoice.status)}">${invoice.status}</span></p>
        <p><strong>Менеджер:</strong> ${invoice.manager}</p>
        <p><strong>Дата выставления:</strong> ${new Date(invoice.invoice_date).toLocaleDateString('ru-RU')}</p>
        <p><strong>Срок оплаты:</strong> ${new Date(invoice.due_date).toLocaleDateString('ru-RU')}</p>
        <p><strong>Статус оплаты:</strong>
          <span class="${invoice.overdue ? 'overdue-days' : (invoice.days_remaining <= 3 ? 'due-soon-days' : '')}">
            ${invoice.overdue ? `Просрочен на ${Math.abs(invoice.days_remaining)} дней` : `${invoice.days_remaining} дней до срока`}
          </span>
        </p>
      </div>
      ${invoice.overdue ? `
        <div class="overdue-alert">
          <h4 style="color: #DC2626;">⚠️ Счет просрочен!</h4>
          <p>Требуется немедленное взыскание задолженности.</p>
        </div>
      ` : ''}
    </div>
  `;

  modal.classList.add('active');
}

function editInvoice(invoiceId, event) {
  event.stopPropagation();
  showToast('Редактирование счетов будет доступно в следующей версии', 'info');
}

function deleteInvoice(invoiceId, event) {
  event.stopPropagation();

  const invoice = CURRENT_INVOICES_DATA.find(inv => inv.id === invoiceId);
  if (!invoice) return;

  showConfirmModal(
    'Удаление счета',
    `Вы уверены, что хотите удалить счет ${invoice.id} для клиента "${invoice.client}"?`,
    () => {
      const index = CURRENT_INVOICES_DATA.findIndex(inv => inv.id === invoiceId);
      if (index !== -1) {
        CURRENT_INVOICES_DATA.splice(index, 1);
        renderCurrentInvoicesTable();
        updateReceivablesStats();
        showToast('Счет успешно удален', 'success');
      }
      closeConfirmModal();
    }
  );
}

// Функции для действий с должниками
function contactDebtor(clientName) {
  showToast(`Связь с клиентом ${clientName} инициирована`, 'info');
  closeModal();
}

function sendPaymentReminder(clientName) {
  showToast(`Напоминание об оплате отправлено клиенту ${clientName}`, 'success');
  closeModal();
}

function exportDebtorData(clientName) {
  showToast(`Данные клиента ${clientName} экспортированы`, 'success');
  closeModal();
}

function exportBucketData(bucketTitle) {
  showToast(`Данные корзины "${bucketTitle}" экспортированы`, 'success');
  closeModal();
}

function filterByBucket(bucketTitle) {
  showToast(`Отображены клиенты из корзины "${bucketTitle}"`, 'info');
  closeModal();
}

// Make global functions available
window.sortPaymentsTable = sortPaymentsTable;
window.sortTopDebtorsTable = sortTopDebtorsTable;
window.sortInvoiceTimelineTable = sortInvoiceTimelineTable;
window.showDebtorDetails = showDebtorDetails;
window.showInvoiceDetails = showInvoiceDetails;
window.showLoadingIndicator = showLoadingIndicator;
window.hideLoadingIndicator = hideLoadingIndicator;
window.initReceivablesSubcategory = initReceivablesSubcategory;
window.updateLTVMetricsDisplay = updateLTVMetricsDisplay;
window.applyCustomDateRange = applyCustomDateRange;
window.showNPSMonthDetails = showNPSMonthDetails;
window.updateNPSChartPeriod = updateNPSChartPeriod;
window.renderReceivablesOverview = renderReceivablesOverview;
window.renderAgingBucketsGrid = renderAgingBucketsGrid;
window.updateNPSOverviewStats = updateNPSOverviewStats;
window.initTooltips = initTooltips;
window.initImprovedAnimations = initImprovedAnimations;
window.initAgingBucketsChart = initAgingBucketsChart;
window.showInvoiceDetail = showInvoiceDetail;
window.editInvoice = editInvoice;
window.deleteInvoice = deleteInvoice;
window.updateReceivablesStats = updateReceivablesStats;
window.renderCurrentInvoicesTable = renderCurrentInvoicesTable;

// New receivables section global functions
window.showDebtorDetailsNew = showDebtorDetailsNew;
window.showAgingBucketDetails = showAgingBucketDetails;
window.contactDebtor = contactDebtor;
window.sendPaymentReminder = sendPaymentReminder;
window.exportDebtorData = exportDebtorData;
window.exportBucketData = exportBucketData;
window.filterByBucket = filterByBucket;
window.initReceivablesSubcategory = initReceivablesSubcategory;
window.updateReceivablesMetrics = updateReceivablesMetrics;
window.initAgingBucketsInteractivity = initAgingBucketsInteractivity;
window.initTopDebtorsTableInteractivity = initTopDebtorsTableInteractivity;

// New global functions for CRUD operations
window.openAddProjectModal = openAddProjectModal;
window.closeAddProjectModal = closeAddProjectModal;
window.openAddEmployeeModal = openAddEmployeeModal;
window.editEmployee = editEmployee;
window.deleteEmployee = deleteEmployee;
window.closeEmployeeModal = closeEmployeeModal;
window.openAddClientModal = openAddClientModal;
window.editClient = editClient;
window.deleteClient = deleteClient;
window.closeClientModal = closeClientModal;
window.sendReminder = sendReminder;
window.openProjectInvoiceModal = openProjectInvoiceModal;
window.openProjectQuickCreate = openProjectQuickCreate;
window.openProjectEdit = openProjectEdit;
window.deleteProject = deleteProject;
window.sendEndMonthNow = sendEndMonthNow;
window.showToast = showToast;
window.removeToast = removeToast;
window.showConfirmModal = showConfirmModal;
window.closeConfirmModal = closeConfirmModal;
window.validateForm = validateForm;
window.setupFormHandlers = setupFormHandlers;
window.sortTopDebtorsTableNew = sortTopDebtorsTableNew;
window.renderTopDebtorsTableNew = renderTopDebtorsTableNew;
window.getStatusClassForButton = getStatusClassForButton;
window.getBucketDataByTitle = getBucketDataByTitle;
window.getBucketRecommendations = getBucketRecommendations;
window.getPriorityColor = getPriorityColor;
window.getPriorityText = getPriorityText;
window.getDebtorActionRecommendations = getDebtorActionRecommendations;

// Revenue Trends Chart
function initRevenueTrendsChart() {
  const ctx = document.getElementById('revenueTrendsChart');
  if (!ctx) return;

  if (charts.revenueTrends) {
    charts.revenueTrends.destroy();
  }

  const data = revenueTrendsData;
  const labels = data.map(d => d.month_name);
  const actualRevenue = data.map(d => d.revenue);
  const confirmedRevenue = data.map(d => d.confirmed);
  const projectedRevenue = data.map(d => d.projected);
  const previousYearRevenue = data.map(d => d.previous_year);

  charts.revenueTrends = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Фактическая выручка',
          data: actualRevenue,
          borderColor: '#1FB8CD',
          backgroundColor: 'rgba(31, 184, 205, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: '#1FB8CD',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6
        },
        {
          label: 'Подтвержденная выручка',
          data: confirmedRevenue,
          borderColor: '#FFC185',
          backgroundColor: 'rgba(255, 193, 133, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: '#FFC185',
          pointRadius: 4
        },
        {
          label: 'Прогнозная выручка',
          data: projectedRevenue,
          borderColor: '#B4413C',
          backgroundColor: 'rgba(180, 65, 60, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          borderDash: [5, 5],
          pointBackgroundColor: '#B4413C',
          pointRadius: 4
        },
        {
          label: 'Прошлый год',
          data: previousYearRevenue,
          borderColor: '#5D878F',
          backgroundColor: 'rgba(93, 135, 143, 0.1)',
          borderWidth: 1,
          fill: false,
          tension: 0.4,
          borderDash: [10, 5],
          pointBackgroundColor: '#5D878F',
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: 'rgba(255, 255, 255, 0.8)',
            padding: 20,
            font: { size: 12 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#1FB8CD',
          borderWidth: 1,
          callbacks: {
            title: function(context) {
              return context[0].label;
            },
            afterBody: function(context) {
              const dataPoint = data[context[0].dataIndex];
              const currentYear = dataPoint.revenue;
              const previousYear = dataPoint.previous_year;
              const growth = ((currentYear - previousYear) / previousYear * 100).toFixed(1);
              return [``, `Рост к прошлому году: ${growth > 0 ? '+' : ''}${growth}%`];
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        },
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          }
        }
      },
      onClick: function(event, elements) {
        if (elements.length > 0) {
          const index = elements[0].index;
          const monthData = data[index];
          showRevenueMonthDetails(monthData);
        }
      },
      animation: {
        duration: 2000,
        easing: 'easeInOutCubic'
      }
    }
  });

  // Initialize chart period selector
  const periodSelect = document.getElementById('revenueTrendsPeriod');
  if (periodSelect) {
    periodSelect.addEventListener('change', (e) => {
      updateRevenueTrendsPeriod(e.target.value);
    });
  }
}

function updateRevenueTrendsPeriod(period) {
  let dataToShow = revenueTrendsData;

  switch (period) {
    case '3_months':
      dataToShow = revenueTrendsData.slice(-3);
      break;
    case '6_months':
      dataToShow = revenueTrendsData.slice(-6);
      break;
    case '12_months':
    default:
      dataToShow = revenueTrendsData;
      break;
  }

  if (charts.revenueTrends) {
    charts.revenueTrends.data.labels = dataToShow.map(d => d.month_name);
    charts.revenueTrends.data.datasets[0].data = dataToShow.map(d => d.revenue);
    charts.revenueTrends.data.datasets[1].data = dataToShow.map(d => d.confirmed);
    charts.revenueTrends.data.datasets[2].data = dataToShow.map(d => d.projected);
    charts.revenueTrends.data.datasets[3].data = dataToShow.map(d => d.previous_year);
    charts.revenueTrends.update('active');
  }
}

function showRevenueMonthDetails(monthData) {
  const modal = document.getElementById('detailModal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');

  const growth = ((monthData.revenue - monthData.previous_year) / monthData.previous_year * 100).toFixed(1);
  const planGrowth = ((monthData.revenue - monthData.projected) / monthData.projected * 100).toFixed(1);

  title.textContent = `Выручка за ${monthData.month_name}`;
  body.innerHTML = `
    <div class="modal-details">
      <div class="revenue-month-summary">
        <h4>Показатели месяца</h4>
        <p><strong>Фактическая выручка:</strong> ${formatCurrency(monthData.revenue)}</p>
        <p><strong>Подтвержденная выручка:</strong> ${formatCurrency(monthData.confirmed)}</p>
        <p><strong>Прогнозная выручка:</strong> ${formatCurrency(monthData.projected)}</p>
        <p><strong>Прошлый год (${monthData.month_name}):</strong> ${formatCurrency(monthData.previous_year)}</p>
      </div>

      <div class="revenue-growth-analysis">
        <h4>Анализ роста</h4>
        <p><strong>Рост к прошлому году:</strong>
          <span style="color: ${growth >= 0 ? '#22C55E' : '#DC2626'}">
            ${growth > 0 ? '+' : ''}${growth}%
          </span>
        </p>
        <p><strong>Выполнение плана:</strong>
          <span style="color: ${planGrowth >= 0 ? '#22C55E' : '#DC2626'}">
            ${planGrowth > 0 ? '+' : ''}${planGrowth}%
          </span>
        </p>
        <p><strong>% подтверждения:</strong> ${((monthData.confirmed / monthData.revenue) * 100).toFixed(1)}%</p>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

// Employee Heatmap
// Employee Heatmap
function initEmployeeHeatmap() {
  const container = document.getElementById('employeeHeatmap');
  if (!container) return;

  const days = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // Берем реальных сотрудников
  const employees = Array.isArray(employeesData) ? employeesData.slice() : [];

  // Clear container
  container.innerHTML = '';

  // Add headers
  days.forEach((day) => {
    const header = document.createElement('div');
    header.className = 'heatmap-header';
    header.textContent = day;
    container.appendChild(header);
  });

  // Add employee rows
  employees.forEach(emp => {
  const fullName = (emp && (emp.full_name || emp.name)) ? (emp.full_name || emp.name) : 'Сотрудник';
const employeeName = String(fullName).trim().split(/\s+/)[0] || String(fullName).trim() || 'Сотрудник';

    const schedule = (emp && emp.schedule && typeof emp.schedule === 'object') ? emp.schedule : {};

    // Employee name cell (проценты убраны)
    const nameCell = document.createElement('div');
    nameCell.className = 'heatmap-employee';
    nameCell.innerHTML = `<span>${employeeName}</span>`;
    container.appendChild(nameCell);

    // Формируем часы по дням недели из schedule: 1..7
    const dailyHours = [];
    for (let weekday = 1; weekday <= 7; weekday += 1) {
      const info = schedule[weekday] || null;

      let hours = 0;
      if (info && info.enabled) {
        const from = Number.isInteger(info.from_hour) ? info.from_hour : null;
        const to = Number.isInteger(info.to_hour) ? info.to_hour : null;

   if (from !== null && to !== null) {
  if (to === from) {
    hours = 0;
  } else if (to > from) {
    hours = to - from;
  } else {
    // переход через полночь, например 18 -> 0
    hours = (to + 24) - from;
  }
}
      }

      dailyHours.push(hours);
    }

    // Daily hours cells
dailyHours.forEach((hours, dayIndex) => {
  const cell = document.createElement('div');
  cell.className = 'heatmap-cell';

  cell.textContent = hours;

  // Подсветка только если значение > 0
  if (hours > 0) {
    if (hours <= 2) {
      cell.classList.add('hours-0-2');
    } else if (hours <= 6) {
      cell.classList.add('hours-3-6');
    } else if (hours <= 8) {
      cell.classList.add('hours-7-8');
    } else {
      cell.classList.add('hours-9-plus');
    }
  }

  if (typeof showEmployeeDayDetails === 'function') {
    cell.addEventListener('click', () => {
      showEmployeeDayDetails(employeeName, dayIndex, hours);
    });
  }

  container.appendChild(cell);
});


  });
}

function showEmployeeDayDetails(employeeName, dayIndex, hours) {
  const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  const dayName = days[dayIndex];
  const employeeData = employeeHeatmapData.employees[employeeName];

  const modal = document.getElementById('detailModal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');

  title.textContent = `${employeeName} - ${dayName}`;
  body.innerHTML = `
    <div class="modal-details">
      <div class="day-summary">
        <h4>Рабочий день</h4>
        <p><strong>Отработано часов:</strong> ${hours}ч</p>
        <p><strong>Статус:</strong> ${
          hours === 0 ? 'Выходной' :
          hours <= 6 ? 'Неполный день' :
          hours <= 8 ? 'Стандартный день' :
          'Переработка'
        }</p>
      </div>

      <div class="week-summary">
        <h4>Итоги недели</h4>
        <p><strong>Всего часов:</strong> ${employeeData.total_hours}ч</p>
        <p><strong>Утилизация:</strong>
          <span style="color: ${
            employeeData.utilization > 110 ? '#DC2626' :
            employeeData.utilization < 85 ? '#F59E0B' :
            '#22C55E'
          }">${employeeData.utilization}%</span>
        </p>
        <p><strong>Статус:</strong> ${
          employeeData.utilization > 110 ? 'Перегружен' :
          employeeData.utilization < 85 ? 'Недогружен' :
          'Нормальная загрузка'
        }</p>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

// Leads Tab Functions
function initLeadsTab() {
  renderSalesFunnel();
  renderLeadsTable();
  initLeadFilters();
}

function renderSalesFunnel() {
  const container = document.getElementById('salesFunnel');
  if (!container) return;

  const stages = leadsSystemData.sales_funnel.stages;

  container.innerHTML = '';

  stages.forEach((stage, index) => {
    const stageElement = document.createElement('div');
    stageElement.className = 'funnel-stage';
    stageElement.innerHTML = `
      <div class="funnel-stage-name">${stage.name}</div>
      <div class="funnel-stage-count">${stage.count} лидов</div>
      <div class="funnel-stage-value">${formatCurrency(stage.total_value)}</div>
      <div class="funnel-stage-conversion">${stage.conversion_rate}% конверсия</div>
    `;

    stageElement.addEventListener('click', () => {
      showFunnelStageDetails(stage);
    });

    container.appendChild(stageElement);
  });
}

function showFunnelStageDetails(stage) {
  const modal = document.getElementById('detailModal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');

  const stageLeads = leadsData.filter(lead => lead.stage === stage.name);

  title.textContent = `Этап: ${stage.name}`;
  body.innerHTML = `
    <div class="modal-details">
      <div class="stage-summary">
        <h4>Статистика этапа</h4>
        <p><strong>Количество лидов:</strong> ${stage.count}</p>
        <p><strong>Общая стоимость:</strong> ${formatCurrency(stage.total_value)}</p>
        <p><strong>Конверсия:</strong> ${stage.conversion_rate}%</p>
        <p><strong>Среднее время на этапе:</strong> ${stage.avg_time_days} дней</p>
      </div>

      <div class="stage-leads">
        <h4>Лиды на этапе</h4>
        ${stageLeads.length > 0 ?
          stageLeads.map(lead => `
            <div class="lead-item" onclick="showLeadDetails('${lead.id}')" style="cursor: pointer; padding: 8px; border: 1px solid var(--glass-border); border-radius: 6px; margin: 4px 0;">
              <strong>${lead.name}</strong> - ${formatCurrency(lead.potential_value)} (${lead.probability}%)
            </div>
          `).join('') :
          '<p>Нет лидов на этом этапе</p>'
        }
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function renderLeadsTable() {
  const container = document.getElementById('leadsTable');
  if (!container) return;

  const table = document.createElement('table');
  table.className = 'data-table';

  table.innerHTML = `
    <thead>
      <tr>
        <th>Компания</th>
        <th>Контакт</th>
        <th>Этап</th>
        <th>Стоимость</th>
        <th>Вероятность</th>
        <th>Менеджер</th>
        <th>Действия</th>
      </tr>
    </thead>
    <tbody>
      ${leadsData.map(lead => `
        <tr onclick="showLeadDetails('${lead.id}')" style="cursor: pointer;">
          <td><strong>${lead.name}</strong></td>
          <td>${lead.contact_person}</td>
          <td><span class="status status--${getLeadStageClass(lead.stage)}">${lead.stage}</span></td>
          <td>${formatCurrency(lead.potential_value)}</td>
          <td>${lead.probability}%</td>
          <td>${lead.manager}</td>
          <td>
            <div class="table-actions">
              <button class="action-btn action-btn--edit" onclick="editLead('${lead.id}', event)" title="Редактировать">✏️</button>
              <button class="action-btn action-btn--delete" onclick="deleteLead('${lead.id}', event)" title="Удалить">🗑️</button>
            </div>
          </td>
        </tr>
      `).join('')}
    </tbody>
  `;

  container.innerHTML = '';
  container.appendChild(table);
}

function getLeadStageClass(stage) {
  const mapping = {
    'Новый лид': 'info',
    'Квалификация': 'warning',
    'Переговоры': 'working',
    'Предложение': 'month-end',
    'Закрытие': 'success'
  };
  return mapping[stage] || 'info';
}

function initLeadFilters() {
  const stageFilter = document.querySelector('.filter-stage');
  const managerFilter = document.querySelector('.filter-manager');

  if (stageFilter) {
    stageFilter.addEventListener('change', applyLeadFilters);
  }

  if (managerFilter) {
    managerFilter.addEventListener('change', applyLeadFilters);
  }
}

function applyLeadFilters() {
  const stageFilter = document.querySelector('.filter-stage')?.value || 'all';
  const managerFilter = document.querySelector('.filter-manager')?.value || 'all';

  let filteredLeads = [...leadsData];

  if (stageFilter !== 'all') {
    filteredLeads = filteredLeads.filter(lead => lead.stage === stageFilter);
  }

  if (managerFilter !== 'all') {
    filteredLeads = filteredLeads.filter(lead => lead.manager === managerFilter);
  }

  // Temporarily replace data and re-render
  const originalData = [...leadsData];
  leadsData = filteredLeads;
  renderLeadsTable();
  leadsData = originalData;
}

// Lead CRUD Operations
function openAddLeadModal() {
  const modal = document.getElementById('addLeadModal');
  const title = document.getElementById('leadModalTitle');
  const form = document.getElementById('leadForm');

  title.textContent = 'Добавить лид';
  form.reset();
  currentEditingLead = null;

  modal.classList.add('active');
}

function editLead(leadId, event) {
  event.stopPropagation();

  const lead = leadsData.find(l => l.id === leadId);
  if (!lead) return;

  const modal = document.getElementById('addLeadModal');
  const title = document.getElementById('leadModalTitle');
  const form = document.getElementById('leadForm');

  title.textContent = 'Редактировать лид';

  // Fill form with lead data
  document.getElementById('leadName').value = lead.name;
  document.getElementById('leadContact').value = lead.contact_person;
  document.getElementById('leadEmail').value = lead.email || '';
  document.getElementById('leadPhone').value = lead.phone || '';
  document.getElementById('leadSource').value = lead.source;
  document.getElementById('leadStage').value = lead.stage;
  document.getElementById('leadValue').value = lead.potential_value;
  document.getElementById('leadProbability').value = lead.probability;
  document.getElementById('leadManager').value = lead.manager || '';
  document.getElementById('leadNotes').value = lead.notes || '';

  currentEditingLead = lead;
  modal.classList.add('active');
}

function deleteLead(leadId, event) {
  event.stopPropagation();

  const lead = leadsData.find(l => l.id === leadId);
  if (!lead) return;

  showConfirmModal(
    'Удаление лида',
    `Вы уверены, что хотите удалить лид "${lead.name}"? Это действие нельзя отменить.`,
    () => {
      leadsData = leadsData.filter(l => l.id !== leadId);
      renderLeadsTable();
      renderSalesFunnel(); // Update funnel
      showToast('Лид успешно удален', 'success');
      closeConfirmModal();
    }
  );
}

function closeLeadModal() {
  const modal = document.getElementById('addLeadModal');
  modal.classList.remove('active');
}

function showLeadDetails(leadId) {
  const lead = leadsData.find(l => l.id === leadId);
  if (!lead) return;

  const modal = document.getElementById('detailModal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');

  title.textContent = `Лид: ${lead.name}`;
  body.innerHTML = `
    <div class="modal-details">
      <div class="lead-summary">
        <h4>Общая информация</h4>
        <p><strong>Компания:</strong> ${lead.name}</p>
        <p><strong>Контактное лицо:</strong> ${lead.contact_person}</p>
        <p><strong>Email:</strong> ${lead.email || 'Не указан'}</p>
        <p><strong>Телефон:</strong> ${lead.phone || 'Не указан'}</p>
        <p><strong>Источник:</strong> ${lead.source}</p>
        <p><strong>Текущий этап:</strong> <span class="status status--${getLeadStageClass(lead.stage)}">${lead.stage}</span></p>
        <p><strong>Потенциальная стоимость:</strong> ${formatCurrency(lead.potential_value)}</p>
        <p><strong>Вероятность:</strong> ${lead.probability}%</p>
        <p><strong>Менеджер:</strong> ${lead.manager}</p>
        <p><strong>Дата создания:</strong> ${new Date(lead.created_date).toLocaleDateString('ru-RU')}</p>
        <p><strong>Последний контакт:</strong> ${new Date(lead.last_contact).toLocaleDateString('ru-RU')}</p>
      </div>

      <div class="lead-notes">
        <h4>Примечания</h4>
        <p>${lead.notes || 'Нет примечаний'}</p>
      </div>

      <div class="lead-actions">
        <button class="btn btn--primary" onclick="editLead('${lead.id}', event)">Редактировать</button>
        <button class="btn btn--secondary" onclick="contactLead('${lead.id}')">Связаться</button>
        <button class="btn btn--secondary" onclick="moveLeadToNextStage('${lead.id}')">Перевести на следующий этап</button>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function contactLead(leadId) {
  const lead = leadsData.find(l => l.id === leadId);
  if (!lead) return;

  // Update last contact date
  lead.last_contact = new Date().toISOString().split('T')[0];

  showToast(`Контакт с ${lead.name} зафиксирован`, 'success');
  closeModal();
  renderLeadsTable();
}

function moveLeadToNextStage(leadId) {
  const lead = leadsData.find(l => l.id === leadId);
  if (!lead) return;

  const stages = ['Новый лид', 'Квалификация', 'Переговоры', 'Предложение', 'Закрытие'];
  const currentIndex = stages.indexOf(lead.stage);

  if (currentIndex < stages.length - 1) {
    lead.stage = stages[currentIndex + 1];
    // Increase probability
    lead.probability = Math.min(lead.probability + 15, 95);

    showToast(`${lead.name} перемещен на этап "${lead.stage}"`, 'success');
  } else {
    showToast(`${lead.name} уже на финальном этапе`, 'info');
  }

  closeModal();
  renderLeadsTable();
  renderSalesFunnel();
}

// Insights Tab Functions
function initInsightsTab() {
  renderInsightsCarousel();
  renderAttentionItems();
  initInsightsControls();
}

function renderInsightsCarousel() {
  const container = document.getElementById('insightsCarousel');
  if (!container) return;

  container.innerHTML = '';

  insightsData.forEach((insight, index) => {
    const card = document.createElement('div');
    card.className = `insight-card ${index === currentInsightIndex ? 'active' : ''}`;
    card.innerHTML = `
      <div class="insight-timestamp">${insight.timestamp}</div>
      <div class="insight-icon">${insight.icon}</div>
      <div class="insight-content">
        <div class="insight-priority ${insight.priority}">[${getPriorityLabel(insight.priority)}]</div>
        <div class="insight-title">${insight.title}</div>
        <div class="insight-description">${insight.description}</div>
        ${insight.action ? `<a href="#" class="insight-action" onclick="executeInsightAction('${insight.id}')">${insight.action}</a>` : ''}
      </div>
    `;

    card.addEventListener('click', () => {
      if (insight.action_link) {
        executeInsightAction(insight.id);
      }
    });

    container.appendChild(card);
  });

  updateCarouselIndicator();
}

function getPriorityLabel(priority) {
  const labels = {
    'critical': 'КРИТИЧНО',
    'growth': 'РОСТ',
    'action': 'ДЕЙСТВИЕ',
    'urgent': 'СРОЧНО',
    'team': 'КОМАНДА',
    'success': 'УСПЕХ'
  };
  return labels[priority] || priority.toUpperCase();
}

function initInsightsControls() {
  // Auto-rotate insights every 8 seconds
  setInterval(() => {
    nextInsight();
  }, 8000);
}

function previousInsight() {
  currentInsightIndex = currentInsightIndex > 0 ? currentInsightIndex - 1 : insightsData.length - 1;
  updateInsightsCarousel();
}

function nextInsight() {
  currentInsightIndex = currentInsightIndex < insightsData.length - 1 ? currentInsightIndex + 1 : 0;
  updateInsightsCarousel();
}

function updateInsightsCarousel() {
  const cards = document.querySelectorAll('.insight-card');
  cards.forEach((card, index) => {
    card.classList.toggle('active', index === currentInsightIndex);
  });
  updateCarouselIndicator();
}

function updateCarouselIndicator() {
  const indicator = document.getElementById('carouselIndicator');
  if (indicator) {
    indicator.textContent = `${currentInsightIndex + 1} из ${insightsData.length}`;
  }
}

function executeInsightAction(insightId) {
  const insight = insightsData.find(i => i.id === insightId);
  if (!insight) return;

  switch (insight.type) {
    case 'financial':
      switchTab('finance');
      setTimeout(() => switchFinanceSubcategory('receivables'), 100);
      break;
    case 'project':
      switchTab('status');
      break;
    case 'lead':
      switchTab('leads');
      break;
    case 'team':
      switchTab('employees');
      break;
    default:
      showToast(`Выполнено действие: ${insight.action}`, 'info');
  }
}

function renderAttentionItems() {
  const container = document.getElementById('attentionItems');
  if (!container) return;

  container.innerHTML = '';

  attentionItems.forEach(item => {
    const element = document.createElement('div');
    element.className = `attention-item ${item.priority}`;
    element.innerHTML = `
      <div class="attention-priority">
        <span>${item.icon}</span>
        [${item.priority.toUpperCase()}]
      </div>
      <div class="attention-title">${item.title}</div>
      <div class="attention-description">${item.description}</div>
      <div class="attention-action">${item.action}</div>
    `;

    element.addEventListener('click', () => {
      executeAttentionAction(item);
    });

    container.appendChild(element);
  });
}

function executeAttentionAction(item) {
  switch (item.category) {
    case 'payment':
      switchTab('finance');
      setTimeout(() => switchFinanceSubcategory('receivables'), 100);
      break;
    case 'project':
      switchTab('status');
      break;
    case 'lead':
      switchTab('leads');
      break;
    case 'team':
      switchTab('employees');
      break;
  }

  showToast(`Переход к разделу: ${item.category}`, 'info');
}

// Notification Center Functions
function initNotificationCenter() {
  // Initialize notification center
  updateNotificationCount();
}

function toggleNotificationCenter() {
  const notificationCenter = document.getElementById('notificationCenter');
  notificationCenterOpen = !notificationCenterOpen;

  if (notificationCenterOpen) {
    notificationCenter.classList.add('active');
  } else {
    notificationCenter.classList.remove('active');
  }
}

function updateNotificationCount() {
  const countElement = document.getElementById('notificationCount');
  const unreadCount = 5; // From HTML - could be dynamic

  if (countElement) {
    countElement.textContent = unreadCount;
    countElement.style.display = unreadCount > 0 ? 'flex' : 'none';
  }
}

// Enhanced table action buttons with icons
function updateActionButtonsToIcons() {
  // Update all edit buttons
  const editButtons = document.querySelectorAll('#leadsTable .action-btn--edit, .leads-table .action-btn--edit');
  editButtons.forEach(btn => {
    if (!btn.innerHTML.includes('✏️')) {
      btn.innerHTML = '✏️';
      btn.title = 'Редактировать';
    }
  });

  // Update all delete buttons
  const deleteButtons = document.querySelectorAll('#leadsTable .action-btn--delete, .leads-table .action-btn--delete');
  deleteButtons.forEach(btn => {
    if (!btn.innerHTML.includes('🗑️')) {
      btn.innerHTML = '🗑️';
      btn.title = 'Удалить';
    }
  });
}

// Lead form submission handler
document.addEventListener('DOMContentLoaded', () => {
  // Lead form submission
  const leadForm = document.getElementById('leadForm');
  if (leadForm) {
    leadForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const leadData = {
        id: currentEditingLead ? currentEditingLead.id : 'lead_' + Date.now(),
        name: document.getElementById('leadName').value,
        contact_person: document.getElementById('leadContact').value,
        email: document.getElementById('leadEmail').value,
        phone: document.getElementById('leadPhone').value,
        source: document.getElementById('leadSource').value,
        stage: document.getElementById('leadStage').value,
        potential_value: parseInt(document.getElementById('leadValue').value) || 0,
        probability: parseInt(document.getElementById('leadProbability').value) || 20,
        manager: document.getElementById('leadManager').value,
        notes: document.getElementById('leadNotes').value,
        created_date: currentEditingLead ? currentEditingLead.created_date : new Date().toISOString().split('T')[0],
        last_contact: new Date().toISOString().split('T')[0]
      };

      if (currentEditingLead) {
        const index = leadsData.findIndex(l => l.id === currentEditingLead.id);
        if (index !== -1) {
          leadsData[index] = leadData;
        }
        showToast('Лид успешно обновлен', 'success');
      } else {
        leadsData.push(leadData);
        showToast('Лид успешно добавлен', 'success');
      }

      renderLeadsTable();
      renderSalesFunnel();
      // Update action buttons and fix spacing
      setTimeout(() => {
        updateActionButtonsToIcons();
        fixHeaderSpacing();
      }, 100);
      closeLeadModal();
    });
  }

  // Update action buttons after DOM load
  setTimeout(updateActionButtonsToIcons, 1000);

  // Update existing tables with icon buttons
  setTimeout(() => {
    updateActionButtonsToIcons();
    fixHeaderSpacing();
    removeAddClientButtons();
  }, 2000);

  // Initialize mobile responsiveness
  initMobileResponsive();

  // Apply spacing fixes after all components are loaded
  setTimeout(() => {
    fixHeaderSpacing();
    console.log('✅ Отступы между заголовками и контентом исправлены');
  }, 3000);
});

// Global functions
window.initRevenueTrendsChart = initRevenueTrendsChart;
window.updateRevenueTrendsPeriod = updateRevenueTrendsPeriod;
window.showRevenueMonthDetails = showRevenueMonthDetails;
window.initEmployeeHeatmap = initEmployeeHeatmap;
window.showEmployeeDayDetails = showEmployeeDayDetails;
window.initLeadsTab = initLeadsTab;
window.renderSalesFunnel = renderSalesFunnel;
window.showFunnelStageDetails = showFunnelStageDetails;
window.renderLeadsTable = renderLeadsTable;
window.getLeadStageClass = getLeadStageClass;
window.initLeadFilters = initLeadFilters;
window.applyLeadFilters = applyLeadFilters;
window.openAddLeadModal = openAddLeadModal;
window.editLead = editLead;
window.deleteLead = deleteLead;
window.closeLeadModal = closeLeadModal;
window.showLeadDetails = showLeadDetails;
window.contactLead = contactLead;
window.moveLeadToNextStage = moveLeadToNextStage;
window.initInsightsTab = initInsightsTab;
window.renderInsightsCarousel = renderInsightsCarousel;
window.getPriorityLabel = getPriorityLabel;
window.initInsightsControls = initInsightsControls;
window.previousInsight = previousInsight;
window.nextInsight = nextInsight;
window.updateInsightsCarousel = updateInsightsCarousel;
window.updateCarouselIndicator = updateCarouselIndicator;
window.executeInsightAction = executeInsightAction;
window.renderAttentionItems = renderAttentionItems;
window.executeAttentionAction = executeAttentionAction;
window.initNotificationCenter = initNotificationCenter;
window.toggleNotificationCenter = toggleNotificationCenter;
window.updateNotificationCount = updateNotificationCount;
window.updateActionButtonsToIcons = updateActionButtonsToIcons;
window.fixHeaderSpacing = fixHeaderSpacing;
window.removeAddClientButtons = removeAddClientButtons;

// Auto-update data every 5 minutes (simulated)
setInterval(() => {
  // Simulate data updates
  updateNotificationCount();
  console.log('Data auto-updated');
}, 300000); // 5 minutes

// Toast notifications for user actions
function showActionToast(action, entity) {
  const messages = {
    'create': `${entity} успешно создан`,
    'update': `${entity} успешно обновлен`,
    'delete': `${entity} успешно удален`,
    'contact': `Контакт с ${entity} установлен`,
    'reminder': `Напоминание отправлено ${entity}`
  };

  showToast(messages[action] || `Действие ${action} выполнено`, 'success');
}

// Enhanced CRUD operations with better feedback
function enhancedCreateEntity(type, data) {
  switch (type) {
    case 'lead':
      leadsData.push(data);
      renderLeadsTable();
      renderSalesFunnel();
      showActionToast('create', 'Лид');
      break;
    case 'employee':
      employeesData.push(data);
      renderEmployeeCards();
      initEmployeeHeatmap();
      showActionToast('create', 'Сотрудник');
      break;
    case 'client':
      clientsData.push(data);
      renderAllClientsTable();
      showActionToast('create', 'Клиент');
      break;
  }

  // Update action buttons
  setTimeout(updateActionButtonsToIcons, 100);
}

// Enhanced delete operations with better UX
function enhancedDeleteEntity(type, id, name) {
  const entityNames = {
    'lead': 'лид',
    'employee': 'сотрудника',
    'client': 'клиента'
  };

  showConfirmModal(
    `Удаление ${entityNames[type]}`,
    `Вы уверены, что хотите удалить ${entityNames[type]} "${name}"? Это действие нельзя отменить.`,
    () => {
      switch (type) {
        case 'lead':
          leadsData = leadsData.filter(l => l.id !== id);
          renderLeadsTable();
          renderSalesFunnel();
          break;
        case 'employee':
          employeesData = employeesData.filter(e => (e.id || e.name) !== id);
          renderEmployeeCards();
          initEmployeeHeatmap();
          break;
        case 'client':
          clientsData = clientsData.filter(c => (c.id || c.name) !== id);
          renderAllClientsTable();
          break;
      }

      showActionToast('delete', entityNames[type]);
      closeConfirmModal();

      // Update action buttons
      setTimeout(updateActionButtonsToIcons, 100);
    }
  );
}


// Drag and drop for leads funnel
function initLeadsDragDrop() {
  // This would be implemented for drag & drop functionality
  console.log('Drag & drop для лидов будет реализован в следующей версии');
}



// Mobile responsive adjustments
function initMobileResponsive() {
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    // Adjust notification center for mobile
    const notificationCenter = document.getElementById('notificationCenter');
    if (notificationCenter) {
      notificationCenter.style.width = 'calc(100vw - 32px)';
      notificationCenter.style.left = '16px';
      notificationCenter.style.right = '16px';
    }

    // Adjust insights carousel for mobile
    const insightCards = document.querySelectorAll('.insight-card');
    insightCards.forEach(card => {
      card.style.flexDirection = 'column';
      card.style.textAlign = 'center';
    });
  }
}

// Initialize mobile responsive on load and resize
window.addEventListener('load', initMobileResponsive);
window.addEventListener('resize', initMobileResponsive);

// Export global functions
window.showActionToast = showActionToast;
window.enhancedCreateEntity = enhancedCreateEntity;
window.enhancedDeleteEntity = enhancedDeleteEntity;
window.initLeadsDragDrop = initLeadsDragDrop;
window.initMobileResponsive = initMobileResponsive;

function removeAddClientButtons() {
    // заглушка, чтобы не было ошибки ReferenceError
}
