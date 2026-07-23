const lib = require('./lib');

beforeEach(() => { lib._reset(); });

describe('Role & Team Functions', () => {
  beforeEach(() => {
    lib.STORAGE.set('users', [
      { username: 'admin', role: 'owner', fullName: 'Admin User' },
      { username: 'sa', role: 'super_admin', fullName: 'Super Admin', parentId: 'admin' },
      { username: 'hos', role: 'head_of_sales', fullName: 'Head Sales', parentId: 'admin' },
      { username: 'sm1', role: 'sales_manager', fullName: 'Sales Manager', parentId: 'hos' },
      { username: 'tl1', role: 'team_leader', fullName: 'Team Leader', parentId: 'sm1' },
      { username: 's1', role: 'sales', fullName: 'Sales Person', parentId: 'tl1' },
      { username: 's2', role: 'sales', fullName: 'Sales Person 2', parentId: 'tl1' },
      { username: 'md1', role: 'marketing_director', fullName: 'Marketing Dir', parentId: 'admin' },
      { username: 'ma1', role: 'marketing_agent', fullName: 'Marketing Agent', parentId: 'md1' },
    ]);
  });

  describe('getAllUsers()', () => {
    it('should return all users', () => {
      expect(lib.getAllUsers().length).toBe(9);
    });
  });

  describe('getUserByUsername()', () => {
    it('should find existing user', () => {
      const user = lib.getUserByUsername('admin');
      expect(user).toBeDefined();
      expect(user.fullName).toBe('Admin User');
    });
    it('should return undefined for non-existent user', () => {
      expect(lib.getUserByUsername('nonexistent')).toBeUndefined();
    });
  });

  describe('getChildren()', () => {
    it('should return direct children', () => {
      const children = lib.getChildren('tl1');
      expect(children.length).toBe(2);
      expect(children.map(c => c.username)).toContain('s1');
    });
    it('should return empty for leaf nodes', () => {
      expect(lib.getChildren('s1').length).toBe(0);
    });
  });

  describe('getTeamUserIds()', () => {
    it('should return all descendants recursively', () => {
      const team = lib.getTeamUserIds('hos');
      expect(team).toContain('sm1');
      expect(team).toContain('tl1');
      expect(team).toContain('s1');
      expect(team).toContain('s2');
    });
    it('should include the root user in team', () => {
      expect(lib.getTeamUserIds('hos')).toContain('hos');
    });
  });

  describe('isSalesSide()', () => {
    it('should return true for sales roles (abbreviations)', () => {
      expect(lib.isSalesSide('sales')).toBe(true);
      expect(lib.isSalesSide('tl')).toBe(true);
      expect(lib.isSalesSide('sm')).toBe(true);
      expect(lib.isSalesSide('head_of_sales')).toBe(true);
    });
    it('should return false for non-sales roles', () => {
      expect(lib.isSalesSide('md')).toBe(false);
    });
  });

  describe('isMarketingSide()', () => {
    it('should return true for marketing roles (abbreviations)', () => {
      expect(lib.isMarketingSide('ma')).toBe(true);
      expect(lib.isMarketingSide('md')).toBe(true);
      expect(lib.isMarketingSide('marketer')).toBe(true);
    });
    it('should return false for non-marketing roles', () => {
      expect(lib.isMarketingSide('sales')).toBe(false);
    });
  });

  describe('getRoleLabel()', () => {
    it('should return a label for known roles', () => {
      expect(typeof lib.getRoleLabel('owner')).toBe('string');
    });
    it('should return role ID if not found', () => {
      expect(lib.getRoleLabel('nonexistent')).toBe('nonexistent');
    });
  });

  describe('getRoleType()', () => {
    it('should return type for known roles', () => {
      expect(lib.getRoleType('sales')).toBeDefined();
    });
  });
});
