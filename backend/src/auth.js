import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { env } from './env.js';
import { findUserByEmail, getUserById, saveRefreshSession, getRefreshSession, deleteRefreshSession, deleteRefreshSessionsByUserId } from './db.js';
const ALLOWED_ROLES = ['admin', 'curator', 'user'];
export function normalizeRole(role) {
    return role && ALLOWED_ROLES.includes(role) ? role : 'user';
}
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const CSRF_COOKIE = 'x_csrf';
const ROLE_COOKIE = 'role';
function cookieSecure() {
    return env.NODE_ENV === 'production';
}
export async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}
export async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}
export function signAccessToken(user) {
    const payload = { userId: user.id, email: user.email, role: user.role, type: 'access', jti: crypto.randomUUID() };
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}
export async function revokeRefreshJti(jti) {
    await deleteRefreshSession(jti);
}
export async function revokeAllRefreshTokens(userId) {
    await deleteRefreshSessionsByUserId(userId);
}
export async function signRefreshToken(userId) {
    const jti = crypto.randomUUID();
    await saveRefreshSession(jti, userId, Date.now() + 7 * 24 * 3600 * 1000);
    const payload = { userId, type: 'refresh', jti };
    return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
}
export async function verifyRefreshToken(token) {
    try {
        const decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET);
        if (decoded.type !== 'refresh' || !decoded.userId || !decoded.jti)
            return null;
        const session = await getRefreshSession(decoded.jti);
        if (!session || session.userId !== decoded.userId)
            return null;
        if (session.expiresAt < Date.now()) {
            await deleteRefreshSession(decoded.jti);
            return null;
        }
        return { userId: decoded.userId, jti: decoded.jti };
    }
    catch {
        return null;
    }
}
export async function authenticate(email, password) {
    const user = await findUserByEmail(email.toLowerCase());
    if (!user)
        return null;
    if (!(await comparePassword(password, user.passwordHash)))
        return null;
    const role = normalizeRole(user.role);
    return {
        accessToken: signAccessToken({ id: user.id, email: user.email, role }),
        refreshToken: await signRefreshToken(user.id),
        role,
    };
}
export async function issueTokens(userId) {
    const user = await getUserById(userId);
    const role = normalizeRole(user?.role);
    return {
        accessToken: signAccessToken({ id: userId, email: user?.email ?? '', role }),
        refreshToken: await signRefreshToken(userId),
        role,
    };
}
export function signResetToken(email) {
    const payload = { email, type: 'reset' };
    return jwt.sign(payload, env.RESET_TOKEN_SECRET, { expiresIn: '15m' });
}
export function verifyResetToken(token) {
    try {
        const decoded = jwt.verify(token, env.RESET_TOKEN_SECRET);
        if (decoded.type !== 'reset' || !decoded.email)
            return null;
        return decoded.email;
    }
    catch {
        return null;
    }
}
function csrfToken() {
    return crypto.randomBytes(32).toString('hex');
}
export function setAuthCookies(res, session) {
    const secure = cookieSecure();
    res.cookie(ACCESS_COOKIE, session.accessToken, {
        httpOnly: true, secure, sameSite: 'lax',
        maxAge: 15 * 60 * 1000, path: '/',
    });
    res.cookie(REFRESH_COOKIE, session.refreshToken, {
        httpOnly: true, secure, sameSite: 'lax',
        maxAge: 7 * 24 * 3600 * 1000, path: '/api/auth',
    });
    res.cookie(CSRF_COOKIE, csrfToken(), {
        httpOnly: false, secure, sameSite: 'lax',
        maxAge: 7 * 24 * 3600 * 1000, path: '/',
    });
    res.cookie(ROLE_COOKIE, session.role, {
        httpOnly: false, secure, sameSite: 'lax',
        maxAge: 7 * 24 * 3600 * 1000, path: '/',
    });
}
export function clearAuthCookies(res) {
    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    res.clearCookie(CSRF_COOKIE, { path: '/' });
    res.clearCookie(ROLE_COOKIE, { path: '/' });
}
export function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    let token;
    if (header?.startsWith('Bearer ')) {
        token = header.slice(7);
    }
    else if (typeof req.cookies?.[ACCESS_COOKIE] === 'string') {
        token = req.cookies[ACCESS_COOKIE];
    }
    if (!token) {
        res.status(401).json({ success: false, error: 'Необходима авторизация' });
        return;
    }
    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        if (decoded.type !== 'access')
            throw new Error('wrong token type');
        req.auth = decoded;
        next();
    }
    catch {
        res.status(401).json({ success: false, error: 'Неверный или истёкший токен' });
    }
}
export function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        if (req.auth?.role !== 'admin') {
            res.status(403).json({ success: false, error: 'Недостаточно прав' });
            return;
        }
        next();
    });
}
export function requireAdminOrCurator(req, res, next) {
    requireAuth(req, res, () => {
        if (req.auth?.role !== 'admin' && req.auth?.role !== 'curator') {
            res.status(403).json({ success: false, error: 'Недостаточно прав' });
            return;
        }
        next();
    });
}
const NO_CSRF_PATHS = new Set([
    '/auth/login', '/auth/register', '/auth/refresh',
    '/auth/logout', '/auth/forgot-password', '/auth/reset-password',
]);
export function requireCsrf(req, res, next) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        next();
        return;
    }
    if (NO_CSRF_PATHS.has(req.path)) {
        next();
        return;
    }
    const hasSessionCookie = typeof req.cookies?.[ACCESS_COOKIE] === 'string' || typeof req.cookies?.[REFRESH_COOKIE] === 'string';
    const cookieToken = req.cookies?.[CSRF_COOKIE];
    const rawHeader = req.headers['x-csrf-token'];
    const headerToken = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
    if (!hasSessionCookie && !cookieToken) {
        next();
        return;
    }
    if (typeof cookieToken !== 'string' || typeof headerToken !== 'string' ||
        cookieToken.length === 0 || headerToken.length !== cookieToken.length) {
        res.status(403).json({ success: false, error: 'CSRF-проверка не пройдена' });
        return;
    }
    if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
        res.status(403).json({ success: false, error: 'CSRF-проверка не пройдена' });
        return;
    }
    next();
}
export function getAuthInfo(req) {
    return req.auth
        ? { role: req.auth.role, authenticated: true }
        : { role: null, authenticated: false };
}
export async function refreshSession(refreshToken) {
    const valid = await verifyRefreshToken(refreshToken);
    if (!valid)
        return null;
    await revokeRefreshJti(valid.jti);
    return issueTokens(valid.userId);
}
