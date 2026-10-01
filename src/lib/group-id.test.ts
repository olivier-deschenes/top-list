import { describe, expect, it } from 'vitest'
import { parseGroupId } from './group-id'

const ID = '3f2b8c1e-9d4a-4e6b-8f0a-1c2d3e4f5a6b'

describe('parseGroupId', () => {
  it('accepts a bare id', () => {
    expect(parseGroupId(ID)).toBe(ID)
  })

  it('extracts the id from a full link, with or without a sub page', () => {
    expect(parseGroupId(`https://top-list.example.workers.dev/g/${ID}`)).toBe(
      ID,
    )
    expect(parseGroupId(`http://localhost:3000/g/${ID}/members?x=1`)).toBe(ID)
  })

  it('normalizes case and surrounding whitespace', () => {
    expect(parseGroupId(`  ${ID.toUpperCase()}  `)).toBe(ID)
  })

  it('rejects anything without a uuid', () => {
    expect(parseGroupId('')).toBeNull()
    expect(parseGroupId('office lunch')).toBeNull()
    expect(parseGroupId('3f2b8c1e-9d4a-4e6b-8f0a')).toBeNull()
  })
})
