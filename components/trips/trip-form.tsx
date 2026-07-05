"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Divider,
  Input,
  Select,
  Textarea,
  ToastContainer,
  useToast,
} from "sketchbook-ui";
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
  const { toasts, showToast, dismissToast } = useToast();

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
      showToast("Add a title and destination first ✎", "warning");
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
      showToast("Trip created! 🧳", "success");
      router.push(`/trips/${res.id}`);
    } else {
      setSaving(false);
      showToast(res.error, "error");
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-hand text-4xl font-bold sm:text-5xl">
        Plan a new trip
      </h1>
      <p className="mt-1 text-[#5a5a5a]">
        We&apos;ll create a shared event too, so you can invite friends and
        collect photos.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Basics */}
        <Card variant="notebook" className="lg:col-span-2">
          <h2 className="font-hand text-2xl font-bold">The basics</h2>
          <div className="mt-4 flex flex-col gap-5">
            <Input
              label="Trip title"
              placeholder="e.g. Japan in spring"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              label="Destination"
              placeholder="e.g. Tokyo, Japan"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
            <div>
              <p className="font-hand mb-1 text-xl">Trip type</p>
              <Select
                defaultValue={type}
                onChange={(v: string) => setType(v)}
                options={TRIP_TYPE_OPTIONS}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Start date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="End date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {duration != null && (
              <p className="font-hand text-xl">Duration: {duration} days</p>
            )}
            <Textarea
              label="Notes"
              placeholder="Anything to remember for this trip..."
              showLines
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </Card>

        {/* Travelers */}
        <Card variant="paper">
          <h2 className="font-hand text-2xl font-bold">Travelers</h2>
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
                    className="text-lg text-[#9a9a9a] hover:text-[#2a2a2a]"
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
      <Card variant="paper" className="mt-6">
        <h2 className="font-hand text-2xl font-bold">Places to visit</h2>
        <p className="text-sm text-[#7a7a7a]">
          Add a day number to drop it onto the roadmap; leave blank for the
          wishlist.
        </p>
        <Divider variant="dashed" />
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
                  className="text-lg text-[#9a9a9a] hover:text-[#2a2a2a]"
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

      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        position="bottom-right"
      />
    </main>
  );
}
