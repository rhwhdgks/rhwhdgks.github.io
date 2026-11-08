import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  PROJECTS_STRUCTURED,
  CHEATSHEET_UPDATED_AT,
  formatProjectText,
  ProjectStructure,
} from '../data/resumeProjects';

type SectionKey = 'motivation' | 'summary' | 'risks' | 'limitations';

const formatSectionText = (p: ProjectStructure, section: SectionKey): string => {
  switch (section) {
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
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    [PROJECTS_STRUCTURED[0].id]: true,
  });

  const allExpanded = PROJECTS_STRUCTURED.every((p) => expandedIds[p.id]);

  const handleCopy = async (text: string, id: string) => {
    const ok = await copyToClipboard(text);
    if (!ok) return;
    setCopiedId(id);
    setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = () => {
    const next = !allExpanded;
    setExpandedIds(Object.fromEntries(PROJECTS_STRUCTURED.map((p) => [p.id, next])));
  };

  const jumpTo = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: true }));
    requestAnimationFrame(() => {
      document.getElementById(`cheatsheet-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const renderSectionCopy = (p: ProjectStructure, section: SectionKey) => {
    const key = `copy-${p.id}-${section}`;
    const copied = copiedId === key;
    return (
      <button
        type="button"
        onClick={() => handleCopy(formatSectionText(p, section), key)}
        className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-500 hover:text-indigo-700 hover:bg-white/80 transition"
        title="이 항목만 복사"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
        <span className={`hidden sm:inline ${copied ? 'text-emerald-700' : ''}`}>{copied ? '복사됨' : '복사'}</span>
      </button>
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
              <span>포트폴리오 자소서·면접 4단계 정리 (총 {PROJECTS_STRUCTURED.length}개 프로젝트)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              [계기] ➔ [요약] ➔ [위험상황 및 해결한 방법] ➔ [한계]
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
              거래 실행 엔진, DART 공시 AI, KAMP 제조 경진대회, 공군 해커톤, Find-A 학회 연구, 개인 연구·서비스까지
              GitHub 저장소와 실제 작업 기록을 근거로 기간·역할·핵심 수치와 함께 정리했습니다. 위험마다 원인 → 해결 →
              결과 순서로 적어 두어 면접에서 꼬리 질문에 바로 답할 수 있습니다.
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
            <button
              type="button"
              onClick={toggleAll}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/90 hover:bg-indigo-500 text-white text-xs font-semibold transition"
            >
              {allExpanded ? <ChevronsDownUp className="w-4 h-4" /> : <ChevronsUpDown className="w-4 h-4" />}
              <span>{allExpanded ? '모두 접기' : '모두 펼치기'}</span>
            </button>
          </div>
        </div>

        {/* 프로젝트 목차 */}
        <div className="mt-5 flex flex-wrap gap-1.5">
          {PROJECTS_STRUCTURED.map((p, idx) => (
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

      {/* 프로젝트 카드 리스트 */}
      <div className="space-y-4">
        {PROJECTS_STRUCTURED.map((p, idx) => {
          const isExp = Boolean(expandedIds[p.id]);
          const fullKey = `copy-${p.id}`;

          return (
            <div
              key={p.id}
              id={`cheatsheet-${p.id}`}
              className="scroll-mt-24 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:border-indigo-300 transition"
            >
              {/* 카드 헤더 */}
              <div
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer bg-slate-50/70 hover:bg-slate-50 transition"
                onClick={() => toggleExpand(p.id)}
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
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(formatProjectText(p), fullKey);
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

                  <span className="p-1 text-slate-400" aria-hidden>
                    {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </div>
              </div>

              {isExp && (
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
                      {p.risksAndSolutions.map((r, rIdx) => (
                        <div key={r.risk} className="p-3 rounded-lg bg-white border border-amber-200/70 space-y-1.5 shadow-sm">
                          <div className="flex items-start gap-1.5 font-bold text-red-900 text-xs sm:text-[13px]">
                            <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                            <span>
                              위험 {rIdx + 1}: {r.risk}
                            </span>
                          </div>
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
                      ))}
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
