/**
 * Моковый адаптер API для статической демо-версии на GitHub Pages.
 *
 * При сборке с VITE_DEMO=true запросы axios не уходят на backend,
 * а обрабатываются здесь: данные хранятся в памяти браузера, поэтому
 * демо работает без сервера и MongoDB. Изменения живут до перезагрузки.
 */
import { weekOfDate } from "./utils/weeks";
const GROUPS = ["\u0418\u0421-21", "\u0418\u0421-22", "\u041F\u041E-507", "\u042D\u041A-31", "\u0411\u0423-41"];
const SUBJECT_NAMES = [
  "\u041C\u0430\u0442\u0435\u043C\u0430\u0442\u0438\u043A\u0430",
  "\u0424\u0438\u0437\u0438\u043A\u0430",
  "\u041F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435",
  "\u0412\u0435\u0431-\u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0430",
  "\u041A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u043D\u044B\u0435 \u0441\u0435\u0442\u0438",
  "\u0411\u0430\u0437\u044B \u0434\u0430\u043D\u043D\u044B\u0445",
  "\u041E\u041E\u041F",
  "\u0410\u043B\u0433\u043E\u0440\u0438\u0442\u043C\u044B",
  "\u041F\u0430\u0442\u0442\u0435\u0440\u043D\u044B \u043F\u0440\u043E\u0435\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F",
  "\u0422\u0435\u0441\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u041F\u041E",
  "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0411\u0435\u043B\u0430\u0440\u0443\u0441\u0438",
  "\u0418\u043D\u043E\u0441\u0442\u0440\u0430\u043D\u043D\u044B\u0439 \u044F\u0437\u044B\u043A",
  "\u0424\u0438\u0437\u043A\u0443\u043B\u044C\u0442\u0443\u0440\u0430",
  "\u042D\u043A\u043E\u043D\u043E\u043C\u0438\u043A\u0430",
  "\u0424\u0438\u043D\u0430\u043D\u0441\u044B",
  "\u0411\u0443\u0445\u0433\u0430\u043B\u0442\u0435\u0440\u0441\u043A\u0438\u0439 \u0443\u0447\u0451\u0442",
  "\u041D\u0430\u043B\u043E\u0433\u0438",
  "\u0410\u0443\u0434\u0438\u0442",
  "\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430",
  "\u041C\u0435\u043D\u0435\u0434\u0436\u043C\u0435\u043D\u0442",
  "\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0435 \u0441\u0438\u0441\u0442\u0435\u043C\u044B",
  "\u041F\u0440\u0430\u0432\u043E\u0432\u0435\u0434\u0435\u043D\u0438\u0435"
];
const TEACHERS = [
  "\u0418\u0432\u0430\u043D\u043E\u0432\u0430 \u0418.\u0418.",
  "\u041F\u0435\u0442\u0440\u043E\u0432 \u041F.\u041F.",
  "\u0421\u0438\u0434\u043E\u0440\u043E\u0432\u0430 \u0421.\u0421.",
  "\u041A\u0443\u0437\u043D\u0435\u0446\u043E\u0432 \u0410.\u0410.",
  "\u041C\u043E\u0440\u043E\u0437\u043E\u0432\u0430 \u0415.\u0415.",
  "\u0412\u043E\u043B\u043A\u043E\u0432 \u0414.\u0414.",
  "\u041D\u043E\u0432\u0438\u043A\u043E\u0432\u0430 \u041E.\u041E.",
  "\u0424\u0451\u0434\u043E\u0440\u043E\u0432 \u041D.\u041D."
];
const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString();
const nowISO = () => (/* @__PURE__ */ new Date()).toISOString();
const uid = (prefix) => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const STUDENT_SEED = [
  { fullName: "\u0418\u0432\u0430\u043D\u043E\u0432 \u0418\u0432\u0430\u043D \u0418\u0432\u0430\u043D\u043E\u0432\u0438\u0447", course: 2, group: "\u041F\u041E-507", specialty: "\u041F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435", attendance: 92, performance: 8.4, academicDebt: false, email: "ivanov@college.local", phone: "+375291112233" },
  { fullName: "\u041F\u0435\u0442\u0440\u043E\u0432\u0430 \u0410\u043D\u043D\u0430 \u0421\u0435\u0440\u0433\u0435\u0435\u0432\u043D\u0430", course: 2, group: "\u041F\u041E-507", specialty: "\u041F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435", attendance: 96, performance: 9.1, academicDebt: false, email: "petrova@college.local", phone: "+375292223344" },
  { fullName: "\u0421\u0438\u0434\u043E\u0440\u043E\u0432 \u041C\u0430\u043A\u0441\u0438\u043C \u041E\u043B\u0435\u0433\u043E\u0432\u0438\u0447", course: 2, group: "\u041F\u041E-507", specialty: "\u041F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435", attendance: 74, performance: 6.2, academicDebt: true, email: "sidorov@college.local", phone: "+375293334455" },
  { fullName: "\u041A\u0443\u0437\u043D\u0435\u0446\u043E\u0432\u0430 \u041C\u0430\u0440\u0438\u044F \u0414\u043C\u0438\u0442\u0440\u0438\u0435\u0432\u043D\u0430", course: 1, group: "\u0418\u0421-21", specialty: "\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0435 \u0441\u0438\u0441\u0442\u0435\u043C\u044B", attendance: 88, performance: 7.8, academicDebt: false, email: "kuznetsova@college.local", phone: "+375294445566" },
  { fullName: "\u0421\u043C\u0438\u0440\u043D\u043E\u0432 \u0410\u0440\u0442\u0451\u043C \u0412\u043B\u0430\u0434\u0438\u043C\u0438\u0440\u043E\u0432\u0438\u0447", course: 1, group: "\u0418\u0421-21", specialty: "\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0435 \u0441\u0438\u0441\u0442\u0435\u043C\u044B", attendance: 81, performance: 7.1, academicDebt: false, email: "smirnov@college.local", phone: "+375295556677" },
  { fullName: "\u0412\u043E\u043B\u043A\u043E\u0432\u0430 \u0415\u043B\u0438\u0437\u0430\u0432\u0435\u0442\u0430 \u0418\u0433\u043E\u0440\u0435\u0432\u043D\u0430", course: 1, group: "\u0418\u0421-22", specialty: "\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0435 \u0441\u0438\u0441\u0442\u0435\u043C\u044B", attendance: 90, performance: 8, academicDebt: false, email: "volkova@college.local", phone: "+375296667788" },
  { fullName: "\u041C\u043E\u0440\u043E\u0437\u043E\u0432 \u0414\u0435\u043D\u0438\u0441 \u041F\u0430\u0432\u043B\u043E\u0432\u0438\u0447", course: 1, group: "\u0418\u0421-22", specialty: "\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0435 \u0441\u0438\u0441\u0442\u0435\u043C\u044B", attendance: 68, performance: 5.4, academicDebt: true, email: "morozov@college.local", phone: "+375297778899" },
  { fullName: "\u041D\u043E\u0432\u0438\u043A\u043E\u0432\u0430 \u041E\u043B\u044C\u0433\u0430 \u0410\u043D\u0434\u0440\u0435\u0435\u0432\u043D\u0430", course: 3, group: "\u042D\u041A-31", specialty: "\u042D\u043A\u043E\u043D\u043E\u043C\u0438\u043A\u0430", attendance: 94, performance: 9.3, academicDebt: false, email: "novikova@college.local", phone: "+375298889900" },
  { fullName: "\u0424\u0451\u0434\u043E\u0440\u043E\u0432 \u041F\u0430\u0432\u0435\u043B \u041D\u0438\u043A\u043E\u043B\u0430\u0435\u0432\u0438\u0447", course: 3, group: "\u042D\u041A-31", specialty: "\u042D\u043A\u043E\u043D\u043E\u043C\u0438\u043A\u0430", attendance: 79, performance: 6.8, academicDebt: false, email: "fedorov@college.local", phone: "+375299990011" },
  { fullName: "\u0421\u043E\u043A\u043E\u043B\u043E\u0432\u0430 \u0412\u0438\u043A\u0442\u043E\u0440\u0438\u044F \u0410\u043B\u0435\u043A\u0441\u0435\u0435\u0432\u043D\u0430", course: 3, group: "\u0411\u0423-41", specialty: "\u0411\u0443\u0445\u0433\u0430\u043B\u0442\u0435\u0440\u0441\u043A\u0438\u0439 \u0443\u0447\u0451\u0442", attendance: 86, performance: 7.6, academicDebt: true, email: "sokolova@college.local", phone: "+375291010101" },
  { fullName: "\u041B\u0435\u0431\u0435\u0434\u0435\u0432 \u041A\u0438\u0440\u0438\u043B\u043B \u0420\u043E\u043C\u0430\u043D\u043E\u0432\u0438\u0447", course: 1, group: "\u0418\u0421-21", specialty: "\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0435 \u0441\u0438\u0441\u0442\u0435\u043C\u044B", attendance: 100, performance: 4, academicDebt: false, email: "lebedev@college.local", phone: "+375292020202", status: "pending" }
];
const USERS = [
  { id: "u1", email: "admin@college.local", fullName: "\u0410\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440 \u0421\u0438\u0441\u0442\u0435\u043C\u044B", role: "admin", phone: null, group: null, avatar: null, createdAt: daysAgo(120) },
  { id: "u2", email: "curator@college.local", fullName: "\u041F\u0435\u0442\u0440\u043E\u0432\u0430 \u0410\u043D\u043D\u0430 \u0421\u0435\u0440\u0433\u0435\u0435\u0432\u043D\u0430", role: "curator", phone: "+375292223344", group: "\u041F\u041E-507", avatar: null, createdAt: daysAgo(90) },
  { id: "u3", email: "user@college.local", fullName: "\u0418\u0432\u0430\u043D\u043E\u0432 \u0418\u0432\u0430\u043D \u0418\u0432\u0430\u043D\u043E\u0432\u0438\u0447", role: "user", phone: "+375291112233", group: "\u041F\u041E-507", avatar: null, createdAt: daysAgo(60) },
  { id: "u4", email: "smirnov@college.local", fullName: "\u0421\u043C\u0438\u0440\u043D\u043E\u0432 \u0410\u0440\u0442\u0451\u043C \u0412\u043B\u0430\u0434\u0438\u043C\u0438\u0440\u043E\u0432\u0438\u0447", role: "user", phone: "+375295556677", group: "\u0418\u0421-21", avatar: null, createdAt: daysAgo(45) },
  { id: "u5", email: "novikova@college.local", fullName: "\u041D\u043E\u0432\u0438\u043A\u043E\u0432\u0430 \u041E\u043B\u044C\u0433\u0430 \u0410\u043D\u0434\u0440\u0435\u0435\u0432\u043D\u0430", role: "user", phone: "+375298889900", group: "\u042D\u041A-31", avatar: null, createdAt: daysAgo(30) },
  { id: "u6", email: "kuznetsova@college.local", fullName: "\u041A\u0443\u0437\u043D\u0435\u0446\u043E\u0432\u0430 \u041C\u0430\u0440\u0438\u044F \u0414\u043C\u0438\u0442\u0440\u0438\u0435\u0432\u043D\u0430", role: "user", phone: "+375294445566", group: "\u0418\u0421-21", avatar: null, createdAt: daysAgo(20) }
];
let students = STUDENT_SEED.map((s, i) => ({
  id: `s${i + 1}`,
  fullName: s.fullName,
  course: s.course,
  group: s.group,
  specialty: s.specialty,
  attendance: s.attendance,
  performance: s.performance,
  academicDebt: s.academicDebt,
  email: s.email,
  phone: s.phone,
  userId: i === 0 ? "u3" : null,
  status: s.status ?? "approved",
  createdAt: daysAgo((STUDENT_SEED.length - i) * 4),
  updatedAt: daysAgo((STUDENT_SEED.length - i) * 4)
}));
let studentSeq = students.length + 1;
let subjectSeq = SUBJECT_NAMES.length + 1;
let subjects = SUBJECT_NAMES.map((name, i) => ({
  id: `sub${i + 1}`,
  name,
  createdAt: daysAgo(SUBJECT_NAMES.length - i)
}));
let settings = { semesterStart: "2026-09-01" };
function makeEntry(group, day, lesson, week, gi) {
  const subject = SUBJECT_NAMES[(gi * 7 + day * 3 + lesson) % SUBJECT_NAMES.length];
  const teacher = TEACHERS[(gi * 3 + day + lesson) % TEACHERS.length];
  const room = String(100 + (gi * 11 + day * 5 + lesson * 3) % 40);
  return {
    id: `sch-${group}-${day}-${lesson}-${week ?? "all"}`,
    group,
    dayOfWeek: day,
    lessonNumber: lesson,
    subject,
    teacher,
    room,
    week,
    createdAt: nowISO(),
    updatedAt: nowISO()
  };
}
let scheduleEntries = [];
GROUPS.forEach((group, gi) => {
  for (let day = 1; day <= 5; day++) {
    for (let lesson = 1; lesson <= 4; lesson++) {
      scheduleEntries.push(makeEntry(group, day, lesson, null, gi));
    }
    scheduleEntries.push(makeEntry(group, day, 5, day % 2 === 1 ? "upper" : "lower", gi));
  }
});
let marks = [];
students.forEach((s, si) => {
  if (s.status === "pending") return;
  for (let k = 0; k < 4; k++) {
    const subject = subjects[(si * 3 + k * 5) % subjects.length];
    marks.push({
      id: `m-${s.id}-${k}`,
      studentId: s.id,
      subjectId: subject.id,
      mark: 6 + (si + k) % 5,
      createdAt: daysAgo(si + k + 1),
      scheduleId: null,
      date: daysAgo(si + k + 1).slice(0, 10)
    });
  }
});
const journal = /* @__PURE__ */ new Map();
const journalKey = (scheduleId, date) => `${scheduleId}|${date}`;
const AUDIT_ACTIONS = ["login", "create", "update", "delete", "logout"];
const AUDIT_ENTITIES = ["student", "schedule", "subject", "user", "journal"];
let auditLogs = Array.from({ length: 24 }, (_, i) => {
  const action = AUDIT_ACTIONS[i % AUDIT_ACTIONS.length];
  const entity = AUDIT_ENTITIES[i * 2 % AUDIT_ENTITIES.length];
  return {
    id: `a${i + 1}`,
    action,
    entity,
    entityId: `id-${1e3 + i}`,
    userId: ["admin", "curator", "user"][i % 3],
    details: {
      subject: `\u0417\u0430\u043F\u0438\u0441\u044C ${i + 1}`,
      note: action === "login" ? "\u0423\u0441\u043F\u0435\u0448\u043D\u044B\u0439 \u0432\u0445\u043E\u0434" : `\u0414\u0435\u043C\u043E\u043D\u0441\u0442\u0440\u0430\u0446\u0438\u043E\u043D\u043D\u043E\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \xAB${action}\xBB`
    },
    createdAt: new Date(Date.now() - i * 5 * 36e5).toISOString()
  };
});
function readCookie(name) {
  if (typeof document === "undefined") return void 0;
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : void 0;
}
function writeCookie(name, value) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}
function clearCookie(name) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0`;
}
function currentUser() {
  const email = readCookie("demo_user");
  if (email) {
    const byEmail = USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (byEmail) return byEmail;
  }
  const role = readCookie("role");
  return USERS.find((u) => u.role === role) ?? USERS[0];
}
function publicUser(user) {
  return { ...user };
}
const approved = () => students.filter((s) => s.status !== "pending");
function myStudent() {
  const user = currentUser();
  return students.find((s) => s.userId === user.id) ?? null;
}
function scopedStudents() {
  const user = currentUser();
  let list = students;
  if (user.role === "curator" && user.group) {
    list = list.filter((s) => s.group === user.group);
  }
  if (user.role !== "admin") {
    list = list.filter((s) => (s.status ?? "approved") === "approved");
  }
  return list;
}
function subjectName(subjectId) {
  return subjects.find((s) => s.id === subjectId)?.name;
}
function withSubject(m) {
  return { ...m, subjectName: m.subjectName ?? subjectName(m.subjectId) ?? "\u0411\u0435\u0437 \u043F\u0440\u0435\u0434\u043C\u0435\u0442\u0430" };
}
function marksForStudent(studentId) {
  return marks.filter((m) => m.studentId === studentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(withSubject);
}
function computeStats() {
  const list = approved();
  const total = list.length;
  const withDebt = list.filter((s) => s.academicDebt).length;
  const avgAttendance = total ? Math.round(list.reduce((a, s) => a + s.attendance, 0) / total) : 0;
  const avgPerformance = total ? Number((list.reduce((a, s) => a + s.performance, 0) / total).toFixed(2)) : 0;
  const byCourse = {};
  const bySpecialty = {};
  for (const s of list) {
    byCourse[s.course] = (byCourse[s.course] ?? 0) + 1;
    bySpecialty[s.specialty] = (bySpecialty[s.specialty] ?? 0) + 1;
  }
  const courses = [...new Set(list.map((s) => s.course))].sort((a, b) => a - b);
  const byCourseStats = courses.map((course) => {
    const arr = list.filter((s) => s.course === course);
    return {
      course,
      count: arr.length,
      avgPerformance: Number((arr.reduce((a, s) => a + s.performance, 0) / arr.length).toFixed(2)),
      avgAttendance: Math.round(arr.reduce((a, s) => a + s.attendance, 0) / arr.length)
    };
  });
  const groups = [...new Set(list.map((s) => s.group))].sort((a, b) => a.localeCompare(b, "ru"));
  const byGroupStats = groups.map((group) => {
    const arr = list.filter((s) => s.group === group);
    return {
      group,
      count: arr.length,
      avgPerformance: Number((arr.reduce((a, s) => a + s.performance, 0) / arr.length).toFixed(2)),
      avgAttendance: Math.round(arr.reduce((a, s) => a + s.attendance, 0) / arr.length)
    };
  });
  return { total, withDebt, avgAttendance, avgPerformance, byCourse, byCourseStats, byGroupStats, bySpecialty };
}
function dayOfWeekOf(date) {
  const d = /* @__PURE__ */ new Date(`${date}T00:00:00`);
  const js = d.getDay();
  return js === 0 ? 7 : js;
}
function journalEntries(scheduleId, date) {
  return journal.get(journalKey(scheduleId, date)) ?? [];
}
function lessonFor(scheduleId, date) {
  const entry = scheduleEntries.find((e) => e.id === scheduleId);
  if (!entry) return null;
  const list = approved().filter((s) => s.group === entry.group);
  const stored = new Map(journalEntries(scheduleId, date).map((x) => [x.studentId, x]));
  return {
    scheduleId: entry.id,
    group: entry.group,
    dayOfWeek: entry.dayOfWeek,
    lessonNumber: entry.lessonNumber,
    subject: entry.subject,
    teacher: entry.teacher,
    room: entry.room,
    date,
    students: list.map((s) => {
      const item = stored.get(s.id);
      return {
        studentId: s.id,
        fullName: s.fullName,
        course: s.course,
        mark: item?.mark ?? null,
        markId: item?.markId ?? null,
        status: item?.status ?? null
      };
    })
  };
}
function respond(config, data, status = 200) {
  return { data, status, statusText: "OK", headers: {}, config };
}
function ok(config, data) {
  return respond(config, { success: true, data });
}
function fail(config, error) {
  return respond(config, { success: false, error });
}
function parseBody(data) {
  if (!data) return {};
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  if (typeof data === "object") return data;
  return {};
}
function abortError() {
  const error = new Error("canceled");
  error.name = "CanceledError";
  return error;
}
function wait(config) {
  return new Promise((resolve, reject) => {
    const signal = config.signal;
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const timer = setTimeout(resolve, 80 + Math.random() * 70);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(abortError());
      },
      { once: true }
    );
  });
}
function paginateStudents(config, params) {
  let list = scopedStudents();
  if (params.status === "pending" || params.status === "approved") {
    list = list.filter((s) => (s.status ?? "approved") === params.status);
  }
  const search = String(params.search ?? "").trim().toLowerCase();
  if (search) {
    list = list.filter(
      (s) => `${s.fullName} ${s.group} ${s.specialty}`.toLowerCase().includes(search)
    );
  }
  if (params.filterDebt === true || params.filterDebt === "true") {
    list = list.filter((s) => s.academicDebt);
  } else if (params.filterDebt === false || params.filterDebt === "false") {
    list = list.filter((s) => !s.academicDebt);
  }
  if (params.filterCourse !== void 0 && params.filterCourse !== "") {
    const course = Number(params.filterCourse);
    if (!Number.isNaN(course)) list = list.filter((s) => s.course === course);
  }
  const sortBy = String(params.sortBy ?? "fullName");
  const direction = params.sortOrder === "desc" ? -1 : 1;
  list = [...list].sort((a, b) => {
    const left = a[sortBy];
    const right = b[sortBy];
    if (typeof left === "number" && typeof right === "number") return (left - right) * direction;
    return String(left ?? "").localeCompare(String(right ?? ""), "ru") * direction;
  });
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const limit = Math.max(1, Number(params.limit ?? 20) || 20);
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const data = list.slice((page - 1) * limit, page * limit);
  return respond(config, { success: true, data, total, page, limit, totalPages });
}
function addStudent(input, status = "approved") {
  const student = {
    id: `s${studentSeq++}`,
    fullName: String(input.fullName ?? "\u0411\u0435\u0437 \u0438\u043C\u0435\u043D\u0438"),
    course: Number(input.course ?? 1) || 1,
    group: String(input.group ?? ""),
    specialty: String(input.specialty ?? ""),
    attendance: Number(input.attendance ?? 100),
    performance: Number(input.performance ?? 4),
    academicDebt: Boolean(input.academicDebt),
    email: input.email ? String(input.email) : null,
    phone: input.phone ? String(input.phone) : null,
    userId: null,
    status,
    createdAt: nowISO(),
    updatedAt: nowISO()
  };
  students.push(student);
  return student;
}
function saveJournal(scheduleId, date, entries) {
  const entry = scheduleEntries.find((e) => e.id === scheduleId);
  if (!entry) return null;
  const subjectId = subjects.find((s) => s.name === entry.subject)?.id ?? subjects[0]?.id ?? "";
  const stored = entries.map((item) => {
    const markId = `jm-${scheduleId}-${item.studentId}-${date}`;
    const existing = marks.find((m) => m.id === markId);
    if (item.mark === null) {
      marks = marks.filter((m) => m.id !== markId);
      return { ...item, markId: null };
    }
    if (existing) {
      existing.mark = item.mark;
    } else {
      marks.push({
        id: markId,
        studentId: item.studentId,
        subjectId,
        mark: item.mark,
        createdAt: nowISO(),
        scheduleId,
        date
      });
    }
    return { ...item, markId };
  });
  journal.set(journalKey(scheduleId, date), stored);
  return lessonFor(scheduleId, date);
}
async function route(config, method, url, params, body) {
  if (method === "post" && url === "/auth/login") {
    const email = String(body.email ?? "").toLowerCase();
    const byEmail = USERS.find((u) => u.email.toLowerCase() === email);
    const role = byEmail?.role ?? (email.includes("admin") ? "admin" : email.includes("curator") ? "curator" : "user");
    const user = byEmail ?? USERS.find((u) => u.role === role) ?? USERS[2];
    writeCookie("role", user.role);
    writeCookie("demo_user", user.email);
    return ok(config, { role: user.role });
  }
  if (method === "post" && url === "/auth/logout") {
    clearCookie("role");
    clearCookie("demo_user");
    return ok(config, void 0);
  }
  if (method === "post" && (url === "/auth/refresh" || url === "/auth/forgot-password" || url === "/auth/reset-password")) {
    return ok(config, void 0);
  }
  if (method === "post" && url === "/auth/register") {
    const email = String(body.email ?? "");
    if (email && !USERS.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      const user = {
        id: uid("u"),
        email,
        fullName: String(body.fullName ?? "\u041D\u043E\u0432\u044B\u0439 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C"),
        role: "user",
        phone: body.phone ? String(body.phone) : null,
        group: body.group ? String(body.group) : null,
        avatar: null,
        createdAt: nowISO()
      };
      USERS.push(user);
      const student = addStudent({ ...body, userId: user.id }, "pending");
      student.userId = user.id;
    }
    return ok(config, void 0);
  }
  if (method === "get" && url === "/auth/me") {
    return ok(config, publicUser(currentUser()));
  }
  if (method === "put" && url === "/auth/me") {
    const user = currentUser();
    if (body.fullName !== void 0) user.fullName = String(body.fullName);
    if (body.phone !== void 0) user.phone = body.phone ? String(body.phone) : null;
    if (body.avatar !== void 0) user.avatar = body.avatar ? String(body.avatar) : null;
    return ok(config, publicUser(user));
  }
  if (method === "put" && url === "/auth/me/password") {
    return ok(config, void 0);
  }
  if (method === "get" && url === "/public/stats") {
    const stat = computeStats();
    const byCourse = Object.entries(stat.byCourse).map(([course, count]) => ({ course: Number(course), count })).sort((a, b) => a.course - b.course);
    const bySpecialty = Object.entries(stat.bySpecialty).map(([specialty, count]) => ({ specialty, count }));
    return ok(config, {
      stats: {
        total: stat.total,
        withDebt: stat.withDebt,
        avgAttendance: stat.avgAttendance,
        avgPerformance: stat.avgPerformance
      },
      byCourse,
      bySpecialty
    });
  }
  if (method === "get" && url === "/students/stats") {
    return ok(config, computeStats());
  }
  if (method === "get" && url === "/students/recent") {
    const recent = approved().slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
    return ok(config, recent);
  }
  if (method === "get" && url === "/students/me") {
    return ok(config, myStudent());
  }
  if (method === "put" && url === "/students/me") {
    const user = currentUser();
    let student = students.find((s) => s.userId === user.id) ?? null;
    if (!student) {
      student = addStudent({ ...body }, "pending");
      student.userId = user.id;
    } else {
      student.fullName = String(body.fullName ?? student.fullName);
      student.course = Number(body.course ?? student.course) || student.course;
      student.group = String(body.group ?? student.group);
      student.specialty = String(body.specialty ?? student.specialty);
      student.email = body.email ? String(body.email) : null;
      student.phone = body.phone ? String(body.phone) : null;
      student.status = "pending";
      student.updatedAt = nowISO();
    }
    return ok(config, student);
  }
  if (method === "post" && url === "/students/batch-import") {
    const incoming = Array.isArray(body.students) ? body.students : [];
    let created = 0;
    let skipped = 0;
    for (const item of incoming) {
      const key = `${String(item.fullName ?? "").trim().toLowerCase()}|${String(item.group ?? "").trim().toLowerCase()}`;
      const exists = students.some(
        (s) => `${s.fullName.trim().toLowerCase()}|${s.group.trim().toLowerCase()}` === key
      );
      if (exists) {
        skipped += 1;
      } else {
        addStudent(item);
        created += 1;
      }
    }
    return ok(config, { created, skipped });
  }
  if (method === "post" && url === "/students/batch-delete") {
    const ids = new Set((Array.isArray(body.ids) ? body.ids : []).map(String));
    const before = students.length;
    students = students.filter((s) => !ids.has(s.id));
    return ok(config, { deleted: before - students.length });
  }
  if (method === "post" && url === "/students/batch-update") {
    const ids = new Set((Array.isArray(body.ids) ? body.ids : []).map(String));
    const patch = body.patch ?? {};
    let updated = 0;
    students = students.map((s) => {
      if (!ids.has(s.id)) return s;
      updated += 1;
      return { ...s, ...patch, updatedAt: nowISO() };
    });
    return ok(config, { updated });
  }
  if (method === "post" && url === "/students/batch-export") {
    const ids = Array.isArray(body.ids) ? new Set(body.ids.map(String)) : null;
    const list = ids ? students.filter((s) => ids.has(s.id)) : students;
    return ok(config, list);
  }
  if (method === "get" && url === "/students") {
    return paginateStudents(config, params);
  }
  if (method === "delete" && url === "/students") {
    const deleted = students.length;
    students = [];
    return ok(config, { deleted });
  }
  if (method === "post" && url === "/students") {
    return ok(config, addStudent(body));
  }
  const toggleDebt = url.match(/^\/students\/([^/]+)\/toggle-debt$/);
  if (method === "patch" && toggleDebt) {
    const student = students.find((s) => s.id === toggleDebt[1]);
    if (!student) return fail(config, "\u0421\u0442\u0443\u0434\u0435\u043D\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D");
    student.academicDebt = !student.academicDebt;
    student.updatedAt = nowISO();
    return ok(config, student);
  }
  const approve = url.match(/^\/students\/([^/]+)\/approve$/);
  if (method === "post" && approve) {
    const student = students.find((s) => s.id === approve[1]);
    if (!student) return fail(config, "\u0421\u0442\u0443\u0434\u0435\u043D\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D");
    student.status = "approved";
    student.updatedAt = nowISO();
    return ok(config, student);
  }
  const studentMarks = url.match(/^\/students\/([^/]+)\/marks$/);
  if (studentMarks && method === "get") {
    return ok(config, marksForStudent(studentMarks[1]));
  }
  if (studentMarks && method === "post") {
    const subject = subjects.find((s) => s.id === String(body.subjectId));
    if (!subject) return fail(config, "\u041F\u0440\u0435\u0434\u043C\u0435\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D");
    const record = {
      id: uid("m"),
      studentId: studentMarks[1],
      subjectId: subject.id,
      mark: Number(body.mark ?? 5),
      createdAt: nowISO(),
      scheduleId: null,
      date: nowISO().slice(0, 10)
    };
    marks.push(record);
    return ok(config, withSubject(record));
  }
  const studentById = url.match(/^\/students\/([^/]+)$/);
  if (studentById) {
    const index = students.findIndex((s) => s.id === studentById[1]);
    if (index === -1) return fail(config, "\u0421\u0442\u0443\u0434\u0435\u043D\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D");
    if (method === "put") {
      students[index] = { ...students[index], ...body, id: students[index].id, updatedAt: nowISO() };
      return ok(config, students[index]);
    }
    if (method === "delete") {
      students.splice(index, 1);
      return ok(config, void 0);
    }
  }
  if (method === "get" && url === "/groups") {
    const user = currentUser();
    if (user.role === "curator" && user.group) {
      return ok(config, [user.group]);
    }
    const groups = [...new Set(students.map((s) => s.group).filter(Boolean))];
    if (groups.length === 0) groups.push("\u0418\u0421-21", "\u041F\u041E-507", "\u0422\u041E-31");
    groups.sort((a, b) => String(a).localeCompare(String(b), "ru"));
    return ok(config, groups);
  }
  if (method === "get" && url === "/subjects") {
    return ok(config, subjects);
  }
  if (method === "post" && url === "/subjects") {
    const name = String(body.name ?? "").trim();
    if (!name) return fail(config, "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043F\u0440\u0435\u0434\u043C\u0435\u0442\u0430");
    if (subjects.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      return fail(config, "\u0422\u0430\u043A\u043E\u0439 \u043F\u0440\u0435\u0434\u043C\u0435\u0442 \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442");
    }
    const subject = { id: `sub${subjectSeq++}`, name, createdAt: nowISO() };
    subjects.push(subject);
    return ok(config, subject);
  }
  const subjectById = url.match(/^\/subjects\/([^/]+)$/);
  if (method === "delete" && subjectById) {
    subjects = subjects.filter((s) => s.id !== subjectById[1]);
    return ok(config, { deleted: true });
  }
  if (method === "get" && url === "/schedule") {
    const user = currentUser();
    const group = params.group ? String(params.group) : "";
    let list = scheduleEntries;
    if (group) {
      list = list.filter((e) => e.group === group);
    } else if ((user.role === "curator" || user.role === "user") && user.group) {
      list = list.filter((e) => e.group === user.group);
    }
    return ok(config, list);
  }
  if (method === "post" && url === "/schedule") {
    const entry = {
      id: uid("sch"),
      group: String(body.group ?? ""),
      dayOfWeek: Number(body.dayOfWeek ?? 1),
      lessonNumber: Number(body.lessonNumber ?? 1),
      subject: String(body.subject ?? ""),
      teacher: body.teacher ? String(body.teacher) : null,
      room: body.room ? String(body.room) : null,
      week: body.week === "upper" || body.week === "lower" ? body.week : null,
      createdAt: nowISO(),
      updatedAt: nowISO()
    };
    scheduleEntries.push(entry);
    return ok(config, entry);
  }
  if (method === "delete" && url === "/schedule") {
    const group = String(params.group ?? "");
    const before = scheduleEntries.length;
    scheduleEntries = scheduleEntries.filter((e) => e.group !== group);
    return ok(config, { deleted: before - scheduleEntries.length });
  }
  const scheduleById = url.match(/^\/schedule\/([^/]+)$/);
  if (scheduleById) {
    const index = scheduleEntries.findIndex((e) => e.id === scheduleById[1]);
    if (index === -1) return fail(config, "\u0417\u0430\u043F\u0438\u0441\u044C \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430");
    if (method === "put") {
      scheduleEntries[index] = {
        ...scheduleEntries[index],
        ...body,
        id: scheduleEntries[index].id,
        updatedAt: nowISO()
      };
      return ok(config, scheduleEntries[index]);
    }
    if (method === "delete") {
      scheduleEntries.splice(index, 1);
      return ok(config, { deleted: true });
    }
  }
  if (method === "get" && url === "/settings") {
    return ok(config, settings);
  }
  if (method === "put" && url === "/settings") {
    settings = { semesterStart: String(body.semesterStart ?? settings.semesterStart) };
    return ok(config, settings);
  }
  if (method === "get" && url === "/journal/summary") {
    const group = String(params.group ?? "");
    const date = String(params.date ?? nowISO().slice(0, 10));
    const day = dayOfWeekOf(date);
    const week = weekOfDate(date, settings.semesterStart);
    const groupSize = approved().filter((s) => s.group === group).length;
    const entries = scheduleEntries.filter((e) => e.group === group && e.dayOfWeek === day && (e.week === null || e.week === week)).sort((a, b) => a.lessonNumber - b.lessonNumber);
    const lessons = entries.map((e) => {
      const stored = journalEntries(e.id, date);
      return {
        scheduleId: e.id,
        lessonNumber: e.lessonNumber,
        subject: e.subject,
        teacher: e.teacher,
        room: e.room,
        totalStudents: groupSize,
        marked: stored.filter((x) => x.mark !== null).length,
        present: stored.filter((x) => x.status === "present" || x.status === "late").length,
        late: stored.filter((x) => x.status === "late").length,
        absent: stored.filter((x) => x.status === "absent").length
      };
    });
    return respond(config, {
      success: true,
      data: lessons,
      week,
      semesterStart: settings.semesterStart
    });
  }
  const journalById = url.match(/^\/journal\/([^/]+)$/);
  if (journalById && method === "get") {
    const date = String(params.date ?? nowISO().slice(0, 10));
    const lesson = lessonFor(journalById[1], date);
    return lesson ? ok(config, lesson) : fail(config, "\u0417\u0430\u043D\u044F\u0442\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E");
  }
  if (journalById && method === "put") {
    const date = String(body.date ?? nowISO().slice(0, 10));
    const incoming = Array.isArray(body.entries) ? body.entries : [];
    const entries = incoming.map((item) => ({
      studentId: String(item.studentId ?? ""),
      mark: item.mark === null || item.mark === "" ? null : Number(item.mark),
      status: item.status === "present" || item.status === "late" || item.status === "absent" ? item.status : null,
      markId: null
    }));
    const lesson = saveJournal(journalById[1], date, entries);
    return lesson ? ok(config, lesson) : fail(config, "\u0417\u0430\u043D\u044F\u0442\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E");
  }
  if (method === "get" && url === "/marks/me") {
    const student = myStudent();
    return ok(config, student ? marksForStudent(student.id) : []);
  }
  const markById = url.match(/^\/marks\/([^/]+)$/);
  if (markById) {
    const index = marks.findIndex((m) => m.id === markById[1]);
    if (index === -1) return fail(config, "\u041E\u0446\u0435\u043D\u043A\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430");
    if (method === "put") {
      marks[index] = { ...marks[index], mark: Number(body.mark ?? marks[index].mark) };
      return ok(config, withSubject(marks[index]));
    }
    if (method === "delete") {
      marks.splice(index, 1);
      return ok(config, { deleted: true });
    }
  }
  if (method === "get" && url === "/admin/users") {
    return ok(config, USERS.map(publicUser));
  }
  const adminUserId = url.match(/^\/admin\/users\/([^/]+)$/);
  if (method === "put" && adminUserId) {
    const user = USERS.find((u) => u.id === adminUserId[1]);
    if (!user) return fail(config, "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D");
    if (body.role === "admin" || body.role === "curator" || body.role === "user") {
      user.role = body.role;
    }
    if (body.group !== void 0) user.group = body.group ? String(body.group) : null;
    return ok(config, publicUser(user));
  }
  if (method === "get" && url === "/admin/analytics") {
    const stat = computeStats();
    const courses = [...new Set(approved().map((s) => s.course))].sort((a, b) => a - b);
    const byCourse = courses.map((course) => {
      const arr = approved().filter((s) => s.course === course);
      return { course, count: arr.length, withDebt: arr.filter((s) => s.academicDebt).length };
    });
    const bySpecialty = Object.entries(stat.bySpecialty).map(([specialty, count]) => ({ specialty, count })).sort((a, b) => b.count - a.count);
    return ok(config, { stats: { total: stat.total }, byCourse, bySpecialty });
  }
  if (method === "get" && url === "/audit-logs") {
    let list = auditLogs;
    if (params.entity) list = list.filter((l) => l.entity === params.entity);
    const page = Math.max(1, Number(params.page ?? 1) || 1);
    const limit = Math.max(1, Number(params.limit ?? 50) || 50);
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const logs = list.slice((page - 1) * limit, page * limit);
    return respond(config, { success: true, logs, data: logs, total, page, limit, totalPages });
  }
  if (method === "delete" && url === "/audit-logs") {
    const deleted = auditLogs.length;
    auditLogs = [];
    return ok(config, { deleted });
  }
  return fail(config, `\u0414\u0435\u043C\u043E-\u0440\u0435\u0436\u0438\u043C: ${method.toUpperCase()} ${url} \u043D\u0435 \u0440\u0435\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u043D`);
}
const demoAdapter = async (config) => {
  await wait(config);
  const method = (config.method ?? "get").toLowerCase();
  const url = (config.url ?? "").split("?")[0];
  const params = config.params ?? {};
  const body = parseBody(config.data);
  return route(config, method, url, params, body);
};
function installDemo(api) {
  api.defaults.adapter = demoAdapter;
  if (typeof window !== "undefined") {
    let started = false;
    try {
      started = window.sessionStorage.getItem("demo_started") === "1";
    } catch {
      started = false;
    }
    if (!started && !readCookie("role")) {
      writeCookie("role", USERS[0].role);
      writeCookie("demo_user", USERS[0].email);
    }
    try {
      window.sessionStorage.setItem("demo_started", "1");
    } catch {
    }
  }
}
export {
  installDemo
};
