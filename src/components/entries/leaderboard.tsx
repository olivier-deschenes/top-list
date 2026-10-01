import { Link } from '@tanstack/react-router'
import { rankItem } from '@tanstack/match-sorter-utils'
import type { RankingInfo } from '@tanstack/match-sorter-utils'
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createSortedRowModel,
  filterFn_arrIncludesAll,
  functionalUpdate,
  globalFilteringFeature,
  rowSortingFeature,
  sortFn_text,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import type { Row, SortingState, Updater } from '@tanstack/react-table'
import {
  IconArrowDown,
  IconArrowUp,
  IconArrowsSort,
  IconStarFilled,
} from '@tabler/icons-react'
import { StarRating, StarVote } from '#/components/star-rating'
import { Button } from '#/components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { formatRating } from '#/lib/format'
import { compareRanked } from '#/lib/ranking'
import type { RankedEntry } from '#/lib/ranking'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'
import { EntryMeta } from './entry-meta'
import { RankBadge } from './rank-badge'
import type { LeaderboardSort, SortColumn } from './leaderboard-sort'

interface ColumnMeta {
  label: () => string
  numeric?: boolean
  /** Hidden below the sm breakpoint to keep the table readable on phones. */
  wide?: boolean
}

/** Fuzzy match on an entry's text and tags; keeps the ranking for later use. */
function fuzzyFilter(
  row: Row<any, any>,
  _columnId: string,
  query: string,
  addMeta?: (meta: { itemRank: RankingInfo }) => void,
) {
  const { entry } = row.original as RankedEntry
  const itemRank = rankItem(entry, query, {
    accessors: [
      (item) => item.name,
      (item) => item.address ?? '',
      (item) => item.notes ?? '',
      (item) => item.tags.join(' '),
    ],
  })
  addMeta?.({ itemRank })
  return itemRank.passed
}

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  columnFilteringFeature,
  globalFilteringFeature,
  columnVisibilityFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { fuzzy: fuzzyFilter, arrIncludesAll: filterFn_arrIncludesAll },
  sortFns: { text: sortFn_text },
  columnMeta: {} as ColumnMeta,
  filterMeta: {} as { itemRank: RankingInfo },
})

const helper = createColumnHelper<typeof features, RankedEntry>()

const columns = helper.columns([
  helper.accessor((item) => item.rank ?? undefined, {
    id: 'rank',
    // Ascending rank is best first; reuse the leaderboard comparator.
    sortFn: (a, b) => compareRanked(a.original, b.original),
    meta: { label: () => m.col_rank(), numeric: true },
  }),
  helper.accessor((item) => item.entry.name, {
    id: 'name',
    sortFn: 'text',
    meta: { label: () => m.col_entry() },
  }),
  helper.accessor((item) => item.average ?? undefined, {
    id: 'rating',
    sortDescFirst: true,
    sortUndefined: 'last',
    meta: { label: () => m.col_rating(), numeric: true, wide: true },
  }),
  helper.accessor((item) => item.reviewCount, {
    id: 'reviews',
    sortDescFirst: true,
    meta: { label: () => m.col_reviews(), numeric: true, wide: true },
  }),
  helper.display({
    id: 'mine',
    meta: { label: () => m.col_your_rating(), numeric: true },
  }),
  helper.accessor((item) => item.entry.createdBy, {
    id: 'addedBy',
    sortFn: 'text',
    meta: { label: () => m.col_added_by(), wide: true },
  }),
  helper.accessor((item) => item.entry.tags, {
    id: 'tags',
    filterFn: 'arrIncludesAll',
    enableSorting: false,
    meta: { label: () => m.entry_tags_label() },
  }),
])

const ariaSort = (sorted: false | 'asc' | 'desc') =>
  sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'

export function Leaderboard({
  groupId,
  data,
  myRatings,
  onVote,
  query,
  tags,
  sort,
  onSortChange,
  onClearFilters,
}: {
  groupId: string
  data: Array<RankedEntry>
  /** Entry id to the viewer's own rating. */
  myRatings: Map<string, number>
  onVote: (entryId: string, rating: number) => void
  query: string
  tags: Array<string>
  sort: LeaderboardSort
  onSortChange: (sort: LeaderboardSort) => void
  onClearFilters: () => void
}) {
  const sorting: SortingState = [{ id: sort.column, desc: sort.desc }]

  const table = useTable({
    features,
    columns,
    data,
    getRowId: (item) => item.entry.id,
    initialState: { columnVisibility: { tags: false } },
    state: {
      sorting,
      globalFilter: query,
      columnFilters: tags.length > 0 ? [{ id: 'tags', value: tags }] : [],
    },
    onSortingChange: (updater: Updater<SortingState>) => {
      // Sorting removal is disabled, so there is always exactly one column.
      const next = functionalUpdate(updater, sorting).at(0)
      if (next) onSortChange({ column: next.id as SortColumn, desc: next.desc })
    },
    enableSortingRemoval: false,
    globalFilterFn: 'fuzzy',
    getColumnCanGlobalFilter: (column) => column.id === 'name',
  })

  const headers = table.getHeaderGroups()[0]?.headers ?? []
  const rows = table.getRowModel().rows

  return (
    <Table className="text-sm">
      <TableCaption className="sr-only">{m.rankings_caption()}</TableCaption>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {headers.map((header) => {
            const { column } = header
            const meta = column.columnDef.meta
            const sorted = column.getIsSorted()
            const SortIcon =
              sorted === 'asc'
                ? IconArrowUp
                : sorted === 'desc'
                  ? IconArrowDown
                  : IconArrowsSort
            return (
              <TableHead
                key={header.id}
                aria-sort={column.getCanSort() ? ariaSort(sorted) : undefined}
                className={cn(
                  'h-9 px-2 text-xs font-medium text-muted-foreground first:pl-0 last:pr-0',
                  meta?.numeric && 'text-right',
                  meta?.wide && 'hidden sm:table-cell',
                  column.id === 'rank' && 'w-12',
                  // Last visible column on phones.
                  column.id === 'mine' && 'pr-0 sm:pr-2',
                )}
              >
                {column.getCanSort() ? (
                  <button
                    type="button"
                    onClick={column.getToggleSortingHandler()}
                    className={cn(
                      'inline-flex items-center gap-1 hover:text-foreground',
                      meta?.numeric && 'flex-row-reverse',
                      sorted && 'text-foreground',
                    )}
                  >
                    {meta?.label()}
                    <SortIcon
                      aria-hidden="true"
                      className={cn('size-3', !sorted && 'opacity-40')}
                    />
                  </button>
                ) : (
                  meta?.label()
                )}
              </TableHead>
            )
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={headers.length}
              className="py-10 pl-0 text-center"
            >
              <p className="text-muted-foreground">{m.rankings_no_match()}</p>
              <Button variant="link" onClick={onClearFilters}>
                {m.clear_filters()}
              </Button>
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <LeaderboardRow
              key={row.id}
              groupId={groupId}
              item={row.original}
              myRating={myRatings.get(row.original.entry.id) ?? null}
              onVote={onVote}
            />
          ))
        )}
      </TableBody>
    </Table>
  )
}

function LeaderboardRow({
  groupId,
  item,
  myRating,
  onVote,
}: {
  groupId: string
  item: RankedEntry
  myRating: number | null
  onVote: (entryId: string, rating: number) => void
}) {
  const { entry } = item
  return (
    // Cells share the first text baseline, however many lines each wraps to.
    <TableRow>
      <TableCell className="py-3 pl-0 text-right align-baseline">
        <RankBadge rank={item.rank} />
      </TableCell>
      <TableCell className="py-3 align-baseline whitespace-normal">
        <Link
          to="/g/$groupId/entries/$entryId"
          params={{ groupId, entryId: entry.id }}
          className="font-medium text-foreground hover:underline"
        >
          {entry.name}
        </Link>
        {/* Phones hide the rating and review columns; sum them up here. */}
        <p className="mt-0.5 text-muted-foreground sm:hidden">
          {item.average === null ? (
            m.not_rated()
          ) : (
            <>
              <span className="sr-only">
                {m.stars_label({ rating: formatRating(item.average) })}
              </span>
              <span
                aria-hidden="true"
                className="inline-flex items-baseline gap-1 font-medium text-foreground tabular-nums"
              >
                <IconStarFilled className="size-3.5" />
                {formatRating(item.average)}
              </span>
              {' · '}
              {m.review_count({ count: item.reviewCount })}
            </>
          )}
        </p>
        <EntryMeta entry={entry} className="mt-0.5" />
      </TableCell>
      <TableCell className="hidden py-3 text-right align-baseline sm:table-cell">
        {item.average === null ? (
          <span className="text-muted-foreground">{m.not_rated()}</span>
        ) : (
          <span className="inline-flex items-baseline gap-2">
            <StarRating value={item.average} />
            <span className="font-medium tabular-nums">
              {formatRating(item.average)}
            </span>
          </span>
        )}
      </TableCell>
      <TableCell className="hidden py-3 text-right align-baseline tabular-nums sm:table-cell">
        {item.reviewCount}
      </TableCell>
      <TableCell className="py-2 pr-0 align-baseline sm:pr-2">
        <StarVote
          value={myRating}
          onChange={(rating) => onVote(entry.id, rating)}
          aria-label={m.your_rating_of({ name: entry.name })}
          className="ml-auto"
        />
      </TableCell>
      <TableCell className="hidden py-3 pr-0 align-baseline sm:table-cell">
        <Link
          to="/g/$groupId/members/$username"
          params={{ groupId, username: entry.createdBy }}
          className="text-muted-foreground hover:text-foreground hover:underline"
        >
          {entry.createdBy}
        </Link>
      </TableCell>
    </TableRow>
  )
}
