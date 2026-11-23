import { DismissedEntry, OpportunityItem } from '../types';

const ENG_KOR_MAP: [string, string][] = [
  ['nice', '나이스'],
  ['nexon', '넥슨'],
  ['kakao', '카카오'],
  ['naver', '네이버'],
  ['labs', '랩스'],
  ['webtoon', '웹툰'],
  ['cloud', '클라우드'],
  ['financial', '파이낸셜'],
  ['pay', '페이'],
  ['bank', '뱅크'],
  ['line', '라인'],
  ['toss', '토스'],
  ['daangn', '당근'],
  ['mobis', '모비스'],
  ['netmarble', '넷마블'],
  ['krafton', '크래프톤'],
  ['hyundai', '현대'],
  ['samsung', '삼성'],
  ['hanwha', '한화'],
  ['shinhan', '신한'],
  ['woori', '우리'],
  ['hana', '하나'],
  ['sk', '에스케이'],
  ['kt', '케이티'],
  ['lg', '엘지'],
];

const ORG_ALIASES: Record<string, string> = {
  당근마켓: '당근',
};

const DEDUP_STOPWORDS = new Set([
  '채용',
  '모집',
  '공고',
  '인턴',
  '인턴십',
  '신입',
  '초급',
  '사원',
  '정규직',
  '전환형',
  '채용연계형',
  '채용전환형',
  '체험형',
  '부문',
  '분야',
  '상시',
  '수시',
  '영입',
  '참가자',
  '지원자',
  '안내',
  '공모',
  '모집안내',
]);

const SORTED_STOPWORDS = [...DEDUP_STOPWORDS].sort((a, b) => b.length - a.length);

const BRACKET_BOILERPLATE = [
  '마감',
  '접수',
  '서류',
  '신입',
  '경력',
  '초급',
  '인턴',
  '채용',
  '모집',
  '전환',
  '체험',
  '상시',
  '수시',
  '상반기',
  '하반기',
  '정규직',
  '계약직',
  '병특',
  '전문연구',
  '서울',
  '판교',
  '강남',
  '분당',
  '수원',
  '청주',
  '대전',
  '부산',
  '제주',
  '미국',
  '개월',
  '무관',
];

export function normalizeOrg(name: string): string {
  let t = (name || '').toLowerCase();
  for (const [eng, kor] of ENG_KOR_MAP) {
    t = t.split(eng).join(kor);
  }
  t = t.replace(/\[.*?\]|\(.*?\)/g, '');
  t = t.replace(/\(주\)|주식회사|\(유\)|유한회사|주\)/g, '');
  t = t.replace(/코리아|한국|그룹/g, '');
  t = t.replace(/[^a-zA-Z0-9가-힣]/g, '').trim();
  return ORG_ALIASES[t] ?? t;
}

export function isBoilerplateBracket(inner: string, orgClean: string): boolean {
  const low = inner.toLowerCase().trim();
  if (!low) return true;
  if (/^\s*(주|유)\s*$/.test(low)) return true;
  if (orgClean && orgClean.length >= 2 && normalizeOrg(low).includes(orgClean)) {
    return true;
  }
  if (
    low.includes('~') ||
    /\d{1,2}\s*\/\s*\d{1,2}|\d{1,2}월|\d{4}[.\-/]\d{1,2}/.test(low)
  ) {
    return true;
  }
  return BRACKET_BOILERPLATE.some((bw) => low.includes(bw));
}

function stripBoilerplateBrackets(title: string, orgClean: string): string {
  return title.replace(/\[[^\]]*\]|\([^)]*\)/g, (full) => {
    const inner = full.slice(1, -1);
    return isBoilerplateBracket(inner, orgClean) ? ' ' : ` ${inner} `;
  });
}

export function normalizeTitle(title: string, orgClean: string): string {
  let t = stripBoilerplateBrackets((title || '').toLowerCase().replace(/년도/g, '년'), orgClean);
  if (orgClean && orgClean.length >= 2) {
    t = t.split(orgClean).join(' ');
  }
  for (const sw of SORTED_STOPWORDS) {
    t = t.split(sw).join(' ');
  }
  return t.replace(/[^a-zA-Z0-9가-힣]/g, '').trim();
}

export function extractCoreTokens(title: string, orgClean: string): Set<string> {
  const t = stripBoilerplateBrackets((title || '').toLowerCase().replace(/년도/g, '년'), orgClean);
  const matches = t.match(/[a-z0-9가-힣]{2,}/g) || [];
  const out = new Set<string>();
  for (const tok of matches) {
    if (DEDUP_STOPWORDS.has(tok)) continue;
    if (orgClean && orgClean.length >= 2 && tok === orgClean) continue;
    out.add(tok);
  }
  return out;
}

export function makeDismissKey(item: { title: string; organization: string }): string {
  return `${item.organization.trim().toLowerCase()}::${item.title.trim().toLowerCase()}`;
}

interface NormalizedDismissTarget {
  org: string;
  normTitle: string;
  tokens: Set<string>;
}

function orgMatches(orgA: string, orgB: string): boolean {
  if (!orgA || !orgB) return false;
  if (orgA === orgB) return true;
  return orgA.length >= 2 && orgB.length >= 2 && (orgA.includes(orgB) || orgB.includes(orgA));
}

function setEquals(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) {
    if (!b.has(v)) return false;
  }
  return true;
}

function hasTrackConflict(a: Set<string>, b: Set<string>): boolean {
  let onlyInA = false;
  for (const v of a) {
    if (!b.has(v)) {
      onlyInA = true;
      break;
    }
  }
  if (!onlyInA) return false;
  for (const v of b) {
    if (!a.has(v)) return true;
  }
  return false;
}

export function createDismissMatcher(
  dismissedEntries: DismissedEntry[]
): (item: OpportunityItem) => boolean {
  const idSet = new Set(dismissedEntries.map((d) => d.id));
  const exactKeySet = new Set(dismissedEntries.map((d) => d.key));
  const normalizedTargets: NormalizedDismissTarget[] = dismissedEntries.map((d) => {
    const org = normalizeOrg(d.organization);
    return {
      org,
      normTitle: normalizeTitle(d.title, org),
      tokens: extractCoreTokens(d.title, org),
    };
  });

  return (item: OpportunityItem): boolean => {
    if (idSet.has(item.id)) return true;
    if (item.aliases && item.aliases.some((aid) => idSet.has(aid))) return true;
    if (exactKeySet.has(makeDismissKey(item))) return true;
    if (normalizedTargets.length === 0) return false;

    const org = normalizeOrg(item.organization);
    const normTitle = normalizeTitle(item.title, org);
    const tokens = extractCoreTokens(item.title, org);

    for (const target of normalizedTargets) {
      if (!orgMatches(org, target.org)) continue;
      if (normTitle.length >= 2 && normTitle === target.normTitle) return true;
      if (tokens.size >= 3 && setEquals(tokens, target.tokens)) return true;
      if (
        normTitle.length >= 5 &&
        target.normTitle.length >= 5 &&
        (normTitle.includes(target.normTitle) || target.normTitle.includes(normTitle)) &&
        !hasTrackConflict(tokens, target.tokens)
      ) {
        return true;
      }
    }

    return false;
  };
}
