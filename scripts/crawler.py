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
    "햇반", "AI디어", "식품", "차량용 앱", "인포테인먼트"
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
    print("[1/5] 금융투자협회(KOFIA) 퀀트·운용·금융IT 신입/인턴 공고 수집 중...")
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
                if (dl_date - NOW.date()).days < -1:
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
    print("[2/5] 점핏(Jumpit) AI·데이터·백엔드 신입/인턴 채용 공고 수집 중...")
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
    print("[3/5] 위비티(Wevity) AI·데이터·SW 개발 해커톤/공모전 수집 중...")
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


def crawl_linkareer() -> List[Dict[str, Any]]:
    """링커리어 (Linkareer) GraphQL API — CS·데이터·AI·금융만 선별"""
    print("[4/5] 링커리어(Linkareer) 맞춤형 인턴·해커톤 수집 중...")
    results: List[Dict[str, Any]] = []

    configs = [
        ("3", "contest", 50),
        ("1", "activity", 40),
        ("5", "intern", 50),
    ]

    for act_type_id, default_cat, page_size in configs:
        query = f"""
        {{
          activities(
            filterBy: {{ status: OPEN, activityTypeID: "{act_type_id}" }},
            pagination: {{ pageSize: {page_size}, page: 1 }}
          ) {{
            nodes {{
              id
              title
              organizationName
              categories {{ name }}
              jobTypes
              recruitCloseAt
            }}
          }}
        }}
        """
        try:
            req = urllib.request.Request(
                "https://api.linkareer.com/graphql",
                data=json.dumps({"query": query}).encode("utf-8"),
                headers={"Content-Type": "application/json", "User-Agent": USER_AGENT},
            )
            with urllib.request.urlopen(req, context=SSL_CTX, timeout=10) as resp:
                payload = json.loads(resp.read().decode("utf-8", errors="ignore"))

            nodes = payload.get("data", {}).get("activities", {}).get("nodes", [])
            for node in nodes:
                node_id = node.get("id")
                title = (node.get("title") or "").strip()
                org = (node.get("organizationName") or "주최기관").strip()
                cats = [c.get("name", "") for c in (node.get("categories") or []) if c.get("name")]
                job_types = node.get("jobTypes") or []
                close_ts = node.get("recruitCloseAt")

                if not node_id or not title:
                    continue

                if act_type_id == "5":
                    is_intern_or_new = any(j in job_types for j in ["INTERN", "NEW"]) or "인턴" in title or "신입" in title
                    if not is_intern_or_new:
                        continue
                    if not is_valid_tech_job(title, f"{org} {' '.join(cats)}"):
                        continue
                else:
                    if not is_valid_contest_or_hackathon(title, f"{org} {' '.join(cats)}"):
                        continue

                deadline = None
                if close_ts:
                    try:
                        dt = datetime.datetime.fromtimestamp(int(close_ts) / 1000.0, tz=KST)
                        deadline = dt.strftime("%Y-%m-%d")
                    except Exception:
                        pass

                category = default_cat
                if any(k in title.upper() for k in ["해커톤", "HACKATHON", "경진대회"]):
                    category = "hackathon"

                badge_label = "인턴/신입" if category == "intern" else ("해커톤" if category == "hackathon" else ("공모전" if category == "contest" else "교육/대외활동"))
                tags = [badge_label] + cats[:3]

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
                    "reward": badge_label,
                    "summary": f"{org} | {title}",
                    "isFeatured": True,
                })
        except Exception as e:
            print(f"  - Linkareer 수집 오류 (type={act_type_id}): {e}")

    print(f"  -> Linkareer 맞춤형 공고 {len(results)}건 선별 완료")
    return results


def parse_devpost_dates(date_str: str) -> Optional[str]:
    if not date_str:
        return None
    parts = date_str.split("-")
    end_part = parts[-1].strip()
    if not re.search(r"\d{4}", end_part):
        end_part = f"{end_part}, {NOW.year}"
    for fmt in ["%b %d, %Y", "%B %d, %Y"]:
        try:
            dt = datetime.datetime.strptime(end_part, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def crawl_devpost() -> List[Dict[str, Any]]:
    """Devpost 글로벌 AI/ML · 핀테크 · 데이터 해커톤만 선별 수집"""
    print("[5/5] Devpost 글로벌 AI·핀테크·데이터 해커톤 수집 중...")
    results: List[Dict[str, Any]] = []
    try:
        url = "https://devpost.com/api/hackathons?status[]=upcoming&status[]=open"
        raw = fetch_text(url, timeout=10)
        data = json.loads(raw)
        hackathons = data.get("hackathons", [])
        for h in hackathons[:15]:
            h_id = h.get("id")
            title = (h.get("title") or "").strip()
            org = (h.get("organization_name") or "Devpost").strip()
            h_url = h.get("url") or "https://devpost.com/hackathons"
            sub_dates = h.get("submission_period_dates") or ""
            deadline = parse_devpost_dates(sub_dates)
            loc = (h.get("displayed_location") or {}).get("location") or "Online"
            prize_raw = clean_html_text(h.get("prize_amount") or "")
            themes = [t.get("name", "") for t in (h.get("themes") or []) if t.get("name")]

            combined = f"{title} {org} {' '.join(themes)}".upper()
            if any(b in combined for b in ["LEARN AR", "VR START", "GAMING", "QNX", "KIROWEEN"]):
                continue
            if not any(k in combined for k in ["AI", "MACHINE LEARNING", "FINTECH", "DATA", "CLOUD", "BLOCKCHAIN"]):
                continue

            tags = ["글로벌 해커톤"] + themes[:4]
            results.append({
                "id": f"devpost-{h_id}",
                "title": title,
                "organization": org,
                "category": "hackathon",
                "source": "Devpost",
                "sourceUrl": h_url,
                "startDate": TODAY_STR,
                "deadline": deadline,
                "isAlwaysOpen": deadline is None,
                "tags": tags[:5],
                "location": loc,
                "reward": f"상금 {prize_raw}" if prize_raw else "글로벌 해커톤",
                "summary": f"{org} 주최 글로벌 해커톤 | 일정: {sub_dates} | 테마: {', '.join(themes)}",
                "isFeatured": True,
            })
    except Exception as e:
        print(f"  - Devpost 수집 오류: {e}")

    print(f"  -> Devpost 해커톤 {len(results)}건 선별 완료")
    return results


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
                    print(f"[0/5] 맞춤형 핵심 공고(manual.json) {len(manual_items)}건 로드 완료")
        except Exception as e:
            print(f"manual.json 로드 오류: {e}")

    all_items.extend(crawl_kofia())
    all_items.extend(crawl_jumpit())
    all_items.extend(crawl_wevity())
    all_items.extend(crawl_linkareer())
    all_items.extend(crawl_devpost())

    deduped: List[Dict[str, Any]] = []
    seen_keys = set()
    for item in all_items:
        key = (item.get("title", "").strip().lower(), item.get("organization", "").strip().lower())
        if key in seen_keys:
            continue
        seen_keys.add(key)
        deduped.append(item)

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
