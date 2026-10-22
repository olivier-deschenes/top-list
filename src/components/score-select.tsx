import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { formatScore } from '#/lib/format'
import { RATING } from '#/lib/schemas'
import { cn } from '#/lib/utils'

/** Every score that can be picked, best first: 10, 9.5, … 1. */
const SCORES = Array.from(
  { length: (RATING.max - RATING.min) / RATING.step + 1 },
  (_, index) => RATING.max - index * RATING.step,
)

/**
 * Score picker built on the shadcn select. The list opens on the current
 * score, and arrow keys or typing a number move through the half points.
 * Picking the score already chosen reports nothing.
 */
export function ScoreSelect({
  value,
  onChange,
  onBlur,
  placeholder,
  size,
  name,
  invalid,
  className,
  ...aria
}: {
  /** Null shows the placeholder (no score picked yet). */
  value: number | null
  onChange: (value: number) => void
  onBlur?: () => void
  placeholder: string
  size?: 'sm' | 'default'
  name?: string
  invalid?: boolean
  className?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
}) {
  return (
    <Select
      name={name}
      value={value ? String(value) : ''}
      onValueChange={(next) => onChange(Number(next))}
    >
      <SelectTrigger
        size={size}
        onBlur={onBlur}
        aria-invalid={invalid || undefined}
        className={cn('tabular-nums', className)}
        {...aria}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="min-w-20">
        {SCORES.map((score) => (
          <SelectItem
            key={score}
            value={String(score)}
            className="tabular-nums"
          >
            {formatScore(score)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
