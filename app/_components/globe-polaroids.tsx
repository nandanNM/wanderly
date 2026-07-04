"use client";

import { useEffect, useRef, useCallback } from "react";
import createGlobe from "cobe";

interface PolaroidMarker {
  id: string;
  location: [number, number];
  image: string;
  caption: string;
  rotate: number;
}

interface GlobePolaroidsProps {
  markers?: PolaroidMarker[];
  className?: string;
  speed?: number;
}

const defaultMarkers: PolaroidMarker[] = [
  {
    id: "polaroid-sf",
    location: [37.78, -122.44],
    image:
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=120&h=120&fit=crop",
    caption: "San Francisco",
    rotate: -5,
  },
  {
    id: "polaroid-nyc",
    location: [40.71, -74.01],
    image:
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=120&h=120&fit=crop",
    caption: "New York",
    rotate: 4,
  },
  {
    id: "polaroid-tokyo",
    location: [35.68, 139.65],
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=120&h=120&fit=crop",
    caption: "Tokyo",
    rotate: -3,
  },
  {
    id: "polaroid-sydney",
    location: [-33.87, 151.21],
    image:
      "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=120&h=120&fit=crop",
    caption: "Sydney",
    rotate: 6,
  },
  {
    id: "polaroid-paris",
    location: [48.86, 2.35],
    image:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=120&h=120&fit=crop",
    caption: "Paris",
    rotate: -4,
  },
  {
    id: "polaroid-london",
    location: [51.51, -0.13],
    image:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=120&h=120&fit=crop",
    caption: "London",
    rotate: 3,
  },
];

export function GlobePolaroids({
  markers = defaultMarkers,
  className = "",
  speed = 0.003,
}: GlobePolaroidsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const phiOffsetRef = useRef(0);
  const thetaOffsetRef = useRef(0);
  const isPausedRef = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY };
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
    isPausedRef.current = true;
  }, []);

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi;
      thetaOffsetRef.current += dragOffset.current.theta;
      dragOffset.current = { phi: 0, theta: 0 };
    }
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    isPausedRef.current = false;
  }, []);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        dragOffset.current = {
          phi: (e.clientX - pointerInteracting.current.x) / 300,
          theta: (e.clientY - pointerInteracting.current.y) / 1000,
        };
      }
    };
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerUp]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    let globe: ReturnType<typeof createGlobe> | null = null;
    let animationId = 0;
    let phi = 0;

    function init() {
      const width = canvas.offsetWidth;
      if (width === 0 || globe) return;

      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width,
        height: width,
        phi: 0,
        theta: 0.2,
        dark: 0,
        diffuse: 1.5,
        mapSamples: 16000,
        mapBrightness: 6,
        baseColor: [0.29, 0.55, 0.53], // teal globe (#2f7d7a family)
        markerColor: [0.88, 0.33, 0.17], // brand orange (#e0552b)
        glowColor: [0.98, 0.968, 0.94], // paper glow (blends into #faf7f0)
        markerElevation: 0,
        markers: markers.map((m) => ({
          location: m.location,
          size: 0.04,
          id: m.id,
        })),
        arcs: [],
        arcColor: [0.88, 0.33, 0.17],
        arcWidth: 0.5,
        arcHeight: 0.25,
        opacity: 0.9,
      });

      function animate() {
        if (!isPausedRef.current) phi += speed;
        globe!.update({
          phi: phi + phiOffsetRef.current + dragOffset.current.phi,
          theta: 0.2 + thetaOffsetRef.current + dragOffset.current.theta,
        });
        animationId = requestAnimationFrame(animate);
      }
      animate();
      setTimeout(() => {
        if (canvas) canvas.style.opacity = "1";
      });
    }

    if (canvas.offsetWidth > 0) {
      init();
    } else {
      const ro = new ResizeObserver((entries) => {
        if ((entries[0]?.contentRect.width ?? 0) > 0) {
          ro.disconnect();
          init();
        }
      });
      ro.observe(canvas);
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (globe) globe.destroy();
    };
  }, [markers, speed]);

  return (
    <div className={`relative aspect-square select-none ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          opacity: 0,
          transition: "opacity 1.2s ease",
          borderRadius: "50%",
          touchAction: "none",
        }}
      />
      {markers.map((m) => (
        <div
          key={m.id}
          style={
            {
              position: "absolute",
              positionAnchor: `--cobe-${m.id}`,
              bottom: "anchor(top)",
              left: "anchor(center)",
              translate: "-50% 0",
              marginBottom: 8,
              background: "#fff",
              padding: "6px 6px 24px",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)",
              transform: `rotate(${m.rotate}deg)`,
              pointerEvents: "none",
              opacity: `var(--cobe-visible-${m.id}, 0)`,
              filter: `blur(calc((1 - var(--cobe-visible-${m.id}, 0)) * 8px))`,
              transition: "opacity 0.3s, filter 0.3s",
            } as unknown as React.CSSProperties
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={m.image}
            alt={m.caption}
            style={{
              display: "block",
              width: 60,
              height: 60,
              objectFit: "cover",
            }}
          />
          <span
            style={{
              position: "absolute",
              bottom: 5,
              left: 0,
              right: 0,
              textAlign: "center",
              fontFamily: "system-ui, sans-serif",
              fontSize: "0.5rem",
              color: "#333",
              letterSpacing: "0.02em",
            }}
          >
            {m.caption}
          </span>
        </div>
      ))}
    </div>
  );
}
