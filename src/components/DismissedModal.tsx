import React from 'react';
import { X, RotateCcw, Trash2, EyeOff } from 'lucide-react';
import { DismissedEntry } from '../types';

interface DismissedModalProps {
  isOpen: boolean;
  entries: DismissedEntry[];
  onClose: () => void;
  onRestore: (id: string, key: string) => void;
  onRestoreAll: () => void;
}

export const DismissedModal: React.FC<DismissedModalProps> = ({
  isOpen,
  entries,
  onClose,
  onRestore,
  onRestoreAll,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-slate-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                숨긴 공고 목록 ({entries.length}건)
              </h3>
              <p className="text-xs text-slate-500">
                지운 공고는 다음 크롤링 업데이트 이후에도 다시 표시되지 않습니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-2.5 flex-1">
          {entries.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              현재 숨긴(지운) 공고가 없습니다.
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={`${entry.id}-${entry.key}`}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-500 truncate">
                    {entry.organization}
                  </div>
                  <div className="text-sm font-bold text-slate-800 truncate">
                    {entry.title}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRestore(entry.id, entry.key)}
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-xs font-semibold text-slate-600 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>복구</span>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {entries.length > 0 ? (
            <button
              type="button"
              onClick={onRestoreAll}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>전체 숨김 해제 (모두 복구)</span>
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

