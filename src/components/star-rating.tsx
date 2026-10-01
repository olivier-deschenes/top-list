import { IconStar, IconStarFilled } from '@tabler/icons-react'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { RadioGroup } from '#/components/ui/radio-group'
import { formatRating } from '#/lib/format'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

const STARS = [1, 2, 3, 4, 5] as const

const sizes = {
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-6',
} as const

/** Read-only stars with fractional fill. Monochrome: filled vs outline. */
export function StarRating({
  value,
  size = 'sm',
  className,
}: {
  value: number
  size?: keyof typeof sizes
  className?: string
}) {
  return (
    <span
      role="img"
      aria-label={m.stars_label({ rating: formatRating(value) })}
      className={cn('inline-flex shrink-0 items-center', className)}
    >
      {STARS.map((star) => {
        const fill = Math.max(0, Math.min(1, value - (star - 1)))
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

/**
 * Star picker built on the shadcn radio group: arrow keys move between
 * stars and each option is announced as "3 stars".
 */
export function StarRatingInput({
  value,
  onChange,
  onBlur,
  name,
  invalid,
  className,
  ...aria
}: {
  value: number | null
  onChange: (value: number) => void
  onBlur?: () => void
  name?: string
  invalid?: boolean
  className?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
}) {
  return (
    <RadioGroup
      name={name}
      value={value ? String(value) : ''}
      onValueChange={(next) => onChange(Number(next))}
      onBlur={onBlur}
      orientation="horizontal"
      aria-invalid={invalid || undefined}
      className={cn('flex w-fit gap-0', className)}
      {...aria}
    >
      {STARS.map((star) => {
        const filled = value !== null && star <= value
        return (
          <RadioGroupPrimitive.Item
            key={star}
            value={String(star)}
            aria-label={m.star_count({ count: star })}
            className="group/star -m-0.5 flex size-9 items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {filled ? (
              <IconStarFilled
                aria-hidden="true"
                className="size-6 text-foreground"
              />
            ) : (
              <IconStar
                aria-hidden="true"
                className="size-6 text-foreground/40 group-hover/star:text-foreground"
              />
            )}
          </RadioGroupPrimitive.Item>
        )
      })}
    </RadioGroup>
  )
}
