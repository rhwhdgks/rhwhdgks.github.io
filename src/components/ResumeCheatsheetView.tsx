import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  FolderGit2,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

interface ProjectDetail {
  id: string;
  name: string;
  repo: string;
  repoUrl: string;
  category: string;
  badgeClass: string;
  summary: string;
  techStack: string[];
  situation: string;
  task: string;
  action: string[];
  result: string;
  qna: {
    question: string;
    answer: string;
  };
}

const PROJECTS_DATA: ProjectDetail[] = [
  {
    id: 'funding-arb-engine',
    name: '바이낸스·OKX 선물거래소 차익거래 & 주문 실행 엔진',
    repo: 'rhwhdgks/funding-arb-engine',
    repoUrl: 'https://github.com/rhwhdgks/funding-arb-engine',
    category: '거래시스템 백엔드 · 퀀트 트레이딩',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    summary:
      '바이낸스와 OKX 선물시장에서 양방향 펀딩비 차익을 포착하고, 한쪽 체결 시 반대편 즉각 헤징 및 네트워크 단절 시 자동 복구(State Recovery)를 보장하는 24시간 무중단 실행 엔진',
    techStack: ['Python', 'Asyncio', 'WebSocket', 'REST API', 'MariaDB', 'SQLite', 'Linux'],
    situation:
      '암호화폐 선물 시장에서 두 거래소(Binance, OKX) 간 펀딩비 차익 및 페어 트레이딩 기회를 실시간으로 포착하고, 슬리피지와 체결 시차를 최소화하여 양방향 포지션을 안전하게 운용할 수 있는 무중단 실행 엔진이 필요했습니다.',
    task: '양 거래소의 상이한 REST/WebSocket 규격을 단일 인터페이스로 추상화하고, 급격한 변동성 시 발생하는 실행 불균형(Leg Risk)을 원천 차단하며, 네트워크 단절 후에도 안전하게 포지션을 복구할 수 있는 무중단 State Recovery 아키텍처를 구축하는 것이 핵심 과제였습니다.',
    action: [
      '양방향 동시 주문 및 Fail-Safe 헤징: 첫 번째 거래소의 주문 체결 확인 즉시 반대 거래소에 시장가/IOC 주문을 집행하고, 타임아웃 발생 시 즉시 잔여 주문 취소 및 비상 청산(Emergency Unwind) 루틴 가동',
      '장애 복구(State Recovery) 시스템: 프로세스 재시작 시 거래소 API로부터 실제 열린 포지션과 주문 내역을 전수 조회하여 로컬 MariaDB 및 메모리 상태와 대조·동기화하는 복구 파이프라인 구현',
      '이중화 데이터 수집 & 운영 콘솔: 시세·펀딩비 수집기를 별도 비동기 서비스로 격리하고, 전략 실행 프로세스 내에서 실시간 긴급 일시정지, 위험 축소, 수동 주문 취소를 제어할 수 있는 소켓 기반 운영 콘솔 구축',
      '단위/회귀 테스트 41개 구축 및 GitHub Actions CI 파이프라인 자동화',
    ],
    result:
      '24시간 연속 가동 테스트에서 final_verdict=PASS 달성 (잔여 미체결 0건, 불일치 포지션 0건, API 호출 제한 초과 0건). 변동성 장세에서도 단방향 노출(Unhedged Delta)을 수 초 내에 제로로 수렴시키는 프로덕션급 안정성 검증.',
    qna: {
      question: '한쪽 거래소만 체결되고 다른 거래소가 타임아웃 나면 어떻게 처리했나요?',
      answer:
        '우선 타임아웃 발생 즉시 해당 주문의 실제 체결 여부를 거래소 REST API로 단건 재조회합니다. 미체결 상태라면 즉시 취소 요청을 보내고, 이미 체결된 반대편 포지션을 즉각 헤지하기 위해 반대편 거래소에 시장가 청산 주문을 집행하여 익스포저를 즉시 제거합니다. 모든 상태 전이는 JSONL 감사 로그와 DB에 실시간 기록됩니다.',
    },
  },
  {
    id: 'mirae-asset-dart',
    name: '2026 미래에셋증권 AI Festival - DART 전자공시 질의응답 Agent',
    repo: 'rhwhdgks/mirae-asset-dart',
    repoUrl: 'https://github.com/rhwhdgks/mirae-asset-dart',
    category: '금융 AI / LLM · 금융데이터 엔지니어링',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    summary:
      'DART 전자공시 문서의 기간·단위·정정 이력을 추적하여 LLM의 환각(Hallucination)을 원천 차단하고, 수치 계산과 원문 근거를 100% 검증하는 결정적(Deterministic) 공시 질의응답 API',
    techStack: ['Python', 'FastAPI', 'HyperCLOVA X', 'XML Parsing', 'Decimal', 'PyTest'],
    situation:
      '금융감독원 DART 공시 문서는 기업마다 표 형식, 보고 기간, 정정 이력, 단위(원, 천원, 백만원)가 달라 일반적인 LLM RAG(검색 증강 생성) 적용 시 환각과 심각한 숫자 왜곡이 발생했습니다.',
    task: 'LLM에게 재무 계산을 직접 맡기지 않고, "LLM은 자연어 질문 구조화 및 최종 문장 생성만 담당하고, 실제 공시 문서 탐색, 단위 바인딩, 정정 이력 추적, 수치 계산은 엄밀한 파이썬 코드가 수행하는 결정적 Agent 파이프라인"을 구축해야 했습니다.',
    action: [
      '단위 바인딩 오류 방지 (dart_xml.py): 문서 상단의 단위(백만원 등)가 엉뚱한 본문 표에 오적용되지 않도록 단위 유효 범위를 바로 다음 표로 국소화',
      '정정 공시 계보(Lineage) 추적 (lineage.py): 정정 공시 발생 시 단순 최신 파일로 덮어쓰지 않고, 과거 특정 분기 시점의 유효 정본과 정정 이력을 그래프 형태로 추적',
      '헤더 보존 결정적 청킹 (chunker.py): 대형 재무제표 표 분할 시 각 청크마다 최상위 머리글을 복제 반복하고 행 단위 무결성을 유지하며 Content Hash로 원문 위치 보존',
      '부동소수점 오차 차단 (financial.py): 모든 금융 계산에 Decimal 모듈을 강제하고, 답변 생성 직전 산출 근거를 재검증',
    ],
    result:
      '2026 미래에셋증권 AI Festival 공시 Agent 과제 출품. 복잡한 정정공시 및 다중 단위 환경에서도 환각에 의한 수치 왜곡 0건 달성, 공시 원문 단락 및 표 위치를 100% 추적 가능한 설명 가능한 금융 AI 완성.',
    qna: {
      question: '왜 LangChain이나 LlamaIndex 같은 기성 RAG 대신 직접 파이프라인을 짰나요?',
      answer:
        '기성 RAG는 텍스트 유사도 기반 벡터 검색에 의존합니다. 하지만 금융 공시는 "2024년 3분기 연결재무제표의 매출액(백만원)"처럼 시점, 연결 여부, 단위가 정확히 일치해야 합니다. 벡터 유사도로는 유사한 다른 연도나 별도 재무제표가 검색될 위험이 높아, 질문 구조화와 조건 확정, 정본 조회를 파이썬 코드로 엄격히 제어하는 자체 결정적 아키텍처를 설계했습니다.',
    },
  },
  {
    id: 'etf-image-alpha-ode',
    name: 'ETF 차트 이미지 기반 수익률 순위 예측 연구 (Find-A 학회)',
    repo: 'rhwhdgks/etf-image-alpha-ode',
    repoUrl: 'https://github.com/rhwhdgks/etf-image-alpha-ode',
    category: '퀀트 리서치 · 시계열 & 비전 딥러닝',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-300',
    summary:
      '7개 주요 ETF의 60거래일 OHLCV 데이터를 2D 이미지로 변환하여 20거래일 뒤 수익률 순위를 예측하고, Data Leakage 없는 Walk-Forward 분석으로 포트폴리오 최적화(ODE) 팀에 전달할 신호와 공분산을 산출',
    techStack: ['Python', 'PyTorch (2D CNN)', 'pandas', 'NumPy', 'SciPy', 'Walk-Forward'],
    situation:
      '고려대학교 퀀트 학회 Find-A에서 7개 주요 ETF를 대상으로, 가격 차트 이미지가 전통적인 수치 시계열 데이터보다 향후 20거래일 뒤의 ETF 간 상대적 수익률 순위를 예측하는 데 추가적인 알파를 제공할 수 있는지를 과학적으로 검증하고자 했습니다.',
    task: '60거래일 OHLCV 데이터를 2D 이미지로 변환해 CNN으로 특징을 추출하고, 미래 참조 편향(Look-Ahead Bias)을 완벽히 배제한 상태에서 포트폴리오 최적화(Neural ODE) 팀에 전달할 신호 mu(t)와 공분산 행렬 Sigma(t)를 산출하는 엄격한 연구 파이프라인을 구축하는 것이었습니다.',
    action: [
      '철저한 Data Leakage 방지: 시간 순서를 보존한 Walk-Forward 교차 검증을 적용하고, 20일 예측 윈도우 겹침 문제를 해결하기 위해 Fold 경계에 Purge 및 Embargo 기법 적용',
      '차트 이미지 팩터 어블레이션: 2D CNN을 통해 추출한 이미지 특징이 단순 모멘텀/변동성 팩터 대비 통계적으로 독립적인 추가 예측력을 제공하는지 다중 가설 검정 및 부트스트랩으로 검증',
      '공분산 행렬 축소 추정 (Shrinkage Covariance): 표본 수가 적을 때 공분산 행렬 왜곡을 막기 위해 Ledoit-Wolf Shrinkage 기법 적용',
      '학회 팀 간 인터페이스 표준화: ODE 팀이 즉시 최적화 연산에 투입할 수 있도록 Manifest 기반 표준 입력 스키마(Handoff Protocol) 정의',
    ],
    result:
      '연구 전 과정을 담은 한국어 논문 연구 초안(paper_draft_ko.md) 및 프로세스 무결성 감사 보고서 완성. 거시 시장 공통 요인을 통제한 잔차 모델에서 이미지 패턴이 유의미한 보조 지표로 작동함을 실증.',
    qna: {
      question: '차트 이미지를 쓰는 것이 단순 기술적 지표 시계열보다 우수한 점이 무엇인가요?',
      answer:
        '단순 수치 시계열은 고정된 윈도우 내의 지표만 반영하지만, 2D 캔들 차트 이미지는 가격의 고저점 지지/저항선, 거래량 급증 구간의 국소적 패턴을 2차원 공간적 특징으로 한 번에 포착합니다. 다만 거시 시장 요인을 먼저 잔차화하지 않으면 단순 시장 베타만 학습하므로, 시장 영향을 제거한 잔차 신호 분석을 병행했습니다.',
    },
  },
  {
    id: 'crypto-order-flow',
    name: '바이낸스·OKX 코인 주문흐름(Order Flow) 동조화 연구',
    repo: 'rhwhdgks/crypto-order-flow-synchronization',
    repoUrl: 'https://github.com/rhwhdgks/crypto-order-flow-synchronization',
    category: '마켓 마이크로스트럭처 리서치 · 퀀트 데이터',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-300',
    summary:
      '바이낸스·OKX 틱(AggTrades) 및 L2 호가 자료를 수집하여 사전 등록 프로토콜 하에서 7개 코인의 매수·매도 압력 동조화를 실증하고, 거래비용 감안 시 실제 알파 유효성을 정직하게 검증',
    techStack: ['Python', 'Parquet', 'NumPy', 'pandas', 'SciPy', 'L2 Order Book'],
    situation:
      '여러 암호화폐 자산의 매수·매도 체결 압력(Order Flow)이 개별 자산의 고유한 뉴스가 없음에도 시장 전체에서 동시에 같은 방향으로 움직이는 동조화 현상이 존재하는지 실증적으로 규명하고자 했습니다.',
    task: '수 기가바이트의 바이낸스·OKX 틱 및 L2 호가 데이터를 처리하고, 가격 변동 및 거래량 영향을 통제한 뒤, 연구자의 자의적 개입(p-hacking)을 배제한 사전 등록 연구 설계(Pre-registered Research Protocol)를 통해 가설을 검증해야 했습니다.',
    action: [
      '사전 등록 및 Seal 봉인: 분석 결과를 보기 전 가설, 기간, 자산, 판정 임계값을 담은 프로토콜을 사전 등록하여 사후 편향 방지',
      '체결 압력 잔차화: 회귀 분석을 통해 가격 변화율과 거래량 효과를 걷어낸 순수 잔차 주문흐름(Residual Order Flow) 추출',
      '외부 타당성 검증: 분석에 쓰지 않은 미래 기간과 다른 거래소인 OKX 데이터를 동일 파이프라인으로 교차 검증',
      '현실적 거래비용 검정: 동조화 현상을 이용한 차익/시차 추종 매매 전략을 백테스팅하고 슬리피지와 거래소 수수료를 감안한 실제 순익 유효성 평가',
    ],
    result:
      '7개 코인 간 주문흐름 상관계수가 실제 자료 0.14345 vs 무작위 날짜 셔플 비교값 0.00114로 유의미한 동조화 실증 (OKX에서도 상관계수 0.11857 확인). 단, 단순 추종 매매는 거래비용 감안 시 알파가 소멸됨을 확인하여 "통계적 유의성이 곧바로 실행 가능한 초과수익으로 이어지지 않는다"는 금융 시장의 본질적 교훈 입증.',
    qna: {
      question: '수익 전략으로 이어지지 않았는데 이 연구의 가장 큰 가치는 무엇인가요?',
      answer:
        '금융 데이터 분석에서 가장 흔한 함정이 "수수료와 슬리피지를 고려하지 않은 가짜 백테스팅 수익"입니다. 저는 데이터 왜곡 없이 실제 주문 집행 비용을 엄격히 반영하여, 시장 미시구조의 동조화 현상이 실제로 유효한 초과수익으로 전환되기 위한 임계 거래속도와 수수료 한계를 규명했다는 점에서 실무적으로 매우 가치 있는 기준점을 세웠습니다.',
    },
  },
  {
    id: 'crypto-herding',
    name: '암호화폐 집단추종(Herding) 지표 검증 및 가상시장 시뮬레이션',
    repo: 'rhwhdgks/crypto-herding-research',
    repoUrl: 'https://github.com/rhwhdgks/crypto-herding-research',
    category: '계량 금융 리서치 · 통계 시뮬레이션',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    summary:
      'JBEF 저널 선행 논문의 CSAD 집단추종 모형을 재현한 뒤, 집단추종이 전혀 없는 가상시장 몬테카를로 시뮬레이션을 통해 기존 지표의 수학적 결함(거짓 양성 97~100%)을 직접 반증',
    techStack: ['Python', 'CSAD Model', 'Monte Carlo Simulation', 'Agent-Based Modeling'],
    situation:
      '금융 저널(JBEF, 2026)의 선행 논문이 제시한 CSAD(횡단면 수익률 분산) 기반 집단추종 지표가 "실제 투자자들의 모방 매매 때문인지, 아니면 수학적 모형 자체의 기계적 왜곡인지"에 대한 의문이 들었습니다.',
    task: '선행 논문의 62개 코인 분석 결과를 완벽히 재현한 후, "투자자 간 상호작용(모방 거래)이 전혀 존재하지 않는 순수 무작위 가상시장"을 구축하여 해당 지표가 가짜 신호를 만들어내는지 반증 실험을 설계하는 것이 과제였습니다.',
    action: [
      '선행 논문 재현: CoinMarketCap 62종목 1분봉 데이터를 수집하여 논문에 기록된 음(-)의 회귀 계수를 오차 범위 1% 이내로 재현 성공',
      '영가설 가상시장 에이전트 시뮬레이션: 투자자가 서로를 따라 하지 않고 개별 정보에만 반응하는 가상시장 몬테카를로 시뮬레이션 환경 구축',
      '기계적 유도 수식 규명: 극단적 시장 충격 시 자산 간 변동성 불일치로 인해 집단추종이 없어도 CSAD 계수가 음수로 떨어질 수밖에 없는 수학적 원인 도출',
    ],
    result:
      '집단추종이 전혀 없는 가상시장에서도 선행 논문과 동일한 집단추종 판정 계수가 97~100%의 빈도로 거짓 양성(False Positive)으로 검출됨을 증명. 기존 학계 지표의 맹점을 과학적 시뮬레이션으로 반증해 낸 계량적 비판 사고와 모델 검증 역량 입증.',
    qna: {
      question: '학계의 기존 논문 결과를 의심하게 된 계기는 무엇이었나요?',
      answer:
        'CSAD 공식은 시장 수익률이 급변할 때 종목 간 수익률 분산이 감소하면 집단추종으로 판정합니다. 하지만 자산 간 고유 변동성 차이가 클 때 극단적 시장 충격이 오면, 기계적인 2차 회귀식의 비선형성 때문에 실제 모방 행동이 없어도 계수가 음수로 왜곡될 수 있다는 수식적 이상점을 발견하여 시뮬레이션으로 이를 증명하게 되었습니다.',
    },
  },
];

const QUESTION_MAPPINGS = [
  {
    type: '1. 직무 전문성 / 지원동기',
    best: 'funding-arb-engine (선물 체결 엔진)',
    second: 'crypto-order-flow (주문흐름 동조화)',
    keywords: '실전 거래소 API 연동, 양방향 헤징, 마켓 마이크로스트럭처, CS 기본기',
    pitch:
      '이론에 머무르지 않고 실제 24시간 가동되는 거래 체결 엔진과 틱 데이터 파이프라인을 직접 구현해 본 실전 엔지니어링 역량을 강조합니다.',
  },
  {
    type: '2. 기술적 문제해결 / 트러블슈팅',
    best: 'funding-arb-engine (한쪽 체결 불균형 복구)',
    second: 'mirae-asset-dart (단위 오적용·정정공시 계보)',
    keywords: '네트워크 장애 복구, State Recovery, Decimal 정밀 계산, 결정적 청킹',
    pitch:
      '단순히 코드를 짜는 것을 넘어, 네트워크 단절이나 데이터 형식 불일치 등 극단적 예외 상황을 어떻게 선제적으로 방어했는지 구체적인 사례를 어필합니다.',
  },
  {
    type: '3. 데이터 분석 / 연구 및 통계 검증',
    best: 'crypto-herding-research (집단추종 반증)',
    second: 'crypto-order-flow (동조화 실증)',
    keywords: 'p-hacking 방지 사전등록, 가상시장 시뮬레이션, 거래비용 감안, 잔차화',
    pitch:
      '가짜 백테스팅 수익에 현혹되지 않고, 연구 프로토콜 사전 등록과 거래비용 감안, 가상시장 반증 실험을 거친 엄격한 연구 윤리와 검증 역량을 강조합니다.',
  },
  {
    type: '4. 딥러닝 / AI 모델링 역량',
    best: 'etf-image-alpha-ode (차트 이미지 알파)',
    second: 'mirae-asset-dart (DART 공시 Agent)',
    keywords: '2D CNN 이미지 팩터, Data Leakage 방지 Purge/Embargo, LLM 환각 제어',
    pitch:
      '기존 라이브러리를 단순히 호출하는 수준을 넘어, 미래 참조 편향(Look-Ahead Bias)을 완벽 차단하고 금융 도메인 지식과 결합한 신뢰 가능한 AI 시스템을 구축했음을 피력합니다.',
  },
  {
    type: '5. 팀 협업 / 학회 공동 프로젝트',
    best: 'etf-image-alpha-ode (Find-A 학회 핸드오프)',
    second: 'mirae-asset-dart (미래에셋 AI Festival 팀)',
    keywords: '팀 간 인터페이스(Manifest) 정의, 역할 분담, 모듈화 설계, 산출물 감사',
    pitch:
      '퀀트 학회 Find-A 및 공모전 팀에서 다른 파트(포트폴리오 최적화팀, LLM팀)와 모듈 간 인터페이스를 명확히 정의하고 성공적으로 산출물을 인계한 협업 역량을 보여줍니다.',
  },
  {
    type: '6. 실패 극복 / 한계 인식 및 교훈',
    best: 'crypto-order-flow (수익성 미발견 규명)',
    second: 'crypto-herding (기존 지표의 수학적 결함 발견)',
    keywords: '결과 왜곡 없는 정직성, 실전 거래비용(슬리피지)의 중요성 체득',
    pitch:
      '예상과 다른 결과가 나왔을 때 억지로 짜맞추지 않고, 슬리피지와 수수료라는 현실의 벽을 인정한 뒤 시스템 안정성으로 방향을 전환한 성숙한 태도를 전달합니다.',
  },
];

const INTRO_SCRIPTS = [
  {
    role: '퀀트 리서치 & 자산운용',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    script:
      '안녕하십니까, 데이터의 수학적 엄밀성과 실전 거래비용의 무게를 아는 지원자 고종한입니다. 저는 고려대학교 컴퓨터공학을 전공하고 퀀트 학회 Find-A에서 활동하며, 바이낸스와 OKX의 대용량 틱 데이터와 L2 호가를 분석하여 시장 미시구조의 주문흐름 동조화를 실증했습니다. 또한 학계의 집단추종 논문을 재현하는 데 그치지 않고, 가상시장 시뮬레이션을 통해 기존 지표의 수학적 한계를 직접 반증해 보았습니다. 백테스팅 화면 속 가짜 수익에 현혹되지 않고, Look-Ahead Bias 차단과 거래비용 검증을 거친 견고한 알파를 찾아내는 퀀트 리서처가 되겠습니다.',
  },
  {
    role: '금융IT & 거래시스템 / 백엔드 엔지니어',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    script:
      '안녕하십니까, 24시간 무중단 가동과 결점 없는 장애 복구(State Recovery) 시스템을 직접 설계·검증한 백엔드 엔지니어 고종한입니다. 저는 바이낸스와 OKX 선물거래소 API를 연동한 차익거래 실행 엔진을 개발하며, 급격한 시세 변동 시 발생하는 양방향 체결 불균형을 즉각 헤지하고 네트워크 단절 후에도 잔여 포지션을 안전하게 전수 복구하는 시스템을 구축했습니다. 41개의 단위/회귀 테스트와 24시간 실가동 무결성 검증을 완수한 경험을 바탕으로, 귀사의 거래 플랫폼에서 1ms의 지연과 단 1건의 체결 불일치도 허용하지 않는 견고한 코어 백엔드를 책임지겠습니다.',
  },
  {
    role: '금융 데이터 엔지니어 & AI Agent 엔지니어',
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
    script:
      '안녕하십니까, 금융 도메인의 엄밀한 문맥과 정량 지표를 파이프라인으로 구현해 온 데이터 엔지니어 고종한입니다. 미래에셋증권 AI Festival에서 DART 전자공시 질의응답 Agent를 개발하며, LLM의 환각을 원천 차단하기 위해 단위 바인딩과 정정공시 계보 추적, 표 머리글 보존 청커, Decimal 연산을 파이썬 코드로 제어하는 결정적 파이프라인을 구축했습니다. 대용량 금융 시계열 데이터와 비정형 공시 문서를 왜곡 없이 정제하여 신뢰할 수 있는 데이터 인프라를 만들겠습니다.',
  },
];

export const ResumeCheatsheetView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'projects' | 'mapping' | 'interview'>('projects');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({
    'funding-arb-engine': true,
    'mirae-asset-dart': true,
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 상단 헤더 배너 */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>고종한 (rhwhdgks) 포트폴리오 자소서 치트시트</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              내 경험 & 학회 프로젝트 자소서 저장소
            </h1>
            <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
              고려대학교 컴퓨터공학 전공, 퀀트 학회 Find-A, 선물 체결 엔진 및 DART AI 프로젝트의
              핵심 성과와 STAR 요약을 한눈에 확인하고, 자소서 작성 시 원클릭으로 복사하여 활용하세요.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href="https://github.com/rhwhdgks"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-semibold transition"
            >
              <FolderGit2 className="w-4 h-4" />
              <span>GitHub 바로가기</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-white/10 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'projects'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>프로젝트별 STAR 치트시트 (5선)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mapping')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'mapping'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>자소서 문항별 소재 매핑 표</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('interview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'interview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>1분 자기소개 & 면접 방어 논리</span>
          </button>
        </div>
      </div>

      {/* 탭 1: 프로젝트별 STAR 치트시트 */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {PROJECTS_DATA.map((proj) => {
            const isExpanded = Boolean(expandedProjects[proj.id]);
            const fullStarText = `[${proj.name}]\n- 상황(S): ${proj.situation}\n- 과제(T): ${proj.task}\n- 행동(A):\n${proj.action.map((a) => `  * ${a}`).join('\n')}\n- 성과(R): ${proj.result}`;

            return (
              <div
                key={proj.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-indigo-300 transition"
              >
                {/* 헤더 */}
                <div
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition"
                  onClick={() => toggleExpand(proj.id)}
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${proj.badgeClass}`}
                      >
                        {proj.category}
                      </span>
                      <a
                        href={proj.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 font-mono hover:underline"
                      >
                        <FolderGit2 className="w-3.5 h-3.5" />
                        <span>{proj.repo}</span>
                      </a>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">{proj.name}</h3>
                    <p className="text-xs text-slate-600 line-clamp-1">{proj.summary}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(fullStarText, `full-${proj.id}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-white text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition shadow-2xs"
                    >
                      {copiedId === `full-${proj.id}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">전체 STAR 복사됨!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>전체 STAR 복사</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-slate-600 transition"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 펼쳐졌을 때의 STAR 상세 내용 */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 border-t border-slate-100 space-y-5 bg-white">
                    {/* 기술 스택 칩 */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-400 mr-1">기술 스택:</span>
                      {proj.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* STAR 카드 그리드 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* S: Situation */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 relative group">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Situation (상황)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(proj.situation, `s-${proj.id}`)}
                            className="text-slate-400 hover:text-indigo-600 transition text-xs flex items-center gap-1"
                          >
                            {copiedId === `s-${proj.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                          {proj.situation}
                        </p>
                      </div>

                      {/* T: Task */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 relative group">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Task (과제 및 목표)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(proj.task, `t-${proj.id}`)}
                            className="text-slate-400 hover:text-indigo-600 transition text-xs flex items-center gap-1"
                          >
                            {copiedId === `t-${proj.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                          {proj.task}
                        </p>
                      </div>

                      {/* A: Action */}
                      <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-2 md:col-span-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Action (내가 취한 기술적 해결 행동)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(proj.action.join('\n'), `a-${proj.id}`)
                            }
                            className="text-indigo-500 hover:text-indigo-700 transition text-xs flex items-center gap-1"
                          >
                            {copiedId === `a-${proj.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <ul className="space-y-1.5">
                          {proj.action.map((act, i) => (
                            <li
                              key={i}
                              className="text-xs sm:text-sm text-slate-800 leading-relaxed flex items-start gap-2"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* R: Result */}
                      <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200 space-y-1.5 md:col-span-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Result (정량적 성과 및 입증된 역량)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(proj.result, `r-${proj.id}`)}
                            className="text-emerald-600 hover:text-emerald-800 transition text-xs flex items-center gap-1"
                          >
                            {copiedId === `r-${proj.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-emerald-950 leading-relaxed">
                          {proj.result}
                        </p>
                      </div>
                    </div>

                    {/* 면접 Q&A 팁 */}
                    <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1.5">
                      <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px]">
                          면접 빈출 질문
                        </span>
                        <span>{proj.qna.question}</span>
                      </div>
                      <p className="text-xs text-amber-950 leading-relaxed pl-2 border-l-2 border-amber-300">
                        {proj.qna.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 탭 2: 자소서 문항별 소재 매핑 표 */}
      {activeTab === 'mapping' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              자소서 단골 문항별 최적 소재 가이드
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              기업 자소서 항목에 따라 가장 어필하기 좋은 프로젝트를 골라 바로 작성하세요.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                    <th className="py-3 px-4">자소서 문항 유형</th>
                    <th className="py-3 px-4">추천 프로젝트 (1순위)</th>
                    <th className="py-3 px-4">추천 프로젝트 (2순위)</th>
                    <th className="py-3 px-4">핵심 어필 포인트</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {QUESTION_MAPPINGS.map((m, idx) => (
                    <tr key={idx} className="hover:bg-indigo-50/30 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {m.type}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-indigo-700">{m.best}</td>
                      <td className="py-3.5 px-4 text-slate-600">{m.second}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 leading-relaxed">
                        <div className="font-medium text-slate-800">{m.keywords}</div>
                        <div className="text-slate-500 mt-0.5">{m.pitch}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 탭 3: 1분 자기소개 & 면접 방어 논리 */}
      {activeTab === 'interview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {INTRO_SCRIPTS.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-extrabold border ${item.badge}`}
                  >
                    {item.role} 1분 자기소개 스크립트
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.script, `script-${idx}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-white text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition"
                  >
                    {copiedId === `script-${idx}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">복사 완료!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>스크립트 복사</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {item.script}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
