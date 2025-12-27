"use client";

import React from "react";
import { X, CheckSquare, Square, Copy, Trash2, Sparkles } from "lucide-react";
import { EntryCard } from "./entry-card";
import { splitEntries } from "../lib/utils";
import { formatDate } from "../lib/utils";

interface EntriesListProps {
  entries: string[];
  selectedDate: { date: string; obj: Date };
  isToday: boolean;
  isSelectionMode: boolean;
  selectedEntries: Set<number>;
  editingIndex: number | null;
  editingContent: string;
  editingTime: string;
  entryImageIds: string[];
  imageUrls: (string | null)[] | undefined;
  onToggleSelectionMode: () => void;
  onToggleEntrySelection: (index: number) => void;
  onToggleSelectAll: () => void;
  onBulkCopy: () => void;
  onBulkDelete: () => void;
  onEditStart: (index: number, content: string, time: string | null) => void;
  onEditCancel: () => void;
  onEditSave: (index: number) => void;
  onEditContentChange: (value: string) => void;
  onEditTimeChange: (value: string) => void;
  onCopy: (content: string) => void;
  onDelete: (index: number) => void;
  onReturnToToday: () => void;
  onCopyAllPosts: () => void;
  userId: string | undefined;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function EntriesList({
  entries,
  selectedDate,
  isToday,
  isSelectionMode,
  selectedEntries,
  editingIndex,
  editingContent,
  editingTime,
  entryImageIds,
  imageUrls,
  onToggleSelectionMode,
  onToggleEntrySelection,
  onToggleSelectAll,
  onBulkCopy,
  onBulkDelete,
  onEditStart,
  onEditCancel,
  onEditSave,
  onEditContentChange,
  onEditTimeChange,
  onCopy,
  onDelete,
  onReturnToToday,
  onCopyAllPosts,
  userId,
  scrollRef,
}: EntriesListProps) {
  return (
    <section ref={scrollRef} className="space-y-4">
      <div className="flex items-center justify-between gap-3 text-slate-100">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold tracking-tight">
            {isToday
              ? "Today"
              : selectedDate.obj.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
          </h2>
          {!isToday && (
            <button
              onClick={onReturnToToday}
              className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full text-slate-400 hover:text-white transition-colors font-medium border border-slate-700"
            >
              Return to Today
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            <>
              <button
                onClick={onToggleSelectionMode}
                className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full text-slate-400 hover:text-white transition-colors font-medium border border-slate-700 flex items-center gap-1.5"
              >
                {isSelectionMode ? (
                  <>
                    <X size={12} />
                    Cancel
                  </>
                ) : (
                  <>
                    <CheckSquare size={12} />
                    Select
                  </>
                )}
              </button>
              <button
                onClick={onCopyAllPosts}
                className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full text-slate-400 hover:text-white transition-colors font-medium border border-slate-700 flex items-center gap-1.5"
                title="Copy all posts to clipboard"
              >
                <Copy size={12} />
                Copy All
              </button>
            </>
          )}
        </div>
      </div>

      {isSelectionMode && entries.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSelectAll}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              {selectedEntries.size === entries.length ? (
                <CheckSquare size={18} className="text-blue-500" />
              ) : (
                <Square size={18} />
              )}
            </button>
            <span className="text-sm text-slate-400">
              {selectedEntries.size > 0
                ? `${selectedEntries.size} selected`
                : "Select entries"}
            </span>
          </div>
          {selectedEntries.size > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={onBulkCopy}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Copy size={14} />
                Copy
              </button>
              <button
                onClick={onBulkDelete}
                className="px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-400 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 border border-red-800/40"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-3xl border border-dashed border-slate-800 bg-slate-900/20 text-slate-500 text-center">
          <div className="bg-slate-900 p-4 rounded-full mb-4 shadow-inner">
            <Sparkles size={24} className="text-slate-600" />
          </div>
          <p className="text-base font-medium text-slate-400">Quiet day.</p>
          <p className="text-sm opacity-60 mt-1">
            Ready to log something new?
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {entries.map((entry, idx) => {
            const match = entry.match(/^\[(.*?)\]\s(.*)/s);
            const time = match ? match[1] : null;
            const content = match ? match[2] : entry;
            const isLastEntry = idx === entries.length - 1;
            const isSelected = selectedEntries.has(idx);

            return (
              <EntryCard
                key={idx}
                entry={entry}
                index={idx}
                time={time}
                content={content}
                isLastEntry={isLastEntry}
                isSelected={isSelected}
                isSelectionMode={isSelectionMode}
                editingIndex={editingIndex}
                editingContent={editingContent}
                editingTime={editingTime}
                entryImageIds={entryImageIds}
                imageUrls={imageUrls}
                onToggleSelection={() => {
                  if (isSelectionMode) {
                    onToggleEntrySelection(idx);
                  }
                }}
                onEditStart={() => {
                  // Parse time for editing
                  let parsedTime: string | null = null;
                  if (time) {
                    try {
                      const timeStr = time.trim();
                      const timeMatch = timeStr.match(
                        /(\d{1,2}):(\d{2})\s*(AM|PM)/i
                      );
                      if (timeMatch) {
                        let hours = parseInt(timeMatch[1], 10);
                        const minutes = parseInt(timeMatch[2], 10);
                        const period = timeMatch[3].toUpperCase();

                        if (period === "PM" && hours !== 12) {
                          hours += 12;
                        } else if (period === "AM" && hours === 12) {
                          hours = 0;
                        }
                        parsedTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
                      } else {
                        const [h, m] = timeStr.split(":").map(Number);
                        if (!isNaN(h) && !isNaN(m)) {
                          parsedTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                        }
                      }
                    } catch {
                      // Use current time as fallback
                    }
                  }
                  if (!parsedTime) {
                    const now = new Date();
                    parsedTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
                  }
                  onEditStart(idx, content, parsedTime);
                }}
                onEditCancel={onEditCancel}
                onEditSave={() => onEditSave(idx)}
                onEditContentChange={onEditContentChange}
                onEditTimeChange={onEditTimeChange}
                onCopy={() => onCopy(content)}
                onDelete={() => onDelete(idx)}
                userId={userId}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

