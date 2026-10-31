# База данных учащихся колледжа — версия на MongoDB

Отдельная версия существующего проекта «База данных учащихся колледжа», переведённая
на **нереляционную (документо-ориентированную) СУБД MongoDB**. Функциональность,
маршруты API и интерфейс повторяют исходный проект, но весь код написан на
**чистом JavaScript** (Node.js + Express + Mongoose и React без TypeScript).

> Исходный проект не изменялся: эта версия лежит в отдельном каталоге `nosql-js/`
> и использует собственные зависимости, конфигурацию и базу данных.

## Чем отличается от SQL-версии

| | Исходный проект | Эта версия |
|---|---|---|
| СУБД | SQLite / PostgreSQL | **MongoDB 7** |
| Модель данных | таблицы, внешние ключи, JOIN | **коллекции документов**, ссылки строковыми `id`, `$lookup`/выборки в приложении |
| Доступ к данным | Drizzle ORM, SQL-миграции | **Mongoose**, схемы как описание формы документа, индексы вместо миграций |
| Язык | TypeScript | **чистый JavaScript (ESM)** |
| Фронтенд | React + TSX | **React + JSX** |
| Тесты | Vitest | **Node.js test runner + supertest** (backend), **Vitest** (frontend) |

## Возможности

Функциональность полностью перенесена из исходного проекта:

- CRUD студентов, поиск, фильтры, сортировка и пагинация;
- академические задолженности (переключение в один клик);
- импорт/экспорт JSON и Excel, пакетные операции;
- авторизация по email/паролю, JWT access/refresh, bcrypt, роли `admin`, `curator`, `user`;
- регистрация с автоматическим созданием карточки студента;
- куратор видит только свою группу;
- электронный дневник: предметы, оценки (шкала 1–10), посещаемость;
- недельное расписание занятий по группам;
- аудит действий, статистика и графики, тёмная тема, PWA;
- вебхуки, email-уведомления (SMTP), Swagger, rate-limiting, Helmet, сжатие ответов.

## Технологии

**Backend:** Node.js 20+, Express 4, Mongoose 8, MongoDB 7, JWT, bcryptjs, Zod,
Winston, Helmet, express-rate-limit, Swagger UI, Nodemailer.

**Frontend:** React 18, Vite 6, React Router 6, Axios, Tailwind CSS 3,
react-hot-toast, xlsx, lucide-react, Sentry (опционально).

**Тесты:** `node:test` + `supertest` + `mongodb-memory-server`; Vitest + Testing Library.

## Требования

- Node.js **20.12+** (рекомендуется 22 LTS), npm 10+;
- MongoDB 7 — локально, в Docker или MongoDB Atlas;
- либо ничего из этого: режим `dev:memory` поднимает временную MongoDB в памяти.

## Быстрый старт

### Вариант 1. Без установки MongoDB (in-memory)

```bash
cd nosql-js
npm install
npm run dev:memory
```

`dev:memory` запускает `mongodb-memory-server` (бинарник `mongod` скачивается один раз),
бэкенд на http://localhost:5000 и Vite на http://localhost:3000.
Данные живут до остановки процесса.

### Вариант 2. Локальная MongoDB

```bash
# запустите mongod или контейнер:
docker run -d --name college-mongo -p 27017:27017 mongo:7

cd nosql-js
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
Бэкенд работает и без `.env`, используя значения по умолчанию.

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

Фронтенд: `frontend/.env.example` (`VITE_API_PROXY`, `VITE_SENTRY_DSN`).

## Скрипты

Из корня `nosql-js/`:

| Команда | Описание |
|---------|----------|
| `npm run dev` | Backend + frontend с внешней MongoDB |
| `npm run dev:memory` | Backend с in-memory MongoDB + frontend |
| `npm run build` | Сборка фронтенда в `frontend/dist` |
| `npm start` | Запуск backend (отдаёт собранный фронтенд) |
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
явными запросами — в MongoDB нет `ON DELETE CASCADE`.

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
npm run test:backend   # node:test + supertest + mongodb-memory-server
npm run test:frontend  # Vitest + Testing Library
npm run e2e -w frontend  # Playwright (нужны установленные браузеры)
```

Backend-тесты поднимают отдельную in-memory MongoDB, поэтому реальная база не нужна.
E2E-конфигурация (`frontend/playwright.config.js`) сама запускает backend в режиме
`dev:memory` и Vite.

## Docker

```bash
cd nosql-js
export JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))")
export REFRESH_TOKEN_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))")
export RESET_TOKEN_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))")
docker compose up -d --build
```

Поднимаются MongoDB 7 (том `mongo-data`) и backend на http://localhost:5000,
который раздаёт собранный фронтенд и API. В `NODE_ENV=production` все три секрета
обязательны и должны быть не короче 32 символов.

## Структура проекта

```
nosql-js/
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

MIT. Проект создан на основе исходного дипломного проекта
«База данных учащихся колледжа».
