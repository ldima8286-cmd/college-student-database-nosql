# База данных учащихся колледжа

![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-8-880000?logo=mongoose&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
![Tests](https://img.shields.io/badge/tests-26_passed-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

Full-stack приложение для учёта студентов колледжа: карточки учащихся, группы,
специальности, предметы, расписание, электронный журнал, оценки и посещаемость,
роли пользователей и аудит действий.

Backend работает на **Node.js + Express + Mongoose + MongoDB**, frontend — на
**React + Vite + Tailwind CSS**. Весь код написан на **чистом JavaScript** без
TypeScript. Приложение можно запустить с локальной MongoDB, с MongoDB Atlas или
вообще без установки базы — с временной MongoDB в памяти.

**Живое демо:** https://ldima8286-cmd.github.io/college-student-database-nosql/

## Возможности

- CRUD студентов, поиск, фильтры, сортировка и пагинация;
- академические задолженности — переключение в один клик;
- импорт и экспорт JSON/Excel, пакетные операции;
- авторизация по email и паролю: JWT access/refresh, bcrypt, роли `admin`, `curator`, `user`;
- регистрация с автоматическим созданием карточки студента;
- куратор видит только студентов своей группы;
- электронный дневник: предметы, оценки по шкале 1–10, посещаемость;
- недельное расписание занятий по группам;
- журнал аудита, статистика и графики;
- тёмная тема и PWA;
- вебхуки, email-уведомления через SMTP, Swagger UI;
- rate-limiting, Helmet, сжатие ответов, Zod-валидация.

## Стек

| Слой | Технологии |
|------|------------|
| Backend | Node.js 20+, Express 4, Mongoose 8, MongoDB 7 |
| Аутентификация | JWT (access/refresh), bcryptjs, Zod |
| Frontend | React 18, Vite 6, React Router 6, Axios, Tailwind CSS 3 |
| UI и утилиты | lucide-react, react-hot-toast, xlsx, Sentry (опционально) |
| Инфраструктура | Docker, Docker Compose, Swagger UI, Winston, Nodemailer |
| Тесты | `node:test` + `supertest` + `mongodb-memory-server`, Vitest + Testing Library, Playwright |

## Требования

- Node.js **20.12+** (рекомендуется 22 LTS), npm 10+;
- MongoDB 7 — локально, в Docker или MongoDB Atlas;
- либо ничего из этого: режим `dev:memory` поднимает временную MongoDB в памяти.

## Быстрый старт

### Вариант 1. Без установки MongoDB (in-memory)

```bash
npm install
npm run dev:memory
```

`dev:memory` запускает `mongodb-memory-server` (бинарник `mongod` скачивается один раз),
backend на http://localhost:5000 и Vite на http://localhost:3000.
Данные живут до остановки процесса.

### Вариант 2. Локальная MongoDB

```bash
# запустите mongod или контейнер:
docker run -d --name college-mongo -p 27017:27017 mongo:7

npm install
cp backend/.env.example backend/.env   # при необходимости поправьте MONGO_URI
npm run dev
```

Откройте http://localhost:3000. Vite проксирует `/api` на порт 5000.

### Вариант 3. MongoDB Atlas

Укажите строку подключения в `backend/.env`:

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/college_students?retryWrites=true&w=majority
```

### Учётные данные по умолчанию

| Роль | Email | Пароль | Группа |
|------|-------|--------|--------|
| Администратор | `admin@college.local` | `admin123` | — |
| Куратор | `curator@college.local` | `curator123` | `ПО-507` |
| Пользователь | `user@college.local` | `user123` | — |

Пользователи создаются при первом запуске, если коллекция `users` пуста.
Значения настраиваются переменными окружения — обязательно смените их в продакшене.

## Конфигурация

Все переменные собраны в `backend/src/env.js`; шаблон — `backend/.env.example`.
Backend работает и без `.env`, используя значения по умолчанию.

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `PORT` | `5000` | Порт HTTP-сервера |
| `NODE_ENV` | `development` | `development` / `production` / `test` |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/college_students` | Строка подключения MongoDB |
| `MONGO_DB_NAME` | *(из URI)* | Необязательное переопределение имени БД |
| `JWT_SECRET` | dev-значение | Секрет access-токенов; в production обязателен, ≥ 32 символов |
| `REFRESH_TOKEN_SECRET` | dev-значение | Секрет refresh-токенов; те же требования |
| `RESET_TOKEN_SECRET` | dev-значение | Секрет токенов сброса пароля |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@college.local` / `admin123` | Администратор |
| `USER_EMAIL` / `USER_PASSWORD` | `user@college.local` / `user123` | Пользователь |
| `CURATOR_EMAIL` / `CURATOR_PASSWORD` | `curator@college.local` / `curator123` | Куратор |
| `CURATOR_GROUP` | `ПО-507` | Группа куратора |
| `CORS_ORIGIN` | `http://localhost:3000` | Разрешённый origin |
| `FRONT_URL` | `http://localhost:3000` | Ссылки в письмах |
| `SMTP_*` | *(пусто)* | SMTP для email-уведомлений |
| `AUDIT_RETENTION_DAYS` | `30` | Срок хранения аудит-лога |
| `AUDIT_MAX_ROWS` | `2000` | Максимум записей аудит-лога |

Frontend: `frontend/.env.example` (`VITE_API_PROXY`, `VITE_SENTRY_DSN`).

## Скрипты

Из корня проекта:

| Команда | Описание |
|---------|----------|
| `npm run dev` | Backend + frontend с внешней MongoDB |
| `npm run dev:memory` | Backend с in-memory MongoDB + frontend |
| `npm run build` | Сборка frontend в `frontend/dist` |
| `npm run build:pages` | Сборка статического демо для GitHub Pages (моковые данные, без backend) |
| `npm start` | Запуск backend (отдаёт собранный frontend) |
| `npm test` | Все тесты (backend + frontend) |
| `npm run test:backend` | Интеграционные тесты API |
| `npm run test:frontend` | Юнит-тесты React |
| `npm run db:fill` | Дозаполнение расписания, посещаемости и оценок |

Отдельно: `npm run dev -w backend`, `npm test -w frontend`, `npm run e2e -w frontend`.

## Модель данных MongoDB

База `college_students`, коллекции:

| Коллекция | Назначение | Ключевые поля |
|-----------|------------|---------------|
| `students` | карточки студентов | `id`, `fullName`, `group`, `course`, `academicDebt`, `userId`, `status` |
| `users` | аккаунты и роли | `id`, `email` (unique), `passwordHash`, `role`, `group` |
| `subjects` | справочник предметов | `id`, `name` (unique) |
| `schedule` | недельное расписание | `id`, `group`, `dayOfWeek`, `lessonNumber`, `subject` |
| `marks` | оценки | `id`, `studentId`, `subjectId`, `mark`, `scheduleId`, `date` |
| `attendance` | посещаемость | `id`, `scheduleId`, `studentId`, `date`, `status` |
| `audit_log` | журнал действий | `id`, `action`, `entity`, `userId`, `createdAt` |
| `refresh_sessions` | активные refresh-токены | `jti` (unique), `userId`, `expiresAt` |
| `settings` | служебные настройки | `key` (unique), `value` |

Связи между документами — строковые идентификаторы (`studentId`, `subjectId`,
`scheduleId`, `userId`), а не внешние ключи. Уникальность и скорость выборок
обеспечивают индексы Mongoose (`models.js`). Каскадное удаление (например,
удаление студента вместе с оценками и посещаемостью) выполняется в `db.js`
явными запросами.

## API

Swagger UI: http://localhost:5000/api/docs

Основные маршруты (`backend/src/routes.js`):

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/health` | Проверка работоспособности |
| `POST` | `/api/auth/register` / `login` / `refresh` / `logout` | Авторизация |
| `POST` | `/api/auth/forgot-password` / `reset-password` | Восстановление пароля |
| `GET/PUT` | `/api/auth/me` | Профиль |
| `PUT` | `/api/auth/me/password` | Смена пароля |
| `GET/POST` | `/api/students` | Список / создание |
| `GET/PUT/DELETE` | `/api/students/:id` | Карточка студента |
| `PATCH` | `/api/students/:id/toggle-debt` | Задолженность |
| `POST` | `/api/students/:id/approve` | Подтверждение заявки |
| `GET` | `/api/students/stats` | Статистика |
| `POST` | `/api/students/batch-delete` / `batch-update` / `batch-export` / `batch-import` | Пакетные операции |
| `GET` | `/api/groups` | Список групп |
| `GET/POST/DELETE` | `/api/subjects` | Справочник предметов |
| `GET/POST/PUT/DELETE` | `/api/schedule` | Расписание |
| `GET/PUT` | `/api/journal/summary`, `/api/journal/:scheduleId` | Дневник и посещаемость |
| `GET/POST/PUT/DELETE` | `/api/students/:id/marks`, `/api/marks/:id` | Оценки |
| `GET/DELETE` | `/api/audit-logs` | Аудит (admin) |
| `GET` | `/api/public/stats` | Открытая статистика |

## Тестирование

```bash
npm run test:backend     # node:test + supertest + mongodb-memory-server
npm run test:frontend    # Vitest + Testing Library
npm run e2e -w frontend  # Playwright (нужны установленные браузеры)
```

Backend-тесты поднимают отдельную in-memory MongoDB, поэтому реальная база не нужна.
E2E-конфигурация (`frontend/playwright.config.js`) сама запускает backend в режиме
`dev:memory` и Vite.

## Демо для GitHub Pages

Статическая демо-версия доступна по адресу:

**https://ldima8286-cmd.github.io/college-student-database-nosql/**

Она собирается без backend и работает полностью в браузере:

```bash
npm run build:pages
```

Что происходит в демо-режиме:

- `VITE_DEMO=true` включает моковый адаптер axios (`frontend/src/demo.js`);
- запросы к `/api` не уходят в сеть — ответы формируются из данных в памяти;
- предзаполнены студенты, группы, предметы, расписание, оценки, посещаемость,
  пользователи и аудит;
- вход выполняется автоматически под администратором; выйти можно кнопкой «Выйти»,
  после чего на странице входа доступны демо-аккаунты с любым паролем:
  `admin@college.local`, `curator@college.local`, `user@college.local`;
- изменения (добавление/удаление студентов, оценки, журнал) работают до перезагрузки
  страницы;
- сборка использует base-путь `/college-student-database-nosql/` из
  `frontend/.env.demo`, создаёт `404.html` для SPA-маршрутов и `.nojekyll`.

Готовые файлы публикуются в отдельную ветку **`gh-pages`**, исходный код остаётся
в `main`. GitHub Pages настроен на раздачу из ветки `gh-pages` (корень).

## Docker

```bash
export JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))")
export REFRESH_TOKEN_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))")
export RESET_TOKEN_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))")
docker compose up -d --build
```

Поднимаются MongoDB 7 (том `mongo-data`) и backend на http://localhost:5000,
который раздаёт собранный frontend и API. В `NODE_ENV=production` все три секрета
обязательны и должны быть не короче 32 символов.

## Структура проекта

```
.
├── package.json              # npm workspaces + общие скрипты
├── docker-compose.yml
├── Dockerfile
├── backend/
│   ├── src/
│   │   ├── models.js         # Mongoose-схемы и индексы
│   │   ├── db.js             # слой доступа к MongoDB
│   │   ├── routes.js         # REST API
│   │   ├── auth.js           # JWT, роли
│   │   ├── app.js            # Express, статика, безопасность
│   │   ├── env.js            # конфигурация
│   │   └── index.js          # запуск, seed
│   ├── scripts/dev-memory.js # mongodb-memory-server
│   └── test/api.test.js
└── frontend/
    ├── src/                  # React + JSX
    ├── e2e/                  # Playwright
    └── vite.config.js
```

## Безопасность

- Helmet, CORS, rate-limiting (включая GET), сжатие ответов;
- bcrypt-хеши паролей, короткоживущие access-токены и refresh-сессии в MongoDB;
- Zod-валидация входных данных;
- в production приложение не стартует с dev-секретами или секретами короче 32 символов.

## Лицензия

MIT.
