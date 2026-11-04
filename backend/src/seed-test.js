/**
 * Генерация тестовой базы для курсовой работы.
 *
 * Создаёт:
 *   - 6 курсов, по 3 группы на курс (18 групп);
 *   - 108 подтверждённых студентов + 4 заявки на подтверждение;
 *   - предметы под каждую специальность;
 *   - расписание на понедельник–субботу для каждой группы;
 *   - посещаемость и оценки за текущий семестр (с начала семестра до сегодня).
 *
 * ВНИМАНИЕ: скрипт заменяет студентов, предметы, расписание, оценки и
 * посещаемость. Пользователи, аудит и refresh-сессии не затрагиваются.
 *
 * Запуск: npm run db:seed
 */
import crypto from 'node:crypto';
import {
  connectDb,
  defaultSemesterStart,
  recomputeStudentAttendance,
  recomputeStudentPerformance,
  setSemesterStart,
  weekOfDate,
} from './db.js';
import { seedUsers } from './seed.js';
import {
  Attendance, Mark, Schedule, Student, Subject, User,
} from './models.js';
import { logger } from './logger.js';

const COURSES = [1, 2, 3, 4, 5, 6];
const STUDENTS_PER_GROUP = 6;
const PENDING_STUDENTS = 4;

const SPECIALTIES = [
  {
    code: 'ИС',
    name: 'Информационные системы и программирование',
    subjects: [
      'Информационные системы и технологии',
      'Базы данных',
      'Программирование',
      'Компьютерные сети',
      'Веб-разработка',
      'Операционные системы',
      'Математика',
      'Иностранный язык',
      'Физическая культура',
      'Инженерная графика',
      'История Беларуси',
    ],
  },
  {
    code: 'ПО',
    name: 'Программное обеспечение информационных технологий',
    subjects: [
      'Программирование',
      'Алгоритмы и структуры данных',
      'Объектно-ориентированное программирование',
      'Базы данных',
      'Тестирование программного обеспечения',
      'Веб-разработка',
      'Операционные системы',
      'Математика',
      'Иностранный язык',
      'Физическая культура',
      'История Беларуси',
    ],
  },
  {
    code: 'ЭК',
    name: 'Экономика и бухгалтерский учёт',
    subjects: [
      'Экономика организации',
      'Бухгалтерский учёт',
      'Финансы и кредит',
      'Статистика',
      'Менеджмент',
      'Маркетинг',
      'Налоги и налогообложение',
      'Правовое обеспечение',
      'Математика',
      'Иностранный язык',
      'Физическая культура',
      'История Беларуси',
    ],
  },
];

const MALE_FIRST_NAMES = [
  'Александр', 'Алексей', 'Андрей', 'Антон', 'Артём', 'Богдан',
  'Владислав', 'Глеб', 'Даниил', 'Денис', 'Дмитрий', 'Егор',
  'Иван', 'Игорь', 'Илья', 'Кирилл', 'Константин', 'Лев',
  'Максим', 'Марк', 'Матвей', 'Михаил', 'Никита', 'Николай',
  'Олег', 'Павел', 'Пётр', 'Роман', 'Руслан', 'Сергей',
  'Станислав', 'Степан', 'Тимур', 'Фёдор', 'Эдуард', 'Юрий',
];

const FEMALE_FIRST_NAMES = [
  'Алина', 'Алиса', 'Алла', 'Анастасия', 'Ангелина', 'Анна',
  'Антонина', 'Валерия', 'Варвара', 'Василиса', 'Вера', 'Вероника',
  'Виктория', 'Владислава', 'Галина', 'Дарья', 'Диана', 'Ева',
  'Евгения', 'Екатерина', 'Елена', 'Елизавета', 'Жанна', 'Злата',
  'Инна', 'Ирина', 'Карина', 'Кристина', 'Ксения', 'Лидия',
  'Любовь', 'Маргарита', 'Марина', 'Мария', 'Наталья', 'Ольга',
];

const SURNAMES = [
  'Иванов', 'Смирнов', 'Кузнецов', 'Попов', 'Васильев', 'Петров',
  'Соколов', 'Михайлов', 'Новиков', 'Фёдоров', 'Морозов', 'Волков',
  'Алексеев', 'Лебедев', 'Семёнов', 'Егоров', 'Павлов', 'Козлов',
  'Степанов', 'Николаев', 'Орлов', 'Андреев', 'Макаров', 'Никитин',
  'Захаров', 'Зайцев', 'Соловьёв', 'Борисов', 'Яковлев', 'Григорьев',
  'Романов', 'Воробьёв', 'Сергеев', 'Кузьмин', 'Фролов', 'Александров',
];

const MALE_PATRONYMICS = [
  'Александрович', 'Алексеевич', 'Андреевич', 'Артёмович',
  'Викторович', 'Владимирович', 'Дмитриевич', 'Иванович',
  'Игоревич', 'Михайлович', 'Николаевич', 'Павлович',
  'Петрович', 'Сергеевич', 'Юрьевич',
];

const FEMALE_PATRONYMICS = [
  'Александровна', 'Алексеевна', 'Андреевна', 'Артёмовна',
  'Викторовна', 'Владимировна', 'Дмитриевна', 'Ивановна',
  'Игоревна', 'Михайловна', 'Николаевна', 'Павловна',
  'Петровна', 'Сергеевна', 'Юрьевна',
];

const TEACHERS = [
  'Смирнова А.П.', 'Петров В.С.', 'Иванова Е.М.', 'Козлов Д.А.',
  'Сидорова Н.В.', 'Морозов И.К.', 'Волков П.Р.', 'Агнетова Т.Л.',
  'Королёва М.А.', 'Орлов С.Н.', 'Макарова О.В.', 'Захаров А.И.',
];

const DAY_LESSONS = [
  { day: 1, lessons: [1, 2, 3, 4, 5] },
  { day: 2, lessons: [1, 2, 3, 4, 5] },
  { day: 3, lessons: [1, 2, 3, 4, 5] },
  { day: 4, lessons: [1, 2, 3, 4, 5] },
  { day: 5, lessons: [1, 2, 3, 4, 5] },
  { day: 6, lessons: [1, 2, 3] },
];

const uid = () => crypto.randomUUID();
const nowISO = () => new Date().toISOString();
const pad2 = (n) => String(n).padStart(2, '0');

function feminineSurname(surname) {
  if (surname.endsWith('ский')) return `${surname.slice(0, -4)}ская`;
  if (surname.endsWith('цкий')) return `${surname.slice(0, -4)}цкая`;
  return `${surname}а`;
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function isoDow(date) {
  const [year, month, day] = date.split('-').map(Number);
  return ((new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7) + 1;
}

function* eachDate(from, to) {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  for (let value = Date.UTC(fy, fm - 1, fd); value <= Date.UTC(ty, tm - 1, td); value += 86400000) {
    yield new Date(value).toISOString().slice(0, 10);
  }
}

function buildGroups() {
  const groups = [];
  for (const course of COURSES) {
    for (const specialty of SPECIALTIES) {
      groups.push({
        name: `${specialty.code}-${course}1`,
        course,
        specialty: specialty.name,
        subjects: specialty.subjects,
        index: groups.length,
      });
    }
  }
  return groups;
}

function buildStudents(groups, userAccount) {
  const students = [];
  const targets = new Map();
  const usedNames = new Set();
  let sequence = 0;
  let studentNumber = 0;

  const nextName = () => {
    for (let attempt = 0; attempt < 500; attempt += 1) {
      const index = sequence + attempt;
      const female = index % 2 === 1;
      const surnameBase = SURNAMES[index % SURNAMES.length];
      const surname = female ? feminineSurname(surnameBase) : surnameBase;
      const first = (female ? FEMALE_FIRST_NAMES : MALE_FIRST_NAMES)[
        Math.floor(index / 2) % (female ? FEMALE_FIRST_NAMES.length : MALE_FIRST_NAMES.length)
      ];
      const patronymic = (female ? FEMALE_PATRONYMICS : MALE_PATRONYMICS)[
        Math.floor(index / 3) % (female ? FEMALE_PATRONYMICS.length : MALE_PATRONYMICS.length)
      ];
      const fullName = `${surname} ${first} ${patronymic}`;
      if (!usedNames.has(fullName)) {
        usedNames.add(fullName);
        sequence = index + 1;
        return { fullName, female };
      }
    }
    throw new Error('Не удалось подобрать уникальное ФИО');
  };

  for (const group of groups) {
    for (let position = 0; position < STUDENTS_PER_GROUP; position += 1) {
      studentNumber += 1;
      const { fullName } = nextName();
      const hasDebt = studentNumber % 11 === 0;
      const attendance = hasDebt
        ? 62 + ((studentNumber * 7) % 20)
        : 78 + ((studentNumber * 13) % 22);
      const performance = hasDebt
        ? 3.2 + ((studentNumber * 17) % 20) / 10
        : 4.5 + ((studentNumber * 19) % 50) / 10;
      const createdAt = new Date(
        Date.now() - (studentNumber % 90) * 86400000 - (studentNumber % 24) * 3600000,
      ).toISOString();
      const student = {
        id: uid(),
        fullName,
        course: group.course,
        group: group.name,
        specialty: group.specialty,
        attendance,
        performance: Number(performance.toFixed(1)),
        academicDebt: hasDebt,
        email: `student${String(studentNumber).padStart(3, '0')}@college.local`,
        phone: `+37529${String(1000000 + studentNumber * 7919).slice(-7)}`,
        userId: null,
        status: 'approved',
        createdAt,
        updatedAt: createdAt,
      };
      targets.set(student.id, { attendance, performance });
      students.push(student);
    }
  }

  const demoStudent = students.find((student) => student.group === 'ПО-21');
  if (demoStudent && userAccount) demoStudent.userId = userAccount.id;

  const pendingGroups = ['ИС-11', 'ПО-21', 'ИС-41', 'ЭК-51'];
  for (let i = 0; i < PENDING_STUDENTS; i += 1) {
    studentNumber += 1;
    const { fullName } = nextName();
    const group = groups.find((row) => row.name === pendingGroups[i]);
    const createdAt = new Date(Date.now() - i * 86400000).toISOString();
    students.push({
      id: uid(),
      fullName,
      course: group.course,
      group: group.name,
      specialty: group.specialty,
      attendance: 100,
      performance: 4,
      academicDebt: false,
      email: `applicant${String(i + 1).padStart(2, '0')}@college.local`,
      phone: `+37529${String(9000000 + i * 137).slice(-7)}`,
      userId: null,
      status: 'pending',
      createdAt,
      updatedAt: createdAt,
    });
  }

  return { students, targets };
}

function buildSchedule(groups) {
  const rows = [];
  for (const group of groups) {
    let step = group.index * 5;
    for (const { day, lessons } of DAY_LESSONS) {
      for (const lesson of lessons) {
        const subject = group.subjects[step % group.subjects.length];
        const teacher = TEACHERS[(group.index + day + lesson) % TEACHERS.length];
        const room = subject === 'Физическая культура'
          ? 'Спортзал'
          : String(100 + ((group.index * 13 + day * 17 + lesson * 7) % 400));
        const timestamp = nowISO();
        rows.push({
          id: uid(),
          group: group.name,
          dayOfWeek: day,
          lessonNumber: lesson,
          subject,
          teacher,
          room,
          week: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        step += 1;
      }
    }
  }
  return rows;
}

async function main() {
  await connectDb();
  await seedUsers();

  const startedAt = nowISO();
  const semesterStart = defaultSemesterStart(new Date());
  const today = new Date().toISOString().slice(0, 10);

  const [curator, userAccount] = await Promise.all([
    User.findOne({ role: 'curator' }).lean(),
    User.findOne({ email: 'user@college.local' }).lean(),
  ]);

  const groups = buildGroups();
  const { students, targets } = buildStudents(groups, userAccount);
  const schedule = buildSchedule(groups);

  const subjectNames = [...new Set(SPECIALTIES.flatMap((specialty) => specialty.subjects))];
  const subjects = subjectNames.map((name) => ({
    id: uid(),
    name,
    createdAt: startedAt,
  }));
  const subjectIdByName = new Map(subjects.map((subject) => [subject.name, subject.id]));

  logger.info('Очищаю студентов, предметы, расписание, оценки и посещаемость...');
  await Promise.all([
    Student.deleteMany({}),
    Subject.deleteMany({}),
    Schedule.deleteMany({}),
    Mark.deleteMany({}),
    Attendance.deleteMany({}),
  ]);

  await setSemesterStart(semesterStart);
  await Subject.insertMany(subjects, { ordered: false });
  await Student.insertMany(students, { ordered: false });
  await Schedule.insertMany(schedule, { ordered: false });

  if (curator) {
    await User.updateOne(
      { id: curator.id },
      { $set: { group: 'ПО-31', updatedAt: nowISO() } },
    );
  }

  const approvedByGroup = new Map();
  for (const student of students) {
    if (student.status !== 'approved') continue;
    if (!approvedByGroup.has(student.group)) approvedByGroup.set(student.group, []);
    approvedByGroup.get(student.group).push(student);
  }

  const scheduleByGroup = new Map();
  for (const entry of schedule) {
    if (!scheduleByGroup.has(entry.group)) scheduleByGroup.set(entry.group, []);
    scheduleByGroup.get(entry.group).push(entry);
  }

  let attendanceCount = 0;
  let markCount = 0;

  for (const group of groups) {
    const groupStudents = approvedByGroup.get(group.name) ?? [];
    const groupSchedule = scheduleByGroup.get(group.name) ?? [];
    const attendanceRows = [];
    const markRows = [];
    let lessonSequence = 0;

    for (const date of eachDate(semesterStart, today)) {
      const dow = isoDow(date);
      if (dow === 7) continue;
      const week = weekOfDate(date, semesterStart);
      const lessons = groupSchedule.filter((entry) => (
        entry.dayOfWeek === dow && (entry.week === null || entry.week === week)
      ));

      for (const lesson of lessons) {
        lessonSequence += 1;
        for (let studentIndex = 0; studentIndex < groupStudents.length; studentIndex += 1) {
          const student = groupStudents[studentIndex];
          const target = targets.get(student.id);
          const random = hashString(`${student.id}|${date}|${lesson.id}`) % 100;
          const status = random < target.attendance - 6
            ? 'present'
            : random < target.attendance
              ? 'late'
              : 'absent';

          attendanceRows.push({
            id: uid(),
            scheduleId: lesson.id,
            date,
            studentId: student.id,
            status,
            createdAt: `${date}T09:00:00.000Z`,
          });

          if (status !== 'absent' && (lessonSequence + studentIndex) % 5 === 0) {
            const delta = ((hashString(`${student.id}|${date}|${lesson.id}|mark`) >>> 8) % 5) - 2;
            const mark = Math.max(1, Math.min(10, Math.round(target.performance + delta)));
            markRows.push({
              id: uid(),
              studentId: student.id,
              subjectId: subjectIdByName.get(lesson.subject),
              mark,
              scheduleId: lesson.id,
              date,
              createdAt: `${date}T09:00:00.000Z`,
            });
          }
        }
      }
    }

    if (attendanceRows.length > 0) {
      await Attendance.insertMany(attendanceRows, { ordered: false });
      attendanceCount += attendanceRows.length;
    }
    if (markRows.length > 0) {
      await Mark.insertMany(markRows, { ordered: false });
      markCount += markRows.length;
    }
    logger.info(`${group.name}: ${groupStudents.length} студентов, ${groupSchedule.length} занятий в расписании`);
  }

  logger.info('Пересчитываю успеваемость и посещаемость по журналу...');
  for (const student of students) {
    if (student.status !== 'approved') continue;
    await recomputeStudentPerformance(student.id);
    await recomputeStudentAttendance(student.id);
  }

  logger.info('--- тестовые данные готовы ---');
  logger.info(`Семестр: ${semesterStart} — ${today}`);
  logger.info(`Групп: ${groups.length}, студентов: ${students.length} (подтверждено: ${students.filter((s) => s.status === 'approved').length}, заявок: ${PENDING_STUDENTS})`);
  logger.info(`Предметов: ${subjects.length}, занятий в расписании: ${schedule.length}`);
  logger.info(`Посещаемость: ${attendanceCount}, оценок: ${markCount}`);
  logger.info('Куратор переведён в группу ПО-31, пользователь привязан к студенту группы ПО-21.');

  process.exit(0);
}

main().catch((err) => {
  logger.error('Не удалось создать тестовые данные:', err);
  process.exit(1);
});
