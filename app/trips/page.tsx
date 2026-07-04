import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/data/auth";
import { listMyTrips } from "@/data/trips";
import { getMyPlan } from "@/data/subscriptions";
import { SiteHeader } from "@/components/layout/site-header";
import { TripsList } from "@/components/trips/trips-list";

export const metadata: Metadata = {
  title: "Trips · Wanderly",
};

export default async function TripsPage() {
  const current = await getCurrentUser();
  if (!current) {
    redirect("/sign-in");
  }
  const [trips, plan] = await Promise.all([listMyTrips(), getMyPlan()]);
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <TripsList trips={trips} plan={plan} />
    </div>
  );
}
