"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Badge, Button, Card } from "sketchbook-ui";
import { greenBadge } from "@/lib/site-content";
import type { TripSummary } from "@/data/trips";
import type { PlanUsage } from "@/data/subscriptions";

function line(t: TripSummary): string {
  const parts: string[] = [];
  if (t.startDate) parts.push(format(parseISO(t.startDate), "MMM d"));
  if (t.durationDays) parts.push(`${t.durationDays} days`);
  return parts.join(" · ");
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
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-hand text-4xl font-bold sm:text-5xl">
            Your trips
          </h1>
          {plan && (
            <p className="mt-1 text-sm text-[#7a7a7a]">
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
        <Card variant="paper">
          <p className="text-[#5a5a5a]">
            No trips yet — plan your first adventure to get started. ✎
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((t) => (
            <Link key={t.id} href={`/trips/${t.id}`}>
              <Card variant="paper">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-hand text-2xl font-bold">{t.title}</h2>
                  <Badge size="sm" colors={greenBadge}>
                    {t.status}
                  </Badge>
                </div>
                <p className="mt-1 text-[#5a5a5a]">📍 {t.destination ?? "—"}</p>
                {line(t) && <p className="text-sm text-[#7a7a7a]">{line(t)}</p>}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
