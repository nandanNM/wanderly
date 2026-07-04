"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionItem,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Divider,
  Dropdown,
  Input,
  Modal,
  Progress,
  RadioGroup,
  Select,
  Skeleton,
  SkeletonCard,
  SkeletonText,
  Slider,
  Spinner,
  Switch,
  Textarea,
  Tooltip,
  ToastContainer,
  useToast,
} from "sketchbook-ui";
import { GlobePolaroids } from "./globe-polaroids";
import { ClientOnly } from "./client-only";

// Cohesive palette — teal (primary, matches the globe) + orange (accent,
// matches the globe markers) + paper (neutral). Reused across every component.
const teal = {
  bg: "#2f7d7a",
  bgOverlay: "#276b68",
  stroke: "#1f5f5c",
  text: "#ffffff",
};
const orange = {
  bg: "#e0552b",
  bgOverlay: "#cd491f",
  stroke: "#a83c18",
  text: "#ffffff",
};
const paper = { bg: "#faf7f0", stroke: "#2a2a2a", text: "#2a2a2a" };
const tealBadge = {
  bg: "#dcebe8",
  bgOverlay: "#cfe3df",
  text: "#1f5f5c",
  stroke: "#2f7d7a",
};
const orangeBadge = {
  bg: "#fbe1d5",
  bgOverlay: "#f7d2c0",
  text: "#a83c18",
  stroke: "#e0552b",
};
const tealAccent = "#2f7d7a";
const tealAvatar = {
  fallbackBg: "#2f7d7a",
  text: "#ffffff",
  stroke: "#1f5f5c",
};
const tealProgress = { fill: "#2f7d7a", stroke: "#1f5f5c" };

const stats = [
  { value: 82, label: "Trips shared", variant: "hatching" as const },
  { value: 64, label: "Photos synced", variant: "scribble" as const },
  { value: 95, label: "Happy travelers", variant: "dots" as const },
];

const features = [
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

const destinations = [
  { name: "Santorini", country: "Greece", emoji: "🏛️" },
  { name: "Kyoto", country: "Japan", emoji: "⛩️" },
  { name: "Bali", country: "Indonesia", emoji: "🏝️" },
];

const plans = [
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

const reviews = [
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

const faqs = [
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

export function Landing() {
  const { toasts, showToast, dismissToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  // "Plan your trip" form state
  const [destination, setDestination] = useState("");
  const [tripType, setTripType] = useState("adventure");
  const [visibility, setVisibility] = useState("private");
  const [groupSize, setGroupSize] = useState(4);
  const [allowDownloads, setAllowDownloads] = useState(true);
  const [notes, setNotes] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [email, setEmail] = useState("");

  function createTrip() {
    if (!destination.trim()) {
      showToast("Add a destination first ✎", "warning");
      return;
    }
    if (!agreed) {
      showToast("Please accept the terms to continue", "error");
      return;
    }
    showToast(`Trip to ${destination} created! 🎉`, "success");
  }

  return (
    <div className="min-h-full">
      {/* ---------- Nav ---------- */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="font-hand text-3xl font-bold">✎ Wanderly</span>
          <Badge size="sm" colors={tealBadge}>
            Beta
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Dropdown
            triggerText="Menu"
            triggerIcon="menu"
            items={[
              { label: "Routes", icon: "share" },
              { label: "Reviews", icon: "edit" },
              { label: "Blogs", icon: "duplicate" },
              { label: "Settings", icon: "settings" },
            ]}
          />
          <Tooltip content="Star us on GitHub!">
            <a href="https://github.com" target="_blank" rel="noreferrer">
              <Button size="sm" colors={paper}>
                GitHub
              </Button>
            </a>
          </Tooltip>
          <a href="/upload">
            <Button size="sm" colors={teal}>
              Sign in
            </Button>
          </a>
          <Avatar initials="ME" size="sm" colors={tealAvatar} />
        </div>
      </header>

      <Divider variant="scribble" color={tealAccent} />

      {/* ---------- Hero ---------- */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-8 px-6 py-16 md:grid-cols-2">
        <div className="flex flex-col items-start gap-6">
          <Badge colors={tealBadge}>New — group trips</Badge>
          <h1 className="font-hand text-6xl font-bold leading-[1.02] sm:text-7xl">
            See the world,
            <br />
            live the story.
          </h1>
          <p className="max-w-md text-lg text-[#5a5a5a]">
            Plan the trip, invite your people, and gather every photo and video
            from the journey into one place you actually own.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="/upload">
              <Button size="lg" colors={teal}>
                Get Started
              </Button>
            </a>
            <Button size="lg" colors={paper} onClick={() => setModalOpen(true)}>
              Plan a trip
            </Button>
          </div>
        </div>
        <div className="relative">
          {/* Interactive 3D globe (cobe) with polaroid markers. Drag to spin.
              Edit the destinations/photos in globe-polaroids.tsx. */}
          <GlobePolaroids className="mx-auto w-full max-w-md" />
        </div>
      </section>

      {/* ---------- Stats (Progress) ---------- */}
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-8 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} variant="paper">
            {/* Progress renders hand-drawn SVG paths that don't hydrate
                deterministically, so defer it to the client with a plain
                fallback that reserves the same space. */}
            <ClientOnly
              fallback={
                <div>
                  <div className="font-hand mb-1 flex justify-between text-xl">
                    <span>{s.label}</span>
                    <span>{s.value}%</span>
                  </div>
                  <div className="h-10 w-full rounded bg-black/5" />
                </div>
              }
            >
              <Progress
                value={s.value}
                label={s.label}
                variant={s.variant}
                colors={tealProgress}
                showPercentage
              />
            </ClientOnly>
          </Card>
        ))}
      </section>

      {/* ---------- Features ---------- */}
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <h2 className="font-hand mb-8 text-center text-5xl font-bold">
          Everything you need for the journey
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} variant={f.variant}>
              <div className="text-3xl">{f.icon}</div>
              <h3 className="font-hand mt-2 text-3xl font-bold">{f.title}</h3>
              <p className="mt-1 text-[#5a5a5a]">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------- Plan your trip (form controls) ---------- */}
      <section className="mx-auto w-full max-w-3xl px-6 py-12">
        <h2 className="font-hand mb-6 text-center text-5xl font-bold">
          Plan your trip
        </h2>
        <Card variant="notebook">
          <div className="flex flex-col gap-5">
            <Input
              label="Destination"
              placeholder="Where to?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="font-hand mb-1 text-xl">Trip type</p>
                <Select
                  defaultValue={tripType}
                  onChange={setTripType}
                  options={[
                    { value: "adventure", label: "Adventure" },
                    { value: "beach", label: "Beach" },
                    { value: "city", label: "City break" },
                    { value: "roadtrip", label: "Road trip" },
                  ]}
                />
              </div>
              <div>
                <p className="font-hand mb-1 text-xl">Who can see it?</p>
                <RadioGroup
                  name="visibility"
                  value={visibility}
                  onChange={setVisibility}
                  colors={{ fill: tealAccent }}
                  options={[
                    { value: "private", label: "Private" },
                    { value: "public", label: "Public" },
                  ]}
                />
              </div>
            </div>
            <Slider
              label="Group size"
              min={1}
              max={50}
              value={groupSize}
              onChange={setGroupSize}
              colors={{ trackFill: tealAccent, thumbBg: tealAccent }}
            />
            <Switch
              label="Allow downloads"
              showLabel
              checked={allowDownloads}
              onChange={(e) => setAllowDownloads(e.target.checked)}
              colors={{ trackChecked: tealAccent, strokeChecked: "#1f5f5c" }}
            />
            <Textarea
              label="Trip notes"
              placeholder="Anything your travelers should know..."
              showLines
              showMargin
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Checkbox
              label="I agree to the terms & privacy policy"
              checked={agreed}
              onChange={setAgreed}
              colors={{ check: tealAccent }}
            />
            <div>
              <Button colors={teal} onClick={createTrip}>
                Create trip
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* ---------- Live gallery preview (Skeleton + Spinner) ---------- */}
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="mb-6 flex items-center justify-center gap-3">
          <Spinner variant="spiral" size="sm" colors={{ stroke: tealAccent }} />
          <h2 className="font-hand text-4xl font-bold">
            Your gallery, syncing live
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <SkeletonCard showAvatar />
          <Card variant="paper">
            <Skeleton variant="rectangle" height={120} />
            <div className="mt-3">
              <SkeletonText lines={3} />
            </div>
          </Card>
          <SkeletonCard showAvatar />
        </div>
      </section>

      {/* ---------- Destinations ---------- */}
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <h2 className="font-hand mb-8 text-center text-5xl font-bold">
          Popular destinations
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {destinations.map((d) => (
            <Card key={d.name} variant="paper">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl">{d.emoji}</div>
                  <h3 className="font-hand mt-2 text-3xl font-bold">
                    {d.name}
                  </h3>
                </div>
                <Badge colors={tealBadge}>{d.country}</Badge>
              </div>
              <Divider variant="dashed" color={tealAccent} />
              <a href="/upload">
                <Button size="sm" colors={paper}>
                  Explore
                </Button>
              </a>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------- Pricing ---------- */}
      <section id="pricing" className="mx-auto w-full max-w-6xl px-6 py-12">
        <h2 className="font-hand mb-8 text-center text-5xl font-bold">
          Simple, honest pricing
        </h2>
        <div className="grid items-start gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <Card
              key={p.name}
              variant={p.featured ? "notebook" : "paper"}
              className={p.featured ? "md:-translate-y-2" : ""}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-hand text-4xl font-bold">{p.name}</h3>
                <Badge colors={p.featured ? orangeBadge : tealBadge}>
                  {p.featured ? "Popular" : p.name}
                </Badge>
              </div>
              <p className="font-hand mt-1 text-5xl font-bold">
                {p.price}
                <span className="text-xl text-[#7a7a7a]"> /mo</span>
              </p>
              <Divider variant="dashed" color={tealAccent} />
              <ul className="mb-4 mt-2 flex flex-col gap-2 text-[#5a5a5a]">
                {p.perks.map((perk) => (
                  <li key={perk}>✏️ {perk}</li>
                ))}
              </ul>
              <div className="mb-4">
                <ClientOnly
                  fallback={
                    <div>
                      <div className="font-hand mb-1 text-lg">Storage</div>
                      <div className="h-6 w-full rounded bg-black/5" />
                    </div>
                  }
                >
                  <Progress
                    value={p.storage}
                    label="Storage"
                    variant="solid"
                    size="sm"
                    colors={tealProgress}
                  />
                </ClientOnly>
              </div>
              <a href="/upload">
                <Button colors={p.featured ? orange : paper}>{p.cta}</Button>
              </a>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------- Testimonials ---------- */}
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <h2 className="font-hand mb-8 text-center text-5xl font-bold">
          Loved by travelers
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <Card key={r.name} variant="sticky">
              <p className="text-[#4a4a4a]">“{r.quote}”</p>
              <Divider variant="dots" color={tealAccent} />
              <div className="flex items-center gap-3">
                <Avatar initials={r.initials} size="sm" colors={tealAvatar} />
                <div>
                  <p className="font-hand text-xl leading-none">{r.name}</p>
                  <p className="text-sm text-[#7a7a7a]">{r.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="mx-auto w-full max-w-3xl px-6 py-12">
        <h2 className="font-hand mb-8 text-center text-5xl font-bold">
          Questions & answers
        </h2>
        <Accordion>
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} title={f.q} number={i + 1}>
              {f.a}
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* ---------- Newsletter / CTA ---------- */}
      <section className="mx-auto w-full max-w-3xl px-6 py-12">
        <Card variant="sticky">
          <h2 className="font-hand text-4xl font-bold">Stay in the loop</h2>
          <p className="mb-4 text-[#5a5a5a]">
            Get notified when new features ship. No spam, ever.
          </p>
          <div className="flex flex-col items-end gap-3 sm:flex-row">
            <div className="w-full">
              <Input
                label="Email"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              colors={teal}
              onClick={() =>
                showToast(
                  email ? "You're on the list! ✎" : "Enter an email first",
                  email ? "success" : "warning",
                )
              }
            >
              Notify me
            </Button>
          </div>
        </Card>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="mx-auto w-full max-w-6xl px-6 py-10">
        <Divider variant="zigzag" color={tealAccent} />
        <div className="mt-6 flex flex-col items-center justify-between gap-4 text-[#7a7a7a] sm:flex-row">
          <span className="font-hand text-2xl">✎ Wanderly</span>
          <div className="flex items-center gap-3">
            <span className="text-sm">Built with Sketchbook UI</span>
            <Avatar initials="W" size="sm" colors={tealAvatar} />
          </div>
        </div>
      </footer>

      {/* ---------- Modal ---------- */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Plan a trip"
        variant="paper"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              size="sm"
              colors={paper}
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              colors={teal}
              onClick={() => {
                setModalOpen(false);
                showToast("Let's plan your trip! 🧳", "info");
              }}
            >
              Let&apos;s go
            </Button>
          </div>
        }
      >
        <p className="text-[#4a4a4a]">
          Create a trip, invite your travelers, and start collecting memories in
          seconds. It only takes a minute to set up.
        </p>
      </Modal>

      {/* Toasts */}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        position="bottom-right"
      />
    </div>
  );
}
