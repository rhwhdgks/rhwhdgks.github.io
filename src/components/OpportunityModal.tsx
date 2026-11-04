import React from 'react';
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
} from 'lucide-react';
import { CATEGORY_META, OpportunityItem, PROGRESS_STAGE_META, ProgressStage } from '../types';
import { getDdayInfo } from '../utils/date';

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
  if (!item) return null;

  const meta = CATEGORY_META[item.category] || CATEGORY_META.intern;
  const dday = getDdayInfo(item.deadline, item.isAlwaysOpen);
  const inProgress = Boolean(progressStage);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 바 */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${meta.badgeClass}`}>
              {meta.label}
            </span>
            <span className={`px-2.5 py-1 text-xs rounded-lg border ${dday.badgeStyle}`}>
              {dday.label}
            </span>
            {progressStage && (
              <span
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${PROGRESS_STAGE_META[progressStage].badgeClass}`}
              >
                내 진행: {PROGRESS_STAGE_META[progressStage].label}
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

        {/* 본문 */}
        <div className="p-6 space-y-5">
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
        </div>

        {/* 하단 액션 버튼 */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
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
