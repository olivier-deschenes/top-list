import type { Entry } from './types'

// Where an entry is, for Google Maps links and embeds. Neither needs an API key.

export interface MapPlace {
  /** What Google Maps searches for. */
  query: string
  /** "lat,lng" to search around, when the entry's Google Maps link has one. */
  near: string | null
  /** Only the name was known, so Google shows the matches nearest the viewer. */
  guessed: boolean
  /** Opens the place in Google Maps: the entry's own Maps link, or a search. */
  href: string
}

/** google.com, maps.google.com, google.ca, google.co.uk, google.com.au… */
const GOOGLE_HOST = /^(?:www\.|maps\.)?google\.(?:com|[a-z]{2})(?:\.[a-z]{2})?$/

const parseUrl = (raw: string) => {
  try {
    return new URL(raw)
  } catch {
    return null
  }
}

/** "Schwartz%27s+Deli" in a Maps path is "Schwartz's Deli". */
const decodePathSegment = (segment: string) => {
  const spaced = segment.replace(/\+/g, ' ')
  try {
    return decodeURIComponent(spaced)
  } catch {
    return spaced
  }
}

/** Short links (maps.app.goo.gl) open the place but only Google can read them. */
const isGoogleMapsLink = (url: URL) =>
  (GOOGLE_HOST.test(url.hostname) &&
    (url.hostname.startsWith('maps.') || url.pathname.startsWith('/maps'))) ||
  url.hostname === 'maps.app.goo.gl' ||
  (url.hostname === 'goo.gl' && url.pathname.startsWith('/maps'))

/**
 * The place a Google Maps or Google search link names, and where it is when
 * the link says: the place's own pin (!3d…!4d… in the data), else the map's
 * center (@lat,lng). Null for links that name no place.
 */
export function placeFromGoogleLink(
  raw: string,
): { query: string; near: string | null } | null {
  const url = parseUrl(raw)
  if (!url || !GOOGLE_HOST.test(url.hostname)) return null
  const isMaps =
    url.hostname.startsWith('maps.') || url.pathname.startsWith('/maps')
  if (!isMaps && url.pathname !== '/search') return null

  const named = /^\/maps\/(?:place|search)\/([^/]+)/.exec(url.pathname)
  const query = (
    named
      ? decodePathSegment(named[1])
      : (url.searchParams.get('query') ?? url.searchParams.get('q') ?? '')
  ).trim()
  if (!query) return null

  const coordinate = '(-?\\d+(?:\\.\\d+)?)'
  const at =
    new RegExp(`!3d${coordinate}!4d${coordinate}`).exec(url.href) ??
    new RegExp(`/@${coordinate},${coordinate}`).exec(url.pathname)
  return { query, near: at ? `${at[1]},${at[2]}` : null }
}

/** A Google Maps search (Maps URLs): the place's page, or the app on phones. */
export function googleMapsSearchUrl(query: string) {
  const url = new URL('https://www.google.com/maps/search/')
  url.search = new URLSearchParams({ api: '1', query }).toString()
  return url.href
}

/**
 * Finds an entry with the most precise thing it has: its name near its
 * address, the place its Google Maps link names, or else its name alone.
 * Name and address together find the place itself (with its rating and
 * hours) rather than just the street.
 */
export function mapPlace(
  entry: Pick<Entry, 'name' | 'address' | 'url'>,
): MapPlace {
  const link = entry.url ? parseUrl(entry.url) : null
  const linked = entry.url ? placeFromGoogleLink(entry.url) : null
  const target = entry.address
    ? { query: `${entry.name}, ${entry.address}`, near: null, guessed: false }
    : linked
      ? { ...linked, guessed: false }
      : { query: entry.name, near: null, guessed: true }
  return {
    ...target,
    href:
      link && isGoogleMapsLink(link)
        ? link.href
        : googleMapsSearchUrl(target.query),
  }
}

/** An embeddable map with Google's card for the place it finds. */
export function googleMapsEmbedUrl(place: MapPlace, language: string) {
  const params = new URLSearchParams({ q: place.query })
  if (place.near) {
    // Zoomed in on the linked place, so the search finds that one.
    params.set('ll', place.near)
    params.set('z', '17')
  }
  params.set('hl', language)
  params.set('output', 'embed')
  const url = new URL('https://www.google.com/maps')
  url.search = params.toString()
  return url.href
}
