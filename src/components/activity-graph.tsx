"use client";

import React from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { DayData } from "../lib/types";
import { formatDate, formatDateForTooltip, getIntensityClass, getMonthName } from "../lib/utils";

interface ActivityGraphProps {
  weeks: (DayData | null)[][];
  currentYear: number;
  availableYears: number[];
  selectedDate: { date: string; obj: Date };
  onYearChange: (year: number) => void;
  onDayClick: (day: DayData) => void;
  todayButtonRef: React.RefObject<HTMLButtonElement>;
}

export function ActivityGraph({
  weeks,
  currentYear,
  availableYears,
  selectedDate,
  onYearChange,
  onDayClick,
  todayButtonRef,
}: ActivityGraphProps) {
  return (
    <section className="bg-slate-900/40 rounded-3xl border border-slate-800/50 p-6 shadow-2xl backdrop-blur-sm w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Calendar size={14} />
          Activity Graph
        </h2>
        <div className="relative group">
          <select
            value={currentYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="appearance-none bg-slate-950 border border-slate-700 text-slate-200 text-xs font-medium py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer hover:bg-slate-800 transition-colors shadow-sm"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-slate-200 transition-colors"
          />
        </div>
      </div>

      <div className="w-full flex justify-center">
        <div className="inline-flex flex-col gap-1 max-w-full">
          <div className="flex gap-[2px] mb-2 text-[9px] text-slate-500 font-medium h-3 pl-6">
            {weeks.map((week, i) => {
              const firstDay = week.find((d) => d !== null);
              if (firstDay && firstDay.obj.getDate() <= 7) {
                return (
                  <span
                    key={i}
                    className="w-[8px] sm:w-[10px] overflow-visible"
                  >
                    {getMonthName(firstDay.obj.getMonth())}
                  </span>
                );
              }
              return <span key={i} className="w-[8px] sm:w-[10px]"></span>;
            })}
          </div>

          <div className="flex gap-2">
            <div className="flex flex-col gap-[2px] text-[9px] text-slate-600 font-medium pt-[1px] pr-1">
              <span className="h-[8px] sm:h-[10px] leading-[8px] sm:leading-[10px]">
                Mon
              </span>
              <span className="h-[8px] sm:h-[10px] leading-[8px] sm:leading-[10px] mt-[10px] sm:mt-[12px]">
                Wed
              </span>
              <span className="h-[8px] sm:h-[10px] leading-[8px] sm:leading-[10px] mt-[10px] sm:mt-[12px]">
                Fri
              </span>
            </div>

            <div className="flex gap-[2px]">
              {weeks.map((week, wIndex) => (
                <div key={wIndex} className="flex flex-col gap-[2px]">
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                    const dayData = week[dayIndex];
                    if (!dayData) {
                      return (
                        <div
                          key={dayIndex}
                          className="w-[8px] h-[8px] sm:w-[10px] sm:h-[10px]"
                        ></div>
                      );
                    }
                    const isSelected = selectedDate.date === dayData.date;
                    const isTodayDate =
                      dayData.date === formatDate(new Date());
                    const formattedDate = formatDateForTooltip(
                      dayData.date
                    );
                    return (
                      <button
                        key={dayIndex}
                        ref={isTodayDate ? todayButtonRef : null}
                        onClick={() => onDayClick(dayData)}
                        className={`
                          relative group/tooltip w-[8px] h-[8px] sm:w-[10px] sm:h-[10px] rounded-[2px] transition-all duration-300
                          ${getIntensityClass(dayData.count)}
                          ${isSelected ? "ring-2 ring-white ring-offset-1 ring-offset-slate-900 z-10 scale-110 shadow-lg shadow-blue-500/20" : ""}
                        `}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-slate-900 text-slate-100 text-xs rounded-lg shadow-lg border border-slate-700 whitespace-nowrap pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150 z-50">
                          <div className="font-medium">{formattedDate}</div>
                          <div className="text-slate-400 mt-0.5">
                            {dayData.count}{" "}
                            {dayData.count === 1 ? "post" : "posts"}
                          </div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-700"></div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

