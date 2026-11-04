import React, { useState } from 'react';
import {
  X,
  Building2,
  Calendar,
  MapPin,
  Award,
  ExternalLink,
  Bookmark,
  Tag,
  Globe,
  CheckCircle2,
  Plus,
  EyeOff,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Check,
  FolderGit2,
} from 'lucide-react';
import { CATEGORY_META, OpportunityItem, PROGRESS_STAGE_META, ProgressStage } from '../types';
import { getDdayInfo } from '../utils/date';
import { analyzeOpportunityFit } from '../utils/fitAnalysis';

interface OpportunityModalProps {
  item: OpportunityItem | null;
  isBookmarked: boolean;
  progressStage?: ProgressStage | null;
  onClose: () => void;
  onToggleBookmark: (id: string) => void;
  onToggleProgress: (item: OpportunityItem) => void;
  onDismiss: (item: OpportunityItem) => void;
}

export const OpportunityModal: React.FC<OpportunityModalProps> = ({
  item,
  isBookmarked,
  progressStage,
  onClose,
  onToggleBookmark,
  onToggleProgress,
  onDismiss,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'analysis'>('details');

  if (!item) return null;

  const meta = CATEGORY_META[item.category] || CATEGORY_META.intern;
  const dday = getDdayInfo(item.deadline, item.isAlwaysOpen);
  const inProgress = Boolean(progressStage);
  const fit = analyzeOpportunityFit(item);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 바 */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${meta.badgeClass}`}>
              {meta.label}
            </span>
            <span className={`px-2.5 py-1 text-xs rounded-lg border ${dday.badgeStyle}`}>
              {dday.label}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border ${fit.levelBadgeClass}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>적합도 {fit.matchScore}%</span>
            </span>
            {progressStage && (
              <span
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${PROGRESS_STAGE_META[progressStage].badgeClass}`}
              >
                진행중: {PROGRESS_STAGE_META[progressStage].label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onToggleBookmark(item.id)}
              className={`p-2 rounded-xl border transition ${
                isBookmarked
                  ? 'bg-amber-50 border-amber-200 text-amber-600'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
              title="관심 공고 찜하기"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 transition"
              title="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 탭 네비게이션: 공고 상세 vs 내 스택 맞춤 분석 */}
        <div className="flex items-center px-6 border-b border-slate-200 bg-white shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            공고 상세 정보
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analysis')}
            className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'analysis'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>내 스택 맞춤 분석 (강점 & 보완점)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
              {fit.matchScore}%
            </span>
          </button>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'details' ? (
            /* [탭 1] 공고 상세 정보 */
            <>
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 mb-1.5">
                  <Building2 className="w-4 h-4" />
                  <span>{item.organization}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 font-medium">{item.source}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 leading-snug">{item.title}</h2>
              </div>

              {/* 핵심 메타 정보 그리드 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <div className="text-[11px] text-slate-400">신청(접수) 마감일</div>
                    <div className="font-semibold">
                      {item.isAlwaysOpen || !item.deadline
                        ? '상시/채용시 마감'
                        : `${item.startDate ? `${item.startDate} ~ ` : ''}${item.deadline}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-slate-700">
                  <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <div className="text-[11px] text-slate-400">장소 / 형태</div>
                    <div className="font-semibold">{item.location || '온/오프라인'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-slate-700">
                  <Award className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <div className="text-[11px] text-slate-400">구분 / 혜택</div>
                    <div className="font-semibold">{item.reward || meta.shortLabel}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-slate-700">
                  <Globe className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div>
                    <div className="text-[11px] text-slate-400">수집 플랫폼</div>
                    <div className="font-semibold">{item.source}</div>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 px-1">
                * 표시된 기한은 대회/행사 최종 종료일이 아닌 <strong>참가 신청 및 지원서 접수 마감일</strong> 기준입니다.
              </div>

              {/* 요약 설명 */}
              {item.summary && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    공고 요약
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200">
                    {item.summary}
                  </p>
                </div>
              )}

              {/* 태그 */}
              {item.tags && item.tags.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> 관련 키워드 · 기술스택
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* [탭 2] 내 스택 맞춤 분석 (강점 & 보완점) */
            <div className="space-y-5 animate-fadeIn">
              {/* 적합도 요약 배너 */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-emerald-50 border border-indigo-200/80 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 mb-1">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>추천 직무: {fit.targetRole}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    고려대 컴공 · 퀀트/금융데이터 백그라운드와의 매칭도:{' '}
                    <span className="text-indigo-600 font-extrabold">{fit.matchScore}%</span>
                  </div>
                </div>
                <span className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-extrabold border shadow-xs ${fit.levelBadgeClass}`}>
                  {fit.matchLevel}
                </span>
              </div>

              {/* 1. 내가 가진 강점 & 어필할 깃허브 프로젝트 */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>내 스택에서 가장 잘 맞는 강점 (어필 포인트)</span>
                </h3>

                <div className="space-y-2.5">
                  {fit.matchedStrengths.map((str, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1.5"
                    >
                      <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        <span>{str.title}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pl-3">{str.description}</p>
                      {str.relatedProjects.length > 0 && (
                        <div className="flex items-center gap-1.5 pl-3 pt-1">
                          <FolderGit2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="text-[11px] font-semibold text-slate-500">관련 깃허브 레포:</span>
                          <div className="flex flex-wrap gap-1">
                            {str.relatedProjects.map((repo) => (
                              <a
                                key={repo}
                                href={`https://github.com/rhwhdgks/${repo}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] px-1.5 py-0.5 rounded bg-white text-indigo-600 border border-indigo-200 hover:underline font-mono"
                              >
                                {repo}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. 부족하거나 보완해야 할 부분 & 액션 플랜 */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>부족하거나 보완할 점 & 서류/면접 대비 준비 가이드</span>
                </h3>

                <div className="space-y-2.5">
                  {fit.missingOrImprove.map((gap, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-1.5"
                    >
                      <div className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                        <span>{gap.area}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pl-3">{gap.description}</p>
                      <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/60 ml-3 text-xs text-slate-700">
                        <strong className="text-amber-800">💡 보완 액션:</strong> {gap.actionPlan}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. 자소서 / 기술면접 원포인트 팁 */}
              <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 mb-1">
                  <Lightbulb className="w-4 h-4 text-indigo-600" />
                  <span>이 공고 지원 시 원포인트 자소서/면접 팁</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{fit.interviewTip}</p>
              </div>
            </div>
          )}
        </div>

        {/* 하단 액션 버튼 */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              onDismiss(item);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 text-xs sm:text-sm font-semibold text-slate-600 hover:text-red-600 transition"
            title="이미 확인했거나 관심 없는 공고를 목록에서 영구히 지웁니다"
          >
            <EyeOff className="w-4 h-4" />
            <span>안 볼래요 (지우기)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleProgress(item)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition ${
                inProgress
                  ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                  : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'
              }`}
            >
              {inProgress ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>진행중 등록됨</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>내 진행 목록에 추가</span>
                </>
              )}
            </button>

            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition"
            >
              <span>원문 이동</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
