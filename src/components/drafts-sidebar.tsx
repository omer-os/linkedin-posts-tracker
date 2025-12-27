"use client";

import React, { useState } from "react";
import { Plus, Check, Trash2, Lightbulb, X } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface DraftsSidebarProps {
  userId: string;
}

export function DraftsSidebar({ userId }: DraftsSidebarProps) {
  const drafts = useQuery(api.drafts.getDrafts, userId && userId.trim() ? { userId } : "skip");
  const addDraftMutation = useMutation(api.drafts.addDraft);
  const toggleDraftMutation = useMutation(api.drafts.toggleDraft);
  const deleteDraftMutation = useMutation(api.drafts.deleteDraft);

  const [newDraftText, setNewDraftText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);

  const handleAddDraft = async () => {
    if (!newDraftText.trim() || isAdding || !userId || !userId.trim()) return;
    setIsAdding(true);
    try {
      await addDraftMutation({
        userId,
        text: newDraftText,
      });
      setNewDraftText("");
      setShowAddInput(false);
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

  if (drafts === undefined) {
    return (
      <div className="w-80 min-w-[320px] bg-slate-900 border-r-2 border-slate-700 flex items-center justify-center h-screen sticky top-0 z-10">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-80 min-w-[320px] bg-slate-900/95 border-r-2 border-slate-700 flex flex-col h-screen sticky top-0 z-10">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-purple-600 to-purple-500 p-1.5 rounded-lg text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]">
            <Lightbulb size={16} />
          </div>
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Drafts
          </h2>
        </div>
      </div>

      {/* Drafts list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {drafts && drafts.length === 0 ? (
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
          drafts?.map((draft) => (
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
                  title={
                    draft.isPosted ? "Mark as not posted" : "Mark as posted"
                  }
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
          ))
        )}
      </div>

      {/* Add Draft button and input at bottom */}
      <div className="p-4 border-t border-slate-700 bg-slate-900/95">
        {showAddInput ? (
          <div className="space-y-2">
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
                  if (e.key === "Escape") {
                    setShowAddInput(false);
                    setNewDraftText("");
                  }
                }}
                placeholder="Enter draft idea..."
                autoFocus
                className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500/50 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
              <button
                onClick={() => {
                  setShowAddInput(false);
                  setNewDraftText("");
                }}
                className="px-2 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
                title="Cancel"
              >
                <X size={16} />
              </button>
            </div>
            <button
              onClick={handleAddDraft}
              disabled={!newDraftText.trim() || isAdding}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm font-medium"
            >
              {isAdding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Add Draft</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              if (userId && userId.trim()) {
                setShowAddInput(true);
              }
            }}
            disabled={!userId || !userId.trim()}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            <span>Add Draft</span>
          </button>
        )}
      </div>
    </div>
  );
}
