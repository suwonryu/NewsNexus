import { useEffect, useState } from 'react';
import type { DateTreeYear } from '../types/article';

interface MainMenuProps {
  dateTree: DateTreeYear[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  className?: string;
  showHeader?: boolean;
}

function MainMenu({
  dateTree,
  selectedDate,
  onSelectDate,
  className,
  showHeader = true,
}: MainMenuProps) {
  const [openYear, setOpenYear] = useState<number | null>(null);
  const [openMonthKey, setOpenMonthKey] = useState<string | null>(null);

  const toggleYear = (year: number) => {
    setOpenYear((prev) => (prev === year ? null : year));
  };

  const toggleMonth = (monthKey: string) => {
    setOpenMonthKey((prev) => (prev === monthKey ? null : monthKey));
  };

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    const [yearText, monthText] = selectedDate.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const monthKey = `${year}-${month}`;

    setOpenYear(year);
    setOpenMonthKey(monthKey);
  }, [selectedDate]);

  return (
    <aside
      className={`overflow-y-auto rounded-2xl border border-white/60 bg-white/80 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur ${className ?? ''}`}
    >
      {showHeader && (
        <>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500 mb-2">Timeline</p>
          <h2 className="text-xl font-[650] mb-4 text-slate-900">날짜</h2>
        </>
      )}
      <nav aria-label="기사 날짜">
        <ul className="space-y-3">
          {dateTree.map((yearGroup) => {
            const isOpen = openYear === yearGroup.year;

            return (
              <li key={yearGroup.year}>
                <button
                  type="button"
                  onClick={() => toggleYear(yearGroup.year)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-left font-[650] text-slate-800 transition hover:border-cyan-300 hover:text-cyan-700"
                >
                  <span>{yearGroup.year}년</span>
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                    className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <path
                      d="M5 7.5L10 12.5L15 7.5"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <ul className="pl-3 space-y-2">
                      {yearGroup.months.map((monthGroup) => (
                        <li key={`${yearGroup.year}-${monthGroup.month}`}>
                          {(() => {
                            const monthKey = `${yearGroup.year}-${monthGroup.month}`;
                            const isMonthOpen = openMonthKey === monthKey;

                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() => toggleMonth(monthKey)}
                                  aria-expanded={isMonthOpen}
                                  className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                                >
                                  <span>{monthGroup.month}월</span>
                                  <svg
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    aria-hidden="true"
                                    className={`h-3.5 w-3.5 transition-transform duration-300 ${
                                      isMonthOpen ? 'rotate-180' : ''
                                    }`}
                                  >
                                    <path
                                      d="M5 7.5L10 12.5L15 7.5"
                                      stroke="currentColor"
                                      strokeWidth="1.7"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </button>
                                <div
                                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                                    isMonthOpen ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'
                                  }`}
                                >
                                  <div className="overflow-hidden">
                                    <ul className="pl-3 space-y-1">
                                      {monthGroup.days.map((day) => (
                                        <li key={day}>
                                          <button
                                            type="button"
                                            onClick={() => onSelectDate(day)}
                                            className={`w-full rounded-md px-2 py-1 text-left text-sm transition ${
                                              selectedDate === day
                                                ? 'font-[650] text-cyan-700 bg-cyan-50'
                                                : 'text-slate-700 hover:bg-slate-100 hover:text-cyan-700'
                                            }`}
                                          >
                                            {day}
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

export default MainMenu;
