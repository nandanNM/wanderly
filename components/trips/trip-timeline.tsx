"use client";

import { useState } from "react";
import type { TripMediaItem } from "@/data/trips";
import type { TripDay } from "@/lib/trip-days";
import { TripDayModal } from "./trip-day-modal";

type ItineraryItem = {
  id: string;
  dayDate: string | null;
  dayNumber: number | null;
  title: string;
  placeId: string | null;
  notes: string | null;
};

type Place = { id: string; name: string; category: string };
type Note = { id: string; body: string; dayDate: string | null };

const MAX_THUMBS = 4;

export function TripTimeline({
  tripId,
  days,
  itinerary,
  places,
  media,
  notes,
  canContribute,
}: {
  tripId: string;
  days: TripDay[];
  itinerary: ItineraryItem[];
  places: Place[];
  media: TripMediaItem[];
  notes: Note[];
  canContribute: boolean;
}) {
  const [openDay, setOpenDay] = useState<TripDay | null>(null);

  const scheduledPlaceIds = new Set(
    itinerary.map((i) => i.placeId).filter(Boolean) as string[],
  );
  const unscheduled = places.filter((p) => !scheduledPlaceIds.has(p.id));

  const photosFor = (date: string) => media.filter((m) => m.dayDate === date);
  const notesFor = (date: string) => notes.filter((n) => n.dayDate === date);

  return (
    <div className="flex flex-col gap-6">
      {days.length === 0 && (
        <p className="text-[#7a7a7a]">
          Add start &amp; end dates to build a day-by-day roadmap.
        </p>
      )}

      {days.map((day) => {
        const items = itinerary.filter((i) => i.dayDate === day.date);
        const dayPhotos = photosFor(day.date);
        const dayNotes = notesFor(day.date);
        const extra = dayPhotos.length - MAX_THUMBS;
        return (
          <div key={day.date} className="flex gap-4">
            {/* Day marker rail */}
            <div className="flex flex-col items-center">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-[#2a2a2a] bg-white">
                <span className="font-hand text-xl font-bold leading-none">
                  {day.number}
                </span>
              </div>
              <div className="mt-1 w-px flex-1 bg-black/15" />
            </div>
            <div className="flex-1 pb-2">
              <p className="font-hand text-2xl font-bold leading-none">
                Day {day.number}
              </p>
              <p className="mb-2 text-sm text-[#7a7a7a]">{day.label}</p>
              {items.length === 0 ? (
                <p className="text-sm text-[#9a9a9a]">Nothing planned yet.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {items.map((i) => (
                    <li
                      key={i.id}
                      className="rounded-lg border border-black/10 bg-white px-3 py-2"
                    >
                      <span className="font-medium">📍 {i.title}</span>
                      {i.notes && (
                        <span className="block text-sm text-[#7a7a7a]">
                          {i.notes}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {/* Photos & memories — hover to peek, click to open the day. */}
              <button
                type="button"
                onClick={() => setOpenDay(day)}
                title={`View Day ${day.number} photos & memories`}
                className="group/day mt-3 flex w-full flex-wrap items-center gap-2 rounded-xl border border-dashed border-black/15 p-2 text-left transition-colors hover:border-black/30 hover:bg-black/2"
              >
                {dayPhotos.length > 0 ? (
                  <div className="flex items-center gap-1.5">
                    {dayPhotos.slice(0, MAX_THUMBS).map((m) => (
                      <span
                        key={m.id}
                        className="h-12 w-12 overflow-hidden rounded-md border border-black/10 bg-white transition-transform group-hover/day:-translate-y-0.5"
                      >
                        {m.mediaType === "video" ? (
                          <video
                            src={m.url}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.url}
                            alt={m.fileName}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </span>
                    ))}
                    {extra > 0 && (
                      <span className="grid h-12 w-12 place-items-center rounded-md border border-black/10 bg-white text-sm font-medium text-[#5a5a5a]">
                        +{extra}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-[#9a9a9a]">
                    {canContribute
                      ? "📸 Add photos & memories for this day"
                      : "No photos yet"}
                  </span>
                )}

                <span className="ml-auto flex items-center gap-2 text-xs text-[#7a7a7a]">
                  {dayPhotos.length > 0 && <span>📸 {dayPhotos.length}</span>}
                  {dayNotes.length > 0 && <span>✏️ {dayNotes.length}</span>}
                  <span className="opacity-0 transition-opacity group-hover/day:opacity-100">
                    View →
                  </span>
                </span>
              </button>
            </div>
          </div>
        );
      })}

      {unscheduled.length > 0 && (
        <div className="rounded-2xl border border-dashed border-black/20 p-4">
          <p className="font-hand text-xl font-bold">Places to visit</p>
          <p className="mb-2 text-sm text-[#7a7a7a]">
            Not scheduled to a day yet.
          </p>
          <div className="flex flex-wrap gap-2">
            {unscheduled.map((p) => (
              <span
                key={p.id}
                className="rounded-full border border-black/15 bg-white px-3 py-1 text-sm"
              >
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <TripDayModal
        open={openDay !== null}
        onClose={() => setOpenDay(null)}
        tripId={tripId}
        day={openDay}
        photos={openDay ? photosFor(openDay.date) : []}
        notes={openDay ? notesFor(openDay.date) : []}
        canContribute={canContribute}
      />
    </div>
  );
}
