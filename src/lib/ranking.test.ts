import { describe, expect, it } from 'vitest'
import { isSameUser, memberStats, rankEntries } from './ranking'
import type { Entry, Member, Review } from './types'

const entry = (id: string, name = id, createdBy = 'alex'): Entry => ({
  id,
  name,
  notes: null,
  url: null,
  tags: [],
  createdBy,
  updatedBy: null,
  createdAt: 0,
  updatedAt: 0,
})

const review = (entryId: string, username: string, rating: number): Review => ({
  entryId,
  username,
  rating,
  comment: null,
  createdAt: 0,
  updatedAt: 0,
})

const member = (username: string): Member => ({
  username,
  joinedAt: 0,
  lastActiveAt: 0,
})

describe('rankEntries', () => {
  it('puts unrated entries last with no rank', () => {
    const { entries } = rankEntries(
      [entry('a'), entry('b')],
      [review('b', 'alex', 2)],
    )
    expect(entries.map((item) => item.entry.id)).toEqual(['b', 'a'])
    expect(entries[1]).toMatchObject({ rank: null, score: null, average: null })
  })

  it('does not let one 5-star review beat many high reviews', () => {
    const many = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].map((u) =>
      review('steady', u, u === 'j' ? 4 : 5),
    )
    const { entries } = rankEntries(
      [entry('lucky'), entry('steady')],
      [review('lucky', 'alex', 5), ...many],
    )
    expect(entries[0].entry.id).toBe('steady')
    expect(entries[0].average).toBeCloseTo(4.9)
    expect(entries[1].average).toBe(5)
  })

  it('weights scores toward two neutral 3-star reviews', () => {
    const { entries } = rankEntries(
      [entry('x'), entry('y')],
      [review('x', 'alex', 5), review('y', 'alex', 3), review('y', 'sam', 4)],
    )
    expect(entries[0].score).toBeCloseTo((2 * 3 + 5) / 3)
    expect(entries[1].score).toBeCloseTo((2 * 3 + 7) / 4)
  })

  it("keeps an entry's score stable when other entries get reviews", () => {
    const before = rankEntries([entry('a'), entry('b')], [review('a', 'u', 4)])
    const after = rankEntries(
      [entry('a'), entry('b')],
      [review('a', 'u', 4), review('b', 'u', 1), review('b', 'v', 1)],
    )
    const score = (r: typeof before) =>
      r.entries.find((item) => item.entry.id === 'a')?.score
    expect(score(after)).toBe(score(before))
  })

  it('shares ranks on ties and skips the next rank', () => {
    const { entries } = rankEntries(
      [entry('a'), entry('b'), entry('c')],
      [review('a', 'alex', 4), review('b', 'alex', 4), review('c', 'alex', 2)],
    )
    expect(entries.map((item) => item.rank)).toEqual([1, 1, 3])
  })

  it('breaks equal scores by review count, then name', () => {
    const { entries } = rankEntries(
      [entry('b', 'Banh mi'), entry('a', 'Arepas')],
      [review('a', 'alex', 4), review('b', 'alex', 4)],
    )
    expect(entries.map((item) => item.entry.name)).toEqual([
      'Arepas',
      'Banh mi',
    ])
  })

  it('builds the 1 to 5 star distribution', () => {
    const { entries } = rankEntries(
      [entry('a')],
      [review('a', 'u1', 5), review('a', 'u2', 5), review('a', 'u3', 1)],
    )
    expect(entries[0].distribution).toEqual([1, 0, 0, 0, 2])
    expect(entries[0].reviewCount).toBe(3)
  })

  it('handles an empty group', () => {
    expect(rankEntries([], [])).toEqual({ entries: [], ratedCount: 0 })
  })
})

describe('memberStats', () => {
  it('counts reviews and entries per member, case-insensitively', () => {
    const stats = memberStats(
      [member('Alex'), member('Sam')],
      [entry('a', 'A', 'alex'), entry('b', 'B', 'Sam')],
      [review('a', 'ALEX', 4), review('b', 'alex', 2)],
    )
    expect(stats[0]).toMatchObject({
      reviewCount: 2,
      entriesAdded: 1,
      averageGiven: 3,
    })
    expect(stats[1]).toMatchObject({
      reviewCount: 0,
      entriesAdded: 1,
      averageGiven: null,
    })
  })
})

describe('isSameUser', () => {
  it('folds ASCII case only, like SQLite NOCASE', () => {
    expect(isSameUser('Alex', 'aLEX')).toBe(true)
    expect(isSameUser('Élise', 'élise')).toBe(false)
  })
})
