import { Fragment } from 'react'
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
          className="min-w-0 text-muted-foreground hover:text-foreground"
        >
          <BreakableHost host={linkHost(entry.url)} />
        </a>
      ) : null}
      {entry.tags.length > 0 ? <span>{entry.tags.join(', ')}</span> : null}
    </p>
  )
}

/**
 * A long host wraps before its dots rather than widening a narrow table
 * column. The last label stays with the external-link icon.
 */
function BreakableHost({ host }: { host: string }) {
  const labels = host.split('.')
  const last = labels.length - 1
  return (
    <>
      {labels.slice(0, last).map((label, index) => (
        <Fragment key={index}>
          {index > 0 ? '.' : null}
          {label}
          <wbr />
        </Fragment>
      ))}
      <span className="whitespace-nowrap">
        {last > 0 ? '.' : null}
        {labels[last]}
        <IconExternalLink
          aria-hidden="true"
          className="ml-0.5 inline size-3 align-[-0.125em]"
        />
      </span>
    </>
  )
}
