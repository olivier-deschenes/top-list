import { IconStar, IconStarFilled } from '@tabler/icons-react'
import { formatRating } from '#/lib/format'
import { RATING } from '#/lib/schemas'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

const STARS = [1, 2, 3, 4, 5] as const

const sizes = {
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-6',
} as const

/**
 * Read-only stars with fractional fill: five stars for a score out of 10.
 * Monochrome: filled vs outline.
 */
export function StarRating({
  value,
  size = 'sm',
  className,
}: {
  value: number
  size?: keyof typeof sizes
  className?: string
}) {
  const stars = (value / RATING.max) * STARS.length
  return (
    <span
      role="img"
      aria-label={m.score_label({ rating: formatRating(value) })}
      className={cn('inline-flex shrink-0 items-center', className)}
    >
      {STARS.map((star) => {
        const fill = Math.max(0, Math.min(1, stars - (star - 1)))
        return (
          <span key={star} className={cn('relative', sizes[size])}>
            <IconStar
              aria-hidden="true"
              className={cn('absolute inset-0 text-foreground/25', sizes[size])}
            />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <IconStarFilled
                aria-hidden="true"
                className={cn('text-foreground', sizes[size])}
              />
            </span>
          </span>
        )
      })}
    </span>
  )
}
