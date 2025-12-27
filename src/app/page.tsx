"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser, useAuth, SignInButton } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import {
  Send,
  Linkedin,
  TrendingUp,
  Calendar,
  Clock,
  Sparkles,
  ChevronDown,
  Image as ImageIcon,
  X,
  Copy,
  Trash2,
  CheckSquare,
  Square,
  Edit,
  Check,
} from "lucide-react";

const formatDate = (date: Date): string => {
  // Format date in local timezone to avoid day shift issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getIntensityClass = (count: number): string => {
  if (count === 0) return "bg-slate-800/50 hover:bg-slate-700/80";
  if (count === 1)
    return "bg-blue-900/40 hover:bg-blue-800/60 border border-blue-800/30";
  if (count === 2)
    return "bg-blue-600/60 hover:bg-blue-500/70 border border-blue-500/30";
  if (count >= 3)
    return "bg-blue-500 hover:bg-blue-400 border border-blue-400/50 shadow-[0_0_8px_rgba(59,130,246,0.6)]";
  return "bg-slate-800/50";
};

const getMonthName = (monthIndex: number): string => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months[monthIndex];
};

const formatDateForTooltip = (dateStr: string): string => {
  // Parse YYYY-MM-DD in local timezone to avoid day shift issues
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const monthName = getMonthName(date.getMonth());
  const dayNum = date.getDate();
  const yearNum = date.getFullYear();
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  return `${weekday}, ${monthName} ${dayNum}, ${yearNum}`;
};

const splitEntries = (content: string): string[] => {
  // Split by double newline followed by timestamp pattern [HH:MM]
  // This ensures entries with \n\n in their content don't get split incorrectly
  const entryPattern = /\n\n(?=\[\d{2}:\d{2}(?::\d{2})?\])/;
  return content.split(entryPattern).filter((entry) => entry.trim().length > 0);
};

type DayData = {
  date: string;
  obj: Date;
  count: number;
};

type SelectedDate = {
  date: string;
  obj: Date;
};

export default function App() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const convexUser = useQuery(api.auth.getCurrentUser);
  const userId = convexUser?.userId || clerkUser?.id;

  const posts = useQuery(api.posts.getPosts, userId ? { userId } : "skip");
  const addPostMutation = useMutation(api.posts.addPost);
  const deleteEntriesMutation = useMutation(api.posts.deleteEntries);
  const editEntryMutation = useMutation(api.posts.editEntry);
  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);

  const [selectedDate, setSelectedDate] = useState<SelectedDate>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return { date: formatDate(d), obj: d };
  });
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [inputContent, setInputContent] = useState("");
  const [entryTime, setEntryTime] = useState(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  });
  const [imagePreviews, setImagePreviews] = useState<
    Array<{ file: File; preview: string; storageId?: string }>
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(
    new Set()
  );
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");
  const [editingTime, setEditingTime] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const todayButtonRef = useRef<HTMLButtonElement>(null);

  // Compute entryImageIds for the selected date
  const currentPostData = posts?.[selectedDate.date];
  const entryImageIds = currentPostData?.imageIds || [];

  const imageUrls = useQuery(
    api.posts.getImageUrls,
    entryImageIds.length > 0 ? { storageIds: entryImageIds as any } : "skip"
  );

  const loading =
    !clerkLoaded ||
    (clerkUser && convexUser === undefined) ||
    (convexUser && posts === undefined);
  const isAuthenticated =
    isSignedIn &&
    clerkUser !== null &&
    clerkUser !== undefined &&
    convexUser !== null;

  const calendarData = useMemo(() => {
    const days: DayData[] = [];
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = formatDate(new Date(d));
      days.push({
        date: dateStr,
        obj: new Date(d),
        count: posts?.[dateStr]?.count || 0,
      });
    }
    return days;
  }, [posts, currentYear]);

  const weeks = useMemo(() => {
    const weeksArr: (DayData | null)[][] = [];
    let currentWeek: (DayData | null)[] = [];

    const firstDay = calendarData[0];
    if (firstDay) {
      const startDayIndex = firstDay.obj.getDay();
      for (let i = 0; i < startDayIndex; i++) {
        currentWeek.push(null);
      }
    }

    calendarData.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeksArr.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeksArr.push(currentWeek);
    }

    return weeksArr;
  }, [calendarData]);

  const stats = useMemo(() => {
    if (!posts) return { totalPosts: 0, currentStreak: 0 };
    const totalPosts = Object.values(posts).reduce(
      (acc, curr) => acc + (curr.count || 0),
      0
    );
    let currentStreak = 0;
    const todayStr = formatDate(new Date());
    let checkDate = new Date();
    if (!posts[todayStr] || posts[todayStr].count === 0) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (true) {
      const dateStr = formatDate(checkDate);
      if (posts[dateStr] && posts[dateStr].count > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return { totalPosts, currentStreak };
  }, [posts]);

  const availableYears = useMemo(() => {
    const baseYears = [2024, 2025, 2026];
    if (!posts) return baseYears;
    const dataYears = Object.keys(posts).map((dateStr) => {
      // Extract year directly from YYYY-MM-DD string to avoid timezone issues
      return parseInt(dateStr.split("-")[0], 10);
    });
    const allYears = new Set([...baseYears, ...dataYears]);
    return Array.from(allYears).sort((a, b) => b - a);
  }, [posts]);

  const handleDayClick = (day: DayData | null) => {
    if (!day) return;
    const d = new Date(day.obj);
    d.setHours(0, 0, 0, 0);
    setSelectedDate({ date: day.date, obj: d });
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleSubmit = async () => {
    if (!userId || (!inputContent.trim() && imagePreviews.length === 0)) return;
    if (isUploading) return;

    setIsUploading(true);
    const dateStr = selectedDate.date;
    const existingDoc = posts?.[dateStr];
    const newEntry = inputContent.trim();
    // Convert 24-hour format (HH:MM) to 12-hour format with AM/PM
    let timeStamp: string;
    if (entryTime) {
      const [hours, minutes] = entryTime.split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      timeStamp = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      timeStamp = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    const formattedEntry = `[${timeStamp}] ${newEntry || "(image entry)"}`;
    let finalContent = formattedEntry;
    let newCount = 1;
    if (existingDoc) {
      finalContent = existingDoc.content + "\n\n" + formattedEntry;
      newCount = (existingDoc.count || 0) + 1;
    }

    try {
      // Upload images first
      const imageIds: string[] = [];
      for (const imagePreview of imagePreviews) {
        if (imagePreview.storageId) {
          imageIds.push(imagePreview.storageId);
        } else {
          const uploadUrl = await generateUploadUrl();
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": imagePreview.file.type },
            body: imagePreview.file,
          });
          const responseText = await result.text();
          // Parse JSON response if it's a JSON string, otherwise use as-is
          let storageId: string;
          try {
            const parsed = JSON.parse(responseText);
            storageId =
              typeof parsed === "string"
                ? parsed
                : parsed.storageId || parsed.id;
          } catch {
            // If it's not JSON, use the text directly
            storageId = responseText;
          }
          imageIds.push(storageId);
        }
      }

      await addPostMutation({
        userId: userId,
        date: dateStr,
        content: finalContent,
        count: newCount,
        imageIds: imageIds.length > 0 ? (imageIds as any) : undefined,
      });
      setInputContent("");
      setImagePreviews([]);
      // Reset time to current time after submission
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setEntryTime(`${hours}:${minutes}`);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.overflowY = "hidden";
      }
    } catch (e) {
      console.error("Error saving:", e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPreviews: Array<{ file: File; preview: string }> = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const preview = URL.createObjectURL(file);
        newPreviews.push({ file, preview });
      }
    });

    setImagePreviews((prev) => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    const newPreviews: Array<{ file: File; preview: string }> = [];

    Array.from(items).forEach((item) => {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          const preview = URL.createObjectURL(file);
          newPreviews.push({ file, preview });
        }
      }
    });

    if (newPreviews.length > 0) {
      e.preventDefault();
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImagePreview = (index: number) => {
    setImagePreviews((prev) => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index].preview);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const minHeight = 80; // min-h-[80px] equivalent
      const maxHeight = 200; // max-h-[200px] equivalent
      textareaRef.current.style.height = `${Math.max(minHeight, Math.min(scrollHeight, maxHeight))}px`;
      textareaRef.current.style.overflowY =
        scrollHeight > maxHeight ? "auto" : "hidden";
    }
  }, [inputContent]);

  useEffect(() => {
    if (editTextareaRef.current && editingIndex !== null) {
      editTextareaRef.current.style.height = "auto";
      const scrollHeight = editTextareaRef.current.scrollHeight;
      const maxHeight = 400; // max height for edit textarea
      editTextareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      editTextareaRef.current.style.overflowY =
        scrollHeight > maxHeight ? "auto" : "hidden";
    }
  }, [editingContent, editingIndex]);

  const toggleEntrySelection = (index: number) => {
    setSelectedEntries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedEntries.size === entries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(entries.map((_, idx) => idx)));
    }
  };

  const handleBulkDelete = async () => {
    if (!userId || selectedEntries.size === 0) return;
    const indices = Array.from(selectedEntries);
    try {
      await deleteEntriesMutation({
        userId,
        date: selectedDate.date,
        entryIndices: indices,
      });
      setSelectedEntries(new Set());
      setIsSelectionMode(false);
    } catch (e) {
      console.error("Error deleting entries:", e);
    }
  };

  const handleBulkCopy = () => {
    const selectedContent = entries
      .filter((_, idx) => selectedEntries.has(idx))
      .join("\n\n");
    navigator.clipboard.writeText(selectedContent);
    setSelectedEntries(new Set());
    setIsSelectionMode(false);
  };

  const handleCopyAllPosts = () => {
    if (!posts) return;
    const allPosts = Object.entries(posts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, post]) => {
        // Parse YYYY-MM-DD in local timezone to avoid day shift issues
        const [year, month, day] = date.split("-").map(Number);
        const dateObj = new Date(year, month - 1, day);
        const formattedDate = dateObj.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        return `=== ${formattedDate} ===\n${post.content}`;
      })
      .join("\n\n");
    navigator.clipboard.writeText(allPosts);
  };

  useEffect(() => {
    if (!isSelectionMode) {
      setSelectedEntries(new Set());
    }
  }, [isSelectionMode]);

  // Scroll to today's date in calendar on initial load
  useEffect(() => {
    const scrollToToday = () => {
      if (todayButtonRef.current) {
        todayButtonRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }
    };
    // Small delay to ensure calendar is rendered
    const timeoutId = setTimeout(scrollToToday, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  const isToday = selectedDate.date === formatDate(new Date());
  const entries = currentPostData ? splitEntries(currentPostData.content) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated && clerkLoaded && !isSignedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
            <div className="bg-gradient-to-tr from-blue-600 to-blue-500 p-3 rounded-lg text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] w-fit mx-auto mb-4">
              <Linkedin size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">
              Sign in to Post Tracker
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Sign in to start tracking your LinkedIn posts
            </p>
            <SignInButton mode="modal" fallbackRedirectUrl="/">
              <button className="px-6 py-3 bg-gradient-to-tr from-blue-600 to-blue-500 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 font-medium">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 pb-40">
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
              <span className="text-slate-100">{stats.totalPosts}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Streak</span>
              <span className="text-orange-400 flex items-center gap-1">
                <TrendingUp size={12} />
                {stats.currentStreak}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <section className="bg-slate-900/40 rounded-3xl border border-slate-800/50 p-6 shadow-2xl backdrop-blur-sm w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Calendar size={14} />
              Activity Graph
            </h2>
            <div className="relative group">
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
                className="appearance-none bg-slate-950 border border-slate-700 text-slate-200 text-xs font-medium py-1.5 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer hover:bg-slate-800 transition-colors shadow-sm"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-slate-200 transition-colors"
              />
            </div>
          </div>

          <div className="w-full flex justify-center">
            <div className="inline-flex flex-col gap-1 max-w-full">
              <div className="flex gap-[2px] mb-2 text-[9px] text-slate-500 font-medium h-3 pl-6">
                {weeks.map((week, i) => {
                  const firstDay = week.find((d) => d !== null);
                  if (firstDay && firstDay.obj.getDate() <= 7) {
                    return (
                      <span
                        key={i}
                        className="w-[8px] sm:w-[10px] overflow-visible"
                      >
                        {getMonthName(firstDay.obj.getMonth())}
                      </span>
                    );
                  }
                  return <span key={i} className="w-[8px] sm:w-[10px]"></span>;
                })}
              </div>

              <div className="flex gap-2">
                <div className="flex flex-col gap-[2px] text-[9px] text-slate-600 font-medium pt-[1px] pr-1">
                  <span className="h-[8px] sm:h-[10px] leading-[8px] sm:leading-[10px]">
                    Mon
                  </span>
                  <span className="h-[8px] sm:h-[10px] leading-[8px] sm:leading-[10px] mt-[10px] sm:mt-[12px]">
                    Wed
                  </span>
                  <span className="h-[8px] sm:h-[10px] leading-[8px] sm:leading-[10px] mt-[10px] sm:mt-[12px]">
                    Fri
                  </span>
                </div>

                <div className="flex gap-[2px]">
                  {weeks.map((week, wIndex) => (
                    <div key={wIndex} className="flex flex-col gap-[2px]">
                      {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                        const dayData = week[dayIndex];
                        if (!dayData) {
                          return (
                            <div
                              key={dayIndex}
                              className="w-[8px] h-[8px] sm:w-[10px] sm:h-[10px]"
                            ></div>
                          );
                        }
                        const isSelected = selectedDate.date === dayData.date;
                        const isTodayDate =
                          dayData.date === formatDate(new Date());
                        const formattedDate = formatDateForTooltip(
                          dayData.date
                        );
                        return (
                          <button
                            key={dayIndex}
                            ref={isTodayDate ? todayButtonRef : null}
                            onClick={() => handleDayClick(dayData)}
                            className={`
                              relative group/tooltip w-[8px] h-[8px] sm:w-[10px] sm:h-[10px] rounded-[2px] transition-all duration-300
                              ${getIntensityClass(dayData.count)}
                              ${isSelected ? "ring-2 ring-white ring-offset-1 ring-offset-slate-900 z-10 scale-110 shadow-lg shadow-blue-500/20" : ""}
                            `}
                          >
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-slate-900 text-slate-100 text-xs rounded-lg shadow-lg border border-slate-700 whitespace-nowrap pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150 z-50">
                              <div className="font-medium">{formattedDate}</div>
                              <div className="text-slate-400 mt-0.5">
                                {dayData.count}{" "}
                                {dayData.count === 1 ? "post" : "posts"}
                              </div>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-700"></div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

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
                  onClick={() => {
                    const d = new Date();
                    setSelectedDate({ date: formatDate(d), obj: d });
                    setCurrentYear(d.getFullYear());
                  }}
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
                    onClick={() => setIsSelectionMode(!isSelectionMode)}
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
                    onClick={handleCopyAllPosts}
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
                  onClick={toggleSelectAll}
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
                    onClick={handleBulkCopy}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <Copy size={14} />
                    Copy
                  </button>
                  <button
                    onClick={handleBulkDelete}
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
                  <div
                    key={idx}
                    className={`group relative ${
                      isSelectionMode ? "cursor-pointer" : ""
                    }`}
                    onClick={() => {
                      if (isSelectionMode) {
                        toggleEntrySelection(idx);
                      }
                    }}
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
                          {editingIndex === idx ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 mb-2">
                                <label className="text-xs text-slate-400 flex items-center gap-1.5">
                                  <Clock size={12} />
                                  Time:
                                </label>
                                <input
                                  type="time"
                                  value={editingTime}
                                  onChange={(e) =>
                                    setEditingTime(e.target.value)
                                  }
                                  className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 cursor-pointer hover:bg-slate-800/80 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                  title="Edit entry time"
                                />
                              </div>
                              <textarea
                                ref={editTextareaRef}
                                value={editingContent}
                                onChange={(e) =>
                                  setEditingContent(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") {
                                    setEditingIndex(null);
                                    setEditingContent("");
                                    setEditingTime("");
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
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!userId || !editingContent.trim())
                                      return;
                                    try {
                                      await editEntryMutation({
                                        userId,
                                        date: selectedDate.date,
                                        entryIndex: idx,
                                        newContent: editingContent.trim(),
                                        newTime: editingTime || undefined,
                                      });
                                      setEditingIndex(null);
                                      setEditingContent("");
                                      setEditingTime("");
                                    } catch (error) {
                                      console.error(
                                        "Error editing entry:",
                                        error
                                      );
                                    }
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
                                    setEditingIndex(null);
                                    setEditingContent("");
                                    setEditingTime("");
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
                        {!isSelectionMode && editingIndex !== idx && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingIndex(idx);
                                setEditingContent(content);
                                // Convert 12-hour format (09:45 PM) to 24-hour format (21:45) for time input
                                if (time) {
                                  try {
                                    // Parse the time string (e.g., "09:45 PM" or "9:45 AM")
                                    const timeStr = time.trim();
                                    // Match time pattern with optional space before AM/PM
                                    const timeMatch = timeStr.match(
                                      /(\d{1,2}):(\d{2})\s*(AM|PM)/i
                                    );
                                    if (timeMatch) {
                                      let hours = parseInt(timeMatch[1], 10);
                                      const minutes = parseInt(
                                        timeMatch[2],
                                        10
                                      );
                                      const period = timeMatch[3].toUpperCase();

                                      if (period === "PM" && hours !== 12) {
                                        hours += 12;
                                      } else if (
                                        period === "AM" &&
                                        hours === 12
                                      ) {
                                        hours = 0;
                                      }
                                      setEditingTime(
                                        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
                                      );
                                    } else {
                                      // If format doesn't match, try to parse as 24-hour format
                                      const [h, m] = timeStr
                                        .split(":")
                                        .map(Number);
                                      if (!isNaN(h) && !isNaN(m)) {
                                        setEditingTime(
                                          `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
                                        );
                                      } else {
                                        throw new Error("Invalid time format");
                                      }
                                    }
                                  } catch {
                                    // If parsing fails, use current time
                                    const now = new Date();
                                    setEditingTime(
                                      `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
                                    );
                                  }
                                } else {
                                  // If no time, use current time
                                  const now = new Date();
                                  setEditingTime(
                                    `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
                                  );
                                }
                                setTimeout(() => {
                                  editTextareaRef.current?.focus();
                                }, 0);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                              title="Edit entry"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(content);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                              title="Copy entry"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (
                                  !userId ||
                                  !confirm(
                                    "Are you sure you want to delete this entry?"
                                  )
                                )
                                  return;
                                try {
                                  await deleteEntriesMutation({
                                    userId,
                                    date: selectedDate.date,
                                    entryIndices: [idx],
                                  });
                                } catch (error) {
                                  console.error("Error deleting entry:", error);
                                }
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
              })}
            </div>
          )}
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40 pb-6 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative group bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 focus-within:border-slate-600/60 shadow-xl transition-all duration-200">
            {/* Attachments Section */}
            {imagePreviews.length > 0 && (
              <div className="px-4 pt-4 pb-3 border-b border-slate-700/40">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {imagePreviews.map((preview, idx) => {
                    const fileName =
                      preview.file.name || `image-${idx + 1}.png`;
                    return (
                      <div
                        key={idx}
                        className="flex-shrink-0 flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 min-w-[140px]"
                      >
                        <Square
                          size={14}
                          className="text-slate-400 flex-shrink-0"
                        />
                        <span className="text-slate-300 text-xs font-medium truncate flex-1">
                          {fileName}
                        </span>
                        <button
                          onClick={() => removeImagePreview(idx)}
                          className="text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Content Input Section */}
            <div className="p-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 min-w-0">
                  <textarea
                    ref={textareaRef}
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder="Write the Entery content"
                    className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm leading-relaxed outline-none resize-none min-h-[80px]"
                    rows={1}
                  />
                </div>

                <div className="flex items-end gap-2 flex-shrink-0 pb-1">
                  {/* Time Input */}
                  <div className="flex flex-col items-end gap-1">
                    <input
                      type="time"
                      value={entryTime}
                      onChange={(e) => setEntryTime(e.target.value)}
                      className="bg-slate-800/60 h-10 border border-slate-700/50 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 cursor-pointer hover:bg-slate-800/80 transition-colors"
                      title="Time when the post was published on LinkedIn"
                    />
                  </div>

                  {/* Image Upload Button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:text-slate-100 hover:bg-slate-800/80 hover:border-slate-600/50 transition-all duration-200 flex items-center justify-center"
                    title="Upload images"
                  >
                    <ImageIcon size={18} />
                  </button>

                  {/* Send Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={
                      (!inputContent.trim() && imagePreviews.length === 0) ||
                      isUploading
                    }
                    className="p-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center disabled:hover:bg-blue-600"
                  >
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[120px] opacity-40"></div>
      </div>
    </div>
  );
}
