import React, { useState } from 'react';
import {
  Copy,
  Check,
  FolderGit2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Wrench,
  HelpCircle,
  FileText,
  AlertTriangle,
} from 'lucide-react';

interface ProjectStructure {
  id: string;
  title: string;
  repo: string;
  repoUrl: string;
  category: string;
  motivation: string;
  summary: string;
  risksAndSolutions: {
    risk: string;
    solution: string;
  }[];
  limitations: string;
}

const PROJECTS_STRUCTURED: ProjectStructure[] = [
  {
    id: 'funding-arb-engine',
    title: '바이낸스·OKX 선물 체결 엔진',
    repo: 'rhwhdgks/funding-arb-engine',
    repoUrl: 'https://github.com/rhwhdgks/funding-arb-engine',
    category: '거래시스템 백엔드 · 선물 거래 실행',
    motivation:
      '선물거래소 간 펀딩비 차이로 무위험 차익을 노릴 수 있다는 아이디어는 많지만, 실제 주문을 넣으면 체결 시차와 슬리피지로 인해 한쪽만 체결되는 위험이 큽니다. 이론이 아닌 실제 시장에서 24시간 안정적으로 양방향 주문을 집행하고 위험을 관리할 수 있는 무중단 실행 시스템이 필요해 직접 개발을 시작했습니다.',
    summary:
      '바이낸스와 OKX 선물 REST API 및 WebSocket을 연동하여, 양방향 포지션을 한 쌍(Pair)으로 관리하고 주문 집행, 펀딩비 수집, 비상 청산, 계좌 상태 복구를 자동으로 수행하는 Python 비동기 실행 엔진입니다. 단위/회귀 테스트 41개를 구축하고 24시간 실가동 운영 점검을 완수했습니다.',
    risksAndSolutions: [
      {
        risk: '한쪽 주문만 체결되고 반대쪽 주문이 실패/지연되어 일방적 시장 위험(Leg Risk)에 노출됨',
        solution:
          '1차 체결 확인 즉시 반대 거래소에 시장가/IOC 주문을 집행하고, 0.5초 타임아웃 초과 시 즉각 잔여 주문 취소 및 이미 체결된 수량을 즉시 시장가로 비상 청산(Emergency Unwind)하도록 설계했습니다.',
      },
      {
        risk: '네트워크 단절이나 프로세스 강제 종료 후 메모리의 주문·포지션 상태가 소실됨',
        solution:
          '프로세스 재시작 시 거래소 API로부터 실제 열린 포지션과 주문 내역을 전수 재조회하여 로컬 MariaDB 및 메모리 상태와 1:1 대조·복구하는 State Recovery 복구 파이프라인을 구축했습니다.',
      },
      {
        risk: '과도한 API 요청으로 인한 거래소 IP 차단(Rate Limit)',
        solution:
          '시세·펀딩비 수집기를 별도 비동기 프로세스로 분리하고, 주문 엔진에 토큰 버킷 기반 호출량 제한 및 JSONL 감사 로그 시스템을 적용했습니다.',
      },
    ],
    limitations:
      '24시간 무중단 가동(final_verdict=PASS)과 시스템 안정성은 입증했으나, 전략 자체의 순수익은 펀딩비 변동성과 거래소 수수료(Taker Fee)를 감안했을 때 장기적으로 지속적인 초과수익을 보장하지 못한다는 실전 한계를 확인했습니다.',
  },
  {
    id: 'mirae-asset-dart',
    title: '미래에셋 AI Festival - DART 공시 질의응답 Agent',
    repo: 'rhwhdgks/mirae-asset-dart',
    repoUrl: 'https://github.com/rhwhdgks/mirae-asset-dart',
    category: '금융 AI · DART 공시 Agent',
    motivation:
      '2026 미래에셋증권 AI Festival 공시 과제에 참가하면서, 금융감독원 DART 공시 문서를 일반 LLM RAG에 넣었을 때 표의 단위(원 vs 백만원)를 혼동해 100만 배 틀린 숫자를 내거나 이전 정정 전 공시를 사실처럼 인용하는 치명적인 환각(Hallucination)이 발생하는 것을 보고, 숫자의 엄밀성을 100% 보장하는 공시 Agent를 만들고자 시작했습니다.',
    summary:
      'HyperCLOVA X와 Python을 결합하여, 질문 의도 구조화부터 DART XML 파싱, 표 머리글 보존 청킹, 정정공시 계보 추적, Decimal 연산까지 파이썬 코드가 결정적(Deterministic)으로 통제하여 금융 수치의 100% 무결성을 보장하는 질의응답 API입니다.',
    risksAndSolutions: [
      {
        risk: "문서 상단 표의 '단위: 백만원'이 엉뚱한 본문 표에 적용되어 숫자가 왜곡됨",
        solution:
          '단위의 유효 적용 범위를 바로 다음 표로 엄격히 국소화하는 전용 XML 파서(dart_xml.py)를 개발했습니다.',
      },
      {
        risk: '정정 공시 발생 시 단순 최신 파일로 덮어쓰면 특정 분기 시점의 이력이 깨짐',
        solution:
          '정정 관계와 시점별 유효 관계를 분리하여 그래프 형태로 추적하는 계보 추적기(lineage.py)를 구현해 모호한 후보의 임의 선택을 차단했습니다.',
      },
      {
        risk: '수백 행 대형 재무제표 분할 시 머리글 행과 문맥 위치를 유실함',
        solution:
          '머리글 행을 청크마다 복제 반복하고, Content Hash 검사를 통해 원문 위치를 1:1 보존하는 결정적 청커(chunker.py)를 구축했습니다.',
      },
      {
        risk: '부동소수점 오차로 인한 재무 계산 불일치',
        solution:
          '모든 금융 계산에 Decimal 모듈을 강제하고, 답변 생성 직전 산출 근거를 재검증하여 허위 숫자 출력을 원천 봉쇄했습니다.',
      },
    ],
    limitations:
      '정형화된 재무제표 표는 100% 정확하게 파싱하고 계산하지만, 비정형 서술형 주석에 담긴 복잡한 조건부 계약 조항은 여전히 LLM의 텍스트 해석력에 의존해야 하며, DART 표준 서식이 정착되기 전 과거 공시는 파싱 성공률이 떨어집니다.',
  },
  {
    id: 'camp-molding',
    title: '제6회 KAMP 제조데이터 경진대회 - 사출성형 품질불량 예측',
    repo: 'rhwhdgks/camp-molding',
    repoUrl: 'https://github.com/rhwhdgks/camp-molding',
    category: '제조 AI · 머신러닝 & 시계열 공정 분석',
    motivation:
      '중소벤처기업부 주최 제6회 K-인공지능 제조데이터(KAMP) 경진대회에 참가하여, 플라스틱 사출성형 공정의 센서 데이터(온도, 압력, 시간 등)로부터 불량을 사전에 예측하고, 한정된 검사 리소스 환경에서 어떤 샷(Shot)을 우선 검사해야 하는지 데이터 기반의 최적 품질 관리 정책을 수립하고자 시작했습니다.',
    summary:
      '사출성형 센서 시계열 데이터로부터 불량 확률을 예측하고, 부품별(CN7, RG3) 맞춤 통계 규칙과 머신러닝(Logistic, CatBoost, GAM, SVM 등)을 비교 검증하여, 전수 검사가 아닌 효율적인 "검사 권고 우선순위 정책"을 산출한 프로젝트입니다.',
    risksAndSolutions: [
      {
        risk: '1번의 사출 샷(Shot)에서 2개 부품(LH/RH)이 생산되는데, 같은 샷이 학습-검증셋으로 쪼개져 공정값을 공유하는 심각한 Data/Group Leakage 발생',
        solution:
          '샷(Shot) 단위의 엄격한 그룹 교차검증(Group K-Fold)을 적용하여, 동일 샷의 부품이 학습셋과 시험셋에 절대 나뉘어 들어가지 않도록 물리적 독립성을 보장했습니다.',
      },
      {
        risk: '장비 노후화 및 운전 조건 변화로 인한 센서 분포 드리프트(Drift)와 극심한 불량 불균형',
        solution:
          '센서 0값 및 조건 외 이상치 필터링, z-score 기반 공정 개념 드리프트 탐지(Grade v2)를 도입하고, 상위 2% 위험 샷 및 비정상 등급 샷에 대해 2단계 차등 검사 정책(전수 검사 vs 우선 캐비티 검사)을 설계했습니다.',
      },
      {
        risk: '모델 개선 수치가 우연한 시드 효과일 가능성',
        solution:
          '모델 변경 시 03_모델 ➔ 05_실험기록 ➔ 잠금 파일 순서로 변경 내역을 동결하고, GAM과 SVM 등 시드별 평균 개선과 후퇴를 투명하게 전수 기록하여 과적합을 방지했습니다.',
      },
    ],
    limitations:
      '동일한 샷에서 나온 좌/우 부품은 센서 공정값을 100% 공유하므로, 센서값만으로는 "왼쪽 부품이 불량인지 오른쪽 부품이 불량인지"를 완벽히 분리해 특정할 수 없으며, 금형 캐비티 자체의 물리적 편차를 모델링하는 데는 한계가 있었습니다.',
  },
  {
    id: 'air-force-hackathon',
    title: '제7회 공군 창의·혁신 해커톤 - 무단투기 감지 및 쓰레기통 최적 배치',
    repo: 'rhwhdgks/Air-Force-Hackathon',
    repoUrl: 'https://github.com/rhwhdgks/Air-Force-Hackathon',
    category: 'Computer Vision · 공간정보 GIS & 최적화',
    motivation:
      '제7회 공군 창의·혁신 아이디어 공모 해커톤 지정공모 과제("깨끗한 거리 조성을 위한 쓰레기 무단투기 감소 대책")에 참가하여, 사후 민원 처리와 인력 순찰에 의존하던 기존 단속 체계를 혁신하고, CCTV AI 영상 분석과 공간정보 데이터를 결합해 한정된 예산 내에서 쓰레기통 최적 입지를 도출하고자 시작했습니다.',
    summary:
      'YOLOv8 기반 실시간 CCTV 무단투기 객체 탐지 + 강남구 공간정보(유동인구, POI, 도로, 단속 이력) 기반 무단투기량 회귀 예측(Multi-Scale Regression/Random Forest) + K-Means / Greedy / 1·2-Swap 휴리스틱 쓰레기통 최적 배치 알고리즘 + Flask/Leaflet 기반 실시간 대시보드 및 SSE 스트리밍 시각화를 결합한 통합 플랫폼입니다.',
    risksAndSolutions: [
      {
        risk: '수천 개 격자 후보지에 대해 전역 최적해를 구하려 하면 연산량이 폭증해 실시간 시뮬레이션 불가 (조합 폭발)',
        solution:
          '1차로 K-Means 군집화를 통해 후보 지역을 압축한 뒤, 커버리지 한계수익(Marginal Gain) 기준 Greedy 탐색과 1·2-Swap 국소 교환 휴리스틱을 결합하여 수 초 내에 최적 입지안을 도출했습니다.',
      },
      {
        risk: '대규모 공간정보 시뮬레이션 연산 중 웹 화면이 멈추거나 진행률을 알 수 없음',
        solution:
          'Flask 백엔드에서 SSE(Server-Sent Events) 스트리밍 엔드포인트를 구축하여, 최적화 진행률과 지도 오버레이 갱신 데이터를 브라우저에 끊김 없이 실시간 전달했습니다.',
      },
      {
        risk: '단순 통계 데이터와 현장 단속 데이터 간의 공간적 스케일 불일치',
        solution:
          '50m 격자 단위로 공간 데이터를 리샘플링하고, PostGIS 기반 공간 인덱싱을 통해 인접 쓰레기통과의 거리 및 유동인구 밀도를 통합 변수화했습니다.',
      },
    ],
    limitations:
      '알고리즘이 산출한 최적 입지라도 실제 현장에서는 상가 앞 설치 기피 민원, 지자체 도로 점용 조례, 청소차 수거 동선 등 비수학적 행정 규제가 존재하므로, 현장 실사와 행정 협의가 병행되어야 한다는 정책적 한계를 확인했습니다.',
  },
  {
    id: 'etf-image-alpha-ode',
    title: 'ETF 차트 이미지 예측 연구 (Find-A 학회)',
    repo: 'rhwhdgks/etf-image-alpha-ode',
    repoUrl: 'https://github.com/rhwhdgks/etf-image-alpha-ode',
    category: '퀀트 리서치 · 비전/시계열 딥러닝',
    motivation:
      '퀀트 학회 Find-A에서 "가격 차트를 2D 이미지로 보면 단순 숫자 시계열만 볼 때보다 ETF 간 상대적 수익률 순위를 더 잘 예측할 수 있는가?"라는 의문을 과학적으로 검증하고, 학회 내 포트폴리오 최적화 팀(Neural ODE)에 전달할 신호와 공분산을 산출하기 위해 시작했습니다.',
    summary:
      '7개 주요 ETF의 60거래일 OHLCV를 2D 캔들 차트 이미지로 변환한 뒤 2D CNN으로 특징을 추출하여, 향후 20거래일 뒤 수익률 순위 신호 mu(t)와 공분산 행렬 Sigma(t)를 산출한 연구입니다. Walk-Forward 분석과 Purge/Embargo를 적용해 미래 정보 유출을 차단했습니다.',
    risksAndSolutions: [
      {
        risk: '20일 예측 구간 겹침으로 인해 미래 데이터가 과거 학습에 섞여 들어가는 Data Leakage(Look-Ahead Bias)',
        solution:
          '시간 순서를 보존한 Walk-Forward 교차검증을 적용하고, Fold 경계마다 Purge(앞뒤 삭제) 및 Embargo(유예 기간)를 엄격히 강제하여 미래 정보 유출을 원천 봉쇄했습니다.',
      },
      {
        risk: '시장 전체가 올라서 맞춘 것인데 차트 이미지 덕분이라고 착각하는 공통 요인 왜곡',
        solution:
          '시장 베타를 회귀분석으로 걷어낸 순수 잔차 이미지 팩터를 추출하여 독립적인 추가 예측력을 통계적으로 검증했습니다.',
      },
      {
        risk: '적은 표본으로 인해 공분산 행렬 Sigma(t)가 불안정해지고 역행렬이 발산하는 문제',
        solution:
          'Ledoit-Wolf Shrinkage 기법을 적용하여 수치적으로 안정적인 공분산 행렬을 생성했습니다.',
      },
      {
        risk: '학회 내 최적화 팀과의 데이터 규격 불일치로 인한 연동 오류',
        solution:
          '칼럼 명, 날짜 포맷, 결측치 처리 규칙을 명시한 Handoff Manifest 스키마를 정의하여 팀 간 인터페이스를 표준화했습니다.',
      },
    ],
    limitations:
      '20거래일 뒤 수익률을 예측하므로 인접한 평가 구간의 결과가 겹치며, 이미지 특징의 일부 개선 효과는 확실한 초과수익이라기보다는 추가 연구가 필요한 약한 신호에 가깝다는 점을 보고서에 명확히 기록했습니다.',
  },
  {
    id: 'crypto-order-flow',
    title: '코인 주문흐름(Order Flow) 동조화 연구',
    repo: 'rhwhdgks/crypto-order-flow-synchronization',
    repoUrl: 'https://github.com/rhwhdgks/crypto-order-flow-synchronization',
    category: '마켓 마이크로스트럭처 · L2 호가/틱 데이터',
    motivation:
      '여러 코인이 동시에 급등락할 때 단순히 가격만 따라 움직이는 것인지, 아니면 거래소 전체에서 체결 압력(Order Flow) 자체가 한꺼번에 같은 방향으로 쏠리는지 규명하고자 시작했습니다.',
    summary:
      '바이낸스와 OKX 7개 코인의 틱(AggTrades) 및 L2 호가 데이터를 수집하고 가격 변동 효과를 회귀로 제거한 뒤, 사전 등록된 연구 설계 하에서 주문흐름 간의 동조화를 검증한 연구입니다.',
    risksAndSolutions: [
      {
        risk: '결과를 본 뒤 가설을 끼워맞추는 연구자 사후 편향(p-hacking)',
        solution:
          '분석 전 가설, 기간, 자산, 판정 기준을 담은 Research Protocol을 작성하고 SHA 해시로 봉인(Seal)한 뒤 분석을 집행했습니다.',
      },
      {
        risk: '단순 시장 급등락이나 거래량 충격으로 인한 겉보기 상관관계 착시',
        solution:
          '가격 변화율과 거래량 효과를 선형 회귀로 걷어낸 순수 잔차 주문흐름(Residual Order Flow)을 도출하여 상관분석을 수행했습니다.',
      },
      {
        risk: '단일 거래소(바이낸스)의 특수 현상일 가능성',
        solution:
          '완전히 다른 거래소인 OKX 데이터 및 연구에 쓰지 않은 미래 기간에 대해 외부 타당성(External Validation) 교차 검증을 완수했습니다.',
      },
    ],
    limitations:
      '7개 코인 간 주문흐름 동조화(상관계수 0.14)는 통계적으로 입증했으나, 이를 이용한 시차 추종 매매 전략은 슬리피지와 거래소 수수료를 반영하자마자 초과수익이 0으로 소멸되었습니다. 통계적 유의성이 곧바로 실행 가능한 돈이 되지 않는다는 금융의 본질적 한계를 확인했습니다.',
  },
  {
    id: 'crypto-herding',
    title: '암호화폐 집단추종(Herding) 지표 반증 연구',
    repo: 'rhwhdgks/crypto-herding-research',
    repoUrl: 'https://github.com/rhwhdgks/crypto-herding-research',
    category: '계량 금융 리서치 · 통계 시뮬레이션',
    motivation:
      '유명 금융 저널(JBEF) 선행 논문이 코인 가격 분산이 줄어들면 "투자자들이 서로를 따라 모방 매매(집단추종)했다"고 주장했는데, "과연 이게 진짜 사람의 심리일까, 아니면 수식 자체의 기계적 왜곡일까?"라는 계량적 의문에서 시작했습니다.',
    summary:
      '62개 코인 1분봉 데이터로 선행 논문의 CSAD 회귀 모형을 재현하고, 투자자가 서로를 전혀 모방하지 않는 독립 에이전트 가상시장을 몬테카를로 시뮬레이션으로 구축하여 지표의 유효성을 검증한 연구입니다.',
    risksAndSolutions: [
      {
        risk: '기존 학계 논문의 계량 수식이 복잡하여 내 재현 코드가 틀렸을 가능성',
        solution:
          '논문과 동일한 데이터셋으로 회귀식을 돌려 논문 계수와 99% 일치하게 재현함으로써 검증 베이스라인을 확립했습니다.',
      },
      {
        risk: '실제 시장 데이터만으로는 투자자 개개인의 의도(진짜 따라 했는지)를 관찰할 수 없음',
        solution:
          '모방이 0%인 순수 무작위 가상시장(Null Market)을 코드로 구현하여 반증 실험을 설계했습니다.',
      },
    ],
    limitations:
      '모방이 전혀 없는 가상시장에서도 97~100% 빈도로 논문과 똑같은 집단추종 음(-)의 계수가 나타남을 밝혀내어 기존 지표의 수학적 결함을 규명했으나, 이를 대체할 새로운 대안 지표를 완성하기까지는 추가 연구가 필요합니다.',
  },
];

export const ResumeCheatsheetView: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    'funding-arb-engine': true,
    'mirae-asset-dart': true,
    'camp-molding': true,
    'air-force-hackathon': true,
    'etf-image-alpha-ode': false,
    'crypto-order-flow': false,
    'crypto-herding': false,
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatFullProjectText = (p: ProjectStructure) => {
    const risksText = p.risksAndSolutions
      .map((r, i) => `  [위험 ${i + 1}] ${r.risk}\n  ➔ [해결] ${r.solution}`)
      .join('\n');

    return `[${p.title}]\n\n1. 계기:\n${p.motivation}\n\n2. 요약:\n${p.summary}\n\n3. 위험상황 및 해결한 방법:\n${risksText}\n\n4. 한계:\n${p.limitations}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 상단 헤더 배너 */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
              <FileText className="w-3.5 h-3.5" />
              <span>포트폴리오 자소서·면접 4단계 정리 (총 7개 프로젝트)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              [계기] ➔ [요약] ➔ [위험상황 및 해결한 방법] ➔ [한계]
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300">
              선물 체결 엔진, 미래에셋 DART AI, KAMP 제조 경진대회, 공군 해커톤, Find-A 학회 연구 등
              대표 프로젝트 7선을 자소서와 면접에서 즉시 꺼내 쓸 수 있도록 4단계로 구조화했습니다.
            </p>
          </div>

          <a
            href="https://github.com/rhwhdgks"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition shrink-0"
          >
            <FolderGit2 className="w-4 h-4" />
            <span>GitHub @rhwhdgks</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>

      {/* 7대 프로젝트 카드 리스트 */}
      <div className="space-y-4">
        {PROJECTS_STRUCTURED.map((p, idx) => {
          const isExp = Boolean(expandedIds[p.id]);
          const fullText = formatFullProjectText(p);

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-indigo-300 transition"
            >
              {/* 상단 카드 헤더 */}
              <div
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer bg-slate-50/70 hover:bg-slate-50 transition"
                onClick={() => toggleExpand(p.id)}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-xs font-bold">
                      #{idx + 1}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">{p.title}</h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                      {p.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                    <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{p.repo}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(fullText, `copy-${p.id}`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-white text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition shadow-2xs"
                  >
                    {copiedId === `copy-${p.id}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">전체 복사됨!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>전체 복사</span>
                      </>
                    )}
                  </button>

                  <button type="button" className="p-1 text-slate-400">
                    {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 본문 4단계: 계기 / 요약 / 위험상황 및 해결한 방법 / 한계 */}
              {isExp && (
                <div className="p-5 sm:p-6 border-t border-slate-100 space-y-4 bg-white text-xs sm:text-sm">
                  {/* 1. 계기 */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs sm:text-sm">
                      <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>1. 계기 (Motivation)</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed pl-5">{p.motivation}</p>
                  </div>

                  {/* 2. 요약 */}
                  <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-950 text-xs sm:text-sm">
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>2. 요약 (Summary)</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed pl-5 font-medium">{p.summary}</p>
                  </div>

                  {/* 3. 위험상황 및 해결한 방법 */}
                  <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200/80 space-y-3">
                    <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs sm:text-sm">
                      <Wrench className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>3. 위험상황 및 해결한 방법 (Risk & Solutions)</span>
                    </div>

                    <div className="space-y-2.5 pl-5">
                      {p.risksAndSolutions.map((r, rIdx) => (
                        <div
                          key={rIdx}
                          className="p-3 rounded-lg bg-white border border-amber-200/70 space-y-1.5 shadow-2xs"
                        >
                          <div className="flex items-start gap-1.5 font-bold text-red-900 text-xs">
                            <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                            <span>위험 {rIdx + 1}: {r.risk}</span>
                          </div>
                          <div className="text-slate-700 text-xs leading-relaxed pl-5">
                            <span className="font-semibold text-emerald-800 mr-1">➔ 해결:</span>
                            {r.solution}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4. 한계 */}
                  <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-300 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs sm:text-sm">
                      <AlertTriangle className="w-4 h-4 text-slate-600 shrink-0" />
                      <span>4. 한계 (Limitations)</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed pl-5">{p.limitations}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
