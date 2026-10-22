import { formatPercent, formatScore } from '#/lib/format'
import type { RankedEntry } from '#/lib/ranking'
import { m } from '#/paraglide/messages'

/**
 * Reviews per whole point, best first; half points count with the point
 * below. Every bar shares one scale (share of all reviews, zero baseline)
 * and carries its count as text.
 */
export function RatingDistribution({
  distribution,
  total,
}: {
  distribution: RankedEntry['distribution']
  total: number
}) {
  const rows = distribution
    .map((count, index) => ({
      point: index + 1,
      count,
      share: total > 0 ? count / total : 0,
    }))
    .reverse()

  return (
    <table className="w-full text-sm">
      <caption className="sr-only">{m.distribution_caption()}</caption>
      <tbody>
        {rows.map((row) => (
          <tr key={row.point}>
            <th
              scope="row"
              className="w-8 py-1 pr-3 text-right font-normal whitespace-nowrap text-muted-foreground tabular-nums"
            >
              {formatScore(row.point)}
            </th>
            <td className="w-full py-1">
              <div className="h-2 w-full bg-muted" aria-hidden="true">
                <div
                  className="h-full bg-foreground"
                  style={{ width: `${row.share * 100}%` }}
                />
              </div>
              <span className="sr-only">{formatPercent(row.share)}</span>
            </td>
            <td className="w-8 py-1 pl-3 text-right tabular-nums">
              {row.count}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
