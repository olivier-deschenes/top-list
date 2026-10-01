import { Link } from '@tanstack/react-router'
import { Section } from '#/components/page'
import { StarRating } from '#/components/star-rating'
import { formatRating } from '#/lib/format'
import type { RankedEntry } from '#/lib/ranking'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'
import { EntryMeta } from './entry-meta'
import { RankBadge } from './rank-badge'

/**
 * The best rated entries, with first place given the most room. Voting
 * stays in the full list below so each entry has one place to rate it.
 * Pass one to three rated entries, best first.
 */
export function TopThree({
  groupId,
  items,
}: {
  groupId: string
  items: Array<RankedEntry>
}) {
  const [leader, ...runnersUp] = items
  return (
    <Section id="top-rated" title={m.top_rated_title()}>
      <ol
        className={cn(
          'grid gap-px border bg-border',
          // Three: first place beside the other two. Fewer: stacked rows,
          // so no cell is left half empty.
          runnersUp.length === 2 && 'sm:grid-cols-[3fr_2fr]',
        )}
      >
        <li
          className={cn(
            'flex flex-col justify-between gap-8 bg-background p-5 sm:p-6',
            runnersUp.length === 2
              ? 'sm:row-span-2'
              : 'sm:flex-row sm:items-end',
          )}
        >
          <div className="min-w-0 space-y-3">
            <Rank item={leader} size="lg" />
            <div className="space-y-1">
              <EntryLink
                groupId={groupId}
                item={leader}
                className="text-xl leading-tight font-semibold tracking-tight"
              />
              <EntryMeta entry={leader.entry} />
            </div>
          </div>
          <Score item={leader} lead />
        </li>
        {runnersUp.map((item) => (
          <li
            key={item.entry.id}
            className="flex items-start justify-between gap-4 bg-background p-4 sm:p-5"
          >
            <div className="flex min-w-0 items-start gap-3">
              <Rank item={item} size="sm" />
              <div className="min-w-0 space-y-1">
                <EntryLink
                  groupId={groupId}
                  item={item}
                  className="text-base leading-6 font-medium"
                />
                <EntryMeta entry={item.entry} />
              </div>
            </div>
            <Score item={item} />
          </li>
        ))}
      </ol>
    </Section>
  )
}

function Rank({ item, size }: { item: RankedEntry; size: 'sm' | 'lg' }) {
  return (
    <span className="inline-flex shrink-0">
      <span className="sr-only">{m.col_rank()} </span>
      <RankBadge rank={item.rank} size={size} />
    </span>
  )
}

function EntryLink({
  groupId,
  item,
  className,
}: {
  groupId: string
  item: RankedEntry
  className: string
}) {
  return (
    <Link
      to="/g/$groupId/entries/$entryId"
      params={{ groupId, entryId: item.entry.id }}
      className={cn(
        'block text-balance text-foreground hover:underline',
        className,
      )}
    >
      {item.entry.name}
    </Link>
  )
}

/** The average with the number of reviews it is based on, kept together. */
function Score({ item, lead = false }: { item: RankedEntry; lead?: boolean }) {
  if (item.average === null) return null
  return (
    <div
      className={cn(
        'flex shrink-0 flex-col gap-1.5',
        !lead && 'items-end text-right',
      )}
    >
      <div
        className={cn(
          'flex',
          lead ? 'items-center gap-3' : 'flex-col items-end gap-1.5',
        )}
      >
        <span
          className={cn(
            'leading-none font-semibold tracking-tight tabular-nums',
            lead ? 'text-4xl' : 'text-2xl',
          )}
        >
          {formatRating(item.average)}
        </span>
        <StarRating value={item.average} size={lead ? 'md' : 'sm'} />
      </div>
      <p className="text-sm text-muted-foreground tabular-nums">
        {m.review_count({ count: item.reviewCount })}
      </p>
    </div>
  )
}
