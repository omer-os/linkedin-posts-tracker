"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser, useAuth, SignInButton } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import { Linkedin } from "lucide-react";
import { DraftsSidebar } from "../components/drafts-sidebar";
import { AppHeader } from "../components/app-header";
import { ActivityGraph } from "../components/activity-graph";
import { EntriesList } from "../components/entries-list";
import { PostInputForm } from "../components/post-input-form";
import { formatDate, splitEntries } from "../lib/utils";
import { DayData, SelectedDate } from "../lib/types";

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
  const scrollRef = useRef<HTMLDivElement>(null);
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
      return parseInt(dateStr.split("-")[0], 10);
    });
    const allYears = new Set([...baseYears, ...dataYears]);
    return Array.from(allYears).sort((a, b) => b - a);
  }, [posts]);

  const handleDayClick = (day: DayData) => {
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
          let storageId: string;
          try {
            const parsed = JSON.parse(responseText);
            storageId =
              typeof parsed === "string"
                ? parsed
                : parsed.storageId || parsed.id;
          } catch {
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
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setEntryTime(`${hours}:${minutes}`);
    } catch (e) {
      console.error("Error saving:", e);
    } finally {
      setIsUploading(false);
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
    if (e.target) e.target.value = "";
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

  const handleEditStart = (index: number, content: string, time: string | null) => {
    setEditingIndex(index);
    setEditingContent(content);
    setEditingTime(time || "");
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditingContent("");
    setEditingTime("");
  };

  const handleEditSave = async (index: number) => {
    if (!userId || !editingContent.trim()) return;
    try {
      await editEntryMutation({
        userId,
        date: selectedDate.date,
        entryIndex: index,
        newContent: editingContent.trim(),
        newTime: editingTime || undefined,
      });
      setEditingIndex(null);
      setEditingContent("");
      setEditingTime("");
    } catch (error) {
      console.error("Error editing entry:", error);
    }
  };

  const handleDeleteEntry = async (index: number) => {
    if (!userId) return;
    try {
      await deleteEntriesMutation({
        userId,
        date: selectedDate.date,
        entryIndices: [index],
      });
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  const handleCopyEntry = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleReturnToToday = () => {
    const d = new Date();
    setSelectedDate({ date: formatDate(d), obj: d });
    setCurrentYear(d.getFullYear());
  };

  useEffect(() => {
    if (!isSelectionMode) {
      setSelectedEntries(new Set());
    }
  }, [isSelectionMode]);

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
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 pb-40 flex">
      {isAuthenticated && userId && <DraftsSidebar userId={userId} />}

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          totalPosts={stats.totalPosts}
          currentStreak={stats.currentStreak}
        />

        <main className="max-w-3xl mx-auto px-4 py-8 space-y-8 flex-1">
          <ActivityGraph
            weeks={weeks}
            currentYear={currentYear}
            availableYears={availableYears}
            selectedDate={selectedDate}
            onYearChange={setCurrentYear}
            onDayClick={handleDayClick}
            todayButtonRef={todayButtonRef}
          />

          <EntriesList
            entries={entries}
            selectedDate={selectedDate}
            isToday={isToday}
            isSelectionMode={isSelectionMode}
            selectedEntries={selectedEntries}
            editingIndex={editingIndex}
            editingContent={editingContent}
            editingTime={editingTime}
            entryImageIds={entryImageIds}
            imageUrls={imageUrls}
            onToggleSelectionMode={() => setIsSelectionMode(!isSelectionMode)}
            onToggleEntrySelection={toggleEntrySelection}
            onToggleSelectAll={toggleSelectAll}
            onBulkCopy={handleBulkCopy}
            onBulkDelete={handleBulkDelete}
            onEditStart={handleEditStart}
            onEditCancel={handleEditCancel}
            onEditSave={handleEditSave}
            onEditContentChange={setEditingContent}
            onEditTimeChange={setEditingTime}
            onCopy={handleCopyEntry}
            onDelete={handleDeleteEntry}
            onReturnToToday={handleReturnToToday}
            onCopyAllPosts={handleCopyAllPosts}
            userId={userId}
            scrollRef={scrollRef}
          />
        </main>

        <PostInputForm
          inputContent={inputContent}
          entryTime={entryTime}
          imagePreviews={imagePreviews}
          isUploading={isUploading}
          isAuthenticated={isAuthenticated}
          userId={userId}
          onContentChange={setInputContent}
          onTimeChange={setEntryTime}
          onFileSelect={handleFileSelect}
          onPaste={handlePaste}
          onRemoveImage={removeImagePreview}
          onSubmit={handleSubmit}
        />
      </div>

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[120px] opacity-40"></div>
      </div>
    </div>
  );
}
