/*
 * This file is part of is free software.
 */
let clientsSortState = { key: 'name', dir: 'asc' }; // name или amount
let clientsFilterState = { type: 'all', status: 'all' }; // type: all|support|project, status: all|active|inactive
let clientsLoadedOnce = false;

const allClientsTableState = {
  sortKey: 'name',        // 'name' | 'amount'
  sortDir: 'asc',         // 'asc' | 'desc'
  filterType: 'all',      // 'all' | 'support' | 'project'
  filterStatus: 'all',    // 'all' | 'active' | 'inactive'
  groupActiveFirst: true  // по умолчанию активные выше
};

let crmRolesForEmployees = [];
let crmRolesLoadPromise = null;

function getFallbackRoles() {
  return [
    { role_name: 'Аккаунт-менеджер', role_tag: 'account_manager' },
    { role_name: 'Поддержка', role_tag: 'support' },
    { role_name: 'Дизайнер', role_tag: 'designer' }
  ];
}

async function ensureCrmRolesForEmployeesLoaded(forceReload = false) {
  if (!forceReload && crmRolesLoadPromise) {
    return crmRolesLoadPromise;
  }

  crmRolesLoadPromise = (async () => {
    try {
      const resp = await fetch('/api.php/settings', {
        method: 'GET',
        credentials: 'same-origin'
      });

      const result = await resp.json().catch(() => null);

      const roles = result && result.success && result.data && Array.isArray(result.data.roles)
        ? result.data.roles
        : [];

      crmRolesForEmployees = roles
        .map(r => ({
          role_name: String(r.role_name || '').trim(),
          role_tag: String(r.role_tag || '').trim()
        }))
        .filter(r => r.role_name !== '' && r.role_tag !== '');

      if (!crmRolesForEmployees.length) {
        crmRolesForEmployees = getFallbackRoles();
      }

      return crmRolesForEmployees;
    } catch (e) {
      console.error('ensureCrmRolesForEmployeesLoaded error', e);
      crmRolesForEmployees = getFallbackRoles();
      return crmRolesForEmployees;
    }
  })();

  return crmRolesLoadPromise;
}

function populateEmployeeRoleSelect(selectedTag) {
  const roleSelect = document.getElementById('employeeRole');
  if (!roleSelect) return;

  const selected = String(selectedTag || '').trim();

  const roles = (Array.isArray(crmRolesForEmployees) && crmRolesForEmployees.length)
    ? crmRolesForEmployees
    : getFallbackRoles();

  roleSelect.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Выберите роль';
  placeholder.disabled = true;
  placeholder.selected = true;
  roleSelect.appendChild(placeholder);

  let hasSelected = false;

  roles.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.role_tag;
    opt.textContent = r.role_name;
    if (selected && r.role_tag === selected) {
      opt.selected = true;
      placeholder.selected = false;
      hasSelected = true;
    }
    roleSelect.appendChild(opt);
  });

  if (selected && !hasSelected) {
    const opt = document.createElement('option');
    opt.value = selected;
    opt.textContent = 'Неизвестная роль: ' + selected;
    opt.selected = true;
    placeholder.selected = false;
    roleSelect.appendChild(opt);
  }
}

// Revenue Trends Data for Interactive Charts
const revenueTrendsData = [
  { month: '2023-11', month_name: 'Ноя 2023', revenue: 850000, confirmed: 720000, projected: 910000, previous_year: 680000 },
  { month: '2023-12', month_name: 'Дек 2023', revenue: 920000, confirmed: 780000, projected: 980000, previous_year: 720000 },
  { month: '2024-01', month_name: 'Янв 2024', revenue: 780000, confirmed: 680000, projected: 850000, previous_year: 620000 },
  { month: '2024-02', month_name: 'Фев 2024', revenue: 820000, confirmed: 720000, projected: 880000, previous_year: 650000 },
  { month: '2024-03', month_name: 'Мар 2024', revenue: 890000, confirmed: 780000, projected: 950000, previous_year: 700000 },
  { month: '2024-04', month_name: 'Апр 2024', revenue: 910000, confirmed: 800000, projected: 970000, previous_year: 720000 },
  { month: '2024-05', month_name: 'Май 2024', revenue: 950000, confirmed: 850000, projected: 1020000, previous_year: 780000 },
  { month: '2024-06', month_name: 'Июн 2024', revenue: 980000, confirmed: 880000, projected: 1050000, previous_year: 820000 },
  { month: '2024-07', month_name: 'Июл 2024', revenue: 1020000, confirmed: 920000, projected: 1080000, previous_year: 850000 },
  { month: '2024-08', month_name: 'Авг 2024', revenue: 1050000, confirmed: 950000, projected: 1120000, previous_year: 880000 },
  { month: '2024-09', month_name: 'Сен 2024', revenue: 1080000, confirmed: 980000, projected: 1150000, previous_year: 920000 },
  { month: '2024-10', month_name: 'Окт 2024', revenue: 1120000, confirmed: 955650, projected: 1200000, previous_year: 950000 }
];


// Leads System Data
const leadsSystemData = {
  leads: [
    {
      id: 'lead_001',
      name: 'TechStart Solutions',
      contact_person: 'Игорь Миронов',
      email: 'i.mironov@techstart.ru',
      phone: '+7 (499) 123-45-67',
      source: 'Сайт',
      stage: 'Новый лид',
      potential_value: 150000,
      probability: 20,
      created_date: '2024-10-10',
      last_contact: '2024-10-12',
      notes: 'Интересуются разработкой корпоративного сайта',
      manager: 'Лена'
    },
    {
      id: 'lead_002',
      name: 'Beauty Salon Luxe',
      contact_person: 'Анна Красавина',
      email: 'info@beautyluxe.com',
      phone: '+7 (495) 234-56-78',
      source: 'Реклама',
      stage: 'Квалификация',
      potential_value: 85000,
      probability: 40,
      created_date: '2024-10-08',
      last_contact: '2024-10-13',
      notes: 'Нужен сайт + SEO продвижение',
      manager: 'Тоня'
    },
    {
      id: 'lead_003',
      name: 'Fitness Club Energy',
      contact_person: 'Михаил Спортсмен',
      email: 'm.sport@energy-fit.ru',
      phone: '+7 (499) 345-67-89',
      source: 'Рекомендация',
      stage: 'Переговоры',
      potential_value: 220000,
      probability: 70,
      created_date: '2024-09-25',
      last_contact: '2024-10-11',
      notes: 'Комплексное решение: сайт, приложение, CRM',
      manager: 'Костя'
    },
    {
      id: 'lead_004',
      name: 'Restaurant Chain Vkusno',
      contact_person: 'Елена Шефпова',
      email: 'e.chef@vkusno-chain.ru',
      phone: '+7 (495) 456-78-90',
      source: 'Холодный звонок',
      stage: 'Предложение',
      potential_value: 180000,
      probability: 60,
      created_date: '2024-09-30',
      last_contact: '2024-10-09',
      notes: 'Сеть из 5 ресторанов, единая система заказов',
      manager: 'Лиза'
    },
    {
      id: 'lead_005',
      name: 'Medical Center Plus',
      contact_person: 'Доктор Иванов',
      email: 'ivanov@medplus.com',
      phone: '+7 (495) 567-89-01',
      source: 'Партнеры',
      stage: 'Закрытие',
      potential_value: 95000,
      probability: 90,
      created_date: '2024-09-15',
      last_contact: '2024-10-13',
      notes: 'Готовы подписать договор, ждут финальное предложение',
      manager: 'Лена'
    }
  ],
  sales_funnel: {
    stages: [
      { name: 'Новый лид', count: 3, total_value: 425000, conversion_rate: 45, avg_time_days: 7 },
      { name: 'Квалификация', count: 5, total_value: 780000, conversion_rate: 65, avg_time_days: 14 },
      { name: 'Переговоры', count: 4, total_value: 680000, conversion_rate: 75, avg_time_days: 21 },
      { name: 'Предложение', count: 2, total_value: 275000, conversion_rate: 80, avg_time_days: 10 },
      { name: 'Закрытие', count: 1, total_value: 95000, conversion_rate: 85, avg_time_days: 5 }
    ],
    metrics: {
      total_pipeline: 2255000,
      weighted_pipeline: 1495000,
      avg_deal_size: 150000,
      conversion_rate_overall: 23,
      avg_sales_cycle: 57
    }
  }
};

// Insights Data
const insightsData = [
  {
    id: 'insight_001',
    type: 'financial',
    priority: 'critical',
    icon: '💰',
    title: 'Критическая просрочка платежа',
    description: 'New White Smile не оплачивает 42,000 руб. уже 45 дней. Риск 65%',
    action: 'Отправить напоминание',
    action_link: '/finances/receivables',
    timestamp: '5 мин. назад'
  },
  {
    id: 'insight_002',
    type: 'revenue',
    priority: 'growth',
    icon: '📈',
    title: 'Выручка растет быстрее плана',
    description: '955,650 руб. за октябрь (+22.5% к прошлому месяцу, +18% к плану)',
    action: null,
    timestamp: '15 мин. назад'
  },
  {
    id: 'insight_003',
    type: 'project',
    priority: 'action',
    icon: '⏰',
    title: 'Проект готов к счету',
    description: 'ORDO выполнен на 80%. Рекомендуется промежуточный счет',
    action: 'Выставить счет',
    action_link: '/projects/ordo',
    timestamp: '1 час назад'
  },
  {
    id: 'insight_004',
    type: 'lead',
    priority: 'urgent',
    icon: '🎯',
    title: 'Горячие лиды',
    description: 'Medical Center Plus готов подписать договор на 95,000 руб. (90%)',
    action: 'Связаться',
    action_link: '/leads/medical-center-plus',
    timestamp: '2 часа назад'
  },
  {
    id: 'insight_005',
    type: 'team',
    priority: 'team',
    icon: '⚡',
    title: 'Дисбаланс нагрузки',
    description: 'Лена перегружена (3 проекта), Костя недогружен (1 проект)',
    action: 'Перераспределить',
    action_link: '/employees',
    timestamp: '3 часа назад'
  },
  {
    id: 'insight_006',
    type: 'nps',
    priority: 'success',
    icon: '📊',
    title: 'NPS растет',
    description: 'Net Promoter Score: -15 → 18 за 10 месяцев (+233%)',
    action: null,
    timestamp: '4 часа назад'
  }
];

// Attention Required Items
const attentionItems = [
  {
    priority: 'critical',
    category: 'payment',
    icon: '💥',
    title: 'Критическая просрочка',
    description: '2 счета просрочены более 30 дней',
    action: 'Связаться с клиентами',
    deadline: '2024-10-14'
  },
  {
    priority: 'high',
    category: 'project',
    icon: '⚠️',
    title: 'Проекты близко к дедлайну',
    description: '3 проекта завершаются в течение 2 недель',
    action: 'Проверить готовность',
    deadline: '2024-10-15'
  },
  {
    priority: 'medium',
    category: 'lead',
    icon: '💡',
    title: 'Горячие лиды',
    description: '2 готовы к закрытию',
    action: 'Связаться с лидами',
    deadline: '2024-10-16'
  },
  {
    priority: 'medium',
    category: 'team',
    icon: '⚡',
    title: 'Дисбаланс нагрузки',
    description: 'Перераспределить задачи команды',
    action: 'Оптимизировать распределение',
    deadline: '2024-10-17'
  }
];

// Application Data with Updated Employee Task Completion Colors
const appData = {
  revenue: [
    { name: "Erwin кофе", amount: 48500, period: "Октябрь", status: "В работе", category: "Разработка" },
    { name: "Erwin Море", amount: 68500, period: "Октябрь", status: "В работе", category: "Разработка" },
    { name: "ORDO", amount: 167250, period: "Октябрь", status: "В работе", category: "Разработка" },
    { name: "Global Catering", amount: 14500, period: "Октябрь", status: "Выставить счет", category: "Разработка" },
    { name: "Культура Встречи", amount: 19500, period: "Октябрь", status: "Выставить счет", category: "Разработка" },
    { name: "New White Smile", amount: 42000, period: "Октябрь", status: "Выставить счет", category: "Разработка" },
    { name: "Онкологика | Бот", amount: 7000, period: "Октябрь", status: "Конец месяца", category: "Боты" },
    { name: "Онкологика | Поддержка", amount: 12000, period: "Октябрь", status: "Конец месяца", category: "Поддержка" },
    { name: "Turbo Tattoo", amount: 14500, period: "Октябрь", status: "Конец месяца", category: "Поддержка" },
    { name: "Japcake", amount: 19500, period: "Октябрь", status: "Конец месяца", category: "Поддержка" },
    { name: "Meatfix + Рыбалтика", amount: 22000, period: "Октябрь", status: "Конец месяца", category: "Поддержка" },
    { name: "SQ Clinic SEO", amount: 24000, period: "Октябрь", status: "Конец месяца", category: "SEO" },
    { name: "GSK", amount: 25000, period: "Октябрь", status: "Конец месяца", category: "Разработка" },
    { name: "SQ Clinic", amount: 28500, period: "Октябрь", status: "Конец месяца", category: "Разработка" },
    { name: "НЕТЛЕТ | SEO", amount: 32000, period: "Октябрь", status: "Конец месяца", category: "SEO" },
    { name: "Онкологика | SEO", amount: 35000, period: "Октябрь", status: "Конец месяца", category: "SEO" },
    { name: "SVOY", amount: 4500, period: "Октябрь", status: "Ожидание оплаты", category: "Разработка" },
    { name: "Atlantica", amount: 5800, period: "Октябрь", status: "Ожидание оплаты", category: "Разработка" },
    { name: "Parisiene", amount: 6000, period: "Октябрь", status: "Ожидание оплаты", category: "Разработка" },
    { name: "Frankie x2", amount: 6800, period: "Октябрь", status: "Ожидание оплаты", category: "Разработка" },
    { name: "Granat Hall", amount: 8000, period: "Октябрь", status: "Ожидание оплаты", category: "Разработка" },
    { name: "FullMoon", amount: 13000, period: "Октябрь", status: "Ожидание оплаты", category: "Разработка" },
    { name: "Atlantica Bistro + Smartomato", amount: 13300, period: "Октябрь", status: "Ожидание оплаты", category: "Разработка" },
    { name: "Домком", amount: 14500, period: "Октябрь", status: "Ожидание оплаты", category: "Разработка" },
    { name: "Metafoodies", amount: 15000, period: "Октябрь", status: "Ожидание оплаты", category: "Разработка" },
    { name: "Nagoya", amount: 16500, period: "Октябрь", status: "Ожидание оплаты", category: "Разработка" },
    { name: "Cazaban", amount: 19500, period: "Октябрь", status: "Ожидание оплаты", category: "Разработка" },
    { name: "Ferma x2", amount: 25000, period: "Октябрь", status: "Ожидание оплаты", category: "Разработка" },
    { name: "Gaia", amount: 28500, period: "Октябрь", status: "Ожидание оплаты", category: "Разработка" },
    { name: "Брусника", amount: 42500, period: "Октябрь", status: "Ожидание оплаты", category: "Разработка" },
    { name: "IZUMI x3", amount: 43500, period: "Октябрь", status: "Ожидание оплаты", category: "Разработка" },
    { name: "Gagawa", amount: 49500, period: "Октябрь", status: "Ожидание оплаты", category: "Разработка" },
    { name: "НЕТЛЕТ | SEO x2", amount: 64000, period: "Октябрь", status: "Ожидание оплаты", category: "SEO" }
  ],
  support: [
    { name: "Frankie", monthly: 3400, remaining_months: 2, total_remaining: 6800, status: "Ожидание оплаты" },
    { name: "SHIMA Новая Рига", monthly: 4400, remaining_months: 2, total_remaining: 8800, status: "Ожидание оплаты" },
    { name: "ТЦ на Волгоградке", monthly: 4500, remaining_months: 2, total_remaining: 9000, status: "Ожидание оплаты" },
    { name: "SVOY", monthly: 4500, remaining_months: 2, total_remaining: 9000, status: "Ожидание оплаты" },
    { name: "12 Grand Cafe", monthly: 4900, remaining_months: 2, total_remaining: 9800, status: "Ожидание оплаты" },
    { name: "Trolly", monthly: 5000, remaining_months: 2, total_remaining: 10000, status: "Ожидание оплаты" },
    { name: "Кубдари", monthly: 5400, remaining_months: 2, total_remaining: 10800, status: "Ожидание оплаты" },
    { name: "Пошаблим", monthly: 5400, remaining_months: 2, total_remaining: 10800, status: "Ожидание оплаты" },
    { name: "Pepe Nero", monthly: 5500, remaining_months: 2, total_remaining: 11000, status: "Ожидание оплаты" },
    { name: "ROMO", monthly: 5500, remaining_months: 2, total_remaining: 11000, status: "Ожидание оплаты" },
    { name: "FullMoon", monthly: 13000, remaining_months: 9, total_remaining: 117000, status: "Ожидание оплаты" },
    { name: "Global Catering", monthly: 14500, remaining_months: 10, total_remaining: 145000, status: "Ожидание оплаты" },
    { name: "Turbo Tattoo", monthly: 14500, remaining_months: 6, total_remaining: 87000, status: "Конец месяца" },
    { name: "Nagoya", monthly: 16500, remaining_months: 11, total_remaining: 181500, status: "Ожидание оплаты" },
    { name: "Japcake", monthly: 19500, remaining_months: 6, total_remaining: 117000, status: "Конец месяца" },
    { name: "Культура Встречи", monthly: 19500, remaining_months: 12, total_remaining: 234000, status: "Ожидание оплаты" },
    { name: "Cazaban", monthly: 19500, remaining_months: 10, total_remaining: 195000, status: "Ожидание оплаты" },
    { name: "Gaia", monthly: 28500, remaining_months: 11, total_remaining: 313500, status: "Ожидание оплаты" },
    { name: "НЕТЛЕТ | SEO", monthly: 32000, remaining_months: 2, total_remaining: 64000, status: "Конец месяца" },
    { name: "New White Smile", monthly: 42000, remaining_months: 2, total_remaining: 84000, status: "Ожидание оплаты" },
    { name: "Брусника", monthly: 42500, remaining_months: 2, total_remaining: 85000, status: "Ожидание оплаты" },
    { name: "Gagawa", monthly: 49500, remaining_months: 2, total_remaining: 99000, status: "Ожидание оплаты" }
  ],
  receivables: {
    aging_buckets: {
      '0-30': { amount: 156000, count: 8, percentage: 49.1 },
      '31-60': { amount: 89000, count: 5, percentage: 28.0 },
      '61-90': { amount: 45000, count: 3, percentage: 14.2 },
      '90+': { amount: 28000, count: 2, percentage: 8.8 }
    },
    total_receivables: 318000,
    total_overdue: 42500,
    overdue_count: 3,
    average_collection_time: 28,
    collection_efficiency: 76.5,
    top_debtors: [
      { client: 'ORDO', amount: 167250, days_overdue: 15, status: 'В работе', priority: 'Высокий' },
      { client: 'New White Smile', amount: 42000, days_overdue: 45, status: 'Выставить счет', priority: 'Критический' },
      { client: 'НЕТЛЕТ | SEO', amount: 32000, days_overdue: 3, status: 'Конец месяца', priority: 'Низкий' },
      { client: 'SQ Clinic', amount: 28500, days_overdue: 12, status: 'Конец месяца', priority: 'Средний' },
      { client: 'GSK', amount: 25000, days_overdue: 7, status: 'Конец месяца', priority: 'Низкий' }
    ],
    invoice_timeline: [
      { client: 'Erwin кофе', amount: 48500, status: 'В работе', days_in_status: 12, days_to_due: 18, invoice_date: '2024-09-25', due_date: '2024-10-31', overdue: false },
      { client: 'Global Catering', amount: 14500, status: 'Выставить счет', days_in_status: 5, days_to_due: 10, invoice_date: '2024-10-03', due_date: '2024-10-23', overdue: false },
      { client: 'Культура Встречи', amount: 19500, status: 'Выставить счет', days_in_status: 8, days_to_due: 7, invoice_date: '2024-10-01', due_date: '2024-10-20', overdue: false },
      { client: 'Онкологика | Бот', amount: 7000, status: 'Конец месяца', days_in_status: 15, days_to_due: 3, invoice_date: '2024-09-28', due_date: '2024-10-16', overdue: false },
      { client: 'Turbo Tattoo', amount: 14500, status: 'Конец месяца', days_in_status: 20, days_to_due: -2, invoice_date: '2024-09-21', due_date: '2024-10-11', overdue: true },
      { client: 'SQ Clinic SEO', amount: 24000, status: 'Конец месяца', days_in_status: 18, days_to_due: 1, invoice_date: '2024-09-25', due_date: '2024-10-14', overdue: false }
    ]
  },
  payment_history: {
    '2024-10': {
      payments: [
        { client: 'New White Smile', amount: 27378, date: '2024-10-07', description: 'Разработка портала' },
        { client: 'ORDO', amount: 142612, date: '2024-10-10', description: 'SEO продвижение' },
        { client: 'Erwin', amount: 71968, date: '2024-10-13', description: 'Разработка сайта' },
        { client: 'Frankie', amount: 15240, date: '2024-10-15', description: 'Поддержка сайта' },
        { client: 'Global Catering', amount: 43870, date: '2024-10-18', description: 'Разработка сайта' },
        { client: 'Nagoya', amount: 98750, date: '2024-10-20', description: 'Поддержка сайта' },
        { client: 'Gaia', amount: 125000, date: '2024-10-22', description: 'SEO продвижение' },
        { client: 'SQ Clinic', amount: 32400, date: '2024-10-25', description: 'Техподдержка' },
        { client: 'Japcake', amount: 67890, date: '2024-10-27', description: 'Разработка сайта' }
      ],
      total: 624128,
      count: 9
    },
    '2024-09': {
      payments: [
        { client: 'НЕТЛЕТ SEO', amount: 32000, date: '2024-09-05', description: 'SEO продвижение' },
        { client: 'Онкологика', amount: 35000, date: '2024-09-10', description: 'SEO + Поддержка' },
        { client: 'New White Smile', amount: 42000, date: '2024-09-15', description: 'Разработка сайта' },
        { client: 'Брусника', amount: 42500, date: '2024-09-18', description: 'Поддержка сайта' },
        { client: 'IZUMI x3', amount: 43500, date: '2024-09-22', description: 'Разработка сайта' },
        { client: 'Gagawa', amount: 49500, date: '2024-09-25', description: 'Поддержка сайта' },
        { client: 'НЕТЛЕТ SEO x2', amount: 64000, date: '2024-09-28', description: 'SEO продвижение' },
        { client: 'Frankie Catering', amount: 168500, date: '2024-09-30', description: 'Разработка портала' }
      ],
      total: 477000,
      count: 8
    },
    '2024-08': {
      payments: [
        { client: 'ОРDO', amount: 145000, date: '2024-08-05', description: 'SEO продвижение' },
        { client: 'Erwin', amount: 68500, date: '2024-08-10', description: 'Разработка сайта' },
        { client: 'Global Catering', amount: 42000, date: '2024-08-15', description: 'Поддержка сайта' }
      ],
      total: 255500,
      count: 3
    },
    '2024-07': {
      payments: [
        { client: 'New White Smile', amount: 127340, date: '2024-07-02', description: 'Разработка портала' },
        { client: 'SQ Clinic', amount: 85600, date: '2024-07-12', description: 'Разработка сайта' }
      ],
      total: 212940,
      count: 2
    },
    '2023-12': {
      payments: [
        { client: 'Frankie', amount: 45000, date: '2023-12-15', description: 'Поддержка сайта' },
        { client: 'ORDO', amount: 125000, date: '2023-12-20', description: 'SEO продвижение' }
      ],
      total: 170000,
      count: 2
    },
    '2022-11': {
      payments: [
        { client: 'Global Catering', amount: 85000, date: '2022-11-10', description: 'Разработка сайта' }
      ],
      total: 85000,
      count: 1
    }
  },
  employees: [
    {
      name: "Тоня",
      monday: "Рабочий",
      tuesday: "Рабочий",
      wednesday: "Рабочий",
      thursday: "Рабочий",
      friday: "Рабочий",
      saturday: "Выходной",
      sunday: "Выходной",
      start_date: "2023-01-15",
      role: "Дизайнер",
      current_salary: 33000,
      weekly_hours: 40,
      hourly_rate: 190.53,
      task_completion_rate: 81,
      task_completion_color: "#F59E0B",
      salary_history: [
        { date: "2023-01-15", amount: 25000, reason: "Начальная зарплата" },
        { date: "2023-07-01", amount: 30000, reason: "Повышение за полгода" },
        { date: "2024-01-01", amount: 33000, reason: "Годовая индексация" }
      ],
      salary_forecast: [
        { date: "2025-01-01", amount: 35640, reason: "Индексация на инфляцию (8%)" },
        { date: "2026-01-01", amount: 38491, reason: "Индексация на инфляцию (8%)" }
      ]
    },
    {
      name: "Лена",
      monday: "Рабочий",
      tuesday: "Рабочий",
      wednesday: "Рабочий",
      thursday: "Рабочий",
      friday: "Выходной",
      saturday: "Выходной",
      sunday: "Рабочий",
      start_date: "2022-06-10",
      role: "Разработчик",
      current_salary: 47500,
      weekly_hours: 40,
      hourly_rate: 274.25,
      task_completion_rate: 80,
      task_completion_color: "#F59E0B",
      salary_history: [
        { date: "2022-06-10", amount: 35000, reason: "Начальная зарплата" },
        { date: "2022-12-01", amount: 40000, reason: "Повышение за полгода" },
        { date: "2023-06-01", amount: 45000, reason: "Годовая индексация" },
        { date: "2024-02-01", amount: 47500, reason: "Повышение квалификации" }
      ],
      salary_forecast: [
        { date: "2025-01-01", amount: 51300, reason: "Индексация на инфляцию (8%)" },
        { date: "2026-01-01", amount: 55404, reason: "Индексация на инфляцию (8%)" }
      ]
    },
    {
      name: "Лиза",
      monday: "Рабочий",
      tuesday: "Рабочий",
      wednesday: "Рабочий",
      thursday: "Выходной",
      friday: "Рабочий",
      saturday: "Рабочий",
      sunday: "Выходной",
      start_date: "2023-03-20",
      role: "SEO-специалист",
      current_salary: 12000,
      weekly_hours: 40,
      hourly_rate: 69.28,
      task_completion_rate: 70,
      task_completion_color: "red",
      salary_history: [
        { date: "2023-03-20", amount: 8000, reason: "Начальная зарплата" },
        { date: "2023-07-15", amount: 10000, reason: "Повышение за результаты" },
        { date: "2024-01-01", amount: 12000, reason: "Годовая индексация" }
      ],
      salary_forecast: [
        { date: "2025-01-01", amount: 12960, reason: "Индексация на инфляцию (8%)" },
        { date: "2026-01-01", amount: 14000, reason: "Индексация на инфляцию (8%)" }
      ]
    },
    {
      name: "Костя",
      monday: "Рабочий",
      tuesday: "Рабочий",
      wednesday: "Рабочий",
      thursday: "Рабочий",
      friday: "Рабочий",
      saturday: "Выходной",
      sunday: "Выходной",
      start_date: "2022-09-15",
      role: "Backend-разработчик",
      current_salary: 40000,
      weekly_hours: 40,
      hourly_rate: 230.95,
      task_completion_rate: 87,
      task_completion_color: "#F59E0B",
      salary_history: [
        { date: "2022-09-15", amount: 30000, reason: "Начальная зарплата" },
        { date: "2023-03-01", amount: 35000, reason: "Повышение за полгода" },
        { date: "2023-09-01", amount: 38000, reason: "Годовая индексация" },
        { date: "2024-03-01", amount: 40000, reason: "Повышение квалификации" }
      ],
      salary_forecast: [
        { date: "2025-01-01", amount: 43200, reason: "Индексация на инфляцию (8%)" },
        { date: "2026-01-01", amount: 46656, reason: "Индексация на инфляцию (8%)" }
      ]
    }
  ],
  expenses: [
    { name: "Телефон", amount: 1000, category: "Дом" },
    { name: "Интернет", amount: 650, category: "Дом" },
    { name: "Электричество", amount: 1200, category: "Дом" },
    { name: "ЖКХ", amount: 9500, category: "Дом" },
    { name: "Каратэ", amount: 9000, category: "Досуг" },
    { name: "Продукты", amount: 80000, category: "Дом" },
    { name: "Ремонт", amount: 10500, category: "Кредит" },
    { name: "Квартира", amount: 114000, category: "Кредит" },
    { name: "Бензин", amount: 8000, category: "Машина" },
    { name: "Monitorus", amount: 1500, category: "Работа" },
    { name: "Perplexity", amount: 2000, category: "Работа" },
    { name: "Adobe", amount: 2000, category: "Работа" },
    { name: "Банк", amount: 7000, category: "Работа" },
    { name: "Зарплата Лизе", amount: 12000, category: "Работа" },
    { name: "Зарплата Лене", amount: 47500, category: "Работа" },
    { name: "Зарплата Тоне", amount: 33000, category: "Работа" },
    { name: "Зарплата Сашеньке", amount: 40000, category: "Работа" }
  ],
  nps_data: [
    { client: "Frankie", score: 8, category: "Passive", survey_date: "2024-09-15", comment: "Комментарий от клиента Frankie" },
    { client: "SHIMA Новая Рига", score: 9, category: "Promoter", survey_date: "2024-10-02", comment: "Комментарий от клиента SHIMA Новая Рига" },
    { client: "Global Catering", score: 6, category: "Detractor", survey_date: "2024-09-28", comment: "Комментарий от клиента Global Catering" },
    { client: "Nagoya", score: 9, category: "Promoter", survey_date: "2024-10-01", comment: "Комментарий от клиента Nagoya" },
    { client: "Gaia", score: 10, category: "Promoter", survey_date: "2024-09-20", comment: "Комментарий от клиента Gaia" },
    { client: "НЕТЛЕТ", score: 4, category: "Detractor", survey_date: "2024-09-12", comment: "Комментарий от клиента НЕТЛЕТ" },
    { client: "SQ Clinic", score: 7, category: "Passive", survey_date: "2024-10-05", comment: "Комментарий от клиента SQ Clinic" },
    { client: "Erwin", score: 9, category: "Promoter", survey_date: "2024-09-30", comment: "Комментарий от клиента Erwin" },
    { client: "ORDO", score: 8, category: "Passive", survey_date: "2024-10-03", comment: "Комментарий от клиента ORDO" },
    { client: "Japcake", score: 10, category: "Promoter", survey_date: "2024-09-25", comment: "Комментарий от клиента Japcake" },
    { client: "Cazaban", score: 5, category: "Detractor", survey_date: "2024-09-18", comment: "Комментарий от клиента Cazaban" },
    { client: "FullMoon", score: 9, category: "Promoter", survey_date: "2024-10-08", comment: "Комментарий от клиента FullMoon" },
    { client: "Turbo Tattoo", score: 7, category: "Passive", survey_date: "2024-09-22", comment: "Комментарий от клиента Turbo Tattoo" },
    { client: "New White Smile", score: 8, category: "Passive", survey_date: "2024-10-06", comment: "Комментарий от клиента New White Smile" },
    { client: "Брусника", score: 6, category: "Detractor", survey_date: "2024-09-14", comment: "Комментарий от клиента Брусника" },
    { client: "Gagawa", score: 10, category: "Promoter", survey_date: "2024-10-07", comment: "Комментарий от клиента Gagawa" },
    { client: "Онкологика", score: 9, category: "Promoter", survey_date: "2024-09-16", comment: "Комментарий от клиента Онкологика" },
    { client: "Культура Встречи", score: 8, category: "Passive", survey_date: "2024-10-04", comment: "Комментарий от клиента Культура Встречи" },
    { client: "GSK", score: 7, category: "Passive", survey_date: "2024-09-11", comment: "Комментарий от клиента GSK" },
    { client: "Meatfix", score: 4, category: "Detractor", survey_date: "2024-09-26", comment: "Комментарий от клиента Meatfix" }
  ],
  nps_summary: {
    score: 18,
    total_responses: 16,
    promoters: 7,
    detractors: 4,
    passives: 5
  },
  nps_monthly: [
    {
      month: '2024-01',
      month_name: 'Янв',
      nps_score: -15,
      total_responses: 25,
      promoters: 5,
      passives: 8,
      detractors: 12,
      promoters_pct: 20,
      passives_pct: 32,
      detractors_pct: 48
    },
    {
      month: '2024-02',
      month_name: 'Фев',
      nps_score: -8,
      total_responses: 28,
      promoters: 8,
      passives: 10,
      detractors: 10,
      promoters_pct: 29,
      passives_pct: 36,
      detractors_pct: 36
    },
    {
      month: '2024-03',
      month_name: 'Мар',
      nps_score: -2,
      total_responses: 30,
      promoters: 10,
      passives: 8,
      detractors: 12,
      promoters_pct: 33,
      passives_pct: 27,
      detractors_pct: 40
    },
    {
      month: '2024-04',
      month_name: 'Апр',
      nps_score: 5,
      total_responses: 32,
      promoters: 12,
      passives: 12,
      detractors: 8,
      promoters_pct: 38,
      passives_pct: 38,
      detractors_pct: 25
    },
    {
      month: '2024-05',
      month_name: 'Май',
      nps_score: 12,
      total_responses: 25,
      promoters: 10,
      passives: 8,
      detractors: 7,
      promoters_pct: 40,
      passives_pct: 32,
      detractors_pct: 28
    },
    {
      month: '2024-06',
      month_name: 'Июн',
      nps_score: 18,
      total_responses: 27,
      promoters: 12,
      passives: 9,
      detractors: 6,
      promoters_pct: 44,
      passives_pct: 33,
      detractors_pct: 22
    },
    {
      month: '2024-07',
      month_name: 'Июл',
      nps_score: 25,
      total_responses: 20,
      promoters: 9,
      passives: 6,
      detractors: 5,
      promoters_pct: 45,
      passives_pct: 30,
      detractors_pct: 25
    },
    {
      month: '2024-08',
      month_name: 'Авг',
      nps_score: 22,
      total_responses: 26,
      promoters: 11,
      passives: 9,
      detractors: 6,
      promoters_pct: 42,
      passives_pct: 35,
      detractors_pct: 23
    },
    {
      month: '2024-09',
      month_name: 'Сен',
      nps_score: 22,
      total_responses: 23,
      promoters: 10,
      passives: 8,
      detractors: 5,
      promoters_pct: 43,
      passives_pct: 35,
      detractors_pct: 22
    },
    {
      month: '2024-10',
      month_name: 'Окт',
      nps_score: 18,
      total_responses: 16,
      promoters: 7,
      passives: 5,
      detractors: 4,
      promoters_pct: 44,
      passives_pct: 31,
      detractors_pct: 25
    }
  ]
};

// Global Variables
let currentTab = 'status';
let currentClientSubcategory = 'overview';
let currentFinanceSubcategory = 'overview';
let currentPeriod = 'current-month';
let currentHistoryYear = 2024;
let currentHistoryMonth = 10;
let currentHistoryPeriod = 'monthly';
let customStartDate = null;
let customEndDate = null;
let charts = {};
let filteredData = {
  revenue: [...appData.revenue],
  clients: [...appData.support]
};
let currentInsightIndex = 0;
let notificationCenterOpen = false;
let leadsData = [];
let currentEditingLead = null;

// Updated LTV metrics data
const ltvMetrics = {
  total_ltv: 1737600,
  average_ltv: 124114,
  average_duration: 5.4
};

// Current invoices data for receivables section
const CURRENT_INVOICES_DATA = [
  {
    id: "INV-2024-001",
    client: "Erwin кофе",
    amount: 48500,
    status: "В работе",
    invoice_date: "2024-09-25",
    due_date: "2024-10-31",
    days_remaining: 18,
    manager: "Лена",
    overdue: false
  },
  {
    id: "INV-2024-002",
    client: "Global Catering",
    amount: 14500,
    status: "Выставить счет",
    invoice_date: "2024-10-03",
    due_date: "2024-10-23",
    days_remaining: 10,
    manager: "Лиза",
    overdue: false
  },
  {
    id: "INV-2024-003",
    client: "New White Smile",
    amount: 42000,
    status: "Выставить счет",
    invoice_date: "2024-09-30",
    due_date: "2024-10-30",
    days_remaining: 17,
    manager: "Лена",
    overdue: false
  },
  {
    id: "INV-2024-004",
    client: "Turbo Tattoo",
    amount: 14500,
    status: "Конец месяца",
    invoice_date: "2024-09-21",
    due_date: "2024-10-11",
    days_remaining: -2,
    manager: "Лиза",
    overdue: true
  },
  {
    id: "INV-2024-005",
    client: "SVOY",
    amount: 4500,
    status: "Ожидание оплаты",
    invoice_date: "2024-09-28",
    due_date: "2024-10-28",
    days_remaining: 15,
    manager: "Тоня",
    overdue: false
  },
  {
    id: "INV-2024-006",
    client: "Atlantica",
    amount: 5800,
    status: "Ожидание оплаты",
    invoice_date: "2024-09-25",
    due_date: "2024-10-25",
    days_remaining: 12,
    manager: "Лена",
    overdue: false
  },
  {
    id: "INV-2024-007",
    client: "Gagawa",
    amount: 49500,
    status: "Ожидание оплаты",
    invoice_date: "2024-09-15",
    due_date: "2024-10-15",
    days_remaining: -2,
    manager: "Лиза",
    overdue: true
  }
];

// Данные для нового раздела задолженности согласно скриншоту
const RECEIVABLES_STRUCTURE_DATA = {
  summary_metrics: {
    total_debt: 318000,
    invoice_count: 18,
    overdue_90_plus: 28000,
    avg_payment_time: 45
  },
  aging_buckets: {
    "0_30_days": {
      amount: 156000,
      count: 8,
      percentage: 49.1,
      color: "#22C55E",
      status: "Нормально"
    },
    "31_60_days": {
      amount: 89000,
      count: 5,
      percentage: 28.0,
      color: "#F59E0B",
      status: "Внимание"
    },
    "61_90_days": {
      amount: 45000,
      count: 3,
      percentage: 14.2,
      color: "#EF4444",
      status: "Критично"
    },
    "90_plus_days": {
      amount: 28000,
      count: 2,
      percentage: 8.8,
      color: "#DC2626",
      status: "Критично"
    }
  },
  top_debtors: [
    {
      client: "ORDO",
      amount: 167250,
      days_overdue: 15,
      status: "В работе",
      status_color: "orange",
      priority: "high"
    },
    {
      client: "New White Smile",
      amount: 42000,
      days_overdue: 45,
      status: "Выставить счет",
      status_color: "red",
      priority: "critical"
    },
    {
      client: "НЕТЛЕТ | SEO",
      amount: 32000,
      days_overdue: 3,
      status: "Конец месяца",
      status_color: "yellow",
      priority: "low"
    },
    {
      client: "SQ Clinic",
      amount: 28500,
      days_overdue: 12,
      status: "Конец месяца",
      status_color: "yellow",
      priority: "medium"
    },
    {
      client: "GSK",
      amount: 25000,
      days_overdue: 7,
      status: "Конец месяца",
      status_color: "yellow",
      priority: "low"
    },
    {
      client: "Global Catering",
      amount: 14500,
      days_overdue: 2,
      status: "Выставить счет",
      status_color: "orange",
      priority: "low"
    }
  ]
};

// Новые данные для задолженности (отдельная вкладка)
const NEW_RECEIVABLES_DATA = {
  overview: {
    total_amount: 318000,
    overdue_amount: 89500,
    current_month: 228500,
    collection_rate: 76.5,
    average_days: 28
  },
  aging_analysis: {
    "0_30_days": {
      amount: 156000,
      count: 8,
      percentage: 49.1
    },
    "31_60_days": {
      amount: 89000,
      count: 5,
      percentage: 28.0
    },
    "61_90_days": {
      amount: 45000,
      count: 3,
      percentage: 14.2
    },
    "over_90_days": {
      amount: 28000,
      count: 2,
      percentage: 8.8
    }
  },
  critical_accounts: [
    { client: "New White Smile", amount: 42000, days_overdue: 45, risk_level: "Высокий", last_contact: "2024-09-28", action_required: "Срочный звонок" },
    { client: "ORDO Systems", amount: 167250, days_overdue: 15, risk_level: "Средний", last_contact: "2024-10-10", action_required: "Напоминание" },
    { client: "SQ Clinic", amount: 28500, days_overdue: 12, risk_level: "Низкий", last_contact: "2024-10-05", action_required: "Отслеживание" }
  ],
  collection_actions: [
    { date: "2024-10-13", client: "ORDO Systems", action: "Отправлено напоминание", result: "Обещали оплатить до 20.10", next_action: "Контроль 20.10" },
    { date: "2024-10-12", client: "New White Smile", action: "Телефонный звонок", result: "Не отвечают", next_action: "Повторный звонок 15.10" }
  ]
};

// Обновленные данные канбана с информацией о платежах
const KANBAN_AWAITING_PAYMENT = [
  { id: "inv_001", name: "SVOY", amount: 4500, client: "SVOY Restaurant", status: "Ожидание оплаты", invoice_date: "2024-09-28", days_since_invoice: 15, due_date: "2024-10-28", manager: "Тоня", last_reminder: "2024-10-08" },
  { id: "inv_002", name: "Atlantica", amount: 5800, client: "Atlantica Bistro", status: "Ожидание оплаты", invoice_date: "2024-09-25", days_since_invoice: 18, due_date: "2024-10-25", manager: "Лена", last_reminder: "2024-10-05" },
  { id: "inv_003", name: "FullMoon", amount: 13000, client: "FullMoon Bar", status: "Ожидание оплаты", invoice_date: "2024-09-20", days_since_invoice: 23, due_date: "2024-10-20", manager: "Костя", last_reminder: "2024-10-01" },
  { id: "inv_004", name: "Gagawa", amount: 49500, client: "Gagawa Restaurant", status: "Ожидание оплаты", invoice_date: "2024-09-15", days_since_invoice: 28, due_date: "2024-10-15", manager: "Лиза", last_reminder: "2024-09-30", overdue: true }
];

// В памяти хранилища данных для CRUD операций
let employeesData = [];
 function getScheduleStats(schedule) {
  const s = schedule && typeof schedule === 'object' ? schedule : {};
  let workingDays = 0;
  let hoursPerWeek = 0;

  for (let day = 1; day <= 7; day += 1) {
    const info = s[day];
    if (!info || !info.enabled) {
      continue;
    }

    workingDays += 1;

    const from = Number.isInteger(info.from_hour) ? info.from_hour : null;
    const to = Number.isInteger(info.to_hour) ? info.to_hour : null;

    if (from === null || to === null) {
      continue;
    }

  if (to === from) {
  // 0 часов
} else if (to > from) {
  hoursPerWeek += (to - from);
} else {
  // переход через полночь, например 18 -> 0
  hoursPerWeek += (to + 24) - from;
}
  }

  return { workingDays, hoursPerWeek };
}

function calcHourlyRate(salaryMonthly, hoursPerWeek) {
  const salary = Number(salaryMonthly) || 0;
  const hours = Number(hoursPerWeek) || 0;

  // По ТЗ: цена часа в месяц = зарплата / (часы_в_неделю * 4)
  if (salary <= 0 || hours <= 0) {
    return 0;
  }

  return salary / (hours * 4);
}

function formatExperience(startDateStr) {
  if (!startDateStr) {
    return 'н/д';
  }

  const parts = String(startDateStr).split('-');
  if (parts.length !== 3) {
    return 'н/д';
  }

  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);

  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    return 'н/д';
  }

  const start = new Date(y, m - 1, d);
  if (Number.isNaN(start.getTime())) {
    return 'н/д';
  }

  const now = new Date();
  if (now < start) {
    return '0 мес.';
  }

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();

  if (now.getDate() < start.getDate()) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  years = Math.max(0, years);
  months = Math.max(0, months);

  if (years > 0 && months > 0) {
    return `${years} г. ${months} мес.`;
  }
  if (years > 0) {
    return `${years} г.`;
  }
  return `${months} мес.`;
}


let employeesLoadedFromApi = false;

async function loadEmployeesFromApi() {
  try {
    const response = await fetch('/api.php/employees', {
      method: 'GET',
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error && result.error.message ? result.error.message : 'Ошибка загрузки сотрудников');
    }

    const items = result.data && Array.isArray(result.data.employees)
      ? result.data.employees
      : [];

    if (items.length === 0) {
      employeesData = [...appData.employees];
    } else {
      employeesData = items.map(mapEmployeeFromApi);
    }

    employeesLoadedFromApi = true;
    renderEmployeeCards();
    initEmployeeHeatmap();
  } catch (err) {
    console.error('Failed to load employees from API', err);

    if (!employeesLoadedFromApi) {
      employeesData = [...appData.employees];
      renderEmployeeCards();
      initEmployeeHeatmap();
    } else {
      showToast('Не удалось обновить список сотрудников', 'error');
    }
  }
}

let clientsData = [...appData.support];
let projectsData = [...appData.revenue];
let currentEditingItem = null;
let currentEditingType = null;

// Маппинг ответа API employees в структуру карточки
function mapEmployeeFromApi(apiEmployee) {
  let skills = [];

  if (Array.isArray(apiEmployee.skills)) {
    skills = apiEmployee.skills;
  } else if (typeof apiEmployee.skills_raw === 'string' && apiEmployee.skills_raw.trim() !== '') {
    skills = apiEmployee.skills_raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }

  const fullName = apiEmployee.full_name || '';
  const shortName = fullName.split(' ')[0] || fullName || 'Сотрудник';

  const schedule = apiEmployee.schedule || {};
  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayStatus = {};

  for (let i = 0; i < dayKeys.length; i += 1) {
    const weekday = i + 1;
    const info = schedule[weekday] || null;
    const isWorking = info && info.enabled;
    dayStatus[dayKeys[i]] = isWorking ? 'Рабочий' : 'Выходной';
  }

  const stats = getScheduleStats(schedule);
  const workingDays = stats.workingDays;
  const hoursPerWeek = stats.hoursPerWeek;

  const salaryMonthly = apiEmployee.salary_monthly || 0;
  const hourlyRate = calcHourlyRate(salaryMonthly, hoursPerWeek);

  const experience = formatExperience(apiEmployee.start_date || '');

  return {
    id: apiEmployee.id,

    name: shortName,
    full_name: fullName,

    role: apiEmployee.position || '',
    email: apiEmployee.email || '',
    phone: apiEmployee.phone || '',

    employee_type: apiEmployee.employee_type || '',
    telegram_id: apiEmployee.telegram_id || '',

    is_default: apiEmployee.is_default ? 1 : 0,
    is_on_vacation: apiEmployee.is_on_vacation ? 1 : 0,

    current_salary: salaryMonthly,
    start_date: apiEmployee.start_date || '',

    // Реальная статистика
    working_days: workingDays,
    hours_per_week: hoursPerWeek,
    weekly_hours: 40, // это фикс для отображения "40 ч/нед"
    experience: experience,
    hourly_rate: Math.round(hourlyRate * 100) / 100,

    // Статусы дней для подсветки в карточке
    monday: dayStatus.monday,
    tuesday: dayStatus.tuesday,
    wednesday: dayStatus.wednesday,
    thursday: dayStatus.thursday,
    friday: dayStatus.friday,
    saturday: dayStatus.saturday,
    sunday: dayStatus.sunday,

    // Поля
    schedule,
    skills,
    skills_raw: apiEmployee.skills_raw || null,

    // Остальное можно оставить заглушками, если в верстке требуется
    task_completion_rate: 87,
    task_completion_color: '#34D399',
    avatar_url: apiEmployee.avatar_url || null,
avatar_path: apiEmployee.avatar_path || null,
salary_history: Array.isArray(apiEmployee.salary_history) ? apiEmployee.salary_history : [],
  };
}


async function loadEmployeesFromApi() {
  try {
    const response = await fetch('/api.php/employees', {
      method: 'GET',
      credentials: 'same-origin'
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        (result.error && result.error.message) || `HTTP ${response.status}`
      );
    }

    const items = result.data && Array.isArray(result.data.employees)
      ? result.data.employees
      : [];

    employeesData = items.map(mapEmployeeFromApi);

    renderEmployeeCards();
    initEmployeeHeatmap();
  } catch (err) {
    console.error('Failed to load employees from API', err);
    showToast('Не удалось загрузить сотрудников', 'error');

    employeesData = [];
    renderEmployeeCards();
    initEmployeeHeatmap();
  }
}

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
  initPeriodSelector();
  initRevenueChart();
  initKanbanBoard();
  updateMetricsByPeriod();
}

function initPeriodSelector() {
  const periodSelect = document.getElementById('periodSelect');
  if (periodSelect) {
    periodSelect.addEventListener('change', (e) => {
      currentPeriod = e.target.value;
      updateMetricsByPeriod();
      initRevenueChart();
    });
  }
}

function updateMetricsByPeriod() {
  // Calculate actual metrics from data
  const nearestPayments = appData.support
    .filter(client => client.status === 'Ожидание оплаты')
    .reduce((sum, client) => sum + client.monthly, 0);

  const confirmedTotal = appData.revenue
    .reduce((sum, item) => sum + item.amount, 0);

  // Simulate different metrics based on period
  const periodMultipliers = {
    'current-month': 1.0,
    'last-month': 0.85,
    'quarter': 2.8,
    'half-year': 5.2,
    'year': 11.5
  };

  const multiplier = periodMultipliers[currentPeriod] || 1.0;
  const baseRevenue = 955650;
  const baseMRR = 521200;
  const baseProjects = 35;
  const baseLTV = 2411400;

  // Update metric values
  const nearestPaymentsElement = document.getElementById('nearestPaymentsValue');
  const confirmedTotalElement = document.getElementById('confirmedTotalValue');
  const revenueElement = document.getElementById('totalRevenueValue');
  const mrrElement = document.getElementById('mrrValue');
  const projectsElement = document.getElementById('activeProjectsValue');
  const ltvElement = document.getElementById('ltvValue');

  if (nearestPaymentsElement) {
    nearestPaymentsElement.textContent = formatCurrency(nearestPayments);
  }

  if (confirmedTotalElement) {
    confirmedTotalElement.textContent = formatCurrency(confirmedTotal);
  }

  if (revenueElement) {
    revenueElement.textContent = formatCurrency(Math.round(baseRevenue * multiplier));
  }

  if (mrrElement && (currentPeriod === 'current-month' || currentPeriod === 'last-month')) {
    mrrElement.textContent = formatCurrency(Math.round(baseMRR * multiplier));
  } else if (mrrElement) {
    mrrElement.textContent = formatCurrency(Math.round(baseMRR * Math.min(multiplier, 2.5)));
  }

  if (projectsElement) {
    projectsElement.textContent = Math.round(baseProjects * Math.min(multiplier, 1.5));
  }

  if (ltvElement) {
    ltvElement.textContent = formatCurrency(Math.round(baseLTV * Math.min(multiplier, 2.0)));
  }
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

function initKanbanBoard() {
  const statusGroups = {
    'В работе': [],
    'Выставить счет': [],
    'Конец месяца': [],
    'Ожидание оплаты': []
  };

  // Group revenue items by status, but use special data for "Ожидание оплаты"
  projectsData.forEach(item => {
    if (statusGroups[item.status]) {
      statusGroups[item.status].push(item);
    }
  });

  // Replace "Ожидание оплаты" with enhanced data
  statusGroups['Ожидание оплаты'] = KANBAN_AWAITING_PAYMENT;

  // Populate kanban columns
  Object.keys(statusGroups).forEach(status => {
    const containerId = getKanbanContainerId(status);
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    statusGroups[status].forEach(item => {
      const card = createKanbanCard(item, status);
      container.appendChild(card);
    });
  });
}

function getKanbanContainerId(status) {
  const mapping = {
    'В работе': 'kanban-in-progress',
    'Выставить счет': 'kanban-invoice',
    'Конец месяца': 'kanban-month-end',
    'Ожидание оплаты': 'kanban-payment'
  };
  return mapping[status];
}

function createKanbanCard(item, status) {
  const card = document.createElement('div');
  card.className = 'kanban-card';
  if (item.overdue) {
    card.classList.add('overdue');
  }

  let cardContent = `
    <h5>${item.name}</h5>
    <div class="amount">${formatCurrency(item.amount)}</div>
  `;

  // Add category for non-payment items
  if (item.category) {
    cardContent += `<div class="category">${item.category}</div>`;
  }

  // Special content for "Ожидание оплаты" status
  if (status === 'Ожидание оплаты' && item.days_since_invoice) {
    const daysText = item.overdue ?
      `${item.days_since_invoice} дней назад (ПРОСРОЧЕНО)` :
      `${item.days_since_invoice} дней назад`;

    cardContent += `
      <div class="payment-info">
        <span class="days-since ${item.overdue ? 'overdue' : ''}">${daysText}</span>
        <button class="remind-btn" onclick="sendReminder('${item.id}', event)">
          🔔 Напомнить
        </button>
      </div>
    `;
  }

  card.innerHTML = cardContent;

  card.addEventListener('click', () => {
    showItemDetails(item);
  });

  return card;
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
  }
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