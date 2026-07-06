"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { createTripAction } from "@/app/trips/actions";
import type { CreateTripInput } from "@/data/trips";

const TRIP_TYPE_OPTIONS = [
  { value: "adventure", label: "Adventure" },
  { value: "beach", label: "Beach" },
  { value: "city", label: "City break" },
  { value: "roadtrip", label: "Road trip" },
  { value: "nature", label: "Nature" },
  { value: "family", label: "Family" },
  { value: "cruise", label: "Cruise" },
  { value: "other", label: "Other" },
];

function daysBetween(start: string, end: string): number | null {
  if (!start || !end) return null;
  const ms = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  if (Number.isNaN(ms) || ms < 0) return null;
  return Math.round(ms / 86_400_000) + 1;
}

export function TripForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [type, setType] = useState("adventure");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelers, setTravelers] = useState<string[]>([""]);
  const [places, setPlaces] = useState<{ name: string; day: string }[]>([
    { name: "", day: "" },
  ]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const duration = daysBetween(startDate, endDate);

  async function submit() {
    if (!title.trim() || !destination.trim()) {
      toast.warning("Add a title and destination first ✎");
      return;
    }
    setSaving(true);
    const res = await createTripAction({
      title: title.trim(),
      destination: destination.trim(),
      type: type as CreateTripInput["type"],
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      travelers: travelers.map((t) => t.trim()).filter(Boolean),
      places: places
        .filter((p) => p.name.trim())
        .map((p) => ({
          name: p.name.trim(),
          day: p.day ? Number(p.day) : null,
        })),
      note: note.trim() || undefined,
    });
    if (res.success) {
      toast.success("Trip created! 🧳");
      router.push(`/trips/${res.id}`);
    } else {
      setSaving(false);
      toast.error(res.error);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-head text-4xl font-bold sm:text-5xl">
        Plan a new trip
      </h1>
      <p className="mt-1 text-muted-foreground">
        We&apos;ll create a shared event too, so you can invite friends and
        collect photos.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Basics */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-head text-2xl font-bold">The basics</h2>
          <div className="mt-4 flex flex-col gap-5">
            <div className="grid gap-2">
              <Label htmlFor="trip-title">Trip title</Label>
              <Input
                id="trip-title"
                placeholder="e.g. Japan in spring"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                placeholder="e.g. Tokyo, Japan"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Trip type</Label>
              <Select value={type} onValueChange={(v) => setType(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIP_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="start-date">Start date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end-date">End date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            {duration != null && (
              <p className="font-head text-xl">Duration: {duration} days</p>
            )}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Anything to remember for this trip..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Travelers */}
        <Card className="p-6">
          <h2 className="font-head text-2xl font-bold">Travelers</h2>
          <div className="mt-4 flex flex-col gap-3">
            {travelers.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    placeholder={`Traveler ${i + 1}`}
                    value={t}
                    onChange={(e) => {
                      const next = [...travelers];
                      next[i] = e.target.value;
                      setTravelers(next);
                    }}
                  />
                </div>
                {travelers.length > 1 && (
                  <button
                    type="button"
                    aria-label="Remove traveler"
                    className="text-lg text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setTravelers(travelers.filter((_, j) => j !== i))
                    }
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <Button size="sm" onClick={() => setTravelers([...travelers, ""])}>
              + Add traveler
            </Button>
          </div>
        </Card>
      </div>

      {/* Places to visit */}
      <Card className="p-6 mt-6">
        <h2 className="font-head text-2xl font-bold">Places to visit</h2>
        <p className="text-sm text-muted-foreground">
          Add a day number to drop it onto the roadmap; leave blank for the
          wishlist.
        </p>
        <Separator className="my-4" />
        <div className="flex flex-col gap-3">
          {places.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  placeholder={`Place ${i + 1} (e.g. Fushimi Inari)`}
                  value={p.name}
                  onChange={(e) => {
                    const next = [...places];
                    next[i] = { ...next[i], name: e.target.value };
                    setPlaces(next);
                  }}
                />
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  min={1}
                  placeholder="Day"
                  value={p.day}
                  onChange={(e) => {
                    const next = [...places];
                    next[i] = { ...next[i], day: e.target.value };
                    setPlaces(next);
                  }}
                />
              </div>
              {places.length > 1 && (
                <button
                  type="button"
                  aria-label="Remove place"
                  className="text-lg text-muted-foreground hover:text-foreground"
                  onClick={() => setPlaces(places.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <Button
            size="sm"
            onClick={() => setPlaces([...places, { name: "", day: "" }])}
          >
            + Add place
          </Button>
        </div>
      </Card>

      <div className="mt-6">
        <Button size="lg" onClick={submit} disabled={saving}>
          {saving ? "Creating…" : "Create trip"}
        </Button>
      </div>
    </main>
  );
}
