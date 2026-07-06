"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { format, parseISO } from "date-fns";
import { Badge, Button, Card } from "sketchbook-ui";
import { greenBadge } from "@/lib/site-content";
import { buildTripDays } from "@/lib/trip-days";
import type { TripDetail, TripMediaItem, TripStorage } from "@/data/trips";
import { TripTimeline } from "./trip-timeline";
import { TripGallery } from "./trip-gallery";
import { ShareDialog } from "./share-dialog";
import type { MapPoint } from "./trip-map";

// Leaflet touches window on import, so load the map client-only.
const TripMap = dynamic(() => import("./trip-map").then((m) => m.TripMap), {
  ssr: false,
  loading: () => (
    <div className="grid h-105 place-items-center rounded-2xl border border-black/10 bg-black/3 text-[#7a7a7a]">
      Loading map…
    </div>
  ),
});

function fmt(iso: string): string {
  return format(parseISO(iso), "MMM d, yyyy");
}

const TYPE_LABELS: Record<string, string> = {
  adventure: "Adventure",
  beach: "Beach",
  city: "City break",
  roadtrip: "Road trip",
  nature: "Nature",
  family: "Family",
  cruise: "Cruise",
  other: "Other",
};

export function TripDetailView({
  trip,
  media,
  storage,
}: {
  trip: TripDetail;
  media: TripMediaItem[];
  storage: TripStorage | null;
}) {
  const [tab, setTab] = useState<"timeline" | "map" | "gallery">("timeline");
  const [shareOpen, setShareOpen] = useState(false);

  const points: MapPoint[] = [
    ...trip.destinations.map((d) => ({
      id: d.id,
      name: d.name,
      latitude: d.latitude,
      longitude: d.longitude,
      kind: "destination" as const,
    })),
    ...trip.places.map((p) => ({
      id: p.id,
      name: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
      kind: "place" as const,
    })),
  ];

  const dateLine = [
    trip.startDate && trip.endDate
      ? `${fmt(trip.startDate)} → ${fmt(trip.endDate)}`
      : null,
    trip.durationDays ? `${trip.durationDays} days` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // One shared day list for the roadmap timeline and the gallery day picker.
  const days = buildTripDays(
    trip.startDate,
    trip.endDate,
    trip.itinerary.map((i) => i.dayDate),
  );

  // Day-tagged notes surface on the roadmap; the sidebar shows general ones.
  const generalNotes = trip.notes.filter((n) => !n.dayDate);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-hand text-4xl font-bold sm:text-5xl">
            {trip.title}
          </h1>
          <p className="mt-1 text-[#5a5a5a]">
            📍 {trip.destination ?? "Somewhere"}
            {trip.type ? ` · ${TYPE_LABELS[trip.type] ?? trip.type}` : ""}
            {dateLine ? ` · ${dateLine}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge colors={greenBadge}>{trip.status}</Badge>
          <Button size="sm" onClick={() => setShareOpen(true)}>
            🔗 Share
          </Button>
          {trip.isOwner && (
            <Link href={`/trips/${trip.id}/settings`}>
              <Button size="sm">⚙ Settings</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main: Roadmap / Map tabs */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex gap-2">
            <Button
              size="sm"
              colors={tab === "timeline" ? greenBadge : undefined}
              onClick={() => setTab("timeline")}
            >
              🗓 Roadmap
            </Button>
            <Button
              size="sm"
              colors={tab === "map" ? greenBadge : undefined}
              onClick={() => setTab("map")}
            >
              🗺 Map
            </Button>
            <Button
              size="sm"
              colors={tab === "gallery" ? greenBadge : undefined}
              onClick={() => setTab("gallery")}
            >
              📸 Gallery
            </Button>
          </div>
          <Card variant="paper">
            {tab === "timeline" && (
              <TripTimeline
                tripId={trip.id}
                days={days}
                itinerary={trip.itinerary}
                places={trip.places}
                media={media}
                notes={trip.notes}
                canContribute={trip.isMember}
                canDownload={storage?.allowDownloads ?? false}
              />
            )}
            {tab === "map" && <TripMap points={points} />}
            {tab === "gallery" && (
              <TripGallery
                tripId={trip.id}
                media={media}
                days={days}
                storage={storage}
                canContribute={trip.isMember}
              />
            )}
          </Card>
        </div>

        {/* Sidebar: about, notes */}
        <div className="flex flex-col gap-6">
          {trip.summary && (
            <Card variant="paper">
              <h2 className="font-hand text-2xl font-bold">About</h2>
              <p className="mt-2 text-[#5a5a5a]">{trip.summary}</p>
            </Card>
          )}

          {generalNotes.length > 0 && (
            <Card variant="sticky">
              <h2 className="font-hand text-2xl font-bold">Notes</h2>
              <ul className="mt-2 flex flex-col gap-2">
                {generalNotes.map((n) => (
                  <li key={n.id} className="text-[#4a4a4a]">
                    ✏️ {n.body}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        tripId={trip.id}
        title={trip.title}
      />
    </main>
  );
}
