/**
 * Небольшой TTL-кэш в памяти процесса.
 *
 * В нереляционной версии отдельный Redis не обязателен: MongoDB — основное
 * хранилище, а кэш нужен только для тяжёлых агрегатов статистики.
 */
const memory = new Map();

function cleanupExpired() {
  const now = Date.now();
  for (const [key, entry] of memory.entries()) {
    if (entry.expiresAt < now) memory.delete(key);
  }
}

export async function cached(key, ttlMs, loader) {
  cleanupExpired();
  const hit = memory.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  const value = await loader();
  memory.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function invalidateCache(prefix) {
  for (const key of memory.keys()) {
    if (key.startsWith(prefix)) memory.delete(key);
  }
}
