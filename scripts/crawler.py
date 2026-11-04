#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CareerRadar 자동 공고 수집기 (GitHub Actions & 로컬 실행 호환)
외부 패키지 설치 없이 Python 표준 라이브러리만으로 동작하여 빠르고 안정적입니다.

수집 대상:
1. 금융투자협회 (KOFIA) 채용안내 (https://www.kofia.or.kr/brd/m_96/list.do)
2. 점핏 (Jumpit) IT/SW 신입·인턴 채용 API
3. 링커리어 (Linkareer) 공모전·해커톤·대외활동·인턴 GraphQL API
4. 위비티 (Wevity) 웹/모바일/IT 및 게임/SW 공모전·해커톤
5. Devpost 글로벌 AI/SW 해커톤 API
6. 수동 관리 공고 (public/data/manual.json - 데이콘, 원티드, 프로그래머스, 자소설닷컴 등)
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

# KST (UTC+9) 기준 현재 시각
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


def infer_kofia_tags(title: str, content: str) -> List[str]:
    tags: List[str] = ["금융권"]
    combined = f"{title} {content}".upper()

    if "인턴" in combined or "INTERN" in combined:
        tags.append("인턴")
    if "신입" in combined or "공채" in combined or "채용연계" in combined:
        tags.append("신입")
    if any(k in combined for k in ["IT", "전산", "개발", "SW", "소프트웨어", "시스템", "프로그래머", "엔지니어"]):
        tags.append("IT/전산")
    if any(k in combined for k in ["정보보호", "보안", "ISMS", "시큐리티"]):
        tags.append("정보보호/보안")
    if any(k in combined for k in ["AI", "인공지능", "데이터", "퀀트", "QUANT", "디지털", "DT"]):
        tags.append("AI/데이터")
    if "경력" in title and "신입" not in title and "인턴" not in title:
        tags.append("경력")

    return tags[:5]


def crawl_kofia() -> List[Dict[str, Any]]:
    """금융투자협회 (https://www.kofia.or.kr/brd/m_96/list.do) 채용안내 크롤링"""
    print("[1/5] 금융투자협회(KOFIA) 채용안내 수집 중...")
    results: List[Dict[str, Any]] = []
    seen_seqs = set()

    # 최신 페이지 + IT/인턴/신입/데이터 특화 검색어를 함께 수집
    queries = [
        "https://www.kofia.or.kr/brd/m_96/list.do?page=1",
        "https://www.kofia.or.kr/brd/m_96/list.do?srchTp=0&srchWord=" + urllib.parse.quote("인턴"),
        "https://www.kofia.or.kr/brd/m_96/list.do?srchTp=0&srchWord=" + urllib.parse.quote("신입"),
        "https://www.kofia.or.kr/brd/m_96/list.do?srchTp=0&srchWord=" + urllib.parse.quote("IT"),
        "https://www.kofia.or.kr/brd/m_96/list.do?srchTp=0&srchWord=" + urllib.parse.quote("전산"),
        "https://www.kofia.or.kr/brd/m_96/list.do?srchTp=0&srchWord=" + urllib.parse.quote("데이터"),
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
                # 끝에 붙은 'new' 아이콘 텍스트 제거
                raw_title = re.sub(r"\s*new$", "", raw_title, flags=re.I).strip()
                reg_date = clean_html_text(tds[4])
                candidate_rows.append((seq, company, raw_title, reg_date))
        except Exception as e:
            print(f"  - KOFIA 목록 조회 오류 ({url}): {e}")

    # 상위 22개 공고의 상세 페이지에서 접수기간(마감일)과 본문 요약을 추출
    for seq, company, title, reg_date in candidate_rows[:22]:
        detail_url = f"https://www.kofia.or.kr/brd/m_96/view.do?seq={seq}"
        start_date = reg_date if re.match(r"^\d{4}-\d{2}-\d{2}$", reg_date) else TODAY_STR
        deadline: Optional[str] = None
        is_always_open = "상시" in title or "수시" in title
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
                    summary_text = extracted[:200] + ("..." if len(extracted) > 200 else "")
        except Exception:
            pass

        # 이미 너무 오래전에 마감된 공고(예: 7일 이상 지난 공고)는 제외
        if deadline:
            try:
                dl_date = datetime.date.fromisoformat(deadline)
                if (dl_date - NOW.date()).days < -3:
                    continue
            except ValueError:
                pass
        else:
            # 마감일이 명시되지 않고 상시채용이 아닌 경우 등록일 + 14일로 추정하거나 상시로 표시
            if not is_always_open:
                try:
                    base_d = datetime.date.fromisoformat(start_date)
                    if (NOW.date() - base_d).days > 30:
                        continue
                    deadline = (base_d + datetime.timedelta(days=14)).isoformat()
                except ValueError:
                    is_always_open = True

        tags = infer_kofia_tags(title, summary_text)
        # 카테고리 분류: 금융권 탭에서도 볼 수 있고, 인턴/채용으로도 분류
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
            "location": "서울 여의도 / 전국",
            "reward": "인턴십" if "인턴" in tags else ("신입채용" if "신입" in tags else "금융권 채용"),
            "summary": summary_text,
            "isFeatured": any(t in tags for t in ["인턴", "신입", "IT/전산", "AI/데이터", "정보보호/보안"]),
        })

    print(f"  -> KOFIA 공고 {len(results)}건 수집 완료")
    return results


def crawl_jumpit() -> List[Dict[str, Any]]:
    """점핏 (Jumpit) IT 신입/인턴 포지션 API 수집"""
    print("[2/5] 점핏(Jumpit) IT 신입·인턴 채용 공고 수집 중...")
    results: List[Dict[str, Any]] = []
    try:
        for page in [1, 2]:
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

                closed_at = pos.get("closedAt") or ""
                deadline = closed_at[:10] if len(closed_at) >= 10 else None
                always_open = bool(pos.get("alwaysOpen", False))
                tech_stacks = pos.get("techStacks") or []
                job_cat = [c.strip() for c in (pos.get("jobCategory") or "").split(",") if c.strip()]
                locations = pos.get("locations") or ["서울"]

                tags = ["신입/인턴"] + job_cat[:2] + tech_stacks[:3]
                # 중복 제거
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
                    "summary": f"{company}에서 {title} 포지션을 모집합니다. 주요 기술스택: {', '.join(tech_stacks) if tech_stacks else 'IT/SW 개발'}",
                    "isFeatured": "인턴" in title or any(k in " ".join(dedup_tags).upper() for k in ["AI", "백엔드", "프론트엔드", "SPRING", "REACT", "PYTHON"]),
                })
    except Exception as e:
        print(f"  - Jumpit 수집 오류: {e}")

    print(f"  -> Jumpit 공고 {len(results[:18])}건 수집 완료")
    return results[:18]


def crawl_wevity() -> List[Dict[str, Any]]:
    """위비티 (Wevity) 웹/모바일/IT(cidx=20) 및 게임/소프트웨어(cidx=21) 공모전/해커톤 수집"""
    print("[3/5] 위비티(Wevity) IT·SW 공모전/해커톤 수집 중...")
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

                # <span class='stat ...'> 제거
                raw_title = re.sub(r"<span[^>]*>.*?</span>", "", raw_title, flags=re.S)
                title = clean_html_text(raw_title)

                organ_match = re.search(r"<div class=\"organ\"[^>]*>(.*?)</div>", item, re.S)
                organ = clean_html_text(organ_match.group(1)) if organ_match else "주최사"

                sub_match = re.search(r"<div class=\"sub-tit\"[^>]*>(.*?)</div>", item, re.S)
                sub_tit = clean_html_text(sub_match.group(1)).replace("분야 :", "").strip() if sub_match else "웹/모바일/IT"

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

                is_hackathon = any(k in title.upper() for k in ["해커톤", "HACKATHON", "경진대회", "챌린지", "AI", "개발대회", "SW"])
                category = "hackathon" if is_hackathon else "contest"

                raw_tags = [t.strip() for t in sub_tit.split(",") if t.strip()]
                tags = (["해커톤"] if is_hackathon else ["공모전"]) + ["IT/SW"] + raw_tags[:3]

                results.append({
                    "id": f"wevity-{ix}",
                    "title": title,
                    "organization": organ,
                    "category": category,
                    "source": "위비티(Wevity)",
                    "sourceUrl": f"https://www.wevity.com/{html.unescape(rel_href)}",
                    "startDate": TODAY_STR,
                    "deadline": deadline,
                    "isAlwaysOpen": False,
                    "tags": tags[:5],
                    "location": "온/오프라인",
                    "reward": "공모전/해커톤 시상",
                    "summary": f"{organ} 주최 | 분야: {sub_tit}",
                    "isFeatured": is_hackathon or (dday_num_match and int(dday_num_match.group(1)) <= 14),
                })
        except Exception as e:
            print(f"  - Wevity 수집 오류 (cidx={cidx}): {e}")

    print(f"  -> Wevity 공모전/해커톤 {len(results[:18])}건 수집 완료")
    return results[:18]


def crawl_linkareer() -> List[Dict[str, Any]]:
    """링커리어 (Linkareer) GraphQL API를 통한 공모전·대외활동·인턴 수집"""
    print("[4/5] 링커리어(Linkareer) 공모전·대외활동·인턴 수집 중...")
    results: List[Dict[str, Any]] = []

    # activityTypeID: "3" (공모전), "1" (대외활동), "5" (채용/인턴)
    configs = [
        ("3", "contest", 30),
        ("1", "activity", 25),
        ("5", "intern", 35),
    ]

    it_keywords = [
        "IT", "SW", "소프트웨어", "개발", "AI", "인공지능", "데이터", "해커톤", "디지털",
        "클라우드", "보안", "프로그래밍", "코딩", "앱", "웹", "프론트엔드", "백엔드",
        "인턴", "테크", "핀테크", "빅데이터", "ICT", "아이디어", "기획", "창업", "아카데미", "부트캠프"
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
            count_for_type = 0
            for node in nodes:
                node_id = node.get("id")
                title = (node.get("title") or "").strip()
                org = (node.get("organizationName") or "주최기관").strip()
                cats = [c.get("name", "") for c in (node.get("categories") or []) if c.get("name")]
                job_types = node.get("jobTypes") or []
                close_ts = node.get("recruitCloseAt")

                if not node_id or not title:
                    continue

                combined_text = f"{title} {org} {' '.join(cats)} {' '.join(job_types)}".upper()

                # 채용(5)의 경우 신입/인턴 또는 IT/기획 관련만 필터링
                if act_type_id == "5":
                    is_intern_or_new = any(j in job_types for j in ["INTERN", "NEW"]) or "인턴" in title or "신입" in title
                    is_it = any(k in combined_text for k in it_keywords)
                    if not (is_intern_or_new or is_it):
                        continue
                else:
                    # 공모전/대외활동도 IT·데이터·기획 관련 공고 우선 선별
                    if not any(k in combined_text for k in it_keywords):
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

                badge_label = "인턴/신입" if category == "intern" else ("해커톤" if category == "hackathon" else ("공모전" if category == "contest" else "대외활동"))
                tags = [badge_label] + cats[:3]
                if "INTERN" in job_types and "인턴" not in tags:
                    tags.insert(0, "인턴")

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
                    "summary": f"{org}에서 진행하는 {title} ({', '.join(cats) if cats else badge_label})",
                    "isFeatured": "인턴" in title or category == "hackathon",
                })
                count_for_type += 1
                if count_for_type >= 8:
                    break
        except Exception as e:
            print(f"  - Linkareer 수집 오류 (type={act_type_id}): {e}")

    print(f"  -> Linkareer 공고 {len(results)}건 수집 완료")
    return results


def parse_devpost_dates(date_str: str) -> Optional[str]:
    """예: 'Oct 01 - Nov 12, 2026' 또는 'Nov 04, 2026' 에서 마감일 YYYY-MM-DD 추출"""
    if not date_str:
        return None
    parts = date_str.split("-")
    end_part = parts[-1].strip()
    # 만약 연도가 없으면 현재 연도 추가
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
    """Devpost 글로벌 AI/SW 해커톤 수집"""
    print("[5/5] Devpost 글로벌 AI·SW 해커톤 수집 중...")
    results: List[Dict[str, Any]] = []
    try:
        url = "https://devpost.com/api/hackathons?status[]=upcoming&status[]=open"
        raw = fetch_text(url, timeout=10)
        data = json.loads(raw)
        hackathons = data.get("hackathons", [])
        for h in hackathons[:10]:
            h_id = h.get("id")
            title = (h.get("title") or "").strip()
            org = (h.get("organization_name") or "Devpost").strip()
            h_url = h.get("url") or "https://devpost.com/hackathons"
            sub_dates = h.get("submission_period_dates") or ""
            deadline = parse_devpost_dates(sub_dates)
            loc = (h.get("displayed_location") or {}).get("location") or "Online"
            prize_raw = clean_html_text(h.get("prize_amount") or "")
            themes = [t.get("name", "") for t in (h.get("themes") or []) if t.get("name")]

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

    print(f"  -> Devpost 해커톤 {len(results)}건 수집 완료")
    return results


def main() -> None:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "public", "data")
    os.makedirs(data_dir, exist_ok=True)

    manual_path = os.path.join(data_dir, "manual.json")
    output_path = os.path.join(data_dir, "opportunities.json")

    all_items: List[Dict[str, Any]] = []

    # 1. 수동/추천 공고 로드 (DACON, 원티드, 프로그래머스, 자소설닷컴, Kaggle 등)
    if os.path.exists(manual_path):
        try:
            with open(manual_path, "r", encoding="utf-8") as f:
                manual_items = json.load(f)
                if isinstance(manual_items, list):
                    all_items.extend(manual_items)
                    print(f"[0/5] 수동/추천 공고(manual.json) {len(manual_items)}건 로드 완료")
        except Exception as e:
            print(f"manual.json 로드 오류: {e}")

    # 2. 실시간 크롤러 실행
    all_items.extend(crawl_kofia())
    all_items.extend(crawl_jumpit())
    all_items.extend(crawl_wevity())
    all_items.extend(crawl_linkareer())
    all_items.extend(crawl_devpost())

    # 3. 중복 제거 (id 또는 (title, organization) 기준)
    deduped: List[Dict[str, Any]] = []
    seen_keys = set()
    for item in all_items:
        key = (item.get("title", "").strip().lower(), item.get("organization", "").strip().lower())
        if key in seen_keys:
            continue
        seen_keys.add(key)
        deduped.append(item)

    # 4. 마감일 임박순 정렬 (상시채용은 뒤로, 마감 지난 공고는 맨 뒤로)
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

    # 출처별 통계
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

    print(f"\n✅ 총 {len(deduped)}건의 공고 데이터가 {output_path} 에 저장되었습니다.")


if __name__ == "__main__":
    main()
