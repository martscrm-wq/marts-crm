const lib = require('./lib');

beforeEach(() => { lib._reset(); });

describe('Governance — User Management Rules', () => {
  it('owner can manage everyone except owner', () => {
    lib.currentUser = { username: 'owner', role: 'owner' };
    expect(lib.canManageUser('selim')).toBe(true);
    expect(lib.canManageUser('anyone')).toBe(true);
    expect(lib.canManageUser('owner')).toBe(false);
  });
  it('super_admin cannot manage owner or super_admin', () => {
    lib.currentUser = { username: 'selim', role: 'super_admin' };
    expect(lib.canManageUser('owner')).toBe(false);
    expect(lib.canManageUser('super_admin')).toBe(false);
    expect(lib.canManageUser('talia')).toBe(true);
  });
  it('other roles cannot manage users', () => {
    lib.currentUser = { username: 'talia', role: 'operations' };
    expect(lib.canManageUser('selim')).toBe(false);
  });
  it('no currentUser -> no management', () => {
    expect(lib.canManageUser('x')).toBe(false);
  });
});

describe('Governance — Team Hierarchy & Separation', () => {
  it('getChildren returns direct reports only', () => {
    lib.STORAGE.set('users', [
      { username: 'a', parentId: '' },
      { username: 'b', parentId: 'a' },
      { username: 'c', parentId: 'a' },
      { username: 'd', parentId: 'b' }
    ]);
    const kids = lib.getChildren('a').map(u => u.username);
    expect(kids).toEqual(['b', 'c']);
  });
  it('getTeamUserIds returns full subtree', () => {
    lib.STORAGE.set('users', [
      { username: 'a', parentId: '' },
      { username: 'b', parentId: 'a' },
      { username: 'c', parentId: 'a' },
      { username: 'd', parentId: 'b' }
    ]);
    expect(lib.getTeamUserIds('a').sort()).toEqual(['a', 'b', 'c', 'd']);
  });
  it('getDirectReports mirrors children', () => {
    lib.STORAGE.set('users', [{ username: 'a' }, { username: 'b', parentId: 'a' }]);
    expect(lib.getDirectReports('a').map(u => u.username)).toEqual(['b']);
  });
  it('team/user role classification', () => {
    expect(lib.isSalesSide('sales')).toBe(true);
    expect(lib.isSalesSide('tl')).toBe(true);
    expect(lib.isSalesSide('operations')).toBe(false);
    expect(lib.isMarketingSide('md')).toBe(true);
    expect(lib.isMarketingSide('ma')).toBe(true);
    expect(lib.isMarketingSide('sales')).toBe(false);
  });
  it('isOwner / isAdmin for management roles', () => {
    lib.currentUser = { username: 'owner', role: 'owner' };
    expect(lib.isOwner()).toBe(true);
    expect(lib.isAdmin()).toBe(true);
    lib.currentUser = { username: 'selim', role: 'super_admin' };
    expect(lib.isOwner()).toBe(true); // super_admin counts as owner-class
    lib.currentUser = { username: 'samaher', role: 'head_of_sales' };
    expect(lib.isAdmin()).toBe(true);
    lib.currentUser = { username: 'talia', role: 'operations' };
    expect(lib.isAdmin()).toBe(false);
  });
});