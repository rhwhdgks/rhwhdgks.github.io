#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CareerRadar 맞춤형 공고 수집기
사용자 프로필(고려대 컴퓨터공학 · 금융 데이터 분석 / 퀀트 연구 / 거래 시스템 개발 / Python·FastAPI·PyTorch·SQL)에
정확히 부합하는 인턴십·신입 채용·해커톤·데이터/금융 경진대회만 엄선하여 수집합니다.
"""

import datetime
import html
import http.client
import json
import os
import re
import ssl
import time
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional, Tuple

KST = datetime.timezone(datetime.timedelta(hours=9))
NOW = datetime.datetime.now(KST)
TODAY_STR = NOW.strftime("%Y-%m-%d")

SSL_CTX = ssl.create_default_context()
SSL_CTX.check_hostname = False
SSL_CTX.verify_mode = ssl.CERT_NONE

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
)

# ==============================================================================
# 도메인 필터링 규칙 (컴퓨터공학 · 퀀트 · 금융데이터 · AI/데이터 · 백엔드 SW 신입/인턴 특화)
# ==============================================================================

# 1. 공모전/해커톤/대외활동에서 즉시 제외할 비개발·비데이터·마케팅 키워드
CONTEST_BLACKLIST = [
    "광고", "숏폼", "영상", "사진", "웹툰", "웹소설", "영화", "단편영화",
    "캐릭터", "동화", "설화", "일러스트", "디자인", "미술", "창조공모",
    "그래픽", "시나리오", "수기", "에세이", "독후감", "슬로건", "네이밍",
    "굿즈", "태권도", "체육", "관광", "홍보", "이벤트", "서포터즈", "기자단",
    "봉사", "멘토링", "컨설턴트", "고교생", "청소년", "어린이", "초등", "중학",
    "게임창작", "인디게임", "꿀팁", "플레이 콘텐츠", "게임·콘텐츠", "창업 공모",
    "IR 챔피언십", "어워드", "AWARDS", "세미나", "박람회", "EXPO",
    "햇반", "AI디어", "식품", "차량용 앱", "인포테인먼트",
    "창업", "아이디어", "평가단", "체험단", "베타 테스터", "사회적기업",
    "기획 공모전", "PM/PO", "활용사례", "드래프톤", "우수사례"
]

# 2. 공모전/해커톤 제목에 반드시 포함되어야 하는 기술·데이터·금융 키워드
CONTEST_REQUIRED_TITLE_KEYWORDS = [
    "해커톤", "HACKATHON", "경진대회", "데이터", "DATA", "AI", "인공지능",
    "머신러닝", "딥러닝", "LLM", "RAG", "알고리즘", "퀀트", "QUANT",
    "금융", "핀테크", "트레이딩", "파생", "벤치마크", "AX CHALLENGE"
]

# 3. 채용/인턴에서 즉시 제외할 무관 직무(하드웨어/설비/영업/디자인/순수경력 등) 키워드
JOB_BLACKLIST = [
    "디자이너", "이펙트", "원화가", "아트", "물류", "LOGISTICS", "화장품",
    "스킨케어", "영업", "SALES", "마케팅", "마케터", "고객상담", "CS",
    "해외 메시지", "파트너사", "기구설계", "회로설계", "펌웨어", "임베디드",
    "반도체 MES", "헬프데스크", "테크니컬 서포트", "기술지원", "전직자", "보충역",
    "산업기능요원", "전략기획", "경영관리", "펀드회계", "내부감사", "총무",
    "사무/문서관리", "비서", "인사", "HR", "홍보", "PR", "PB", "지점", "창구", "연금가입자",
    "퇴직자", "경력단절", "결제 담당자", "SETTLEMENT", "전산장비", "유지보수",
    "광통신", "네트워크 엔지니어", "RF", "ANALOG", "MMIC", "LAYOUT",
    "제어기술", "로보틱스", "로봇", "머신비전", "응용SW", "크로스플랫폼",
    "모바일 앱", "악성코드", "경력 채용", "경력직", "컴파일러"
]

# 4. 채용/인턴에서 허용할 핵심 직무(Python·백엔드·데이터·AI·금융·퀀트) 키워드
JOB_REQUIRED_KEYWORDS = [
    "PYTHON", "백엔드", "BACKEND", "BACK-END", "서버", "FASTAPI", "DJANGO", "SPRING",
    "데이터", "DATA", "AI", "GENAI", "OPENAI", "인공지능", "머신러닝", "딥러닝",
    "멀티모달", "MULTIMODAL", "ML", "MLOPS", "LLM", "NLP", "PYTORCH", "TENSORFLOW",
    "퀀트", "QUANT", "트레이딩", "알고리즘", "금융", "핀테크", "블록체인", "SQL",
    "풀스택", "풀스텍", "FULLSTACK", "FULL-STACK", "SW", "소프트웨어",
    "ENGINEERING FOCUSED", "SOFTWARE ENGINEER", "DATABASE", "클라우드", "CLOUD",
    "보안", "SECURITY"
]


def _match_kw(text_upper: str, kw: str) -> bool:
    """짧은 영문 약어(AI, ML, SW, CS, PR, PE, IB 등)가 다른 영단어 내부에 부분 매칭되는 오탐 방지"""
    kw_u = kw.upper()
    if re.match(r"^[A-Z]{2,3}$", kw_u):
        return bool(re.search(rf"(?<![A-Z]){re.escape(kw_u)}(?![A-Z])", text_upper))
    return kw_u in text_upper


def has_any_kw(text_upper: str, keywords: List[str]) -> bool:
    return any(_match_kw(text_upper, k) for k in keywords)


def fetch_text(url: str, timeout: int = 10, headers: Optional[Dict[str, str]] = None) -> str:
    req_headers = {"User-Agent": USER_AGENT}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, headers=req_headers)
    try:
        with urllib.request.urlopen(req, context=SSL_CTX, timeout=timeout) as resp:
            raw = resp.read()
            return raw.decode("utf-8", errors="ignore")
    except http.client.IncompleteRead as e:
        return e.partial.decode("utf-8", errors="ignore")


def fetch_complete(url: str, marker: str = "</html>", tries: int = 3, timeout: int = 12) -> Tuple[str, bool]:
    """응답이 중간에 끊겨 오는 서버(KOFIA 등) 대응: marker가 나올 때까지 재시도하고 (본문, 완결 여부) 반환"""
    last = ""
    for attempt in range(tries):
        try:
            last = fetch_text(url, timeout=timeout)
            if marker in last:
                return last, True
        except Exception:
            pass
        if attempt < tries - 1:
            time.sleep(0.6 * (attempt + 1))
    return last, False


def clean_html_text(raw_html: str) -> str:
    if not raw_html:
        return ""
    unescaped = html.unescape(raw_html)
    no_tags = re.sub(r"<[^>]+>", " ", unescaped)
    return re.sub(r"\s+", " ", no_tags).strip()


def is_valid_contest_or_hackathon(title: str, summary: str = "") -> bool:
    t_upper = title.upper()
    combined = f"{title} {summary}".upper()
    if has_any_kw(combined, CONTEST_BLACKLIST):
        return False
    if not has_any_kw(t_upper, CONTEST_REQUIRED_TITLE_KEYWORDS):
        return False
    return True


def is_valid_tech_job(title: str, tags_and_cat: str = "") -> bool:
    combined = f"{title} {tags_and_cat}".upper()
    if has_any_kw(combined, JOB_BLACKLIST):
        return False
    if not has_any_kw(combined, JOB_REQUIRED_KEYWORDS):
        return False
    return True


KOFIA_LIST_URL = "https://www.kofia.or.kr/brd/m_96/list.do"
KOFIA_VIEW_URL = "https://www.kofia.or.kr/brd/m_96/view.do?seq={seq}"
KOFIA_SCAN_WINDOW = 120    # 최신 글 번호부터 거꾸로 확인할 최대 개수 (하루 3~5건 기준 약 4주)
KOFIA_MAX_AGE_DAYS = 30    # 등록일이 이보다 오래된 공고가 연속으로 나오면 스캔 종료

# 제목(회사명 괄호 제외)에 있으면 제외할 무관 직무
KOFIA_TITLE_BLACKLIST = [
    "PB", "지점", "영업", "SALES", "연금가입자", "퇴직자", "감사", "준법감시", "컴플라이언스",
    "법무", "변호사", "회계", "세무", "경영관리", "경영지원", "총무", "비서", "인사", "HR",
    "홍보", "마케팅", "결제", "SETTLEMENT", "부동산", "리테일", "콜센터", "고객만족",
    "소비자보호", "CONSUMER PROTECTION", "대체인력", "육아휴직", "운전", "[마감]", "마감]",
]
KOFIA_ENTRY_TITLE_KW = [
    "인턴", "INTERN", "신입", "채용연계", "채용전환", "전환형", "공채", "RA", "주니어", "JUNIOR",
    "졸업예정", "체험형",
]
KOFIA_EXP_TITLE_KW = [
    "경력", "과장", "차장", "부장", "팀장", "본부장", "SR.", "SENIOR", "시니어", "임원", "CIO",
]
# 제목에 연차 표기가 없을 때 본문으로 판단 ("인턴경력" 같은 우대사항 표현은 신입 신호로 보지 않음)
KOFIA_BODY_ENTRY_RE = re.compile(r"신입|인턴(?!\s*(?:경력|경험))|경력\s*무관|졸업\s*예정|채용\s*연계|채용\s*전환")
KOFIA_BODY_EXP_RE = re.compile(
    r"경력\s*\d+\s*년\s*(?:이상|↑)|\d+\s*년\s*이상\s*(?:의\s*)?(?:관련\s*)?(?:업무\s*)?경력|경력직"
)
KOFIA_TARGET_KW = [
    "퀀트", "QUANT", "운용", "파생", "패시브", "ETF", "채권", "주식", "리서치", "애널리스트", "RA",
    "리스크", "위험관리", "트레이딩", "딜링", "S&T", "FICC", "자산배분", "멀티에셋", "대체투자",
    "PE", "IB", "투자", "평가", "상품", "데이터", "AI", "IT", "전산", "디지털", "개발", "시스템",
    "보안", "정보보호", "알고리즘", "금융공학",
]


def _kofia_title_core(title: str) -> str:
    """'[회사명] 직무 ...' 형태에서 회사명 괄호를 떼어 직무 부분만 남김 (예: '[DS투자증권]'의 '투자' 오탐 방지)"""
    return re.sub(r"^\s*(?:\[마감\]\s*)?\[[^\]]*\]\s*", "", title).strip()


def is_valid_kofia_posting(title: str, body: str) -> bool:
    """
    금융투자협회(KOFIA) 회원사 공고 필터링 (제목 기준, 본문은 연차 판단에만 사용)
    1) 영업·PB·감사·회계·인사 등 무관 직무, 대체인력, 마감 표기 제외
    2) 제목에 인턴/신입 신호가 있으면 허용, 경력만 있으면 제외
    3) 제목에 연차 표기가 없으면 본문에 신입 신호가 있고 경력 요건이 없으며, 직무가 운용·리서치·IT 등일 때만 허용
    """
    if "[마감]" in title:
        return False
    core_upper = _kofia_title_core(title).upper()
    if has_any_kw(core_upper, KOFIA_TITLE_BLACKLIST):
        return False

    title_entry = has_any_kw(core_upper, KOFIA_ENTRY_TITLE_KW)
    title_exp = has_any_kw(core_upper, KOFIA_EXP_TITLE_KW)
    if title_entry:
        return True
    if title_exp:
        return False

    body_entry = bool(KOFIA_BODY_ENTRY_RE.search(body))
    body_exp = bool(KOFIA_BODY_EXP_RE.search(body))
    return body_entry and not body_exp and has_any_kw(core_upper, KOFIA_TARGET_KW)


def infer_kofia_tags(title: str, content: str) -> List[str]:
    tags: List[str] = ["금융권"]
    core_upper = _kofia_title_core(title).upper()
    body_upper = content.upper()

    if has_any_kw(core_upper, ["인턴", "INTERN", "체험형"]):
        tags.append("인턴")
    if has_any_kw(core_upper, ["신입", "공채", "채용연계", "채용전환", "전환형"]):
        tags.append("신입")
    if not any(t in tags for t in ["인턴", "신입"]) and KOFIA_BODY_ENTRY_RE.search(content):
        tags.append("신입 가능")
    if has_any_kw(core_upper, ["퀀트", "QUANT", "파생", "패시브", "ETF", "알고리즘", "금융공학"]):
        tags.append("퀀트/파생")
    if has_any_kw(core_upper, ["운용", "주식", "채권", "리서치", "애널리스트", "RA", "평가", "자산배분", "멀티에셋", "PE"]):
        tags.append("운용/리서치")
    if has_any_kw(core_upper, ["IT", "전산", "개발", "SW", "시스템", "보안", "정보보호"]):
        tags.append("금융IT/보안")
    if has_any_kw(core_upper, ["AI", "인공지능", "데이터", "디지털"]) or has_any_kw(body_upper, ["머신러닝", "데이터 분석"]):
        tags.append("AI/데이터")

    return tags[:5]


def _kofia_field(page_html: str, label: str) -> str:
    m = re.search(rf"<th[^>]*>\s*{label}\s*</th>\s*<td[^>]*>(.*?)</td>", page_html, re.S)
    return clean_html_text(m.group(1)) if m else ""


def _kofia_detail(seq: int) -> Optional[Dict[str, Any]]:
    """상세 페이지 1건 파싱. 글이 없거나(삭제·다른 게시판) 제목을 못 읽으면 None"""
    page_html, complete = fetch_complete(KOFIA_VIEW_URL.format(seq=seq), tries=3, timeout=10)
    title = _kofia_field(page_html, "제목")
    if not title:
        return {"_missing": True, "_complete": complete} if page_html else None
    reg = _kofia_field(page_html, "등록일")
    period = _kofia_field(page_html, "접수기간")
    body_match = re.search(r'<div id="write"[^>]*>(.*?)</div>', page_html, re.S)
    body = clean_html_text(body_match.group(1)) if body_match else ""
    return {
        "seq": seq,
        "title": re.sub(r"\s*new$", "", title, flags=re.I).strip(),
        "company": _kofia_field(page_html, "회원사명"),
        "reg_date": reg[:10] if re.match(r"^\d{4}-\d{2}-\d{2}", reg) else "",
        "period": period,
        "body": body,
        "_complete": complete,
    }


def _kofia_seed_seq(prev_items: List[Dict[str, Any]]) -> Optional[int]:
    """목록 페이지(일부가 잘려도 남은 부분)와 이전 수집 결과에서 가장 큰 글 번호를 찾음"""
    seqs: List[int] = []
    urls = [f"{KOFIA_LIST_URL}?page={p}" for p in (1, 2, 3)] + [
        f"{KOFIA_LIST_URL}?srchTp=0&srchWord={urllib.parse.quote(w)}" for w in ["신입", "인턴", "운용"]
    ]
    for url in urls:
        page_html, _ = fetch_complete(url, tries=2, timeout=10)
        seqs.extend(int(s) for s in re.findall(r"view\.do\?seq=(\d+)", page_html))
    for item in prev_items:
        m = re.match(r"^kofia-(\d+)$", str(item.get("id", "")))
        if m:
            seqs.append(int(m.group(1)))
    return max(seqs) if seqs else None


def crawl_kofia(prev_items: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
    """
    금융투자협회 회원사 채용안내 (https://www.kofia.or.kr/brd/m_96/list.do) 수집
    - 목록 페이지는 특정 공고가 포함되면 서버가 HTML을 중간에 끊어 보내는 문제가 있어(목록 표가 통째로 누락),
      최신 글 번호를 찾은 뒤 상세 페이지(view.do?seq=)를 번호 역순으로 직접 훑는다.
    - 상세 페이지도 가끔 잘려 오므로 완결될 때까지 재시도한다.
    - 수집이 대부분 실패하면 이전 결과 중 마감 전 공고를 유지한다.
    """
    print("[1/6] 금융투자협회(KOFIA) 회원사 증권·운용·금융IT 신입/인턴 공고 수집 중...")
    prev_kofia = [i for i in (prev_items or []) if i.get("source") == "금융투자협회(KOFIA)"]
    results: List[Dict[str, Any]] = []

    seed = _kofia_seed_seq(prev_kofia)
    if seed is None:
        print("  - KOFIA 최신 글 번호를 찾지 못했습니다. 이전 수집 결과를 유지합니다.")
        return _kofia_carry_over(prev_kofia)

    # 시드보다 새 글이 있는지 위로 확인 (빈 번호 5개 연속이면 중단)
    top, misses, probe = seed, 0, seed + 1
    while misses < 5 and probe <= seed + 60:
        d = _kofia_detail(probe)
        if d and not d.get("_missing"):
            top, misses = probe, 0
        else:
            misses += 1
        probe += 1
        time.sleep(0.15)

    fetched = truncated = failed = 0
    old_streak = 0
    for seq in range(top, top - KOFIA_SCAN_WINDOW, -1):
        d = _kofia_detail(seq)
        time.sleep(0.15)
        if d is None:
            failed += 1
            continue
        if d.get("_missing"):
            continue
        fetched += 1
        if not d["_complete"]:
            truncated += 1

        reg_date = d["reg_date"] or TODAY_STR
        try:
            age = (NOW.date() - datetime.date.fromisoformat(reg_date)).days
        except ValueError:
            age = 0
        if age > KOFIA_MAX_AGE_DAYS:
            old_streak += 1
            if old_streak >= 3:
                break
            continue
        old_streak = 0

        title, company, body = d["title"], d["company"], d["body"]
        if not is_valid_kofia_posting(title, body):
            continue

        start_date = reg_date
        deadline: Optional[str] = None
        is_always_open = any(k in f"{title} {d['period']}" for k in ["상시", "수시", "채용 시", "채용시"])
        period_match = re.search(r"(\d{8})\s*~\s*(\d{8})", d["period"])
        if period_match:
            s_raw, e_raw = period_match.group(1), period_match.group(2)
            start_date = f"{s_raw[:4]}-{s_raw[4:6]}-{s_raw[6:8]}"
            deadline = f"{e_raw[:4]}-{e_raw[4:6]}-{e_raw[6:8]}"
            try:
                if datetime.date.fromisoformat(deadline) < NOW.date():
                    continue
            except ValueError:
                deadline = None
        if not deadline and not is_always_open:
            # 접수기간이 없으면 등록일 기준 2주를 임시 마감으로 표시
            try:
                guess = datetime.date.fromisoformat(reg_date) + datetime.timedelta(days=14)
                if guess < NOW.date():
                    continue
                deadline = guess.isoformat()
            except ValueError:
                is_always_open = True

        summary_text = body[:220] + ("..." if len(body) > 220 else "") if len(body) > 15 else f"{company} 채용 공고 ({title})"
        tags = infer_kofia_tags(title, body)
        results.append({
            "id": f"kofia-{d['seq']}",
            "title": title,
            "organization": company or "금융투자협회 회원사",
            "category": "kofia",
            "source": "금융투자협회(KOFIA)",
            "sourceUrl": KOFIA_VIEW_URL.format(seq=d["seq"]),
            "startDate": start_date,
            "deadline": deadline,
            "isAlwaysOpen": is_always_open,
            "tags": tags,
            "location": "서울",
            "reward": "인턴십" if "인턴" in tags else "신입/인턴 채용",
            "summary": summary_text,
            "isFeatured": True,
        })

    print(
        f"  -> 글 번호 {top}부터 상세 {fetched}건 확인 (잘린 응답 {truncated}건, 조회 실패 {failed}건) "
        f"→ 신입/인턴 공고 {len(results)}건 선별"
    )
    if fetched == 0 or failed > fetched:
        print("  - KOFIA 조회 실패가 많아 이전 수집 결과 중 마감 전 공고를 함께 유지합니다.")
        kept_ids = {r["id"] for r in results}
        results.extend(i for i in _kofia_carry_over(prev_kofia) if i["id"] not in kept_ids)
    return results


def _kofia_carry_over(prev_kofia: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    kept = []
    for item in prev_kofia:
        dl = item.get("deadline")
        try:
            if dl and datetime.date.fromisoformat(dl[:10]) < NOW.date():
                continue
        except ValueError:
            pass
        if is_valid_kofia_posting(item.get("title", ""), item.get("summary", "")):
            kept.append(item)
    return kept


# ==============================================================================
# 금융사 채용: 채용 플랫폼(recruiter.co.kr) 사용 은행·증권사 + 공공기관 채용정보(ALIO, 국책은행·금융공기업)
#              + 토스 채용(토스뱅크·토스증권)
# ==============================================================================

# recruiter.co.kr 서브도메인 → 회사명 (회사명을 확인한 계정만 등록. 공고가 없으면 0건으로 지나감)
BANK_RECRUITER_SITES = {
    "shinhan": "신한은행",
    "hanabank": "하나은행",
    "wooribank": "우리은행",
    "kbstar": "KB국민은행",
    "nhbank": "NH농협은행",
    "kakaobank": "카카오뱅크",
    "kbank": "케이뱅크",
    "busanbank": "부산은행",
    "knbank": "경남은행",
    "jbbank": "전북은행",
    "jejubank": "제주은행",
    # 증권사
    "nhqv": "NH투자증권",
    "kbsec": "KB증권",
    "miraeasset": "미래에셋",
    "daishin": "대신증권",
    "hmsec": "현대차증권",
    "iprovest": "교보증권",
    "ls-sec": "LS증권",
    "sks": "SK증권",
}
# ALIO 검색어: 국책은행은 '은행'으로, 금융공기업은 기관명으로 검색
ALIO_FINANCE_KEYWORDS = [
    "은행", "예금보험공사", "기술보증기금", "신용보증기금", "예탁결제원", "자산관리공사", "주택금융공사",
    "한국투자공사", "서민금융진흥원", "증권금융", "한국거래소", "코스콤",
]
ALIO_FINANCE_ORGS = [k for k in ALIO_FINANCE_KEYWORDS if k != "은행"]
RECRUITER_JOBFLEX_API = "https://api-recruiter.recruiter.co.kr/position/v1/jobflex"
ALIO_RECRUIT_URL = "https://job.alio.go.kr/recruit.do"
TOSS_JOBS_API = "https://api-public.toss.im/api/v3/ipd-eggnog/career/jobs"
TOSS_FINANCE_SUBSIDIARIES = ["토스뱅크", "토스증권"]

BANK_SOURCE = "금융사 채용사이트"
ALIO_SOURCE = "공공기관 채용(ALIO)"

# 신입·인턴 신호 (제목 기준)
ENTRY_SIGNAL_RE = re.compile(
    r"인턴|신입|체험형|채용연계|채용형|공채|청년|졸업|주니어|\b(?:INTERN|INTERNSHIP|JUNIOR|NEW\s?GRAD|ENTRY[- ]LEVEL)\b",
    re.I,
)


def has_entry_signal(text: str) -> bool:
    """신입·인턴 신호. 영문은 단어 경계로만 인식 ('Internal'의 intern 오탐 방지)"""
    return bool(ENTRY_SIGNAL_RE.search(text))


BANK_ENTRY_TITLE_KW = [
    "신입", "인턴", "INTERN", "체험형", "채용연계", "채용형", "신입행원", "공채", "청년", "졸업",
    "주니어", "JUNIOR", "NEW GRAD",
]
# 은행 공고 중 제외할 직무 (창구·텔러·콜센터·감사·인사 등)
BANK_ROLE_BLACKLIST = [
    "창구", "텔러", "사무행원", "업무지원계약", "인재풀", "콜센터", "고객상담", "CS", "소비자보호", "감사",
    "인재영입", "HR", "인사", "회계", "세무", "법무", "변호사", "기록연구", "운전", "경비", "청원", "시설",
    "대체인력", "대체채용", "육아휴직", "사서", "간호", "보훈", "장애인", "상담",
]
# recruiter.co.kr 신버전 careerType → 표시용 라벨 (CAREER는 제목에 신입·인턴 표시가 있을 때만 허용)
RECRUITER_CAREER_LABELS = {
    "NEW": "신입",
    "INTERNSHIP": "인턴",
    "NEW_CAREER": "신입/경력",
    "ANY": "경력무관",
    "FIELD_DIFFERENCE": "분야별 상이",
    "CAREER": "경력",
    "NONE": "",
}


# 제목에 경력직만 명시된 공고 (사이트의 신입/경력 값이 잘못 입력된 경우 대비)
BANK_EXP_ONLY_TITLE_KW = ["경력직", "경력 채용", "경력채용", "경력사원", "전문경력"]


def _bank_role_ok(title: str) -> bool:
    t_upper = title.upper()
    if has_any_kw(t_upper, BANK_EXP_ONLY_TITLE_KW) and not has_any_kw(t_upper, ["신입", "인턴", "INTERN"]):
        return False
    return not has_any_kw(t_upper, BANK_ROLE_BLACKLIST)


def _bank_item(item_id: str, title: str, bank: str, source: str, url: str, start: str,
               deadline: Optional[str], always_open: bool, career_label: str,
               org_tag: Optional[str] = None) -> Dict[str, Any]:
    if org_tag:
        pass
    elif any(k in bank for k in ["은행", "뱅크"]):
        org_tag = "은행"
    elif source == ALIO_SOURCE:
        org_tag = "금융공기업"
    else:
        org_tag = "증권"
    tags = ["금융권", org_tag]
    if career_label:
        tags.append(career_label)
    for kw, tag in [("인턴", "인턴"), ("체험형", "체험형"), ("채용연계", "채용연계형"), ("IT", "금융IT"), ("디지털", "디지털"),
                    ("데이터", "AI/데이터"), ("AI", "AI/데이터"), ("투자", "투자/IB"), ("IB", "투자/IB")]:
        if has_any_kw(title.upper(), [kw]) and tag not in tags:
            tags.append(tag)
    return {
        "id": item_id,
        "title": title if bank in title else f"[{bank}] {title}",
        "organization": bank,
        "category": "kofia",
        "source": source,
        "sourceUrl": url,
        "startDate": start or TODAY_STR,
        "deadline": deadline,
        "isAlwaysOpen": always_open,
        "tags": tags[:5],
        "location": "국내",
        "reward": f"{org_tag} 채용",
        "summary": f"{bank} | {title}" + (f" | {career_label}" if career_label else ""),
        "isFeatured": True,
    }


def _recruiter_jobflex(sub: str, bank: str) -> Optional[List[Dict[str, Any]]]:
    """신버전 채용 사이트 API. 해당 은행이 신버전을 쓰지 않으면 None"""
    body = json.dumps({"pageableRq": {"page": 1, "size": 100}, "filter": {}}).encode("utf-8")
    req = urllib.request.Request(
        RECRUITER_JOBFLEX_API,
        data=body,
        headers={"Content-Type": "application/json", "User-Agent": USER_AGENT, "prefix": f"{sub}.recruiter.co.kr"},
    )
    try:
        with urllib.request.urlopen(req, context=SSL_CTX, timeout=15) as resp:
            payload = json.loads(resp.read().decode("utf-8", errors="ignore"))
    except Exception:
        return None
    if "list" not in payload:
        return None

    items = []
    for pos in payload.get("list") or []:
        title = (pos.get("title") or "").strip()
        sn = pos.get("positionSn")
        if not title or not sn or pos.get("submissionStatus") == "POST_SUBMISSION":
            continue
        end = (pos.get("endDateTime") or "")[:10]
        if end:
            try:
                if datetime.date.fromisoformat(end) < NOW.date():
                    continue
            except ValueError:
                end = ""
        career = pos.get("careerType") or "NONE"
        title_entry = has_entry_signal(title)
        if career == "CAREER" and not title_entry:
            continue
        if career == "NONE" and not title_entry:
            continue
        if not _bank_role_ok(title):
            continue
        items.append(_bank_item(
            f"recruiter-{sub}-{sn}", title, bank, BANK_SOURCE,
            f"https://{sub}.recruiter.co.kr/career/jobs/{sn}",
            (pos.get("startDateTime") or "")[:10], end or None, not end,
            RECRUITER_CAREER_LABELS.get(career, ""),
        ))
    return items


def _recruiter_appsite(sub: str, bank: str) -> List[Dict[str, Any]]:
    """구버전 채용 사이트 API (신입/경력 구분이 없어 제목의 신입·인턴 신호로만 판단)"""
    req = urllib.request.Request(
        f"https://{sub}.recruiter.co.kr/app/jobnotice/list.json",
        data=b"pageSize=100&currentPage=1&jobnoticeStateCode=10",
        headers={
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "User-Agent": USER_AGENT,
        },
    )
    with urllib.request.urlopen(req, context=SSL_CTX, timeout=15) as resp:
        payload = json.loads(resp.read().decode("utf-8", errors="ignore"))

    items = []
    for notice in payload.get("list") or []:
        title = (notice.get("jobnoticeName") or "").strip()
        sn = notice.get("jobnoticeSn")
        if not title or not sn or notice.get("receiptState") not in ("접수중", "접수예정"):
            continue
        if not has_entry_signal(title) or not _bank_role_ok(title):
            continue

        def ms_to_date(v: Any) -> str:
            try:
                return datetime.datetime.fromtimestamp(int(v["time"]) / 1000.0, tz=KST).strftime("%Y-%m-%d")
            except Exception:
                return ""

        end = ms_to_date(notice.get("applyEndDate"))
        always = notice.get("recruitTypeCode") == "PERMANENT" or not end
        items.append(_bank_item(
            f"recruiter-{sub}-{sn}", title, bank, BANK_SOURCE,
            f"https://{sub}.recruiter.co.kr/app/jobnotice/view?systemKindCode={notice.get('systemKindCode') or 'MRS2'}&jobnoticeSn={sn}",
            ms_to_date(notice.get("applyStartDate")), None if always else end, always, "",
        ))
    return items


def _alio_finance() -> List[Dict[str, Any]]:
    """공공기관 채용정보(ALIO)에서 진행 중인 국책은행(IBK기업·KDB산업·한국수출입은행 등)·금융공기업 신입/인턴 공고"""
    org_alias = {"중소기업은행": "IBK기업은행"}
    rows: List[str] = []
    for keyword in ALIO_FINANCE_KEYWORDS:
        params = urllib.parse.urlencode({"ing": 2, "pageSet": 50, "keyword": keyword})
        try:
            rows.extend(re.findall(r"<tr[^>]*>(.*?)</tr>", fetch_text(f"{ALIO_RECRUIT_URL}?{params}", timeout=20), re.S))
        except Exception as e:
            print(f"  - ALIO 검색 오류 ({keyword}): {e}")
        time.sleep(0.2)
    items: List[Dict[str, Any]] = []
    seen_idx = set()
    for row in rows:
        m = re.search(r"recruitview\.do\?idx=(\d+)", row)
        if not m or m.group(1) in seen_idx:
            continue
        seen_idx.add(m.group(1))
        raw_tds = re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)
        title_idx = next((k for k, td in enumerate(raw_tds) if "recruitview.do" in td), None)
        tds = [clean_html_text(td) for td in raw_tds]
        if title_idx is None or len(tds) < title_idx + 7:
            continue
        # 제목 칸 기준: [제목, 기관, 근무지, 고용형태, 등록일, 마감(예: 26.11.23 D-12), 상태]
        title, org, _loc, emp_type, reg, close, status = tds[title_idx:title_idx + 7]
        if not ("은행" in org or any(k in org for k in ALIO_FINANCE_ORGS)) or "마감" in status:
            continue
        if not has_entry_signal(f"{title} {emp_type}") or not _bank_role_ok(title):
            continue
        bank = org_alias.get(org, org)
        dm = re.search(r"(\d{2})\.(\d{2})\.(\d{2})", close)
        deadline = f"20{dm.group(1)}-{dm.group(2)}-{dm.group(3)}" if dm else None
        rm = re.search(r"(\d{4})\.(\d{2})\.(\d{2})", reg)
        start = f"{rm.group(1)}-{rm.group(2)}-{rm.group(3)}" if rm else TODAY_STR
        career_label = "인턴" if "인턴" in emp_type else ("신입" if "신입" in title else "")
        items.append(_bank_item(
            f"alio-{m.group(1)}", title, bank, ALIO_SOURCE,
            f"https://job.alio.go.kr/recruitview.do?idx={m.group(1)}",
            start, deadline, deadline is None, career_label,
        ))
    return items


# 토스 계열사 중 금융권 탭으로 보낼 비개발 직무 (그 외 비개발·상담 직무는 제외)
TOSS_FINANCE_ROLE_KW = ["TREASURY", "RISK", "리스크", "트레이딩", "TRADING", "자금", "퀀트", "QUANT", "투자"]
TOSS_SOURCE = "토스 채용"


def _toss_jobs() -> List[Dict[str, Any]]:
    """
    토스 통합 채용의 신입·인턴·주니어 공고
    - 토스뱅크·토스증권: 금융권 탭
    - 그 외 계열사: 개발 직무는 IT 탭, Treasury·리스크 등 금융 직무는 금융권 탭, 나머지(상담·운영 등)는 제외
    """
    payload = json.loads(fetch_text(TOSS_JOBS_API, timeout=20))
    sub_key = "포지션의 소속 자회사를 선택해 주세요."
    items = []
    for job in payload.get("success") or []:
        meta = {m.get("name"): m.get("value") for m in job.get("metadata") or []}
        company = str(meta.get(sub_key) or "토스")
        title = (job.get("title") or "").strip()
        emp = str(meta.get("Employment_Type") or "")
        if not has_entry_signal(f"{title} {emp}") or not _bank_role_ok(title):
            continue
        deadline = (job.get("application_deadline") or "")[:10] or None
        url = job.get("absolute_url") or "https://toss.im/career"
        start = (job.get("first_published") or "")[:10]
        label = "인턴" if "인턴" in emp or re.search(r"인턴|\bINTERN", title, re.I) else (
            "주니어" if has_entry_signal(title) and re.search(r"주니어|JUNIOR", title, re.I) else "신입")
        item_id = f"toss-{job.get('id')}"
        if company in TOSS_FINANCE_SUBSIDIARIES:
            items.append(_bank_item(item_id, title, company, BANK_SOURCE, url, start, deadline, deadline is None, label))
        elif is_valid_dev_title(title):
            items.append(_dev_item(item_id, title, company, TOSS_SOURCE, url, deadline, label, "판교/서울"))
        elif has_any_kw(title.upper(), TOSS_FINANCE_ROLE_KW):
            items.append(_bank_item(item_id, title, company, TOSS_SOURCE, url, start, deadline, deadline is None,
                                    label, org_tag="핀테크"))
    return items


def crawl_banks() -> List[Dict[str, Any]]:
    print("[2/6] 은행·증권사 채용사이트, ALIO(국책은행·금융공기업), 토스 신입/인턴 공고 수집 중...")
    results: List[Dict[str, Any]] = []
    per_bank: Dict[str, int] = {}

    for sub, bank in BANK_RECRUITER_SITES.items():
        try:
            items = _recruiter_jobflex(sub, bank)
            if items is None:
                items = _recruiter_appsite(sub, bank)
        except Exception as e:
            print(f"  - {bank} 채용사이트 조회 오류: {e}")
            continue
        results.extend(items)
        per_bank[bank] = len(items)
        time.sleep(0.2)

    for label, fn in [("ALIO", _alio_finance), ("토스", _toss_jobs)]:
        try:
            items = fn()
            results.extend(items)
            per_bank[label] = len(items)
        except Exception as e:
            print(f"  - {label} 조회 오류: {e}")

    found = ", ".join(f"{k} {v}" for k, v in per_bank.items() if v)
    print(f"  -> 은행·증권·금융공기업·토스 신입/인턴 공고 {len(results)}건 선별 완료" + (f" ({found})" if found else ""))
    return results


# ==============================================================================
# 개발 직무 공통 헬퍼 (토스·사람인 수집에서 사용)
# ==============================================================================
# 개발 직무 판정: 기존 IT 필수 키워드 + 일반 개발 직무명
DEV_TITLE_KW = JOB_REQUIRED_KEYWORDS + [
    "개발자", "개발", "엔지니어", "ENGINEER", "DEVELOPER", "플랫폼", "PLATFORM", "인프라", "INFRA", "DEVOPS",
    "연구원", "RESEARCH", "SCIENTIST",
]
DEV_TITLE_BLACKLIST = JOB_BLACKLIST + ["SEO", "QA", "테스터", "디자인", "기획자", "상담", "CS"]
FINANCE_TECH_TITLE_KW = ["퀀트", "QUANT", "트레이딩", "TRADING", "증권", "자산운용", "금융공학", "알고리즘 트레이딩"]


def is_valid_dev_title(title: str) -> bool:
    t_upper = title.upper()
    return has_any_kw(t_upper, DEV_TITLE_KW) and not has_any_kw(t_upper, DEV_TITLE_BLACKLIST)


def _dev_item(item_id: str, title: str, company: str, source: str, url: str, deadline: Optional[str],
              entry_label: str, location: str, extra_tags: Optional[List[str]] = None) -> Dict[str, Any]:
    """개발 직군 공고 공통 형식. 퀀트·트레이딩 직무는 금융권 탭으로 보냄"""
    t_upper = title.upper()
    is_finance = has_any_kw(t_upper, FINANCE_TECH_TITLE_KW)
    tags = (["금융권", "퀀트/트레이딩"] if is_finance else []) + ([entry_label] if entry_label else [])
    for kw_list, tag in [
        (["AI", "ML", "머신러닝", "딥러닝", "LLM", "데이터", "DATA"], "AI/데이터"),
        (["백엔드", "BACKEND", "BACK-END", "서버", "SERVER"], "백엔드"),
        (["플랫폼", "PLATFORM", "인프라", "INFRA", "DEVOPS", "클라우드", "CLOUD", "SRE"], "인프라/플랫폼"),
        (["보안", "SECURITY"], "보안"),
    ]:
        if has_any_kw(t_upper, kw_list) and tag not in tags:
            tags.append(tag)
    for tag in extra_tags or []:
        if tag and tag not in tags:
            tags.append(tag)
    return {
        "id": item_id,
        "title": title,
        "organization": company,
        "category": "kofia" if is_finance else "intern",
        "source": source,
        "sourceUrl": url,
        "startDate": TODAY_STR,
        "deadline": deadline,
        "isAlwaysOpen": deadline is None,
        "tags": tags[:5],
        "location": location or "국내",
        "reward": "금융권 채용" if is_finance else "인턴/신입",
        "summary": f"{company} | {title}" + (f" | {entry_label}" if entry_label else ""),
        "isFeatured": True,
    }


def crawl_jumpit() -> List[Dict[str, Any]]:
    """점핏 (Jumpit) 백엔드·AI·데이터·금융IT 신입/인턴 포지션만 엄선 수집"""
    print("[3/6] 점핏(Jumpit) AI·데이터·백엔드 신입/인턴 채용 공고 수집 중...")
    results: List[Dict[str, Any]] = []
    try:
        for page in [1, 2, 3, 4]:
            url = f"https://api.jumpit.co.kr/api/positions?page={page}&sort=reg_dt&career=0"
            raw = fetch_text(url, timeout=10)
            data = json.loads(raw)
            positions = data.get("result", {}).get("positions", [])
            for pos in positions:
                pos_id = pos.get("id")
                title = pos.get("title", "").strip()
                company = pos.get("companyName", "").strip()
                if not pos_id or not title:
                    continue

                tech_stacks = pos.get("techStacks") or []
                job_cat = [c.strip() for c in (pos.get("jobCategory") or "").split(",") if c.strip()]
                combined_meta = f"{company} {' '.join(job_cat)} {' '.join(tech_stacks)}"

                if not is_valid_tech_job(title, combined_meta):
                    continue

                closed_at = pos.get("closedAt") or ""
                deadline = closed_at[:10] if len(closed_at) >= 10 else None
                always_open = bool(pos.get("alwaysOpen", False))

                # 접수 기한이 오늘 이전이면 이미 마감된 공고
                if deadline and not always_open:
                    try:
                        if datetime.date.fromisoformat(deadline) < NOW.date():
                            continue
                    except ValueError:
                        pass
                locations = pos.get("locations") or ["서울"]

                tags = ["신입/인턴"] + job_cat[:2] + tech_stacks[:3]
                dedup_tags = []
                for t in tags:
                    if t and t not in dedup_tags:
                        dedup_tags.append(t)

                results.append({
                    "id": f"jumpit-{pos_id}",
                    "title": title,
                    "organization": company,
                    "category": "intern",
                    "source": "점핏(Jumpit)",
                    "sourceUrl": f"https://jumpit.saramin.co.kr/position/{pos_id}",
                    "startDate": TODAY_STR,
                    "deadline": deadline,
                    "isAlwaysOpen": always_open,
                    "tags": dedup_tags[:5],
                    "location": ", ".join(locations[:2]),
                    "reward": "IT 신입/인턴",
                    "summary": f"{company} | {title} | 기술스택: {', '.join(tech_stacks) if tech_stacks else 'Python/AI/백엔드'}",
                    "isFeatured": True,
                })
    except Exception as e:
        print(f"  - Jumpit 수집 오류: {e}")

    print(f"  -> Jumpit 맞춤형 공고 {len(results[:15])}건 선별 완료")
    return results[:15]


def crawl_wevity() -> List[Dict[str, Any]]:
    """위비티 (Wevity) 실제 AI · 데이터 분석 · SW 개발 해커톤/경진대회만 선별 수집"""
    print("[6/6] 위비티(Wevity) AI·데이터·SW 개발 해커톤/공모전 수집 중...")
    results: List[Dict[str, Any]] = []
    seen_ix = set()

    for cidx in [20, 21]:
        url = f"https://www.wevity.com/?c=find&s=1&gub=1&cidx={cidx}"
        try:
            page_html = fetch_text(url, timeout=10)
            ul_match = re.search(r"<ul class=\"list\"[^>]*>(.*?)</ul>", page_html, re.S)
            if not ul_match:
                continue
            items = re.findall(r"<li[^>]*>(.*?)</li>", ul_match.group(1), re.S)
            for item in items:
                if "class=\"top\"" in item:
                    continue
                link_match = re.search(r"<a href=\"(\?c=find[^\"]*ix=(\d+)[^\"]*)\"[^>]*>(.*?)</a>", item, re.S)
                if not link_match:
                    continue
                rel_href, ix, raw_title = link_match.group(1), link_match.group(2), link_match.group(3)
                if ix in seen_ix:
                    continue
                seen_ix.add(ix)

                raw_title = re.sub(r"<span[^>]*>.*?</span>", "", raw_title, flags=re.S)
                title = clean_html_text(raw_title)

                organ_match = re.search(r"<div class=\"organ\"[^>]*>(.*?)</div>", item, re.S)
                organ = clean_html_text(organ_match.group(1)) if organ_match else "주최사"

                sub_match = re.search(r"<div class=\"sub-tit\"[^>]*>(.*?)</div>", item, re.S)
                sub_tit = clean_html_text(sub_match.group(1)).replace("분야 :", "").strip() if sub_match else "웹/모바일/IT"

                if not is_valid_contest_or_hackathon(title, f"{organ} {sub_tit}"):
                    continue

                day_match = re.search(r"<div class=\"day\"[^>]*>(.*?)</div>", item, re.S)
                day_text = clean_html_text(day_match.group(1)) if day_match else ""

                # 이미 접수마감/종료된 대회는 제외 (대회 본선 기간이 남아있어도 신청 기한 지난 것 방지)
                if any(k in day_text for k in ["마감", "종료", "발표", "종결"]):
                    continue

                dday_num_match = re.search(r"D-(\d+)", day_text)
                if dday_num_match:
                    days_left = int(dday_num_match.group(1))
                    deadline = (NOW.date() + datetime.timedelta(days=days_left)).isoformat()
                elif "D-Day" in day_text or "오늘마감" in day_text:
                    deadline = TODAY_STR
                else:
                    continue

                tags = ["해커톤/경진대회", "AI/데이터", "SW개발"]
                results.append({
                    "id": f"wevity-{ix}",
                    "title": title,
                    "organization": organ,
                    "category": "hackathon",
                    "source": "위비티(Wevity)",
                    "sourceUrl": f"https://www.wevity.com/{html.unescape(rel_href)}",
                    "startDate": TODAY_STR,
                    "deadline": deadline,
                    "isAlwaysOpen": False,
                    "tags": tags,
                    "location": "온/오프라인",
                    "reward": "시상금 및 상장",
                    "summary": f"{organ} 주최 | {title}",
                    "isFeatured": True,
                })
        except Exception as e:
            print(f"  - Wevity 수집 오류 (cidx={cidx}): {e}")

    print(f"  -> Wevity 맞춤형 해커톤/공모전 {len(results)}건 선별 완료")
    return results


# 링커리어 직무 카테고리 ID (list/recruit 페이지 Apollo State에서 확인)
LINKAREER_CAT_IT = "100003"       # IT/개발
LINKAREER_CAT_FINANCE = "100008"  # 금융 (자산운용/펀드, 재무 등)

# 링커리어 금융 카테고리 중 사용자와 무관한 세부 직무 제외용 (조직명 제외 제목 기준 검사하여 회계법인의 AI연구소 오탐 방지)
LINKAREER_FINANCE_BLACKLIST = [
    "회계감사", "감사지원", "회계업무", "재무회계", "세무회계", "회계아웃소싱", "펀드회계",
    "사업비정산", "세무", "결산", "재무제표", "매입", "GA채널", "보험영업", "영업지원",
    "대출", "여신", "수납", "텔러", "창구", "콜센터", "채권추심", "PAYROLL",
]

# 링커리어 채용 공고 중 일반 공채/행정직·비개발 직무 제외
LINKAREER_RECRUIT_BLACKLIST = [
    "직원 채용", "정기 채용", "정기채용", "공개채용", "신규직원", "정규직 직원", "임용", "정직원(",
    "경영행정", "일반행정", "사무", "애니메이션", "콘텐츠 AI 제작", "AI콘텐츠", "콘텐츠 제작",
    "캐릭터", "일러스트", "크리에이터", "박사", "AML", "PM/PO", "기획자", "기획 담당",
    "보육", "계리", "사업 담당", "커뮤니케이션", "COMMUNICATION", "유료화 기획",
    "UX 리서치", "UX RESEARCH", "프로덕트 디자인", "PRODUCT DESIGN", "기업지배구조",
    "SUSTAINABILITY", "HEALTHCARE PRACTICE", "PROJECT ASSISTANT", "현장 엔지니어",
]

# 제목에 하나라도 있어야 하는 링커리어 채용 키워드 (카테고리 태그만으로는 통과 불가)
LINKAREER_TITLE_REQUIRED = [
    "개발", "엔지니어", "ENGINEER", "ENGINEERING", "데이터", "DATA", "AI", "GENAI", "ML", "머신러닝",
    "멀티모달", "MULTIMODAL", "백엔드", "BACK-END", "BACKEND", "서버", "프론트엔드", "웹", "SW", "소프트웨어",
    "퀀트", "QUANT", "운용", "애널리스트", "ANALYST", "리서치", "RESEARCH", "연구",
    "투자", "트레이딩", "TRADING", "PRIVATE EQUITY", "PE", "IB", "FINANCIAL MARKETS",
    "DATABASE", "인프라", "클라우드", "보안", "SECURITY",
]

# 금융기관 판별(기관명 기준). 금융기관의 신입 공채·체험형 인턴은 행정직 공채 블랙리스트에서 예외로 두고 '금융권' 탭으로 분류
FINANCE_ORG_KEYWORDS = [
    "증권", "자산운용", "투자자문", "운용사", "은행", "카카오뱅크", "케이뱅크", "토스뱅크", "캐피탈", "금융",
    "거래소", "예탁결제원", "신용평가", "자산평가", "채권평가", "선물", "외국환중개", "인베스트먼트",
    "SECURITIES", "ASSET MANAGEMENT", "CAPITAL MARKETS", "INVESTMENT",
]
FINANCE_ROLE_BLACKLIST = [
    "영업", "SALES", "마케터", "마케팅", "MARKETER", "고객상담", "CS", "콜센터", "인재영입", "HR", "인사",
    "계리", "회계", "세무", "총무", "디자인", "디자이너", "사업개발", "BUSINESS DEVELOPMENT",
]
FINANCE_ENTRY_TITLE_KW = [
    "공개채용", "공채", "신입", "인턴", "INTERN", "채용형", "체험형", "채용연계", "브로커", "BROKER", "DESK",
    "애널리스트", "ANALYST",
]
FINANCE_NONTARGET_CATS = ["고객상담/CS", "영업", "SNS/콘텐츠마케팅", "인사/채용/노무", "마케팅", "광고"]
FINANCE_TARGET_CATS = [
    "시장조사/리서치", "자산운용/펀드", "증권/투자/애널리스트", "IB/M&A", "데이터분석", "AI/ML엔지니어",
    "시스템/ERP개발", "DevOps/클라우드/보안", "리스크/컴플라이언스", "경영기획/전략",
]
# 행정직 공채 블랙리스트 중 금융기관 공고에는 적용하지 않을 공채 표현
PUBLIC_RECRUIT_TERMS = ["직원 채용", "정기 채용", "정기채용", "공개채용", "신규직원", "정규직 직원", "정직원("]


def _linkareer_query(filter_by: str, page: int, page_size: int) -> List[Dict[str, Any]]:
    query = """
    {
      activities(
        filterBy: %s,
        orderBy: { direction: DESC, field: RECENT },
        pagination: { pageSize: %d, page: %d }
      ) {
        nodes {
          id
          title
          organizationName
          categories { name }
          jobTypes
          recruitCloseAt
        }
      }
    }
    """ % (filter_by, page_size, page)
    req = urllib.request.Request(
        "https://api.linkareer.com/graphql",
        data=json.dumps({"query": query}).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": USER_AGENT},
    )
    with urllib.request.urlopen(req, context=SSL_CTX, timeout=15) as resp:
        payload = json.loads(resp.read().decode("utf-8", errors="ignore"))
    return payload.get("data", {}).get("activities", {}).get("nodes", []) or []


def _linkareer_deadline(close_ts: Any) -> Optional[str]:
    """링커리어의 모집/신청 마감일(recruitCloseAt)을 YYYY-MM-DD로 반환 (이미 지난 날짜는 제외)"""
    if not close_ts:
        return None
    try:
        dt = datetime.datetime.fromtimestamp(int(close_ts) / 1000.0, tz=KST)
        # 대회 종료일이 아닌 '신청/접수 기한' 기준이므로 오늘 이전 마감은 제외
        if dt.date() < NOW.date():
            return None
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return None


def crawl_linkareer() -> List[Dict[str, Any]]:
    """
    링커리어 (Linkareer) GraphQL API 수집 (메인 수집원)
    - 채용: (1) 인턴 전체 최신순 스캔(카테고리 오분류 알짜 공고 포착) + (2) IT/개발·금융 인턴/신입 스캔
    - 공모전/대외활동: 최신 공고 다수 조회 → AI/데이터/금융/해커톤 키워드 필터
    """
    print("[5/6] 링커리어(Linkareer) 인턴·신입·공모전·대외활동 수집 중...")
    results: List[Dict[str, Any]] = []
    seen_ids = set()

    def add_item(node: Dict[str, Any], category: str, badge: str, lead_tag: Optional[str] = None) -> None:
        node_id = node.get("id")
        title = (node.get("title") or "").strip()
        if not node_id or not title or node_id in seen_ids:
            return
        seen_ids.add(node_id)
        org = (node.get("organizationName") or "주최기관").strip()
        cats = [c.get("name", "") for c in (node.get("categories") or []) if c.get("name") and c.get("name") != "전체"]
        job_types = node.get("jobTypes") or []
        close_ts = node.get("recruitCloseAt")
        deadline = _linkareer_deadline(close_ts)
        # 마감 타임스탬프가 명시되어 있는데 이미 지난 날짜인 경우 제외
        if close_ts and not deadline:
            return
        # 공모전/해커톤의 경우 대회 종료일이 아닌 '신청/접수 기한'이 살아있는 공고만 수집
        if category in ["contest", "hackathon"] and not deadline:
            return

        tags: List[str] = []
        if "INTERN" in job_types or "인턴" in title:
            tags.append("인턴")
        if "NEW" in job_types or "신입" in title:
            tags.append("신입")
        if not tags:
            tags.append(badge)
        if lead_tag:
            tags.insert(0, lead_tag)
        for c in cats:
            if c not in tags:
                tags.append(c)

        results.append({
            "id": f"linkareer-{node_id}",
            "title": title,
            "organization": org,
            "category": category,
            "source": "링커리어",
            "sourceUrl": f"https://linkareer.com/activity/{node_id}",
            "startDate": TODAY_STR,
            "deadline": deadline,
            "isAlwaysOpen": deadline is None,
            "tags": tags[:5],
            "location": "국내",
            "reward": badge,
            "summary": f"{org} | {title}" + (f" | 직무: {', '.join(cats)}" if cats else ""),
            "isFeatured": True,
        })

    # 1) 채용 (activityTypeID 5):
    #    - list/intern 전체 최신순(1~6페이지): 인사담당자가 컨설팅/리서치 등으로 분류해 둔 AI·데이터·금융시장 인턴까지 포착
    #    - IT/개발 + 금융 카테고리 [INTERN, NEW](1~4페이지): 신입 및 핵심 직군 포착
    recruit_queries = [
        ('{ status: OPEN, activityTypeID: "5", jobTypes: [INTERN] }', [1, 2, 3, 4, 5, 6]),
        (
            '{ status: OPEN, activityTypeID: "5", '
            f'categoryIDs: ["{LINKAREER_CAT_IT}", "{LINKAREER_CAT_FINANCE}"], '
            "jobTypes: [INTERN, NEW] }",
            [1, 2, 3, 4],
        ),
    ]
    recruit_count = 0
    finance_count = 0
    finance_recruit_bl = [k for k in LINKAREER_RECRUIT_BLACKLIST if k not in PUBLIC_RECRUIT_TERMS]
    for recruit_filter, pages in recruit_queries:
        for page in pages:
            try:
                nodes = _linkareer_query(recruit_filter, page, 50)
            except Exception as e:
                print(f"  - Linkareer 채용 수집 오류 (page={page}): {e}")
                break
            if not nodes:
                break
            for node in nodes:
                title = (node.get("title") or "").strip()
                org = (node.get("organizationName") or "").strip()
                cats = " ".join(c.get("name", "") for c in (node.get("categories") or []))
                t_upper = title.upper()
                title_no_org_upper = title.replace(org, "").upper()

                cat_list = [c.get("name", "") for c in (node.get("categories") or []) if c.get("name") and c.get("name") != "전체"]
                is_fin_markets = "FINANCIAL MARKETS" in t_upper or "S&T" in t_upper

                if has_any_kw(title_no_org_upper, LINKAREER_FINANCE_BLACKLIST):
                    continue

                # 금융기관(증권·운용·은행·거래소 등): 신입 공채·체험형 인턴까지 허용하고 무관 직무·비대상 카테고리만 제외
                if has_any_kw(org.upper(), FINANCE_ORG_KEYWORDS):
                    if has_any_kw(t_upper, finance_recruit_bl):
                        continue
                    role_bl = [k for k in FINANCE_ROLE_BLACKLIST if not (is_fin_markets and k in ("영업", "SALES"))]
                    if has_any_kw(title_no_org_upper, role_bl):
                        continue
                    if any(c in FINANCE_NONTARGET_CATS for c in cat_list) and not any(c in FINANCE_TARGET_CATS for c in cat_list):
                        continue
                    if not (has_any_kw(title_no_org_upper, LINKAREER_TITLE_REQUIRED) or has_any_kw(title_no_org_upper, FINANCE_ENTRY_TITLE_KW)):
                        continue
                    before = len(results)
                    add_item(node, "kofia", "금융권 채용", lead_tag="금융권")
                    recruit_count += len(results) - before
                    finance_count += len(results) - before
                    continue

                if has_any_kw(t_upper, LINKAREER_RECRUIT_BLACKLIST):
                    continue
                if not has_any_kw(title_no_org_upper, LINKAREER_TITLE_REQUIRED):
                    continue
                is_finance_role = (
                    is_fin_markets
                    or any(k in cats for k in ["자산운용", "펀드", "증권/투자", "IB/M&A"])
                    or has_any_kw(t_upper, ["PRIVATE EQUITY", "PE", "자산운용", "주식운용", "채권운용", "퀀트", "QUANT"])
                )

                # 금융 자산운용/투자/S&T 직무는 퀀트·운용 관점에서 허용(단 Financial Markets S&T 외 일반 영업은 차단)
                if is_finance_role:
                    fin_bl = ["회계", "세무", "디자인", "디자이너", "인사", "총무", "마케터", "사업개발", "BUSINESS DEVELOPMENT"]
                    if not is_fin_markets:
                        fin_bl.extend(["영업", "SALES", "마케팅"])
                    if has_any_kw(title_no_org_upper, fin_bl):
                        continue
                elif not is_valid_tech_job(title, f"{org} {cats}"):
                    continue

                before = len(results)
                if is_finance_role:
                    add_item(node, "kofia", "금융권 채용", lead_tag="금융권")
                    finance_count += len(results) - before
                else:
                    add_item(node, "intern", "인턴/신입")
                recruit_count += len(results) - before

    # 2) 공모전 (activityTypeID 3) + 대외활동/교육 (activityTypeID 1): 키워드 필터
    contest_count = 0
    for act_type_id, default_cat, badge in [("3", "contest", "공모전"), ("1", "activity", "대외활동/교육")]:
        type_filter = f'{{ status: OPEN, activityTypeID: "{act_type_id}" }}'
        for page in [1, 2, 3]:
            try:
                nodes = _linkareer_query(type_filter, page, 100)
            except Exception as e:
                print(f"  - Linkareer 수집 오류 (type={act_type_id}, page={page}): {e}")
                break
            if not nodes:
                break
            for node in nodes:
                title = (node.get("title") or "").strip()
                org = (node.get("organizationName") or "").strip()
                cats = " ".join(c.get("name", "") for c in (node.get("categories") or []))
                if not is_valid_contest_or_hackathon(title, f"{org} {cats}"):
                    continue
                category = default_cat
                if any(k in title.upper() for k in ["해커톤", "HACKATHON", "경진대회", "챌린지", "CHALLENGE"]):
                    category = "hackathon"
                before = len(results)
                add_item(node, category, "해커톤/경진대회" if category == "hackathon" else badge)
                contest_count += len(results) - before

    print(f"  -> Linkareer 채용 {recruit_count}건(금융권 {finance_count}건) · 공모전/대외활동 {contest_count}건 선별 완료")
    return results


# ==============================================================================
# 사람인(Saramin) 공식 Open API: IT개발·데이터 / 금융·보험 직무의 신입·인턴 공고
# - access-key가 필요 (https://oapi.saramin.co.kr 에서 무료 발급) → 환경변수 SARAMIN_ACCESS_KEY
# - 하루 공고 호출 최대 500건, 재판매·유료화 금지. 하루 3회 실행 기준으로 회당 150건 이내만 요청
# ==============================================================================
SARAMIN_API = "https://oapi.saramin.co.kr/job-search"
SARAMIN_QUERIES = [  # (상위직무 코드, 직무명, 요청 건수)
    ("2", "IT개발·데이터", 100),
    ("17", "금융·보험", 50),
]
SARAMIN_FINANCE_TITLE_KW = [
    "운용", "리서치", "애널리스트", "ANALYST", "퀀트", "QUANT", "트레이딩", "TRADING", "딜링", "리스크", "RISK",
    "IB", "투자", "증권", "자산", "펀드", "파생", "채권", "외환", "데이터", "DATA", "IT", "디지털", "금융공학",
    "신용평가",
]
SARAMIN_FINANCE_BLACKLIST = FINANCE_ROLE_BLACKLIST + [
    "설계사", "FC", "대출", "상담", "TM", "추심", "보험", "GA", "텔러", "창구", "콜센터", "사무보조", "경리",
]


def _saramin_text(value: Any) -> str:
    return html.unescape(str(value or "")).replace("&gt;", ">").strip()


def _saramin_ts_to_date(value: Any) -> Optional[str]:
    try:
        return datetime.datetime.fromtimestamp(int(value), tz=KST).strftime("%Y-%m-%d")
    except (TypeError, ValueError, OSError):
        return None


def _saramin_request(key: str, job_mid_cd: str, count: int, with_exp: bool) -> Dict[str, Any]:
    params = {"access-key": key, "job_mid_cd": job_mid_cd, "count": count, "sort": "pd", "fields": "posting-date,expiration-date"}
    if with_exp:
        params["exp_cd"] = 1  # 신입 (미지원이면 아래에서 경력 조건 없이 재요청하고 응답의 경력 정보로 거름)
    raw = fetch_text(f"{SARAMIN_API}?{urllib.parse.urlencode(params)}", timeout=20, headers={"Accept": "application/json"})
    return json.loads(raw)


def _saramin_is_entry(job: Dict[str, Any], title: str) -> Tuple[bool, str]:
    exp = (job.get("position") or {}).get("experience-level") or {}
    exp_name = _saramin_text(exp.get("name"))
    try:
        exp_min = int(exp.get("min")) if exp.get("min") not in (None, "") else None
        exp_max = int(exp.get("max")) if exp.get("max") not in (None, "") else None
    except (TypeError, ValueError):
        exp_min = exp_max = None
    job_type = _saramin_text(((job.get("position") or {}).get("job-type") or {}).get("name"))
    if "인턴" in job_type or re.search(r"인턴|\bINTERN", title, re.I):
        return True, "인턴"
    if "신입" in exp_name or has_entry_signal(title):
        return True, "신입"
    if "무관" in exp_name:
        return True, "경력무관"
    if exp_min == 0 and exp_max is not None and exp_max <= 2:
        return True, "신입"
    return False, ""


def crawl_saramin() -> List[Dict[str, Any]]:
    print("[4/6] 사람인(Saramin) Open API IT·금융 신입/인턴 공고 수집 중...")
    key = os.environ.get("SARAMIN_ACCESS_KEY", "").strip()
    if not key:
        print("  - SARAMIN_ACCESS_KEY가 없어 건너뜁니다 (oapi.saramin.co.kr에서 발급 후 GitHub Actions secret으로 등록)")
        # 키 등록 전에 이 실행 환경에서 API 서버에 접속되는지만 확인 (키 없는 요청 1회, 호출 한도와 무관)
        try:
            req = urllib.request.Request(f"{SARAMIN_API}?count=1", headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, context=SSL_CTX, timeout=10) as resp:
                print(f"  - 사람인 API 서버 접속 확인: HTTP {resp.status}")
        except urllib.error.HTTPError as e:
            print(f"  - 사람인 API 서버 접속 확인: HTTP {e.code}")
        except Exception as e:
            print(f"  - 사람인 API 서버 접속 실패: {type(e).__name__}")
        return []

    results: List[Dict[str, Any]] = []
    for job_mid_cd, mid_name, count in SARAMIN_QUERIES:
        payload: Dict[str, Any] = {}
        for with_exp in (True, False):
            try:
                payload = _saramin_request(key, job_mid_cd, count, with_exp)
            except Exception as e:
                # 키가 URL에 들어가므로 예외 메시지 전체를 출력하지 않음
                print(f"  - 사람인 {mid_name} 조회 오류: {type(e).__name__}")
                payload = {}
                break
            if "jobs" in payload:
                break
            print(f"  - 사람인 {mid_name} 응답 오류 code={payload.get('code')} {payload.get('message', '')}".rstrip())
            if str(payload.get("code")) in ("1", "2", "4"):  # 키 누락·잘못된 키·호출 한도 초과는 재시도해도 같음
                break

        jobs = ((payload.get("jobs") or {}).get("job")) or []
        picked = 0
        for job in jobs:
            if str(job.get("active", "1")) != "1":
                continue
            position = job.get("position") or {}
            title = _saramin_text(position.get("title"))
            company = _saramin_text(((job.get("company") or {}).get("detail") or {}).get("name"))
            job_id = job.get("id")
            if not title or not job_id:
                continue
            is_entry, label = _saramin_is_entry(job, title)
            if not is_entry:
                continue

            close_name = _saramin_text((job.get("close-type") or {}).get("name"))
            deadline = None if any(k in close_name for k in ["상시", "수시", "채용시"]) else _saramin_ts_to_date(job.get("expiration-timestamp"))
            if deadline and deadline < TODAY_STR:
                continue
            url = job.get("url") or f"https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx={job_id}"
            location = _saramin_text((position.get("location") or {}).get("name")).split(",")[0]
            item_id = f"saramin-{job_id}"
            t_upper = title.upper()

            if job_mid_cd == "17":
                if has_any_kw(t_upper, SARAMIN_FINANCE_BLACKLIST):
                    continue
                if not (has_any_kw(t_upper, SARAMIN_FINANCE_TITLE_KW) or has_any_kw(company.upper(), FINANCE_ORG_KEYWORDS)):
                    continue
                if any(k in company for k in ["은행", "뱅크"]):
                    org_tag = "은행"
                elif has_any_kw(company.upper(), ["증권", "자산운용", "투자", "운용", "선물", "SECURITIES"]):
                    org_tag = "증권"
                else:
                    org_tag = "금융"
                item = _bank_item(item_id, title, company or "사람인 등록 기업", "사람인", url, TODAY_STR,
                                  deadline, deadline is None, label, org_tag=org_tag)
                item["location"] = location or "국내"
            else:
                if not is_valid_dev_title(title):
                    continue
                item = _dev_item(item_id, title, company or "사람인 등록 기업", "사람인", url, deadline, label, location)
            results.append(item)
            picked += 1
        print(f"  -> 사람인 {mid_name} {len(jobs)}건 중 {picked}건 선별")
        time.sleep(0.3)
    return results


ENG_KOR_MAP = {
    "nice": "나이스",
    "nexon": "넥슨",
    "kakao": "카카오",
    "naver": "네이버",
    "line": "라인",
    "toss": "토스",
    "sk": "에스케이",
    "kt": "케이티",
    "lg": "엘지",
}


def clean_org_for_dedup(name: str) -> str:
    t = name.lower()
    for eng, kor in ENG_KOR_MAP.items():
        t = t.replace(eng, kor)
    t = re.sub(r"\[.*?\]|\(.*?\)", "", t)
    t = re.sub(r"\(주\)|주식회사|\(유\)|유한회사|주\)", "", t)
    t = re.sub(r"코리아|한국|그룹", "", t)
    t = re.sub(r"[^a-zA-Z0-9가-힣]", "", t)
    return t.strip()


def clean_title_for_dedup(title: str, org_clean: str) -> str:
    t = title.lower().replace("년도", "년")
    t = re.sub(r"\[.*?\]|\(.*?\)", "", t)
    if org_clean and len(org_clean) >= 2:
        t = t.replace(org_clean, "")
    stopwords = ["채용", "모집", "공고", "인턴", "신입", "사원", "정규직", "전환형", "채용연계형", "체험형", "부문", "분야", "상시", "수시", "영입"]
    for sw in stopwords:
        t = t.replace(sw, "")
    t = re.sub(r"[^a-zA-Z0-9가-힣]", "", t)
    return t.strip()


def merge_duplicate_items(primary: Dict[str, Any], secondary: Dict[str, Any]) -> Dict[str, Any]:
    """플랫폼 간 중복 공고 발생 시 더 공신력 있거나 상세한 정보로 병합"""
    source_priority = {
        "금융투자협회(KOFIA)": 4,
        "금융사 채용사이트": 4,
        "공공기관 채용(ALIO)": 4,
        "점핏(Jumpit)": 3,
        "원티드": 3,
        "토스 채용": 3,
        "프로그래머스": 3,
        "링커리어": 2,
        "사람인": 2,
        "위비티(Wevity)": 1,
    }
    p_score = source_priority.get(primary.get("source", ""), 0)
    s_score = source_priority.get(secondary.get("source", ""), 0)

    base = primary if p_score >= s_score else secondary
    other = secondary if p_score >= s_score else primary

    # 태그 병합
    merged_tags = list(base.get("tags", []))
    for tag in other.get("tags", []):
        if tag not in merged_tags:
            merged_tags.append(tag)
    base["tags"] = merged_tags[:5]

    # 더 정확하거나 구체적인 마감일 유지
    if not base.get("deadline") and other.get("deadline"):
        base["deadline"] = other["deadline"]
        base["isAlwaysOpen"] = False

    return base


def main() -> None:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "public", "data")
    os.makedirs(data_dir, exist_ok=True)

    manual_path = os.path.join(data_dir, "manual.json")
    output_path = os.path.join(data_dir, "opportunities.json")

    all_items: List[Dict[str, Any]] = []

    # 이전 수집 결과: KOFIA 최신 글 번호 시드 및 조회 실패 시 마감 전 공고 유지용
    prev_items: List[Dict[str, Any]] = []
    if os.path.exists(output_path):
        try:
            with open(output_path, "r", encoding="utf-8") as f:
                prev_items = json.load(f).get("items", []) or []
        except Exception as e:
            print(f"이전 opportunities.json 로드 오류: {e}")

    if os.path.exists(manual_path):
        try:
            with open(manual_path, "r", encoding="utf-8") as f:
                manual_items = json.load(f)
                if isinstance(manual_items, list):
                    all_items.extend(manual_items)
                    print(f"[0/6] 맞춤형 핵심 공고(manual.json) {len(manual_items)}건 로드 완료")
        except Exception as e:
            print(f"manual.json 로드 오류: {e}")

    all_items.extend(crawl_kofia(prev_items))
    all_items.extend(crawl_banks())
    all_items.extend(crawl_jumpit())
    all_items.extend(crawl_saramin())
    all_items.extend(crawl_linkareer())
    all_items.extend(crawl_wevity())

    # 1단계: 유효기간 및 마감 텍스트 필터링
    valid_items: List[Dict[str, Any]] = []
    for item in all_items:
        dl = item.get("deadline")
        if dl and not item.get("isAlwaysOpen"):
            try:
                if datetime.date.fromisoformat(dl[:10]) < NOW.date():
                    continue
            except ValueError:
                pass

        combined_text = f"{item.get('title', '')} {item.get('summary', '')}"
        if any(m in combined_text for m in ["접수마감", "접수 마감", "신청마감", "신청 마감", "모집마감", "모집 마감", "접수종료", "신청종료"]):
            continue

        valid_items.append(item)

    # 2단계: 크로스 플랫폼 스마트 중복 제거 및 단일화
    deduped: List[Dict[str, Any]] = []
    seen_indices = set()

    for i in range(len(valid_items)):
        if i in seen_indices:
            continue
        item_a = valid_items[i]
        org_a = clean_org_for_dedup(item_a.get("organization", ""))
        title_a = clean_title_for_dedup(item_a.get("title", ""), org_a)

        merged_item = item_a
        for j in range(i + 1, len(valid_items)):
            if j in seen_indices:
                continue
            item_b = valid_items[j]
            org_b = clean_org_for_dedup(item_b.get("organization", ""))
            title_b = clean_title_for_dedup(item_b.get("title", ""), org_b)

            org_match = False
            if org_a == org_b:
                org_match = True
            elif org_a and org_b and (org_a in org_b or org_b in org_a):
                org_match = True

            title_match = False
            if title_a == title_b and len(title_a) >= 2:
                title_match = True
            elif title_a and title_b and len(title_a) >= 4 and len(title_b) >= 4:
                if title_a in title_b or title_b in title_a:
                    title_match = True

            if org_match and title_match:
                seen_indices.add(j)
                merged_item = merge_duplicate_items(merged_item, item_b)

        deduped.append(merged_item)

    def sort_key(x: Dict[str, Any]):
        dl = x.get("deadline")
        if not dl or x.get("isAlwaysOpen"):
            return (1, "9999-12-31")
        try:
            d = datetime.date.fromisoformat(dl)
            if d < NOW.date():
                return (2, dl)
            return (0, dl)
        except ValueError:
            return (1, "9999-12-31")

    deduped.sort(key=sort_key)

    source_counts: Dict[str, int] = {}
    for item in deduped:
        src = item.get("source", "기타")
        source_counts[src] = source_counts.get(src, 0) + 1

    output_payload = {
        "updatedAt": NOW.strftime("%Y-%m-%d %H:%M KST"),
        "totalCount": len(deduped),
        "sourceCounts": source_counts,
        "items": deduped,
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_payload, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 총 {len(deduped)}건의 맞춤형 공고 데이터가 {output_path} 에 저장되었습니다.")


if __name__ == "__main__":
    main()
