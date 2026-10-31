import axios from 'axios';
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password'];
const api = axios.create({
    baseURL: '/api',
    timeout: 10000,
    withCredentials: true,
});
export function getCookie(name) {
    if (typeof document === 'undefined')
        return undefined;
    const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}
export function setCookie(name, value) {
    if (typeof document === 'undefined')
        return;
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}
export function clearLocalCookies() {
    document.cookie = 'role=; path=/; max-age=0';
    document.cookie = 'x_csrf=; path=/; max-age=0';
}
api.interceptors.request.use((config) => {
    const method = (config.method ?? 'get').toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const csrf = getCookie('x_csrf');
        if (csrf)
            config.headers['X-CSRF-Token'] = csrf;
    }
    return config;
});
let refreshPromise = null;
export async function tryRefresh() {
    if (!refreshPromise) {
        refreshPromise = (async () => {
            try {
                await api.post('/auth/refresh', null);
                return true;
            }
            catch {
                return false;
            }
            finally {
                refreshPromise = null;
            }
        })();
    }
    return refreshPromise;
}
function handleSessionExpired() {
    clearLocalCookies();
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
}
api.interceptors.response.use((response) => response, async (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';
    const method = (error.config?.method ?? 'get').toUpperCase();
    const cfg = error.config;
    if (status === 401 && !AUTH_PATHS.includes(url) && cfg && !cfg._retried) {
        const ok = await tryRefresh();
        if (ok) {
            cfg._retried = true;
            const csrf = getCookie('x_csrf');
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && csrf) {
                cfg.headers['X-CSRF-Token'] = csrf;
            }
            return api.request(cfg);
        }
        handleSessionExpired();
    }
    return Promise.reject(new Error(error.response?.data?.error || 'Ошибка сети'));
});
export async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    if (!data.success || !data.data)
        throw new Error(data.error || 'Ошибка входа');
    return { role: data.data.role };
}
export async function logout() {
    try {
        await api.post('/auth/logout', null);
    }
    catch {
        /* сеть недоступна — подчищаем локально */
    }
    finally {
        clearLocalCookies();
    }
}
export async function forgotPassword(email) {
    const { data } = await api.post('/auth/forgot-password', { email });
    if (!data.success)
        throw new Error(data.error || 'Ошибка запроса');
}
export async function resetPassword(token, newPassword) {
    const { data } = await api.post('/auth/reset-password', { token, newPassword });
    if (!data.success)
        throw new Error(data.error || 'Ошибка сброса пароля');
}
export function getRole() {
    const role = getCookie('role');
    return role === 'admin' || role === 'curator' || role === 'user' ? role : null;
}
export function isAuthenticated() {
    return getRole() !== null;
}
export function isAdmin() {
    return getRole() === 'admin';
}
export function isCurator() {
    return getRole() === 'curator';
}
export async function getStudents(params) {
    const { signal, ...query } = params;
    const { data } = await api.get('/students', { params: query, signal });
    return data;
}
export async function createStudent(student) {
    const { data } = await api.post('/students', student);
    if (!data.success || !data.data)
        throw new Error('Ошибка создания');
    return data.data;
}
export async function importStudents(students) {
    const { data } = await api.post('/students/batch-import', { students });
    if (!data.success || !data.data)
        throw new Error('Ошибка импорта');
    return data.data;
}
export async function updateStudent(id, student) {
    const { data } = await api.put(`/students/${id}`, student);
    if (!data.success || !data.data)
        throw new Error('Ошибка обновления');
    return data.data;
}
export async function deleteStudent(id) {
    await api.delete(`/students/${id}`);
}
export async function toggleDebt(id) {
    const { data } = await api.patch(`/students/${id}/toggle-debt`);
    if (!data.success || !data.data)
        throw new Error('Ошибка');
    return data.data;
}
export async function deleteAllStudents() {
    const { data } = await api.delete('/students');
    return data.data?.deleted ?? 0;
}
export async function getStats() {
    const { data } = await api.get('/students/stats');
    if (!data.success || !data.data)
        throw new Error('Ошибка загрузки статистики');
    return data.data;
}
export async function getPublicStats() {
    const { data } = await api.get('/public/stats');
    if (!data.success || !data.data)
        throw new Error('Ошибка загрузки статистики');
    return data.data;
}
/** Список последних студентов доступен только авторизованным и в рамках группы. */
export async function getRecentStudents() {
    const { data } = await api.get('/students/recent');
    if (!data.success || !data.data)
        return [];
    return data.data;
}
export async function getMyStudent() {
    const { data } = await api.get('/students/me');
    if (!data.success)
        throw new Error(data.error || 'Ошибка загрузки анкеты');
    return data.data ?? null;
}
export async function saveMyStudent(payload) {
    const { data } = await api.put('/students/me', payload);
    if (!data.success || !data.data)
        throw new Error(data.error || 'Ошибка сохранения анкеты');
    return data.data;
}
export async function approveStudent(id) {
    const { data } = await api.post(`/students/${id}/approve`);
    if (!data.success || !data.data)
        throw new Error(data.error || 'Ошибка одобрения');
    return data.data;
}
export async function getAnalytics() {
    const { data } = await api.get('/admin/analytics');
    if (!data.success)
        throw new Error('Ошибка');
    return data.data;
}
export async function register(data) {
    const res = await api.post('/auth/register', data);
    if (!res.data.success)
        throw new Error(res.data.error || 'Ошибка регистрации');
}
export async function getMe(signal) {
    const { data } = await api.get('/auth/me', { signal });
    if (!data.success || !data.data)
        throw new Error('Ошибка загрузки профиля');
    return data.data;
}
export async function updateProfile(data) {
    const { data: res } = await api.put('/auth/me', data);
    if (!res.success)
        throw new Error(res.error || 'Ошибка обновления');
    return res.data;
}
export async function changePassword(data) {
    const { data: res } = await api.put('/auth/me/password', data);
    if (!res.success)
        throw new Error(res.error || 'Ошибка смены пароля');
}
export async function getAuditLogs(page, limit, entity) {
    const { data } = await api.get('/audit-logs', { params: { page, limit, entity } });
    if (!data.success)
        throw new Error('Ошибка загрузки журнала');
    return data;
}
export async function clearAuditLogs() {
    const { data } = await api.delete('/audit-logs');
    if (!data.success)
        throw new Error(data.error || 'Ошибка очистки журнала');
    return data.data?.deleted ?? 0;
}
export async function batchDeleteStudents(ids) {
    await api.post('/students/batch-delete', { ids });
}
export async function batchUpdateStudents(ids, patch) {
    const { data } = await api.post('/students/batch-update', { ids, patch });
    if (!data.success || data.data === undefined)
        throw new Error('Ошибка обновления');
    return data.data.updated;
}
export async function batchExportStudents(ids) {
    const { data } = await api.post('/students/batch-export', { ids });
    if (!data.success || !data.data)
        throw new Error('Ошибка экспорта');
    return data.data;
}
export async function getGroups() {
    const { data } = await api.get('/groups');
    if (!data.success || !data.data)
        throw new Error('Ошибка загрузки групп');
    return data.data;
}
export async function listSubjects() {
    const { data } = await api.get('/subjects');
    if (!data.success || !data.data)
        throw new Error('Ошибка загрузки предметов');
    return data.data;
}
export async function createSubject(name) {
    const { data } = await api.post('/subjects', { name });
    if (!data.success || !data.data)
        throw new Error(data.error || 'Ошибка создания предмета');
    return data.data;
}
export async function deleteSubject(id) {
    const { data } = await api.delete(`/subjects/${id}`);
    if (!data.success)
        throw new Error(data.error || 'Ошибка удаления предмета');
}
export async function getSchedule(group) {
    const { data } = await api.get('/schedule', { params: group ? { group } : {} });
    if (!data.success || !data.data)
        throw new Error('Ошибка загрузки расписания');
    return data.data;
}
export async function createScheduleEntry(entry) {
    const { data } = await api.post('/schedule', entry);
    if (!data.success || !data.data)
        throw new Error(data.error || 'Ошибка сохранения расписания');
    return data.data;
}
export async function updateScheduleEntry(id, entry) {
    const { data } = await api.put(`/schedule/${id}`, entry);
    if (!data.success || !data.data)
        throw new Error(data.error || 'Ошибка обновления расписания');
    return data.data;
}
export async function deleteScheduleEntry(id) {
    const { data } = await api.delete(`/schedule/${id}`);
    if (!data.success)
        throw new Error(data.error || 'Ошибка удаления');
}
export async function deleteScheduleByGroup(group) {
    const { data } = await api.delete('/schedule', { params: { group } });
    return data.data?.deleted ?? 0;
}
export async function getJournalSummary(group, date) {
    const { data } = await api.get('/journal/summary', { params: { group, date } });
    if (!data.success || !data.data)
        throw new Error(data.error || 'Ошибка загрузки журнала');
    const week = data.week;
    const semesterStart = data.semesterStart;
    return { lessons: data.data, week: week ?? 'upper', semesterStart: semesterStart ?? '' };
}
export async function getSettings() {
    const { data } = await api.get('/settings');
    if (!data.success || !data.data)
        throw new Error(data.error || 'Ошибка загрузки настроек');
    return data.data;
}
export async function updateSemesterStart(semesterStart) {
    const { data } = await api.put('/settings', { semesterStart });
    if (!data.success || !data.data)
        throw new Error(data.error || 'Ошибка сохранения настроек');
    return data.data;
}
export async function getJournalLesson(scheduleId, date) {
    const { data } = await api.get(`/journal/${scheduleId}`, { params: { date } });
    if (!data.success || !data.data)
        throw new Error(data.error || 'Ошибка загрузки занятия');
    return data.data;
}
export async function saveJournalLesson(scheduleId, date, entries) {
    const { data } = await api.put(`/journal/${scheduleId}`, { date, entries });
    if (!data.success || !data.data)
        throw new Error(data.error || 'Ошибка сохранения журнала');
    return data.data;
}
export async function getMyMarks() {
    const { data } = await api.get('/marks/me');
    if (!data.success || !data.data)
        throw new Error('Ошибка загрузки оценок');
    return data.data;
}
export async function getStudentMarks(studentId) {
    const { data } = await api.get(`/students/${studentId}/marks`);
    if (!data.success || !data.data)
        throw new Error('Ошибка загрузки оценок');
    return data.data;
}
export async function addMark(studentId, subjectId, mark) {
    const { data } = await api.post(`/students/${studentId}/marks`, { subjectId, mark });
    if (!data.success || !data.data)
        throw new Error(data.error || 'Ошибка добавления оценки');
    return data.data;
}
export async function updateMark(markId, mark) {
    const { data } = await api.put(`/marks/${markId}`, { mark });
    if (!data.success || !data.data)
        throw new Error(data.error || 'Ошибка обновления оценки');
    return data.data;
}
export async function deleteMark(markId) {
    const { data } = await api.delete(`/marks/${markId}`);
    if (!data.success)
        throw new Error(data.error || 'Ошибка удаления оценки');
}
export async function getAdminUsers() {
    const { data } = await api.get('/admin/users');
    if (!data.success || !data.data)
        throw new Error('Ошибка загрузки пользователей');
    return data.data;
}
export async function updateAdminUser(id, patch) {
    const { data } = await api.put(`/admin/users/${id}`, patch);
    if (!data.success || !data.data)
        throw new Error(data.error || 'Ошибка обновления пользователя');
    return data.data;
}
