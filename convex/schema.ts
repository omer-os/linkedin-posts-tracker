import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  posts: defineTable({
    userId: v.string(),
    date: v.string(),
    content: v.string(),
    count: v.number(),
    lastUpdated: v.number(),
    imageIds: v.optional(v.array(v.id("_storage"))),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),
});

