"use client";

import React from "react";
import { Linkedin, TrendingUp } from "lucide-react";

interface AppHeaderProps {
  totalPosts: number;
  currentStreak: number;
}

export function AppHeader({ totalPosts, currentStreak }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-600 to-blue-500 p-1.5 rounded-lg text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <Linkedin size={18} />
          </div>
          <h1 className="font-bold text-base tracking-tight text-slate-100">
            Post Tracker
          </h1>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
            <span className="text-slate-400">Total</span>
            <span className="text-slate-100">{totalPosts}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
            <span className="text-slate-400">Streak</span>
            <span className="text-orange-400 flex items-center gap-1">
              <TrendingUp size={12} />
              {currentStreak}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

