import { ChevronLeft, ChevronRight } from 'lucide-react';

export type CalendarTone = 'forest' | 'coral' | 'amber' | 'violet' | 'sky';

export type CalendarEvent = {
  date: string;
  label: string;
  tone: CalendarTone;
};

const WEEKDAYS = ['IS', 'SE', 'RA', 'KH', 'JU', 'SA', 'AH'];
const MONTHS = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember',
];

const TONE_DOT: Record<CalendarTone, string> = {
  forest: 'bg-forest',
  coral: 'bg-coral',
  amber: 'bg-amber',
  violet: 'bg-violet',
  sky: 'bg-sky',
};

function toKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildMonthCells(year: number, month: number) {
  const first = new Date(year, month, 1);
  const mondayIndex = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: { date: Date; inMonth: boolean }[] = [];

  for (let i = mondayIndex - 1; i >= 0; i -= 1) {
    cells.push({ date: new Date(year, month - 1, prevMonthDays - i), inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: new Date(year, month, day), inMonth: true });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last);
    next.setDate(last.getDate() + 1);
    cells.push({ date: next, inMonth: next.getMonth() === month });
  }

  return cells;
}

function weekOfYear(date: Date) {
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  return Math.ceil((((temp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

type MonthCalendarProps = {
  month: Date;
  onPrev: () => void;
  onNext: () => void;
  events?: CalendarEvent[];
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
};

export default function MonthCalendar({
  month,
  onPrev,
  onNext,
  events = [],
  selectedDate,
  onSelectDate,
}: MonthCalendarProps) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const cells = buildMonthCells(year, monthIndex);
  const todayKey = toKey(new Date());
  const selectedKey = selectedDate ? toKey(selectedDate) : todayKey;
  const selectedWeek = weekOfYear(selectedDate || new Date());

  const eventsByDay = events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    acc[event.date] = acc[event.date] ? [...acc[event.date], event] : [event];
    return acc;
  }, {});

  const weeks: { date: Date; inMonth: boolean }[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const visibleWeeks = weeks.filter((week) => week.some((c) => c.inMonth));

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={onPrev} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-ink transition-colors" aria-label="Bulan sebelumnya">
          <ChevronLeft size={16} />
        </button>
        <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold tracking-tight">
          {MONTHS[monthIndex]} {year}
        </span>
        <button type="button" onClick={onNext} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-ink transition-colors" aria-label="Bulan seterusnya">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_2rem] mb-1.5 border-b border-slate-100 pb-1.5">
        {WEEKDAYS.map((day) => (
          <span key={day} className="text-center text-[10px] font-semibold text-slate-400">
            {day}
          </span>
        ))}
        <span />
      </div>

      <div className="space-y-1">
        {visibleWeeks.map((week) => {
          const wk = weekOfYear(week[0].date);
          const isSelectedWeek = wk === selectedWeek && week.some((c) => toKey(c.date) === selectedKey);
          return (
            <div key={toKey(week[0].date)} className="grid grid-cols-[repeat(7,minmax(0,1fr))_2rem] items-center">
              {week.map(({ date, inMonth }) => {
                const key = toKey(date);
                const isToday = key === todayKey;
                const isSelected = key === selectedKey;
                const dayEvents = eventsByDay[key] || [];
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onSelectDate?.(date)}
                    aria-label={date.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                    className={`relative mx-auto w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-ink text-white shadow-sm'
                        : isToday
                          ? 'bg-slate-100 text-ink ring-1 ring-slate-200'
                          : !inMonth
                            ? 'text-slate-300 hover:bg-slate-50'
                            : isWeekend
                              ? 'text-rose hover:bg-rose/5'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-ink'
                    }`}
                  >
                    {date.getDate()}
                    {dayEvents.length > 0 && (
                      <span className="absolute bottom-1 flex gap-0.5">
                        {dayEvents.slice(0, 3).map((event) => (
                          <span
                            key={`${event.date}-${event.label}`}
                            className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/80' : TONE_DOT[event.tone]}`}
                          />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
              <span
                className={`ml-auto px-1.5 py-0.5 rounded-md text-[10px] font-medium tabular-nums transition-colors ${
                  isSelectedWeek ? 'bg-sky/10 text-sky' : 'text-slate-300'
                }`}
              >
                W{wk}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { toKey, MONTHS };