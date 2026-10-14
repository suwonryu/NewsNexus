import { useMemo, useState } from 'react';
import type { DateTreeYear } from '../types/article';
import { getKoreaIsoDate } from '../lib/koreaDate';

interface ArticleCalendarProps {
  dateTree: DateTreeYear[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

export default function ArticleCalendar({ dateTree, selectedDate, onSelectDate }: ArticleCalendarProps) {
  const today = getKoreaIsoDate();
  const [month, setMonth] = useState(() => (selectedDate ?? today).slice(0, 7));
  const availableDates = useMemo(
    () => new Set(dateTree.flatMap((year) => year.months.flatMap((month) => month.days))),
    [dateTree],
  );
  const [year, monthNumber] = month.split('-').map(Number);
  const firstWeekday = new Date(year, monthNumber - 1, 1).getDay();
  const dayCount = new Date(year, monthNumber, 0).getDate();
  const cellCount = Math.ceil((firstWeekday + dayCount) / 7) * 7;
  const moveMonth = (offset: number) => {
    const next = new Date(year, monthNumber - 1 + offset, 1);
    setMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
  };
  const navigationClass = 'h-10 rounded-xl px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0071e3] dark:text-slate-200 dark:hover:bg-white/10';

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button type="button" aria-label="이전 달" className={navigationClass} onClick={() => moveMonth(-1)}>‹</button>
        <h3 aria-live="polite" className="font-semibold text-slate-900 dark:text-white">{year}년 {monthNumber}월</h3>
        <button type="button" aria-label="다음 달" className={navigationClass} onClick={() => moveMonth(1)}>›</button>
      </div>
      <div className="grid grid-cols-7 text-center">
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
          <span key={day} className="pb-2 text-xs font-medium text-slate-500 dark:text-slate-400">{day}</span>
        ))}
        {Array.from({ length: cellCount }, (_, index) => {
          const day = index - firstWeekday + 1;
          if (day < 1 || day > dayCount) return <span key={index} />;
          const date = `${month}-${String(day).padStart(2, '0')}`;
          const available = availableDates.has(date);
          const selected = date === selectedDate;
          return (
            <button
              key={date}
              type="button"
              disabled={!available}
              aria-label={`${year}년 ${monthNumber}월 ${day}일${available ? ', 기사 있음' : ', 기사 없음'}`}
              aria-pressed={selected}
              aria-current={date === today ? 'date' : undefined}
              onClick={() => onSelectDate(date)}
              className={`relative mx-auto flex h-11 w-full max-w-11 flex-col items-center justify-center rounded-xl text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] ${selected ? 'bg-[#0071e3] font-semibold text-white dark:bg-[#2997ff] dark:text-black' : available ? 'text-slate-800 hover:bg-blue-50 dark:text-slate-100 dark:hover:bg-blue-500/15' : 'text-slate-300 dark:text-slate-600'} ${date === today && !selected ? 'ring-1 ring-inset ring-[#0071e3]/40' : ''}`}
            >
              {day}
              {available && <span aria-hidden="true" className={`absolute bottom-1 h-1 w-1 rounded-full ${selected ? 'bg-current' : 'bg-[#0071e3] dark:bg-[#2997ff]'}`} />}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-white/10">
        <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-[#0071e3] dark:bg-[#2997ff]" />기사가 있는 날짜</p>
        <button type="button" className={navigationClass} onClick={() => {
          setMonth(today.slice(0, 7));
          if (availableDates.has(today)) onSelectDate(today);
        }}>오늘</button>
      </div>
    </div>
  );
}
