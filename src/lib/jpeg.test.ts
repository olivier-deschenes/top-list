import { describe, expect, it } from 'vitest'
import { cleanJpeg } from './jpeg'

// Segment contents only need to be well-formed; nothing here decodes them.
const segment = (marker: number, payload: Array<number>) => [
  0xff,
  marker,
  (payload.length + 2) >> 8,
  (payload.length + 2) & 0xff,
  ...payload,
]
const text = (value: string) => [...new TextEncoder().encode(value)]

const frame = (width: number, height: number, marker = 0xc0) =>
  segment(marker, [
    8,
    height >> 8,
    height & 0xff,
    width >> 8,
    width & 0xff,
    1,
    1,
    0x11,
    0,
  ])
const tables = [
  ...segment(0xdb, [0, ...Array<number>(64).fill(1)]),
  ...segment(0xc4, [0, ...Array<number>(16).fill(0)]),
]
// Entropy-coded data with a stuffed 0xFF00 and a restart marker in it.
const scan = [
  ...segment(0xda, [1, 1, 0, 0, 63, 0]),
  0x12,
  0xff,
  0x00,
  0x34,
  0xff,
  0xd0,
  0x56,
]
const exif = segment(0xe1, [...text('Exif'), 0, 0, ...text('GPS 45.5,-73.6')])
const comment = segment(0xfe, text('<script>alert(1)</script>'))

const bytes = (...parts: Array<Array<number>>) => Uint8Array.from(parts.flat())
const SOI = [0xff, 0xd8]
const EOI = [0xff, 0xd9]

describe('cleanJpeg', () => {
  const clean = bytes(SOI, frame(3000, 2000), tables, scan, EOI)

  it('keeps the image data and reads its size from the frame', () => {
    expect(cleanJpeg(clean)).toEqual({
      bytes: clean,
      width: 3000,
      height: 2000,
    })
  })

  it('drops metadata and comments', () => {
    const tagged = bytes(
      SOI,
      exif,
      frame(3000, 2000),
      comment,
      tables,
      scan,
      EOI,
    )
    expect(cleanJpeg(tagged)?.bytes).toEqual(clean)
  })

  it('drops anything after the image', () => {
    const appended = bytes(
      SOI,
      frame(3000, 2000),
      tables,
      scan,
      EOI,
      text('PK\u0003\u0004 hidden.zip'),
    )
    expect(cleanJpeg(appended)?.bytes).toEqual(clean)
  })

  it('reads progressive images, with several scans', () => {
    const progressive = bytes(
      SOI,
      frame(640, 480, 0xc2),
      tables,
      scan,
      tables,
      scan,
      EOI,
    )
    expect(cleanJpeg(progressive)).toMatchObject({ width: 640, height: 480 })
  })

  it('rejects files that only start like a JPEG', () => {
    expect(
      cleanJpeg(
        bytes([0xff, 0xd8, 0xff], text('<html><script>alert(1)</script>')),
      ),
    ).toBeNull()
    expect(cleanJpeg(bytes(text('GIF89a')))).toBeNull()
  })

  it('rejects incomplete images', () => {
    expect(cleanJpeg(bytes(SOI, frame(3, 2), tables, scan))).toBeNull()
    expect(cleanJpeg(bytes(SOI, tables, scan, EOI))).toBeNull()
    expect(cleanJpeg(bytes(SOI, frame(3, 2), tables, EOI))).toBeNull()
    expect(cleanJpeg(bytes(SOI, [0xff, 0xdb, 0x40, 0x00, 1, 2, 3]))).toBeNull()
    expect(cleanJpeg(bytes(SOI, frame(0, 2), tables, scan, EOI))).toBeNull()
  })

  it('rejects segments browsers never write', () => {
    expect(
      cleanJpeg(bytes(SOI, frame(3, 2, 0xc3), tables, scan, EOI)),
    ).toBeNull()
    expect(
      cleanJpeg(bytes(SOI, frame(3, 2), segment(0xf0, [1]), tables, scan, EOI)),
    ).toBeNull()
    expect(
      cleanJpeg(bytes(SOI, frame(3, 2), frame(3, 2), tables, scan, EOI)),
    ).toBeNull()
  })
})
