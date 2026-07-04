import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/data/auth";
import { SiteHeader } from "@/components/layout/site-header";
import { AcceptInvite } from "@/components/trips/accept-invite";

export const metadata: Metadata = {
  title: "Trip invite · Wanderly",
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const user = await getCurrentUser();
  const { token } = await params;
  if (!user) {
    // Sign in first, then re-open the invite link from your email.
    redirect("/sign-in");
  }
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <AcceptInvite token={token} />
    </div>
  );
}
