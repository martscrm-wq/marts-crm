const lib = require('./lib');

beforeEach(() => { lib._reset(); });

describe('Auto CRM Account for Employees', () => {
  describe('empToUserRole()', () => {
    it('maps sales employee roles to sales system roles', () => {
      expect(lib.empToUserRole('property_consultant')).toBe('sales');
      expect(lib.empToUserRole('team_leader')).toBe('tl');
      expect(lib.empToUserRole('sales_manager')).toBe('sm');
      expect(lib.empToUserRole('sales_director')).toBe('head_of_sales');
    });
    it('maps other employee roles', () => {
      expect(lib.empToUserRole('ceo')).toBe('owner');
      expect(lib.empToUserRole('hr_manager')).toBe('hr_manager');
      expect(lib.empToUserRole('operation')).toBe('operations');
      expect(lib.empToUserRole('accountant')).toBe('accounting');
    });
    it('falls back to sales for unknown roles', () => {
      expect(lib.empToUserRole('custom_role')).toBe('sales');
    });
  });

  describe('arabicToLatin()', () => {
    it('transliterates Arabic characters', () => {
      expect(lib.arabicToLatin('أحمد محمد علي')).toBe('ahmd mhmd aly');
    });
    it('keeps Latin characters as-is', () => {
      expect(lib.arabicToLatin('John Smith')).toBe('John Smith');
    });
  });

  describe('empDefaultPerms()', () => {
    it('returns sales perms for sales role', () => {
      expect(lib.empDefaultPerms('sales')).toEqual(['crm_view','crm_add']);
    });
    it('returns empty perms for unknown role', () => {
      expect(lib.empDefaultPerms('unknown')).toEqual([]);
    });
  });

  describe('empAutoCreateUser()', () => {
    beforeEach(() => {
      lib.STORAGE.set('users', [{ username: 'owner', role: 'owner' }]);
    });

    it('creates a system account with name, domain email and mapped role', () => {
      const user = lib.empAutoCreateUser({ id: 'E1', name: 'أحمد محمد علي', role: 'property_consultant' });
      expect(user).toBeDefined();
      expect(user.username).toBe('ahmd.mhmd.aly');
      expect(user.email).toBe('ahmd.mhmd.aly@marts-eg.com');
      expect(user.role).toBe('sales');
      expect(user.accountType).toBe('system');
      expect(user.empId).toBe('E1');
      expect(user.fullName).toBe('أحمد محمد علي');
      expect(user.permissions).toEqual(['crm_view','crm_add']);
    });

    it('generates a unique username for duplicate names', () => {
      lib.empAutoCreateUser({ id: 'E1', name: 'أحمد محمد علي', role: 'sales' });
      const second = lib.empAutoCreateUser({ id: 'E2', name: 'أحمد محمد علي', role: 'sales' });
      expect(second.username).toBe('ahmd.mhmd.aly.2');
      expect(second.email).toBe('ahmd.mhmd.aly.2@marts-eg.com');
    });

    it('keeps Latin usernames unchanged', () => {
      const user = lib.empAutoCreateUser({ id: 'E4', name: 'John Smith', role: 'accountant' });
      expect(user.username).toBe('john.smith');
      expect(user.role).toBe('accounting');
    });

    it('skips employees that already have an account', () => {
      lib.empAutoCreateUser({ id: 'E1', name: 'علي', role: 'sales' });
      const dup = lib.empAutoCreateUser({ id: 'E1', name: 'علي', role: 'sales' });
      expect(dup).toBeNull();
    });

    it('returns null when employee has no name', () => {
      expect(lib.empAutoCreateUser({ id: 'E9', name: '' })).toBeNull();
    });

    it('persists the created user in storage', () => {
      lib.empAutoCreateUser({ id: 'E1', name: 'علي', role: 'operation' });
      const users = lib.STORAGE.get('users', []);
      expect(users.some(u => u.username === 'aly' && u.empId === 'E1')).toBe(true);
    });
  });
});
