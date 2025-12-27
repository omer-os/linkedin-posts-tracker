import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getDrafts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const drafts = await ctx.db
      .query("drafts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return drafts;
  },
});

export const addDraft = mutation({
  args: {
    userId: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("drafts", {
      userId: args.userId,
      text: args.text.trim(),
      isPosted: false,
      createdAt: Date.now(),
    });
  },
});

export const toggleDraft = mutation({
  args: {
    draftId: v.id("drafts"),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft) return;

    await ctx.db.patch(args.draftId, {
      isPosted: !draft.isPosted,
    });
  },
});

export const deleteDraft = mutation({
  args: {
    draftId: v.id("drafts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.draftId);
  },
});

