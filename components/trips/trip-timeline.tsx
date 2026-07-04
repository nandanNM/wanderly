"use client";

import {
  addDays as addDaysFns,
  differenceInCalendarDays,
  format,
  parseISO,
} from "date-fns";

type ItineraryItem = {
  id: string;
  dayDate: string | null;
  dayNumber: number | null;
  title: string;
  placeId: string | null;
  notes: string | null;
};

type Place = { id: string; name: string; category: string };

function addDays(iso: string, n: number): string {
  return format(addDaysFns(parseISO(iso), n), "yyyy-MM-dd");
}

function fmt(iso: string): string {
  return format(parseISO(iso), "EEE, MMM d");
}

export function TripTimeline({
  startDate,
  endDate,
  itinerary,
  places,
}: {
  startDate: string | null;
  endDate: string | null;
  itinerary: ItineraryItem[];
  places: Place[];
}) {
  const scheduledPlaceIds = new Set(
    itinerary.map((i) => i.placeId).filter(Boolean) as string[],
  );
  const unscheduled = places.filter((p) => !scheduledPlaceIds.has(p.id));

  // Build the day list from the date range (fallback: days present in itinerary).
  let days: { date: string; number: number }[] = [];
  if (startDate && endDate) {
    const total =
      differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1;
    days = Array.from({ length: Math.max(1, total) }, (_, i) => ({
      date: addDays(startDate, i),
      number: i + 1,
    }));
  } else {
    const uniq = Array.from(
      new Set(itinerary.map((i) => i.dayDate).filter(Boolean) as string[]),
    ).sort();
    days = uniq.map((date, i) => ({ date, number: i + 1 }));
  }

  return (
    <div className="flex flex-col gap-6">
      {days.length === 0 && (
        <p className="text-[#7a7a7a]">
          Add start &amp; end dates to build a day-by-day roadmap.
        </p>
      )}

      {days.map((day) => {
        const items = itinerary.filter((i) => i.dayDate === day.date);
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
              <p className="mb-2 text-sm text-[#7a7a7a]">{fmt(day.date)}</p>
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
    </div>
  );
}
