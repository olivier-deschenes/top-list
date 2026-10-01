import { getLocale } from '#/paraglide/runtime'

const cache = new Map<
  string,
  Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat
>()

function cached<
  T extends Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat,
>(key: string, create: (locale: string) => T): T {
  const locale = getLocale()
  const id = `${locale}:${key}`
  let formatter = cache.get(id) as T | undefined
  if (!formatter) {
    formatter = create(locale)
    cache.set(id, formatter)
  }
  return formatter
}

/** One decimal, locale aware ("4.6", "4,6"). */
export function formatRating(value: number) {
  return cached(
    'rating',
    (locale) =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
  ).format(value)
}

export function formatPercent(value: number) {
  return cached(
    'percent',
    (locale) =>
      new Intl.NumberFormat(locale, {
        style: 'percent',
        maximumFractionDigits: 0,
      }),
  ).format(value)
}

/**
 * Pass timeZone "UTC" when rendering before hydration: the Worker runs in
 * UTC, so server and first client render must agree.
 */
export function formatDate(timestamp: number, timeZone?: string) {
  return cached(
    `date:${timeZone ?? 'local'}`,
    (locale) =>
      new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone }),
  ).format(timestamp)
}

export function formatDateTime(timestamp: number) {
  return cached(
    'datetime',
    (locale) =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
  ).format(timestamp)
}

export function formatTime(timestamp: number) {
  return cached(
    'time',
    (locale) => new Intl.DateTimeFormat(locale, { timeStyle: 'short' }),
  ).format(timestamp)
}

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
]

/** "3 hours ago", "il y a 3 heures"; "now" under a minute. */
export function formatRelative(timestamp: number, now = Date.now()) {
  const rtf = cached(
    'relative',
    (locale) => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }),
  )
  const seconds = Math.round((timestamp - now) / 1000)
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return rtf.format(Math.round(seconds / size), unit)
    }
  }
  return rtf.format(0, 'second')
}

const startOfDay = (timestamp: number) => {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

/** Heading for a day of activity: "Today", "Yesterday", or a full date. */
export function formatDay(timestamp: number, now = Date.now()) {
  const days = Math.round(
    (startOfDay(timestamp) - startOfDay(now)) / 86_400_000,
  )
  if (days === 0 || days === -1) {
    const label = cached(
      'relative',
      (locale) => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }),
    ).format(days, 'day')
    return label.charAt(0).toLocaleUpperCase() + label.slice(1)
  }
  const label = cached(
    'day',
    (locale) =>
      new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
  ).format(timestamp)
  return label.charAt(0).toLocaleUpperCase() + label.slice(1)
}

export function dayKey(timestamp: number) {
  return startOfDay(timestamp)
}

/** Readable host for an external link ("maps.google.com"). */
export function linkHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
