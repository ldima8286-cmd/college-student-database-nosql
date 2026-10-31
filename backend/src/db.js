import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { env } from './env.js';
import {
  Student, User, Subject, Schedule, Mark, Attendance, AuditLog, RefreshSession, Setting, models,
} from './models.js';

/**
 * Слой доступа к MongoDB.
 *
 * Все функции повторяют контракт SQL-версии (db.ts), поэтому маршруты
 * остаются прежними. Отличия нереляционной реализации:
 *   - вместо JOIN-ов — отдельные выборки и aggregation pipeline;
 *   - вместо каскадных внешних ключей — явное удаление связанных документов;
 *   - вместо AUTOINCREMENT — UUID, который генерирует приложение.
 */

const APPROVED = { status: 'approved' };
const pad2 = (n) => String(n).padStart(2, '0');

export function defaultSemesterStart(date = new Date()) {
  const acadY = date.getUTCMonth() + 1 >= 9 ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
  const sept1 = Date.UTC(acadY, 8, 1);
  const dow = new Date(sept1).getUTCDay();
  const toMonday = (dow + 6) % 7;
  const monday = new Date(sept1 - toMonday * 86400000);
  return `${monday.getUTCFullYear()}-${pad2(monday.getUTCMonth() + 1)}-${pad2(monday.getUTCDate())}`;
}

export function weekOfDate(date, semesterStart = defaultSemesterStart()) {
  const [y, m, d] = date.split('-').map(Number);
  const [sy, sm, sd] = semesterStart.split('-').map(Number);
  const days = (Date.UTC(y, m - 1, d) - Date.UTC(sy, sm - 1, sd)) / 86400000;
  return Math.floor(days / 7) % 2 === 0 ? 'lower' : 'upper';
}

function isoDow(date) {
  const [y, m, d] = date.split('-').map(Number);
  return ((new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7) + 1;
}

function plain(doc) {
  if (!doc) return undefined;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj._id;
  delete obj.__v;
  return obj;
}

function plainList(docs) {
  return docs.map(plain);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function definedFields(data) {
  const out = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

function studentFilter({
  search, filterDebt, filterCourse, filterStatus, filterGroup,
}) {
  const filter = {};
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [
      { fullName: rx }, { group: rx }, { specialty: rx }, { email: rx }, { phone: rx },
    ];
  }
  if (filterDebt !== undefined) filter.academicDebt = filterDebt;
  if (filterCourse !== undefined) filter.course = filterCourse;
  if (filterStatus !== undefined) filter.status = filterStatus;
  if (filterGroup !== undefined) filter.group = filterGroup;
  return filter;
}

const ALLOWED_SORTS = new Set(['fullName', 'course', 'group', 'specialty', 'attendance', 'performance', 'createdAt']);

export async function getAllStudents(
  search, page = 1, limit = 50, sortBy = 'fullName', sortOrder = 'asc',
  filterDebt, filterCourse, filterStatus, filterGroup,
) {
  const safeSortBy = ALLOWED_SORTS.has(sortBy) ? sortBy : 'fullName';
  const safeOrder = sortOrder === 'desc' ? -1 : 1;
  const filter = studentFilter({
    search, filterDebt, filterCourse, filterStatus, filterGroup,
  });

  const [students, total] = await Promise.all([
    Student.find(filter)
      .sort({ [safeSortBy]: safeOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Student.countDocuments(filter),
  ]);
  return { students: plainList(students), total };
}

export async function getStudentById(id) {
  return plain(await Student.findOne({ id }).lean());
}

export async function getStudentByUserId(userId) {
  return plain(await Student.findOne({ userId }).lean());
}

export async function createStudent(data) {
  const now = new Date().toISOString();
  const doc = await Student.create({
    id: crypto.randomUUID(),
    fullName: data.fullName,
    course: data.course,
    group: data.group,
    specialty: data.specialty,
    attendance: data.attendance ?? 100,
    performance: data.performance ?? 4,
    academicDebt: data.academicDebt ?? false,
    email: data.email ?? null,
    phone: data.phone ?? null,
    userId: data.userId ?? null,
    status: data.status ?? 'approved',
    createdAt: now,
    updatedAt: now,
  });
  return plain(doc);
}

export async function createStudentsBatch(rows, idsOut) {
  const now = new Date().toISOString();
  const docs = rows.map((data) => {
    const id = crypto.randomUUID();
    idsOut.push(id);
    return {
      id,
      fullName: data.fullName,
      course: data.course,
      group: data.group,
      specialty: data.specialty,
      attendance: data.attendance ?? 100,
      performance: data.performance ?? 4,
      academicDebt: data.academicDebt ?? false,
      email: data.email ?? null,
      phone: data.phone ?? null,
      userId: data.userId ?? null,
      status: data.status ?? 'approved',
      createdAt: now,
      updatedAt: now,
    };
  });
  if (docs.length === 0) return [];
  const inserted = await Student.insertMany(docs, { ordered: false });
  return plainList(inserted);
}

export async function updateStudent(id, data) {
  const patch = definedFields(data);
  patch.updatedAt = new Date().toISOString();
  const doc = await Student.findOneAndUpdate({ id }, { $set: patch }, { new: true }).lean();
  return plain(doc);
}

export async function deleteStudent(id) {
  const [students] = await Promise.all([
    Student.deleteOne({ id }),
    Mark.deleteMany({ studentId: id }),
    Attendance.deleteMany({ studentId: id }),
  ]);
  return students.deletedCount > 0;
}

export async function toggleDebt(id) {
  const existing = await Student.findOne({ id }).lean();
  if (!existing) return null;
  const doc = await Student.findOneAndUpdate(
    { id },
    { $set: { academicDebt: !existing.academicDebt, updatedAt: new Date().toISOString() } },
    { new: true },
  ).lean();
  return plain(doc);
}

export async function deleteAllStudents() {
  const [students] = await Promise.all([
    Student.deleteMany({}),
    Mark.deleteMany({}),
    Attendance.deleteMany({}),
  ]);
  return students.deletedCount;
}

export async function getStudentsByIds(ids) {
  if (ids.length === 0) return [];
  return plainList(await Student.find({ id: { $in: ids } }).lean());
}

export async function deleteStudentsByIds(ids) {
  if (ids.length === 0) return 0;
  const [students] = await Promise.all([
    Student.deleteMany({ id: { $in: ids } }),
    Mark.deleteMany({ studentId: { $in: ids } }),
    Attendance.deleteMany({ studentId: { $in: ids } }),
  ]);
  return students.deletedCount;
}

export async function updateStudentsByIds(ids, data) {
  if (ids.length === 0) return 0;
  const patch = definedFields(data);
  if (Object.keys(patch).length === 0) return 0;
  patch.updatedAt = new Date().toISOString();
  const result = await Student.updateMany({ id: { $in: ids } }, { $set: patch });
  return result.modifiedCount;
}

function round2(value) {
  return Number(Number(value ?? 0).toFixed(2));
}

export async function getStats() {
  const [total, withDebt, avgs, courseRows, groupRows, specRows] = await Promise.all([
    Student.countDocuments(APPROVED),
    Student.countDocuments({ ...APPROVED, academicDebt: true }),
    Student.aggregate([
      { $match: APPROVED },
      { $group: { _id: null, a: { $avg: '$attendance' }, p: { $avg: '$performance' } } },
    ]),
    Student.aggregate([
      { $match: APPROVED },
      {
        $group: {
          _id: '$course',
          count: { $sum: 1 },
          avgPerformance: { $avg: '$performance' },
          avgAttendance: { $avg: '$attendance' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Student.aggregate([
      { $match: APPROVED },
      {
        $group: {
          _id: '$group',
          count: { $sum: 1 },
          avgPerformance: { $avg: '$performance' },
          avgAttendance: { $avg: '$attendance' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Student.aggregate([
      { $match: APPROVED },
      { $group: { _id: '$specialty', count: { $sum: 1 } } },
    ]),
  ]);

  const byCourse = {};
  const byCourseStats = courseRows.map((row) => {
    byCourse[row._id] = row.count;
    return {
      course: row._id,
      count: row.count,
      avgPerformance: round2(row.avgPerformance),
      avgAttendance: Math.round(row.avgAttendance ?? 0),
    };
  });
  const byGroupStats = groupRows.map((row) => ({
    group: row._id,
    count: row.count,
    avgPerformance: round2(row.avgPerformance),
    avgAttendance: Math.round(row.avgAttendance ?? 0),
  }));
  const bySpecialty = {};
  for (const row of specRows) bySpecialty[row._id] = row.count;

  return {
    total,
    withDebt,
    avgAttendance: Math.round(avgs[0]?.a ?? 0),
    avgPerformance: round2(avgs[0]?.p ?? 0),
    byCourse,
    byCourseStats,
    byGroupStats,
    bySpecialty,
  };
}

export async function getStudentsBySpecialty() {
  const rows = await Student.aggregate([
    { $match: APPROVED },
    {
      $group: {
        _id: '$specialty',
        count: { $sum: 1 },
        avgPerformance: { $avg: '$performance' },
        avgAttendance: { $avg: '$attendance' },
      },
    },
    { $sort: { count: -1 } },
  ]);
  return rows.map((row) => ({
    specialty: row._id,
    count: row.count,
    avgPerformance: round2(row.avgPerformance),
    avgAttendance: Math.round(row.avgAttendance ?? 0),
  }));
}

export async function getStudentsByCourse() {
  const rows = await Student.aggregate([
    { $match: APPROVED },
    {
      $group: {
        _id: '$course',
        count: { $sum: 1 },
        withDebt: { $sum: { $cond: ['$academicDebt', 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((row) => ({ course: row._id, count: row.count, withDebt: row.withDebt }));
}

export async function getRecentStudents(limit = 5) {
  return plainList(
    await Student.find(APPROVED).sort({ createdAt: -1 }).limit(limit).lean(),
  );
}

export async function logAudit(action, entity, entityId, userId, details) {
  await AuditLog.create({
    id: crypto.randomUUID(),
    action,
    entity,
    entityId: entityId ?? null,
    userId: userId ?? null,
    details: details ?? null,
    createdAt: new Date().toISOString(),
  });
}

export async function getAuditLogs(page = 1, limit = 50, entity, action) {
  const filter = {};
  if (entity) filter.entity = entity;
  if (action) filter.action = action;
  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);
  return { data: plainList(logs), total };
}

export async function clearAuditLogs() {
  const result = await AuditLog.deleteMany({});
  return result.deletedCount;
}

export async function pruneAuditLogs() {
  let deleted = 0;
  const authNoise = await AuditLog.deleteMany({
    action: { $in: ['login', 'logout'] }, entity: 'auth', userId: 'user',
  });
  deleted += authNoise.deletedCount;

  const cutoff = new Date(Date.now() - env.AUDIT_RETENTION_DAYS * 86400000).toISOString();
  const old = await AuditLog.deleteMany({ createdAt: { $lt: cutoff } });
  deleted += old.deletedCount;

  const total = await AuditLog.countDocuments({});
  if (total > env.AUDIT_MAX_ROWS) {
    const extra = await AuditLog.find({})
      .sort({ createdAt: -1 })
      .skip(env.AUDIT_MAX_ROWS)
      .select({ id: 1 })
      .lean();
    if (extra.length > 0) {
      const removed = await AuditLog.deleteMany({ id: { $in: extra.map((row) => row.id) } });
      deleted += removed.deletedCount;
    }
  }
  return deleted;
}

export async function saveRefreshSession(jti, userId, expiresAt) {
  await RefreshSession.updateOne({ jti }, { $set: { jti, userId, expiresAt } }, { upsert: true });
}

export async function getRefreshSession(jti) {
  return plain(await RefreshSession.findOne({ jti }).lean());
}

export async function deleteRefreshSession(jti) {
  const result = await RefreshSession.deleteOne({ jti });
  return result.deletedCount > 0;
}

export async function deleteRefreshSessionsByUserId(userId) {
  const result = await RefreshSession.deleteMany({ userId });
  return result.deletedCount;
}

export async function findUserByEmail(email) {
  return plain(await User.findOne({ email: email.toLowerCase() }).lean());
}

export async function getUserById(id) {
  return plain(await User.findOne({ id }).lean());
}

export async function createUser(data) {
  const now = new Date().toISOString();
  const doc = await User.create({
    id: crypto.randomUUID(),
    email: data.email.toLowerCase(),
    passwordHash: data.passwordHash,
    fullName: data.fullName,
    role: data.role ?? 'user',
    avatar: data.avatar ?? null,
    phone: data.phone ?? null,
    group: data.group ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return plain(doc);
}

export async function updateUser(id, data) {
  const patch = definedFields(data);
  patch.updatedAt = new Date().toISOString();
  return plain(await User.findOneAndUpdate({ id }, { $set: patch }, { new: true }).lean());
}

export async function updateUserPassword(id, passwordHash) {
  const result = await User.updateOne(
    { id },
    { $set: { passwordHash, updatedAt: new Date().toISOString() } },
  );
  return result.matchedCount > 0;
}

export async function getAllUsers() {
  return plainList(await User.find({}).sort({ createdAt: -1 }).lean());
}

export async function updateUserRoleAndGroup(id, data) {
  const existing = await User.findOne({ id }).lean();
  if (!existing) return null;
  const role = data.role ?? existing.role;
  const group = data.group !== undefined
    ? (data.group === '' ? null : data.group)
    : (existing.group ?? null);
  return plain(await User.findOneAndUpdate(
    { id },
    { $set: { role, group, updatedAt: new Date().toISOString() } },
    { new: true },
  ).lean());
}

export async function getGroups() {
  const groups = await Student.distinct('group', {
    ...APPROVED, group: { $nin: [null, ''] },
  });
  return groups.sort((a, b) => String(a).localeCompare(String(b), 'ru'));
}

export async function listSubjects() {
  return plainList(await Subject.find({}).sort({ name: 1 }).lean());
}

export async function createSubject(name) {
  const doc = await Subject.create({
    id: crypto.randomUUID(), name, createdAt: new Date().toISOString(),
  });
  return plain(doc);
}

export async function deleteSubject(id) {
  const [subjects] = await Promise.all([
    Subject.deleteOne({ id }),
    Mark.deleteMany({ subjectId: id }),
  ]);
  return subjects.deletedCount > 0;
}

export async function getSchedule(group) {
  const filter = group ? { group } : {};
  return plainList(
    await Schedule.find(filter).sort({ dayOfWeek: 1, lessonNumber: 1 }).lean(),
  );
}

export async function createScheduleEntry(data) {
  const now = new Date().toISOString();
  const doc = await Schedule.create({
    id: crypto.randomUUID(),
    group: data.group,
    dayOfWeek: data.dayOfWeek,
    lessonNumber: data.lessonNumber,
    subject: data.subject,
    teacher: data.teacher ?? null,
    room: data.room ?? null,
    week: data.week ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return plain(doc);
}

export async function updateScheduleEntry(id, data) {
  const patch = definedFields(data);
  patch.updatedAt = new Date().toISOString();
  return plain(await Schedule.findOneAndUpdate({ id }, { $set: patch }, { new: true }).lean());
}

export async function deleteScheduleEntry(id) {
  const [schedule] = await Promise.all([
    Schedule.deleteOne({ id }),
    Mark.updateMany({ scheduleId: id }, { $set: { scheduleId: null, date: null } }),
    Attendance.deleteMany({ scheduleId: id }),
  ]);
  return schedule.deletedCount > 0;
}

export async function deleteScheduleByGroup(group) {
  const entries = await Schedule.find({ group }).select({ id: 1 }).lean();
  const ids = entries.map((entry) => entry.id);
  if (ids.length === 0) return 0;
  const [schedule] = await Promise.all([
    Schedule.deleteMany({ group }),
    Mark.updateMany({ scheduleId: { $in: ids } }, { $set: { scheduleId: null, date: null } }),
    Attendance.deleteMany({ scheduleId: { $in: ids } }),
  ]);
  return schedule.deletedCount;
}

async function subjectNames(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const rows = await Subject.find({ id: { $in: unique } }).select({ id: 1, name: 1 }).lean();
  return new Map(rows.map((row) => [row.id, row.name]));
}

function withSubjectName(mark, names) {
  const obj = plain(mark);
  obj.subjectName = names.get(obj.subjectId) ?? null;
  return obj;
}

export async function getMarksByStudent(studentId) {
  const marks = await Mark.find({ studentId }).lean();
  const names = await subjectNames(marks.map((m) => m.subjectId));
  return marks
    .map((mark) => withSubjectName(mark, names))
    .sort((a, b) => String(a.subjectName ?? '').localeCompare(String(b.subjectName ?? ''), 'ru')
      || String(a.createdAt).localeCompare(String(b.createdAt)));
}

export async function getMarkById(id) {
  const mark = await Mark.findOne({ id }).lean();
  if (!mark) return undefined;
  const names = await subjectNames([mark.subjectId]);
  return withSubjectName(mark, names);
}

export async function addMark(studentId, subjectId, mark) {
  const doc = await Mark.create({
    id: crypto.randomUUID(), studentId, subjectId, mark, createdAt: new Date().toISOString(),
  });
  const names = await subjectNames([subjectId]);
  return withSubjectName(doc, names);
}

export async function updateMark(id, mark) {
  const doc = await Mark.findOneAndUpdate({ id }, { $set: { mark } }, { new: true }).lean();
  if (!doc) return null;
  const names = await subjectNames([doc.subjectId]);
  return withSubjectName(doc, names);
}

export async function deleteMark(id) {
  const result = await Mark.deleteOne({ id });
  return result.deletedCount > 0;
}

export async function recomputeStudentPerformance(studentId) {
  const rows = await Mark.aggregate([
    { $match: { studentId } },
    { $group: { _id: null, avg: { $avg: '$mark' } } },
  ]);
  const avg = rows[0]?.avg;
  if (avg === null || avg === undefined) return;
  const value = Math.max(0, Math.min(10, round2(avg)));
  await Student.updateOne({ id: studentId }, { $set: { performance: value, updatedAt: new Date().toISOString() } });
}

export async function recomputeStudentAttendance(studentId) {
  const rows = await Attendance.aggregate([
    { $match: { studentId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
      },
    },
  ]);
  const total = rows[0]?.total ?? 0;
  if (total === 0) return;
  const value = Math.round(((rows[0]?.present ?? 0) / total) * 100);
  await Student.updateOne({ id: studentId }, { $set: { attendance: value, updatedAt: new Date().toISOString() } });
}

export async function getJournalSummaries(group, date, week) {
  const students = await Student.find({ ...APPROVED, group }).select({ id: 1 }).lean();
  if (students.length === 0) return [];
  const studentIds = students.map((student) => student.id);
  const lessons = await Schedule.find({
    group,
    dayOfWeek: isoDow(date),
    $or: [{ week: null }, { week }, { week: { $exists: false } }],
  }).sort({ lessonNumber: 1 }).lean();

  return Promise.all(lessons.map(async (lesson) => {
    const [marked, attRows] = await Promise.all([
      Mark.countDocuments({ scheduleId: lesson.id, date, studentId: { $in: studentIds } }),
      Attendance.aggregate([
        { $match: { scheduleId: lesson.id, date, studentId: { $in: studentIds } } },
        { $group: { _id: '$status', c: { $sum: 1 } } },
      ]),
    ]);
    const count = (status) => attRows.find((row) => row._id === status)?.c ?? 0;
    return {
      scheduleId: lesson.id,
      lessonNumber: lesson.lessonNumber,
      subject: lesson.subject,
      teacher: lesson.teacher,
      room: lesson.room,
      totalStudents: students.length,
      marked,
      present: count('present'),
      late: count('late'),
      absent: count('absent'),
    };
  }));
}

export async function getJournalLesson(scheduleId, date) {
  const entry = await Schedule.findOne({ id: scheduleId }).lean();
  if (!entry) return null;
  const students = await Student.find({ ...APPROVED, group: entry.group })
    .sort({ fullName: 1 }).lean();
  const [marks, attendance] = await Promise.all([
    Mark.find({ scheduleId, date }).lean(),
    Attendance.find({ scheduleId, date }).lean(),
  ]);
  const markById = new Map(marks.map((mark) => [mark.studentId, mark]));
  const statusById = new Map(attendance.map((row) => [row.studentId, row.status]));
  return {
    scheduleId,
    group: entry.group,
    dayOfWeek: entry.dayOfWeek,
    lessonNumber: entry.lessonNumber,
    subject: entry.subject,
    teacher: entry.teacher,
    room: entry.room,
    date,
    students: students.map((student) => {
      const mark = markById.get(student.id);
      return {
        studentId: student.id,
        fullName: student.fullName,
        course: student.course,
        mark: mark?.mark ?? null,
        markId: mark?.id ?? null,
        status: statusById.get(student.id) ?? null,
      };
    }),
  };
}

export async function saveJournalLesson(scheduleId, date, entries) {
  const entry = await Schedule.findOne({ id: scheduleId }).lean();
  if (!entry) return null;

  let subject = await Subject.findOne({
    name: { $regex: `^${escapeRegex(entry.subject)}$`, $options: 'i' },
  }).lean();
  if (!subject) {
    subject = plain(await Subject.create({
      id: crypto.randomUUID(), name: entry.subject, createdAt: new Date().toISOString(),
    }));
  }
  const now = new Date().toISOString();

  await Promise.all(entries.map(async (row) => {
    if (typeof row.mark === 'number') {
      await Mark.updateOne(
        { scheduleId, date, studentId: row.studentId },
        {
          $set: { mark: row.mark, subjectId: subject.id },
          $setOnInsert: { id: crypto.randomUUID(), scheduleId, date, studentId: row.studentId, createdAt: now },
        },
        { upsert: true },
      );
    } else {
      await Mark.deleteOne({ scheduleId, date, studentId: row.studentId });
    }

    if (row.status) {
      await Attendance.updateOne(
        { scheduleId, date, studentId: row.studentId },
        {
          $set: { status: row.status },
          $setOnInsert: { id: crypto.randomUUID(), scheduleId, date, studentId: row.studentId, createdAt: now },
        },
        { upsert: true },
      );
    } else {
      await Attendance.deleteOne({ scheduleId, date, studentId: row.studentId });
    }
  }));

  for (const row of entries) {
    await recomputeStudentPerformance(row.studentId);
    await recomputeStudentAttendance(row.studentId);
  }
  return getJournalLesson(scheduleId, date);
}

export async function getSettings() {
  const row = await Setting.findOne({ key: 'semesterStart' }).lean();
  return { semesterStart: row?.value ?? defaultSemesterStart() };
}

export async function setSemesterStart(date) {
  await Setting.updateOne(
    { key: 'semesterStart' },
    { $set: { key: 'semesterStart', value: date } },
    { upsert: true },
  );
}

export async function connectDb(uri = env.MONGO_URI) {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    ...(env.MONGO_DB_NAME ? { dbName: env.MONGO_DB_NAME } : {}),
  });
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

export async function initDb() {
  await connectDb();
  await Promise.all(Object.values(models).map((model) => model.createIndexes()));
  await pruneAuditLogs();
  return getDbModule();
}

export const rawDb = mongoose.connection;

export function getDbModule() {
  return {
    ensureSchema: async () => {
      await Promise.all(Object.values(models).map((model) => model.createIndexes()));
    },
    getAllStudents,
    getStudentById,
    getStudentByUserId,
    createStudent,
    createStudentsBatch,
    updateStudent,
    deleteStudent,
    toggleDebt,
    deleteAllStudents,
    getStudentsByIds,
    deleteStudentsByIds,
    updateStudentsByIds,
    getStats,
    getStudentsBySpecialty,
    getStudentsByCourse,
    getRecentStudents,
    logAudit,
    getAuditLogs,
    pruneAuditLogs,
    clearAuditLogs,
    saveRefreshSession,
    getRefreshSession,
    deleteRefreshSession,
    deleteRefreshSessionsByUserId,
    findUserByEmail,
    getUserById,
    createUser,
    updateUser,
    updateUserPassword,
    getAllUsers,
    updateUserRoleAndGroup,
    getGroups,
    listSubjects,
    createSubject,
    deleteSubject,
    getSchedule,
    createScheduleEntry,
    updateScheduleEntry,
    deleteScheduleEntry,
    deleteScheduleByGroup,
    getMarksByStudent,
    getMarkById,
    addMark,
    updateMark,
    deleteMark,
    recomputeStudentPerformance,
    recomputeStudentAttendance,
    getJournalSummaries,
    getJournalLesson,
    saveJournalLesson,
    getSettings,
    setSemesterStart,
    rawDb,
  };
}
