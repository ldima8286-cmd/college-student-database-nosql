/**
 * Запуск backend с временной MongoDB в памяти.
 *
 * Удобно для демонстрации и проверки без установленного mongod/Docker.
 * Данные живут только пока процесс запущен; для постоянного хранилища
 * используйте MONGO_URI (локальный MongoDB или docker compose).
 */
import fs from 'node:fs';
import { MongoMemoryServer } from 'mongodb-memory-server';

// В некоторых контейнерах/Flatpak /etc/os-release не определяется
// mongodb-memory-server; подсказываем совместимый дистрибутив.
if (process.platform === 'linux' && !process.env.MONGOMS_DISTRO) {
  try {
    const osRelease = fs.readFileSync('/etc/os-release', 'utf8');
    if (osRelease.includes('Freedesktop') || osRelease.includes('flatpak')) {
      process.env.MONGOMS_DISTRO = 'ubuntu-22.04';
    }
  } catch {
    /* ignore */
  }
}

const mongod = await MongoMemoryServer.create({
  instance: { dbName: 'college_students' },
});

process.env.MONGO_URI = mongod.getUri('college_students');
console.log(`[dev:memory] MongoDB запущена: ${process.env.MONGO_URI}`);

const shutdown = async () => {
  await mongod.stop().catch(() => {});
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await import('../src/index.js');
