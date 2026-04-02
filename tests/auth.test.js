const request = require('supertest');
const app = require('../server');
const { sequelize, Role, User } = require('../src/models');

let adminToken;
let viewerToken;
let analystToken;
let testUserId;

beforeAll(async () => {
  // Sync DB (in-memory for testing via env override is not needed — we use the same sqlite)
  await sequelize.sync({ force: true });

  // Create roles
  await Role.bulkCreate([
    { name: 'admin', permissions: ['users:read', 'users:write', 'users:delete', 'records:read', 'records:write', 'records:delete', 'dashboard:read'] },
    { name: 'analyst', permissions: ['records:read', 'records:write', 'dashboard:read'] },
    { name: 'viewer', permissions: ['records:read', 'dashboard:read'] },
  ]);
});

afterAll(async () => {
  await sequelize.close();
});

describe('Auth Endpoints', () => {
  test('POST /api/auth/register - should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testadmin',
        email: 'admin@test.com',
        password: 'Admin@123',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('admin@test.com');
    expect(res.body.data.user.role.name).toBe('viewer'); // Default role

    // Promote to admin for further tests
    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    const user = await User.findOne({ where: { email: 'admin@test.com' } });
    user.roleId = adminRole.id;
    await user.save();

    // Re-login as admin
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin@123' });
    adminToken = loginRes.body.data.token;
  });

  test('POST /api/auth/register - should register a viewer', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testviewer',
        email: 'viewer@test.com',
        password: 'Viewer@123',
      });

    expect(res.status).toBe(201);
    viewerToken = res.body.data.token;
    testUserId = res.body.data.user.id;
  });

  test('POST /api/auth/register - should register an analyst', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testanalyst',
        email: 'analyst@test.com',
        password: 'Analyst1',
      });

    expect(res.status).toBe(201);

    // Promote to analyst
    const analystRole = await Role.findOne({ where: { name: 'analyst' } });
    const user = await User.findOne({ where: { email: 'analyst@test.com' } });
    user.roleId = analystRole.id;
    await user.save();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'analyst@test.com', password: 'Analyst1' });
    analystToken = loginRes.body.data.token;
  });

  test('POST /api/auth/register - should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'another',
        email: 'admin@test.com',
        password: 'Admin@123',
      });

    expect(res.status).toBe(409);
  });

  test('POST /api/auth/register - should reject weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'weakuser',
        email: 'weak@test.com',
        password: 'weak',
      });

    expect(res.status).toBe(400);
  });

  test('POST /api/auth/login - should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin@123' });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  test('POST /api/auth/login - should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });
});

describe('User Management Endpoints', () => {
  test('GET /api/users - admin can list all users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
  });

  test('GET /api/users - viewer cannot list users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });

  test('PATCH /api/users/:id/status - admin can deactivate user', async () => {
    const res = await request(app)
      .patch(`/api/users/${testUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);

    // Reactivate for later tests
    await request(app)
      .patch(`/api/users/${testUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: true });
  });
});
