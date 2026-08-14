const lib = require('./lib');

beforeEach(() => { lib._reset(); });

describe('CRM — Employee to CRM Account Automation', () => {
  it('maps employee roles to user roles', () => {
    expect(lib.empToUserRole('ceo')).toBe('owner');
    expect(lib.empToUserRole('sales_director')).toBe('head_of_sales');
    expect(lib.empToUserRole('property_consultant')).toBe('sales');
    expect(lib.empToUserRole('hr_manager')).toBe('hr_manager');
    expect(lib.empToUserRole('accountant')).toBe('accounting');
    expect(lib.empToUserRole('unknown_role')).toBe('sales');
  });
  it('transliterates Arabic names to latin', () => {
    expect(lib.arabicToLatin('أحمد')).toBe('ahmd');
    expect(lib.arabicToLatin('محمد علي')).toBe('mhmd aly');
    expect(lib.arabicToLatin('')).toBe('');
  });
  it('assigns default permissions by role', () => {
    expect(lib.empDefaultPerms('owner')).toEqual(lib.DEFAULT_PERMS_OWNER);
    expect(lib.empDefaultPerms('accounting')).toEqual(lib.DEFAULT_PERMS_ACCOUNTING);
    expect(lib.empDefaultPerms('sales')).toEqual(lib.DEFAULT_PERMS_SALES);
    expect(lib.empDefaultPerms('nope')).toEqual([]);
  });
  it('creates a CRM account from an employee', () => {
    const user = lib.empAutoCreateUser({ id: 'E1', name: 'أحمد سليم', role: 'sales' });
    expect(user).not.toBeNull();
    expect(user.empId).toBe('E1');
    expect(user.role).toBe('sales');
    expect(user.permissions).toEqual(lib.DEFAULT_PERMS_SALES);
    expect(user.email).toContain('@marts-eg.com');
    expect(lib.STORAGE.get('users', []).length).toBe(1);
  });
  it('does not duplicate accounts for same employee', () => {
    lib.empAutoCreateUser({ id: 'E1', name: 'Test User', role: 'sales' });
    const second = lib.empAutoCreateUser({ id: 'E1', name: 'Test User', role: 'sales' });
    expect(second).toBeNull();
    expect(lib.STORAGE.get('users', []).length).toBe(1);
  });
  it('generates unique usernames on collision', () => {
    lib.empAutoCreateUser({ id: 'E1', name: 'Same Name', role: 'sales' });
    const u2 = lib.empAutoCreateUser({ id: 'E2', name: 'Same Name', role: 'sales' });
    expect(u2.username).not.toBe(lib.STORAGE.get('users', [])[0].username);
  });
  it('rejects employees without name', () => {
    expect(lib.empAutoCreateUser({ id: 'E9' })).toBeNull();
  });
  it('accounting default perms include journal add', () => {
    expect(lib.DEFAULT_PERMS_ACCOUNTING).toContain('accounts_journal_add');
    expect(lib.DEFAULT_PERMS_ACCOUNTING).toContain('accounts_salaries');
  });
});