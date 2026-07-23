const lib = require('./lib');

beforeEach(() => { lib._reset(); });

describe('STORAGE', () => {
  it('should return default for non-existent key', () => {
    expect(lib.STORAGE.get('nonexistent', 'defaultVal')).toBe('defaultVal');
  });
  it('should return stored value', () => {
    lib.STORAGE.set('testKey', { foo: 'bar' });
    expect(lib.STORAGE.get('testKey')).toEqual({ foo: 'bar' });
  });
  it('should handle arrays', () => {
    lib.STORAGE.set('arr', [1, 2, 3]);
    expect(lib.STORAGE.get('arr')).toEqual([1, 2, 3]);
  });
  it('should overwrite existing values', () => {
    lib.STORAGE.set('key1', 'old');
    lib.STORAGE.set('key1', 'new');
    expect(lib.STORAGE.get('key1')).toBe('new');
  });
});

describe('safeStorage', () => {
  it('should store and retrieve strings', () => {
    lib.safeStorage.set('test', 'hello');
    expect(lib.safeStorage.get('test')).toBe('hello');
  });
  it('should return null for missing keys', () => {
    expect(lib.safeStorage.get('missing')).toBeNull();
  });
  it('should remove keys', () => {
    lib.safeStorage.set('test', 'hello');
    lib.safeStorage.remove('test');
    expect(lib.safeStorage.get('test')).toBeNull();
  });
  it('should clear all', () => {
    lib.safeStorage.set('a', '1');
    lib.safeStorage.set('b', '2');
    lib.safeStorage.clear();
    expect(lib.safeStorage.get('a')).toBeNull();
  });
});

describe('Lock Functions', () => {
  beforeEach(() => {
    lib.STORAGE.set('treasury', [
      { id: 't1', amount: 100, locked: false },
      { id: 't2', amount: 200, locked: true },
    ]);
  });

  describe('isLocked()', () => {
    it('should return true for locked entry', () => {
      expect(lib.isLocked('treasury', 't2')).toBe(true);
    });
    it('should return false for unlocked entry', () => {
      expect(lib.isLocked('treasury', 't1')).toBe(false);
    });
    it('should return false for non-existent entry', () => {
      expect(lib.isLocked('treasury', 'nonexistent')).toBe(false);
    });
    it('should support custom idField', () => {
      lib.STORAGE.set('chartOfAccounts', [{ code: '1001', name: 'Cash', locked: true }]);
      expect(lib.isLocked('chartOfAccounts', '1001', 'code')).toBe(true);
    });
  });

  describe('toggleLockEntry()', () => {
    it('should unlock a locked entry', () => {
      lib.toggleLockEntry('treasury', 't2');
      const data = lib.STORAGE.get('treasury');
      expect(data.find(e => e.id === 't2').locked).toBe(false);
    });
    it('should lock an unlocked entry', () => {
      lib.toggleLockEntry('treasury', 't1');
      const data = lib.STORAGE.get('treasury');
      expect(data.find(e => e.id === 't1').locked).toBe(true);
    });
    it('should toggle twice and return to original', () => {
      lib.toggleLockEntry('treasury', 't1');
      lib.toggleLockEntry('treasury', 't1');
      expect(lib.STORAGE.get('treasury').find(e => e.id === 't1').locked).toBe(false);
    });
  });
});
