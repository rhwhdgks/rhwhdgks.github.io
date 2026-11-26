import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Bookmark,
  ExternalLink,
  X,
  CheckCircle2,
  Plus,
  EyeOff,
  RotateCcw,
  GraduationCap,
} from 'lucide-react';
import {
  CATEGORY_META,
  CategoryType,
  DismissedEntry,
  OpportunitiesPayload,
  OpportunityItem,
  PROGRESS_STAGE_META,
  ProgressStage,
  QUICK_PORTALS,
  SortOption,
  UserProgressEntry,
  ViewMode,
} from './types';
import { getDdayInfo } from './utils/date';
import { analyzeOpportunityFit } from './utils/fitAnalysis';
import { CalendarView } from './components/CalendarView';
import { OpportunityModal } from './components/OpportunityModal';
import { MyProgressView } from './components/MyProgressView';
import { DismissedModal } from './components/DismissedModal';
import { ResumeCheatsheetView } from './components/ResumeCheatsheetView';
import { FINANCE_GROUPS, FinanceGroup, matchesFinanceGroup } from './utils/financeGroup';
import { createDismissMatcher, makeDismissKey } from './utils/dismissMatch';
import { isStudentEligible } from './utils/studentFilter';

const BOOKMARK_STORAGE_KEY = 'career_radar_bookmarks_v1';
const PROGRESS_STORAGE_KEY = 'career_radar_progress_v1';
const DISMISSED_STORAGE_KEY = 'career_radar_dismissed_v1';
const STUDENT_ONLY_STORAGE_KEY = 'career_radar_student_only_v1';

const POPULAR_KEYWORDS = [
  '인턴',
  '신입',
  '퀀트',
  '운용',
  '파생',
  '금융데이터',
  'AI',
  '백엔드',
  'Python',
  '해커톤',
];

export function App() {
  const [data, setData] = useState<OpportunitiesPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 및 뷰 상태
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [financeGroup, setFinanceGroup] = useState<FinanceGroup>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('fit-desc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [hideClosed, setHideClosed] = useState<boolean>(true);
  const [onlyUrgent, setOnlyUrgent] = useState<boolean>(false);
  const [onlyBookmarked, setOnlyBookmarked] = useState<boolean>(false);
  const [studentOnly, setStudentOnly] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STUDENT_ONLY_STORAGE_KEY) !== 'false';
    } catch {
      return true;
    }
  });

  // 1) 내가 진행 중인 공고/활동 목록 (localStorage)
  const [progressEntries, setProgressEntries] = useState<UserProgressEntry[]>(() => {
    try {
      const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 2) 이미 확인했거나 안 할 공고 지우기/숨김 목록 (localStorage, 다음 크롤링 때도 영구 숨김)
  const [dismissedEntries, setDismissedEntries] = useState<DismissedEntry[]>(() => {
    try {
      const saved = localStorage.getItem(DISMISSED_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 방금 지운 공고 실행 취소용 토스트 상태
  const [lastDismissed, setLastDismissed] = useState<DismissedEntry | null>(null);
  const [isDismissedModalOpen, setIsDismissedModalOpen] = useState<boolean>(false);

  // 3) 북마크 및 상세 모달 상태
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(BOOKMARK_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeItem, setActiveItem] = useState<OpportunityItem | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressEntries));
    } catch {
      // ignore
    }
  }, [progressEntries]);

  useEffect(() => {
    try {
      localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(dismissedEntries));
    } catch {
      // ignore
    }
  }, [dismissedEntries]);

  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarkedIds));
    } catch {
      // ignore
    }
  }, [bookmarkedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STUDENT_ONLY_STORAGE_KEY, String(studentOnly));
    } catch {
      // ignore
    }
  }, [studentOnly]);

  useEffect(() => {
    const loadOpportunities = async () => {
      setLoading(true);
      try {
        const res = await fetch('./data/opportunities.json', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error(`데이터를 불러오지 못했습니다 (${res.status})`);
        }
        const json: OpportunitiesPayload = await res.json();
        setData(json);
        setError(null);
      } catch (err: any) {
        setError(err?.message || '데이터 로드 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    loadOpportunities();
  }, []);

  // 빠른 조회용 Set/Map & 숨김 매처 (id · aliases · 정확한 key · 정규화된 기관/제목 매칭)
  const isDismissed = useMemo(
    () => createDismissMatcher(dismissedEntries),
    [dismissedEntries]
  );
  const progressMap = useMemo(() => {
    const m = new Map<string, UserProgressEntry>();
    for (const entry of progressEntries) {
      m.set(entry.id, entry);
    }
    return m;
  }, [progressEntries]);

  // 지운 공고를 제외한 전체 활성 목록
  const visibleAllItems = useMemo(() => {
    const raw = data?.items || [];
    return raw.filter((item) => !isDismissed(item));
  }, [data, isDismissed]);

  // 재학 중 지원 가능한 비연계 인턴 · 해커톤/공모전만 보기 필터
  const scopedAllItems = useMemo(
    () => (studentOnly ? visibleAllItems.filter(isStudentEligible) : visibleAllItems),
    [visibleAllItems, studentOnly]
  );

  const hiddenByStudentFilterCount = visibleAllItems.length - scopedAllItems.length;

  // 공고 지우기 (영구 숨김) 핸들러
  const handleDismissItem = (item: OpportunityItem) => {
    const entry: DismissedEntry = {
      id: item.id,
      key: makeDismissKey(item),
      title: item.title,
      organization: item.organization,
      dismissedAt: new Date().toISOString(),
    };
    setDismissedEntries((prev) => {
      if (prev.some((p) => p.id === entry.id || p.key === entry.key)) return prev;
      return [entry, ...prev];
    });
    setLastDismissed(entry);
  };

  const handleRestoreDismissed = (id: string, key: string) => {
    setDismissedEntries((prev) => prev.filter((e) => e.id !== id && e.key !== key));
    if (lastDismissed && (lastDismissed.id === id || lastDismissed.key === key)) {
      setLastDismissed(null);
    }
  };

  const handleRestoreAllDismissed = () => {
    setDismissedEntries([]);
    setLastDismissed(null);
  };

  // 내 진행 목록 추가/토글 핸들러
  const handleToggleProgress = (item: OpportunityItem) => {
    setProgressEntries((prev) => {
      const exists = prev.some((p) => p.id === item.id);
      if (exists) {
        return prev.filter((p) => p.id !== item.id);
      }
      const newEntry: UserProgressEntry = {
        id: item.id,
        stage: 'preparing',
        memo: '',
        updatedAt: new Date().toISOString(),
        snapshot: item,
      };
      return [newEntry, ...prev];
    });
  };

  const handleUpdateProgressStage = (id: string, stage: ProgressStage) => {
    setProgressEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, stage, updatedAt: new Date().toISOString() } : entry
      )
    );
  };

  const handleUpdateProgressMemo = (id: string, memo: string) => {
    setProgressEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, memo, updatedAt: new Date().toISOString() } : entry
      )
    );
  };

  const handleRemoveProgress = (id: string) => {
    setProgressEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const handleAddCustomProgress = (
    item: OpportunityItem,
    stage: ProgressStage,
    memo: string
  ) => {
    const newEntry: UserProgressEntry = {
      id: item.id,
      stage,
      memo,
      updatedAt: new Date().toISOString(),
      snapshot: item,
    };
    setProgressEntries((prev) => [newEntry, ...prev]);
  };

  const handleToggleBookmark = (id: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 카테고리별 개수
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryType, number> = {
      all: scopedAllItems.length,
      intern: 0,
      hackathon: 0,
      contest: 0,
      kofia: 0,
      activity: 0,
    };
    for (const it of scopedAllItems) {
      if (counts[it.category] !== undefined) {
        counts[it.category]++;
      }
    }
    return counts;
  }, [scopedAllItems]);

  // 출처 목록
  const availableSources = useMemo(() => {
    const map: Record<string, number> = {};
    for (const it of scopedAllItems) {
      map[it.source] = (map[it.source] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [scopedAllItems]);

  // 필터링 및 정렬된 아이템
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = scopedAllItems.filter((item) => {
      const dday = getDdayInfo(item.deadline, item.isAlwaysOpen);

      if (hideClosed && dday.status === 'closed') {
        return false;
      }
      if (onlyUrgent) {
        if (dday.daysLeft === null || dday.daysLeft < 0 || dday.daysLeft > 7) {
          return false;
        }
      }
      if (onlyBookmarked && !bookmarkedIds.includes(item.id)) {
        return false;
      }
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedSource !== 'all' && item.source !== selectedSource) {
        return false;
      }
      if (selectedCategory === 'kofia' && !matchesFinanceGroup(item, financeGroup)) {
        return false;
      }
      if (q) {
        const hay = [
          item.title,
          item.organization,
          item.source,
          item.summary || '',
          item.location || '',
          ...(item.tags || []),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) {
          return false;
        }
      }
      return true;
    });

    return filtered.sort((a, b) => {
      const ddayA = getDdayInfo(a.deadline, a.isAlwaysOpen);
      const ddayB = getDdayInfo(b.deadline, b.isAlwaysOpen);

      if (sortBy === 'fit-desc') {
        const scoreA = analyzeOpportunityFit(a).matchScore;
        const scoreB = analyzeOpportunityFit(b).matchScore;
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        // 동점인 경우 마감 임박순
        const rank = (d: ReturnType<typeof getDdayInfo>) => {
          if (d.status === 'closed') return 999999;
          if (d.daysLeft === null) return 99999;
          return d.daysLeft;
        };
        return rank(ddayA) - rank(ddayB);
      }

      if (sortBy === 'deadline-asc') {
        const rank = (d: ReturnType<typeof getDdayInfo>) => {
          if (d.status === 'closed') return 999999;
          if (d.daysLeft === null) return 99999;
          return d.daysLeft;
        };
        return rank(ddayA) - rank(ddayB);
      }

      if (sortBy === 'deadline-desc') {
        const rank = (d: ReturnType<typeof getDdayInfo>) => {
          if (d.status === 'closed') return -999999;
          if (d.daysLeft === null) return -99999;
          return d.daysLeft;
        };
        return rank(ddayB) - rank(ddayA);
      }

      const startA = a.startDate || '0000-00-00';
      const startB = b.startDate || '0000-00-00';
      return startB.localeCompare(startA);
    });
  }, [
    scopedAllItems,
    searchQuery,
    hideClosed,
    onlyUrgent,
    onlyBookmarked,
    bookmarkedIds,
    selectedCategory,
    selectedSource,
    financeGroup,
    sortBy,
  ]);

  // 금융권 탭 세부 필터별 개수
  const financeGroupCounts = useMemo(() => {
    const finance = scopedAllItems.filter((it) => it.category === 'kofia');
    return Object.fromEntries(
      FINANCE_GROUPS.map((g) => [g.id, finance.filter((it) => matchesFinanceGroup(it, g.id)).length])
    ) as Record<FinanceGroup, number>;
  }, [scopedAllItems]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedSource('all');
    setFinanceGroup('all');
    setSearchQuery('');
    setOnlyUrgent(false);
    setOnlyBookmarked(false);
    setViewMode('list');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="site-header">
        <div className="site-shell header-inner">
          <button type="button" className="wordmark" onClick={resetFilters}>CareerRadar</button>
          <nav aria-label="주 메뉴" className="site-nav">
            {([
              ['list', '공고'],
              ['calendar', '캘린더'],
              ['my-progress', '내 지원'],
              ['cheatsheet', '자소서 치트시트'],
            ] as const).map(([mode, label]) => (
              <button key={mode} type="button" aria-current={viewMode === mode ? 'page' : undefined}
                onClick={() => setViewMode(mode)}>{label}</button>
            ))}
          </nav>
          <div className="header-tools">
            <button type="button" title="저장한 공고" aria-label="저장한 공고" aria-pressed={onlyBookmarked && viewMode === 'list'}
              onClick={() => {
                setOnlyBookmarked(viewMode !== 'list' || !onlyBookmarked);
                setViewMode('list');
              }}>
              <Bookmark className="w-4 h-4" />
              <span>{bookmarkedIds.length}</span>
            </button>
            <button type="button" title="숨긴 공고 관리" aria-label="숨긴 공고 관리"
              onClick={() => setIsDismissedModalOpen(true)}>
              <EyeOff className="w-4 h-4" />
              <span>{dismissedEntries.length}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 방금 지운 공고 실행 취소 알림 바 */}
      {lastDismissed && (
        <div role="status" className="bg-slate-900 text-white px-4 py-2.5 text-xs flex flex-wrap items-center justify-center gap-3">
          <span>
            <strong>[{lastDismissed.organization}] {lastDismissed.title}</strong> 공고를 숨겼습니다. (다음 크롤링 때도 다시 뜨지 않습니다)
          </span>
          <button
            type="button"
            onClick={() => handleRestoreDismissed(lastDismissed.id, lastDismissed.key)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>실행 취소</span>
          </button>
          <button
            type="button"
            onClick={() => setLastDismissed(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="site-shell flex-1 w-full py-6 sm:py-10 space-y-5">
        {/* "자소서 치트시트" 뷰일 때는 전용 치트시트 저장소 렌더링 */}
        {viewMode === 'cheatsheet' ? (
          <ResumeCheatsheetView />
        ) : viewMode === 'my-progress' ? (
          <MyProgressView
            entries={progressEntries}
            onUpdateStage={handleUpdateProgressStage}
            onUpdateMemo={handleUpdateProgressMemo}
            onRemoveProgress={handleRemoveProgress}
            onAddCustomProgress={handleAddCustomProgress}
            onSelectItem={(item) => setActiveItem(item)}
          />
        ) : (
          <>
            <div className="board-heading">
              <h1>{viewMode === 'calendar' ? '채용·공모전 캘린더' : '채용·공모전'}</h1>
              {data?.updatedAt && <p>최근 수집 {data.updatedAt}</p>}
            </div>
            <section aria-label="공고 필터" className="space-y-4">
              {/* 분야별 카테고리 탭 */}
              <div className="category-nav">
                {(
                  ['all', 'intern', 'hackathon', 'contest', 'kofia', 'activity'] as CategoryType[]
                ).map((catId) => {
                  const meta = CATEGORY_META[catId];
                  const isSelected = selectedCategory === catId;
                  return (
                    <button
                      key={catId}
                      type="button"
                      onClick={() => setSelectedCategory(catId)}
                      aria-pressed={isSelected}
                    >
                      <span>{meta.label}</span>
                      <span className="tab-count">
                        {categoryCounts[catId] || 0}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 금융권 탭 세부 필터 */}
              {selectedCategory === 'kofia' && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 -mt-1">
                  <span className="shrink-0 text-xs font-semibold text-slate-600">세부</span>
                  {FINANCE_GROUPS.map((g) => {
                    const isSelected = financeGroup === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        title={g.hint}
                        onClick={() => setFinanceGroup(g.id)}
                        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span>{g.label}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[11px] ${
                            isSelected ? 'text-white' : 'text-slate-500'
                          }`}
                        >
                          {financeGroupCounts[g.id] || 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 검색창 + 출처 필터 + 정렬 옵션 */}
              <div className="filter-grid">
                {/* 키워드 검색 입력 */}
                <div className="relative col-span-2 md:col-span-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="기업명, 공고 제목, 기술 검색"
                    aria-label="공고 검색"
                    className="w-full pl-10 pr-9 py-2.5 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="검색어 지우기"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* 수집 출처 필터 */}
                <div className="min-w-0">
                  <select
                    aria-label="수집 출처"
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">전체 수집 출처 ({scopedAllItems.length})</option>
                    {availableSources.map(([src, cnt]) => (
                      <option key={src} value={src}>
                        {src} ({cnt})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 정렬 방식 */}
                <div className="min-w-0">
                  <select
                    aria-label="정렬 방식"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full px-3 py-2.5 rounded-md border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="fit-desc">직무 적합도순</option>
                    <option value="deadline-asc">마감 임박순</option>
                    <option value="latest">최신 등록순</option>
                    <option value="deadline-desc">마감 여유순</option>
                  </select>
                </div>
              </div>

              {/* 인기 태그 원클릭 칩 & 보조 토글 */}
              <div className="flex flex-col gap-3">
                <details className="keyword-picker">
                  <summary>추천 키워드</summary>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {POPULAR_KEYWORDS.map((kw) => {
                      const active = searchQuery.toLowerCase() === kw.toLowerCase();
                      return (
                        <button
                          key={kw}
                          type="button"
                          onClick={() => setSearchQuery(active ? '' : kw)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                            active
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          #{kw}
                        </button>
                      );
                    })}
                  </div>
                </details>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium text-slate-600">
                  <button
                    type="button"
                    onClick={() => setStudentOnly((prev) => !prev)}
                    aria-pressed={studentOnly}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition ${
                      studentOnly
                        ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                    title="신입 정규직·채용연계/전환형 인턴·대외활동 제외 (체험형/비연계 인턴 + 해커톤/공모전만 보기)"
                  >
                    <GraduationCap
                      className={`w-3.5 h-3.5 ${studentOnly ? 'text-indigo-700' : 'text-slate-400'}`}
                    />
                    <span>재학 중 지원 가능</span>
                  </button>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hideClosed}
                      onChange={(e) => setHideClosed(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>마감 공고 숨기기</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={onlyUrgent}
                      onChange={(e) => setOnlyUrgent(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>7일 이내 마감</span>
                  </label>
                </div>
              </div>
            </section>

            {/* 결과 헤더 */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {CATEGORY_META[selectedCategory].label}
                </h2>
                <span className="text-xs font-medium text-slate-600 tabular-nums">
                  {filteredItems.length}건
                </span>
                {studentOnly && hiddenByStudentFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setStudentOnly(false)}
                    className="inline-flex flex-wrap items-center gap-1 text-xs text-slate-600 hover:text-indigo-700 transition"
                    title="클릭하면 신입·채용연계형·대외활동까지 모두 표시합니다"
                  >
                    <span>재학 필터로 {hiddenByStudentFilterCount}건 제외</span>
                    <span className="underline font-bold">전체 보기</span>
                  </button>
                )}
                {(selectedCategory !== 'all' ||
                  selectedSource !== 'all' ||
                  financeGroup !== 'all' ||
                  searchQuery ||
                  onlyUrgent ||
                  onlyBookmarked) && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-xs font-semibold text-slate-500 hover:text-indigo-600 underline ml-2"
                  >
                    필터 초기화
                  </button>
                )}
              </div>

            </div>

            {/* 로딩 / 에러 / 본문 영역 */}
            {loading ? (
              <p role="status" className="py-10 text-sm text-slate-500">공고를 불러오는 중입니다.</p>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                <p className="text-red-700 font-bold mb-1">데이터 로드 실패</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : viewMode === 'calendar' ? (
              <CalendarView
                items={filteredItems}
                progressEntries={progressEntries}
                onToggleProgress={handleToggleProgress}
                onDismiss={handleDismissItem}
                onSelectItem={(item) => setActiveItem(item)}
              />
            ) : filteredItems.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">
                  조건에 맞는 공고가 없습니다
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  {studentOnly
                    ? '재학 중 가능(비연계 인턴·해커톤/공모전) 필터가 켜져 있거나 검색 조건에 맞는 공고가 없습니다.'
                    : '검색어나 카테고리 필터를 변경해 보세요.'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {studentOnly && (
                    <button
                      type="button"
                      onClick={() => setStudentOnly(false)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
                    >
                      신입·전환형·대외활동 포함 전체 보기
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
                  >
                    전체 공고 보기
                  </button>
                </div>
              </div>
            ) : (
              <div className="opportunity-list">
                {filteredItems.map((item) => {
                  const meta = CATEGORY_META[item.category] || CATEGORY_META.intern;
                  const dday = getDdayInfo(item.deadline, item.isAlwaysOpen);
                  const isBookmarked = bookmarkedIds.includes(item.id);
                  const progressEntry = progressMap.get(item.id);
                  const fit = analyzeOpportunityFit(item);
                  const urgent = dday.daysLeft !== null && dday.daysLeft >= 0 && dday.daysLeft <= 7;

                  return (
                    <article key={item.id} className="opportunity-row">
                      <div className="opportunity-main">
                        <p className="opportunity-company">{item.organization}</p>
                        <h3>
                          <button type="button" onClick={() => setActiveItem(item)}>{item.title}</button>
                        </h3>
                        <p className="opportunity-meta">
                          <span>{meta.shortLabel}</span><span>{item.source}</span>
                          {item.location && <span>{item.location}</span>}
                          <span title={fit.targetRole}>직무 적합도 {fit.matchScore}%</span>
                        </p>
                      </div>
                      <div className="opportunity-date">
                        <strong className={urgent ? 'deadline-urgent' : undefined}>{dday.label}</strong>
                        {!item.isAlwaysOpen && item.deadline && <time dateTime={item.deadline}>{item.deadline}</time>}
                      </div>
                      <div className="row-actions">
                        <button type="button" aria-pressed={Boolean(progressEntry)}
                          aria-label={progressEntry ? '내 지원에서 제거' : '내 지원에 추가'}
                          title={progressEntry ? PROGRESS_STAGE_META[progressEntry.stage].label : '내 지원에 추가'}
                          onClick={() => handleToggleProgress(item)}>
                          {progressEntry ? <CheckCircle2 /> : <Plus />}
                        </button>
                        <button type="button" aria-label="공고 저장" title="공고 저장" aria-pressed={isBookmarked}
                          onClick={() => handleToggleBookmark(item.id)}>
                          <Bookmark className={isBookmarked ? 'fill-current' : undefined} />
                        </button>
                        <button type="button" aria-label="공고 숨기기" title="공고 숨기기"
                          onClick={() => handleDismissItem(item)}><EyeOff /></button>
                        <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"
                          aria-label="공고 원문 (새 탭)" title="공고 원문"><ExternalLink /></a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* 상세 보기 모달 */}
      <OpportunityModal
        item={activeItem}
        isBookmarked={activeItem ? bookmarkedIds.includes(activeItem.id) : false}
        progressStage={activeItem ? progressMap.get(activeItem.id)?.stage || null : null}
        onClose={() => setActiveItem(null)}
        onToggleBookmark={handleToggleBookmark}
        onToggleProgress={handleToggleProgress}
        onDismiss={handleDismissItem}
      />

      {/* 숨긴 공고 관리 모달 */}
      <DismissedModal
        isOpen={isDismissedModalOpen}
        entries={dismissedEntries}
        onClose={() => setIsDismissedModalOpen(false)}
        onRestore={handleRestoreDismissed}
        onRestoreAll={handleRestoreAllDismissed}
      />

      <footer className="site-footer">
        <div className="site-shell">
          <details>
            <summary>채용 사이트 바로가기</summary>
            <div className="portal-links">
              {QUICK_PORTALS.map((portal) => (
                <a key={portal.name} href={portal.url} target="_blank" rel="noopener noreferrer">{portal.name}</a>
              ))}
            </div>
          </details>
          <span>CareerRadar</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
