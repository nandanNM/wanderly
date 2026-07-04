"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";

type Upload = {
  id: string;
  key: string;
  url: string;
  contentType: string | null;
  createdAt: string;
};

export default function UploadPage() {
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Upload[]>([]);

  const loadUploads = useCallback(async () => {
    const res = await fetch("/api/uploads");
    if (res.ok) {
      const data = await res.json();
      setItems(data.uploads ?? []);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/uploads")
      .then((res) => (res.ok ? res.json() : { uploads: [] }))
      .then((data) => {
        if (!cancelled) setItems(data.uploads ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const uploadFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    try {
      // 1. Ask the server for a presigned PUT URL.
      setStatus(`Requesting upload URL for ${file.name}...`);
      const presignedUrl = new URL("/api/presigned", window.location.href);
      presignedUrl.searchParams.set("fileName", file.name);
      presignedUrl.searchParams.set("contentType", file.type);
      const presignRes = await fetch(presignedUrl);
      if (!presignRes.ok) throw new Error("Failed to get presigned URL");
      const { signedUrl, key, url } = await presignRes.json();

      // 2. Upload the file bytes straight to S3.
      setStatus("Uploading to S3...");
      const putRes = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!putRes.ok) throw new Error("Upload to S3 failed");

      // 3. Save the reference in Postgres via Drizzle.
      setStatus("Saving reference...");
      const saveRes = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, url, contentType: file.type }),
      });
      if (!saveRes.ok) throw new Error("Failed to save reference");

      setStatus(`Uploaded ${file.name}`);
      await loadUploads();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Upload to S3</h1>

      <label className="flex flex-col gap-2">
        <span className="text-sm text-gray-500">Choose a file</span>
        <input type="file" onChange={uploadFile} disabled={busy} />
      </label>

      {status && <p className="text-sm">{status}</p>}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Recent uploads</h2>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No uploads yet.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {items.map((u) => (
              <li key={u.id} className="truncate text-sm">
                <a
                  href={u.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  {u.key}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
