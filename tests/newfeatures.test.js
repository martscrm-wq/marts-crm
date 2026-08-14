const lib = require('./lib');

beforeEach(() => { lib._reset(); });

describe('Social Insurance (Law 148/2019)', () => {
  it('employee rate 11% under cap', () => {
    expect(lib.calcSocialInsurance(10000, false)).toBe(1100);
  });
  it('employer rate 18.75% under cap', () => {
    expect(lib.calcSocialInsurance(10000, true)).toBe(1875);
  });
  it('caps insurable salary at 12600', () => {
    expect(lib.calcSocialInsurance(20000, false)).toBe(1386); // 12600 * 0.11
    expect(lib.calcSocialInsurance(20000, true)).toBe(2363); // 12600 * 0.1875 = 2362.5 -> 2363
  });
  it('zero salary gives zero insurance', () => {
    expect(lib.calcSocialInsurance(0, false)).toBe(0);
    expect(lib.calcSocialInsurance(undefined, true)).toBe(0);
  });
});

describe('Income Tax Brackets (progressive monthly)', () => {
  it('below 15000 EGP annual is tax-free', () => {
    expect(lib.calcIncomeTaxMonthly(1000)).toBe(0); // 12000 annual
  });
  it('applies 2.5% band between 15000-30000', () => {
    expect(lib.calcIncomeTaxMonthly(2000)).toBe(19); // annual 24000: (24000-15000)*0.025=225 -> /12 = 18.75 -> 19
  });
  it('progressive bands: 120000 annual', () => {
    // 0*15000 + .025*15000 + .10*15000 + .15*15000 + .20*60000 = 16125 -> /12 = 1343.75 -> 1344
    expect(lib.calcIncomeTaxMonthly(10000)).toBe(1344);
  });
  it('top band 25% above 400000', () => {
    // annual 600000: bands up to 400000: 0*15000+.025*15000+.10*15000+.15*15000+.20*140000+.225*200000 = 375+1500+2250+28000+45000 = 77125, + .25*200000=50000 => 127125/12 = 10593.75 -> 10594
    expect(lib.calcIncomeTaxMonthly(50000)).toBe(10594);
  });
});

describe('Annual Leave Entitlement', () => {
  it('21 days under 10 years of service', () => {
    expect(lib.annualLeaveEntitlement({ hireDate: '2020-01-01' })).toBe(21);
  });
  it('30 days at 10+ years of service', () => {
    expect(lib.annualLeaveEntitlement({ hireDate: '2010-01-01' })).toBe(30);
  });
  it('30 days at age 50+ regardless of service', () => {
    expect(lib.annualLeaveEntitlement({ hireDate: '2024-01-01', age: 55 })).toBe(30);
  });
  it('30 days when both conditions met', () => {
    expect(lib.annualLeaveEntitlement({ hireDate: '2000-01-01', age: 60 })).toBe(30);
  });
  it('serviceYears returns 0 when no hire date', () => {
    expect(lib.serviceYears({})).toBe(0);
  });
  it('isAnnualVacation matches id/ar/en', () => {
    expect(lib.isAnnualVacation({ id: 'annual_leave' })).toBe(true);
    expect(lib.isAnnualVacation({ ar: 'إجازة سنوية' })).toBe(true);
    expect(lib.isAnnualVacation({ en: 'Annual Leave' })).toBe(true);
    expect(lib.isAnnualVacation({ id: 'sick' })).toBe(false);
  });
});

describe('Approved Advances Repayment', () => {
  it('sums only approved advances of the employee', () => {
    lib.STORAGE.set('employeeAdvances', [
      { empId: 'e1', amount: 500, status: 'approved' },
      { empId: 'e1', amount: 300, status: 'approved' },
      { empId: 'e1', amount: 700, status: 'pending' },
      { empId: 'e2', amount: 900, status: 'approved' }
    ]);
    expect(lib.calcAdvanceRepayment('e1')).toBe(800);
  });
  it('returns 0 when none', () => {
    expect(lib.calcAdvanceRepayment('nobody')).toBe(0);
  });
});

describe('Fixed Assets Depreciation', () => {
  it('straight-line monthly: (cost - salvage) / (life*12)', () => {
    expect(lib.calcAssetMonthlyDep({ cost: 100000, salvage: 10000, usefulLife: 5 })).toBe(1500);
  });
  it('rounds to 2 decimals', () => {
    expect(lib.calcAssetMonthlyDep({ cost: 1000, salvage: 0, usefulLife: 3 })).toBe(27.78); // 1000/36 = 27.777... -> 27.78
  });
  it('one-year asset fully depreciates monthly', () => {
    expect(lib.calcAssetMonthlyDep({ cost: 12000, salvage: 0, usefulLife: 1 })).toBe(1000);
  });
  it('never negative when salvage > cost', () => {
    expect(lib.calcAssetMonthlyDep({ cost: 100, salvage: 500, usefulLife: 2 })).toBe(0);
  });
  it('zero cost gives zero', () => {
    expect(lib.calcAssetMonthlyDep({ cost: 0, usefulLife: 5 })).toBe(0);
  });
});

describe('escapeHtml (XSS hardening)', () => {
  it('escapes HTML entities', () => {
    expect(lib.escapeHtml('<b>&"\'')).toBe('&lt;b&gt;&amp;&quot;&#39;');
  });
  it('returns empty for null/undefined', () => {
    expect(lib.escapeHtml(null)).toBe('');
    expect(lib.escapeHtml(undefined)).toBe('');
  });
  it('passes through safe strings', () => {
    expect(lib.escapeHtml('سلام 2026')).toBe('سلام 2026');
  });
  it('stringifies numbers', () => {
    expect(lib.escapeHtml(42)).toBe('42');
  });
});