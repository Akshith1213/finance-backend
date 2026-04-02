const request = require('supertest');
const app = require('../server');
const { sequelize, Role, User } = require('../src/models');

let adminToken;
let analystToken;
let viewerToken;
let recordId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  // Seed roles
  await Role.bulkCreate([
    { name: 'admin', permissions: ['users:read', 'users:write', 'users:delete', 'records:read', 'records:write', 'records:delete', 'dashboard:read'] },
    { name: 'analyst', permissions: ['records:read', 'records:write', 'dashboard:read'] },
    { name: 'viewer', permissions: ['records:read', 'dashboard:read'] },
  ]);

  // Register users
  await request(app).post('/api/auth/register').send({ username: 'fadmin', email: 'fadmin@test.com', password: 'Admin@123' });
  await request(app).post('/api/auth/register').send({ username: 'fanalyst', email: 'fanalyst@test.com', password: 'Analyst1' });
  await request(app).post('/api/auth/register').send({ username: 'fviewer', email: 'fviewer@test.com', password: 'Viewer@1' });

  // Promote admin & analyst
  const adminRole = await Role.findOne({ where: { name: 'admin' } });
  const analystRole = await Role.findOne({ where: { name: 'analyst' } });
  await User.update({ roleId: adminRole.id }, { where: { email: 'fadmin@test.com' } });
  await User.update({ roleId: analystRole.id }, { where: { email: 'fanalyst@test.com' } });

  // Get tokens
  const r1 = await request(app).post('/api/auth/login').send({ email: 'fadmin@test.com', password: 'Admin@123' });
  adminToken = r1.body.data.token;
  const r2 = await request(app).post('/api/auth/login').send({ email: 'fanalyst@test.com', password: 'Analyst1' });
  analystToken = r2.body.data.token;
  const r3 = await request(app).post('/api/auth/login').send({ email: 'fviewer@test.com', password: 'Viewer@1' });
  viewerToken = r3.body.data.token;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Financial Records CRUD', () => {
  test('POST /api/records - analyst can create a record', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${analystToken}`)
      .send({
        amount: 5000.00,
        type: 'income',
        category: 'salary',
        date: '2025-01-15',
        notes: 'Monthly salary',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.amount).toBe(5000);
    recordId = res.body.data.id;
  });

  test('POST /api/records - admin can create a record', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 1200.00,
        type: 'expense',
        category: 'rent',
        date: '2025-01-01',
        notes: 'Office rent',
      });

    expect(res.status).toBe(201);
  });

  test('POST /api/records - viewer cannot create a record', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        amount: 100,
        type: 'expense',
        category: 'food',
        date: '2025-01-10',
      });

    expect(res.status).toBe(403);
  });

  test('POST /api/records - validation rejects invalid data', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: -50,
        type: 'invalid',
        category: '',
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test('GET /api/records - should return paginated records', async () => {
    const res = await request(app)
      .get('/api/records')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(2);
  });

  test('GET /api/records?type=income - should filter by type', async () => {
    const res = await request(app)
      .get('/api/records?type=income')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((r) => {
      expect(r.type).toBe('income');
    });
  });

  test('GET /api/records/:id - should get a single record', async () => {
    const res = await request(app)
      .get(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(recordId);
  });

  test('PUT /api/records/:id - analyst can update own record', async () => {
    const res = await request(app)
      .put(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ amount: 6000.00, notes: 'Updated salary' });

    expect(res.status).toBe(200);
    expect(parseFloat(res.body.data.amount)).toBe(6000);
  });

  test('DELETE /api/records/:id - analyst cannot delete records', async () => {
    const res = await request(app)
      .delete(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(403);
  });

  test('DELETE /api/records/:id - admin can delete records', async () => {
    const res = await request(app)
      .delete(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});
