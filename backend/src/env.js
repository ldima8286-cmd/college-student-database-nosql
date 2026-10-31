/**
 * Конфигурация приложения.
 *
 * В нереляционной версии вместо DATABASE_URL используется MONGO_URI.
 * Значения по умолчанию позволяют запустить backend локально без .env
 * (при условии, что MongoDB слушает стандартный порт 27017).
 */
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {
    /* файла .env может не быть — это нормально */
  }
}

function str(name, fallback = '') {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

function num(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`${name} должен быть числом`);
  return value;
}

function port(name, fallback) {
  const value = num(name, fallback);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`${name} должен быть портом 1..65535`);
  }
  return value;
}

const NODE_ENV = (() => {
  const raw = process.env.NODE_ENV;
  if (raw === 'production' || raw === 'test') return raw;
  if (raw === undefined || raw === 'development') return 'development';
  throw new Error('NODE_ENV must be development, production or test');
})();

const DEV_FALLBACK_SECRETS = new Set([
  'dev-secret-change-in-production',
  'refresh-secret-change-in-production',
  'reset-secret-change-in-production',
]);

export const env = {
  PORT: port('PORT', 5000),
  NODE_ENV,
  MONGO_URI: str('MONGO_URI', str('DATABASE_URL', 'mongodb://127.0.0.1:27017/college_students')),
  MONGO_DB_NAME: str('MONGO_DB_NAME', ''),
  JWT_SECRET: str('JWT_SECRET', 'dev-secret-change-in-production'),
  REFRESH_TOKEN_SECRET: str('REFRESH_TOKEN_SECRET', 'refresh-secret-change-in-production'),
  RESET_TOKEN_SECRET: str('RESET_TOKEN_SECRET', 'reset-secret-change-in-production'),
  ADMIN_EMAIL: str('ADMIN_EMAIL', 'admin@college.local'),
  ADMIN_PASSWORD: str('ADMIN_PASSWORD', 'admin123'),
  USER_EMAIL: str('USER_EMAIL', 'user@college.local'),
  USER_PASSWORD: str('USER_PASSWORD', 'user123'),
  CURATOR_EMAIL: str('CURATOR_EMAIL', 'curator@college.local'),
  CURATOR_PASSWORD: str('CURATOR_PASSWORD', 'curator123'),
  CURATOR_GROUP: str('CURATOR_GROUP', 'ПО-507'),
  CORS_ORIGIN: str('CORS_ORIGIN', 'http://localhost:3000'),
  FRONT_URL: str('FRONT_URL', 'http://localhost:3000'),
  SMTP_HOST: str('SMTP_HOST', ''),
  SMTP_PORT: port('SMTP_PORT', 587),
  SMTP_USER: str('SMTP_USER', ''),
  SMTP_PASS: str('SMTP_PASS', ''),
  SMTP_FROM: str('SMTP_FROM', 'noreply@college.local'),
  AUDIT_RETENTION_DAYS: num('AUDIT_RETENTION_DAYS', 30),
  AUDIT_MAX_ROWS: num('AUDIT_MAX_ROWS', 2000),
};

if (NODE_ENV === 'production') {
  const required = [
    ['JWT_SECRET', env.JWT_SECRET],
    ['REFRESH_TOKEN_SECRET', env.REFRESH_TOKEN_SECRET],
    ['RESET_TOKEN_SECRET', env.RESET_TOKEN_SECRET],
  ];
  const problems = required.flatMap(([name, value]) => {
    if (!value) return [`${name}: не задан`];
    if (DEV_FALLBACK_SECRETS.has(value)) {
      return [`${name}: используется значение для разработки — сгенерируйте случайный секрет`];
    }
    if (value.length < 32) return [`${name}: минимум 32 символа, получено ${value.length}`];
    return [];
  });
  if (problems.length > 0) {
    throw new Error(
      `Отказ запуска в production из-за небезопасных секретов:\n  - ${problems.join('\n  - ')}\n`
      + 'Сгенерируйте значения командой: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"',
    );
  }
}
