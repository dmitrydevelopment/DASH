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
  searchTerm: '',         // live search by client name
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
    case 'invoices':
      initInvoicesTab();
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
  initKanbanBoard();
}

function initPeriodSelector(selectId = 'periodSelect') {
  const periodSelect = document.getElementById(selectId);
  if (periodSelect && !periodSelect.dataset.bound) {
    periodSelect.dataset.bound = '1';
    periodSelect.addEventListener('change', (e) => {
      currentPeriod = e.target.value;
      updateMetricsByPeriod();
      if (selectId === 'periodSelect') {
        initRevenueChart();
      }
      if (typeof initFinanceOverview === 'function' && currentTab === 'finance') {
        initFinanceOverview();
      }
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


async function initInvoicesTab(page = 1) {
  bindInvoicesFilters();
  const box = document.getElementById('invoicesList');
  if (!box) return;

  const docType = document.getElementById('invoicesDocType')?.value || '';
  const clientId = document.getElementById('invoicesClientId')?.value || '';
  const periodYear = document.getElementById('invoicesPeriodYear')?.value || '';
  const periodMonth = document.getElementById('invoicesPeriodMonth')?.value || '';

  const q = new URLSearchParams();
  if (docType) q.set('doc_type', docType);
  if (clientId) q.set('client_id', clientId);
  if (periodYear) q.set('period_year', periodYear);
  if (periodMonth) q.set('period_month', periodMonth);
  q.set('page', String(page));
  q.set('per_page', '20');

  box.innerHTML = '<p>Загрузка...</p>';

  try {
    const r = await fetch(`/api.php/finance/documents?${q.toString()}`);
    const data = await r.json();
    const items = data?.data?.items || [];
    const pg = data?.data?.pagination || { page: 1, pages: 1 };

    box.innerHTML = `
      <table class="finance-table">
        <thead>
          <tr><th>№</th><th>Тип</th><th>Клиент</th><th>Дата</th><th>Сумма</th><th>Оплата</th><th>Действие</th></tr>
        </thead>
        <tbody>
          ${items.map(it => `
            <tr>
              <td>${it.doc_number}</td>
              <td>${it.doc_type === 'invoice' ? 'Счет' : 'Акт'}</td>
              <td>${it.client_name || ''}</td>
              <td>${new Date(it.doc_date).toLocaleDateString('ru-RU')}</td>
              <td>${formatCurrency(it.total_sum || 0)}</td>
              <td>${it.is_paid ? 'Оплачен' : 'Не оплачен'}</td>
              <td><a class="btn btn--secondary" href="/api.php/finance/download?token=${encodeURIComponent(it.download_token)}">Скачать PDF</a></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="table-actions" style="margin-top:12px;display:flex;gap:8px;">
        <button class="btn btn--secondary" ${pg.page <= 1 ? 'disabled' : ''} onclick="initInvoicesTab(${pg.page - 1})">Назад</button>
        <span>Страница ${pg.page} / ${pg.pages}</span>
        <button class="btn btn--secondary" ${pg.page >= pg.pages ? 'disabled' : ''} onclick="initInvoicesTab(${pg.page} + 1)">Вперед</button>
      </div>
    `;
  } catch (e) {
    console.error(e);
    box.innerHTML = '<p>Ошибка загрузки документов</p>';
  }
}

function bindInvoicesFilters() {
  ['invoicesDocType','invoicesClientId','invoicesPeriodYear','invoicesPeriodMonth'].forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.dataset.bound) {
      el.dataset.bound = '1';
      el.addEventListener('change', () => initInvoicesTab(1));
    }
  });
}

// Finance Tab
function initFinanceTab() {
  initPeriodSelector('financePeriodSelect');
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

