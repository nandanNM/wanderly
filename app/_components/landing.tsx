// Bespoke marketing landing page (clean, modern travel style — intentionally
// NOT sketchbook-ui; see the note in CLAUDE.md). Pure presentational Server
// Component. Brand name "Wanderly" is a placeholder — rename freely.
import { HeroIllustration } from "./hero-illustration";

const navLinks = ["Home", "About us", "Reviews", "Blogs", "Routes"];

const popularPlaces = [
  {
    name: "New York City",
    tag: "U.S City",
    emoji: "🗽",
    from: "#dceffb",
    to: "#b9def0",
  },
  {
    name: "Saint Martin",
    tag: "Bangladesh",
    emoji: "⛵",
    from: "#cdeaf2",
    to: "#9fd2e0",
  },
];

const features = [
  {
    icon: "🗺️",
    title: "Plan every trip",
    body: "Create a trip, add your route and destinations, and keep everything in one shareable place.",
  },
  {
    icon: "📸",
    title: "Collect the memories",
    body: "Everyone drops their photos and videos straight into the trip — uploaded securely to your own storage.",
  },
  {
    icon: "🔒",
    title: "You control access",
    body: "Keep a trip public or invite-only, approve members, and restrict specific media to specific people.",
  },
  {
    icon: "⬇️",
    title: "Download & keep",
    body: "Grab full-resolution originals of everything shared on the trip on paid plans.",
  },
];

const destinations = [
  {
    name: "Santorini",
    country: "Greece",
    emoji: "🏛️",
    from: "#f7d9c4",
    to: "#f0b28a",
  },
  {
    name: "Kyoto",
    country: "Japan",
    emoji: "⛩️",
    from: "#f6c9d0",
    to: "#e79aa8",
  },
  {
    name: "Bali",
    country: "Indonesia",
    emoji: "🏝️",
    from: "#cdeccd",
    to: "#95d29a",
  },
  {
    name: "Reykjavík",
    country: "Iceland",
    emoji: "🏔️",
    from: "#d7e3f6",
    to: "#a7c1ea",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    blurb: "For your first trips.",
    perks: ["3 trips", "25 travelers / trip", "2 GB per trip", "Photo sharing"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Pro",
    price: "$19",
    blurb: "For frequent travelers.",
    perks: [
      "50 trips",
      "500 travelers / trip",
      "50 GB per trip",
      "Photo, video, audio & docs",
      "Downloads enabled",
    ],
    cta: "Go Pro",
    featured: true,
  },
  {
    name: "Business",
    price: "$99",
    blurb: "For tour operators & teams.",
    perks: [
      "Unlimited trips",
      "10,000 travelers / trip",
      "500 GB per trip",
      "All media types",
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
      "We ran a 40-person group trip and every photo landed in one place. Nobody lost a single memory.",
    name: "Amara Osei",
    role: "Group traveler",
    initials: "AO",
  },
  {
    quote:
      "Private trips with per-photo access were exactly what our honeymoon needed. Beautifully simple.",
    name: "Léa Martin",
    role: "Newlywed",
    initials: "LM",
  },
];

export function Landing() {
  return (
    <div className="min-h-full bg-[#f4f1ea] font-sans text-[#141414]">
      <div className="mx-auto w-full max-w-6xl px-6">
        {/* ---------- Nav ---------- */}
        <header className="flex items-center justify-between py-6">
          <span className="text-2xl font-extrabold tracking-tight">
            WANDER<span className="text-[#e0552b]">LY</span>
          </span>
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((l) => (
              <a
                key={l}
                href="#"
                className="text-sm font-medium text-[#3a3a3a] transition-colors hover:text-[#e0552b]"
              >
                {l}
              </a>
            ))}
          </nav>
          <a
            href="/upload"
            className="rounded-xl bg-[#e0552b] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
          >
            Contact
          </a>
        </header>
        <div className="h-px w-full bg-[#141414]/10" />

        {/* ---------- Hero ---------- */}
        <section className="grid items-center gap-8 py-12 md:grid-cols-2 md:py-16">
          <div>
            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              SEE THE WORLD,
              <br />
              LIVE THE STORY.
            </h1>
            <div className="mt-8 flex gap-4 border-l-4 border-[#e0552b] pl-4">
              <p className="max-w-md text-[#5a5a5a]">
                Plan the trip, invite your people, and gather every photo and
                video from the journey into one place you actually own.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="/upload"
                className="rounded-xl bg-[#e0552b] px-7 py-3 font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
              >
                Get Started
              </a>
              <a
                href="#pricing"
                className="rounded-xl border border-[#141414]/15 bg-white px-7 py-3 font-semibold text-[#141414] transition-colors hover:border-[#e0552b] hover:text-[#e0552b]"
              >
                See pricing
              </a>
            </div>

            {/* Popular places */}
            <div className="mt-12">
              <div className="mb-4 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#141414] text-white">
                  ☰
                </span>
                <h2 className="text-xl font-bold">Popular Places</h2>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                {popularPlaces.map((p) => (
                  <div
                    key={p.name}
                    className="flex flex-1 items-center gap-4 rounded-2xl bg-white p-3 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.3)]"
                  >
                    <div className="flex-1 pl-2">
                      <p className="font-bold leading-tight">{p.name}</p>
                      <p className="text-sm text-[#e0552b]">◍ {p.tag}</p>
                      <span className="mt-2 inline-block rounded-lg border border-[#141414]/10 px-3 py-1 text-xs font-semibold">
                        Book Now
                      </span>
                    </div>
                    <div
                      className="grid h-20 w-24 place-items-center rounded-xl text-3xl"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${p.from}, ${p.to})`,
                      }}
                    >
                      {p.emoji}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Illustration + testimonial */}
          <div className="relative">
            <div className="ml-auto max-w-xs rounded-2xl bg-white p-4 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.3)]">
              <p className="text-sm text-[#4a4a4a]">
                “Wanderly, where exceptional service never stops, and your
                journey always comes first.”
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#e0552b] text-sm font-bold text-white">
                  HH
                </span>
                <div>
                  <p className="text-sm font-bold leading-none">H.R Harry</p>
                  <p className="text-xs text-[#7a7a7a]">Manager</p>
                </div>
              </div>
            </div>

            {/*
              Hero art: swap the <HeroIllustration /> below for your own image:
              import Image from "next/image";
              <Image src="/hero.png" alt="Traveler" width={520} height={520} priority />
              (drop the file in /public first).
            */}
            <HeroIllustration className="mx-auto mt-4 w-full max-w-md" />
          </div>
        </section>

        {/* ---------- Features ---------- */}
        <section className="py-16">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-[#e0552b]">
            Why Wanderly
          </p>
          <h2 className="mx-auto mt-2 max-w-2xl text-center text-4xl font-extrabold tracking-tight">
            Everything you need for the journey
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl bg-white p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)]"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#fbe6dc] text-2xl">
                  {f.icon}
                </div>
                <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-[#5a5a5a]">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Destinations ---------- */}
        <section className="py-16">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-[#e0552b]">
                Trending
              </p>
              <h2 className="mt-2 text-4xl font-extrabold tracking-tight">
                Popular destinations
              </h2>
            </div>
            <a
              href="#"
              className="hidden text-sm font-semibold text-[#e0552b] hover:underline sm:block"
            >
              View all routes →
            </a>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {destinations.map((d) => (
              <div
                key={d.name}
                className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)]"
              >
                {/* Destination image slot — replace the gradient with <Image />. */}
                <div
                  className="grid h-40 place-items-center text-5xl"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${d.from}, ${d.to})`,
                  }}
                >
                  {d.emoji}
                </div>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-bold leading-tight">{d.name}</p>
                    <p className="text-sm text-[#7a7a7a]">◍ {d.country}</p>
                  </div>
                  <span className="rounded-lg bg-[#e0552b] px-3 py-1.5 text-xs font-semibold text-white">
                    Explore
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Pricing ---------- */}
        <section id="pricing" className="py-16">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-[#e0552b]">
            Pricing
          </p>
          <h2 className="mx-auto mt-2 max-w-2xl text-center text-4xl font-extrabold tracking-tight">
            Simple plans for every traveler
          </h2>
          <div className="mt-10 grid items-start gap-6 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`rounded-3xl p-8 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.5)] ${
                  p.featured
                    ? "bg-[#141414] text-white md:-translate-y-3"
                    : "bg-white text-[#141414]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{p.name}</h3>
                  {p.featured && (
                    <span className="rounded-full bg-[#e0552b] px-3 py-1 text-xs font-semibold text-white">
                      Most popular
                    </span>
                  )}
                </div>
                <p
                  className={`mt-1 text-sm ${p.featured ? "text-white/60" : "text-[#7a7a7a]"}`}
                >
                  {p.blurb}
                </p>
                <p className="mt-5 text-4xl font-extrabold">
                  {p.price}
                  <span
                    className={`text-base font-medium ${p.featured ? "text-white/60" : "text-[#7a7a7a]"}`}
                  >
                    {" "}
                    /mo
                  </span>
                </p>
                <ul className="mt-6 flex flex-col gap-3 text-sm">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-2">
                      <span className="text-[#e0552b]">✓</span>
                      {perk}
                    </li>
                  ))}
                </ul>
                <a
                  href="/upload"
                  className={`mt-8 block rounded-xl px-6 py-3 text-center font-semibold transition-transform hover:-translate-y-0.5 ${
                    p.featured
                      ? "bg-[#e0552b] text-white"
                      : "border border-[#141414]/15 text-[#141414] hover:border-[#e0552b] hover:text-[#e0552b]"
                  }`}
                >
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Testimonials ---------- */}
        <section className="py-16">
          <h2 className="text-center text-4xl font-extrabold tracking-tight">
            Loved by travelers
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {reviews.map((r) => (
              <div
                key={r.name}
                className="rounded-2xl bg-white p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)]"
              >
                <p className="text-[#4a4a4a]">“{r.quote}”</p>
                <div className="mt-5 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#fbe6dc] text-sm font-bold text-[#e0552b]">
                    {r.initials}
                  </span>
                  <div>
                    <p className="text-sm font-bold leading-none">{r.name}</p>
                    <p className="text-xs text-[#7a7a7a]">{r.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ---------- CTA + Footer ---------- */}
      <section className="mx-auto mt-8 w-full max-w-6xl px-6">
        <div className="rounded-3xl bg-[#e0552b] px-8 py-14 text-center text-white">
          <h2 className="text-4xl font-extrabold tracking-tight">
            Ready to start your story?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/80">
            Create your first trip in minutes. No card required on the free
            plan.
          </p>
          <a
            href="/upload"
            className="mt-7 inline-block rounded-xl bg-white px-8 py-3 font-semibold text-[#e0552b] transition-transform hover:-translate-y-0.5"
          >
            Get Started
          </a>
        </div>
      </section>

      <footer className="mt-12 bg-[#1b1a27] text-[#c9c7d1]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
          <span className="text-xl font-extrabold text-white">
            WANDER<span className="text-[#e0552b]">LY</span>
          </span>
          <p className="text-sm">
            © {new Date().getFullYear()} Wanderly. See the world, live the
            story.
          </p>
          <div className="flex gap-4 text-sm">
            <a href="#" className="hover:text-white">
              Privacy
            </a>
            <a href="#" className="hover:text-white">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
