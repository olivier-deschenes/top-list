import { useRef, useState } from 'react'
import type { Ref } from 'react'
import { IconMinus, IconPlus, IconSelector } from '@tabler/icons-react'
import { Button } from '#/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { Slider } from '#/components/ui/slider'
import { formatScore } from '#/lib/format'
import { RATING } from '#/lib/schemas'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

/** Whole points labelled under the track: 1 … 10. */
const TICKS = Array.from(
  { length: RATING.max - RATING.min + 1 },
  (_, index) => RATING.min + index,
)

/** Where the thumb rests before anything is picked: the middle of the scale. */
const RESTING = (RATING.min + RATING.max) / 2

const clamp = (value: number) =>
  Math.min(RATING.max, Math.max(RATING.min, value))

const valueText = (value: number | null) =>
  value === null ? m.not_rated() : m.score_label({ rating: formatScore(value) })

/**
 * Score from 1 to 10 in half points: a slider for the rough pick, −/+ for
 * the exact half point, and a large readout of the result. Arrow keys move
 * half a point, Page Up/Down a point and a half, Home/End jump to the ends.
 *
 * With no score yet the thumb rests mid-scale and the readout shows a dash;
 * any drag, tap, key or step picks one. `onValueChange` reports every move,
 * `onValueCommit` only settled ones (release, key press, step).
 */
export function ScoreSlider({
  value,
  onValueChange,
  onValueCommit,
  onBlur,
  name,
  invalid,
  thumbRef,
  className,
  ...aria
}: {
  value: number | null
  onValueChange: (value: number) => void
  onValueCommit?: (value: number) => void
  onBlur?: () => void
  name?: string
  invalid?: boolean
  thumbRef?: Ref<HTMLSpanElement>
  className?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
}) {
  const unset = value === null

  function pick(next: number) {
    onValueChange(next)
    onValueCommit?.(next)
  }

  const step = (direction: 1 | -1) =>
    pick(clamp((value ?? RESTING) + direction * RATING.step))

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <output
            aria-hidden="true"
            className={cn(
              'text-3xl font-semibold tracking-tight tabular-nums',
              unset && 'text-muted-foreground',
            )}
          >
            {unset ? '–' : formatScore(value)}
          </output>
          <span className="text-sm text-muted-foreground">/10</span>
        </div>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={m.score_lower()}
            disabled={value === RATING.min}
            onClick={() => step(-1)}
          >
            <IconMinus aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={m.score_raise()}
            disabled={value === RATING.max}
            onClick={() => step(1)}
          >
            <IconPlus aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div>
        <Slider
          name={name}
          min={RATING.min}
          max={RATING.max}
          step={RATING.step}
          value={[value ?? RESTING]}
          onValueChange={([next]) => onValueChange(next)}
          onValueCommit={([next]) => onValueCommit?.(next)}
          // A tap on the resting value changes nothing, so pick it here.
          onPointerUp={() => {
            if (unset) pick(RESTING)
          }}
          className={cn(
            'py-2 **:data-[slot=slider-track]:h-1.5',
            unset && '**:data-[slot=slider-range]:hidden',
          )}
          thumbProps={{
            ref: thumbRef,
            onBlur,
            'aria-valuetext': valueText(value),
            'aria-invalid': invalid || undefined,
            ...aria,
            className: cn(
              'size-5 bg-background',
              unset && 'border-dashed border-muted-foreground',
              invalid && 'border-destructive',
            ),
          }}
        />
        {/* Inset by half a thumb so each label sits under its thumb stop. */}
        <div aria-hidden="true" className="relative mx-2.5 h-4">
          {TICKS.map((tick) => (
            <span
              key={tick}
              className={cn(
                'absolute top-0 -translate-x-1/2 text-xs text-muted-foreground tabular-nums',
                value !== null &&
                  Math.floor(value) === tick &&
                  'font-medium text-foreground',
              )}
              style={{
                left: `${((tick - RATING.min) / (RATING.max - RATING.min)) * 100}%`,
              }}
            >
              {tick}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Compact score for table rows: a button showing the score that opens the
 * slider in a popover. The score is reported once, when the popover closes
 * (click away, Escape or Enter): reporting each move would re-rank the rows
 * and move the popover under the pointer.
 */
export function ScorePicker({
  value,
  onChange,
  label,
  placeholder,
  className,
}: {
  value: number | null
  onChange: (value: number) => void
  /** Accessible name, e.g. "Your rating of Pizza Nova". */
  label: string
  placeholder: string
  className?: string
}) {
  const thumbRef = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)
  // The score picked while open, reported on close.
  const [draft, setDraft] = useState<number | null>(null)
  const shown = draft ?? value

  function changeOpen(next: boolean) {
    if (!next && draft !== null && draft !== value) onChange(draft)
    setDraft(null)
    setOpen(next)
  }

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            'w-20 justify-between font-normal tabular-nums',
            shown === null && 'text-muted-foreground',
            className,
          )}
        >
          <span>
            <span className="sr-only">{label}: </span>
            {shown === null ? placeholder : formatScore(shown)}
          </span>
          <IconSelector aria-hidden="true" className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        aria-label={label}
        className="w-72 p-4"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          thumbRef.current?.focus()
        }}
        // Enter on the slider means done; on −/+ it still presses the button.
        onKeyDown={(event) => {
          if (event.key === 'Enter' && event.target === thumbRef.current) {
            event.preventDefault()
            changeOpen(false)
          }
        }}
      >
        <ScoreSlider
          value={shown}
          onValueChange={setDraft}
          thumbRef={thumbRef}
          aria-label={label}
        />
      </PopoverContent>
    </Popover>
  )
}
