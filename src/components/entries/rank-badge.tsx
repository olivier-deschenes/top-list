import { cn } from '#/lib/utils'

/**
 * Position in the ranking. The top three stand out: first place is a solid
 * square, second and third are outlined, everything else is a plain number.
 */
export function RankBadge({
  rank,
  size = 'sm',
  className,
}: {
  rank: number | null
  size?: 'sm' | 'lg'
  className?: string
}) {
  if (rank === null) return null
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-semibold tabular-nums',
        size === 'sm' ? 'size-6 text-xs' : 'size-10 text-lg',
        rank === 1 && 'bg-foreground text-background',
        (rank === 2 || rank === 3) &&
          'border border-foreground text-foreground',
        className,
      )}
    >
      {rank}
    </span>
  )
}
