import { IconExternalLink, IconMapPinPlus } from '@tabler/icons-react'
import { Section } from '#/components/page'
import { Button } from '#/components/ui/button'
import { googleMapsEmbedUrl, mapPlace } from '#/lib/maps'
import type { Entry } from '#/lib/types'
import { m } from '#/paraglide/messages'
import { getLocale } from '#/paraglide/runtime'

/**
 * Where an entry is: Google's map and place card, and a link to the place's
 * full page in Google Maps. Found by address, then by a pasted Google Maps
 * link, then by name alone, in which case it asks for an address.
 */
export function EntryLocation({
  entry,
  onAddAddress,
}: {
  entry: Entry
  onAddAddress: () => void
}) {
  const place = mapPlace(entry)
  return (
    <Section
      id="location"
      title={m.entry_location_title()}
      description={
        entry.address ?? (place.guessed ? m.entry_location_guessed() : null)
      }
      actions={
        <>
          {place.guessed ? (
            <Button variant="outline" size="lg" onClick={onAddAddress}>
              <IconMapPinPlus data-icon="inline-start" aria-hidden="true" />
              {m.entry_add_address()}
            </Button>
          ) : null}
          <Button asChild variant="outline" size="lg">
            <a href={place.href} target="_blank" rel="noopener noreferrer">
              {m.entry_open_in_maps()}
              <IconExternalLink data-icon="inline-end" aria-hidden="true" />
            </a>
          </Button>
        </>
      }
    >
      {/* Loads when scrolled to. Google gets only our origin, never the
          page path: a group's link is its only key. */}
      <iframe
        title={m.entry_map_title({ name: entry.name })}
        src={googleMapsEmbedUrl(place, getLocale())}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="block aspect-4/3 w-full border bg-muted sm:aspect-21/9"
      />
    </Section>
  )
}
