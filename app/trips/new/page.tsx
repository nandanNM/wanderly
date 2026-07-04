import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/data/auth";
import { SiteHeader } from "@/components/layout/site-header";
import { TripForm } from "@/components/trips/trip-form";

export const metadata: Metadata = {
  title: "New trip · Wanderly",
};

export default async function NewTripPage() {
  const current = await getCurrentUser();
  if (!current) {
    redirect("/sign-in");
  }
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <TripForm />
    </div>
  );
}
