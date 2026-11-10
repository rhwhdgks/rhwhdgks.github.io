import type { OpportunityItem } from '../types';

// 금융권 탭 세부 필터: 기관 유형(증권·운용 / 은행 / 금융공기업)과 직무(금융IT·데이터)
export type FinanceGroup = 'all' | 'securities' | 'bank' | 'public' | 'it';

export const FINANCE_GROUPS: { id: FinanceGroup; label: string; hint: string }[] = [
  { id: 'all', label: '전체', hint: '금융권 공고 전체' },
  { id: 'securities', label: '증권·운용', hint: '증권사·자산운용·선물·평가사·중개사' },
  { id: 'bank', label: '은행', hint: '시중·인터넷·지방·국책은행' },
  { id: 'public', label: '금융공기업', hint: '예금보험공사·기술보증기금 등 공공기관' },
  { id: 'it', label: '금융IT·데이터', hint: 'IT·개발·보안·AI/데이터 직무 (기관 무관)' },
];

// 제목 기반 IT 태그와 링커리어 직무 카테고리만 사용 ('AI/데이터'는 KOFIA 본문에서도 붙을 수 있어 제외)
const IT_TAGS = [
  '금융IT/보안',
  '금융IT',
  'AI/ML엔지니어',
  '데이터분석',
  '시스템/ERP개발',
  'DevOps/클라우드/보안',
  '백엔드/서버개발',
];
// 영문 약어는 단어 경계로만 매칭 ("Securities"의 'it', "Retail"의 'ai' 오탐 방지)
const IT_TITLE_RE =
  /(\b(IT|AI|DATA|ENGINEER|ENGINEERING|DEVELOPER|DEVOPS)\b|개발|엔지니어|데이터|인공지능|보안|시스템|클라우드|전산)/i;

/** 기관 유형: 금융공기업 → 은행 → 그 외(증권·운용·투자·중개) 순으로 판정 */
export function financeOrgGroup(item: OpportunityItem): Exclude<FinanceGroup, 'all' | 'it'> {
  const tags = item.tags || [];
  if (tags.includes('금융공기업')) return 'public';
  if (tags.includes('은행') || /은행|뱅크/.test(item.organization)) return 'bank';
  return 'securities';
}

export function isFinanceItJob(item: OpportunityItem): boolean {
  const tags = item.tags || [];
  if (IT_TAGS.some((t) => tags.includes(t))) return true;
  const core = item.title.replace(/^\s*\[[^\]]*\]\s*/, '');
  return IT_TITLE_RE.test(core);
}

export function matchesFinanceGroup(item: OpportunityItem, group: FinanceGroup): boolean {
  if (group === 'all') return true;
  if (group === 'it') return isFinanceItJob(item);
  return financeOrgGroup(item) === group;
}
