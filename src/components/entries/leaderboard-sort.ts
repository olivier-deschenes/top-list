// Kept apart from the leaderboard component so the route's search schema can
// import it without pulling the table code into the entry bundle.
export const SORT_COLUMNS = [
  'rank',
  'name',
  'rating',
  'reviews',
  'addedBy',
] as const
export type SortColumn = (typeof SORT_COLUMNS)[number]

export interface LeaderboardSort {
  column: SortColumn
  desc: boolean
}
