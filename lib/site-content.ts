import type { CSSProperties } from "react";

// Shared marketing content + theme tokens for the landing page. Keeping these
// out of the components makes copy/data edits easy and the sections reusable.

// --- Sketchbook palette (green/blue hexagon badges + highlighter accents) ---
export const greenBadge = {
  bg: "#e7f0d5",
  bgOverlay: "#dcebc4",
  text: "#5a7d2e",
  stroke: "#93b063",
};
export const blueBadge = {
  bg: "#dbe6f7",
  bgOverlay: "#cadaf2",
  text: "#3f5f97",
  stroke: "#7fa0d8",
};
export const HL_BLUE = "#a6c1e9";
export const HL_YELLOW = "#f7e98d";

/** Highlighter-pen effect for hero words (wraps across lines cleanly). */
export function hl(color: string): CSSProperties {
  return {
    backgroundColor: color,
    padding: "0 0.12em",
    borderRadius: "3px",
    WebkitBoxDecorationBreak: "clone",
    boxDecorationBreak: "clone",
  };
}

export const stats = [
  { value: 82, label: "Trips shared", variant: "hatching" as const },
  { value: 64, label: "Photos synced", variant: "scribble" as const },
  { value: 95, label: "Happy travelers", variant: "dots" as const },
];

export const features = [
  {
    variant: "paper" as const,
    icon: "🗺️",
    title: "Plan every trip",
    body: "Create a trip, add your route, and keep everything in one shareable place.",
  },
  {
    variant: "notebook" as const,
    icon: "📸",
    title: "Collect the memories",
    body: "Everyone drops their photos and videos straight into the trip.",
  },
  {
    variant: "sticky" as const,
    icon: "🔒",
    title: "You control access",
    body: "Public or invite-only, with per-photo permissions when you need them.",
  },
];

export const destinations = [
  { name: "Santorini", country: "Greece", emoji: "🏛️" },
  { name: "Kyoto", country: "Japan", emoji: "⛩️" },
  { name: "Bali", country: "Indonesia", emoji: "🏝️" },
];

export const plans = [
  {
    name: "Free",
    price: "$0",
    storage: 20,
    perks: ["3 trips", "25 travelers / trip", "2 GB per trip", "Photo sharing"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Pro",
    price: "$19",
    storage: 65,
    perks: [
      "50 trips",
      "500 travelers / trip",
      "50 GB per trip",
      "All media + downloads",
    ],
    cta: "Go Pro",
    featured: true,
  },
  {
    name: "Business",
    price: "$99",
    storage: 90,
    perks: [
      "Unlimited trips",
      "10,000 travelers",
      "500 GB per trip",
      "Priority support",
    ],
    cta: "Contact sales",
    featured: false,
  },
];

export const reviews = [
  {
    quote:
      "Wanderly is where exceptional service never stops, and your journey always comes first.",
    name: "H.R Harry",
    role: "Trip Manager",
    initials: "HH",
  },
  {
    quote:
      "We ran a 40-person group trip and every photo landed in one place. Magic.",
    name: "Amara Osei",
    role: "Group traveler",
    initials: "AO",
  },
  {
    quote:
      "Private trips with per-photo access were exactly what our honeymoon needed.",
    name: "Léa Martin",
    role: "Newlywed",
    initials: "LM",
  },
];

export const faqs = [
  {
    q: "Is it really free to start?",
    a: "Yes — the Free plan gives you 3 trips with 2 GB each, no card required.",
  },
  {
    q: "Where are my files stored?",
    a: "Directly in your S3 bucket via presigned uploads — files never pass through our servers.",
  },
  {
    q: "Can I keep a trip private?",
    a: "Absolutely. Private trips are members-only, and media can be restricted to specific people.",
  },
  {
    q: "Can I upload videos?",
    a: "Video, audio and documents are available on Pro and Business. Free supports photos.",
  },
];

// Portrait travel photos for the card-fan gallery.
export const galleryCards = [
  {
    imgUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=700&fit=crop",
    alt: "Mountain landscape",
  },
  {
    imgUrl:
      "https://images.unsplash.com/photo-1511765224389-37f0e77cf0eb?w=400&h=700&fit=crop",
    alt: "City at night",
  },
  {
    imgUrl:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=700&fit=crop",
    alt: "Foggy forest",
  },
  {
    imgUrl:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=700&fit=crop",
    alt: "Sunlit woods",
  },
  {
    imgUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=700&fit=crop",
    alt: "Tropical beach",
  },
  {
    imgUrl:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=700&fit=crop",
    alt: "Starry mountains",
  },
  {
    imgUrl:
      "https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=400&h=700&fit=crop",
    alt: "Golden sunset",
  },
];
