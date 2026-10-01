import { IconExternalLink } from '@tabler/icons-react'
import { Section } from '#/components/page'
import { Button } from '#/components/ui/button'
import { googleMapsEmbedUrl, googleMapsUrl, placeQuery } from '#/lib/maps'
import { m } from '#/paraglide/messages'
import { getLocale } from '#/paraglide/runtime'

/**
 * Where an entry is: Google's map and place card for its name near its
 * address, and a link to the place's full page in Google Maps.
 */
export function EntryLocation({
  name,
  address,
}: {
  name: string
  address: string
}) {
  const query = placeQuery(name, address)
  return (
    <Section
      id="location"
      title={m.entry_location_title()}
      description={address}
      actions={
        <Button asChild variant="outline" size="lg">
          <a
            href={googleMapsUrl(query)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {m.entry_open_in_maps()}
            <IconExternalLink data-icon="inline-end" aria-hidden="true" />
          </a>
        </Button>
      }
    >
      {/* Loads when scrolled to. Google gets only our origin, never the
          page path: a group's link is its only key. */}
      <iframe
        title={m.entry_map_title({ name })}
        src={googleMapsEmbedUrl(query, getLocale())}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="block aspect-4/3 w-full border bg-muted sm:aspect-21/9"
      />
    </Section>
  )
}
