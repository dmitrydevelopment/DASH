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

  const term = String(allClientsTableState.searchTerm || '').trim().toLowerCase();
  if (term) {
    items = items.filter(c => String(c.name || '').toLowerCase().includes(term));
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
    <div class="table-header" style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;">
      <h3 style="margin-bottom: var(--header-to-content-spacing);">Общий список клиентов</h3>
      <input id="allClientsSearch" type="text" placeholder="Поиск клиента..." style="max-width:320px;" />
    </div>
  `;

  const table = document.createElement('table');
  table.className = 'data-table';

  table.innerHTML = `
    <thead>
      <tr>
        <th data-sort="name" style="cursor:pointer;">Клиент</th>

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
  const searchInput = document.getElementById('allClientsSearch');

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

  if (searchInput) {
    searchInput.value = allClientsTableState.searchTerm || '';
    searchInput.oninput = () => {
      allClientsTableState.searchTerm = searchInput.value || '';
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


