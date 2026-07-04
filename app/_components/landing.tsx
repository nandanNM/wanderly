"use client";

import {
  Accordion,
  AccordionItem,
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Input,
} from "sketchbook-ui";

const features = [
  {
    variant: "paper" as const,
    title: "Create events",
    body: "Spin up a public gallery or a private, members-only event. Every event gets a shareable link you can rotate anytime.",
  },
  {
    variant: "notebook" as const,
    title: "Upload media",
    body: "Drop photos, videos, audio and documents. Files go straight to S3 via presigned URLs — no server bottleneck.",
  },
  {
    variant: "sticky" as const,
    title: "Control access",
    body: "Approve members, assign roles, and restrict individual files to specific people. You decide who sees what.",
  },
];

const plans = [
  {
    code: "Free",
    price: "$0",
    badge: "default" as const,
    perks: ["3 events", "25 members / event", "2 GB per event", "Images only"],
    cta: "Start free",
  },
  {
    code: "Pro",
    price: "$19",
    badge: "success" as const,
    perks: [
      "50 events",
      "500 members / event",
      "50 GB per event",
      "Image, video, audio, docs",
      "Downloads enabled",
    ],
    cta: "Go Pro",
    featured: true,
  },
  {
    code: "Business",
    price: "$99",
    badge: "info" as const,
    perks: [
      "Unlimited events",
      "10,000 members / event",
      "500 GB per event",
      "All media types",
      "Downloads enabled",
    ],
    cta: "Contact us",
  },
];

const faqs = [
  {
    q: "Is it really free to start?",
    a: "Yes. The Free plan gives you 3 events with 2 GB of storage each — no card required.",
  },
  {
    q: "Where are my files stored?",
    a: "Directly in your S3 bucket. Uploads use presigned URLs, so files never pass through our servers.",
  },
  {
    q: "Can I keep an event private?",
    a: "Absolutely. Private events are members-only, and you can restrict individual media to specific people.",
  },
  {
    q: "Can I upload videos?",
    a: "Video, audio and documents are available on the Pro and Business plans. Free supports images.",
  },
];

const paper = { bg: "#faf7f0", stroke: "#2a2a2a", text: "#2a2a2a" };

export function Landing() {
  return (
    <div className="flex min-h-full flex-col bg-[#faf7f0] text-[#2a2a2a]">
      {/* Nav */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="font-hand text-2xl font-bold">✎ EventShare</span>
          <Badge variant="warning" size="sm">
            Beta
          </Badge>
        </div>
        <nav className="flex items-center gap-3">
          <a href="https://github.com" target="_blank" rel="noreferrer">
            <Button size="sm" colors={paper}>
              GitHub
            </Button>
          </a>
          <a href="/upload">
            <Button size="sm">Sign in</Button>
          </a>
        </nav>
      </header>

      <Divider variant="scribble" />

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-20 text-center">
        <Badge variant="success">Now in beta</Badge>
        <h1 className="font-hand text-6xl font-bold leading-[1.05] sm:text-7xl">
          Share your events,
          <br />
          beautifully.
        </h1>
        <p className="max-w-xl text-lg text-[#5a5a5a]">
          Create an event, invite your people, and collect every photo and video
          in one place — with a hand-drawn touch that stands out from the sea of
          flat, sterile apps.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
          <a href="/upload">
            <Button size="lg">Get Started</Button>
          </a>
          <a href="#pricing">
            <Button size="lg" colors={paper}>
              See pricing
            </Button>
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <h2 className="font-hand mb-8 text-center text-4xl font-bold">
          Everything you need to share the moment
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} variant={f.variant}>
              <h3 className="font-hand mb-2 text-2xl font-bold">{f.title}</h3>
              <p className="text-[#5a5a5a]">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto w-full max-w-6xl px-6 py-12">
        <h2 className="font-hand mb-8 text-center text-4xl font-bold">
          Simple, honest pricing
        </h2>
        <div className="grid items-start gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <Card
              key={p.code}
              variant={p.featured ? "notebook" : "paper"}
              className={p.featured ? "md:-translate-y-2" : ""}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-hand text-3xl font-bold">{p.code}</h3>
                <Badge variant={p.badge}>
                  {p.featured ? "Popular" : p.code}
                </Badge>
              </div>
              <p className="font-hand mt-2 text-4xl font-bold">
                {p.price}
                <span className="text-lg text-[#7a7a7a]"> /mo</span>
              </p>
              <Divider variant="dashed" />
              <ul className="mb-5 mt-3 flex flex-col gap-2 text-[#5a5a5a]">
                {p.perks.map((perk) => (
                  <li key={perk}>✏️ {perk}</li>
                ))}
              </ul>
              <a href="/upload">
                <Button size="md" colors={p.featured ? undefined : paper}>
                  {p.cta}
                </Button>
              </a>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-3xl px-6 py-12">
        <h2 className="font-hand mb-8 text-center text-4xl font-bold">
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

      {/* CTA / newsletter */}
      <section className="mx-auto w-full max-w-3xl px-6 py-12">
        <Card variant="sticky">
          <h2 className="font-hand text-3xl font-bold">Stay in the loop</h2>
          <p className="mb-4 text-[#5a5a5a]">
            Get notified when new features ship. No spam, ever.
          </p>
          <div className="flex flex-col items-end gap-3 sm:flex-row">
            <div className="w-full">
              <Input label="Email" placeholder="you@example.com" type="email" />
            </div>
            <Button size="md">Notify me</Button>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="mx-auto mt-auto w-full max-w-6xl px-6 py-10">
        <Divider variant="zigzag" />
        <div className="mt-6 flex flex-col items-center justify-between gap-4 text-[#7a7a7a] sm:flex-row">
          <span className="font-hand text-xl">✎ EventShare</span>
          <div className="flex items-center gap-3">
            <span className="text-sm">Made with Sketchbook UI</span>
            <Avatar initials="ES" size="sm" />
          </div>
        </div>
      </footer>
    </div>
  );
}
