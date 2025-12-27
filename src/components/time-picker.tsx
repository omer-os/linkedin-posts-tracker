"use client";

import React, { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";

interface TimePickerProps {
  value: string; // Format: "HH:MM"
  onChange: (value: string) => void;
  className?: string;
  title?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function TimePicker({
  value,
  onChange,
  className = "",
  title,
  onClick,
}: TimePickerProps) {
  const [hours, setHours] = useState(() => {
    if (value) {
      const [h] = value.split(":").map(Number);
      if (!isNaN(h)) {
        const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
        return String(displayHour);
      }
    }
    return "";
  });

  const [minutes, setMinutes] = useState(() => {
    if (value) {
      const [, m] = value.split(":").map(Number);
      return isNaN(m) ? "" : String(m);
    }
    return "";
  });

  const [period, setPeriod] = useState<"AM" | "PM">(() => {
    if (value) {
      const [h] = value.split(":").map(Number);
      if (!isNaN(h)) {
        return h >= 12 ? "PM" : "AM";
      }
    }
    return new Date().getHours() >= 12 ? "PM" : "AM";
  });

  const hoursInputRef = useRef<HTMLInputElement>(null);
  const minutesInputRef = useRef<HTMLInputElement>(null);
  const periodInputRef = useRef<HTMLInputElement>(null);

  // Update internal state when value prop changes from external source
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":").map(Number);
      if (!isNaN(h)) {
        const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
        // Only update if the displayed hour would be different
        const currentDisplayHour = hours === "" ? null : parseInt(hours, 10);
        if (currentDisplayHour !== displayHour) {
          setHours(String(displayHour));
        }
        setPeriod(h >= 12 ? "PM" : "AM");
      }
      if (!isNaN(m)) {
        const currentMin = minutes === "" ? null : parseInt(minutes, 10);
        if (currentMin !== m) {
          setMinutes(String(m));
        }
      }
    } else {
      // If value is empty, clear inputs
      if (hours !== "") setHours("");
      if (minutes !== "") setMinutes("");
    }
  }, [value]);

  const updateTime = (h: string, m: string, p: "AM" | "PM") => {
    // Use current period if hours is empty, otherwise use provided period
    const currentPeriod = h === "" ? period : p;
    
    // If both are empty, use current time or default
    if (h === "" && m === "") {
      const now = new Date();
      const defaultH = now.getHours();
      const defaultM = now.getMinutes();
      onChange(`${String(defaultH).padStart(2, "0")}:${String(defaultM).padStart(2, "0")}`);
      return;
    }
    
    // Parse hour - if empty, use 12 (noon/midnight)
    let hourNum = h === "" ? 12 : parseInt(h, 10);
    if (isNaN(hourNum)) return;
    
    // Convert 12-hour to 24-hour format
    if (hourNum === 0) hourNum = 12;
    if (currentPeriod === "PM" && hourNum !== 12) hourNum += 12;
    if (currentPeriod === "AM" && hourNum === 12) hourNum = 0;
    
    // Parse minutes - if empty, use 0
    const minNum = m === "" ? 0 : parseInt(m, 10);
    if (isNaN(minNum)) return;
    
    // Clamp values to valid ranges
    hourNum = Math.max(0, Math.min(23, hourNum));
    const clampedMin = Math.max(0, Math.min(59, minNum));
    
    onChange(`${String(hourNum).padStart(2, "0")}:${String(clampedMin).padStart(2, "0")}`);
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ""); // Only numbers
    
    // Allow typing freely - validate on blur or when complete
    if (val === "" || val.length <= 2) {
      setHours(val);
      
      // Only update if we have a valid value (1-12) or if it's empty
      const hourNum = val === "" ? null : parseInt(val, 10);
      if (val === "" || (hourNum !== null && hourNum >= 1 && hourNum <= 12)) {
        updateTime(val, minutes, period);
      }
      
      // Auto-focus minutes when hours is complete (2 digits and valid)
      if (val.length === 2 && hourNum !== null && hourNum >= 1 && hourNum <= 12) {
        setTimeout(() => minutesInputRef.current?.focus(), 0);
      }
    }
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ""); // Only numbers
    
    // Allow typing freely - validate on blur or when complete
    if (val === "" || val.length <= 2) {
      setMinutes(val);
      
      // Only update if we have a valid value (0-59) or if it's empty
      const minNum = val === "" ? null : parseInt(val, 10);
      if (val === "" || (minNum !== null && minNum >= 0 && minNum <= 59)) {
        updateTime(hours, val, period);
      }
    }
  };

  const handlePeriodToggle = () => {
    const newPeriod = period === "AM" ? "PM" : "AM";
    setPeriod(newPeriod);
    updateTime(hours, minutes, newPeriod);
  };

  const handleHoursKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ":" || e.key === "/" || e.key === "Enter" || e.key === "ArrowRight") {
      e.preventDefault();
      minutesInputRef.current?.focus();
    }
    if (e.key === "ArrowLeft" && e.currentTarget.selectionStart === 0) {
      e.preventDefault();
    }
  };

  const handleMinutesKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "/" || e.key === "Enter" || e.key === "ArrowRight") {
      e.preventDefault();
      periodInputRef.current?.focus();
    }
    if (e.key === "ArrowLeft" && e.currentTarget.selectionStart === 0) {
      e.preventDefault();
      hoursInputRef.current?.focus();
    }
  };

  const handlePeriodKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handlePeriodToggle();
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      minutesInputRef.current?.focus();
    }
  };

  const handleHoursBlur = () => {
    // Format hours on blur - ensure it's valid
    if (hours !== "") {
      const hourNum = parseInt(hours, 10);
      if (isNaN(hourNum) || hourNum < 1 || hourNum > 12) {
        // Reset to current hour if invalid
        const now = new Date();
        const currentHour = now.getHours();
        const displayHour = currentHour > 12 ? currentHour - 12 : currentHour === 0 ? 12 : currentHour;
        setHours(String(displayHour));
        updateTime(String(displayHour), minutes, period);
      } else {
        // Ensure it's formatted correctly
        updateTime(String(hourNum), minutes, period);
      }
    }
  };

  const handleMinutesBlur = () => {
    // Format minutes on blur - ensure it's valid and padded
    if (minutes !== "") {
      const minNum = parseInt(minutes, 10);
      if (isNaN(minNum) || minNum < 0 || minNum > 59) {
        // Reset to 0 if invalid
        setMinutes("00");
        updateTime(hours, "00", period);
      } else {
        // Pad and update
        const formatted = String(minNum).padStart(2, "0");
        setMinutes(formatted);
        updateTime(hours, formatted, period);
      }
    } else {
      // If empty, set to 00
      setMinutes("00");
      updateTime(hours, "00", period);
    }
  };

  const handleHoursClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.currentTarget.select();
  };

  const handleMinutesClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.currentTarget.select();
  };

  return (
    <div 
      className={`flex items-center h-10 bg-slate-800/60 border border-slate-700/50 rounded-lg px-2.5 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all ${className}`}
      onClick={onClick}
    >
      {/* Hours */}
      <input
        ref={hoursInputRef}
        type="text"
        inputMode="numeric"
        value={hours}
        onChange={handleHoursChange}
        onKeyDown={handleHoursKeyDown}
        onBlur={handleHoursBlur}
        onClick={handleHoursClick}
        onFocus={handleHoursClick}
        placeholder="12"
        maxLength={2}
        className="w-6 text-center bg-transparent text-slate-200 text-xs font-mono outline-none placeholder:text-slate-500/50 focus:text-blue-400 transition-colors"
        title={title}
      />
      
      {/* Separator */}
      <span className="text-slate-500/60 text-xs mx-0.5">:</span>
      
      {/* Minutes */}
      <input
        ref={minutesInputRef}
        type="text"
        inputMode="numeric"
        value={minutes}
        onChange={handleMinutesChange}
        onKeyDown={handleMinutesKeyDown}
        onBlur={handleMinutesBlur}
        onClick={handleMinutesClick}
        onFocus={handleMinutesClick}
        placeholder="00"
        maxLength={2}
        className="w-6 text-center bg-transparent text-slate-200 text-xs font-mono outline-none placeholder:text-slate-500/50 focus:text-blue-400 transition-colors"
      />
      
      {/* Separator */}
      <span className="text-slate-500/60 text-xs mx-0.5">/</span>
      
      {/* AM/PM */}
      <button
        ref={periodInputRef}
        type="button"
        onClick={handlePeriodToggle}
        onKeyDown={handlePeriodKeyDown}
        className="w-7 text-center bg-transparent text-slate-200 text-xs font-mono outline-none hover:text-blue-400 focus:text-blue-400 transition-colors cursor-pointer"
      >
        {period}
      </button>
    </div>
  );
}

