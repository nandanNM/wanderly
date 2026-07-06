"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/ui/logo";
import { authClient } from "@/lib/auth-client";

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
            <Badge variant="default">Beta</Badge>
          </span>
        </div>
        {session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="cursor-pointer rounded-full outline-none"
              >
                <Avatar size="lg">
                  <AvatarImage
                    src={session.user.image ?? undefined}
                    alt={session.user.name ?? "User"}
                  />
                  <AvatarFallback>
                    {(session.user.name ?? "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => router.push("/trips")}>
                My trips
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push("/profile")}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={async () => {
                  await authClient.signOut();
                  router.push("/");
                  router.refresh();
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
