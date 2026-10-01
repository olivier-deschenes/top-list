import type { Entry, Member, Review } from './types'

/**
 * Weighted (Bayesian) rating: every entry starts as if it had PRIOR_WEIGHT
 * reviews of PRIOR_RATING, so one 5-star review can't outrank many 4.8s.
 * The prior is fixed (not the group mean) so an entry's score only moves
 * when its own reviews change.
 */
export const PRIOR_WEIGHT = 2
export const PRIOR_RATING = 3

export interface RankedEntry {
  entry: Entry
  /** 1-based; ties share a rank. Null when the entry has no reviews. */
  rank: number | null
  reviewCount: number
  average: number | null
  /** Bayesian average used for ordering. Null when unrated. */
  score: number | null
  /** Review counts for 1 to 5 stars, index 0 = 1 star. */
  distribution: [number, number, number, number, number]
}

export interface Rankings {
  entries: Array<RankedEntry>
  ratedCount: number
}

export function groupReviewsByEntry(reviews: ReadonlyArray<Review>) {
  const byEntry = new Map<string, Array<Review>>()
  for (const review of reviews) {
    const list = byEntry.get(review.entryId)
    if (list) list.push(review)
    else byEntry.set(review.entryId, [review])
  }
  return byEntry
}

export function rankEntries(
  entries: ReadonlyArray<Entry>,
  reviews: ReadonlyArray<Review>,
): Rankings {
  const byEntry = groupReviewsByEntry(reviews)

  const scored = entries.map((entry): RankedEntry => {
    const entryReviews = byEntry.get(entry.id) ?? []
    const distribution: RankedEntry['distribution'] = [0, 0, 0, 0, 0]
    let sum = 0
    for (const review of entryReviews) {
      sum += review.rating
      distribution[review.rating - 1] += 1
    }
    const reviewCount = entryReviews.length
    return {
      entry,
      rank: null,
      reviewCount,
      average: reviewCount > 0 ? sum / reviewCount : null,
      score:
        reviewCount > 0
          ? (PRIOR_WEIGHT * PRIOR_RATING + sum) / (PRIOR_WEIGHT + reviewCount)
          : null,
      distribution,
    }
  })

  scored.sort(compareRanked)

  // Competition ranking ("1, 2, 2, 4"): equal score and review count tie.
  let previous: RankedEntry | undefined
  scored.forEach((item, index) => {
    if (item.score === null) return
    const tied =
      previous &&
      previous.score !== null &&
      nearlyEqual(previous.score, item.score) &&
      previous.reviewCount === item.reviewCount
    item.rank = tied && previous ? previous.rank : index + 1
    previous = item
  })

  return {
    entries: scored,
    ratedCount: scored.filter((item) => item.score !== null).length,
  }
}

function nearlyEqual(a: number, b: number) {
  return Math.abs(a - b) < 1e-9
}

/** Best first: score, then review count, then name. Unrated entries last. */
export function compareRanked(a: RankedEntry, b: RankedEntry) {
  if (a.score === null || b.score === null) {
    if (a.score !== b.score) return a.score === null ? 1 : -1
  } else if (!nearlyEqual(a.score, b.score)) {
    return b.score - a.score
  }
  if (a.reviewCount !== b.reviewCount) return b.reviewCount - a.reviewCount
  return a.entry.name.localeCompare(b.entry.name, undefined, {
    sensitivity: 'base',
  })
}

export interface MemberStats {
  member: Member
  reviewCount: number
  entriesAdded: number
  /** Mean rating this member gave, null when they have no reviews. */
  averageGiven: number | null
}

/**
 * Usernames match like SQLite's NOCASE collation: only ASCII letters fold,
 * so "Alex" equals "alex" but "Élise" and "élise" stay distinct.
 */
export function isSameUser(a: string, b: string) {
  return asciiLower(a) === asciiLower(b)
}

const asciiLower = (value: string) =>
  value.replace(/[A-Z]/g, (char) => char.toLowerCase())

export function memberStats(
  members: ReadonlyArray<Member>,
  entries: ReadonlyArray<Entry>,
  reviews: ReadonlyArray<Review>,
): Array<MemberStats> {
  return members.map((member) => {
    const given = reviews.filter((review) =>
      isSameUser(review.username, member.username),
    )
    return {
      member,
      reviewCount: given.length,
      entriesAdded: entries.filter((entry) =>
        isSameUser(entry.createdBy, member.username),
      ).length,
      averageGiven:
        given.length > 0
          ? given.reduce((sum, review) => sum + review.rating, 0) / given.length
          : null,
    }
  })
}

/** Every tag used in the group, most used first, spelled as first used. */
export function collectTags(entries: ReadonlyArray<Entry>): Array<string> {
  const counts = new Map<string, { tag: string; count: number }>()
  for (const entry of entries) {
    for (const tag of entry.tags) {
      const key = tag.toLocaleLowerCase()
      const found = counts.get(key)
      if (found) found.count += 1
      else counts.set(key, { tag, count: 1 })
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .map(({ tag }) => tag)
}
