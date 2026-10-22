import { describe, expect, it } from 'vitest'
import { fitWithin, isPhotoVariant, photoUrl } from './photos'

describe('fitWithin', () => {
  it('scales the longer edge down to the limit, keeping the ratio', () => {
    expect(fitWithin(4000, 3000, 2048)).toEqual({ width: 2048, height: 1536 })
    expect(fitWithin(1200, 1800, 640)).toEqual({ width: 427, height: 640 })
  })

  it('never scales up', () => {
    expect(fitWithin(800, 600, 2048)).toEqual({ width: 800, height: 600 })
  })

  it('keeps very thin images at least a pixel wide', () => {
    expect(fitWithin(10000, 2, 640)).toEqual({ width: 640, height: 1 })
  })
})

describe('photo urls', () => {
  it('names a photo and its size', () => {
    expect(photoUrl('abc', 'thumb')).toBe('/api/photos/abc/thumb')
  })

  it('accepts only the stored sizes', () => {
    expect(isPhotoVariant('full')).toBe(true)
    expect(isPhotoVariant('thumb')).toBe(true)
    expect(isPhotoVariant('original')).toBe(false)
  })
})
