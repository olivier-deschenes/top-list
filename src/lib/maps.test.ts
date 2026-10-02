import { describe, expect, it } from 'vitest'
import { googleMapsEmbedUrl, mapPlace, placeFromGoogleLink } from './maps'

const PLACE_LINK =
  "https://www.google.com/maps/place/Schwartz's+Deli/@45.5162,-73.5803,17z/data=!3m1!4b1!4m6!3m5!1s0x4cc91a4e5b0d1b1b:0x3b4c1b1e1b1b1b1b!8m2!3d45.5161!4d-73.5776!16s%2Fg%2F1tdvlb8q?entry=ttu"

const entry = (
  fields: Partial<{ name: string; address: string; url: string }>,
) => ({
  name: fields.name ?? 'Schwartz’s',
  address: fields.address ?? null,
  url: fields.url ?? null,
})

describe('placeFromGoogleLink', () => {
  it('reads the place name and its pin from a place link', () => {
    expect(placeFromGoogleLink(PLACE_LINK)).toEqual({
      query: "Schwartz's Deli",
      near: '45.5161,-73.5776',
    })
  })

  it('falls back to the map center when the link has no pin', () => {
    expect(
      placeFromGoogleLink(
        'https://www.google.ca/maps/place/Pizzeria+Geppetto+Verdun/@45.4627,-73.5672,16z',
      ),
    ).toEqual({ query: 'Pizzeria Geppetto Verdun', near: '45.4627,-73.5672' })
  })

  it('reads searches from Maps and Google search links', () => {
    for (const link of [
      'https://www.google.com/maps/search/pizza+geppetto/@45.5,-73.6,13z',
      'https://maps.google.com/?q=pizza+geppetto',
      'https://www.google.com/maps/search/?api=1&query=pizza%20geppetto',
      'https://www.google.com/search?q=pizza+geppetto&hl=fr',
    ]) {
      expect(placeFromGoogleLink(link)?.query).toBe('pizza geppetto')
    }
  })

  it('ignores links that name no place', () => {
    for (const link of [
      'https://google.com/',
      'https://www.google.com/maps/@45.5,-73.6,13z',
      'https://maps.app.goo.gl/AbCdEf123',
      'https://example.com/maps/place/Somewhere',
    ]) {
      expect(placeFromGoogleLink(link)).toBeNull()
    }
  })

  it('keeps a name it cannot decode as written', () => {
    expect(
      placeFromGoogleLink('https://www.google.com/maps/place/100%25+%E0%A4%A')
        ?.query,
    ).toBe('100%25 %E0%A4%A')
  })
})

describe('mapPlace', () => {
  it('searches the name near the address first', () => {
    expect(
      mapPlace(entry({ address: '3895 Boul. Saint-Laurent', url: PLACE_LINK })),
    ).toEqual({
      query: 'Schwartz’s, 3895 Boul. Saint-Laurent',
      near: null,
      guessed: false,
      href: PLACE_LINK,
    })
  })

  it('uses the place a Google Maps link names', () => {
    expect(mapPlace(entry({ url: PLACE_LINK }))).toMatchObject({
      query: "Schwartz's Deli",
      near: '45.5161,-73.5776',
      guessed: false,
    })
  })

  it('guesses from the name alone, linking to a search for it', () => {
    const place = mapPlace(entry({ url: 'https://schwartzsdeli.com' }))
    expect(place).toMatchObject({ query: 'Schwartz’s', guessed: true })
    const href = new URL(place.href)
    expect(href.searchParams.get('api')).toBe('1')
    expect(href.searchParams.get('query')).toBe('Schwartz’s')
  })

  it('keeps a short Maps link for opening the place', () => {
    expect(
      mapPlace(entry({ url: 'https://maps.app.goo.gl/AbCdEf123' })),
    ).toMatchObject({
      guessed: true,
      href: 'https://maps.app.goo.gl/AbCdEf123',
    })
  })
})

describe('googleMapsEmbedUrl', () => {
  // "&" and "#" would end the query early if they were not encoded.
  const query = 'Fish & Chips #1, Montréal'

  it('embeds the search in the given language', () => {
    const url = new URL(
      googleMapsEmbedUrl({ query, near: null, guessed: false, href: '' }, 'fr'),
    )
    expect(url.searchParams.get('q')).toBe(query)
    expect(url.searchParams.get('hl')).toBe('fr')
    expect(url.searchParams.get('output')).toBe('embed')
    expect(url.searchParams.has('ll')).toBe(false)
    expect(url.hash).toBe('')
  })

  it('zooms in around a linked place', () => {
    const url = new URL(
      googleMapsEmbedUrl(
        { query, near: '45.5161,-73.5776', guessed: false, href: '' },
        'en',
      ),
    )
    expect(url.searchParams.get('ll')).toBe('45.5161,-73.5776')
    expect(url.searchParams.get('z')).toBe('17')
  })
})
