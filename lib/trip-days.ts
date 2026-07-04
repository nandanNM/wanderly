import {
  addDays as addDaysFns,
  differenceInCalendarDays,
  format,
  parseISO,
} from "date-fns";

export type TripDay = {
  /** ISO date, "yyyy-MM-dd" — matches media.dayDate / notes.dayDate. */
  date: string;
  /** 1-based day number. */
  number: number;
  /** Human label, e.g. "Tue, Jul 7". */
  label: string;
};

/**
 * Build the day list for a trip. Prefers the start/end range; otherwise falls
 * back to the distinct days that already have itinerary entries. Shared by the
 * roadmap timeline, the gallery day picker and the day modal so they agree.
 */
export function buildTripDays(
  startDate: string | null,
  endDate: string | null,
  itineraryDates: (string | null)[] = [],
): TripDay[] {
  if (startDate && endDate) {
    const total =
      differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1;
    return Array.from({ length: Math.max(1, total) }, (_, i) => {
      const date = format(addDaysFns(parseISO(startDate), i), "yyyy-MM-dd");
      return {
        date,
        number: i + 1,
        label: format(parseISO(date), "EEE, MMM d"),
      };
    });
  }
  const uniq = Array.from(
    new Set(itineraryDates.filter(Boolean) as string[]),
  ).sort();
  return uniq.map((date, i) => ({
    date,
    number: i + 1,
    label: format(parseISO(date), "EEE, MMM d"),
  }));
}
