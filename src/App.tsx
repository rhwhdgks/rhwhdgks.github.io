import React, { useEffect, useMemo, useState } from 'react';
import {
  Radar,
  Search,
  Calendar as CalendarIcon,
  LayoutGrid,
  Bookmark,
  Flame,
  Briefcase,
  Trophy,
  Landmark,
  Sparkles,
  ExternalLink,
  Building2,
  MapPin,
  Clock,
  RefreshCw,
  Filter,
  X,
  CheckCircle2,
  FolderKanban,
  Plus,
  EyeOff,
  RotateCcw,
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

const BOOKMARK_STORAGE_KEY = 'career_radar_bookmarks_v1';
const PROGRESS_STORAGE_KEY = 'career_radar_progress_v1';
const DISMISSED_STORAGE_KEY = 'career_radar_dismissed_v1';

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

function makeDismissKey(item: { title: string; organization: string }): string {
  return `${item.organization.trim().toLowerCase()}::${item.title.trim().toLowerCase()}`;
}

export function App() {
  const [data, setData] = useState<OpportunitiesPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 및 뷰 상태
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('fit-desc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [hideClosed, setHideClosed] = useState<boolean>(true);
  const [onlyUrgent, setOnlyUrgent] = useState<boolean>(false);
  const [onlyBookmarked, setOnlyBookmarked] = useState<boolean>(false);

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

  // 빠른 조회용 Set/Map
  const dismissedIdSet = useMemo(
    () => new Set(dismissedEntries.map((d) => d.id)),
    [dismissedEntries]
  );
  const dismissedKeySet = useMemo(
    () => new Set(dismissedEntries.map((d) => d.key)),
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
    return raw.filter(
      (item) =>
        !dismissedIdSet.has(item.id) && !dismissedKeySet.has(makeDismissKey(item))
    );
  }, [data, dismissedIdSet, dismissedKeySet]);

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

  // 통계 계산 (숨긴 공고 제외 기준)
  const stats = useMemo(() => {
    let activeCount = 0;
    let urgentCount = 0;
    let internCount = 0;
    let hackathonContestCount = 0;
    let kofiaCount = 0;

    for (const item of visibleAllItems) {
      const dday = getDdayInfo(item.deadline, item.isAlwaysOpen);
      const isClosed = dday.status === 'closed';
      if (!isClosed) {
        activeCount++;
        if (dday.daysLeft !== null && dday.daysLeft >= 0 && dday.daysLeft <= 7) {
          urgentCount++;
        }
      }
      if (item.category === 'intern') internCount++;
      if (item.category === 'hackathon' || item.category === 'contest') hackathonContestCount++;
      if (item.category === 'kofia') kofiaCount++;
    }

    return {
      activeCount,
      urgentCount,
      internCount,
      hackathonContestCount,
      kofiaCount,
    };
  }, [visibleAllItems]);

  // 카테고리별 개수
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryType, number> = {
      all: visibleAllItems.length,
      intern: 0,
      hackathon: 0,
      contest: 0,
      kofia: 0,
      activity: 0,
    };
    for (const it of visibleAllItems) {
      if (counts[it.category] !== undefined) {
        counts[it.category]++;
      }
    }
    return counts;
  }, [visibleAllItems]);

  // 출처 목록
  const availableSources = useMemo(() => {
    const map: Record<string, number> = {};
    for (const it of visibleAllItems) {
      map[it.source] = (map[it.source] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [visibleAllItems]);

  // 필터링 및 정렬된 아이템
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = visibleAllItems.filter((item) => {
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
    visibleAllItems,
    searchQuery,
    hideClosed,
    onlyUrgent,
    onlyBookmarked,
    bookmarkedIds,
    selectedCategory,
    selectedSource,
    sortBy,
  ]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedSource('all');
    setSearchQuery('');
    setOnlyUrgent(false);
    setOnlyBookmarked(false);
    setViewMode('list');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* 상단 고정 네비게이션 바 */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div
            onClick={resetFilters}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-700 transition">
              <Radar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-slate-900">
                  CareerRadar
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  일 3회 자동 수집
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden lg:block">
                인턴 · 신입 채용 · 해커톤 · 공모전 · 금융투자협회(KOFIA) 알림 허브
              </p>
            </div>
          </div>

          {/* 우측 컨트롤: 업데이트 시각, 메인 뷰 탭(공고목록 / 내 진행현황 / 캘린더), 숨김관리 */}
          <div className="flex items-center gap-2">
            {data?.updatedAt && (
              <div
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-medium text-slate-600"
                title="매일 09:00, 14:00, 20:00 (하루 3번) 자동 업데이트됩니다"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                <span>최근 수집: {data.updatedAt}</span>
              </div>
            )}

            {/* 메인 뷰 전환 (전체 공고 / 내 진행 현황 / 캘린더) */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'list'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>공고 탐색</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('my-progress')}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'my-progress'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-emerald-700'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>내 진행 현황</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                    viewMode === 'my-progress'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {progressEntries.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'calendar'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>캘린더</span>
              </button>
            </div>

            {/* 북마크(찜) 필터 버튼 */}
            <button
              type="button"
              onClick={() => {
                setViewMode('list');
                setOnlyBookmarked((prev) => !prev);
              }}
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold border transition ${
                onlyBookmarked
                  ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="관심 찜한 공고 모아보기"
            >
              <Bookmark
                className={`w-3.5 h-3.5 ${
                  onlyBookmarked ? 'fill-amber-500 text-amber-500' : 'text-slate-400'
                }`}
              />
              <span className="hidden md:inline">찜</span>
              <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-slate-100 text-slate-700">
                {bookmarkedIds.length}
              </span>
            </button>

            {/* 숨긴 공고 관리 버튼 */}
            <button
              type="button"
              onClick={() => setIsDismissedModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
              title="지운(숨긴) 공고 목록 확인 및 복구"
            >
              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">숨김</span>
              <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-slate-100 text-slate-600">
                {dismissedEntries.length}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 방금 지운 공고 실행 취소 알림 바 */}
      {lastDismissed && (
        <div className="bg-slate-900 text-white px-4 py-2.5 text-xs flex items-center justify-center gap-3 shadow-md">
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

      {/* 메인 컨테이너 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 주요 취업/공모전 사이트 원클릭 바로가기 바 */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>연동 플랫폼 & 주요 취업 사이트 바로가기</span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              하루 3번(09:00 · 14:00 · 20:00 KST) 최신 공고를 자동 크롤링합니다
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {QUICK_PORTALS.map((portal) => (
              <a
                key={portal.name}
                href={portal.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold transition ${portal.color}`}
              >
                <span>{portal.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/80 text-slate-500 border border-slate-200/60">
                  {portal.category}
                </span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            ))}
          </div>
        </section>

        {/* 대시보드 요약 카드 6종 (내 진행 현황 포함) */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. 내가 진행 중인 활동 카드 */}
          <button
            type="button"
            onClick={() => setViewMode('my-progress')}
            className={`p-4 rounded-2xl border text-left transition ${
              viewMode === 'my-progress'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                : 'bg-emerald-50/60 text-slate-900 border-emerald-200 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-bold ${
                  viewMode === 'my-progress' ? 'text-emerald-100' : 'text-emerald-800'
                }`}
              >
                내가 진행 중
              </span>
              <FolderKanban
                className={`w-4 h-4 ${
                  viewMode === 'my-progress' ? 'text-emerald-100' : 'text-emerald-600'
                }`}
              />
            </div>
            <div className="text-2xl font-extrabold">{progressEntries.length}건</div>
            <div
              className={`text-[11px] mt-1 ${
                viewMode === 'my-progress' ? 'text-emerald-100' : 'text-emerald-700'
              }`}
            >
              지원/참여 중인 목록 보기
            </div>
          </button>

          {/* 2. 전체 활성 공고 */}
          <button
            type="button"
            onClick={() => {
              setViewMode('list');
              setSelectedCategory('all');
              setOnlyUrgent(false);
            }}
            className={`p-4 rounded-2xl border text-left transition ${
              viewMode === 'list' && selectedCategory === 'all' && !onlyUrgent
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                : 'bg-white text-slate-900 border-slate-200 hover:border-indigo-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-semibold ${
                  viewMode === 'list' && selectedCategory === 'all' && !onlyUrgent
                    ? 'text-indigo-100'
                    : 'text-slate-500'
                }`}
              >
                전체 활성 공고
              </span>
              <CheckCircle2
                className={`w-4 h-4 ${
                  viewMode === 'list' && selectedCategory === 'all' && !onlyUrgent
                    ? 'text-indigo-200'
                    : 'text-indigo-600'
                }`}
              />
            </div>
            <div className="text-2xl font-extrabold">{stats.activeCount}건</div>
            <div
              className={`text-[11px] mt-1 ${
                viewMode === 'list' && selectedCategory === 'all' && !onlyUrgent
                  ? 'text-indigo-100'
                  : 'text-slate-400'
              }`}
            >
              안 볼 공고 제외 전체
            </div>
          </button>

          {/* 3. 마감 임박 */}
          <button
            type="button"
            onClick={() => {
              setViewMode('list');
              setOnlyUrgent((prev) => !prev);
            }}
            className={`p-4 rounded-2xl border text-left transition ${
              viewMode === 'list' && onlyUrgent
                ? 'bg-red-600 text-white border-red-600 shadow-md'
                : 'bg-white text-slate-900 border-slate-200 hover:border-red-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-semibold ${
                  viewMode === 'list' && onlyUrgent ? 'text-red-100' : 'text-slate-500'
                }`}
              >
                마감 임박 (D-7)
              </span>
              <Flame
                className={`w-4 h-4 ${
                  viewMode === 'list' && onlyUrgent ? 'text-red-200' : 'text-red-500'
                }`}
              />
            </div>
            <div className="text-2xl font-extrabold">{stats.urgentCount}건</div>
            <div
              className={`text-[11px] mt-1 ${
                viewMode === 'list' && onlyUrgent ? 'text-red-100' : 'text-slate-400'
              }`}
            >
              이번 주 마감 공고
            </div>
          </button>

          {/* 4. IT 인턴/신입 */}
          <button
            type="button"
            onClick={() => {
              setViewMode('list');
              setSelectedCategory('intern');
              setOnlyUrgent(false);
            }}
            className={`p-4 rounded-2xl border text-left transition ${
              viewMode === 'list' && selectedCategory === 'intern'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'bg-white text-slate-900 border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-semibold ${
                  viewMode === 'list' && selectedCategory === 'intern'
                    ? 'text-blue-100'
                    : 'text-slate-500'
                }`}
              >
                IT 인턴 · 신입
              </span>
              <Briefcase
                className={`w-4 h-4 ${
                  viewMode === 'list' && selectedCategory === 'intern'
                    ? 'text-blue-200'
                    : 'text-blue-600'
                }`}
              />
            </div>
            <div className="text-2xl font-extrabold">{stats.internCount}건</div>
            <div
              className={`text-[11px] mt-1 ${
                viewMode === 'list' && selectedCategory === 'intern'
                  ? 'text-blue-100'
                  : 'text-slate-400'
              }`}
            >
              개발·AI 신입/인턴십
            </div>
          </button>

          {/* 5. 해커톤/공모전 */}
          <button
            type="button"
            onClick={() => {
              setViewMode('list');
              setSelectedCategory('hackathon');
              setOnlyUrgent(false);
            }}
            className={`p-4 rounded-2xl border text-left transition ${
              viewMode === 'list' &&
              (selectedCategory === 'hackathon' || selectedCategory === 'contest')
                ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                : 'bg-white text-slate-900 border-slate-200 hover:border-violet-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-semibold ${
                  viewMode === 'list' &&
                  (selectedCategory === 'hackathon' || selectedCategory === 'contest')
                    ? 'text-violet-100'
                    : 'text-slate-500'
                }`}
              >
                해커톤 · 공모전
              </span>
              <Trophy
                className={`w-4 h-4 ${
                  viewMode === 'list' &&
                  (selectedCategory === 'hackathon' || selectedCategory === 'contest')
                    ? 'text-violet-200'
                    : 'text-violet-600'
                }`}
              />
            </div>
            <div className="text-2xl font-extrabold">{stats.hackathonContestCount}건</div>
            <div
              className={`text-[11px] mt-1 ${
                viewMode === 'list' &&
                (selectedCategory === 'hackathon' || selectedCategory === 'contest')
                  ? 'text-violet-100'
                  : 'text-slate-400'
              }`}
            >
              AI 경진대회 · SW 공모전
            </div>
          </button>

          {/* 6. 금융투자협회(KOFIA) */}
          <button
            type="button"
            onClick={() => {
              setViewMode('list');
              setSelectedCategory('kofia');
              setOnlyUrgent(false);
            }}
            className={`p-4 rounded-2xl border text-left transition ${
              viewMode === 'list' && selectedCategory === 'kofia'
                ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                : 'bg-white text-slate-900 border-slate-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-semibold ${
                  viewMode === 'list' && selectedCategory === 'kofia'
                    ? 'text-amber-50'
                    : 'text-slate-500'
                }`}
              >
                금융권 (KOFIA)
              </span>
              <Landmark
                className={`w-4 h-4 ${
                  viewMode === 'list' && selectedCategory === 'kofia'
                    ? 'text-amber-100'
                    : 'text-amber-600'
                }`}
              />
            </div>
            <div className="text-2xl font-extrabold">{stats.kofiaCount}건</div>
            <div
              className={`text-[11px] mt-1 ${
                viewMode === 'list' && selectedCategory === 'kofia'
                  ? 'text-amber-50'
                  : 'text-slate-400'
              }`}
            >
              증권·자산운용 채용
            </div>
          </button>
        </section>

        {/* "내 진행 현황" 뷰일 때는 전용 워크스페이스 렌더링 */}
        {viewMode === 'my-progress' ? (
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
            {/* 검색 및 필터 컨트롤 박스 (공고 탐색 & 캘린더 공통) */}
            <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
              {/* 분야별 카테고리 탭 */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
                      className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} />
                      <span>{meta.label}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[11px] ${
                          isSelected ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {categoryCounts[catId] || 0}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 검색창 + 출처 필터 + 정렬 옵션 */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* 키워드 검색 입력 */}
                <div className="md:col-span-6 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="기업명, 공고 제목, 기술스택(AI, 백엔드, React, 보안, 증권 등) 검색..."
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* 수집 출처 필터 */}
                <div className="md:col-span-3 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
                  <select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">전체 수집 출처 ({visibleAllItems.length})</option>
                    {availableSources.map(([src, cnt]) => (
                      <option key={src} value={src}>
                        {src} ({cnt})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 정렬 방식 */}
                <div className="md:col-span-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full px-3 py-2.5 rounded-xl border border-indigo-200 bg-white text-sm font-semibold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                  >
                    <option value="fit-desc">🎯 내 스택 맞춤 추천순 (적합도순)</option>
                    <option value="deadline-asc">⚡ 마감 임박순 (D-Day)</option>
                    <option value="latest">🆕 최신 등록순</option>
                    <option value="deadline-desc">📅 마감 여유순</option>
                  </select>
                </div>
              </div>

              {/* 인기 태그 원클릭 칩 & 보조 토글 */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-400 mr-1">추천 키워드:</span>
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

                <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hideClosed}
                      onChange={(e) => setHideClosed(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>마감된 공고 숨기기</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={onlyUrgent}
                      onChange={(e) => setOnlyUrgent(e.target.checked)}
                      className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-red-600 font-semibold">마감임박(D-7)만</span>
                  </label>
                </div>
              </div>
            </section>

            {/* 결과 헤더 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {CATEGORY_META[selectedCategory].label}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                  {filteredItems.length}건
                </span>
                {(selectedCategory !== 'all' ||
                  selectedSource !== 'all' ||
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

              <span className="text-xs text-slate-500 hidden sm:inline">
                카드 우측 상단의 <strong>[+ 진행중]</strong>으로 내 일정에 담거나, <strong>[눈 아이콘(숨김)]</strong>으로 영구 삭제할 수 있습니다
              </span>
            </div>

            {/* 로딩 / 에러 / 본문 영역 */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="h-56 rounded-2xl bg-white border border-slate-200 p-5 animate-pulse flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="w-24 h-5 bg-slate-200 rounded" />
                      <div className="w-3/4 h-6 bg-slate-200 rounded" />
                      <div className="w-full h-12 bg-slate-100 rounded" />
                    </div>
                    <div className="w-1/2 h-4 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
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
                  검색어나 카테고리 필터를 변경해 보세요.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
                >
                  전체 공고 보기
                </button>
              </div>
            ) : (
              /* 카드 그리드 (리스트 뷰) */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item) => {
                  const meta = CATEGORY_META[item.category] || CATEGORY_META.intern;
                  const dday = getDdayInfo(item.deadline, item.isAlwaysOpen);
                  const isBookmarked = bookmarkedIds.includes(item.id);
                  const progressEntry = progressMap.get(item.id);
                  const inProgress = Boolean(progressEntry);
                  const fit = analyzeOpportunityFit(item);

                  return (
                    <article
                      key={item.id}
                      onClick={() => setActiveItem(item)}
                      className={`group bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between cursor-pointer relative ${
                        inProgress
                          ? 'border-2 border-emerald-400 bg-emerald-50/10 shadow-xs'
                          : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                      }`}
                    >
                      <div>
                        {/* 상단 뱃지 & 액션 버튼(+진행중 / 찜 / 안볼래요 삭제) */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 text-xs font-semibold rounded-lg border ${meta.badgeClass}`}
                            >
                              {meta.shortLabel}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-xs rounded-lg border ${dday.badgeStyle}`}
                            >
                              {dday.label}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-lg border ${
                                fit.matchScore >= 90
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              }`}
                              title={`내 스택 맞춤 직무: ${fit.targetRole}`}
                            >
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              <span>매칭 {fit.matchScore}%</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* 진행중 토글 버튼 */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleProgress(item);
                              }}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                                inProgress
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                              }`}
                              title="내가 진행 중인 목록에 추가/제거"
                            >
                              {inProgress ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>
                                    {PROGRESS_STAGE_META[progressEntry!.stage].label.split(' ')[0]}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>진행중</span>
                                </>
                              )}
                            </button>

                            {/* 찜하기 버튼 */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleBookmark(item.id);
                              }}
                              className={`p-1.5 rounded-lg border transition ${
                                isBookmarked
                                  ? 'bg-amber-50 border-amber-200 text-amber-500'
                                  : 'bg-white border-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                              }`}
                              title="관심 공고 찜"
                            >
                              <Bookmark
                                className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`}
                              />
                            </button>

                            {/* 이미 확인했거나 안 할 공고 영구 삭제(숨기기) 버튼 */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDismissItem(item);
                              }}
                              className="p-1.5 rounded-lg border border-transparent text-slate-400 hover:bg-red-50 hover:border-red-100 hover:text-red-600 transition"
                              title="이미 확인했거나 안 할 공고 지우기 (다시 안 뜸)"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* 기업/주최기관 및 출처 */}
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate text-slate-700">{item.organization}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400 shrink-0">{item.source}</span>
                        </div>

                        {/* 내 맞춤 추천 직무 */}
                        <div className="mb-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50/70 border border-indigo-100 text-[11px] font-semibold text-indigo-800">
                            <Sparkles className="w-3 h-3 text-indigo-600 shrink-0" />
                            <span className="truncate max-w-[220px]">맞춤: {fit.targetRole}</span>
                          </span>
                        </div>

                        {/* 공고 제목 */}
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-2 leading-snug mb-2">
                          {item.title}
                        </h3>

                        {/* 요약 설명 */}
                        {item.summary && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                            {item.summary}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 space-y-2.5">
                        {/* 태그 목록 */}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 4).map((tag) => (
                              <span
                                key={tag}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSearchQuery(tag);
                                }}
                                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 마감일 및 원문 이동 버튼 */}
                        <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                          <div className="flex items-center gap-2 truncate">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {item.isAlwaysOpen || !item.deadline
                                ? '상시'
                                : `신청마감: ~ ${item.deadline}`}
                            </span>
                            {item.location && (
                              <span className="hidden sm:inline-flex items-center gap-0.5 text-slate-400 truncate">
                                <MapPin className="w-3 h-3" />
                                {item.location}
                              </span>
                            )}
                          </div>

                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0 inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800"
                          >
                            <span>원문 보기</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
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

      {/* 푸터 */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">CareerRadar</span>
            <span>—</span>
            <span>
              IT·SW 및 금융권(KOFIA) 인턴, 신입 채용, 해커톤, 공모전 알림 허브 (하루 3회 자동 업데이트)
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsDismissedModalOpen(true)}
              className="hover:text-slate-800 underline"
            >
              숨긴 공고 관리 ({dismissedEntries.length}건)
            </button>
            <span>
              수동 공고: <code className="text-slate-700">public/data/manual.json</code>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
