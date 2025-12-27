"use client";

import React, { useState } from "react";
import { Plus, Check, Trash2, Lightbulb } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface DraftsSidebarProps {
  userId: string;
}

export function DraftsSidebar({ userId }: DraftsSidebarProps) {
  const drafts = useQuery(api.drafts.getDrafts, { userId });
  const addDraftMutation = useMutation(api.drafts.addDraft);
  const toggleDraftMutation = useMutation(api.drafts.toggleDraft);
  const deleteDraftMutation = useMutation(api.drafts.deleteDraft);

  const [showAll, setShowAll] = useState(false);
  const [newDraftText, setNewDraftText] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const displayedDrafts = showAll ? drafts : drafts?.slice(0, 5);
  const hasMore = drafts && drafts.length > 5;

  const handleAddDraft = async () => {
    if (!newDraftText.trim() || isAdding) return;
    setIsAdding(true);
    try {
      await addDraftMutation({
        userId,
        text: newDraftText,
      });
      setNewDraftText("");
    } catch (error) {
      console.error("Error adding draft:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleDraft = async (draftId: Id<"drafts">) => {
    try {
      await toggleDraftMutation({ draftId });
    } catch (error) {
      console.error("Error toggling draft:", error);
    }
  };

  const handleDeleteDraft = async (draftId: Id<"drafts">) => {
    if (!confirm("Are you sure you want to delete this draft?")) return;
    try {
      await deleteDraftMutation({ draftId });
    } catch (error) {
      console.error("Error deleting draft:", error);
    }
  };

  if (!drafts) {
    return (
      <div className="w-80 bg-slate-900/40 border-r border-slate-800/50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-slate-900/40 border-r border-slate-800/50 flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-slate-800/50">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-gradient-to-tr from-purple-600 to-purple-500 p-1.5 rounded-lg text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]">
            <Lightbulb size={16} />
          </div>
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Drafts
          </h2>
        </div>

        {/* Add new draft input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newDraftText}
            onChange={(e) => setNewDraftText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAddDraft();
              }
            }}
            placeholder="Add new draft..."
            className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500/50 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
          />
          <button
            onClick={handleAddDraft}
            disabled={!newDraftText.trim() || isAdding}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
            title="Add draft"
          >
            {isAdding ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Plus size={16} />
            )}
          </button>
        </div>
      </div>

      {/* Drafts list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {displayedDrafts && displayedDrafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="bg-slate-900 p-3 rounded-full mb-3">
              <Lightbulb size={20} className="text-slate-600" />
            </div>
            <p className="text-sm text-slate-400">No drafts yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Add your first post idea
            </p>
          </div>
        ) : (
          <>
            {displayedDrafts?.map((draft) => (
              <div
                key={draft._id}
                className={`group relative bg-slate-800/60 border rounded-lg p-3 transition-all ${
                  draft.isPosted
                    ? "border-green-700/50 bg-green-950/10 opacity-75"
                    : "border-slate-700/50 hover:bg-slate-800 hover:border-slate-700"
                }`}
              >
                <p
                  className={`text-sm leading-relaxed ${
                    draft.isPosted
                      ? "text-slate-400 line-through"
                      : "text-slate-200"
                  }`}
                >
                  {draft.text}
                </p>
                <div className="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleToggleDraft(draft._id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      draft.isPosted
                        ? "text-green-400 hover:bg-green-950/20"
                        : "text-slate-400 hover:text-green-400 hover:bg-slate-700/50"
                    }`}
                    title={draft.isPosted ? "Mark as not posted" : "Mark as posted"}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteDraft(draft._id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                    title="Delete draft"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {hasMore && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full py-2 text-sm text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 rounded-lg transition-colors"
              >
                Load More ({drafts.length - 5} more)
              </button>
            )}
            {showAll && hasMore && (
              <button
                onClick={() => setShowAll(false)}
                className="w-full py-2 text-sm text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 rounded-lg transition-colors"
              >
                Show Less
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

