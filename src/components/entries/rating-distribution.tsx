import { formatPercent } from '#/lib/format'
import type { RankedEntry } from '#/lib/ranking'
import { m } from '#/paraglide/messages'

/**
 * Reviews per star rating. Every bar shares one scale (share of all
 * reviews, zero baseline) and carries its count as text.
 */
export function RatingDistribution({
  distribution,
  total,
}: {
  distribution: RankedEntry['distribution']
  total: number
}) {
  const rows = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: distribution[stars - 1],
    share: total > 0 ? distribution[stars - 1] / total : 0,
  }))

  return (
    <table className="w-full text-sm">
      <caption className="sr-only">{m.distribution_caption()}</caption>
      <tbody>
        {rows.map((row) => (
          <tr key={row.stars}>
            <th
              scope="row"
              className="w-20 py-1 pr-3 text-left font-normal whitespace-nowrap text-muted-foreground"
            >
              {m.star_count({ count: row.stars })}
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
