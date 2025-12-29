export function ymdFromLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function todayYMD(): string {
  return ymdFromLocalDate(new Date())
}

/**
 * Calories "day" boundary at 12:00 PM local time:
 * - before noon, count toward "yesterday"
 * - at/after noon, count toward "today"
 */
export function calorieDayYMD(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() - 12 * 60 * 60 * 1000)
  return ymdFromLocalDate(shifted)
}

export function dateFromYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map((v) => Number(v))
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function formatDateShort(ymd: string): string {
  const d = dateFromYMD(ymd)
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(d)
}


