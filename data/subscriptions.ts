import "server-only";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions, plans, trips } from "@/db/schema";
import { requireUser } from "./auth";

export type PlanUsage = {
  planCode: string;
  planName: string;
  status: string;
  maxTrips: number | null; // plan.max_events — one event per trip
  tripsUsed: number;
};

/** The current user's plan + how many trips they've used against it. */
export async function getMyPlan(): Promise<PlanUsage | null> {
  const user = await requireUser();
  const [row] = await db
    .select({
      code: plans.code,
      name: plans.name,
      maxEvents: plans.maxEvents,
      status: subscriptions.status,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(plans.id, subscriptions.planId))
    .where(eq(subscriptions.userId, user.id))
    .limit(1);
  if (!row) return null;

  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(trips)
    .where(eq(trips.ownerId, user.id));

  return {
    planCode: row.code,
    planName: row.name,
    status: row.status,
    maxTrips: row.maxEvents,
    tripsUsed: n,
  };
}
