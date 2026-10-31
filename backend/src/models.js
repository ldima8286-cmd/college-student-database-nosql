import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * MongoDB — документо-ориентированная (нереляционная) СУБД.
 *
 * В отличие от SQL-версии здесь нет таблиц, внешних ключей и JOIN-ов:
 * связи хранятся как строковые идентификаторы, а выборки с "джойнами"
 * выполняются в приложении или через aggregation pipeline ($lookup).
 * Все схемы ниже — это Mongoose-схемы, то есть описание формы документа,
 * а не жёсткая реляционная структура.
 */

const baseOptions = { versionKey: false, timestamps: false };

const studentSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  fullName: { type: String, required: true, trim: true },
  course: { type: Number, required: true, min: 1, max: 6, index: true },
  group: { type: String, required: true, index: true },
  specialty: { type: String, required: true },
  attendance: { type: Number, default: 100, min: 0, max: 100 },
  performance: { type: Number, default: 4, min: 0, max: 10 },
  academicDebt: { type: Boolean, default: false, index: true },
  email: { type: String, default: null, index: true },
  phone: { type: String, default: null },
  userId: { type: String, default: null, index: true },
  status: { type: String, enum: ['pending', 'approved'], default: 'approved', index: true },
  createdAt: { type: String, required: true, index: true },
  updatedAt: { type: String, required: true },
}, { ...baseOptions, collection: 'students' });

studentSchema.index({ status: 1, group: 1 });
studentSchema.index({ academicDebt: 1, status: 1 });

const userSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['admin', 'curator', 'user'], default: 'user' },
  avatar: { type: String, default: null },
  phone: { type: String, default: null },
  group: { type: String, default: null },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
}, { ...baseOptions, collection: 'users' });

const subjectSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, unique: true },
  createdAt: { type: String, required: true },
}, { ...baseOptions, collection: 'subjects' });

const scheduleSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  group: { type: String, required: true, index: true },
  dayOfWeek: { type: Number, required: true, min: 1, max: 6 },
  lessonNumber: { type: Number, required: true, min: 1, max: 10 },
  subject: { type: String, required: true },
  teacher: { type: String, default: null },
  room: { type: String, default: null },
  week: { type: String, enum: ['upper', 'lower', null], default: null },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
}, { ...baseOptions, collection: 'schedule' });

scheduleSchema.index({ group: 1, dayOfWeek: 1, lessonNumber: 1 });

const markSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  studentId: { type: String, required: true, index: true },
  subjectId: { type: String, required: true, index: true },
  mark: { type: Number, required: true, min: 1, max: 10 },
  scheduleId: { type: String, default: null },
  date: { type: String, default: null },
  createdAt: { type: String, required: true },
}, { ...baseOptions, collection: 'marks' });

markSchema.index({ scheduleId: 1, date: 1 });
markSchema.index({ studentId: 1, subjectId: 1 });

const attendanceSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  scheduleId: { type: String, required: true, index: true },
  date: { type: String, required: true },
  studentId: { type: String, required: true, index: true },
  status: { type: String, required: true, enum: ['present', 'late', 'absent'] },
  createdAt: { type: String, required: true },
}, { ...baseOptions, collection: 'attendance' });

attendanceSchema.index({ scheduleId: 1, date: 1, studentId: 1 }, { unique: true });

const auditLogSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: { type: String, default: null },
  userId: { type: String, default: null },
  details: { type: Schema.Types.Mixed, default: null },
  createdAt: { type: String, required: true, index: true },
}, { ...baseOptions, collection: 'audit_log' });

const refreshSessionSchema = new Schema({
  jti: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  expiresAt: { type: Number, required: true },
}, { ...baseOptions, collection: 'refresh_sessions' });

const settingSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
}, { ...baseOptions, collection: 'settings' });

export const Student = mongoose.model('Student', studentSchema);
export const User = mongoose.model('User', userSchema);
export const Subject = mongoose.model('Subject', subjectSchema);
export const Schedule = mongoose.model('Schedule', scheduleSchema);
export const Mark = mongoose.model('Mark', markSchema);
export const Attendance = mongoose.model('Attendance', attendanceSchema);
export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export const RefreshSession = mongoose.model('RefreshSession', refreshSessionSchema);
export const Setting = mongoose.model('Setting', settingSchema);

export const models = {
  Student, User, Subject, Schedule, Mark, Attendance, AuditLog, RefreshSession, Setting,
};
