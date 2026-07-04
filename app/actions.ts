"use server";

import { revalidatePath } from "next/cache";
import { createEvent, deleteEvent } from "@/data/events";

// Thin Server Actions: they delegate to the Data Access Layer, which performs
// authentication, authorization, and DB access. Actions only orchestrate
// (call the DAL, revalidate) and return minimal, client-safe values.

export async function createEventAction(input: {
  name: string;
  description?: string;
  visibility?: "public" | "private";
}) {
  const event = await createEvent(input); // auth + insert happen in the DAL
  revalidatePath("/events");
  return { id: event.id };
}

export async function deleteEventAction(eventId: string) {
  await deleteEvent(eventId); // auth + ownership check happen in the DAL
  revalidatePath("/events");
  return { success: true };
}
