"use client";

import { ClerkProvider } from "@clerk/clerk-react";
import { ReactNode } from "react";

export function ClerkClientProvider({ children }: { children: ReactNode }) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!clerkPublishableKey) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-2">Clerk not configured</p>
          <p className="text-sm text-slate-500">
            Please set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env.local
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      {children}
    </ClerkProvider>
  );
}
