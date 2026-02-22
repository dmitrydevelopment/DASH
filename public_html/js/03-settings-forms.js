let settingsTabInitialized = false;
let currentSettingsSubcategory = 'integrations';

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
    const roles = result.data.roles || [];

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

    roles: roles
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
function sendReminder(invoiceId, event) {
  event.stopPropagation();

  const invoice = KANBAN_AWAITING_PAYMENT.find(inv => inv.id === invoiceId);
  if (!invoice) return;

  // Update last reminder date
  invoice.last_reminder = new Date().toISOString().split('T')[0];

  showToast(`Напоминание отправлено клиенту ${invoice.client}`, 'info');
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
  const editButtons = document.querySelectorAll('.action-btn--edit');
  editButtons.forEach(btn => {
    if (!btn.innerHTML.includes('✏️')) {
      btn.innerHTML = '✏️';
      btn.title = 'Редактировать';
    }
  });

  // Update all delete buttons
  const deleteButtons = document.querySelectorAll('.action-btn--delete');
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