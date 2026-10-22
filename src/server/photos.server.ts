import { env } from 'cloudflare:workers'
import { PHOTO_VARIANTS } from '#/lib/photos'
import type { PhotoVariant } from '#/lib/photos'
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
  file: File,
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

/** JPEGs start with FF D8 FF, whatever the upload claims to be. */
export async function isJpeg(file: File) {
  const head = new Uint8Array(await file.slice(0, 3).arrayBuffer())
  return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff
}
