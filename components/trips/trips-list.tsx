"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { PhotoStackCard } from "@/components/ui/photo-stack-card";
import type { TripSummary } from "@/data/trips";
import type { PlanUsage } from "@/data/subscriptions";

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

function dateLine(t: TripSummary): string {
  const parts: string[] = [];
  if (t.startDate) parts.push(format(parseISO(t.startDate), "MMM d"));
  if (t.durationDays) parts.push(`${t.durationDays} days`);
  return parts.join(" · ");
}

function subtitle(t: TripSummary): string {
  return [t.destination, dateLine(t)].filter(Boolean).join(" · ") || "—";
}

export function TripsList({
  trips,
  plan,
}: {
  trips: TripSummary[];
  plan: PlanUsage | null;
}) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-head text-4xl font-bold sm:text-5xl">
            Your trips
          </h1>
          {plan && (
            <p className="mt-1 text-sm text-muted-foreground">
              {plan.planName} plan · {plan.tripsUsed}
              {plan.maxTrips != null ? ` / ${plan.maxTrips}` : ""} trips used
            </p>
          )}
        </div>
        <Link href="/trips/new">
          <Button>+ New trip</Button>
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-card p-10 text-center">
          <p className="font-head text-2xl">No trips yet ✎</p>
          <p className="mt-1 text-muted-foreground">
            Plan your first adventure to get started.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-14 pb-6 sm:justify-start">
          {trips.map((t) => (
            <Link key={t.id} href={`/trips/${t.id}`} className="block">
              <PhotoStackCard
                images={t.coverImages}
                category={t.type ? (TYPE_LABELS[t.type] ?? t.type) : t.status}
                title={t.title}
                subtitle={subtitle(t)}
              />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
