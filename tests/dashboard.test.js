const request = require('supertest');
const app = require('../server');
const { sequelize, Role, User } = require('../src/models');

let adminToken;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  // Seed roles
  await Role.bulkCreate([
    { name: 'admin', permissions: ['users:read', 'users:write', 'users:delete', 'records:read', 'records:write', 'records:delete', 'dashboard:read'] },
    { name: 'analyst', permissions: ['records:read', 'records:write', 'dashboard:read'] },
    { name: 'viewer', permissions: ['records:read', 'dashboard:read'] },
  ]);

  // Register & promote admin
  await request(app).post('/api/auth/register').send({ username: 'dadmin', email: 'dadmin@test.com', password: 'Admin@123' });
  const adminRole = await Role.findOne({ where: { name: 'admin' } });
  await User.update({ roleId: adminRole.id }, { where: { email: 'dadmin@test.com' } });
  const loginRes = await request(app).post('/api/auth/login').send({ email: 'dadmin@test.com', password: 'Admin@123' });
  adminToken = loginRes.body.data.token;

  // Seed some financial records
  const records = [
    { amount: 5000, type: 'income', category: 'salary', date: '2025-01-15', notes: 'Jan salary' },
    { amount: 3000, type: 'income', category: 'freelance', date: '2025-01-20', notes: 'Client project' },
    { amount: 1200, type: 'expense', category: 'rent', date: '2025-01-01', notes: 'Office rent' },
    { amount: 300, type: 'expense', category: 'utilities', date: '2025-01-05', notes: 'Electric bill' },
    { amount: 6000, type: 'income', category: 'salary', date: '2025-02-15', notes: 'Feb salary' },
    { amount: 1200, type: 'expense', category: 'rent', date: '2025-02-01', notes: 'Feb rent' },
    { amount: 200, type: 'expense', category: 'food', date: '2025-02-10', notes: 'Team lunch' },
  ];

  for (const r of records) {
    await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(r);
  }
});

afterAll(async () => {
  await sequelize.close();
});

describe('Dashboard Endpoints', () => {
  test('GET /api/dashboard/summary - should return correct totals', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalIncome).toBe(14000);
    expect(res.body.data.totalExpenses).toBe(2900);
    expect(res.body.data.netBalance).toBe(11100);
  });

  test('GET /api/dashboard/categories - should return category breakdown', async () => {
    const res = await request(app)
      .get('/api/dashboard/categories')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.income).toBeDefined();
    expect(res.body.data.expenses).toBeDefined();
    expect(Array.isArray(res.body.data.income)).toBe(true);

    // Check salary category exists in income
    const salary = res.body.data.income.find((c) => c.category === 'salary');
    expect(salary).toBeDefined();
    expect(salary.total).toBe(11000);
  });

  test('GET /api/dashboard/trends - should return monthly trends', async () => {
    const res = await request(app)
      .get('/api/dashboard/trends?period=monthly')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);

    // Each trend entry should have income, expense, net
    res.body.data.forEach((t) => {
      expect(t.period).toBeDefined();
      expect(typeof t.income).toBe('number');
      expect(typeof t.expense).toBe('number');
      expect(typeof t.net).toBe('number');
    });
  });

  test('GET /api/dashboard/summary - unauthenticated should be rejected', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(401);
  });
});
