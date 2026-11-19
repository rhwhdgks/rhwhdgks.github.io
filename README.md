# CareerRadar

IT·금융 직무의 신입·인턴 채용, 해커톤, 공모전, 대외활동 공고를 자동으로 모아 보여주는 정적 사이트입니다. GitHub Actions가 하루 세 번(09시·14시·20시 KST) 공고를 수집해 GitHub Pages에 배포합니다.

사이트: https://rhwhdgks.github.io

## 화면

- 공고 탐색: 분야 탭(인턴·신입 채용, 해커톤·AI 경진대회, IT·기획 공모전, 금융권 채용, 대외활동·부트캠프), 출처 필터, 키워드 검색, 마감 임박순·최신순 정렬, D-Day 표시. 금융권 탭은 증권·운용 / 은행 / 금융공기업 / 금융IT·데이터로 세분
- 진행 현황: 준비·작성중 / 지원·제출완료 / 진행·참여중 단계별 관리
- 캘린더: 마감일 기준 월별 보기
- 자소서 치트시트: 프로젝트별 자기소개서 작성용 요약
- 북마크·숨김: 브라우저 `localStorage`에 저장 (로그인 없음)

## 수집 출처

수집기는 [scripts/crawler.py](scripts/crawler.py)이고 결과는 `public/data/opportunities.json`에 저장됩니다. 각 사이트의 채용 페이지가 쓰는 공개 목록 데이터나 공식 API만 읽고, robots.txt와 이용약관을 확인한 곳만 수집합니다.

| 구분 | 출처 | 기준 |
|---|---|---|
| 금융권 | 금융투자협회(KOFIA) 회원사 채용안내 | 증권·운용·금융IT 신입·인턴. 목록 응답이 잘려 와서 최신 글 번호부터 상세 페이지를 역순 조회 |
| 금융권 | 은행 11곳, 증권사 8곳 채용사이트 (recruiter.co.kr) | 접수 중인 신입·인턴 |
| 금융권 | ALIO 공공기관 채용정보 | 국책은행, 금융공기업 |
| 금융권 | 토스 채용 | 개발 직무는 인턴·신입 탭, 토스뱅크·토스증권·Treasury·리스크 직무는 금융권 탭 |
| 대기업 IT | 네이버, 카카오, 라인, 당근·쿠팡(Greenhouse API) | 국내 신입·인턴·주니어. 인턴은 디자인·마케팅 제외, 그 외는 개발·데이터 직무만 |
| 그룹사 | 삼성, LG, KT, CJ, 넷마블, 두산, 현대모비스 | 신입·인턴 중 개발·데이터 직무와 IT 계열사 공채 |
| 그룹사 | recruiter.co.kr 사용 계열사 약 40곳 (HD현대, GS, LS, LX, DL이앤씨, S-OIL, 한국타이어, 현대글로비스, KT&G, 대한항공, LIG D&A, 안랩, 셀트리온, 효성 등) | 같은 기준. 금융 계열사 신입 공채는 금융권 탭 |
| 그룹사 | 그리팅(greetinghr) 사용 기업 (현대오토에버, 카카오페이, 카카오모빌리티, 11번가, SSG.COM, 무신사, 컬리, 야놀자, 여기어때, 하이브, 한컴) | 같은 기준 |
| 채용 플랫폼 | 사람인 Open API | IT개발·데이터, 금융·보험 직무 신입·인턴·경력무관. `SARAMIN_ACCESS_KEY`가 있을 때만, 회당 150건 이내 |
| 채용 플랫폼 | 점핏 | IT 신입·인턴 개발자 공고와 기술스택 |
| 채용 플랫폼 | 링커리어 | IT·금융 인턴·신입, AI·데이터·금융 공모전·대외활동 |
| 공모전 | 위비티 | 웹·모바일·IT, 게임·SW 공모전과 해커톤 |
| 직접 추가 | `public/data/manual.json` | 데이콘, 캐글 등 직접 넣은 공고를 수집 결과와 병합 |

공통으로 계약직, 외국인·석박사 전형, 인재풀 등록, 생산·현장직, 창구·상담 직무는 제외합니다.

수집하지 않는 곳

| 사이트 | 이유 |
|---|---|
| SK | 세션 필요 |
| 현대차, 기아, 현대캐피탈 | 접속 대기열 |
| 한화 | 관리 서버 API |
| 롯데 | 봇 차단 |
| 포스코 | robots.txt 전체 금지 |
| 넥슨, NC, 크래프톤, 원티드 | 403 |
| 우아한형제들 | robots.txt가 목록 API 금지 |
| 자소설닷컴 | 이용약관상 자동 수집·재배포 금지. 상단 바로가기에 채용달력 링크만 둠 |

## 로컬 실행

```bash
npm install
npm run crawl   # public/data/opportunities.json 갱신
npm run dev
```

## 배포

`.github/workflows/deploy.yml`이 일정(하루 세 번)과 `main` 푸시 때마다 수집 → 빌드 → GitHub Pages 배포를 실행하고, 갱신된 데이터를 커밋합니다. 처음 설정할 때는 저장소 Settings → Pages → Source를 `GitHub Actions`로 바꿉니다.

사람인 공고를 받으려면 [사람인 Open API](https://oapi.saramin.co.kr)에서 access-key를 발급받아 저장소 Secret `SARAMIN_ACCESS_KEY`로 등록합니다 (`gh secret set SARAMIN_ACCESS_KEY`).

## 기술

React, TypeScript, Vite, Tailwind CSS, Python(표준 라이브러리 수집기), GitHub Actions, GitHub Pages
