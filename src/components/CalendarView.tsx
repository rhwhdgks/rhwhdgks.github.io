import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Building2,
  Clock,
  CheckCircle2,
  Plus,
  EyeOff,
} from 'lucide-react';
import { CATEGORY_META, OpportunityItem, UserProgressEntry } from '../types';
import { buildCalendarGrid, formatYMD, getDdayInfo, getTodayMidnight } from '../utils/date';

interface CalendarViewProps {
  items: OpportunityItem[];
  progressEntries: UserProgressEntry[];
  onToggleProgress: (item: OpportunityItem) => void;
  onDismiss: (item: OpportunityItem) => void;
  onSelectItem: (item: OpportunityItem) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  items,
  progressEntries,
  onToggleProgress,
  onDismiss,
  onSelectItem,
}) => {
  const today = getTodayMidnight();
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(formatYMD(today));
  const [onlyMyProgress, setOnlyMyProgress] = useState<boolean>(false);

  const progressIds = useMemo(
    () => new Set(progressEntries.map((e) => e.id)),
    [progressEntries]
  );

  // 캘린더에 표시할 대상 공고 (내 진행 목록에만 있는 직접 등록 일정도 포함)
  const calendarItems = useMemo(() => {
    const mergedMap = new Map<string, OpportunityItem>();
    if (!onlyMyProgress) {
      for (const it of items) {
        mergedMap.set(it.id, it);
      }
    }
    for (const entry of progressEntries) {
      mergedMap.set(entry.id, entry.snapshot);
    }
    return Array.from(mergedMap.values());
  }, [items, progressEntries, onlyMyProgress]);

  const cells = useMemo(() => buildCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  // 마감일(deadline) 기준 그룹핑
  const itemsByDate = useMemo(() => {
    const map: Record<string, OpportunityItem[]> = {};
    for (const item of calendarItems) {
      if (!item.deadline || item.isAlwaysOpen) continue;
      const key = item.deadline.slice(0, 10);
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(item);
    }
    return map;
  }, [calendarItems]);

  const selectedDayItems = itemsByDate[selectedDateStr] || [];

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    const now = getTodayMidnight();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDateStr(formatYMD(now));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* 좌측: 월별 달력 그리드 */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* 달력 헤더 */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {viewYear}년 {viewMonth + 1}월 마감 일정
              </h2>
              <p className="text-xs text-slate-500">
                날짜를 클릭하면 해당일에 마감되는 공고 상세 목록을 확인할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyMyProgress((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                onlyMyProgress
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {onlyMyProgress ? '✓ 내 진행 일정만 보는 중' : '내 진행 일정만 보기'}
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
                title="이전 달"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleGoToday}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
              >
                오늘
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
                title="다음 달"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 카테고리 색상 범례 */}
        <div className="flex flex-wrap items-center gap-4 px-5 py-2.5 bg-white border-b border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-bold text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 ring-emerald-200" />
            <span>내가 진행 중</span>
          </div>
          {(['intern', 'hackathon', 'contest', 'kofia', 'activity'] as const).map((catKey) => {
            const meta = CATEGORY_META[catKey];
            return (
              <div key={catKey} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${meta.dotClass}`} />
                <span>{meta.shortLabel}</span>
              </div>
            );
          })}
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-600">
          {WEEKDAYS.map((day, idx) => (
            <div
              key={day}
              className={`py-2.5 ${
                idx === 0 ? 'text-rose-600' : idx === 6 ? 'text-blue-600' : 'text-slate-600'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 셀 */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
          {cells.map((cell) => {
            const dayItems = itemsByDate[cell.dateStr] || [];
            const isSelected = cell.dateStr === selectedDateStr;
            const dayOfWeek = cell.date.getDay();

            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => setSelectedDateStr(cell.dateStr)}
                className={`min-h-[104px] sm:min-h-[120px] p-1.5 sm:p-2 text-left flex flex-col justify-between transition relative group ${
                  !cell.isCurrentMonth ? 'bg-slate-50/60 text-slate-400' : 'bg-white hover:bg-indigo-50/30'
                } ${isSelected ? 'ring-2 ring-inset ring-indigo-600 bg-indigo-50/20 z-10' : ''}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full ${
                      cell.isToday
                        ? 'bg-indigo-600 text-white'
                        : !cell.isCurrentMonth
                        ? 'text-slate-400'
                        : dayOfWeek === 0
                        ? 'text-rose-600'
                        : dayOfWeek === 6
                        ? 'text-blue-600'
                        : 'text-slate-700'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                  {dayItems.length > 0 && (
                    <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {dayItems.length}건
                    </span>
                  )}
                </div>

                {/* 해당 날짜 마감 공고 미리보기 (최대 3개 표시) */}
                <div className="mt-1.5 space-y-1 w-full overflow-hidden">
                  {dayItems.slice(0, 3).map((it) => {
                    const meta = CATEGORY_META[it.category] || CATEGORY_META.intern;
                    const isMine = progressIds.has(it.id);
                    return (
                      <div
                        key={it.id}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] truncate border ${
                          isMine
                            ? 'bg-emerald-600 text-white border-emerald-700 font-bold'
                            : meta.badgeClass
                        }`}
                        title={`[${it.organization}] ${it.title}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isMine ? 'bg-white' : meta.dotClass
                          }`}
                        />
                        <span className="truncate">{it.organization}</span>
                      </div>
                    );
                  })}
                  {dayItems.length > 3 && (
                    <div className="text-[10px] font-medium text-slate-500 pl-1">
                      +{dayItems.length - 3}개 더보기
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 우측: 선택한 날짜의 마감 공고 리스트 패널 */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sticky top-24">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              마감 공고 상세
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedDateStr} 마감</h3>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
            총 {selectedDayItems.length}건
          </span>
        </div>

        {selectedDayItems.length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">
              선택한 날짜({selectedDateStr})에 마감되는 공고가 없습니다.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              달력에서 숫자가 표시된 날짜를 클릭해 보세요!
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {selectedDayItems.map((item) => {
              const meta = CATEGORY_META[item.category] || CATEGORY_META.intern;
              const dday = getDdayInfo(item.deadline, item.isAlwaysOpen);
              const isMine = progressIds.has(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    isMine
                      ? 'border-emerald-300 bg-emerald-50/30 hover:border-emerald-400'
                      : 'border-slate-200 bg-slate-50/40 hover:border-indigo-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border ${meta.badgeClass}`}
                      >
                        {meta.shortLabel}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[11px] rounded-md border ${dday.badgeStyle}`}
                      >
                        {dday.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleProgress(item);
                        }}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition ${
                          isMine
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                        }`}
                      >
                        {isMine ? '진행중 ✓' : '+ 진행중'}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDismiss(item);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="지우기 (다시 안 뜨게 숨김)"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-medium text-slate-500 mb-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{item.organization}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-400">{item.source}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug mb-2">
                    {item.title}
                  </h4>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      원문 <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
