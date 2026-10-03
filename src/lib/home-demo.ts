import { rankEntries } from './ranking'
import type { Rankings } from './ranking'
import type { Entry, Review } from './types'

export type DemoScenario = 'coffee' | 'movies' | 'weekends'

export const DEMO_SCENARIOS = ['coffee', 'movies', 'weekends'] as const

const examples: Record<
  DemoScenario,
  ReadonlyArray<readonly [string, string]>
> = {
  coffee: [
    ['coffee-daybreak', 'Daybreak'],
    ['coffee-juniper', 'Juniper'],
    ['coffee-sunday-club', 'Sunday Club'],
  ],
  movies: [
    ['movies-interstellar', 'Interstellar'],
    ['movies-spirited-away', 'Spirited Away'],
    ['movies-knives-out', 'Knives Out'],
  ],
  weekends: [
    ['weekends-quebec-city', 'Québec City'],
    ['weekends-charlevoix', 'Charlevoix'],
    ['weekends-mont-tremblant', 'Mont-Tremblant'],
  ],
}

const members = ['Alex', 'Sam', 'Jo'] as const
// Close scores make a single visitor vote visibly affect the order.
const baselineRatings = [
  [5, 4, 4],
  [4, 4, 4],
  [4, 4, 3],
] as const

export function getDemoEntries(scenario: DemoScenario): Array<Entry> {
  return examples[scenario].map(([id, name], index) => ({
    id,
    name,
    address: null,
    notes: null,
    url: null,
    tags: [],
    createdBy: members[index],
    updatedBy: null,
    createdAt: 0,
    updatedAt: 0,
  }))
}

const review = (entryId: string, username: string, rating: number): Review => ({
  entryId,
  username,
  rating,
  comment: null,
  createdAt: 0,
  updatedAt: 0,
})

export function getDemoRankings(
  scenario: DemoScenario,
  ratings: Readonly<Record<string, number>>,
): Rankings {
  const entries = getDemoEntries(scenario)
  const reviews = entries.flatMap((entry, index) => {
    const given = members.map((username, memberIndex) =>
      review(entry.id, username, baselineRatings[index][memberIndex]),
    )
    if (Object.hasOwn(ratings, entry.id)) {
      given.push(review(entry.id, 'Visitor', ratings[entry.id]))
    }
    return given
  })
  return rankEntries(entries, reviews)
}
