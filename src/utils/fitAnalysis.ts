import { OpportunityItem } from '../types';

export interface ProfileMatchAnalysis {
  matchScore: number; // 0 - 100
  targetRole: string; // 추천 직무 분야
  matchLevel: '최적합 (Strong Match)' | '적합 (Good Match)' | '도전 추천 (Challenge)';
  levelBadgeClass: string;
  matchedStrengths: {
    title: string;
    description: string;
    relatedProjects: string[];
  }[];
  missingOrImprove: {
    area: string;
    description: string;
    actionPlan: string;
  }[];
  interviewTip: string;
}

/**
 * 사용자 GitHub 프로필 (고려대 컴퓨터공학 / 퀀트·금융데이터·거래시스템·Python·FastAPI·PyTorch)
 * 기반 공고별 정밀 맞춤 분석 생성 엔진
 */
export function analyzeOpportunityFit(item: OpportunityItem): ProfileMatchAnalysis {
  const combined = `${item.title} ${item.organization} ${item.category} ${item.tags.join(' ')} ${item.summary || ''}`.toUpperCase();

  // 1. 퀀트 / 금융운용 / 파생·채권평가 / 애널리스트
  if (
    combined.includes('운용') ||
    combined.includes('QUANT') ||
    combined.includes('퀀트') ||
    combined.includes('파생') ||
    combined.includes('채권') ||
    combined.includes('애널리스트') ||
    combined.includes('외화채권') ||
    combined.includes('PE') ||
    combined.includes('주식운용') ||
    combined.includes('패시브')
  ) {
    return {
      matchScore: 96,
      targetRole: '퀀트 리서치 & 자산운용 / 금융데이터 분석가',
      matchLevel: '최적합 (Strong Match)',
      levelBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      matchedStrengths: [
        {
          title: '선물 거래 실행 엔진 및 실시간 호가/체결 데이터 분석 경험',
          description:
            '바이낸스·OKX 호가/체결 틱 데이터를 수집하고 시장미시구조(Order Flow) 동조화를 검증한 실전 경험이 금융 데이터 분석 업무에 직결됩니다.',
          relatedProjects: ['funding-arb-engine', 'crypto-order-flow-synchronization'],
        },
        {
          title: 'DART 전자공시 데이터 정량 파싱 및 지표 산출 경험',
          description:
            '기업 공시 기간·단위·정정 이력을 파싱하고 숫자를 연동한 API 개발 경험으로 금융 도메인 이해도가 뛰어납니다.',
          relatedProjects: ['mirae-asset-dart'],
        },
        {
          title: 'Python 금융 통계 및 시계열 수치해석 스택 보유',
          description: 'pandas, NumPy, SciPy를 활용한 정밀한 시계열 통계 검증과 가설 검정 역량을 갖추고 있습니다.',
          relatedProjects: ['crypto-herding-research', 'coinmove'],
        },
      ],
      missingOrImprove: [
        {
          area: '전통 금융/자산운용 이론 (채권·파생상품 수학)',
          description: '채권 듀레이션(Duration), 컨벡시티(Convexity), 이자율 기간구조(Term Structure) 및 블랙-숄즈 옵션 기초 공식에 대한 개념 정리가 필요합니다.',
          actionPlan: '투자자산운용사 또는 CFA Level 1의 주식/채권/파생 핵심 요약본을 복습하여 기술 면접 대비 질문에 대비하세요.',
        },
        {
          area: '재무제표 3대 표(B/S, I/S, C/F) 계정과목 이해',
          description: '자산운용 및 리서치 업무 특성상 기업 재무 비율(PER, PBR, ROE, EBITDA) 해석 능력을 요구할 수 있습니다.',
          actionPlan: 'DART 공시 API 프로젝트 경험과 엮어 실제 재무 지표를 Python으로 계산해 본 경험을 포트폴리오에 강조하세요.',
        },
      ],
      interviewTip:
        '“단순 차트 매매가 아닌, 호가/체결 데이터와 DART 공시 데이터를 엄밀한 통계 검증과 실행 엔진 코드로 구현해 본 컴퓨터공학적 백그라운드”를 일관되게 강조하세요.',
    };
  }

  // 2. 금융IT / 거래시스템 & 핀테크 백엔드 개발자
  if (
    combined.includes('토스') ||
    combined.includes('두나무') ||
    combined.includes('거래시스템') ||
    combined.includes('백엔드') ||
    combined.includes('BACKEND') ||
    combined.includes('서버') ||
    combined.includes('보안인프라') ||
    combined.includes('DATABASE') ||
    combined.includes('IT본부')
  ) {
    return {
      matchScore: 93,
      targetRole: '거래 시스템 백엔드 & 금융IT 엔지니어',
      matchLevel: '최적합 (Strong Match)',
      levelBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      matchedStrengths: [
        {
          title: '거래소 주문 체결 및 장애 복구(State Recovery) 엔진 개발 경험',
          description:
            '거래소 API 연동, 양방향 헤징 주문 체결, 네트워크 중단 후 미체결 포지션 복구 로직을 직접 설계·구현한 경험은 금융 백엔드에서 가장 희소한 강점입니다.',
          relatedProjects: ['funding-arb-engine'],
        },
        {
          title: 'FastAPI + MariaDB 기반 비동기 API 서빙 및 DB 모델링',
          description: 'DART 질의응답 API를 구축하며 대용량 텍스트/데이터 조회와 비동기 처리를 안정적으로 구현했습니다.',
          relatedProjects: ['mirae-asset-dart'],
        },
      ],
      missingOrImprove: [
        {
          area: 'Java / Kotlin / Spring Boot 생태계 지식',
          description: '국내 금융권/핀테크 기업 서버 대다수가 Spring Boot 기반이므로 Java/Kotlin 객체지향 및 스프링 MVC 구조 질문이 나올 수 있습니다.',
          actionPlan: 'FastAPI로 작성했던 API 구조를 Spring Boot의 Controller-Service-Repository 계층 구조와 비교하여 설명할 수 있도록 준비하세요.',
        },
        {
          area: '대용량 메시지 큐 (Kafka, Redis) 및 분산 아키텍처',
          description: '초당 수만 건의 시세 호가 수신을 위한 Redis In-Memory 캐시나 Kafka 이벤트 스트리밍 경험을 우대합니다.',
          actionPlan: '기존 선물 체결 엔진에 Redis 큐를 붙여보거나, Kafka Pub/Sub 아키텍처를 연동한 미니 프로젝트를 깃허브에 추가하면 서류 프리패스 스펙이 됩니다.',
        },
      ],
      interviewTip:
        '“주문 지연(Latency)과 체결 불일치 예외 상황을 어떻게 핸들링했는지”에 대해 funding-arb-engine의 실제 트러블슈팅 사례를 상세히 답변하면 강한 인상을 남길 수 있습니다.',
    };
  }

  // 3. 데이터 엔지니어링 / 데이터 분석가 (DE / DA)
  if (
    combined.includes('데이터분석') ||
    combined.includes('데이터 엔지니어') ||
    combined.includes('데이터엔지니어') ||
    combined.includes('DATA') ||
    combined.includes('수요예측') ||
    combined.includes('인포맥스')
  ) {
    return {
      matchScore: 91,
      targetRole: '데이터 엔지니어 (DE) & 정량 데이터 분석가 (DA)',
      matchLevel: '최적합 (Strong Match)',
      levelBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      matchedStrengths: [
        {
          title: '체결 틱 및 호가 시계열 데이터 파이프라인 전처리 역량',
          description: '비정형/대용량 시계열 금융 데이터를 pandas, NumPy로 고속 전처리하고 분석한 탄탄한 파이프라인 경험.',
          relatedProjects: ['crypto-order-flow-synchronization', 'coinmove'],
        },
        {
          title: '실험적 가설 검증 및 시뮬레이션 설계 능력',
          description: '가상시장 에이전트 실험과 실제 시장 데이터 비교 검증을 통해 지표의 유효성을 통계적으로 검증한 학술적 수준의 리서치 경험.',
          relatedProjects: ['crypto-herding-research'],
        },
      ],
      missingOrImprove: [
        {
          area: '분산 데이터 처리 엔진 (Apache Spark / Airflow)',
          description: '기업의 데이터 파이프라인 실무에서는 배치 스케줄러(Airflow)와 분산 쿼리(Spark/PySpark)가 기본 요건입니다.',
          actionPlan: 'Airflow DAG를 로컬 Docker로 띄워 일일 데이터 수집 파이프라인을 자동화해 본 경험을 추가해 보세요.',
        },
        {
          area: '클라우드 데이터 웨어하우스 (BigQuery, Redshift, Snowflake)',
          description: '온프레미스 MariaDB/SQLite 외에 클라우드 DWH 쿼리 최적화(Partitioning, Clustering) 지식을 보완하면 좋습니다.',
          actionPlan: 'Google Cloud BigQuery 무료 티어에서 공개 금융 데이터셋(공공데이터)을 SQL로 집계해 보는 연습을 추천합니다.',
        },
      ],
      interviewTip:
        '“데이터를 단순히 그리는 것이 아니라, 결측치와 거래비용까지 감안하여 실전에서 진짜 유효한 신호인지를 검증해 본 집요함”을 어필하세요.',
    };
  }

  // 4. AI / 머신러닝 리서치 & LLM / 비전 엔지니어
  if (
    combined.includes('AI') ||
    combined.includes('머신러닝') ||
    combined.includes('딥러닝') ||
    combined.includes('ML') ||
    combined.includes('LLM') ||
    combined.includes('AGENT') ||
    combined.includes('경진대회') ||
    combined.includes('해커톤')
  ) {
    return {
      matchScore: 88,
      targetRole: 'AI/ML 모델링 & AI 플랫폼/Agent 엔지니어',
      matchLevel: '적합 (Good Match)',
      levelBadgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
      matchedStrengths: [
        {
          title: 'PyTorch 기반 비전/시계열 딥러닝 모델링 (ODE/CNN)',
          description: 'ETF 차트 이미지를 시계열/ODE와 결합해 예측 신호를 발굴한 창의적인 PyTorch 모델링 역량을 보유하고 있습니다.',
          relatedProjects: ['etf-image-alpha-ode'],
        },
        {
          title: 'LLM 문서 질의응답 및 RAG 검색 파이프라인 연계',
          description: 'DART 전자공시 문서를 바탕으로 질문에 맞는 근거 문장과 정량 수치를 연결하는 API 파이프라인 개발 경험.',
          relatedProjects: ['mirae-asset-dart', 'llmgame'],
        },
      ],
      missingOrImprove: [
        {
          area: '대형 언어모델(LLM) 서빙 최적화 (vLLM, TensorRT)',
          description: '최근 AI 플랫폼/백엔드 직무에서는 고비용 GPU를 절약하는 서빙 프레임워크(vLLM, Ollama, PagedAttention) 지식을 높게 평가합니다.',
          actionPlan: 'FastAPI 서버에 vLLM 또는 HuggingFace TGI를 연동해 경량 오픈소스 모델을 로컬 서빙해 본 경험을 기재하세요.',
        },
        {
          area: '벡터 데이터베이스 및 고급 RAG (Reranker, Hybrid Search)',
          description: '단순 검색을 넘어 Dense+Sparse 하이브리드 검색 및 Cross-Encoder 기반 재순위화 기술을 습득하면 차별화됩니다.',
          actionPlan: 'ChromaDB 또는 Qdrant를 이용해 금융 공시 문서 대상 RAG 성능을 벤치마킹한 결과를 포트폴리오에 요약하세요.',
        },
      ],
      interviewTip:
        '“기존 공개 라이브러리를 가져다 쓰기만 한 것이 아니라, 모델의 예측이 과거 데이터 상에서 유의미한 알파를 내는지 수학적/위험 지표로 정밀 검증한 과정”을 부각하세요.',
    };
  }

  // 5. 일반 소프트웨어 / 풀스택 개발
  return {
    matchScore: 84,
    targetRole: 'SW 개발자 (Python/백엔드/풀스택)',
    matchLevel: '적합 (Good Match)',
    levelBadgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    matchedStrengths: [
      {
        title: '고려대 컴퓨터공학 전공의 탄탄한 CS 기본기',
        description: '자료구조, 알고리즘(BOJ 문제풀이), 운영체제(Linux), 네트워크에 대한 깊이 있는 기초 지식을 보유하고 있습니다.',
        relatedProjects: ['algorithm-study', 'BOJ-study'],
      },
      {
        title: '실제 동작하는 프로덕션급 토이/연구 시스템 완성 경험',
        description: '설계부터 비동기 API 서빙, DB 스키마, 장애 복구까지 E2E 시스템을 직접 구현한 경험.',
        relatedProjects: ['funding-arb-engine', 'mirae-asset-dart'],
      },
    ],
    missingOrImprove: [
      {
        area: '프론트엔드 및 CI/CD 인프라 보완',
        description: 'React, TypeScript, Docker 컨테이너 오케스트레이션 및 GitHub Actions CI/CD 경험을 좀 더 보완하면 풀스택 역량이 완성됩니다.',
        actionPlan: '현재 구축한 CareerRadar 웹 프로젝트(React + Vite + Tailwind + GitHub Actions 자동화) 경험을 이력서에 추가하세요.',
      },
    ],
    interviewTip: '컴퓨터공학 전공자로서 문제 해결 능력과 복잡한 금융 도메인을 코드로 풀어내는 집요함을 어필하세요.',
  };
}
