"use client";

import { Camera, User } from "lucide-react";
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  /** Currently-applied avatar URL to preview in the circle. */
  value?: string | null;
  maxSize?: number;
  className?: string;
  /** Called with the picked File (drag or click) — the parent crops + uploads. */
  onFileSelected?: (file: File | null) => void;
}

export function AvatarUpload({
  value,
  maxSize = 2 * 1024 * 1024, // 2MB
  className,
  onFileSelected,
}: AvatarUploadProps) {
  const [
    { isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles: 1,
    maxSize,
    accept: "image/*",
    multiple: false,
    onFilesChange: (files) => onFileSelected?.(files[0]?.file ?? null),
  });

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload avatar"
        className={cn(
          "group/av relative h-28 w-28 cursor-pointer overflow-hidden rounded-full border-2 border-dashed transition-colors",
          isDragging
            ? "border-[#2f7d7a] bg-[#2f7d7a]/5"
            : "border-black/25 hover:border-[#2f7d7a]",
          value && "border-solid",
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") openFileDialog();
        }}
      >
        <input {...getInputProps()} className="sr-only" />

        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Avatar"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <User className="size-7 text-black/40" />
          </div>
        )}

        {/* Camera overlay on hover — signals the avatar is clickable. */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover/av:opacity-100">
          <Camera className="size-7 text-white" />
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-medium">Click or drag to upload</p>
        <p className="text-xs text-[#9a9a9a]">
          PNG, JPG up to {formatBytes(maxSize)}
        </p>
      </div>

      {errors.length > 0 && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-center text-xs text-red-700">
          {errors.map((error, i) => (
            <p key={i}>{error}</p>
          ))}
        </div>
      )}
    </div>
  );
}
