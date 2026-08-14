// Standalone module mirroring testable logic from Marts_System_Merged.html
// Used for Jest unit testing

let mem = {};
const safeStorage = {
  works: true,
  get(k) { try { return localStorage.getItem(k); } catch(e) { return mem[k]; } },
  set(k,v) { try { localStorage.setItem(k,v); } catch(e) { mem[k]=String(v); } },
  remove(k) { try { localStorage.removeItem(k); } catch(e) { delete mem[k]; } },
  clear() { try { localStorage.clear(); } catch(e) { mem={}; } }
};

const FirebaseSync = { _initialized: false, save() {}, load() { return Promise.resolve(); } };

const ActivityLog = {
  _MAX_LOCAL: 500,
  log(action, target, details) {
    const entry = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2,6),
      timestamp: Date.now(),
      user: (typeof currentUser !== 'undefined' && currentUser) ? currentUser.username : 'system',
      action, target, details: details || {}, ip: '',
      ua: typeof navigator !== 'undefined' ? (navigator.userAgent || '').substring(0,100) : ''
    };
    const logs = STORAGE.get('activityLogs', []);
    logs.unshift(entry);
    if (logs.length > this._MAX_LOCAL) logs.length = this._MAX_LOCAL;
    safeStorage.set('activityLogs', JSON.stringify(logs));
    return entry;
  },
  get(filter) {
    let logs = STORAGE.get('activityLogs', []);
    if (filter) {
      if (filter.user) logs = logs.filter(l => l.user === filter.user);
      if (filter.action) logs = logs.filter(l => l.action === filter.action);
      if (filter.target) logs = logs.filter(l => l.target && l.target.includes(filter.target));
      if (filter.from) logs = logs.filter(l => l.timestamp >= filter.from);
      if (filter.to) logs = logs.filter(l => l.timestamp <= filter.to);
    }
    return logs;
  },
  clear() { safeStorage.set('activityLogs', '[]'); }
};

const STORAGE = {
  get(k, d) {
    const v = safeStorage.get(k);
    if (v === null || v === undefined) return d;
    try { return JSON.parse(v); } catch(e) { return v; }
  },
  set(k, v) {
    safeStorage.set(k, JSON.stringify(v));
  }
};

const PERMISSIONS_LIST = [
  {id:'dashboard_view'},{id:'sales_view'},{id:'sales_add'},{id:'sales_edit'},{id:'sales_delete'},
  {id:'employees_view'},{id:'employees_add'},{id:'employees_edit'},{id:'employees_delete'},
  {id:'accounts_view'},{id:'accounts_treasury'},{id:'accounts_salaries'},{id:'accounts_partners'},
  {id:'accounts_expenses'},{id:'accounts_journal_add'},{id:'accounts_journal_edit'},{id:'accounts_journal_delete'},
  {id:'accounts_expense_add'},{id:'accounts_expense_edit'},{id:'accounts_expense_delete'},
  {id:'accounts_salary_add'},{id:'accounts_salary_edit'},{id:'accounts_salary_delete'},
  {id:'accounts_partners_add'},{id:'accounts_partners_edit'},{id:'accounts_partners_delete'},
  {id:'accounts_intercompany'},
  {id:'reports_view'},{id:'reports_export'},{id:'reports_print'},
  {id:'crm_view'},{id:'crm_add'},{id:'crm_edit'},
  {id:'crm_delete'},{id:'crm_manage_accounts'},{id:'settings_view'},{id:'settings_manage_users'}
];

const DEFAULT_PERMS_OWNER = PERMISSIONS_LIST.map(p=>p.id);
const DEFAULT_PERMS_SUPER_ADMIN = DEFAULT_PERMS_OWNER.slice();
const DEFAULT_PERMS_HEAD_OF_SALES = ['crm_view','crm_add','crm_edit','crm_delete'];
const DEFAULT_PERMS_SALES_MANAGER = ['crm_view','crm_add','crm_edit','crm_manage_accounts'];
const DEFAULT_PERMS_TEAM_LEADER = ['crm_view','crm_add','crm_edit'];
const DEFAULT_PERMS_SALES = ['crm_view','crm_add'];
const DEFAULT_PERMS_MARKETING_DIRECTOR = ['crm_view','crm_add','crm_edit','crm_delete'];
const DEFAULT_PERMS_MARKETING_ASSISTANT = ['crm_view','crm_add'];
const DEFAULT_PERMS_MARKETER = ['crm_view','crm_add'];
const DEFAULT_PERMS_OPERATIONS = ['dashboard_view','employees_view','employees_add','employees_edit','orgchart_view','commissions_view','reports_view'];
const DEFAULT_PERMS_ACCOUNTING = ['dashboard_view','accounts_view','accounts_treasury','accounts_salaries','accounts_partners','accounts_expenses','accounts_journal_add','accounts_journal_edit','accounts_journal_delete','accounts_expense_add','accounts_expense_edit','accounts_expense_delete','accounts_salary_add','accounts_salary_edit','accounts_salary_delete','accounts_partners_add','accounts_partners_edit','accounts_partners_delete','reports_view','reports_export','reports_print'];
const DEFAULT_PERMS_HR_MANAGER = ['hr_view','hr_add','hr_edit','hr_orgchart','hr_vacations','hr_requests','employees_view','employees_add','employees_edit','reports_view'];

const DEFAULT_ROLES = [
  {id:'owner',en:'Owner',ar:'المالك',type:'management'},
  {id:'super_admin',en:'Super Admin',ar:'مدير عام',type:'management'},
  {id:'head_of_sales',en:'Head of Sales',ar:'رئيس المبيعات',type:'management'},
  {id:'sales_manager',en:'Sales Manager',ar:'مدير المبيعات',type:'management'},
  {id:'team_leader',en:'Team Leader',ar:'قائد فريق',type:'management'},
  {id:'sales',en:'Sales',ar:'مبيعات',type:'staff'},
  {id:'marketing_director',en:'Marketing Director',ar:'مدير التسويق',type:'management'},
  {id:'marketing_agent',en:'Marketing Agent',ar:'وكيل تسويق',type:'staff'},
  {id:'marketer',en:'Marketer',ar:'مسوق',type:'staff'},
  {id:'operations',en:'Operations',ar:'عمليات',type:'management'},
  {id:'accounting',en:'Accounting',ar:'محاسب',type:'management'}
];

const DEFAULT_RESALE_TEAM = [];

let lang = 'en';
let currentUser = null;
let defaultUsers = [];

// ============================================================
// UTILITY FUNCTIONS (from lines 2745-2756)
// ============================================================
const uid = () => 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2,5);
const fmt = (n) => new Intl.NumberFormat('en-EG',{style:'currency',currency:'EGP',maximumFractionDigits:0}).format(n||0);
const today = () => new Date().toISOString().slice(0,10);
const fmtDate = (d) => { if(!d) return '-'; const dt=new Date(d); return dt.toLocaleDateString(lang==='ar'?'ar-EG':'en-EG'); };
const daysBetween = (d1,d2) => Math.ceil((new Date(d2)-new Date(d1))/(1000*60*60*24));
const addDays = (d,n) => { const dt=new Date(d); dt.setDate(dt.getDate()+n); return dt.toISOString().slice(0,10); };
const getInitials = (name) => { const p=name.trim().split(/\s+/); return p.length>=2?(p[0][0]+p[1][0]).toUpperCase():p[0].substring(0,2).toUpperCase(); };

function getAllRoles() { return STORAGE.get('empRoles', DEFAULT_ROLES); }
function getResaleTeam() { return STORAGE.get('resaleTeam', DEFAULT_RESALE_TEAM); }
const getRoleLabel = (roleId) => { const r=getAllRoles().find(x=>x.id===roleId); return r?(lang==='ar'?r.ar:r.en):roleId; };
const getRoleType = (roleId) => { const r=getAllRoles().find(x=>x.id===roleId); return r?r.type:'fixed'; };
const getRoleConfig = (roleId) => getAllRoles().find(r => r.id === roleId);

function genSaleCode() {
  const sales = STORAGE.get('sales',[]);
  return 'MRT-' + String(sales.length + 1).padStart(4,'0');
}

function getNextPayoutDate(fromDate, payoutDays) {
  const expiry = addDays(fromDate, parseInt(payoutDays)||30);
  const expDate = new Date(expiry);
  const day = expDate.getDate();
  if(day <= 1) return addDays(expiry, 1 - day);
  if(day <= 15) return addDays(expiry, 15 - day);
  return new Date(expDate.getFullYear(), expDate.getMonth()+1, 1).toISOString().slice(0,10);
}

// ============================================================
// PERMISSION FUNCTIONS (from lines 2777-2863)
// ============================================================
function isOwner() { return currentUser && (currentUser.role === 'owner' || currentUser.role === 'super_admin'); }
function isAdmin() { return currentUser && (currentUser.role === 'owner' || currentUser.role === 'super_admin' || currentUser.role === 'head_of_sales'); }
function canAccounting() { return currentUser && hasPermission('accounts_treasury'); }

function canManageUser(targetUsername) {
  if(!currentUser) return false;
  if(currentUser.role === 'owner') return targetUsername !== 'owner';
  if(currentUser.role === 'super_admin') return targetUsername !== 'owner' && targetUsername !== 'super_admin';
  return false;
}

function hasPermission(permId) {
  if(!currentUser) return false;
  if(currentUser.role === 'owner') return true;
  const perms = currentUser.permissions || [];
  if(perms.length > 0) return perms.includes(permId);
  const users = STORAGE.get('users', defaultUsers);
  const u = users.find(x=>x.username===currentUser.username);
  if(!u || !u.permissions) {
    if(currentUser.role === 'accounting') return DEFAULT_PERMS_ACCOUNTING.includes(permId);
    if(currentUser.role === 'sales') return DEFAULT_PERMS_SALES.includes(permId);
    return false;
  }
  return u.permissions.includes(permId);
}

// ============================================================
// TEAM HIERARCHY (from lines 2868-2879)
// ============================================================
function getAllUsers(){ return STORAGE.get('users', defaultUsers); }
function getUserByUsername(un){ return getAllUsers().find(u=>u.username===un); }
function getChildren(username){ return getAllUsers().filter(u=>u.parentId===username); }
function getTeamUserIds(username){
  const ids=[username];
  const kids=getChildren(username);
  kids.forEach(k=>{ ids.push(...getTeamUserIds(k.username)); });
  return ids;
}
function getDirectReports(username){ return getChildren(username); }
function isSalesSide(role){ return ['head_of_sales','sm','tl','sales'].includes(role); }
function isMarketingSide(role){ return ['md','ma','marketer'].includes(role); }

// ============================================================
// LOCK FUNCTIONS (from lines 8553-8568)
// ============================================================
function isLocked(storageKey, id, idField) {
  idField = idField || 'id';
  const data = STORAGE.get(storageKey, []);
  const entry = data.find(e => e[idField] === id);
  return entry ? entry.locked : false;
}

function toggleLockEntry(storageKey, id, idField) {
  idField = idField || 'id';
  const data = STORAGE.get(storageKey, []);
  const entry = data.find(e => e[idField] === id);
  if (entry) {
    entry.locked = !entry.locked;
    STORAGE.set(storageKey, data);
    ActivityLog.log(entry.locked ? 'lock' : 'unlock', storageKey, { id: id });
  }
}

// ============================================================
// AUTO JOURNAL LINKING (mirrors createAutoJournalEntry/_removeAutoJournal/_syncAutoJournal)
// ============================================================
function createAutoJournalEntry(type, data) {
  const journalEntries = STORAGE.get('journalEntries', []);
  const lines = [];
  if(type === 'treasury_income' || type === 'treasury_expense' || type === 'new_expense' || type === 'salary_payment' || type === 'partner_distribution' || type === 'commission_route' || type === 'payroll_post' || type === 'advance_payment' || type === 'new_employee' || type === 'new_sale') {
    lines.push({code:'1120', debit: data.amount || 0, credit: 0});
    lines.push({code:'4100', debit: 0, credit: data.amount || 0});
  }
  if(lines.length > 0) {
    journalEntries.push({
      id: uid(),
      date: data.date || today(),
      ref: data.ref || 'AUTO-' + uid(),
      desc: data.desc || '',
      franchiseId: data.franchiseId || '',
      branchId: data.branchId || '',
      status: 'approved',
      autoGenerated: true,
      sourceType: type,
      sourceId: data.sourceId || '',
      lines: lines
    });
    STORAGE.set('journalEntries', journalEntries);
  }
}
function _removeAutoJournal(sourceType, sourceId) {
  const entries = STORAGE.get('journalEntries', []);
  const filtered = entries.filter(e => !(e.autoGenerated && e.sourceType === sourceType && e.sourceId === sourceId));
  if(filtered.length !== entries.length) {
    STORAGE.set('journalEntries', filtered);
    return true;
  }
  return false;
}
function _syncAutoJournal(sourceType, sourceId, data) {
  _removeAutoJournal(sourceType, sourceId);
  createAutoJournalEntry(sourceType, Object.assign({}, data, {sourceId: sourceId}));
}

// ============================================================
// AUTO CRM ACCOUNT FOR EMPLOYEES (from saveEmp flow)
// ============================================================
const EMP_ROLE_TO_USER_ROLE = {
  ceo:'owner',
  sales_director:'head_of_sales',
  sales_manager:'sm',
  team_leader:'tl',
  senior_property_consultant:'sales',
  property_consultant:'sales',
  property_advisor:'sales',
  sales_admin:'sales',
  hr_manager:'hr_manager',
  hr_agent:'operations',
  operation_director:'operations',
  operation:'operations',
  marketing_director:'md',
  marketing_assistant:'ma',
  accountant:'accounting',
  collector:'accounting',
  office_boy:'sales',
  quality_control:'sales'
};
function empToUserRole(role){ return EMP_ROLE_TO_USER_ROLE[role] || 'sales'; }

const AR_TO_LATIN = {
  'ا':'a','أ':'a','إ':'e','آ':'a','ء':'a','ب':'b','ت':'t','ث':'th','ج':'g','ح':'h','خ':'kh','د':'d','ذ':'th',
  'ر':'r','ز':'z','س':'s','ش':'sh','ص':'s','ض':'d','ط':'t','ظ':'z','ع':'a','غ':'gh','ف':'f','ق':'q','ك':'k',
  'ل':'l','م':'m','ن':'n','ه':'h','و':'w','ي':'y','ى':'a','ة':'a','ؤ':'o','ئ':'e'
};
function arabicToLatin(s){
  return String(s||'').split('').map(ch=>AR_TO_LATIN[ch]||ch).join('');
}
function empDefaultPerms(role){
  if(role==='owner') return DEFAULT_PERMS_OWNER;
  if(role==='super_admin') return DEFAULT_PERMS_SUPER_ADMIN;
  if(role==='head_of_sales') return DEFAULT_PERMS_HEAD_OF_SALES;
  if(role==='sm') return DEFAULT_PERMS_SALES_MANAGER;
  if(role==='tl') return DEFAULT_PERMS_TEAM_LEADER;
  if(role==='sales') return DEFAULT_PERMS_SALES;
  if(role==='md') return DEFAULT_PERMS_MARKETING_DIRECTOR;
  if(role==='ma') return DEFAULT_PERMS_MARKETING_ASSISTANT;
  if(role==='marketer') return DEFAULT_PERMS_MARKETER;
  if(role==='operations') return DEFAULT_PERMS_OPERATIONS;
  if(role==='accounting') return DEFAULT_PERMS_ACCOUNTING;
  if(role==='hr_manager') return DEFAULT_PERMS_HR_MANAGER;
  return [];
}
function empAutoCreateUser(emp){
  if(!emp || !emp.name) return null;
  const users = STORAGE.get('users', defaultUsers);
  if(users.some(u=>u.empId===emp.id)) return null;
  const role = empToUserRole(emp.role);
  let base = arabicToLatin(emp.name).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g,'.')
    .replace(/^\.+|\.+$/g,'')
    .replace(/\.{2,}/g,'.');
  if(!base) base = 'emp' + emp.id;
  let username = base, i = 2;
  while(users.some(u=>u.username.toLowerCase()===username.toLowerCase())){ username = base + '.' + (i++); }
  const password = 'Marts@123';
  const user = {
    username, password, role,
    fullName: emp.name,
    email: username + '@marts-eg.com',
    permissions: empDefaultPerms(role),
    accountType: 'system',
    empId: emp.id
  };
  users.push(user);
  STORAGE.set('users', users);
  return user;
}

// ============================================================
// PAYROLL LOGIC (mirrors showPayrollDetail helpers in HTML)
// ============================================================
const PAYROLL_INSURANCE = { employeeRate: 0.11, employerRate: 0.1875, maxInsurableSalary: 12600 };
const INCOME_TAX_BRACKETS = [[15000,0],[30000,0.025],[45000,0.10],[60000,0.15],[200000,0.20],[400000,0.225],[Infinity,0.25]];
function calcIncomeTaxMonthly(monthlySalary) {
  const annual = (monthlySalary || 0) * 12;
  let tax = 0, prev = 0;
  for (const [cap, rate] of INCOME_TAX_BRACKETS) {
    if (annual <= prev) break;
    tax += (Math.min(annual, cap) - prev) * rate;
    prev = cap;
  }
  return Math.max(0, Math.round(tax / 12));
}
function calcSocialInsurance(salary, isEmployer) {
  const base = Math.min(salary || 0, PAYROLL_INSURANCE.maxInsurableSalary);
  return Math.round(base * (isEmployer ? PAYROLL_INSURANCE.employerRate : PAYROLL_INSURANCE.employeeRate));
}
function serviceYears(emp) {
  const hire = emp.hireDate || emp.joiningDate || '';
  if (!hire) return 0;
  const diff = new Date(today()) - new Date(hire);
  return diff > 0 ? Math.floor(diff / (365.25 * 24 * 3600 * 1000)) : 0;
}
function annualLeaveEntitlement(emp) {
  if (serviceYears(emp) >= 10 || (emp.age || 0) >= 50) return 30;
  return 21;
}
function isAnnualVacation(vtype) {
  return vtype && /annual|سنوية|سنوى/i.test((vtype.id || '') + ' ' + (vtype.ar || '') + ' ' + (vtype.en || ''));
}
function calcAdvanceRepayment(empId) {
  return STORAGE.get('employeeAdvances', []).filter(a => a.empId === empId && a.status === 'approved').reduce((s, a) => s + (a.amount || 0), 0);
}
// ============================================================
// FIXED ASSETS & ESCAPING (mirrors phase-3 module)
// ============================================================
function calcAssetMonthlyDep(a) {
  const cost = parseFloat(a.cost)||0;
  const salvage = parseFloat(a.salvage)||0;
  const life = parseInt(a.usefulLife)||1;
  return Math.max(0, Math.round(((cost - salvage) / (life * 12)) * 100) / 100);
}
function escapeHtml(s) {
  if(s === null || s === undefined) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
module.exports = {
  uid, fmt, today, fmtDate, daysBetween, addDays, getInitials,
  getAllRoles, getResaleTeam, getRoleLabel, getRoleType, getRoleConfig,
  genSaleCode, getNextPayoutDate,
  isOwner, isAdmin, canAccounting, canManageUser, hasPermission,
  getAllUsers, getUserByUsername, getChildren, getTeamUserIds, getDirectReports,
  isSalesSide, isMarketingSide,
  isLocked, toggleLockEntry,
  createAutoJournalEntry, _removeAutoJournal, _syncAutoJournal,
  PAYROLL_INSURANCE, INCOME_TAX_BRACKETS, calcIncomeTaxMonthly, calcSocialInsurance,
  serviceYears, annualLeaveEntitlement, isAnnualVacation, calcAdvanceRepayment,
  calcAssetMonthlyDep, escapeHtml,
  empToUserRole, arabicToLatin, empDefaultPerms, empAutoCreateUser,
  STORAGE, safeStorage, ActivityLog,
  PERMISSIONS_LIST, DEFAULT_PERMS_OWNER, DEFAULT_PERMS_SALES, DEFAULT_PERMS_ACCOUNTING,
  DEFAULT_ROLES, DEFAULT_RESALE_TEAM,
  get currentUser() { return currentUser; },
  set currentUser(v) { currentUser = v; },
  get lang() { return lang; },
  set lang(v) { lang = v; },
  get defaultUsers() { return defaultUsers; },
  set defaultUsers(v) { defaultUsers = v; },
  _reset() {
    currentUser = null;
    lang = 'en';
    defaultUsers = [];
    safeStorage.clear();
  }
};