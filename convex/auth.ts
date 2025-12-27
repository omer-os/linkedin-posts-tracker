import { query } from "./_generated/server";

export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    // For Clerk, the subject is the user ID
    return {
      userId: identity.subject,
      tokenIdentifier: identity.tokenIdentifier,
    };
  },
});
