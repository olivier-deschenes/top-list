import { env } from 'cloudflare:workers'
import { cleanJpeg } from '#/lib/jpeg'
import { PHOTO_VARIANTS } from '#/lib/photos'
import type { PhotoVariant } from '#/lib/photos'
import { PHOTOS } from '#/lib/schemas'
import { db } from './db.server'

// Photo images in R2. Keys are "<photo id>/<variant>"; ids are random UUIDs,
// so a photo's URL is as hard to guess as its group's link.

const photoKey = (photoId: string, variant: PhotoVariant) =>
  `${photoId}/${variant}`

export const getPhotoObject = (photoId: string, variant: PhotoVariant) =>
  env.PHOTOS.get(photoKey(photoId, variant))

export const putPhotoObject = (
  photoId: string,
  variant: PhotoVariant,
  file: Uint8Array,
) =>
  env.PHOTOS.put(photoKey(photoId, variant), file, {
    httpMetadata: { contentType: 'image/jpeg' },
  })

/** R2 deletes up to 1000 keys per call. */
const KEYS_PER_DELETE = 1000

export async function deletePhotoObjects(photoIds: ReadonlyArray<string>) {
  const keys = photoIds.flatMap((id) =>
    PHOTO_VARIANTS.map((variant) => photoKey(id, variant)),
  )
  for (let start = 0; start < keys.length; start += KEYS_PER_DELETE) {
    await env.PHOTOS.delete(keys.slice(start, start + KEYS_PER_DELETE))
  }
}

/** Ids of the photos a delete is about to cascade over, to clear from R2 after. */
export async function photoIdsWhere(
  column: 'entry_id' | 'group_id',
  id: string,
): Promise<Array<string>> {
  const { results } = await db()
    .prepare(`SELECT id FROM photos WHERE ${column} = ?`)
    .bind(id)
    .all<{ id: string }>()
  return results.map((row) => row.id)
}

const fitsWithin = (size: { width: number; height: number }, edge: number) =>
  Math.max(size.width, size.height) <= edge

/**
 * An upload rebuilt from just its image data (see cleanJpeg), with its size
 * read from the file, or null when either file isn't a JPEG that fits its
 * edge. The browser encodes to an sRGB canvas, so dropping the color profile
 * changes no pixels.
 */
export async function cleanPhoto(photo: { full: File; thumb: File }) {
  const full = cleanJpeg(new Uint8Array(await photo.full.arrayBuffer()))
  const thumb = cleanJpeg(new Uint8Array(await photo.thumb.arrayBuffer()))
  if (
    !full ||
    !thumb ||
    !fitsWithin(full, PHOTOS.fullEdge) ||
    !fitsWithin(thumb, PHOTOS.thumbEdge)
  ) {
    return null
  }
  return {
    full: full.bytes,
    thumb: thumb.bytes,
    width: full.width,
    height: full.height,
  }
}
