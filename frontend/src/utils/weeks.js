export const WEEK_LABELS = {
    upper: 'Верхняя',
    lower: 'Нижняя',
};
export const WEEK_SHORT = {
    upper: 'В',
    lower: 'Н',
};
export function weekOfDate(date, semesterStart) {
    const weekNumber = Math.floor((Date.parse(date) - Date.parse(semesterStart)) / 86400000 / 7);
    return weekNumber % 2 === 0 ? 'lower' : 'upper';
}
