import { describe, expect, it } from 'vitest'
import { isSameUser, memberStats, rankEntries } from './ranking'
import type { Entry, Member, Review } from './types'

const entry = (id: string, name = id, createdBy = 'alex'): Entry => ({
  id,
  name,
  address: null,
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

  it('does not let one 10/10 review beat many high reviews', () => {
    const many = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].map((u) =>
      review('steady', u, u === 'j' ? 8 : 10),
    )
    const { entries } = rankEntries(
      [entry('lucky'), entry('steady')],
      [review('lucky', 'alex', 10), ...many],
    )
    expect(entries[0].entry.id).toBe('steady')
    expect(entries[0].average).toBeCloseTo(9.8)
    expect(entries[1].average).toBe(10)
  })

  it('weights scores toward two neutral 6/10 reviews', () => {
    const { entries } = rankEntries(
      [entry('x'), entry('y')],
      [review('x', 'alex', 10), review('y', 'alex', 6), review('y', 'sam', 8)],
    )
    expect(entries[0].score).toBeCloseTo((2 * 6 + 10) / 3)
    expect(entries[1].score).toBeCloseTo((2 * 6 + 14) / 4)
  })

  it('averages half points', () => {
    const { entries } = rankEntries(
      [entry('a')],
      [review('a', 'alex', 7.5), review('a', 'sam', 9)],
    )
    expect(entries[0].average).toBe(8.25)
  })

  it("keeps an entry's score stable when other entries get reviews", () => {
    const before = rankEntries([entry('a'), entry('b')], [review('a', 'u', 8)])
    const after = rankEntries(
      [entry('a'), entry('b')],
      [review('a', 'u', 8), review('b', 'u', 2), review('b', 'v', 2)],
    )
    const score = (r: typeof before) =>
      r.entries.find((item) => item.entry.id === 'a')?.score
    expect(score(after)).toBe(score(before))
  })

  it('shares ranks on ties and skips the next rank', () => {
    const { entries } = rankEntries(
      [entry('a'), entry('b'), entry('c')],
      [review('a', 'alex', 8), review('b', 'alex', 8), review('c', 'alex', 4)],
    )
    expect(entries.map((item) => item.rank)).toEqual([1, 1, 3])
  })

  it('breaks equal scores by review count, then name', () => {
    const { entries } = rankEntries(
      [entry('b', 'Banh mi'), entry('a', 'Arepas')],
      [review('a', 'alex', 8), review('b', 'alex', 8)],
    )
    expect(entries.map((item) => item.entry.name)).toEqual([
      'Arepas',
      'Banh mi',
    ])
  })

  it('builds the whole-point distribution, half points rounding down', () => {
    const { entries } = rankEntries(
      [entry('a')],
      [
        review('a', 'u1', 10),
        review('a', 'u2', 10),
        review('a', 'u3', 9.5),
        review('a', 'u4', 1),
        review('a', 'u5', 1.5),
      ],
    )
    expect(entries[0].distribution).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 1, 2])
    expect(entries[0].reviewCount).toBe(5)
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
