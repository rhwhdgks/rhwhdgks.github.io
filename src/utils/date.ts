export type DdayStatus = 'today' | 'urgent' | 'soon' | 'normal' | 'always' | 'closed';

export interface DdayInfo {
  label: string;
  daysLeft: number | null;
  status: DdayStatus;
  badgeStyle: string;
}

export function getTodayMidnight(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function parseDateStr(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function getDdayInfo(deadline?: string | null, isAlwaysOpen?: boolean): DdayInfo {
  if (isAlwaysOpen || !deadline) {
    return {
      label: '상시모집',
      daysLeft: null,
      status: 'always',
      badgeStyle: 'bg-slate-100 text-slate-600 border-slate-200',
    };
  }

  const target = parseDateStr(deadline);
  if (!target) {
    return {
      label: '상시모집',
      daysLeft: null,
      status: 'always',
      badgeStyle: 'bg-slate-100 text-slate-600 border-slate-200',
    };
  }

  const today = getTodayMidnight();
  const diffMs = target.getTime() - today.getTime();
  const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return {
      label: '마감',
      daysLeft,
      status: 'closed',
      badgeStyle: 'bg-slate-100 text-slate-400 border-slate-200 line-through',
    };
  }
  if (daysLeft === 0) {
    return {
      label: 'D-Day (오늘마감)',
      daysLeft: 0,
      status: 'today',
      badgeStyle: 'bg-red-600 text-white border-red-600 animate-pulse shadow-sm',
    };
  }
  if (daysLeft <= 3) {
    return {
      label: `D-${daysLeft}`,
      daysLeft,
      status: 'urgent',
      badgeStyle: 'bg-red-50 text-red-700 border-red-200 font-bold',
    };
  }
  if (daysLeft <= 7) {
    return {
      label: `D-${daysLeft}`,
      daysLeft,
      status: 'soon',
      badgeStyle: 'bg-orange-50 text-orange-700 border-orange-200 font-semibold',
    };
  }
  return {
    label: `D-${daysLeft}`,
    daysLeft,
    status: 'normal',
    badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };
}

export interface CalendarCell {
  date: Date;
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function formatYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildCalendarGrid(year: number, monthIndex: number): CalendarCell[] {
  const todayStr = formatYMD(getTodayMidnight());
  const firstOfMonth = new Date(year, monthIndex, 1);
  const startDayOfWeek = firstOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells: CalendarCell[] = [];

  // Previous month padding
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, monthIndex, -i);
    const dateStr = formatYMD(d);
    cells.push({
      date: d,
      dateStr,
      dayNumber: d.getDate(),
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, monthIndex, day);
    const dateStr = formatYMD(d);
    cells.push({
      date: d,
      dateStr,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    });
  }

  // Next month padding to fill 35 or 42 cells
  const totalSlots = cells.length <= 35 ? 35 : 42;
  let nextDay = 1;
  while (cells.length < totalSlots) {
    const d = new Date(year, monthIndex + 1, nextDay++);
    const dateStr = formatYMD(d);
    cells.push({
      date: d,
      dateStr,
      dayNumber: d.getDate(),
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  return cells;
}

