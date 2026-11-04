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
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional

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
    "비서", "인사", "HR", "홍보", "PR", "PB", "지점", "창구", "연금가입자",
    "퇴직자", "경력단절", "결제 담당자", "SETTLEMENT", "전산장비", "유지보수",
    "광통신", "네트워크 엔지니어", "RF", "ANALOG", "MMIC", "LAYOUT",
    "제어기술", "로보틱스", "로봇", "머신비전", "응용SW", "크로스플랫폼",
    "모바일 앱", "악성코드", "경력 채용", "경력직", "컴파일러"
]

# 4. 채용/인턴에서 허용할 핵심 직무(Python·백엔드·데이터·AI·금융·퀀트) 키워드
JOB_REQUIRED_KEYWORDS = [
    "PYTHON", "백엔드", "BACKEND", "서버", "FASTAPI", "DJANGO", "SPRING",
    "데이터", "DATA", "AI", "인공지능", "머신러닝", "딥러닝", "ML", "LLM",
    "NLP", "PYTORCH", "TENSORFLOW", "퀀트", "QUANT", "트레이딩", "알고리즘",
    "금융", "핀테크", "블록체인", "SQL", "풀스택", "풀스텍"
]


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


def clean_html_text(raw_html: str) -> str:
    if not raw_html:
        return ""
    unescaped = html.unescape(raw_html)
    no_tags = re.sub(r"<[^>]+>", " ", unescaped)
    return re.sub(r"\s+", " ", no_tags).strip()


def is_valid_contest_or_hackathon(title: str, summary: str = "") -> bool:
    t_upper = title.upper()
    combined = f"{title} {summary}".upper()
    if any(b.upper() in combined for b in CONTEST_BLACKLIST):
        return False
    if not any(req.upper() in t_upper for req in CONTEST_REQUIRED_TITLE_KEYWORDS):
        return False
    return True


def is_valid_tech_job(title: str, tags_and_cat: str = "") -> bool:
    combined = f"{title} {tags_and_cat}".upper()
    if any(b.upper() in combined for b in JOB_BLACKLIST):
        return False
    if not any(req.upper() in combined for req in JOB_REQUIRED_KEYWORDS):
        return False
    return True


def is_valid_kofia_posting(title: str, summary: str) -> bool:
    """
    금융투자협회(KOFIA) 공고 필터링:
    1) 과장/차장/부장 등 순수 경력직 제외 (인턴, 신입, 채용연계형만 허용)
    2) PB/지점영업/내부감사/경영관리/펀드회계/결제 등 무관 직무 제외
    3) 퀀트, 운용(주식/채권/파생/ETF/패시브), 리서치, 채권평가, 리스크, IT/전산/데이터/AI 직무만 허용
    """
    t_upper = title.upper()
    combined = f"{title} {summary}".upper()

    kofia_blacklist = [
        "PB", "지점", "자산관리영업", "연금가입자", "퇴직자", "내부감사", "준법감시",
        "컴플라이언스", "변호사", "회계사", "세무사", "펀드회계", "경영관리", "총무",
        "비서", "인사", "홍보", "결제 담당", "SETTLEMENT", "부동산", "대체투자본부 경력",
        "법인영업", "리테일", "콜센터", "고객만족"
    ]
    if any(b in combined for b in kofia_blacklist):
        return False

    is_entry_or_intern = any(
        k in combined for k in ["인턴", "INTERN", "신입", "채용연계", "채용전환", "공채"]
    )
    is_pure_experienced = any(
        k in t_upper for k in ["경력직", "경력직원", "경력 채용", "경력모집", "과장", "차장", "부장", "팀장", "본부장", "SR."]
    ) and not any(k in t_upper for k in ["인턴", "신입"])

    if is_pure_experienced or not is_entry_or_intern:
        return False

    kofia_target_domains = [
        "퀀트", "QUANT", "운용", "파생", "패시브", "ETF", "채권", "주식", "리서치",
        "리스크", "위험관리", "트레이딩", "데이터", "AI", "IT", "전산", "디지털",
        "개발", "시스템", "보안", "정보보호", "외화채권", "채권평가", "알고리즘", "PE"
    ]
    if not any(d in combined for d in kofia_target_domains):
        return False

    return True


def infer_kofia_tags(title: str, content: str) -> List[str]:
    tags: List[str] = ["금융권"]
    combined = f"{title} {content}".upper()

    if "인턴" in combined or "INTERN" in combined:
        tags.append("인턴")
    if "신입" in combined or "공채" in combined or "채용연계" in combined:
        tags.append("신입")
    if any(k in combined for k in ["퀀트", "QUANT", "파생", "패시브", "ETF", "알고리즘"]):
        tags.append("퀀트/파생")
    if any(k in combined for k in ["운용", "주식", "채권", "리서치", "평가"]):
        tags.append("운용/리서치")
    if any(k in combined for k in ["IT", "전산", "개발", "SW", "시스템", "보안", "정보보호"]):
        tags.append("금융IT/보안")
    if any(k in combined for k in ["AI", "인공지능", "데이터", "디지털"]):
        tags.append("AI/데이터")

    return tags[:5]


def crawl_kofia() -> List[Dict[str, Any]]:
    """금융투자협회 (https://www.kofia.or.kr/brd/m_96/list.do) 맞춤형 채용/인턴 수집"""
    print("[1/4] 금융투자협회(KOFIA) 퀀트·운용·금융IT 신입/인턴 공고 수집 중...")
    results: List[Dict[str, Any]] = []
    seen_seqs = set()

    search_words = ["인턴", "신입", "퀀트", "파생", "운용", "IT", "전산", "데이터", "리서치", "ETF"]
    queries = [
        "https://www.kofia.or.kr/brd/m_96/list.do?page=1",
        "https://www.kofia.or.kr/brd/m_96/list.do?page=2",
    ] + [
        f"https://www.kofia.or.kr/brd/m_96/list.do?srchTp=0&srchWord={urllib.parse.quote(w)}"
        for w in search_words
    ]

    candidate_rows = []
    for url in queries:
        try:
            page_html = fetch_text(url, timeout=10)
            tbody_match = re.search(r"<tbody[^>]*>(.*?)</tbody>", page_html, re.S)
            if not tbody_match:
                continue
            rows = re.findall(r"<tr[^>]*>(.*?)</tr>", tbody_match.group(1), re.S)
            for row in rows:
                seq_match = re.search(r"view\.do\?seq=(\d+)", row)
                if not seq_match:
                    continue
                seq = seq_match.group(1)
                if seq in seen_seqs:
                    continue
                seen_seqs.add(seq)

                tds = re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)
                if len(tds) < 5:
                    continue
                company = clean_html_text(tds[1])
                raw_title = clean_html_text(tds[2])
                raw_title = re.sub(r"\s*new$", "", raw_title, flags=re.I).strip()
                reg_date = clean_html_text(tds[4])
                candidate_rows.append((seq, company, raw_title, reg_date))
        except Exception as e:
            print(f"  - KOFIA 목록 조회 오류 ({url}): {e}")

    for seq, company, title, reg_date in candidate_rows[:40]:
        if any(b in title.upper() for b in ["경력직", "경력직원", "PB", "지점", "내부감사", "펀드회계", "경영관리"]) and not any(
            k in title for k in ["인턴", "신입"]
        ):
            continue

        detail_url = f"https://www.kofia.or.kr/brd/m_96/view.do?seq={seq}"
        start_date = reg_date if re.match(r"^\d{4}-\d{2}-\d{2}$", reg_date) else TODAY_STR
        deadline: Optional[str] = None
        is_always_open = "상시" in title or "수시" in title or "채용 시" in title or "채용시" in title
        summary_text = f"{company} 채용 공고 ({title})"

        try:
            detail_html = fetch_text(detail_url, timeout=8)
            period_match = re.search(r"접수기간\s*</th>\s*<td[^>]*>\s*(\d{8})\s*~\s*(\d{8})", detail_html, re.S)
            if period_match:
                s_raw, e_raw = period_match.group(1), period_match.group(2)
                start_date = f"{s_raw[:4]}-{s_raw[4:6]}-{s_raw[6:8]}"
                deadline = f"{e_raw[:4]}-{e_raw[4:6]}-{e_raw[6:8]}"

            content_match = re.search(r"<td class=\"contents\"[^>]*>(.*?)</td>", detail_html, re.S)
            if not content_match:
                content_match = re.search(r"내용\s*</th>\s*</tr>\s*<tr>\s*<td[^>]*>(.*?)</td>", detail_html, re.S)
            if content_match:
                extracted = clean_html_text(content_match.group(1))
                if len(extracted) > 15:
                    summary_text = extracted[:220] + ("..." if len(extracted) > 220 else "")
        except Exception:
            pass

        if not is_valid_kofia_posting(title, summary_text):
            continue

        if deadline:
            try:
                dl_date = datetime.date.fromisoformat(deadline)
                # 접수 기한이 오늘 이전이면 이미 마감된 공고이므로 즉시 제외
                if dl_date < NOW.date():
                    continue
            except ValueError:
                pass
        else:
            if not is_always_open:
                try:
                    base_d = datetime.date.fromisoformat(start_date)
                    if (NOW.date() - base_d).days > 25:
                        continue
                    deadline = (base_d + datetime.timedelta(days=14)).isoformat()
                except ValueError:
                    is_always_open = True

        tags = infer_kofia_tags(title, summary_text)
        results.append({
            "id": f"kofia-{seq}",
            "title": title,
            "organization": company or "금융투자협회 회원사",
            "category": "kofia",
            "source": "금융투자협회(KOFIA)",
            "sourceUrl": detail_url,
            "startDate": start_date,
            "deadline": deadline,
            "isAlwaysOpen": is_always_open,
            "tags": tags,
            "location": "서울 여의도",
            "reward": "인턴십" if "인턴" in tags else "신입/인턴 채용",
            "summary": summary_text,
            "isFeatured": True,
        })

    print(f"  -> KOFIA 맞춤형 공고 {len(results)}건 선별 완료")
    return results


def crawl_jumpit() -> List[Dict[str, Any]]:
    """점핏 (Jumpit) 백엔드·AI·데이터·금융IT 신입/인턴 포지션만 엄선 수집"""
    print("[2/4] 점핏(Jumpit) AI·데이터·백엔드 신입/인턴 채용 공고 수집 중...")
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
    print("[4/4] 위비티(Wevity) AI·데이터·SW 개발 해커톤/공모전 수집 중...")
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

# 링커리어 금융 카테고리 중 사용자와 무관한 세부 직무 제외용
LINKAREER_FINANCE_BLACKLIST = [
    "회계", "세무", "결산", "재무제표", "매입", "GA채널", "보험영업", "영업지원",
    "대출", "여신", "수납", "텔러", "창구", "콜센터", "채권추심",
]

# 링커리어 채용 공고 중 일반 공채/행정직·비개발 직무 제외
LINKAREER_RECRUIT_BLACKLIST = [
    "직원 채용", "정기 채용", "정기채용", "공개채용", "신규직원", "임용", "정직원(",
    "경영행정", "일반행정", "사무", "애니메이션", "콘텐츠 AI 제작", "박사",
    "AML", "PM/PO", "기획자", "기획 담당", "보육", "계리", "사업 담당",
    "커뮤니케이션", "Communication", "유료화 기획",
]

# 제목에 하나라도 있어야 하는 링커리어 채용 키워드 (카테고리 태그만으로는 통과 불가)
LINKAREER_TITLE_REQUIRED = [
    "개발", "엔지니어", "ENGINEER", "데이터", "DATA", "AI", "ML", "머신러닝",
    "백엔드", "BACK-END", "BACKEND", "서버", "프론트엔드", "웹", "SW", "소프트웨어",
    "퀀트", "QUANT", "운용", "애널리스트", "리서치", "RESEARCH", "투자", "트레이딩",
    "DATABASE", "인프라", "클라우드", "보안",
]


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
    - 채용: IT/개발 · 금융 카테고리 + 인턴/신입 jobType 서버 필터 → 직무 키워드 2차 필터
    - 공모전/대외활동: 최신 공고 다수 조회 → AI/데이터/금융/해커톤 키워드 필터
    """
    print("[3/4] 링커리어(Linkareer) 인턴·신입·공모전·대외활동 수집 중...")
    results: List[Dict[str, Any]] = []
    seen_ids = set()

    def add_item(node: Dict[str, Any], category: str, badge: str) -> None:
        node_id = node.get("id")
        title = (node.get("title") or "").strip()
        if not node_id or not title or node_id in seen_ids:
            return
        seen_ids.add(node_id)
        org = (node.get("organizationName") or "주최기관").strip()
        cats = [c.get("name", "") for c in (node.get("categories") or []) if c.get("name") and c.get("name") != "전체"]
        job_types = node.get("jobTypes") or []
        deadline = _linkareer_deadline(node.get("recruitCloseAt"))
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

    # 1) 채용 (activityTypeID 5): IT/개발 + 금융 카테고리, 인턴/신입만
    recruit_filter = (
        '{ status: OPEN, activityTypeID: "5", '
        f'categoryIDs: ["{LINKAREER_CAT_IT}", "{LINKAREER_CAT_FINANCE}"], '
        "jobTypes: [INTERN, NEW] }"
    )
    recruit_count = 0
    for page in [1, 2, 3]:
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
            combined = f"{title} {cats}".upper()

            is_finance_cat = any(k in cats for k in ["자산운용", "펀드", "투자", "증권", "금융"])
            if any(b in combined for b in LINKAREER_FINANCE_BLACKLIST):
                continue
            if any(b.upper() in title.upper() for b in LINKAREER_RECRUIT_BLACKLIST):
                continue
            if not any(k in title.upper() for k in LINKAREER_TITLE_REQUIRED):
                continue
            # 금융 자산운용/투자 직무는 퀀트/운용 관점에서 허용, 그 외는 기술 직무 필터 적용
            if is_finance_cat and not any(b.upper() in combined for b in ["영업", "SALES", "회계", "세무"]):
                pass
            elif not is_valid_tech_job(title, f"{org} {cats}"):
                continue

            before = len(results)
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

    print(f"  -> Linkareer 채용 {recruit_count}건 · 공모전/대외활동 {contest_count}건 선별 완료")
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
    t = title.lower()
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
        "점핏(Jumpit)": 3,
        "원티드": 3,
        "프로그래머스": 3,
        "링커리어": 2,
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

    if os.path.exists(manual_path):
        try:
            with open(manual_path, "r", encoding="utf-8") as f:
                manual_items = json.load(f)
                if isinstance(manual_items, list):
                    all_items.extend(manual_items)
                    print(f"[0/4] 맞춤형 핵심 공고(manual.json) {len(manual_items)}건 로드 완료")
        except Exception as e:
            print(f"manual.json 로드 오류: {e}")

    all_items.extend(crawl_kofia())
    all_items.extend(crawl_jumpit())
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
