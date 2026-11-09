import React, { useState } from 'react';
import {
  CheckCircle2,
  Plus,
  Trash2,
  ExternalLink,
  Calendar,
  Building2,
  FileText,
  Sparkles,
  FolderKanban,
  X,
} from 'lucide-react';
import {
  CATEGORY_META,
  CategoryType,
  OpportunityItem,
  PROGRESS_STAGE_META,
  ProgressStage,
  UserProgressEntry,
} from '../types';
import { formatYMD, getDdayInfo, getTodayMidnight } from '../utils/date';

interface MyProgressViewProps {
  entries: UserProgressEntry[];
  onUpdateStage: (id: string, stage: ProgressStage) => void;
  onUpdateMemo: (id: string, memo: string) => void;
  onRemoveProgress: (id: string) => void;
  onAddCustomProgress: (item: OpportunityItem, stage: ProgressStage, memo: string) => void;
  onSelectItem: (item: OpportunityItem) => void;
}

export const MyProgressView: React.FC<MyProgressViewProps> = ({
  entries,
  onUpdateStage,
  onUpdateMemo,
  onRemoveProgress,
  onAddCustomProgress,
  onSelectItem,
}) => {
  const [stageFilter, setStageFilter] = useState<'all' | ProgressStage>('all');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // 직접 추가 폼 상태
  const [customTitle, setCustomTitle] = useState('');
  const [customOrg, setCustomOrg] = useState('');
  const [customCategory, setCustomCategory] = useState<Exclude<CategoryType, 'all'>>('intern');
  const [customStage, setCustomStage] = useState<ProgressStage>('preparing');
  const [customDeadline, setCustomDeadline] = useState(formatYMD(getTodayMidnight()));
  const [customUrl, setCustomUrl] = useState('');
  const [customMemo, setCustomMemo] = useState('');

  const filteredEntries = entries.filter((e) =>
    stageFilter === 'all' ? true : e.stage === stageFilter
  );

  const stageCounts = {
    all: entries.length,
    preparing: entries.filter((e) => e.stage === 'preparing').length,
    applied: entries.filter((e) => e.stage === 'applied').length,
    ongoing: entries.filter((e) => e.stage === 'ongoing').length,
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newItem: OpportunityItem = {
      id: `custom-${Date.now()}`,
      title: customTitle.trim(),
      organization: customOrg.trim() || '개인 일정',
      category: customCategory,
      source: '직접 등록',
      sourceUrl: customUrl.trim() || '#',
      startDate: formatYMD(getTodayMidnight()),
      deadline: customDeadline || null,
      isAlwaysOpen: !customDeadline,
      tags: ['내 진행 일정', CATEGORY_META[customCategory].shortLabel],
      location: '개인 등록',
      reward: PROGRESS_STAGE_META[customStage].label,
      summary: customMemo.trim() || `${customTitle.trim()} 진행 일정`,
    };

    onAddCustomProgress(newItem, customStage, customMemo.trim());
    setCustomTitle('');
    setCustomOrg('');
    setCustomUrl('');
    setCustomMemo('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* 상단 배너 & 직접 추가 버튼 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-xs shrink-0">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              내가 진행 중인 활동 · 지원 현황
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              공고 목록에서 <span className="font-semibold text-indigo-600">[+ 진행중]</span> 버튼을 누른 항목들과 직접 등록한 일정을 단계별로 관리하고 메모를 남길 수 있습니다.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm((prev) => !prev)}
          className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-xs transition"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showAddForm ? '폼 닫기' : '내 활동 직접 추가'}</span>
        </button>
      </div>

      {/* 직접 추가 폼 */}
      {showAddForm && (
        <form
          onSubmit={handleCreateCustom}
          className="bg-indigo-50/50 rounded-2xl border border-indigo-200 p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>새로운 진행 활동 / 지원 공고 직접 등록</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                공고 / 활동명 *
              </label>
              <input
                type="text"
                required
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="예: 2026 삼성전자 SW 인턴 지원 / AI 해커톤 본선"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                주최사 / 기업명
              </label>
              <input
                type="text"
                value={customOrg}
                onChange={(e) => setCustomOrg(e.target.value)}
                placeholder="예: 삼성전자 / 데이콘"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                마감일 / 목표일
              </label>
              <input
                type="date"
                value={customDeadline}
                onChange={(e) => setCustomDeadline(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">분야</label>
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value as Exclude<CategoryType, 'all'>)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
              >
                <option value="intern">인턴 · 신입 채용</option>
                <option value="hackathon">해커톤 · AI 경진대회</option>
                <option value="contest">IT · 기획 공모전</option>
                <option value="kofia">금융권 채용</option>
                <option value="activity">대외활동 · 부트캠프</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">현재 진행 단계</label>
              <select
                value={customStage}
                onChange={(e) => setCustomStage(e.target.value as ProgressStage)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
              >
                <option value="preparing">준비 · 작성중</option>
                <option value="applied">지원 · 제출완료</option>
                <option value="ongoing">진행 · 참여중</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                관련 링크 (선택)
              </label>
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                내 메모 (할 일, 코딩테스트/면접 일정, 팀원 등)
              </label>
              <input
                type="text"
                value={customMemo}
                onChange={(e) => setCustomMemo(e.target.value)}
                placeholder="예: 자소서 2번 문항 수정 필요, 11/12 오후 3시 온라인 코딩테스트"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
            >
              등록하기
            </button>
          </div>
        </form>
      )}

      {/* 단계별 필터 탭 */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStageFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition ${
            stageFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          전체 진행 목록 ({stageCounts.all})
        </button>

        {(['preparing', 'applied', 'ongoing'] as ProgressStage[]).map((st) => {
          const meta = PROGRESS_STAGE_META[st];
          const isSelected = stageFilter === st;
          return (
            <button
              key={st}
              type="button"
              onClick={() => setStageFilter(st)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} />
              <span>{meta.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[11px] ${
                  isSelected ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {stageCounts[st]}
              </span>
            </button>
          );
        })}
      </div>

      {/* 진행 중인 카드 목록 */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            아직 등록된 진행 중 공고/활동이 없습니다
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            전체 공고 리스트에서 관심 있는 인턴·해커톤·공모전의{' '}
            <span className="font-semibold text-indigo-600">[+ 진행중]</span> 버튼을 누르거나, 우측 상단의{' '}
            <span className="font-semibold text-indigo-600">[내 활동 직접 추가]</span> 버튼을 눌러 추가해 보세요!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEntries.map((entry) => {
            const item = entry.snapshot;
            const catMeta = CATEGORY_META[item.category] || CATEGORY_META.intern;
            const stageMeta = PROGRESS_STAGE_META[entry.stage];
            const dday = getDdayInfo(item.deadline, item.isAlwaysOpen);

            return (
              <div
                key={entry.id}
                className="bg-white rounded-2xl border-2 border-indigo-100 hover:border-indigo-300 shadow-xs p-5 flex flex-col justify-between gap-4 transition"
              >
                <div className="space-y-3">
                  {/* 상단 상태 배지 & 단계 변경 드롭다운 & 삭제 */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg border ${catMeta.badgeClass}`}
                      >
                        {catMeta.shortLabel}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 text-xs rounded-lg border ${dday.badgeStyle}`}
                      >
                        {dday.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* 진행 단계 선택기 */}
                      <select
                        value={entry.stage}
                        onChange={(e) =>
                          onUpdateStage(entry.id, e.target.value as ProgressStage)
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer focus:outline-none ${stageMeta.badgeClass}`}
                      >
                        <option value="preparing">📝 준비 · 작성중</option>
                        <option value="applied">📩 지원 · 제출완료</option>
                        <option value="ongoing">🔥 진행 · 참여중</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => onRemoveProgress(entry.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="내 진행 목록에서 제거"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 기관 & 제목 */}
                  <div
                    onClick={() => onSelectItem(item)}
                    className="cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
                      <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{item.organization}</span>
                      <span className="text-slate-300">•</span>
                      <span>{item.source}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  {/* 개인 메모 입력란 (자동 저장) */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      <span>진행 메모 (할 일 · 일정 · 팀원 등 입력 시 자동 저장)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={entry.memo}
                      onChange={(e) => onUpdateMemo(entry.id, e.target.value)}
                      placeholder="여기에 진행 상황이나 메모를 적어두세요 (예: 서류 제출 완료, 11/15 코딩테스트 안내 메일 확인)"
                      className="w-full bg-white rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>

                {/* 하단 마감일 & 원문 링크 */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      마감일:{' '}
                      <strong className="text-slate-700">
                        {item.isAlwaysOpen || !item.deadline ? '상시모집' : item.deadline}
                      </strong>
                    </span>
                  </div>

                  {item.sourceUrl && item.sourceUrl !== '#' && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <span>공고 원문</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

