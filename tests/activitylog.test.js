const lib = require('./lib');

beforeEach(() => { lib._reset(); });

describe('ActivityLog', () => {
  beforeEach(() => {
    lib.currentUser = { username: 'testuser' };
  });

  describe('log()', () => {
    it('should create a log entry', () => {
      lib.ActivityLog.log('auth_login', 'user', { method: 'password' });
      const logs = lib.ActivityLog.get();
      expect(logs.length).toBeGreaterThan(0);
    });
    it('should include correct fields', () => {
      lib.ActivityLog.log('data_update', 'treasury', { id: 't1' });
      const entry = lib.ActivityLog.get()[0];
      expect(entry).toHaveProperty('action', 'data_update');
      expect(entry).toHaveProperty('target', 'treasury');
      expect(entry).toHaveProperty('user', 'testuser');
      expect(entry).toHaveProperty('timestamp');
    });
    it('should prepend newest entries first', () => {
      lib.ActivityLog.log('auth_login', 'user', {});
      lib.ActivityLog.log('nav_page', 'dashboard', {});
      const logs = lib.ActivityLog.get();
      expect(logs[0].action).toBe('nav_page');
      expect(logs[1].action).toBe('auth_login');
    });
    it('should not exceed MAX_LOCAL limit', () => {
      for (let i = 0; i < 510; i++) {
        lib.ActivityLog.log('test_action', 'test', { i });
      }
      expect(lib.ActivityLog.get().length).toBeLessThanOrEqual(500);
    });
  });

  describe('get() with filters', () => {
    beforeEach(() => {
      lib.ActivityLog.log('auth_login', 'user', {});
      lib.ActivityLog.log('nav_page', 'dashboard', {});
      lib.ActivityLog.log('data_update', 'treasury', {});
      lib.ActivityLog.log('auth_login', 'user', {});
    });

    it('should filter by action', () => {
      const logs = lib.ActivityLog.get({ action: 'auth_login' });
      expect(logs.length).toBe(2);
    });
    it('should filter by target', () => {
      const logs = lib.ActivityLog.get({ target: 'treasury' });
      expect(logs.length).toBe(1);
    });
    it('should return all when no filter', () => {
      expect(lib.ActivityLog.get().length).toBe(4);
    });
  });

  describe('clear()', () => {
    it('should clear all logs', () => {
      lib.ActivityLog.log('test', 'test', {});
      lib.ActivityLog.clear();
      expect(lib.ActivityLog.get().length).toBe(0);
    });
  });
});
