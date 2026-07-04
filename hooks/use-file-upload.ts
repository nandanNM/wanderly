"use client";

import { useCallback, useRef, useState } from "react";

export type FileWithPreview = {
  id: string;
  file: File;
  preview: string;
};

interface UseFileUploadOptions {
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  multiple?: boolean;
  onFilesChange?: (files: FileWithPreview[]) => void;
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Minimal file-upload hook (drag/drop + click + validation) — a lightweight
 * stand-in for the origin-ui hook, adapted to this project's stack.
 */
export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    maxSize = Infinity,
    accept = "*",
    multiple = false,
    onFilesChange,
  } = options;

  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback(
    (file: File): string | null => {
      if (maxSize !== Infinity && file.size > maxSize) {
        return `${file.name} is larger than ${formatBytes(maxSize)}.`;
      }
      if (accept && accept !== "*") {
        const ok = accept.split(",").some((raw) => {
          const a = raw.trim();
          if (a.endsWith("/*")) return file.type.startsWith(a.slice(0, -1));
          return file.type === a;
        });
        if (!ok) return `${file.name} is not an accepted file type.`;
      }
      return null;
    },
    [maxSize, accept],
  );

  const addFiles = useCallback(
    (list: FileList | File[]) => {
      const incoming = Array.from(list);
      const nextErrors: string[] = [];
      const accepted: FileWithPreview[] = [];
      for (const file of incoming) {
        const err = validate(file);
        if (err) {
          nextErrors.push(err);
          continue;
        }
        accepted.push({
          id: `${file.name}-${file.size}-${file.lastModified}`,
          file,
          preview: URL.createObjectURL(file),
        });
        if (!multiple) break;
      }
      setErrors(nextErrors);
      if (accepted.length > 0) {
        setFiles((prev) => {
          const next = multiple ? [...prev, ...accepted] : accepted.slice(0, 1);
          onFilesChange?.(next);
          return next;
        });
      }
    },
    [validate, multiple, onFilesChange],
  );

  const removeFile = useCallback(
    (id: string) => {
      setFiles((prev) => {
        const target = prev.find((f) => f.id === id);
        if (target) URL.revokeObjectURL(target.preview);
        const next = prev.filter((f) => f.id !== id);
        onFilesChange?.(next);
        return next;
      });
      setErrors([]);
    },
    [onFilesChange],
  );

  const openFileDialog = useCallback(() => inputRef.current?.click(), []);

  const getInputProps = useCallback(
    () => ({
      ref: inputRef,
      type: "file" as const,
      accept,
      multiple,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) addFiles(e.target.files);
        e.target.value = "";
      },
    }),
    [accept, multiple, addFiles],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  return [
    { files, isDragging, errors },
    {
      removeFile,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] as const;
}
