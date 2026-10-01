import { useHydrated } from '@tanstack/react-router'
import { formatDate, formatDateTime, formatRelative } from '#/lib/format'

/**
 * A <time> showing "3 hours ago". Before hydration it renders the date in
 * UTC, which the server (a Worker in UTC) and the browser agree on.
 */
export function RelativeTime({
  timestamp,
  className,
}: {
  timestamp: number
  className?: string
}) {
  const hydrated = useHydrated()
  return (
    <time
      dateTime={new Date(timestamp).toISOString()}
      title={hydrated ? formatDateTime(timestamp) : undefined}
      className={className}
    >
      {hydrated ? formatRelative(timestamp) : formatDate(timestamp, 'UTC')}
    </time>
  )
}

/** A calendar date in the viewer's time zone (UTC until hydrated). */
export function LocalDate({
  timestamp,
  className,
}: {
  timestamp: number
  className?: string
}) {
  const hydrated = useHydrated()
  return (
    <time dateTime={new Date(timestamp).toISOString()} className={className}>
      {formatDate(timestamp, hydrated ? undefined : 'UTC')}
    </time>
  )
}
