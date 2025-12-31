export const formatDate = (date: Date): string => {
  // Format date in local timezone to avoid day shift issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getIntensityClass = (count: number): string => {
  if (count === 0) return "bg-slate-800/50 hover:bg-slate-700/80";
  if (count === 1)
    return "bg-blue-900/40 hover:bg-blue-800/60 border border-blue-800/30";
  if (count === 2)
    return "bg-blue-600/60 hover:bg-blue-500/70 border border-blue-500/30";
  if (count >= 3)
    return "bg-blue-500 hover:bg-blue-400 border border-blue-400/50 shadow-[0_0_8px_rgba(59,130,246,0.6)]";
  return "bg-slate-800/50";
};

export const getMonthName = (monthIndex: number): string => {
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

export const formatDateForTooltip = (dateStr: string): string => {
  // Parse YYYY-MM-DD in local timezone to avoid day shift issues
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const monthName = getMonthName(date.getMonth());
  const dayNum = date.getDate();
  const yearNum = date.getFullYear();
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  return `${weekday}, ${monthName} ${dayNum}, ${yearNum}`;
};

export const containsArabic = (text: string): boolean => {
  // Arabic Unicode range: U+0600 to U+06FF
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text);
};

export const splitEntries = (content: string): string[] => {
  // Split by double newline followed by timestamp pattern [HH:MM AM/PM]
  // This ensures entries with \n\n in their content don't get split incorrectly
  // Match both 12-hour format [HH:MM AM/PM] and 24-hour format [HH:MM] for backward compatibility
  const entryPattern = /\n\n(?=\[\d{1,2}:\d{2}(?:\s*(?:AM|PM))?\])/i;
  const entries = content.split(entryPattern).filter((entry) => entry.trim().length > 0);
  
  // If no entries were split but content exists, treat the whole content as one entry
  if (entries.length === 0 && content.trim().length > 0) {
    return [content.trim()];
  }
  
  return entries;
};
