"use client";

import React, { useRef, useEffect } from "react";
import { Send, Image as ImageIcon, X } from "lucide-react";
import { TimePicker } from "./time-picker";
import { containsArabic } from "../lib/utils";

interface PostInputFormProps {
  inputContent: string;
  entryTime: string;
  imagePreviews: Array<{ file: File; preview: string; storageId?: string }>;
  isUploading: boolean;
  isAuthenticated: boolean;
  userId: string | undefined;
  onContentChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onRemoveImage: (index: number) => void;
  onSubmit: () => void;
}

export function PostInputForm({
  inputContent,
  entryTime,
  imagePreviews,
  isUploading,
  isAuthenticated,
  userId,
  onContentChange,
  onTimeChange,
  onFileSelect,
  onPaste,
  onRemoveImage,
  onSubmit,
}: PostInputFormProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const minHeight = 52;
      const maxHeight = 200;
      textareaRef.current.style.height = `${Math.max(minHeight, Math.min(scrollHeight, maxHeight))}px`;
      textareaRef.current.style.overflowY =
        scrollHeight > maxHeight ? "auto" : "hidden";
    }
  }, [inputContent]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="w-full">
      <div className="relative group bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-800/80 focus-within:border-slate-700/90 shadow-2xl shadow-black/20 transition-all duration-300">
          {/* Attachments Section */}
          {imagePreviews.length > 0 && (
            <div className="px-5 pt-4 pb-3 border-b border-slate-800/60">
              <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
                {imagePreviews.map((preview, idx) => {
                  const fileName =
                    preview.file.name || `image-${idx + 1}.png`;
                  return (
                    <div
                      key={idx}
                      className="shrink-0 flex items-center gap-2.5 bg-slate-800/70 border border-slate-700/60 rounded-xl px-3.5 py-2.5 min-w-[150px] hover:bg-slate-800/90 transition-colors"
                    >
                      <div className="shrink-0 w-8 h-8 rounded-md bg-slate-700/50 flex items-center justify-center">
                        <ImageIcon size={14} className="text-slate-400" />
                      </div>
                      <span className="text-slate-200 text-xs font-medium truncate flex-1">
                        {fileName}
                      </span>
                      <button
                        onClick={() => onRemoveImage(idx)}
                        className="text-slate-400 hover:text-slate-100 transition-colors shrink-0 p-1 rounded-md hover:bg-slate-700/50"
                        title="Remove image"
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
          <div className="p-5">
            <div className="flex items-end gap-3">
              <div className="flex-1 pb-10 min-w-0 relative">
                <textarea
                  ref={textareaRef}
                  value={inputContent}
                  onChange={(e) => onContentChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={onPaste}
                  placeholder="Write your entry content..."
                  className="w-full bg-transparent text-slate-100 placeholder-slate-500/70 text-[15px] leading-[1.6] outline-none resize-none min-h-[52px] max-h-[200px]"
                  rows={1}
                  dir={containsArabic(inputContent) ? "rtl" : "ltr"}
                />
              </div>

              <div className="flex absolute bottom-4 right-4 items-center gap-2 shrink-0">
                {/* Time Input */}
                <TimePicker
                  value={entryTime}
                  onChange={onTimeChange}
                  title="Time when the post was published on LinkedIn"
                />

                {/* Image Upload Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-slate-300 hover:text-slate-100 hover:bg-slate-800/90 hover:border-slate-600/70 transition-all duration-200 flex items-center justify-center active:scale-95"
                  title="Upload images"
                >
                  <ImageIcon size={19} />
                </button>

                {/* Send Button */}
                <button
                  onClick={onSubmit}
                  disabled={
                    (!inputContent.trim() && imagePreviews.length === 0) ||
                    isUploading
                  }
                  className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 disabled:shadow-none active:scale-95 disabled:active:scale-100"
                  title="Send message"
                >
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send size={19} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

