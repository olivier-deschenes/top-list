import { Link } from '@tanstack/react-router'
import { StarRating, StarVote } from '#/components/star-rating'
import { formatRating } from '#/lib/format'
import type { RankedEntry } from '#/lib/ranking'
import { m } from '#/paraglide/messages'
import { EntryMeta } from './entry-meta'
import { RankBadge } from './rank-badge'

/**
 * The best entries side by side, with the viewer's own vote on each.
 * Pass rated entries only (at most three), best first.
 */
export function TopThree({
  groupId,
  items,
  myRatings,
  onVote,
}: {
  groupId: string
  items: Array<RankedEntry>
  /** Entry id to the viewer's own rating. */
  myRatings: Map<string, number>
  onVote: (entryId: string, rating: number) => void
}) {
  return (
    <section aria-label={m.top_three_label()} className="border bg-border">
      <ol className="grid gap-px sm:grid-flow-col sm:auto-cols-fr">
        {items.map((item) => {
          const { entry } = item
          return (
            <li
              key={entry.id}
              className="flex flex-col gap-4 bg-background p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="inline-flex">
                  <span className="sr-only">{m.col_rank()} </span>
                  <RankBadge rank={item.rank} size="lg" />
                </span>
                {item.average !== null ? (
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-3xl leading-none font-semibold tracking-tight tabular-nums">
                      {formatRating(item.average)}
                    </span>
                    <StarRating value={item.average} />
                  </div>
                ) : null}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <Link
                  to="/g/$groupId/entries/$entryId"
                  params={{ groupId, entryId: entry.id }}
                  className="block text-base leading-snug font-medium text-balance text-foreground hover:underline"
                >
                  {entry.name}
                </Link>
                <EntryMeta entry={entry} />
                <p className="text-xs text-muted-foreground">
                  {m.review_count({ count: item.reviewCount })}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 border-t pt-3">
                <span className="text-xs text-muted-foreground">
                  {m.your_rating()}
                </span>
                <StarVote
                  value={myRatings.get(entry.id) ?? null}
                  onChange={(rating) => onVote(entry.id, rating)}
                  aria-label={m.your_rating_of({ name: entry.name })}
                  className="-mr-1.5"
                />
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
