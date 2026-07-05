import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/data/auth";
import { getTrip, listTripMedia, getTripStorage } from "@/data/trips";
import { SiteHeader } from "@/components/layout/site-header";
import { TripDetailView } from "@/components/trips/trip-detail";

export const metadata: Metadata = {
  title: "Trip · Wanderly",
};

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const current = await getCurrentUser();
  if (!current) {
    redirect("/sign-in");
  }
  const { id } = await params;

  // Not found or not authorized — don't leak which.
  const trip = await getTrip(id).catch(() => null);
  if (!trip) {
    notFound();
  }
  const [media, storage] = await Promise.all([
    listTripMedia(id).catch(() => []),
    getTripStorage(id).catch(() => null),
  ]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <TripDetailView trip={trip} media={media} storage={storage} />
    </div>
  );
}
