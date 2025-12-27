"use client";

import React, { useRef, useEffect } from "react";
import { Clock, Edit, Copy, Trash2, CheckSquare, Square, Check, X, Image as ImageIcon } from "lucide-react";
import { TimePicker } from "./time-picker";

interface EntryCardProps {
  entry: string;
  index: number;
  time: string | null;
  content: string;
  isLastEntry: boolean;
  isSelected: boolean;
  isSelectionMode: boolean;
  editingIndex: number | null;
  editingContent: string;
  editingTime: string;
  entryImageIds: string[];
  imageUrls: (string | null)[] | undefined;
  onToggleSelection: () => void;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditSave: () => void;
  onEditContentChange: (value: string) => void;
  onEditTimeChange: (value: string) => void;
  onCopy: () => void;
  onDelete: () => void;
  userId: string | undefined;
}

export function EntryCard({
  entry,
  index,
  time,
  content,
  isLastEntry,
  isSelected,
  isSelectionMode,
  editingIndex,
  editingContent,
  editingTime,
  entryImageIds,
  imageUrls,
  onToggleSelection,
  onEditStart,
  onEditCancel,
  onEditSave,
  onEditContentChange,
  onEditTimeChange,
  onCopy,
  onDelete,
  userId,
}: EntryCardProps) {
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editTextareaRef.current && editingIndex === index) {
      editTextareaRef.current.style.height = "auto";
      const scrollHeight = editTextareaRef.current.scrollHeight;
      const maxHeight = 400;
      editTextareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      editTextareaRef.current.style.overflowY =
        scrollHeight > maxHeight ? "auto" : "hidden";
    }
  }, [editingContent, editingIndex, index]);

  const parseTimeForEdit = (timeStr: string | null): string => {
    if (!timeStr) {
      const now = new Date();
      return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    }

    try {
      const timeStrTrimmed = timeStr.trim();
      const timeMatch = timeStrTrimmed.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const period = timeMatch[3].toUpperCase();

        if (period === "PM" && hours !== 12) {
          hours += 12;
        } else if (period === "AM" && hours === 12) {
          hours = 0;
        }
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      } else {
        const [h, m] = timeStrTrimmed.split(":").map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        }
      }
    } catch {
      // Fall through to default
    }

    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div
      className={`group relative ${
        isSelectionMode ? "cursor-pointer" : ""
      }`}
      onClick={onToggleSelection}
    >
      <div
        className={`bg-slate-900/60 border rounded-xl p-4 transition-all duration-200 ${
          isSelected
            ? "border-blue-500/60 bg-blue-950/20 ring-2 ring-blue-500/20"
            : "border-slate-800/60 hover:bg-slate-900 hover:border-slate-700"
        } ${isSelectionMode ? "pl-12" : ""}`}
      >
        {isSelectionMode && (
          <div className="absolute left-4 top-4">
            {isSelected ? (
              <CheckSquare size={18} className="text-blue-500" />
            ) : (
              <Square size={18} className="text-slate-500" />
            )}
          </div>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {time && (
              <div className="text-xs font-mono text-blue-400/80 mb-2 flex items-center gap-1.5">
                <Clock size={12} />
                {time}
              </div>
            )}
            {editingIndex === index ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Clock size={12} />
                    Time:
                  </label>
                  <TimePicker
                    value={editingTime}
                    onChange={onEditTimeChange}
                    onClick={(e) => e.stopPropagation()}
                    title="Edit entry time"
                  />
                </div>
                <textarea
                  ref={editTextareaRef}
                  value={editingContent}
                  onChange={(e) => onEditContentChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      onEditCancel();
                    }
                  }}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  rows={Math.min(
                    editingContent.split("\n").length + 2,
                    15
                  )}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditSave();
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors flex items-center gap-1.5"
                    disabled={!editingContent.trim()}
                  >
                    <Check size={14} />
                    Save
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditCancel();
                    }}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                  {content}
                </p>
                {isLastEntry &&
                  entryImageIds.length > 0 &&
                  imageUrls && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {imageUrls.map((imageUrl, imgIdx) => {
                        if (!imageUrl) return null;
                        return (
                          <div
                            key={imgIdx}
                            className="relative group/img aspect-square rounded-lg overflow-hidden border border-slate-700 bg-slate-800"
                          >
                            <img
                              src={imageUrl}
                              alt={`Entry image ${imgIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <a
                              href={imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ImageIcon
                                size={20}
                                className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity"
                              />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )}
              </>
            )}
          </div>
          {!isSelectionMode && editingIndex !== index && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditTimeChange(parseTimeForEdit(time));
                  onEditStart();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Edit entry"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Copy entry"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (
                    !userId ||
                    !confirm(
                      "Are you sure you want to delete this entry?"
                    )
                  )
                    return;
                  onDelete();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                title="Delete entry"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

