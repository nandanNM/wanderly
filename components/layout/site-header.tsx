"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, Badge, Button, Dropdown } from "sketchbook-ui";
import { Logo } from "@/components/ui/logo";
import { authClient } from "@/lib/auth-client";
import { greenBadge } from "@/lib/site-content";

// Single shared navbar used across the app (landing, profile, upload).
// Auth-aware: shows the user's avatar menu when signed in, a Sign in button
// otherwise. `max-w-7xl` matches every page's content width.
export function SiteHeader() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  return (
    <>
      <div className="h-1.5 w-full bg-[#2a2a2a]" />
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/">
            <Logo priority />
          </Link>
          <span className="hidden sm:inline-flex">
            <Badge size="sm" colors={greenBadge}>
              Beta
            </Badge>
          </span>
        </div>
        {session?.user ? (
          <Dropdown
            customTrigger={
              <Avatar
                src={session.user.image ?? undefined}
                initials={(session.user.name ?? "U").charAt(0).toUpperCase()}
                size="sm"
              />
            }
            items={[
              {
                label: "My trips",
                icon: "duplicate",
                onClick: () => router.push("/trips"),
              },
              {
                label: "Profile",
                icon: "edit",
                onClick: () => router.push("/profile"),
              },
              {
                label: "Sign out",
                icon: "share",
                danger: true,
                onClick: async () => {
                  await authClient.signOut();
                  router.push("/");
                  router.refresh();
                },
              },
            ]}
          />
        ) : (
          <Link href="/sign-in">
            <Button size="sm">Sign in</Button>
          </Link>
        )}
      </header>
      <div className="h-px w-full bg-black/10" />
    </>
  );
}
