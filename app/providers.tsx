"use client";

import { SketchProvider } from "sketchbook-ui";

// Sketchbook UI components are client-side and reference shared SVG filters
// provided by SketchProvider. Mounting it once at the root lets any sketch
// component (in any "use client" file) render correctly.
export function Providers({ children }: { children: React.ReactNode }) {
  return <SketchProvider>{children}</SketchProvider>;
}
