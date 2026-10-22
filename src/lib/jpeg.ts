// Server-side check of uploaded JPEGs. The file is rebuilt from only the
// segments a decoder needs, so metadata (EXIF location, comments) and
// anything hidden in other segments or after the image never gets stored.

const SOI = 0xd8
const EOI = 0xd9
const SOS = 0xda

/** Quantization tables, Huffman tables, restart interval. */
const TABLE_MARKERS = new Set([0xdb, 0xc4, 0xdd])
/** Start of frame: baseline, extended, or progressive (what browsers encode). */
const FRAME_MARKERS = new Set([0xc0, 0xc1, 0xc2])

const isAppOrComment = (marker: number) =>
  (marker >= 0xe0 && marker <= 0xef) || marker === 0xfe
const isRestart = (marker: number) => marker >= 0xd0 && marker <= 0xd7

export interface CleanJpeg {
  bytes: Uint8Array
  width: number
  height: number
}

/**
 * The JPEG rebuilt from its frame, tables, and scans, with its size from the
 * frame header. Null when the bytes aren't a complete JPEG of that shape.
 */
export function cleanJpeg(input: Uint8Array): CleanJpeg | null {
  if (input[0] !== 0xff || input[1] !== SOI) return null
  const parts: Array<Uint8Array> = [Uint8Array.of(0xff, SOI)]
  let size: { width: number; height: number } | null = null
  let scans = 0
  let offset = 2

  while (offset < input.length) {
    if (input[offset] !== 0xff) return null
    // Any number of 0xFF fill bytes may come before a marker.
    while (input[offset] === 0xff) offset++
    if (offset >= input.length) return null
    const marker = input[offset++]

    if (marker === EOI) {
      if (!size || scans === 0) return null
      parts.push(Uint8Array.of(0xff, EOI))
      return { bytes: concat(parts), ...size }
    }

    if (offset + 2 > input.length) return null
    const length = (input[offset] << 8) | input[offset + 1]
    const end = offset + length
    if (length < 2 || end > input.length) return null

    if (isAppOrComment(marker)) {
      offset = end
      continue
    }
    if (FRAME_MARKERS.has(marker)) {
      if (size || length < 8) return null
      const height = (input[offset + 3] << 8) | input[offset + 4]
      const width = (input[offset + 5] << 8) | input[offset + 6]
      if (!width || !height) return null
      size = { width, height }
    } else if (marker === SOS) {
      if (!size) return null
      const dataEnd = scanEnd(input, end)
      if (dataEnd < 0) return null
      scans++
      parts.push(Uint8Array.of(0xff, marker), input.subarray(offset, dataEnd))
      offset = dataEnd
      continue
    } else if (!TABLE_MARKERS.has(marker)) {
      return null
    }
    parts.push(Uint8Array.of(0xff, marker), input.subarray(offset, end))
    offset = end
  }
  return null
}

/**
 * Where a scan's entropy-coded data ends: the first marker that isn't a
 * stuffed byte (0xFF00) or a restart. -1 when the data runs off the end.
 */
function scanEnd(input: Uint8Array, start: number) {
  for (let index = start; index < input.length - 1; index++) {
    if (input[index] !== 0xff) continue
    const next = input[index + 1]
    if (next === 0x00 || isRestart(next)) index++
    else if (next !== 0xff) return index
  }
  return -1
}

function concat(parts: ReadonlyArray<Uint8Array>) {
  const result = new Uint8Array(
    parts.reduce((sum, part) => sum + part.length, 0),
  )
  let offset = 0
  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }
  return result
}
