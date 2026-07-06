"use client";

import { Toaster } from "@/components/ui/sonner";

// App-wide client providers. RetroUI components are plain shadcn-style
// components (no global provider needed); we only mount the sonner Toaster once
// here so any component can fire toasts via `toast()` from "sonner".
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster theme="light" position="bottom-right" />
    </>
  );
}
