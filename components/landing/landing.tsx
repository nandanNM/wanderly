"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/ui/logo";
import { SiteHeader } from "@/components/layout/site-header";
import SocialCards from "@/components/ui/card-fan-carousel";
import { GlobePolaroids } from "@/components/globe-polaroids";
import {
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
      toast.warning("Add a destination first ✎");
      return;
    }
    if (!agreed) {
      toast.error("Please accept the terms to continue");
      return;
    }
    toast.success(`Trip to ${destination} created! 🎉`);
  }

  return (
    <div className="min-h-full overflow-x-hidden">
      <SiteHeader />

      {/* ---------- Hero ---------- */}
      <section className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 md:grid-cols-2 md:gap-10 md:py-12">
        <div className="flex flex-col items-start gap-5">
          <Badge className="font-pixel">New — group trips</Badge>
          <h1 className="font-pixel text-4xl leading-[1.15] sm:text-5xl lg:text-6xl">
            See the <span style={hl(HL_BLUE)}>world</span>,
            <br />
            live the <span style={hl(HL_YELLOW)}>story</span>.
          </h1>
          <p className="max-w-md text-base text-muted-foreground sm:text-lg">
            Plan the trip, invite your people, and gather every photo and video
            from the journey into one place you actually own.
          </p>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <a href="/sign-in">
              <Button size="lg">Get Started</Button>
            </a>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setModalOpen(true)}
            >
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
          <Card key={s.label} className="p-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-head text-sm">{s.label}</span>
              <span className="font-pixel text-lg">{s.value}%</span>
            </div>
            <Progress value={s.value} />
          </Card>
        ))}
      </section>

      {/* ---------- Features ---------- */}
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-10">
        <h2 className="font-head mb-6 text-center text-3xl sm:text-4xl">
          Everything you need for the journey
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="p-6">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="font-head mt-2 text-2xl sm:text-3xl">{f.title}</h3>
              <p className="mt-1 text-muted-foreground">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------- Plan your trip (form controls) ---------- */}
      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 md:py-10">
        <h2 className="font-head mb-6 text-center text-3xl sm:text-4xl">
          Plan your trip
        </h2>
        <Card>
          <CardContent className="flex flex-col gap-5">
            <div className="grid gap-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                placeholder="Where to?"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Trip type</Label>
                <Select value={tripType} onValueChange={setTripType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adventure">Adventure</SelectItem>
                    <SelectItem value="beach">Beach</SelectItem>
                    <SelectItem value="city">City break</SelectItem>
                    <SelectItem value="roadtrip">Road trip</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Who can see it?</Label>
                <RadioGroup
                  value={visibility}
                  onValueChange={setVisibility}
                  className="flex gap-6 pt-1"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="private" id="vis-private" />
                    <Label htmlFor="vis-private">Private</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="public" id="vis-public" />
                    <Label htmlFor="vis-public">Public</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Group size</Label>
                <span className="text-sm text-muted-foreground">
                  {groupSize}
                </span>
              </div>
              <Slider
                min={1}
                max={50}
                value={[groupSize]}
                onValueChange={(v) => setGroupSize(v[0])}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="downloads"
                checked={allowDownloads}
                onCheckedChange={setAllowDownloads}
              />
              <Label htmlFor="downloads">Allow downloads</Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Trip notes</Label>
              <Textarea
                id="notes"
                placeholder="Anything your travelers should know..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="agree"
                checked={agreed}
                onCheckedChange={(c) => setAgreed(c === true)}
              />
              <Label htmlFor="agree">
                I agree to the terms &amp; privacy policy
              </Label>
            </div>
            <div>
              <Button onClick={createTrip}>Create trip</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ---------- Gallery (card fan) ---------- */}
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-10">
        <h2 className="font-head mb-1 text-center text-3xl sm:text-4xl">
          Every moment, in one gallery
        </h2>
        <p className="mb-2 text-center text-muted-foreground">
          Hover to fan out the photos from your trips.
        </p>
        <SocialCards cards={galleryCards} />
      </section>

      {/* ---------- Destinations ---------- */}
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-10">
        <h2 className="font-head mb-6 text-center text-3xl sm:text-4xl">
          Popular destinations
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {destinations.map((d) => (
            <Card key={d.name} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl">{d.emoji}</div>
                  <h3 className="font-head mt-2 text-2xl sm:text-3xl">
                    {d.name}
                  </h3>
                </div>
                <Badge>{d.country}</Badge>
              </div>
              <Separator className="my-4" />
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
        <h2 className="font-head mb-6 text-center text-3xl sm:text-4xl">
          Simple, honest pricing
        </h2>
        <div className="grid items-start gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <Card
              key={p.name}
              className={`p-6 ${p.featured ? "md:-translate-y-2 shadow-lg" : ""}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-head text-3xl sm:text-4xl">{p.name}</h3>
                <Badge variant={p.featured ? "secondary" : "default"}>
                  {p.featured ? "Popular" : p.name}
                </Badge>
              </div>
              <p className="font-head mt-1 text-4xl sm:text-5xl">
                {p.price}
                <span className="text-xl text-muted-foreground"> /mo</span>
              </p>
              <Separator className="my-4" />
              <ul className="mb-4 mt-2 flex flex-col gap-2 text-muted-foreground">
                {p.perks.map((perk) => (
                  <li key={perk}>✏️ {perk}</li>
                ))}
              </ul>
              <div className="mb-4">
                <div className="mb-1 font-head text-sm">Storage</div>
                <Progress value={p.storage} />
              </div>
              <a href="/upload">
                <Button className="w-full">{p.cta}</Button>
              </a>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------- Testimonials ---------- */}
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-10">
        <h2 className="font-head mb-6 text-center text-3xl sm:text-4xl">
          Loved by travelers
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <Card key={r.name} className="p-6">
              <p className="text-foreground/80">“{r.quote}”</p>
              <Separator className="my-4" />
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{r.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-head text-lg leading-none">{r.name}</p>
                  <p className="text-sm text-muted-foreground">{r.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 md:py-10">
        <h2 className="font-head mb-6 text-center text-3xl sm:text-4xl">
          Questions &amp; answers
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`faq-${i}`}>
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent>{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* ---------- Newsletter / CTA ---------- */}
      <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 md:py-10">
        <Card className="p-6">
          <h2 className="font-head text-2xl sm:text-3xl">Stay in the loop</h2>
          <p className="mb-4 text-muted-foreground">
            Get notified when new features ship. No spam, ever.
          </p>
          <div className="flex flex-col items-end gap-3 sm:flex-row">
            <div className="grid w-full gap-2">
              <Label htmlFor="newsletter-email">Email</Label>
              <Input
                id="newsletter-email"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              onClick={() =>
                email
                  ? toast.success("You're on the list! ✎")
                  : toast.warning("Enter an email first")
              }
            >
              Notify me
            </Button>
          </div>
        </Card>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <Separator />
        <div className="mt-6 flex flex-col items-center justify-between gap-4 text-muted-foreground sm:flex-row">
          <Logo size="sm" underline={false} />
          <div className="flex items-center gap-3">
            <span className="text-sm">Built with RetroUI</span>
            <Avatar>
              <AvatarFallback>W</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </footer>

      {/* ---------- Modal ---------- */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plan a trip</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Create a trip, invite your travelers, and start collecting memories
            in seconds. It only takes a minute to set up.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setModalOpen(false);
                toast.info("Let's plan your trip! 🧳");
              }}
            >
              Let&apos;s go
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
