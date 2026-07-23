const lib = require('./lib');

beforeEach(() => { lib._reset(); });

describe('Permission Functions', () => {
  describe('isOwner()', () => {
    it('should return true for owner role', () => {
      lib.currentUser = { username: 'admin', role: 'owner' };
      expect(lib.isOwner()).toBe(true);
    });
    it('should return true for super_admin role', () => {
      lib.currentUser = { username: 'admin', role: 'super_admin' };
      expect(lib.isOwner()).toBe(true);
    });
    it('should return false for other roles', () => {
      lib.currentUser = { username: 'user1', role: 'sales' };
      expect(lib.isOwner()).toBe(false);
    });
    it('should return falsy when no user', () => {
      expect(lib.isOwner()).toBeFalsy();
    });
  });

  describe('isAdmin()', () => {
    it('should return true for owner', () => {
      lib.currentUser = { username: 'admin', role: 'owner' };
      expect(lib.isAdmin()).toBe(true);
    });
    it('should return true for super_admin', () => {
      lib.currentUser = { username: 'admin', role: 'super_admin' };
      expect(lib.isAdmin()).toBe(true);
    });
    it('should return true for head_of_sales', () => {
      lib.currentUser = { username: 'hos', role: 'head_of_sales' };
      expect(lib.isAdmin()).toBe(true);
    });
    it('should return false for sales', () => {
      lib.currentUser = { username: 'user1', role: 'sales' };
      expect(lib.isAdmin()).toBe(false);
    });
  });

  describe('canAccounting()', () => {
    it('should return true when user has accounts_treasury permission', () => {
      lib.currentUser = { username: 'acc', role: 'accounting', permissions: ['accounts_treasury'] };
      expect(lib.canAccounting()).toBe(true);
    });
    it('should return false when user lacks permission', () => {
      lib.currentUser = { username: 'user1', role: 'sales', permissions: [] };
      expect(lib.canAccounting()).toBe(false);
    });
  });

  describe('canManageUser()', () => {
    it('owner can manage other users', () => {
      lib.currentUser = { username: 'admin', role: 'owner' };
      expect(lib.canManageUser('user1')).toBe(true);
    });
    it('owner cannot manage themselves', () => {
      lib.currentUser = { username: 'owner', role: 'owner' };
      expect(lib.canManageUser('owner')).toBe(false);
    });
    it('super_admin can manage regular users', () => {
      lib.currentUser = { username: 'sa', role: 'super_admin' };
      expect(lib.canManageUser('user1')).toBe(true);
    });
    it('super_admin cannot manage owner', () => {
      lib.currentUser = { username: 'sa', role: 'super_admin' };
      expect(lib.canManageUser('owner')).toBe(false);
    });
    it('regular user cannot manage anyone', () => {
      lib.currentUser = { username: 'user1', role: 'sales' };
      expect(lib.canManageUser('user2')).toBe(false);
    });
  });

  describe('hasPermission()', () => {
    it('owner has all permissions', () => {
      lib.currentUser = { username: 'admin', role: 'owner' };
      expect(lib.hasPermission('accounts_treasury')).toBe(true);
      expect(lib.hasPermission('crm_view')).toBe(true);
    });
    it('user with explicit permission returns true', () => {
      lib.currentUser = { username: 'acc', role: 'accounting', permissions: ['accounts_treasury'] };
      expect(lib.hasPermission('accounts_treasury')).toBe(true);
    });
    it('user without permission returns false', () => {
      lib.currentUser = { username: 'user1', role: 'sales', permissions: [] };
      expect(lib.hasPermission('accounts_treasury')).toBe(false);
    });
  });
});
