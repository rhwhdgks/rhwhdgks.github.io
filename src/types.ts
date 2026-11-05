export type CategoryType =
  | 'all'
  | 'intern'
  | 'hackathon'
  | 'contest'
  | 'activity'
  | 'kofia';

export interface OpportunityItem {
  id: string;
  title: string;
  organization: string;
  category: Exclude<CategoryType, 'all'>;
  source: string;
  sourceUrl: string;
  startDate?: string | null;
  deadline?: string | null;
  isAlwaysOpen?: boolean;
  tags: string[];
  location?: string;
  reward?: string;
  summary?: string;
  isFeatured?: boolean;
}

export interface OpportunitiesPayload {
  updatedAt: string;
  totalCount: number;
  sourceCounts: Record<string, number>;
  items: OpportunityItem[];
}

export type SortOption = 'fit-desc' | 'deadline-asc' | 'latest' | 'deadline-desc';

export type ViewMode = 'list' | 'my-progress' | 'calendar' | 'cheatsheet';

export type ProgressStage = 'preparing' | 'applied' | 'ongoing';

export interface ProgressStageMeta {
  id: ProgressStage;
  label: string;
  badgeClass: string;
  dotClass: string;
}

export const PROGRESS_STAGE_META: Record<ProgressStage, ProgressStageMeta> = {
  preparing: {
    id: 'preparing',
    label: '준비 · 작성중',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    dotClass: 'bg-amber-500',
  },
  applied: {
    id: 'applied',
    label: '지원 · 제출완료',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-300',
    dotClass: 'bg-blue-600',
  },
  ongoing: {
    id: 'ongoing',
    label: '진행 · 참여중',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    dotClass: 'bg-emerald-600',
  },
};

export interface UserProgressEntry {
  id: string;
  stage: ProgressStage;
  memo: string;
  updatedAt: string;
  /** 크롤링 목록에서 내려가더라도 내 진행 목록에서 계속 볼 수 있도록 스냅샷 보관 */
  snapshot: OpportunityItem;
}

export interface DismissedEntry {
  id: string;
  key: string; // normalized organization::title
  title: string;
  organization: string;
  dismissedAt: string;
}

export interface CategoryMeta {
  id: CategoryType;
  label: string;
  shortLabel: string;
  description: string;
  badgeClass: string;
  dotClass: string;
}

export const CATEGORY_META: Record<CategoryType, CategoryMeta> = {
  all: {
    id: 'all',
    label: '전체 공고',
    shortLabel: '전체',
    description: '인턴, 신입 채용, 해커톤, 공모전, 금융권 채용 전체',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-500',
  },
  intern: {
    id: 'intern',
    label: '인턴 · 신입 채용',
    shortLabel: '인턴/채용',
    description: 'IT·SW 개발자 인턴십 및 신입 채용 공고',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-600',
  },
  hackathon: {
    id: 'hackathon',
    label: '해커톤 · AI 경진대회',
    shortLabel: '해커톤',
    description: '국내외 SW·AI·데이터 해커톤 및 개발 경진대회',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
    dotClass: 'bg-violet-600',
  },
  contest: {
    id: 'contest',
    label: 'IT · 기획 공모전',
    shortLabel: '공모전',
    description: '웹/모바일/IT, 창업, 아이디어 및 서비스 기획 공모전',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-600',
  },
  kofia: {
    id: 'kofia',
    label: '금융투자협회 (KOFIA)',
    shortLabel: '금융권(KOFIA)',
    description: '증권·자산운용·금융권 IT/전산/인턴/신입 실시간 공고',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  activity: {
    id: 'activity',
    label: '대외활동 · 부트캠프',
    shortLabel: '대외활동',
    description: 'SW 교육, 부트캠프, 서포터즈, 멘토링 및 학회',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500',
  },
};

export interface QuickPortal {
  name: string;
  category: string;
  url: string;
  color: string;
}

export const QUICK_PORTALS: QuickPortal[] = [
  {
    name: '금융투자협회 채용',
    category: '금융권(KOFIA)',
    url: 'https://www.kofia.or.kr/brd/m_96/list.do',
    color: 'hover:border-amber-400 hover:bg-amber-50/60 text-amber-900',
  },
  {
    name: '점핏 (Jumpit)',
    category: 'IT 신입/인턴',
    url: 'https://www.jumpit.co.kr/',
    color: 'hover:border-blue-400 hover:bg-blue-50/60 text-blue-900',
  },
  {
    name: '링커리어',
    category: '인턴/공모전',
    url: 'https://linkareer.com/',
    color: 'hover:border-indigo-400 hover:bg-indigo-50/60 text-indigo-900',
  },
  {
    name: '데이콘 (DACON)',
    category: 'AI 해커톤',
    url: 'https://dacon.io/competitions',
    color: 'hover:border-violet-400 hover:bg-violet-50/60 text-violet-900',
  },
  {
    name: '위비티 (Wevity)',
    category: 'IT 공모전',
    url: 'https://www.wevity.com/?c=find&s=1&gub=1&cidx=20',
    color: 'hover:border-emerald-400 hover:bg-emerald-50/60 text-emerald-900',
  },
  {
    name: '원티드 (Wanted)',
    category: 'IT 채용',
    url: 'https://www.wanted.co.kr/wdlist/518?country=kr&job_sort=job.latest_order&years=0',
    color: 'hover:border-sky-400 hover:bg-sky-50/60 text-sky-900',
  },
  {
    name: '프로그래머스',
    category: 'SW 채용',
    url: 'https://career.programmers.co.kr/job_positions?min_career=0&order=recent',
    color: 'hover:border-slate-400 hover:bg-slate-100 text-slate-900',
  },
  {
    name: '캠퍼스픽',
    category: '대외활동/공모전',
    url: 'https://www.campuspick.com/',
    color: 'hover:border-rose-400 hover:bg-rose-50/60 text-rose-900',
  },
];
