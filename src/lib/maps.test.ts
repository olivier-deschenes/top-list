import { describe, expect, it } from 'vitest'
import { googleMapsEmbedUrl, googleMapsUrl, placeQuery } from './maps'

// "&" and "#" would end the query early if it were not encoded.
const query = placeQuery('Fish & Chips #1', '4801 Rue Saint-Denis, Montréal')

describe('google maps urls', () => {
  it('searches for the name near the address', () => {
    expect(query).toBe('Fish & Chips #1, 4801 Rue Saint-Denis, Montréal')
  })

  it('links to the place with the Maps URLs search action', () => {
    const url = new URL(googleMapsUrl(query))
    expect(`${url.origin}${url.pathname}`).toBe(
      'https://www.google.com/maps/search/',
    )
    expect(url.searchParams.get('api')).toBe('1')
    expect(url.searchParams.get('query')).toBe(query)
    expect(url.hash).toBe('')
  })

  it('embeds the same search in the given language', () => {
    const url = new URL(googleMapsEmbedUrl(query, 'fr'))
    expect(url.searchParams.get('q')).toBe(query)
    expect(url.searchParams.get('hl')).toBe('fr')
    expect(url.searchParams.get('output')).toBe('embed')
    expect(url.hash).toBe('')
  })
})
