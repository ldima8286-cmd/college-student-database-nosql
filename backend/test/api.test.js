import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-0123456789-0123456789';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-0123456789-0123456';
process.env.RESET_TOKEN_SECRET = 'test-reset-secret-0123456789-012345678';
process.env.ADMIN_EMAIL = 'admin@college.local';
process.env.ADMIN_PASSWORD = 'admin123';
process.env.CURATOR_EMAIL = 'curator@college.local';
process.env.CURATOR_PASSWORD = 'curator123';
process.env.CURATOR_GROUP = 'ПО-507';

let mongod;
let app;
let db;

function csrfFrom(res) {
  const cookies = res.headers['set-cookie'] ?? [];
  const cookie = cookies.find((value) => value.startsWith('x_csrf='));
  return cookie ? cookie.split(';')[0].slice('x_csrf='.length) : '';
}

async function login(agent, email, password) {
  const res = await agent.post('/api/auth/login').send({ email, password });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  return csrfFrom(res);
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri('college_test');
  db = await import('../src/db.js');
  await db.initDb();
  const { seedUsers } = await import('../src/seed.js');
  await seedUsers();
  ({ app } = await import('../src/app.js'));
});

after(async () => {
  await db.disconnectDb();
  await mongod.stop();
});

describe('health and auth', () => {
  it('returns health status', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'ok');
  });

  it('logs in and returns the current user without passwordHash', async () => {
    const agent = request.agent(app);
    const csrf = await login(agent, 'admin@college.local', 'admin123');
    assert.ok(csrf);
    const res = await agent.get('/api/auth/me');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.role, 'admin');
    assert.equal(res.body.data.passwordHash, undefined);
  });

  it('rejects a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@college.local', password: 'wrong' });
    assert.equal(res.status, 401);
  });
});

describe('students and statistics', () => {
  it('creates, searches and updates a student', async () => {
    const agent = request.agent(app);
    const csrf = await login(agent, 'admin@college.local', 'admin123');

    const created = await agent
      .post('/api/students')
      .set('X-CSRF-Token', csrf)
      .send({
        fullName: 'Иванов Иван Иванович',
        course: 2,
        group: 'ПО-507',
        specialty: 'Программирование',
        attendance: 90,
        performance: 7.5,
        academicDebt: false,
        email: 'ivanov@college.local',
        phone: '+375 (29) 123-45-67',
      });
    assert.equal(created.status, 201);
    assert.ok(created.body.data.id);

    const id = created.body.data.id;
    const list = await agent.get('/api/students').query({ search: 'Иванов' });
    assert.equal(list.status, 200);
    assert.equal(list.body.total, 1);
    assert.equal(list.body.data[0].fullName, 'Иванов Иван Иванович');

    const toggled = await agent
      .patch(`/api/students/${id}/toggle-debt`)
      .set('X-CSRF-Token', csrf);
    assert.equal(toggled.status, 200);
    assert.equal(toggled.body.data.academicDebt, true);

    const stats = await agent.get('/api/students/stats');
    assert.equal(stats.body.data.total, 1);
    assert.equal(stats.body.data.withDebt, 1);
    assert.equal(stats.body.data.byGroupStats[0].group, 'ПО-507');
  });

  it('imports students in a batch and skips duplicates', async () => {
    const agent = request.agent(app);
    const csrf = await login(agent, 'admin@college.local', 'admin123');
    const row = {
      fullName: 'Петров Пётр Петрович',
      course: 3,
      group: 'ПО-507',
      specialty: 'Базы данных',
      attendance: 80,
      performance: 6,
      academicDebt: false,
      email: null,
      phone: null,
    };
    const first = await agent
      .post('/api/students/batch-import')
      .set('X-CSRF-Token', csrf)
      .send({ students: [row, row] });
    assert.equal(first.status, 201);
    assert.equal(first.body.data.created, 1);
    assert.equal(first.body.data.skipped, 1);
  });
});

describe('curator isolation', () => {
  it('shows a curator only students of their own group', async () => {
    const admin = request.agent(app);
    const adminCsrf = await login(admin, 'admin@college.local', 'admin123');
    await admin.post('/api/students').set('X-CSRF-Token', adminCsrf).send({
      fullName: 'Сидоров Сидор Сидорович',
      course: 1,
      group: 'ИС-101',
      specialty: 'Информационные системы',
      attendance: 100,
      performance: 5,
      academicDebt: false,
      email: null,
      phone: null,
    });

    const curator = request.agent(app);
    await login(curator, 'curator@college.local', 'curator123');
    const res = await curator.get('/api/students');
    assert.equal(res.status, 200);
    assert.ok(res.body.data.length > 0);
    assert.ok(res.body.data.every((student) => student.group === 'ПО-507'));

    const forcedApproved = await curator.get('/api/students').query({ status: 'pending' });
    assert.ok(forcedApproved.body.data.every((student) => student.status === 'approved'));
  });
});

describe('subjects, schedule, journal and marks', () => {
  it('creates a subject, a lesson, saves the journal and exposes marks', async () => {
    const agent = request.agent(app);
    const csrf = await login(agent, 'admin@college.local', 'admin123');

    const subject = await agent
      .post('/api/subjects')
      .set('X-CSRF-Token', csrf)
      .send({ name: 'Веб-разработка' });
    assert.equal(subject.status, 201);

    const schedule = await agent
      .post('/api/schedule')
      .set('X-CSRF-Token', csrf)
      .send({
        group: 'ПО-507',
        dayOfWeek: 5,
        lessonNumber: 3,
        subject: 'Веб-разработка',
        teacher: 'Смирнов',
        room: '201',
        week: null,
      });
    assert.equal(schedule.status, 201);

    const lessonId = schedule.body.data.id;
    const date = '2026-10-30';
    const summary = await agent.get('/api/journal/summary').query({ group: 'ПО-507', date });
    assert.equal(summary.status, 200);
    assert.ok(summary.body.data.some((lesson) => lesson.scheduleId === lessonId));

    const lesson = await agent.get(`/api/journal/${lessonId}`).query({ date });
    assert.equal(lesson.status, 200);
    assert.ok(lesson.body.data.students.length > 0);
    const studentId = lesson.body.data.students[0].studentId;

    const saved = await agent
      .put(`/api/journal/${lessonId}`)
      .set('X-CSRF-Token', csrf)
      .send({ date, entries: [{ studentId, mark: 9, status: 'present' }] });
    assert.equal(saved.status, 200);
    const row = saved.body.data.students.find((student) => student.studentId === studentId);
    assert.equal(row.mark, 9);
    assert.equal(row.status, 'present');

    const marks = await agent.get(`/api/students/${studentId}/marks`);
    assert.equal(marks.status, 200);
    assert.ok(marks.body.data.some((mark) => mark.mark === 9));
  });
});

describe('audit', () => {
  it('records administrator actions', async () => {
    const agent = request.agent(app);
    await login(agent, 'admin@college.local', 'admin123');
    const res = await agent.get('/api/audit-logs').query({ limit: 100 });
    assert.equal(res.status, 200);
    assert.ok(res.body.total > 0);
    assert.ok(res.body.data.some((entry) => entry.entity === 'student'));
  });
});
