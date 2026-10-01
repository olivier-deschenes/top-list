import { useState } from 'react'
import { IconStar, IconStarFilled } from '@tabler/icons-react'
import {
  RadioGroup as RadioGroupPrimitive,
  ToggleGroup as ToggleGroupPrimitive,
} from 'radix-ui'
import { RadioGroup } from '#/components/ui/radio-group'
import { ToggleGroup } from '#/components/ui/toggle-group'
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

/**
 * One-click vote for lists: clicking a star saves it right away. Built on
 * the shadcn toggle group, so arrow keys move between stars without
 * choosing one until Enter or Space. Hovering previews the rating.
 */
export function StarVote({
  value,
  onChange,
  className,
  ...aria
}: {
  /** The viewer's current rating, null when they haven't voted. */
  value: number | null
  onChange: (rating: number) => void
  className?: string
  'aria-label': string
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const shown = hovered ?? value ?? 0

  return (
    <ToggleGroup
      type="single"
      spacing={0}
      value={value ? String(value) : ''}
      onValueChange={(next) => {
        setHovered(null)
        // Re-clicking the chosen star reports '' (deselect); keep the vote.
        if (next) onChange(Number(next))
      }}
      onPointerLeave={() => setHovered(null)}
      className={className}
      {...aria}
    >
      {STARS.map((star) => {
        const filled = star <= shown
        return (
          <ToggleGroupPrimitive.Item
            key={star}
            value={String(star)}
            aria-label={m.star_count({ count: star })}
            onPointerEnter={(event) => {
              // A tap is not a hover; previewing would only flash the stars.
              if (event.pointerType !== 'touch') setHovered(star)
            }}
            className="flex size-7 items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {/* Both icons stay mounted and only swap visibility: replacing
                the element under the pointer mid-press would lose the click. */}
            <IconStarFilled
              aria-hidden="true"
              className={cn(
                'size-4',
                !filled && 'hidden',
                hovered === null ? 'text-foreground' : 'text-foreground/60',
              )}
            />
            <IconStar
              aria-hidden="true"
              className={cn('size-4 text-foreground/30', filled && 'hidden')}
            />
          </ToggleGroupPrimitive.Item>
        )
      })}
    </ToggleGroup>
  )
}
