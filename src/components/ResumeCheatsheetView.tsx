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
  TrendingUp,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';

interface ProjectQuickItem {
  id: string;
  name: string;
  repo: string;
  repoUrl: string;
  oneLine: string;
  fitRoles: string;
  problem: string;
  action: string;
  result: string;
  interviewPitch: string;
}

const QUICK_PROJECTS: ProjectQuickItem[] = [
  {
    id: 'funding-arb-engine',
    name: '바이낸스·OKX 선물 체결 엔진',
    repo: 'rhwhdgks/funding-arb-engine',
    repoUrl: 'https://github.com/rhwhdgks/funding-arb-engine',
    oneLine: '한쪽만 체결되고 다른 쪽이 터졌을 때 내 돈을 지키는 24시간 거래 엔진',
    fitRoles: '거래시스템 백엔드 · 금융 IT 코어 인프라',
    problem:
      '바이낸스는 체결됐는데 OKX에서 네트워크 지연이나 잔고 부족으로 주문이 씹히면, 한쪽만 위험(Leg Risk)에 노출돼서 계좌가 순식간에 녹아내리는 치명적 위험이 있었습니다.',
    action:
      '1차 체결 확인 즉시 반대 거래소 시장가/IOC 주문을 집행하고, 0.5초 이상 지연되면 즉각 잔여 주문 취소 및 체결분 비상 청산 루틴을 가동했습니다. 또한 서버가 꺼졌다 켜져도 거래소 REST API로 실제 포지션을 전수 재조회해 MariaDB와 1:1 대조·복구하는 State Recovery 시스템을 구축했습니다.',
    result:
      '24시간 무중단 실가동 테스트 PASS 달성 (미체결 잔여 주문 0건, 불일치 포지션 0건, API 호출량 제한 초과 0건 유지).',
    interviewPitch:
      '“정상 상황에서 돌아가는 코드는 누구나 짭니다. 저는 통신 두절, 초과 체결, 프로세스 강제 종료 같은 최악의 예외 상황에서 스스로 계좌를 복구하는 백엔드를 만들었습니다.”',
  },
  {
    id: 'mirae-asset-dart',
    name: '미래에셋 AI Festival - DART 공시 질의응답 Agent',
    repo: 'rhwhdgks/mirae-asset-dart',
    repoUrl: 'https://github.com/rhwhdgks/mirae-asset-dart',
    oneLine: '단위 100만 배 틀리고 옛날 공시 가져오는 LLM의 환각을 코드로 통제한 금융 AI',
    fitRoles: '금융 AI 엔지니어 · LLM/RAG 개발 · 데이터 파이프라인',
    problem:
      'LLM한테 DART 전자공시 재무제표를 읽히면 표의 단위(원 vs 백만원)를 헷갈려 100만 배 틀린 숫자를 내거나, 정정 공시가 나왔는데도 예전 공시 숫자를 읽어대는 환각(Hallucination)이 심각했습니다.',
    action:
      '계산과 단위 판단은 LLM에게 절대 안 시켰습니다. LLM은 자연어 질문만 구조화하게 하고, 표 단위 파싱, 시점별 정정공시 계보(Lineage) 추적, 계산은 파이썬 Decimal 코드가 100% 강제했습니다. 수백 행 표를 쪼갤 때도 머리글(Header)을 청크마다 보존해 문맥 손실을 막았습니다.',
    result:
      '재무 수치 환각 0건 달성. 공시 원문 단락과 표 위치를 100% 역추적 가능한 설명 가능한(Explainable) 금융 질의응답 파이프라인 완성.',
    interviewPitch:
      '“AI를 맹신해서 다 맡기지 않았습니다. 숫자의 정확성과 시점 정합성은 파이썬 코드로 철저히 통제하고, 자연어 표현만 AI에게 맡기는 하이브리드 설계로 금융권이 요구하는 신뢰도를 맞췄습니다.”',
  },
  {
    id: 'etf-image-alpha-ode',
    name: 'ETF 차트 이미지 예측 연구 (Find-A 학회)',
    repo: 'rhwhdgks/etf-image-alpha-ode',
    repoUrl: 'https://github.com/rhwhdgks/etf-image-alpha-ode',
    oneLine: '미래 데이터를 훔쳐보지(Data Leakage) 않도록 엄격히 통제한 차트 비전 딥러닝',
    fitRoles: '퀀트 리서치 · 시계열 AI 모델링 · 자산운용',
    problem:
      '7개 ETF 캔들 차트를 2D 이미지로 바꿔 20일 뒤 수익률을 맞추려 할 때, 미래 데이터가 학습에 슬쩍 끼어드는 Data Leakage 때문에 백테스팅만 대박 나고 실전에선 박살 나는 현상이 있었습니다.',
    action:
      'Walk-Forward 분석 시 20일 예측 구간이 겹치지 않도록 Purge(앞뒤 삭제) 및 Embargo(유예 기간)를 엄격히 둬서 미래 정보 유출을 원천 차단했습니다. 또한 시장 전체가 올라서 맞춘 착시를 제거하기 위해 시장 공통 요인을 회귀로 걷어낸 순수 잔차 이미지 팩터를 추출했습니다.',
    result:
      '한국어 논문 연구 초안 및 무결성 감사 보고서 완성. 포트폴리오 최적화(ODE) 팀에 전달할 공분산 행렬과 신호 파이프라인 완성.',
    interviewPitch:
      '“화려한 모델보다 중요한 건 내가 미래 데이터를 훔쳐보고 착각한 게 아닌가 의심하는 것입니다. 시간 순서를 철저히 지킨 교차검증으로 껍데기뿐인 가짜 알파를 걸러냈습니다.”',
  },
  {
    id: 'crypto-order-flow',
    name: '코인 주문흐름(Order Flow) 동조화 연구',
    repo: 'rhwhdgks/crypto-order-flow-synchronization',
    repoUrl: 'https://github.com/rhwhdgks/crypto-order-flow-synchronization',
    oneLine: '거래비용(수수료·슬리피지)을 넣는 순간 깨지는 가짜 알파의 민낯을 데이터로 증명',
    fitRoles: '마켓 마이크로스트럭처 · 금융 데이터 엔지니어 · 계량 분석',
    problem:
      '코인들이 동시에 오르내리는 게 개별 호재 때문인지, 아니면 거래소 전체에서 매수/매도 주문 압력 자체가 한꺼번에 같이 쏠리는 건지 실증할 필요가 있었습니다.',
    action:
      '바이낸스와 OKX 틱 데이터를 수집하고, 가격 변동 효과를 회귀분석으로 걷어낸 순수 잔차 주문흐름을 추출했습니다. 결과를 보고 끼워맞추는 p-hacking을 막기 위해 연구 가설과 기준을 사전에 봉인(Pre-registration)한 뒤 분석을 집행했습니다.',
    result:
      '실제 7개 코인 간 주문흐름 동조화(상관 0.14)를 실증했으나, 실전 매매 적용 시 슬리피지와 수수료를 넣자마자 초과수익이 0으로 수렴함을 솔직하게 입증.',
    interviewPitch:
      '“통계적으로 유의미한 패턴이라도, 거래 수수료와 슬리피지를 이기지 못하면 전략이 될 수 없다는 금융 시장의 가장 냉혹한 실전 현실을 배웠습니다.”',
  },
  {
    id: 'crypto-herding',
    name: '암호화폐 집단추종 지표 반증 연구',
    repo: 'rhwhdgks/crypto-herding-research',
    repoUrl: 'https://github.com/rhwhdgks/crypto-herding-research',
    oneLine: '유명 논문 지표를 맹신하지 않고, 가상시장 시뮬레이션으로 수식의 허구를 반증',
    fitRoles: '계량 리서치 · 데이터 사이언스 · 리서치 애널리스트',
    problem:
      '유명 금융 저널(JBEF) 논문이 코인 가격 분산이 줄어들면 투자자들이 서로를 따라 매매(집단추종)한 증거라며 CSAD 지표를 제시했는데, 이것이 심리 때문인지 수식 자체의 왜곡인지 의문이 들었습니다.',
    action:
      '62개 코인 1분봉 데이터로 선행 논문 수치를 100% 재현한 후, 투자자가 서로를 전혀 모방하지 않고 자기 갈 길만 가는 독립 에이전트 가상시장을 몬테카를로 시뮬레이션으로 제작했습니다.',
    result:
      '모방이 전혀 없는 가상시장에서도 97~100% 확률로 논문과 똑같은 집단추종 신호가 검출됨. 시장 급변 시 자산 간 변동성 차이로 인한 기계적 수식 왜곡임을 수학적으로 규명.',
    interviewPitch:
      '“권위 있는 논문이라도 직접 뜯어보기 전까지는 믿지 않습니다. 가상시장 실험을 통해 지표의 거짓 양성(False Positive)을 증명해 낸 계량적 집요함이 제 무기입니다.”',
  },
];

const RESUME_PARAGRAPHS = [
  {
    category: '지원동기 / 직무 전문성',
    target: '지원 분야를 위해 어떤 노력을 해왔는가?',
    text: '고려대학교 컴퓨터공학을 전공하고 퀀트 학회 Find-A에서 활동하며, 단순 이론에 머무르지 않고 실제 24시간 가동되는 거래 체결 엔진과 틱 데이터 파이프라인을 직접 구축해 왔습니다. 바이낸스와 OKX 거래소 API를 연동하여 시세 변동 시 양방향 포지션을 0.5초 내에 자동 헤지하고 네트워크 단절 시 상태를 전수 복구하는 엔진을 개발하여 24시간 무중단 PASS를 달성했습니다. 또한 대용량 호가와 체결 틱 데이터를 정제하여 시장 미시구조의 주문흐름을 분석하며, 화려한 백테스팅 숫자가 아닌 "실전 거래비용과 시스템 안정성"이 금융 IT의 본질임을 체득했습니다.',
  },
  {
    category: '문제해결 / 트러블슈팅',
    target: '가장 기술적으로 어려웠던 문제와 극복 과정은?',
    text: 'DART 전자공시 질의응답 Agent를 개발할 당시, LLM이 표의 단위(원 vs 백만원)를 혼동해 100만 배 틀린 숫자를 내놓거나 과거 정정 이전의 잘못된 공시를 인용하는 심각한 환각 문제가 있었습니다. 저는 AI 모델에게 수치 계산을 맡기는 대신, 질문 의도만 LLM으로 구조화하고 표 파싱, 시점별 정정공시 계보 추적, Decimal 계산은 파이썬 코드가 100% 통제하는 하이브리드 아키텍처를 직접 설계했습니다. 또한 수백 행의 표를 쪼갤 때 머리글을 청크마다 보존하는 전처리기를 제작하여, 최종적으로 재무 수치 환각 0건과 100% 역추적 가능한 설명 가능한 시스템을 완성했습니다.',
  },
  {
    category: '팀 협업 / 갈등 해결',
    target: '팀 프로젝트에서 의견 충돌이나 협업 난관을 해결한 경험은?',
    text: 'Find-A 학회에서 7개 ETF 차트 이미지를 활용한 알파 예측 프로젝트 진행 당시, 제가 담당한 데이터/비전 파이프라인과 다른 팀원이 담당한 포트폴리오 최적화(Neural ODE) 파이프라인 간의 데이터 형식 및 기간 기준 불일치로 연동 에러가 빈번했습니다. 이를 해결하기 위해 각자 구두로 소통하던 방식을 멈추고, 수익 신호 mu(t)와 공분산 Sigma(t)의 칼럼 명, 날짜 포맷, 결측치 처리 규칙을 명시한 "Handoff Manifest 스키마"를 제가 주도하여 표준화했습니다. 명확한 인터페이스 규격 덕분에 팀 간 불필요한 마찰 없이 모델 산출물을 즉시 최적화 연산에 성공적으로 결합할 수 있었습니다.',
  },
  {
    category: '실패 경험 / 배운 점',
    target: '가장 크게 실패했던 경험과 그로부터 얻은 교훈은?',
    text: '바이낸스와 OKX 7개 코인의 체결 틱 데이터를 분석하여, 개별 코인의 매수/매도 압력이 시장 전체에서 동시에 움직이는 "주문흐름 동조화" 현상을 통계적으로 입증(상관계수 0.14)하고 이를 이용한 단기 시차 추종 매매 전략을 개발했습니다. 그러나 실제 백테스팅 결과, 거래소 수수료와 호가 슬리피지를 반영하자마자 장부상의 수익률이 마이너스로 곤두박질쳤습니다. 큰 허탈감을 느꼈지만, 데이터의 통계적 유의성이 곧바로 돈을 버는 알파가 될 수 없으며 거래비용을 무시한 알고리즘은 허상이라는 금융 시장의 가장 냉혹한 본질을 배웠습니다. 이후 수익률 과장 대신 "지연시간 최소화와 체결 실패 방어"라는 인프라 완성도에 집중하는 계기가 되었습니다.',
  },
];

const INTERVIEW_SCRIPTS = [
  {
    q: '“전략으로 돈 벌어본 적 있어요?”',
    tip: '거짓말로 꾸며대지 않고, 실전 거래비용의 냉혹함을 체득한 성숙한 태도를 보여주는 것이 핵심',
    a: '“솔직히 말씀드리면, 제가 연구한 단기 신호들은 거래소 수수료와 슬리피지를 빼고 나면 지속적인 순이익을 내지 못했습니다. 하지만 저는 이 경험을 통해 "수수료를 무시한 백테스팅은 100% 가짜"라는 실전 감각을 얻었습니다. 대신 저는 어떤 급변 장세에서도 계좌 빵꾸를 막는 24시간 무중단 체결 엔진을 완성했습니다. 실행 인프라가 튼튼해야 진짜 알파가 나왔을 때 안전하게 돈을 굴릴 수 있다고 믿습니다.”',
  },
  {
    q: '“우리는 Spring 쓰는데 Python 위주라 괜찮겠어요?”',
    tip: '언어 문법이 아니라, 비동기 서버/트랜잭션/DB라는 백엔드 본질이 동일함을 어필',
    a: '“제가 만든 선물 체결 엔진과 DART API는 비동기 이벤트 루프(Asyncio), 소켓 풀링, 트랜잭션 무결성, MariaDB 영속화 등 분산 서버의 핵심 원리를 밑바닥부터 다루었습니다. Spring Boot의 Controller-Service-Repository 구조와 JPA 역시 제가 짠 라우터-엔진-DAO 구조와 개념적으로 정확히 일치합니다. 고려대 컴공 전공을 통해 다진 객체지향 CS 기본기와 리눅스 경험으로 2~3주 내에 스프링 생태계에 빠르게 녹아들겠습니다.”',
  },
  {
    q: '“RAG 만드는데 왜 LangChain 안 쓰고 직접 코딩했어요?”',
    tip: '금융 데이터의 특수성(단위 하나, 시점 하나만 틀려도 100만 배 왜곡)을 논리적으로 설명',
    a: '“일반 챗봇은 유사한 문장만 찾아도 되지만, 금융 공시는 "단위(원/백만원)"나 "연결/별도"가 한 글자만 틀려도 완전히 엉뚱한 거짓말이 됩니다. 벡터 유사도 검색은 "2023년 3분기"와 "2024년 3분기"를 거의 똑같은 벡터로 보기 때문에 사고가 납니다. 그래서 질문 조건 확정과 단위 바인딩, 계산은 파이썬 코드로 100% 엄격하게 잠그고, 말하기만 AI에게 시키는 방식을 택했습니다.”',
  },
];

export const ResumeCheatsheetView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'quick' | 'paragraphs' | 'qa'>('quick');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'funding-arb-engine': true,
    'mirae-asset-dart': true,
    'etf-image-alpha-ode': false,
    'crypto-order-flow': false,
    'crypto-herding': false,
  });

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 핵심 헤더: 간결하고 직관적인 정체성 */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
              <span>🎯 자소서 & 면접 1타 요약 치트시트</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              “화려한 백테스팅 숫자에 취하지 않고, 예외와 장애를 방어하는 엔지니어링”
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300">
              고려대 컴공 · 퀀트 학회 Find-A · 선물 체결 엔진 · DART 공시 AI 프로젝트를
              면접관이 3초 만에 이해할 수 있는 알맹이 내용으로 정리했습니다.
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

        {/* 탭 네비게이션 */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'quick'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            ⚡ 프로젝트 5선 (문제-해결-결과)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paragraphs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'paragraphs'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            📝 자소서 3줄 복사용 (500~700자)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qa')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'qa'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            🗣️ 면접 실전 구어체 Q&A (방어 논리)
          </button>
        </div>
      </div>

      {/* 탭 1: 프로젝트 5선 (직관적 문제-해결-결과 3줄 & 면접 1줄) */}
      {activeTab === 'quick' && (
        <div className="space-y-3.5">
          {QUICK_PROJECTS.map((proj) => {
            const isExp = Boolean(expanded[proj.id]);
            const fullText = `[${proj.name} - ${proj.oneLine}]\n- 문제: ${proj.problem}\n- 해결: ${proj.action}\n- 결과: ${proj.result}\n- 면접 1줄: ${proj.interviewPitch}`;

            return (
              <div
                key={proj.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-indigo-300 transition"
              >
                {/* 요약 바 */}
                <div
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer bg-slate-50/60 hover:bg-slate-50 transition"
                  onClick={() => toggleExpand(proj.id)}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm sm:text-base font-bold text-slate-900">
                        {proj.name}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                        {proj.fitRoles}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-600">👉 {proj.oneLine}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(fullText, `full-${proj.id}`);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-indigo-200 bg-white text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition shadow-2xs"
                    >
                      {copiedKey === `full-${proj.id}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">복사됨!</span>
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

                {/* 상세 3줄 펼침 */}
                {isExp && (
                  <div className="p-4 sm:p-5 border-t border-slate-100 space-y-3 bg-white text-xs sm:text-sm">
                    {/* 1. 문제 */}
                    <div className="p-3.5 rounded-xl bg-red-50/50 border border-red-100 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-red-900 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                        <span>💥 부딪힌 문제 (Problem)</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed pl-5">{proj.problem}</p>
                    </div>

                    {/* 2. 해결 */}
                    <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-blue-900 text-xs">
                        <Wrench className="w-3.5 h-3.5 text-blue-600" />
                        <span>🛠️ 내가 푼 방법 (Action)</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed pl-5">{proj.action}</p>
                    </div>

                    {/* 3. 결과 */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span>📊 입증된 결과 (Result)</span>
                      </div>
                      <p className="font-semibold text-emerald-950 leading-relaxed pl-5">
                        {proj.result}
                      </p>
                    </div>

                    {/* 4. 면접 1줄 */}
                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                        <span>🗣️ 면접관 앞 1줄 어필</span>
                      </div>
                      <p className="font-medium text-amber-950 leading-relaxed pl-5">
                        {proj.interviewPitch}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 탭 2: 자소서 3줄 복사용 (500~700자) */}
      {activeTab === 'paragraphs' && (
        <div className="space-y-4">
          {RESUME_PARAGRAPHS.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    {item.category}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                    {item.target}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(item.text, `para-${idx}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shrink-0"
                >
                  {copiedKey === `para-${idx}` ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>복사 완료!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>단락 복사</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                {item.text}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 탭 3: 면접 실전 구어체 Q&A (방어 논리) */}
      {activeTab === 'qa' && (
        <div className="space-y-4">
          {INTERVIEW_SCRIPTS.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">{item.q}</h3>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(item.a, `qa-${idx}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-white text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition shrink-0"
                >
                  {copiedKey === `qa-${idx}` ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>복사 완료!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>답변 복사</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-amber-700 bg-amber-50/70 px-3 py-1.5 rounded-lg border border-amber-100 font-medium">
                💡 <strong>답변 핵심:</strong> {item.tip}
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed">
                {item.a}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
