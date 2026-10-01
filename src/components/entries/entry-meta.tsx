import { IconExternalLink } from '@tabler/icons-react'
import { linkHost } from '#/lib/format'
import type { Entry } from '#/lib/types'
import { cn } from '#/lib/utils'

/** The entry's link host and tags on one muted line; nothing when it has neither. */
export function EntryMeta({
  entry,
  className,
}: {
  entry: Entry
  className?: string
}) {
  if (!entry.url && entry.tags.length === 0) return null
  return (
    <p
      className={cn(
        'flex flex-wrap gap-x-2 text-xs text-muted-foreground',
        className,
      )}
    >
      {entry.url ? (
        <a
          href={entry.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground"
        >
          {linkHost(entry.url)}
          <IconExternalLink aria-hidden="true" className="size-3" />
        </a>
      ) : null}
      {entry.tags.length > 0 ? <span>{entry.tags.join(', ')}</span> : null}
    </p>
  )
}
