import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/data/auth";
import { getTrip } from "@/data/trips";
import { SiteHeader } from "@/components/layout/site-header";
import { TripSettings } from "@/components/trips/trip-settings";

export const metadata: Metadata = {
  title: "Trip settings · Wanderly",
};

export default async function TripSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const current = await getCurrentUser();
  if (!current) {
    redirect("/sign-in");
  }
  const { id } = await params;

  const trip = await getTrip(id).catch(() => null);
  if (!trip) {
    notFound();
  }
  // Settings are owner-only — send everyone else back to the trip.
  if (!trip.isOwner) {
    redirect(`/trips/${id}`);
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <TripSettings trip={trip} />
    </div>
  );
}
