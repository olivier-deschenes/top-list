import { IconStarFilled } from '@tabler/icons-react'
import { formatRating, formatScore } from '#/lib/format'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

/**
 * A score out of 10 as one star and the number: "★ 7.5". Averages always
 * show one decimal ("8.0"); a single score shows as picked ("8", "7.5").
 */
export function StarRating({
  value,
  average = false,
  className,
}: {
  value: number
  average?: boolean
  className?: string
}) {
  const text = average ? formatRating(value) : formatScore(value)
  return (
    <span
      role="img"
      aria-label={m.score_label({ rating: text })}
      className={cn(
        'inline-flex shrink-0 items-baseline gap-1 font-medium text-foreground tabular-nums',
        className,
      )}
    >
      <IconStarFilled aria-hidden="true" className="size-3.5" />
      {text}
    </span>
  )
}
