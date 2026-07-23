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
  {id:'reports_view'},{id:'reports_export'},{id:'crm_view'},{id:'crm_add'},{id:'crm_edit'},
  {id:'crm_delete'},{id:'crm_manage_accounts'},{id:'settings_view'},{id:'settings_manage_users'}
];

const DEFAULT_PERMS_OWNER = PERMISSIONS_LIST.map(p=>p.id);
const DEFAULT_PERMS_SALES = ['crm_view','crm_add'];
const DEFAULT_PERMS_ACCOUNTING = ['dashboard_view','accounts_view','accounts_treasury','accounts_salaries','accounts_partners','accounts_expenses','reports_view'];

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

module.exports = {
  uid, fmt, today, fmtDate, daysBetween, addDays, getInitials,
  getAllRoles, getResaleTeam, getRoleLabel, getRoleType, getRoleConfig,
  genSaleCode, getNextPayoutDate,
  isOwner, isAdmin, canAccounting, canManageUser, hasPermission,
  getAllUsers, getUserByUsername, getChildren, getTeamUserIds, getDirectReports,
  isSalesSide, isMarketingSide,
  isLocked, toggleLockEntry,
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
