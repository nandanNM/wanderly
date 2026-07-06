"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { inviteAction } from "@/app/trips/actions";

export function ShareDialog({
  open,
  onClose,
  tripId,
  title,
}: {
  open: boolean;
  onClose: () => void;
  tripId: string;
  title: string;
}) {
  const router = useRouter();
  // Computed once on the client; "" during SSR (the dialog is closed then).
  const [url] = useState(() =>
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/trips/${tripId}`,
  );
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setMsg("Couldn't copy — select and copy the link manually.");
    }
  }

  async function nativeShare() {
    if (url && navigator.share) {
      await navigator.share({ title, url }).catch(() => {});
    }
  }

  async function sendEmail() {
    if (!email.trim()) return;
    setSending(true);
    setMsg(null);
    const res = await inviteAction(tripId, email.trim());
    setSending(false);
    if (res.success) {
      setEmail("");
      setMsg(
        res.added
          ? "Added to the trip! 🎉"
          : res.emailSent
            ? "Invite emailed ✉️"
            : "Invite created — set RESEND_API_KEY to email it.",
      );
      router.refresh();
    } else {
      setMsg(res.error);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share this trip</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          {/* Link + copy */}
          <div>
            <p className="font-head text-lg">Share a link</p>
            <div className="mt-1 flex items-end gap-2">
              <div className="w-full">
                <Input value={url} readOnly aria-label="Trip link" />
              </div>
              <Button size="sm" onClick={copy}>
                {copied ? "Copied!" : "Copy"}
              </Button>
              {typeof navigator !== "undefined" && "share" in navigator && (
                <Button size="sm" onClick={nativeShare}>
                  Share…
                </Button>
              )}
            </div>
          </div>

          {/* QR code */}
          <div className="flex flex-col items-center">
            <p className="mb-2 font-head text-lg">Or scan the QR code</p>
            <div className="rounded-xl border border-black/10 bg-white p-3">
              {url ? (
                <QRCodeSVG value={url} size={160} />
              ) : (
                <div className="h-40 w-40" />
              )}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Email invite */}
          <div>
            <p className="font-head text-lg">Invite by email</p>
            <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="w-full">
                <Input
                  type="email"
                  placeholder="friend@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button size="sm" onClick={sendEmail} disabled={sending}>
                {sending ? "Sending…" : "Send invite"}
              </Button>
            </div>
          </div>

          {msg && <p className="text-sm text-[#5a7d2e]">{msg}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
