import { OpportunityItem } from '../types';

export interface ProfileMatchAnalysis {
  matchScore: number; // 0 - 100 (엄격 평가: 최고점도 70점대 후반~80점 내외)
  targetRole: string; // 추천 직무 분야
  matchLevel:
    | '최적합 (Strong Match)'
    | '적합 (Good Match)'
    | '보통 (Moderate)'
    | '스택 불일치 (Low Match)';
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
 * 사용자 GitHub 프로필 (고려대 컴퓨터공학 / 퀀트·금융데이터·선물체결엔진·Python·FastAPI·PyTorch)
 * 기반 공고별 현실적이고 엄격한("짜게") 정밀 맞춤 분석 엔진
 */
export function analyzeOpportunityFit(item: OpportunityItem): ProfileMatchAnalysis {
  const title = (item.title || '').toUpperCase();
  const org = (item.organization || '').toUpperCase();
  const tagsStr = (item.tags || []).join(' ').toUpperCase();
  const summaryStr = (item.summary || '').toUpperCase();
  const combined = `${title} ${org} ${item.category} ${tagsStr} ${summaryStr}`;

  // -------------------------------------------------------------
  // 0. 치명적 스택 불일치 (.NET, C#, 3D GUI, 모바일 네이티브, 단순 홍보/서포터즈)
  // -------------------------------------------------------------
  const isDotNet = /\.NET|\bC#\b|ASP\.NET/.test(combined);
  const is3DGui = /3D\s*GUI|OPENGL|UNITY|UNREAL/.test(combined);
  const isMobile = /\bIOS\b|\bSWIFT\b|\bANDROID\b|\bFLUTTER\b/.test(title);
  const isPureMarketing = /서포터즈|기자단|마케터|콘텐츠\s*에디터/.test(combined);

  if (isDotNet || is3DGui || isMobile || isPureMarketing) {
    let unmatchDesc = '.NET / C# 주력 생태계';
    let targetRole = '타 언어(.NET/C#) 개발 (스택 불일치)';
    let score = 38;

    if (is3DGui) {
      unmatchDesc = '3D 그래픽스 / GUI 툴체인';
      targetRole = '3D 그래픽스/GUI 개발 (스택 불일치)';
      score = 40;
    } else if (isMobile) {
      unmatchDesc = '모바일 앱(iOS/Android) 전용 스택';
      targetRole = '모바일 앱 개발 (스택 불일치)';
      score = 42;
    } else if (isPureMarketing) {
      unmatchDesc = '비개발 마케팅/홍보 직무';
      targetRole = '비개발 / 홍보·서포터즈 (비추천)';
      score = 30;
    }

    return {
      matchScore: score,
      targetRole,
      matchLevel: '스택 불일치 (Low Match)',
      levelBadgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
      matchedStrengths: [
        {
          title: '기초 컴퓨터공학 및 알고리즘 베이스',
          description:
            '고려대 컴공 전공자로서의 자료구조/알고리즘 기본기는 유효하나, 해당 공고의 주력 언어/도메인과 정면 배치됩니다.',
          relatedProjects: ['algorithm-study'],
        },
      ],
      missingOrImprove: [
        {
          area: `요구 핵심 기술스택과의 직접적 불일치 (${unmatchDesc})`,
          description: `공고에서 필수로 요구하는 주력 기술(${unmatchDesc})이 현재 보유하신 주력 스택(Python/FastAPI/PyTorch/데이터 파이프라인)과 상이하여 서류 통과 가능성이 극히 낮습니다.`,
          actionPlan:
            '새로운 언어나 그래픽스 툴을 처음부터 학습하기보다는, 본인의 압도적 강점인 금융 데이터·체결 엔진·Python 백엔드 포지션에 집중 지원하시는 것을 강력히 권장합니다.',
        },
      ],
      interviewTip:
        '해당 공고에 지원할 경우 "왜 기존 Python/금융 데이터 전문성 대신 이 언어/스택으로 전향하려 하는가"에 대한 납득 가능한 사유를 반드시 준비해야 합니다.',
    };
  }

  // -------------------------------------------------------------
  // 1. 금융 IT / 인프라 / 거래시스템 백엔드 (금융사 IT본부, 거래소, 핀테크, 서버)
  // -------------------------------------------------------------
  const isFinIt =
    /IT본부|보안인프라|거래시스템|코어뱅킹|원장|체결/.test(combined) ||
    (/(토스|두나무|업비트|빗썸|증권|자산운용|은행|카드)/.test(combined) &&
      /(백엔드|BACKEND|서버|SERVER|인프라|INFRA|보안)/.test(combined));

  if (isFinIt) {
    const hasFastApiOrPython = /PYTHON|FASTAPI|MARIADB|SQL/.test(combined);
    const score = hasFastApiOrPython ? 73 : 69;

    return {
      matchScore: score,
      targetRole: '금융IT & 거래인프라 / 백엔드 엔지니어',
      matchLevel: '적합 (Good Match)',
      levelBadgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
      matchedStrengths: [
        {
          title: '거래소 주문 체결 및 장애 복구(State Recovery) 엔진 개발 경험',
          description:
            '거래소 API 연동, 양방향 헤징 주문 체결, 네트워크 중단 후 미체결 포지션 복구 로직을 직접 설계·구현한 실전 경험은 금융 백엔드에서 가장 희소한 강점입니다.',
          relatedProjects: ['funding-arb-engine'],
        },
        {
          title: 'FastAPI + MariaDB 기반 비동기 API 서빙 및 DB 모델링',
          description:
            'DART 질의응답 API를 구축하며 대용량 텍스트/데이터 조회와 비동기 처리를 안정적으로 구현했습니다.',
          relatedProjects: ['mirae-asset-dart'],
        },
      ],
      missingOrImprove: [
        {
          area: 'Java / Kotlin / Spring Boot 생태계 지식 (서류 감점 요인)',
          description:
            '국내 대다수 금융/핀테크 엔터프라이즈 서버는 Spring Boot 기반이므로, Python 위주 포트폴리오 시 서류 감점 요인이 될 수 있습니다.',
          actionPlan:
            'FastAPI로 작성했던 비동기 구조를 Spring Boot의 Controller-Service-Repository 계층 구조 및 JPA와 1:1 비교하여 설명할 수 있도록 기술 면접을 준비하세요.',
        },
        {
          area: '대용량 메시지 큐 (Kafka, Redis) 및 분산 아키텍처',
          description:
            '초당 수만 건의 시세 호가 수신을 위한 Redis In-Memory 캐시나 Kafka 이벤트 스트리밍 경험을 우대합니다.',
          actionPlan:
            '기존 선물 체결 엔진에 Redis 큐를 붙여보거나, Kafka Pub/Sub 아키텍처를 연동한 미니 프로젝트를 깃허브에 추가하면 합격률이 급상승합니다.',
        },
      ],
      interviewTip:
        '“주문 지연(Latency)과 체결 불일치 예외 상황을 어떻게 핸들링했는지”에 대해 funding-arb-engine의 실제 트러블슈팅 사례를 상세히 답변하면 강한 인상을 남길 수 있습니다.',
    };
  }

  // -------------------------------------------------------------
  // 2. 퀀트 / 운용 / 채권·파생평가 / 금융데이터 리서치
  // -------------------------------------------------------------
  const isQuant =
    /QUANT|퀀트|주식운용|채권운용|외화채권|파생상품|파생|자산평가|신용평가|\bPE\b|PE본부|사모펀드|애널리스트/.test(
      combined
    ) ||
    (/(자산운용|투자자문|투자운용)/.test(combined) &&
      !/(디자인|마케팅|총무)/.test(combined));

  if (isQuant) {
    const hasPythonData = /PYTHON|데이터|시계열|계량|통계/.test(combined);
    const score = hasPythonData ? 82 : 78;

    return {
      matchScore: score,
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
          description:
            'pandas, NumPy, SciPy를 활용한 정밀한 시계열 통계 검증과 가설 검정 역량을 갖추고 있습니다.',
          relatedProjects: ['crypto-herding-research', 'coinmove'],
        },
      ],
      missingOrImprove: [
        {
          area: '전통 금융/자산운용 이론 (채권·파생상품 수학)',
          description:
            '채권 듀레이션(Duration), 컨벡시티(Convexity), 이자율 기간구조(Term Structure) 및 블랙-숄즈 옵션 기초 공식에 대한 개념 정리가 필요합니다.',
          actionPlan:
            '투자자산운용사 또는 CFA Level 1의 주식/채권/파생 핵심 요약본을 복습하여 기술 면접 대비 질문에 대비하세요.',
        },
        {
          area: '재무제표 3대 표(B/S, I/S, C/F) 계정과목 이해',
          description:
            '자산운용 및 리서치 업무 특성상 기업 재무 비율(PER, PBR, ROE, EBITDA) 해석 능력을 요구할 수 있습니다.',
          actionPlan:
            'DART 공시 API 프로젝트 경험과 엮어 실제 재무 지표를 Python으로 계산해 본 경험을 포트폴리오에 강조하세요.',
        },
      ],
      interviewTip:
        '“단순 차트 매매가 아닌, 호가/체결 데이터와 DART 공시 데이터를 엄밀한 통계 검증과 실행 엔진 코드로 구현해 본 컴퓨터공학적 백그라운드”를 일관되게 강조하세요.',
    };
  }

  // -------------------------------------------------------------
  // 3. 데이터 엔지니어링 / 정량 데이터 분석 (DE / DA)
  // -------------------------------------------------------------
  const isData =
    /데이터\s*분석|데이터\s*엔지니어|DATA\s*ANALYST|DATA\s*ENGINEER|수요예측|인포맥스/.test(
      combined
    );

  if (isData) {
    const hasPython = /PYTHON|시계열/.test(combined);
    const score = hasPython ? 72 : 67;

    return {
      matchScore: score,
      targetRole: '데이터 엔지니어 (DE) & 정량 데이터 분석가 (DA)',
      matchLevel: '적합 (Good Match)',
      levelBadgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
      matchedStrengths: [
        {
          title: '체결 틱 및 호가 시계열 데이터 파이프라인 전처리 역량',
          description:
            '비정형/대용량 시계열 금융 데이터를 pandas, NumPy로 고속 전처리하고 분석한 탄탄한 파이프라인 경험.',
          relatedProjects: ['crypto-order-flow-synchronization', 'coinmove'],
        },
        {
          title: '실험적 가설 검증 및 시뮬레이션 설계 능력',
          description:
            '가상시장 에이전트 실험과 실제 시장 데이터 비교 검증을 통해 지표의 유효성을 통계적으로 검증한 학술적 수준의 리서치 경험.',
          relatedProjects: ['crypto-herding-research'],
        },
      ],
      missingOrImprove: [
        {
          area: '분산 데이터 처리 엔진 (Apache Spark / Airflow) 실무 부재',
          description:
            '기업의 데이터 파이프라인 실무에서는 배치 스케줄러(Airflow)와 분산 쿼리(Spark/PySpark)가 필수 요건입니다.',
          actionPlan:
            'Airflow DAG를 로컬 Docker로 띄워 일일 데이터 수집 파이프라인을 자동화해 본 경험을 추가해 보세요.',
        },
        {
          area: '클라우드 데이터 웨어하우스 (BigQuery, Redshift, Snowflake)',
          description:
            '온프레미스 MariaDB/SQLite 외에 클라우드 DWH 쿼리 최적화(Partitioning, Clustering) 지식을 보완하면 좋습니다.',
          actionPlan:
            'Google Cloud BigQuery 무료 티어에서 공개 금융 데이터셋(공공데이터)을 SQL로 집계해 보는 연습을 추천합니다.',
        },
      ],
      interviewTip:
        '“데이터를 단순히 그리는 것이 아니라, 결측치와 거래비용까지 감안하여 실전에서 진짜 유효한 신호인지를 검증해 본 집요함”을 어필하세요.',
    };
  }

  // -------------------------------------------------------------
  // 4. AI / 머신러닝 리서치 & LLM / 비전 엔지니어
  // -------------------------------------------------------------
  const isAi =
    /\bAI\b|머신러닝|딥러닝|\bML\b|\bLLM\b|AGENT|경진대회|해커톤|YOLO|VISION/.test(
      combined
    );

  if (isAi) {
    if (/RUNTIME|반도체|SYSTEMS\s*RUNTIME|\bC\+\+\b/.test(combined)) {
      return {
        matchScore: 56,
        targetRole: 'AI 시스템 런타임 엔지니어 (C++ 필요)',
        matchLevel: '보통 (Moderate)',
        levelBadgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        matchedStrengths: [
          {
            title: '딥러닝 모델 아키텍처 및 PyTorch 수식 이해도',
            description: 'PyTorch 신경망 설계 및 수치 미분/시계열 연산 기본기 보유.',
            relatedProjects: ['etf-image-alpha-ode'],
          },
        ],
        missingOrImprove: [
          {
            area: 'C/C++ 하드웨어 가속 및 런타임 컴파일러 지식 부재',
            description:
              '시스템 반도체/런타임 직무는 CUDA, TensorRT, TVM, C++20 기반 저수준 메모리 최적화를 강도 높게 요구합니다.',
            actionPlan:
              'C++ 런타임 엔지니어링으로 전향하기보다는 Python 기반 모델링 및 RAG 서빙 직무에 집중하는 것이 유리합니다.',
          },
        ],
        interviewTip: '컴퓨터공학 운영체제 및 컴퓨터구조 기초 지식을 강조하세요.',
      };
    }

    const hasPythonOrVision = /PYTHON|PYTORCH|시계열/.test(combined);
    const score = hasPythonOrVision ? 65 : 61;

    return {
      matchScore: score,
      targetRole: 'AI/ML 모델링 & AI 에이전트 엔지니어',
      matchLevel: score >= 65 ? '적합 (Good Match)' : '보통 (Moderate)',
      levelBadgeClass:
        score >= 65
          ? 'bg-blue-100 text-blue-800 border-blue-300'
          : 'bg-amber-100 text-amber-800 border-amber-300',
      matchedStrengths: [
        {
          title: 'PyTorch 기반 비전/시계열 딥러닝 모델링 (ODE/CNN)',
          description:
            'ETF 차트 이미지를 시계열/ODE와 결합해 예측 신호를 발굴한 창의적인 PyTorch 모델링 역량을 보유하고 있습니다.',
          relatedProjects: ['etf-image-alpha-ode'],
        },
        {
          title: 'LLM 문서 질의응답 및 RAG 검색 파이프라인 연계',
          description:
            'DART 전자공시 문서를 바탕으로 질문에 맞는 근거 문장과 정량 수치를 연결하는 API 파이프라인 개발 경험.',
          relatedProjects: ['mirae-asset-dart', 'llmgame'],
        },
      ],
      missingOrImprove: [
        {
          area: '대형 언어모델(LLM) 서빙 최적화 (vLLM, TensorRT)',
          description:
            '최근 AI 플랫폼/백엔드 직무에서는 고비용 GPU를 절약하는 서빙 프레임워크(vLLM, Ollama, PagedAttention) 지식을 높게 평가합니다.',
          actionPlan:
            'FastAPI 서버에 vLLM 또는 HuggingFace TGI를 연동해 경량 오픈소스 모델을 로컬 서빙해 본 경험을 기재하세요.',
        },
        {
          area: '벡터 데이터베이스 및 고급 RAG (Reranker, Hybrid Search)',
          description:
            '단순 검색을 넘어 Dense+Sparse 하이브리드 검색 및 Cross-Encoder 기반 재순위화 기술을 습득하면 차별화됩니다.',
          actionPlan:
            'ChromaDB 또는 Qdrant를 이용해 금융 공시 문서 대상 RAG 성능을 벤치마킹한 결과를 포트폴리오에 요약하세요.',
        },
      ],
      interviewTip:
        '“기존 공개 라이브러리를 가져다 쓰기만 한 것이 아니라, 모델의 예측이 과거 데이터 상에서 유의미한 알파를 내는지 수학적/위험 지표로 정밀 검증한 과정”을 부각하세요.',
    };
  }

  // -------------------------------------------------------------
  // 5. 일반 백엔드 / 웹 소프트웨어 엔지니어
  // -------------------------------------------------------------
  const isGeneralBackend =
    /백엔드|BACKEND|서버|SERVER|풀스택|FULLSTACK|웹\s*개발|소프트웨어/.test(combined);

  if (isGeneralBackend) {
    const hasPythonFastApi = /PYTHON|FASTAPI/.test(combined);
    const score = hasPythonFastApi ? 54 : 48;

    return {
      matchScore: score,
      targetRole: '일반 백엔드 / SW 엔지니어',
      matchLevel: score >= 50 ? '보통 (Moderate)' : '스택 불일치 (Low Match)',
      levelBadgeClass:
        score >= 50
          ? 'bg-amber-100 text-amber-800 border-amber-300'
          : 'bg-slate-100 text-slate-700 border-slate-300',
      matchedStrengths: [
        {
          title: '고려대 컴퓨터공학 전공의 탄탄한 CS 기본기',
          description:
            '자료구조, 알고리즘(BOJ 문제풀이), 운영체제(Linux), 네트워크에 대한 깊이 있는 기초 지식을 보유하고 있습니다.',
          relatedProjects: ['algorithm-study', 'BOJ-study'],
        },
        {
          title: '실제 동작하는 프로덕션급 토이/연구 시스템 완성 경험',
          description:
            '설계부터 비동기 API 서빙, DB 스키마, 장애 복구까지 E2E 시스템을 직접 구현한 경험.',
          relatedProjects: ['funding-arb-engine', 'mirae-asset-dart'],
        },
      ],
      missingOrImprove: [
        {
          area: '기업 특정 프레임워크 및 실무 협업 인프라 보완',
          description:
            '일반 웹/SW 채용에서는 대규모 트래픽 처리 경험이나 React, Spring Boot, CI/CD 배포 파이프라인 경험을 요구합니다.',
          actionPlan:
            '현재 구축한 CareerRadar 웹 프로젝트(React + Vite + Tailwind + GitHub Actions 자동화) 경험을 이력서에 기재하여 실무 감각을 어필하세요.',
        },
      ],
      interviewTip:
        '컴퓨터공학 전공자로서 문제 해결 능력과 복잡한 금융 도메인을 코드로 풀어내는 집요함을 어필하세요.',
    };
  }

  // -------------------------------------------------------------
  // 6. 기타 일반 IT 직무
  // -------------------------------------------------------------
  return {
    matchScore: 46,
    targetRole: '일반 개발 / IT 직무',
    matchLevel: '스택 불일치 (Low Match)',
    levelBadgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    matchedStrengths: [
      {
        title: '컴퓨터공학 전공 베이스',
        description: '자료구조, 알고리즘, 프로그래밍 언어 기초 역량.',
        relatedProjects: ['algorithm-study'],
      },
    ],
    missingOrImprove: [
      {
        area: '해당 직무 요구 기술스택 및 도메인 경험 부족',
        description:
          '공고에서 요구하는 도메인 및 언어가 현재 보유한 핵심 금융/데이터/파이썬 역량과 거리가 있습니다.',
        actionPlan:
          '포트폴리오와의 매칭도가 높은 퀀트/금융IT/데이터 분석 포지션에 우선 지원하세요.',
      },
    ],
    interviewTip: '컴퓨터공학 전공자로서의 빠른 학습 능력과 문제 해결 역량을 어필하세요.',
  };
}
