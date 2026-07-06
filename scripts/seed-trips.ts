/**
 * Demo trips: create a couple of extra trips (with a backing event + cover
 * photos) for the current owner so the trips list shows the photo-stack cards
 * three-in-a-row. Uses external Picsum images — no S3 needed. Run:
 *
 *   pnpm db:seed:trips
 *
 * Idempotent: skips a trip whose title already exists, and stops gracefully if
 * the plan's trip limit is reached.
 */
import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { and, desc, eq } from "drizzle-orm";
import { trips, tripMembers, events, media, user as users } from "../db/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

const pic = (id: number) => `https://picsum.photos/id/${id}/800/600`;

const DEMO_TRIPS = [
  {
    title: "Swiss Alps",
    destination: "Interlaken, Switzerland",
    type: "adventure" as const,
    startDate: "2026-01-10",
    endDate: "2026-01-15",
    summary: "Snow, cable cars and fondue in the mountains.",
    photoIds: [1016, 1018, 1047],
  },
  {
    title: "Maldives",
    destination: "Malé, Maldives",
    type: "beach" as const,
    startDate: "2026-08-05",
    endDate: "2026-08-12",
    summary: "Overwater villas and turquoise lagoons.",
    photoIds: [1044, 1057, 1015],
  },
];

async function main() {
  const [latest] = await db
    .select()
    .from(trips)
    .orderBy(desc(trips.createdAt))
    .limit(1);
  if (!latest) {
    console.error("No trips found — create one first (or run pnpm db:seed).");
    process.exit(1);
  }
  const ownerId = latest.ownerId;
  const [owner] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, ownerId))
    .limit(1);
  const ownerName = owner?.name || "You";

  for (const def of DEMO_TRIPS) {
    const [exists] = await db
      .select({ id: trips.id })
      .from(trips)
      .where(and(eq(trips.ownerId, ownerId), eq(trips.title, def.title)))
      .limit(1);
    if (exists) {
      console.log(`• "${def.title}" already exists — skipping.`);
      continue;
    }

    try {
      await db.transaction(async (tx) => {
        // Backing event (a trigger auto-adds the creator as owner member).
        const [event] = await tx
          .insert(events)
          .values({
            creatorId: ownerId,
            name: def.title,
            visibility: "private",
          })
          .returning();
        const [trip] = await tx
          .insert(trips)
          .values({
            ownerId,
            eventId: event.id,
            title: def.title,
            destination: def.destination,
            type: def.type,
            startDate: def.startDate,
            endDate: def.endDate,
            summary: def.summary,
            status: "planning",
          })
          .returning();
        await tx.insert(tripMembers).values({
          tripId: trip.id,
          userId: ownerId,
          name: ownerName,
          role: "owner",
        });
        await tx.insert(media).values(
          def.photoIds.map((id) => ({
            eventId: event.id,
            uploadedBy: ownerId,
            mediaType: "image" as const,
            storageKey: pic(id),
            fileName: `demo-${id}.jpg`,
            mimeType: "image/jpeg",
            fileSizeBytes: 480_000,
            caption: "Demo photo",
          })),
        );
      });
      console.log(`✓ Created demo trip "${def.title}".`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/event limit|limit reached|cap/i.test(msg)) {
        console.log(
          `⚠ Couldn't create "${def.title}" — plan trip limit reached.`,
        );
        break;
      }
      throw err;
    }
  }
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
