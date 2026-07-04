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
  Slider,
  Switch,
  Textarea,
  Tooltip,
  ToastContainer,
  useToast,
} from "sketchbook-ui";
import { Logo } from "@/components/ui/logo";
import { ClientOnly } from "@/components/ui/client-only";
import SocialCards from "@/components/ui/card-fan-carousel";
import { GlobePolaroids } from "@/components/globe-polaroids";
import {
  greenBadge,
  blueBadge,
  HL_BLUE,
  HL_YELLOW,
  hl,
  stats,
  features,
  destinations,
  plans,
  reviews,
  faqs,
  galleryCards,
} from "@/lib/site-content";

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
    <div className="min-h-full overflow-x-hidden">
      {/* thin dark top bar (matches the reference) */}
      <div className="h-1.5 w-full bg-[#2a2a2a]" />

      {/* ---------- Nav ---------- */}
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <Logo priority />
          <span className="hidden sm:inline-flex">
            <Badge size="sm" colors={greenBadge}>
              Beta
            </Badge>
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Tooltip content="Star us on GitHub!">
            <a href="https://github.com" target="_blank" rel="noreferrer">
              <Button size="sm">GitHub</Button>
            </a>
          </Tooltip>
          <Dropdown
            customTrigger={<Avatar initials="W" size="sm" />}
            items={[
              { label: "Profile", icon: "edit" },
              { label: "Settings", icon: "settings" },
              { label: "Sign out", icon: "share", danger: true },
            ]}
          />
        </div>
      </header>
      <div className="h-px w-full bg-black/10" />

      {/* ---------- Hero ---------- */}
      <section className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 md:grid-cols-2 md:gap-10 md:py-12">
        <div className="flex flex-col items-start gap-5">
          <Badge colors={greenBadge}>New — group trips</Badge>
          <h1 className="font-hand text-4xl font-bold leading-[1.15] sm:text-5xl lg:text-6xl">
            See the <span style={hl(HL_BLUE)}>world</span>,
            <br />
            live the <span style={hl(HL_YELLOW)}>story</span>.
          </h1>
          <p className="max-w-md text-base text-[#5a5a5a] sm:text-lg">
            Plan the trip, invite your people, and gather every photo and video
            from the journey into one place you actually own.
          </p>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <a href="/sign-in">
              <Button size="lg">Get Started</Button>
            </a>
            <Button size="lg" onClick={() => setModalOpen(true)}>
              Plan a trip
            </Button>
          </div>
        </div>
        <div className="relative">
          <GlobePolaroids className="mx-auto w-full max-w-xs sm:max-w-sm md:max-w-md" />
        </div>
      </section>

      {/* ---------- Stats ---------- */}
      <section className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-6 sm:grid-cols-3 sm:gap-6 sm:px-6">
        {stats.map((s) => (
          <Card key={s.label} variant="paper">
            {/* Progress renders hand-drawn SVG paths that don't hydrate
                deterministically, so defer it to the client. */}
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
                showPercentage
              />
            </ClientOnly>
          </Card>
        ))}
      </section>

      {/* ---------- Features ---------- */}
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-10">
        <h2 className="font-hand mb-6 text-center text-3xl font-bold sm:text-4xl">
          Everything you need for the journey
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} variant={f.variant}>
              <div className="text-3xl">{f.icon}</div>
              <h3 className="font-hand mt-2 text-2xl font-bold sm:text-3xl">
                {f.title}
              </h3>
              <p className="mt-1 text-[#5a5a5a]">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------- Plan your trip (form controls) ---------- */}
      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 md:py-10">
        <h2 className="font-hand mb-6 text-center text-3xl font-bold sm:text-4xl">
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
            />
            <Switch
              label="Allow downloads"
              showLabel
              checked={allowDownloads}
              onChange={(e) => setAllowDownloads(e.target.checked)}
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
            />
            <div>
              <Button onClick={createTrip}>Create trip</Button>
            </div>
          </div>
        </Card>
      </section>

      {/* ---------- Gallery (card fan) ---------- */}
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-10">
        <h2 className="font-hand mb-1 text-center text-3xl font-bold sm:text-4xl">
          Every moment, in one gallery
        </h2>
        <p className="mb-2 text-center text-[#5a5a5a]">
          Hover to fan out the photos from your trips.
        </p>
        <SocialCards cards={galleryCards} />
      </section>

      {/* ---------- Destinations ---------- */}
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-10">
        <h2 className="font-hand mb-6 text-center text-3xl font-bold sm:text-4xl">
          Popular destinations
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {destinations.map((d) => (
            <Card key={d.name} variant="paper">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl">{d.emoji}</div>
                  <h3 className="font-hand mt-2 text-2xl font-bold sm:text-3xl">
                    {d.name}
                  </h3>
                </div>
                <Badge colors={greenBadge}>{d.country}</Badge>
              </div>
              <Divider variant="dashed" />
              <a href="/upload">
                <Button size="sm">Explore</Button>
              </a>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------- Pricing ---------- */}
      <section
        id="pricing"
        className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-10"
      >
        <h2 className="font-hand mb-6 text-center text-3xl font-bold sm:text-4xl">
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
                <h3 className="font-hand text-3xl font-bold sm:text-4xl">
                  {p.name}
                </h3>
                <Badge colors={p.featured ? blueBadge : greenBadge}>
                  {p.featured ? "Popular" : p.name}
                </Badge>
              </div>
              <p className="font-hand mt-1 text-4xl font-bold sm:text-5xl">
                {p.price}
                <span className="text-xl text-[#7a7a7a]"> /mo</span>
              </p>
              <Divider variant="dashed" />
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
                  />
                </ClientOnly>
              </div>
              <a href="/upload">
                <Button>{p.cta}</Button>
              </a>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------- Testimonials ---------- */}
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-10">
        <h2 className="font-hand mb-6 text-center text-3xl font-bold sm:text-4xl">
          Loved by travelers
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <Card key={r.name} variant="sticky">
              <p className="text-[#4a4a4a]">“{r.quote}”</p>
              <Divider variant="dots" />
              <div className="flex items-center gap-3">
                <Avatar initials={r.initials} size="sm" />
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
      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 md:py-10">
        <h2 className="font-hand mb-6 text-center text-3xl font-bold sm:text-4xl">
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
      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 md:py-10">
        <Card variant="sticky">
          <h2 className="font-hand text-2xl font-bold sm:text-3xl">
            Stay in the loop
          </h2>
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
      <footer className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <Divider variant="zigzag" />
        <div className="mt-6 flex flex-col items-center justify-between gap-4 text-[#7a7a7a] sm:flex-row">
          <Logo size="sm" underline={false} />
          <div className="flex items-center gap-3">
            <span className="text-sm">Built with Sketchbook UI</span>
            <Avatar initials="W" size="sm" />
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
            <Button size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
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
