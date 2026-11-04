import { memo } from 'react';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';

const GROUP_ROW = 'grid grid-cols-[3.75rem_minmax(0,1fr)_3.25rem] items-center gap-2';

function GroupMetricCard({
  title,
  icon: Icon,
  iconClass,
  valueClass,
  barClass,
  rows,
  valueKey,
  maxValue,
  formatValue,
}) {
  return (
    <div className="card flex flex-col">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
          <Icon className={`w-4 h-4 ${iconClass}`} />
          {title}
        </h4>
        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">
          {rows.length} гр.
        </span>
      </div>
      <div className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
        {rows.map((row) => {
          const value = Number(row[valueKey] ?? 0);
          const width = Math.min(100, (value / maxValue) * 100);
          const formatted = formatValue(value);
          return (
            <div key={row.key} className={GROUP_ROW} title={`${row.label}: ${formatted}`}>
              <span className="truncate font-mono text-xs text-gray-600 dark:text-gray-300">
                {row.label}
              </span>
              <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${barClass}`}
                  style={{ width: `${width}%` }}
                />
              </div>
              <span className={`text-right font-mono text-xs font-medium ${valueClass}`}>
                {formatted}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CourseChart({ title, icon: Icon, iconClass, valueClass, barClass, items, valueKey, maxValue, formatValue }) {
  return (
    <div className="card">
      <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
        <Icon className={`w-4 h-4 ${iconClass}`} />
        {title}
      </h4>
      <div className="flex h-56 items-end gap-2 sm:gap-3">
        {items.map((item) => {
          const value = Number(item[valueKey] ?? 0);
          const formatted = formatValue(value);
          return (
            <div key={item.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
              <span className={`font-mono text-[11px] font-medium ${valueClass}`}>{formatted}</span>
              <div
                className={`w-full rounded-t-sm transition-all duration-300 ${barClass}`}
                style={{ height: `${Math.min(100, (value / maxValue) * 100)}%` }}
              />
              <span
                className="w-full break-words text-center text-xs leading-tight text-gray-500 dark:text-gray-400"
                title={item.label}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(function ChartsPanel({ stats, view = 'course' }) {
  if (!stats) return null;

  const courses = [...(stats.byCourseStats ?? [])].sort((a, b) => a.course - b.course);
  const groups = [...(stats.byGroupStats ?? [])]
    .sort((a, b) => a.group.localeCompare(b.group, 'ru'));

  if (view === 'group') {
    if (groups.length === 0) return null;
    const groupRows = groups.map((group) => ({
      key: group.group,
      label: group.group,
      ...group,
    }));
    const maxCount = Math.max(...groups.map((group) => group.count), 1);
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GroupMetricCard
          title="Средняя успеваемость по группам"
          icon={TrendingUp}
          iconClass="text-primary-600"
          valueClass="text-primary-700 dark:text-primary-300"
          barClass="bg-primary-500"
          rows={groupRows}
          valueKey="avgPerformance"
          maxValue={10}
          formatValue={(value) => value.toFixed(1)}
        />
        <GroupMetricCard
          title="Средняя посещаемость по группам"
          icon={Activity}
          iconClass="text-emerald-600"
          valueClass="text-emerald-700 dark:text-emerald-300"
          barClass="bg-emerald-500"
          rows={groupRows}
          valueKey="avgAttendance"
          maxValue={100}
          formatValue={(value) => `${value}%`}
        />
        <GroupMetricCard
          title="Количество студентов по группам"
          icon={BarChart3}
          iconClass="text-amber-600"
          valueClass="text-amber-700 dark:text-amber-300"
          barClass="bg-amber-500"
          rows={groupRows}
          valueKey="count"
          maxValue={maxCount}
          formatValue={(value) => String(value)}
        />
      </div>
    );
  }

  const items = courses.map((course) => ({
    key: course.course,
    label: `${course.course}к`,
    avgPerformance: course.avgPerformance,
    avgAttendance: course.avgAttendance,
    count: course.count,
  }));
  if (items.length === 0) return null;

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <CourseChart
        title="Средняя успеваемость по курсам"
        icon={TrendingUp}
        iconClass="text-primary-600"
        valueClass="text-primary-700 dark:text-primary-300"
        barClass="bg-primary-500"
        items={items}
        valueKey="avgPerformance"
        maxValue={10}
        formatValue={(value) => value.toFixed(1)}
      />
      <CourseChart
        title="Средняя посещаемость по курсам"
        icon={Activity}
        iconClass="text-emerald-600"
        valueClass="text-emerald-700 dark:text-emerald-300"
        barClass="bg-emerald-500"
        items={items}
        valueKey="avgAttendance"
        maxValue={100}
        formatValue={(value) => `${value}%`}
      />
      <CourseChart
        title="Количество студентов по курсам"
        icon={BarChart3}
        iconClass="text-amber-600"
        valueClass="text-amber-700 dark:text-amber-300"
        barClass="bg-amber-500"
        items={items}
        valueKey="count"
        maxValue={Math.max(...items.map((item) => item.count), 1)}
        formatValue={(value) => String(value)}
      />
    </div>
  );
});
