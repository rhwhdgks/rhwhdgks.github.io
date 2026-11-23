import { OpportunityItem } from '../types';

const INTERN_TITLE_RE = /인턴|intern|\bra\s*\(|\bra\b|어시스턴트|assistant/i;
const CONVERSION_RE =
  /채용\s*연계|채용\s*전환|전환형|채용형\s*인턴|정규직\s*전환|정규\s*전환|유급\s*스프린트\s*후\s*정규직/i;
const NON_INTERN_TITLE_RE =
  /정규직원|정규직|단기계약직|계약직|전문연구요원|피크타이머|아카데미|직무체험캠프/i;

/**
 * 재학 중 지원 가능한 공고 판별:
 * - 해커톤 / 공모전: 포함
 * - 대외활동(강연/교육 등): 제외
 * - 인턴 / 금융권: 채용연계·전환형, 신입 정규직/계약직/전문연/아카데미 제외 → 순수/체험형/RA/일반 인턴만 포함
 */
export function isStudentEligible(item: OpportunityItem): boolean {
  if (item.category === 'hackathon' || item.category === 'contest') {
    return true;
  }
  if (item.category === 'activity') {
    return false;
  }

  const title = item.title || '';
  const summary = item.summary || '';
  const tags = (item.tags || []).join(' ');
  const combined = `${title} ${tags} ${summary}`;

  if (CONVERSION_RE.test(combined)) {
    return false;
  }
  if (NON_INTERN_TITLE_RE.test(title)) {
    return false;
  }
  return INTERN_TITLE_RE.test(title);
}
