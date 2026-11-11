import React, { useMemo, useState } from 'react';
import {
  Copy,
  Check,
  FolderGit2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
  AlertCircle,
  Wrench,
  HelpCircle,
  FileText,
  AlertTriangle,
  Lock,
  CalendarDays,
  Users,
  Globe,
  CheckCircle2,
  Briefcase,
  Mic,
  Target,
  X,
} from 'lucide-react';
import {
  PROJECTS_STRUCTURED,
  CHEATSHEET_UPDATED_AT,
  COMPETENCIES,
  JOB_TRACKS,
  CompetencyId,
  ProjectStructure,
  TrackId,
  formatProjectText,
  getTrack,
  orderedProjects,
  projectCompetencies,
} from '../data/resumeProjects';

type SectionKey = 'pitch30' | 'pitch2min' | 'motivation' | 'summary' | 'risks' | 'limitations';
type ViewLevel = 'pitch30' | 'pitch2min' | 'detail';

const VIEW_LEVELS: { id: ViewLevel; label: string; hint: string }[] = [
  { id: 'pitch30', label: '30초 요약', hint: '면접 첫 프로젝트 소개용' },
  { id: 'pitch2min', label: '2분 설명', hint: '상황 → 구현 → 어려움 → 결과' },
  { id: 'detail', label: '상세 4단계', hint: '자소서·꼬리질문 대비용' },
];

/** 발화 시간 추정: 한글 음절 + 영문·숫자(2자당 1음절)를 면접에서 차분히 말하는 속도(초당 약 5음절)로 계산 */
const estimateSeconds = (text: string): number => {
  const hangul = (text.match(/[가-힣]/g) || []).length;
  const latin = (text.match(/[A-Za-z0-9]+/g) || []).reduce((n, w) => n + Math.ceil(w.length / 2), 0);
  return Math.max(5, Math.round((hangul + latin) / 5 / 5) * 5);
};

const formatDuration = (sec: number) => (sec >= 60 ? `약 ${Math.floor(sec / 60)}분 ${sec % 60 ? `${sec % 60}초` : ''}`.trim() : `약 ${sec}초`);

const formatSectionText = (p: ProjectStructure, section: SectionKey): string => {
  switch (section) {
    case 'pitch30':
      return p.pitch30;
    case 'pitch2min':
      return p.pitch2min.join('\n\n');
    case 'motivation':
      return p.motivation;
    case 'summary':
      return [p.summary, ...p.summaryPoints.map((s) => `- ${s}`)].join('\n');
    case 'risks':
      return p.risksAndSolutions
        .map((r, i) => {
          const lines = [`[위험 ${i + 1}] ${r.risk}`];
          if (r.cause) lines.push(`- 원인: ${r.cause}`);
          lines.push(`➔ 해결: ${r.solution}`);
          if (r.result) lines.push(`✓ 결과: ${r.result}`);
          return lines.join('\n');
        })
        .join('\n\n');
    case 'limitations':
      return p.limitations.map((l) => `- ${l}`).join('\n');
  }
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
};

export const ResumeCheatsheetView: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [trackId, setTrackId] = useState<TrackId | null>(null);
  const [competency, setCompetency] = useState<CompetencyId | null>(null);
  const [viewLevel, setViewLevel] = useState<ViewLevel>('detail');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    [PROJECTS_STRUCTURED[0].id]: true,
  });

  const track = trackId ? getTrack(trackId) : null;

  const visibleCompetencies: CompetencyId[] = track
    ? track.competencies
    : (Object.keys(COMPETENCIES) as CompetencyId[]);

  const projectsByCompetency = useMemo(() => {
    const map = {} as Record<CompetencyId, number>;
    (Object.keys(COMPETENCIES) as CompetencyId[]).forEach((c) => {
      map[c] = PROJECTS_STRUCTURED.filter((p) => projectCompetencies(p).includes(c)).length;
    });
    return map;
  }, []);

  const projects = useMemo(() => {
    const ordered = orderedProjects(trackId);
    return competency ? ordered.filter((p) => projectCompetencies(p).includes(competency)) : ordered;
  }, [trackId, competency]);

  const allExpanded = projects.every((p) => expandedIds[p.id]);
  const isDetail = viewLevel === 'detail';

  const handleCopy = async (text: string, id: string) => {
    const ok = await copyToClipboard(text);
    if (!ok) return;
    setCopiedId(id);
    setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000);
  };

  const toggleExpand = (id: string) => setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleAll = () => {
    const next = !allExpanded;
    setExpandedIds(Object.fromEntries(projects.map((p) => [p.id, next])));
  };

  const selectTrack = (id: TrackId | null) => {
    setTrackId(id);
    if (competency && id && !getTrack(id).competencies.includes(competency)) setCompetency(null);
  };

  const selectCompetency = (c: CompetencyId) => {
    const next = competency === c ? null : c;
    setCompetency(next);
    if (next) {
      const matched = orderedProjects(trackId).filter((p) => projectCompetencies(p).includes(next));
      setExpandedIds(Object.fromEntries(matched.map((p) => [p.id, true])));
    }
  };

  const jumpTo = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: true }));
    requestAnimationFrame(() => {
      document.getElementById(`cheatsheet-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const renderCopy = (text: string, key: string, title = '이 항목만 복사') => {
    const copied = copiedId === key;
    return (
      <button
        type="button"
        onClick={() => handleCopy(text, key)}
        className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-500 hover:text-indigo-700 hover:bg-white/80 transition"
        title={title}
      >
        {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
        <span className={`hidden sm:inline ${copied ? 'text-emerald-700' : ''}`}>{copied ? '복사됨' : '복사'}</span>
      </button>
    );
  };

  const renderSectionCopy = (p: ProjectStructure, section: SectionKey) =>
    renderCopy(formatSectionText(p, section), `copy-${p.id}-${section}`);

  const competencyBadge = (c: CompetencyId, size: 'sm' | 'xs' = 'xs') => {
    const selected = competency === c;
    const inTrack = track?.competencies.includes(c);
    return (
      <span
        key={c}
        title={COMPETENCIES[c].desc}
        className={`inline-flex items-center rounded-md border font-semibold ${
          size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
        } ${
          selected
            ? 'bg-indigo-600 text-white border-indigo-600'
            : inTrack
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-slate-50 text-slate-500 border-slate-200'
        }`}
      >
        {COMPETENCIES[c].label}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 상단 헤더 배너 */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
              <FileText className="w-3.5 h-3.5" />
              <span>포트폴리오 자소서·면접 정리 (총 {PROJECTS_STRUCTURED.length}개 프로젝트)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              지원 직무를 고르고, 30초 · 2분 · 상세 중 필요한 길이로 꺼내 쓰기
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
              직무를 고르면 프로젝트 순서와 "이 직무에서 강조할 점"이 바뀌고, 역량 칩을 누르면 그 역량을 보여 주는 사례만
              모아 볼 수 있습니다. 상세 보기는 [계기] ➔ [요약] ➔ [위험상황 및 해결한 방법] ➔ [한계] 4단계입니다.
            </p>
            <p className="mt-2 text-[11px] text-slate-400">
              최종 정리 {CHEATSHEET_UPDATED_AT} · 근거: 각 저장소 README·문서와 Codex 작업 대화 기록
            </p>
          </div>

          <div className="flex sm:flex-col items-stretch gap-2 shrink-0">
            <a
              href="https://github.com/rhwhdgks"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
            >
              <FolderGit2 className="w-4 h-4" />
              <span>GitHub @rhwhdgks</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
            {isDetail && (
              <button
                type="button"
                onClick={toggleAll}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/90 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                {allExpanded ? <ChevronsDownUp className="w-4 h-4" /> : <ChevronsUpDown className="w-4 h-4" />}
                <span>{allExpanded ? '모두 접기' : '모두 펼치기'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 지원 직무 */}
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 mr-1">
              <Briefcase className="w-3.5 h-3.5" /> 지원 직무
            </span>
            {[{ id: null as TrackId | null, label: '전체', desc: '직무 구분 없이 기본 순서' }, ...JOB_TRACKS].map((t) => {
              const active = trackId === t.id;
              return (
                <button
                  key={t.label}
                  type="button"
                  title={t.desc}
                  onClick={() => selectTrack(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    active
                      ? 'bg-amber-400 text-amber-950 border-amber-400'
                      : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/15'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* 보기 길이 */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 mr-1">
              <Mic className="w-3.5 h-3.5" /> 보기
            </span>
            {VIEW_LEVELS.map((v) => {
              const active = viewLevel === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  title={v.hint}
                  onClick={() => setViewLevel(v.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    active
                      ? 'bg-indigo-500 text-white border-indigo-500'
                      : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/15'
                  }`}
                >
                  {v.label}
                </button>
              );
            })}
          </div>

          {/* 역량 칩 */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 mr-1">
              <Target className="w-3.5 h-3.5" /> {track ? `${track.label} 핵심 역량` : '역량으로 사례 찾기'}
            </span>
            {visibleCompetencies.map((c) => {
              const active = competency === c;
              return (
                <button
                  key={c}
                  type="button"
                  title={COMPETENCIES[c].desc}
                  onClick={() => selectCompetency(c)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold border transition ${
                    active
                      ? 'bg-white text-slate-900 border-white'
                      : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/15'
                  }`}
                >
                  <span>{COMPETENCIES[c].label}</span>
                  <span className={active ? 'text-indigo-600' : 'text-slate-400'}>{projectsByCompetency[c]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 프로젝트 목차 */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap gap-1.5">
          {projects.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={() => jumpTo(p.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-[11px] sm:text-xs text-slate-200 transition"
            >
              <span className="font-bold text-indigo-300">#{idx + 1}</span>
              <span>{p.shortTitle}</span>
            </button>
          ))}
        </div>
      </div>

      {competency && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs sm:text-sm text-indigo-900">
          <Target className="w-4 h-4 text-indigo-500" />
          <span>
            <strong>{COMPETENCIES[competency].label}</strong> 역량을 보여 주는 프로젝트 {projects.length}개
            {isDetail ? ' · 해당 사례가 위로 올라옵니다' : ''}
          </span>
          <button
            type="button"
            onClick={() => setCompetency(null)}
            className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
          >
            <X className="w-3.5 h-3.5" /> 역량 필터 해제
          </button>
        </div>
      )}

      {/* 프로젝트 카드 리스트 */}
      <div className="space-y-4">
        {projects.map((p, idx) => {
          const isExp = !isDetail || Boolean(expandedIds[p.id]);
          const fullKey = `copy-${p.id}`;
          const comps = projectCompetencies(p);
          const risks = competency
            ? [...p.risksAndSolutions].sort(
                (a, b) => Number(b.competencies.includes(competency)) - Number(a.competencies.includes(competency))
              )
            : p.risksAndSolutions;

          return (
            <div
              key={p.id}
              id={`cheatsheet-${p.id}`}
              className="scroll-mt-24 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:border-indigo-300 transition"
            >
              {/* 카드 헤더 */}
              <div
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 transition ${
                  isDetail ? 'cursor-pointer hover:bg-slate-50' : ''
                }`}
                onClick={() => isDetail && toggleExpand(p.id)}
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-xs font-bold">#{idx + 1}</span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">{p.title}</h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                      {p.category}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      {p.period}
                    </span>
                    {p.isPrivate ? (
                      <span className="inline-flex items-center gap-1 font-mono">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        {p.repo} (비공개)
                      </span>
                    ) : (
                      <a
                        href={p.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-mono hover:text-indigo-700 hover:underline"
                      >
                        <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
                        {p.repo}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {p.demoUrl && (
                      <a
                        href={p.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 hover:text-indigo-700 hover:underline"
                      >
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        {p.demoUrl.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">{comps.map((c) => competencyBadge(c))}</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(formatProjectText(p, trackId), fullKey);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-white text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition shadow-sm"
                  >
                    {copiedId === fullKey ? (
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
                  {isDetail && (
                    <span className="p-1 text-slate-400" aria-hidden>
                      {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  )}
                </div>
              </div>

              {/* 직무별 강조점 */}
              {track && (
                <div className="px-4 sm:px-5 py-2.5 border-t border-amber-100 bg-amber-50/70 text-xs sm:text-sm text-amber-950 flex items-start gap-2">
                  <Briefcase className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <span className="font-bold mr-1">{track.label} 지원 시 강조</span>
                    {p.trackFocus[track.id]}
                  </p>
                </div>
              )}

              {/* 30초 / 2분 */}
              {viewLevel !== 'detail' && (
                <div className="p-5 sm:p-6 border-t border-slate-100 bg-white text-sm">
                  <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-950 text-xs sm:text-sm">
                      <Mic className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>{viewLevel === 'pitch30' ? '30초 요약' : '2분 설명'}</span>
                      <span className="text-[11px] font-medium text-indigo-500">
                        (
                        {formatDuration(
                          estimateSeconds(viewLevel === 'pitch30' ? p.pitch30 : p.pitch2min.join(' '))
                        )}
                        )
                      </span>
                      {renderSectionCopy(p, viewLevel)}
                    </div>
                    {viewLevel === 'pitch30' ? (
                      <p className="text-slate-800 leading-relaxed pl-5">{p.pitch30}</p>
                    ) : (
                      <div className="space-y-2.5 pl-5">
                        {p.pitch2min.map((para, i) => (
                          <p key={i} className="text-slate-800 leading-relaxed">
                            {para}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isDetail && isExp && (
                <div className="p-5 sm:p-6 border-t border-slate-100 space-y-4 bg-white text-xs sm:text-sm">
                  {/* 기본 정보: 역할 · 기술 · 핵심 수치 */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-slate-700 leading-relaxed">
                      <Users className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <p>
                        <span className="font-bold text-slate-900 mr-1">역할</span>
                        {p.role}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-6">
                      {p.stack.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                      {p.highlights.map((h) => (
                        <div key={h.label} className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2">
                          <div className="text-[11px] text-indigo-700/80 font-medium">{h.label}</div>
                          <div className="text-sm sm:text-base font-bold text-indigo-950 break-keep">{h.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 1. 계기 */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs sm:text-sm">
                      <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>1. 계기 (Motivation)</span>
                      {renderSectionCopy(p, 'motivation')}
                    </div>
                    <p className="text-slate-700 leading-relaxed pl-5">{p.motivation}</p>
                  </div>

                  {/* 2. 요약 */}
                  <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-950 text-xs sm:text-sm">
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>2. 요약 (Summary)</span>
                      {renderSectionCopy(p, 'summary')}
                    </div>
                    <p className="text-slate-800 leading-relaxed pl-5 font-medium">{p.summary}</p>
                    <ul className="pl-9 list-disc space-y-1 text-slate-700 leading-relaxed marker:text-indigo-400">
                      {p.summaryPoints.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* 3. 위험상황 및 해결한 방법 */}
                  <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200/80 space-y-3">
                    <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs sm:text-sm">
                      <Wrench className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>3. 위험상황 및 해결한 방법 (Risk & Solutions)</span>
                      {renderSectionCopy(p, 'risks')}
                    </div>

                    <div className="space-y-2.5 pl-5">
                      {risks.map((r, rIdx) => {
                        const dim = competency !== null && !r.competencies.includes(competency);
                        return (
                          <div
                            key={r.risk}
                            className={`p-3 rounded-lg bg-white border space-y-1.5 shadow-sm transition ${
                              competency && !dim ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-amber-200/70'
                            } ${dim ? 'opacity-50' : ''}`}
                          >
                            <div className="flex items-start gap-1.5 font-bold text-red-900 text-xs sm:text-[13px]">
                              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                              <span>
                                위험 {rIdx + 1}: {r.risk}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 pl-5">{r.competencies.map((c) => competencyBadge(c))}</div>
                            {r.cause && (
                              <div className="text-slate-600 text-xs leading-relaxed pl-5">
                                <span className="font-semibold text-slate-800 mr-1">원인:</span>
                                {r.cause}
                              </div>
                            )}
                            <div className="text-slate-700 text-xs leading-relaxed pl-5">
                              <span className="font-semibold text-emerald-800 mr-1">➔ 해결:</span>
                              {r.solution}
                            </div>
                            {r.result && (
                              <div className="flex items-start gap-1 text-xs leading-relaxed pl-5 text-indigo-900">
                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                <span>
                                  <span className="font-semibold mr-1">결과:</span>
                                  {r.result}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. 한계 */}
                  <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-300 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs sm:text-sm">
                      <AlertTriangle className="w-4 h-4 text-slate-600 shrink-0" />
                      <span>4. 한계 (Limitations)</span>
                      {renderSectionCopy(p, 'limitations')}
                    </div>
                    <ul className="pl-9 list-disc space-y-1.5 text-slate-700 leading-relaxed marker:text-slate-400">
                      {p.limitations.map((l) => (
                        <li key={l}>{l}</li>
                      ))}
                    </ul>
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
