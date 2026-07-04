"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const noopSubscribe = () => () => {};

/**
 * Renders `children` only after the component has mounted on the client.
 *
 * Use this for components that can't hydrate deterministically — e.g.
 * sketchbook-ui's hand-drawn `Progress`, whose generated SVG `d` paths differ
 * by a floating-point ULP between the Node server and the browser. `fallback`
 * is rendered on the server and during the first client render, so it must be
 * deterministic (plain HTML) to avoid a hydration mismatch of its own.
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  // false on the client, true on the server / first hydration render.
  const isServer = useSyncExternalStore(
    noopSubscribe,
    () => false,
    () => true,
  );
  return <>{isServer ? fallback : children}</>;
}
