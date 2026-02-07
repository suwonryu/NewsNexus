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
  const [openYears, setOpenYears] = useState<Record<number, boolean>>({});
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({});

  const toggleYear = (year: number) => {
    setOpenYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  const toggleMonth = (monthKey: string) => {
    setOpenMonths((prev) => ({
      ...prev,
      [monthKey]: !prev[monthKey],
    }));
  };

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    const [yearText, monthText] = selectedDate.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const monthKey = `${year}-${month}`;

    setOpenYears((prev) => ({
      ...prev,
      [year]: true,
    }));
    setOpenMonths((prev) => ({
      ...prev,
      [monthKey]: true,
    }));
  }, [selectedDate]);

  return (
    <aside
      className={`overflow-y-auto rounded-2xl border border-white/60 bg-white/80 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur ${className ?? ''}`}
    >
      {showHeader && (
        <>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500 mb-2">Timeline</p>
          <h2 className="text-xl font-semibold mb-4 text-slate-900">날짜</h2>
        </>
      )}
      <nav aria-label="기사 날짜">
        <ul className="space-y-3">
          {dateTree.map((yearGroup) => {
            const isOpen = openYears[yearGroup.year] ?? false;

            return (
              <li key={yearGroup.year}>
                <button
                  type="button"
                  onClick={() => toggleYear(yearGroup.year)}
                  className="w-full rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-left font-semibold text-slate-800 transition hover:border-cyan-300 hover:text-cyan-700"
                >
                  {yearGroup.year}년
                </button>
                {isOpen && (
                  <ul className="pl-3 mt-2 space-y-2">
                    {yearGroup.months.map((monthGroup) => (
                      <li key={`${yearGroup.year}-${monthGroup.month}`}>
                        {(() => {
                          const monthKey = `${yearGroup.year}-${monthGroup.month}`;
                          const isMonthOpen = openMonths[monthKey] ?? false;

                          return (
                            <>
                              <button
                                type="button"
                                onClick={() => toggleMonth(monthKey)}
                                className="w-full rounded-md px-2 py-1 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                              >
                                {monthGroup.month}월
                              </button>
                              {isMonthOpen && (
                                <ul className="pl-3 mt-1 space-y-1">
                                  {monthGroup.days.map((day) => (
                                    <li key={day}>
                                      <button
                                        type="button"
                                        onClick={() => onSelectDate(day)}
                                        className={`w-full rounded-md px-2 py-1 text-left text-sm transition ${
                                          selectedDate === day
                                            ? 'font-semibold text-cyan-700 bg-cyan-50'
                                            : 'text-slate-700 hover:bg-slate-100 hover:text-cyan-700'
                                        }`}
                                      >
                                        {day}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </>
                          );
                        })()}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

export default MainMenu;
