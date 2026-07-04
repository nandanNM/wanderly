import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/data/auth";
import { getMyProfile } from "@/data/profile";
import { getMyPlan } from "@/data/subscriptions";
import { SiteHeader } from "@/components/layout/site-header";
import { ProfileForm } from "@/components/profile/profile-form";

export const metadata: Metadata = {
  title: "Profile · Wanderly",
};

export default async function ProfilePage() {
  // Protected route: only signed-in users get here.
  const current = await getCurrentUser();
  if (!current) {
    redirect("/sign-in");
  }
  const [profile, plan] = await Promise.all([getMyProfile(), getMyPlan()]);
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <ProfileForm profile={profile} plan={plan} />
    </div>
  );
}
