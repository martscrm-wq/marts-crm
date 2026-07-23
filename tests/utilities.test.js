const lib = require('./lib');

beforeEach(() => { lib._reset(); });

describe('Utility Functions', () => {
  describe('uid()', () => {
    it('should generate a unique ID', () => {
      const id1 = lib.uid();
      const id2 = lib.uid();
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });
    it('should start with "id_"', () => {
      expect(lib.uid()).toMatch(/^id_/);
    });
  });

  describe('fmt()', () => {
    it('should format number as EGP currency', () => {
      const result = lib.fmt(1234567);
      expect(result).toContain('1');
    });
    it('should handle zero', () => {
      expect(lib.fmt(0)).toBeDefined();
    });
  });

  describe('today()', () => {
    it('should return YYYY-MM-DD format', () => {
      expect(lib.today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('daysBetween()', () => {
    it('should return 0 for same dates', () => {
      expect(lib.daysBetween('2024-01-01', '2024-01-01')).toBe(0);
    });
    it('should calculate days between two dates', () => {
      expect(lib.daysBetween('2024-01-01', '2024-01-10')).toBe(9);
    });
    it('should handle reverse order', () => {
      expect(lib.daysBetween('2024-01-10', '2024-01-01')).toBe(-9);
    });
  });

  describe('addDays()', () => {
    it('should add days correctly', () => {
      expect(lib.addDays('2024-01-01', 10)).toBe('2024-01-11');
    });
    it('should handle month boundaries', () => {
      expect(lib.addDays('2024-01-30', 5)).toBe('2024-02-04');
    });
  });

  describe('getInitials()', () => {
    it('should return first two initials', () => {
      expect(lib.getInitials('John Smith')).toBe('JS');
    });
    it('should handle single name', () => {
      expect(lib.getInitials('Ahmed')).toBe('AH');
    });
  });

  describe('genSaleCode()', () => {
    it('should generate MRT-0001 for empty sales', () => {
      expect(lib.genSaleCode()).toBe('MRT-0001');
    });
    it('should generate sequential code', () => {
      lib.STORAGE.set('sales', [{id:1},{id:2},{id:3}]);
      expect(lib.genSaleCode()).toBe('MRT-0004');
    });
  });

  describe('getNextPayoutDate()', () => {
    it('should return a date string', () => {
      const result = lib.getNextPayoutDate('2024-01-01', 30);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
