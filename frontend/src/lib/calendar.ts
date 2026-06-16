export const MONTHS_PL = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

export const DAYS_PL = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function dateFromYMD(y: number, m: number, d: number): Date {
  return new Date(y, m, d);
}

export interface CalendarReservation {
  date_start_planned: string;
  date_end_planned: string;
}

export function doesRangeOverlap(
  start: Date,
  end: Date,
  reservations: CalendarReservation[],
): boolean {
  if (end <= start) return false;
  return reservations.some((reservation) => {
    const reservationStart = new Date(reservation.date_start_planned);
    const reservationEnd = new Date(reservation.date_end_planned);
    return start < reservationEnd && end > reservationStart;
  });
}

export function toISODateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:00:00`;
}
