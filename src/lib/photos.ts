import { PHOTOS } from './schemas'

export const PHOTO_VARIANTS = ['full', 'thumb'] as const
export type PhotoVariant = (typeof PHOTO_VARIANTS)[number]

export const isPhotoVariant = (value: string): value is PhotoVariant =>
  (PHOTO_VARIANTS as ReadonlyArray<string>).includes(value)

/** Served by the `/api/photos/$photoId/$variant` route. */
export const photoUrl = (photoId: string, variant: PhotoVariant) =>
  `/api/photos/${photoId}/${variant}`

/** Scales a size down (never up) so its longer edge is at most `maxEdge`. */
export function fitWithin(width: number, height: number, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

export interface PreparedPhoto {
  full: Blob
  thumb: Blob
  width: number
  height: number
}

/**
 * Browser only. Decodes an image (applying its EXIF rotation), and re-encodes
 * a full size and a thumbnail as JPEG. Re-encoding drops all metadata, so the
 * camera's location never leaves the device.
 */
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: 'from-image',
  })
  try {
    const full = await encode(bitmap, PHOTOS.fullEdge, 0.85)
    const thumb = await encode(bitmap, PHOTOS.thumbEdge, 0.8)
    return { full: full.blob, thumb: thumb.blob, ...full.size }
  } finally {
    bitmap.close()
  }
}

async function encode(source: ImageBitmap, maxEdge: number, quality: number) {
  const size = fitWithin(source.width, source.height, maxEdge)
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas unavailable')
  // JPEG has no transparency; fill it white rather than black.
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, size.width, size.height)
  context.imageSmoothingQuality = 'high'
  context.drawImage(source, 0, 0, size.width, size.height)
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  )
  if (!blob) throw new Error('Could not encode the image')
  return { blob, size }
}
