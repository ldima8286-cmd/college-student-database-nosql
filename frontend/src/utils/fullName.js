const ALLOWED_CHARS = /[^\p{L}\s'’.\-\u2013\u2014]/gu;
export function sanitizeFullName(input) {
    return input.replace(ALLOWED_CHARS, '').replace(/\s{2,}/g, ' ');
}
export function isValidFullName(input) {
    const v = input.trim();
    if (!v)
        return false;
    if (v.length < 2 || v.length > 200)
        return false;
    if (!/\p{L}/u.test(v))
        return false;
    return /^[\p{L}\s'’.\-\u2013\u2014]+$/u.test(v);
}
