// Google Maps links and embeds for an entry's place. Neither needs an API key.

/**
 * What Google searches for: the entry's name near its address, so it finds
 * the place itself (with its rating and hours) rather than just the street.
 */
export const placeQuery = (name: string, address: string) =>
  `${name}, ${address}`

/** The place's page in Google Maps, or the app on phones (Maps URLs). */
export function googleMapsUrl(query: string) {
  const url = new URL('https://www.google.com/maps/search/')
  url.search = new URLSearchParams({ api: '1', query }).toString()
  return url.href
}

/** An embeddable map with Google's card for the place it finds. */
export function googleMapsEmbedUrl(query: string, language: string) {
  const url = new URL('https://www.google.com/maps')
  url.search = new URLSearchParams({
    q: query,
    hl: language,
    output: 'embed',
  }).toString()
  return url.href
}
