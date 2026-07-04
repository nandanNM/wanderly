import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { plans } from "./plans-schema";

// One subscription row per user (their current plan lifecycle). Free users get
// a row on signup; paid providers (Stripe) fill provider_* + current_period_end.
export const subscriptionStatus = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "incomplete",
]);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "restrict" }),
    status: subscriptionStatus("status").notNull().default("active"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    provider: varchar("provider", { length: 40 }),
    providerSubscriptionId: varchar("provider_subscription_id", {
      length: 255,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("idx_subscriptions_plan").on(t.planId)],
);
