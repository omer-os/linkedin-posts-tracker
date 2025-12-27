import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const getPosts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Convert array to object keyed by date for easier lookup
    const postsByDate: Record<string, { date: string; content: string; count: number; lastUpdated: number; imageIds?: Id<"_storage">[] }> = {};
    posts.forEach((post) => {
      postsByDate[post.date] = {
        date: post.date,
        content: post.content,
        count: post.count,
        lastUpdated: post.lastUpdated,
        imageIds: post.imageIds,
      };
    });

    return postsByDate;
  },
});

export const addPost = mutation({
  args: {
    userId: v.string(),
    date: v.string(),
    content: v.string(),
    count: v.number(),
    imageIds: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    // Check if post exists for this user and date
    const existing = await ctx.db
      .query("posts")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    if (existing) {
      // Merge existing imageIds with new ones
      const existingImageIds = existing.imageIds || [];
      const newImageIds = args.imageIds || [];
      const mergedImageIds = [...existingImageIds, ...newImageIds];
      
      // Update existing post
      await ctx.db.patch(existing._id, {
        content: args.content,
        count: args.count,
        lastUpdated: Date.now(),
        imageIds: mergedImageIds.length > 0 ? mergedImageIds : undefined,
      });
      return existing._id;
    } else {
      // Create new post
      return await ctx.db.insert("posts", {
        userId: args.userId,
        date: args.date,
        content: args.content,
        count: args.count,
        lastUpdated: Date.now(),
        imageIds: args.imageIds && args.imageIds.length > 0 ? args.imageIds : undefined,
      });
    }
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const getImageUrls = query({
  args: { storageIds: v.array(v.id("_storage")) },
  handler: async (ctx, args) => {
    const urls = await Promise.all(
      args.storageIds.map((id) => ctx.storage.getUrl(id))
    );
    return urls;
  },
});

export const deleteEntries = mutation({
  args: {
    userId: v.string(),
    date: v.string(),
    entryIndices: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("posts")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    if (!existing) return;

    // Split by double newline followed by timestamp pattern [HH:MM]
    // This ensures entries with \n\n in their content don't get split incorrectly
    const entryPattern = /\n\n(?=\[\d{2}:\d{2}(?::\d{2})?\])/;
    const entries = existing.content.split(entryPattern).filter((entry) => entry.trim().length > 0);
    const sortedIndices = [...args.entryIndices].sort((a, b) => b - a);
    
    // Remove entries in reverse order to maintain indices
    sortedIndices.forEach((idx) => {
      if (idx >= 0 && idx < entries.length) {
        entries.splice(idx, 1);
      }
    });

    const newContent = entries.join("\n\n");
    const newCount = entries.length;

    if (newCount === 0) {
      // Delete the entire post if no entries remain
      await ctx.db.delete(existing._id);
    } else {
      await ctx.db.patch(existing._id, {
        content: newContent,
        count: newCount,
        lastUpdated: Date.now(),
      });
    }
  },
});

export const editEntry = mutation({
  args: {
    userId: v.string(),
    date: v.string(),
    entryIndex: v.number(),
    newContent: v.string(),
    newTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("posts")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    if (!existing) return;

    // Split by double newline followed by timestamp pattern [HH:MM]
    const entryPattern = /\n\n(?=\[\d{2}:\d{2}(?::\d{2})?\])/;
    const entries = existing.content.split(entryPattern).filter((entry) => entry.trim().length > 0);
    
    if (args.entryIndex < 0 || args.entryIndex >= entries.length) return;

    // Use newTime if provided, otherwise preserve original timestamp
    let timeToUse: string | null = null;
    if (args.newTime) {
      // Convert 24-hour format (HH:MM) to 12-hour format with AM/PM
      const [hours, minutes] = args.newTime.split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      timeToUse = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      // Extract timestamp from the original entry
      const originalEntry = entries[args.entryIndex];
      const match = originalEntry.match(/^\[(.*?)\]\s(.*)/s);
      timeToUse = match ? match[1] : null;
    }
    
    // Use new time if provided, otherwise preserve original
    const updatedEntry = timeToUse 
      ? `[${timeToUse}] ${args.newContent.trim()}`
      : args.newContent.trim();
    
    entries[args.entryIndex] = updatedEntry;
    const newContent = entries.join("\n\n");

    await ctx.db.patch(existing._id, {
      content: newContent,
      lastUpdated: Date.now(),
    });
  },
});

