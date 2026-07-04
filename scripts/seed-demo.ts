/**
 * Demo seed: attaches placeholder photos (external Picsum URLs — no S3 needed)
 * tagged to roadmap days, plus a few per-day "memory" notes, to your most
 * recent trip. Lets you preview the day-by-day gallery UI without uploading.
 *
 *   pnpm db:seed
 *
 * Re-runnable: it only removes the demo rows it previously created (external
 * picsum images + the exact seed notes), never your real S3 media.
 */
import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { and, desc, eq, inArray, like } from "drizzle-orm";
import { trips, media, notes } from "../db/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

const DEMO_PREFIX = "https://picsum.photos/seed/";

/** yyyy-MM-dd, n days after `iso` (UTC). */
function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Photos per day (1-based day number) — Picsum seeds keep them stable.
const PHOTOS: { day: number; seed: string }[] = [
  { day: 1, seed: "wanderly-arrival" },
  { day: 1, seed: "wanderly-oldtown" },
  { day: 1, seed: "wanderly-sunset" },
  { day: 2, seed: "wanderly-market" },
  { day: 2, seed: "wanderly-coffee" },
  { day: 2, seed: "wanderly-street" },
  { day: 2, seed: "wanderly-temple" },
  { day: 3, seed: "wanderly-hike" },
  { day: 3, seed: "wanderly-view" },
  { day: 3, seed: "wanderly-dinner" },
];

// Memory notes per day.
const NOTES: { day: number; body: string }[] = [
  { day: 1, body: "Landed and wandered the old town till sunset 🌇" },
  { day: 1, body: "Found the cutest little guesthouse near the square." },
  { day: 2, body: "Market morning — best street food of the trip 🍜" },
  { day: 3, body: "Long hike, unreal views at the top ⛰️" },
];

async function main() {
  const [trip] = await db
    .select()
    .from(trips)
    .orderBy(desc(trips.createdAt))
    .limit(1);

  if (!trip) {
    console.error("No trips found — create a trip in the app first.");
    process.exit(1);
  }
  if (!trip.eventId) {
    console.error("Latest trip has no linked event; cannot attach media.");
    process.exit(1);
  }

  // Ensure a date range so the roadmap renders numbered days.
  let startDate = trip.startDate;
  if (!startDate || !trip.endDate) {
    startDate = "2026-07-07";
    await db
      .update(trips)
      .set({ startDate, endDate: "2026-07-11", status: "active" })
      .where(eq(trips.id, trip.id));
    console.log(`Set demo dates (${startDate} → 2026-07-11) on the trip.`);
  }
  const dayDate = (n: number) => addDays(startDate!, n - 1);

  // Clean up any previous demo rows (external images + exact seed notes only).
  await db
    .delete(media)
    .where(
      and(
        eq(media.eventId, trip.eventId),
        like(media.storageKey, `${DEMO_PREFIX}%`),
      ),
    );
  await db.delete(notes).where(
    and(
      eq(notes.tripId, trip.id),
      inArray(
        notes.body,
        NOTES.map((n) => n.body),
      ),
    ),
  );

  await db.insert(media).values(
    PHOTOS.map((p) => ({
      eventId: trip.eventId!,
      uploadedBy: trip.ownerId,
      mediaType: "image" as const,
      storageKey: `${DEMO_PREFIX}${p.seed}/800/600`,
      fileName: `${p.seed}.jpg`,
      mimeType: "image/jpeg",
      fileSizeBytes: 480_000,
      caption: "Demo photo",
      dayDate: dayDate(p.day),
    })),
  );

  await db.insert(notes).values(
    NOTES.map((n) => ({
      tripId: trip.id,
      authorId: trip.ownerId,
      dayDate: dayDate(n.day),
      body: n.body,
    })),
  );

  console.log(
    `✓ Seeded ${PHOTOS.length} demo photos + ${NOTES.length} memories on "${trip.title}" (${trip.id}).`,
  );
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
