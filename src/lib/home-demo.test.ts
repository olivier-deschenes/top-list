import { describe, expect, it } from 'vitest'
import { DEMO_SCENARIOS, getDemoEntries, getDemoRankings } from './home-demo'

describe('getDemoRankings', () => {
  it.each(DEMO_SCENARIOS)(
    'lets a visitor change the leading entry in %s',
    (scenario) => {
      const baseline = getDemoRankings(scenario, {})
      const challenger = baseline.entries[1].entry.id
      const voted = getDemoRankings(scenario, { [challenger]: 5 })

      expect(voted.entries[0].entry.id).toBe(challenger)
      expect(voted.entries[0].rank).toBe(1)
      expect(baseline.entries[0].entry.id).not.toBe(challenger)
    },
  )

  it('replaces the visitor rating instead of adding another review', () => {
    const id = 'coffee-juniper'
    const ratings = { [id]: 5 }
    const first = getDemoRankings('coffee', ratings).entries.find(
      (item) => item.entry.id === id,
    )!
    ratings[id] = 1
    const changed = getDemoRankings('coffee', ratings).entries.find(
      (item) => item.entry.id === id,
    )!

    expect(first.reviewCount).toBe(4)
    expect(changed.reviewCount).toBe(4)
    expect(changed.average).toBeCloseTo(13 / 4)
    expect(changed.distribution).toEqual([1, 0, 0, 3, 0])
    expect(changed.rank).toBe(3)
  })

  it('ignores ratings from a different scenario', () => {
    expect(getDemoRankings('movies', { 'coffee-juniper': 5 })).toEqual(
      getDemoRankings('movies', {}),
    )
  })

  it('returns to the baseline when visitor ratings are reset', () => {
    const baseline = getDemoRankings('weekends', {})
    const voted = getDemoRankings('weekends', { 'weekends-charlevoix': 5 })

    expect(voted).not.toEqual(baseline)
    expect(getDemoRankings('weekends', {})).toEqual(baseline)
    expect(baseline.entries.every((item) => item.reviewCount === 3)).toBe(true)
  })

  it('provides three stable, distinct entries for each scenario', () => {
    const entries = DEMO_SCENARIOS.flatMap(getDemoEntries)

    expect(entries).toHaveLength(9)
    expect(new Set(entries.map((item) => item.id)).size).toBe(9)
    expect(getDemoEntries('coffee').map((item) => item.name)).toEqual([
      'Daybreak',
      'Juniper',
      'Sunday Club',
    ])
  })
})
