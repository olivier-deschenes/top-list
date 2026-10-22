import { createServerFn } from '@tanstack/react-start'
import { PHOTOS, photoActionInput, uploadPhotosInput } from '#/lib/schemas'
import { m } from '#/paraglide/messages'
import {
  db,
  insertActivity,
  requireEntry,
  resolveActor,
  touchMember,
} from './db.server'
import { deletePhotoObjects, isJpeg, putPhotoObject } from './photos.server'

/**
 * Adds photos to an entry. Sent as FormData: the actor and entry fields once,
 * then `full`, `thumb`, `width`, and `height` once per photo, in order.
 */
export const uploadPhotos = createServerFn({ method: 'POST' })
  .validator((data: FormData) => {
    if (!(data instanceof FormData)) throw new Error('Expected FormData')
    const thumbs = data.getAll('thumb')
    const widths = data.getAll('width')
    const heights = data.getAll('height')
    return uploadPhotosInput.parse({
      groupId: data.get('groupId'),
      username: data.get('username'),
      entryId: data.get('entryId'),
      photos: data.getAll('full').map((full, index) => ({
        full,
        thumb: thumbs[index],
        width: Number(widths[index]),
        height: Number(heights[index]),
      })),
    })
  })
  .handler(async ({ data }) => {
    const entry = await requireEntry(data.groupId, data.entryId)
    const username = await resolveActor(data.groupId, data.username)

    const files = data.photos.flatMap((photo) => [photo.full, photo.thumb])
    const valid = await Promise.all(files.map(isJpeg))
    if (!valid.every(Boolean)) throw new Error(m.validation_photo())

    const existing =
      (await db()
        .prepare('SELECT COUNT(*) AS count FROM photos WHERE entry_id = ?')
        .bind(data.entryId)
        .first<number>('count')) ?? 0
    if (existing + data.photos.length > PHOTOS.perEntry) {
      throw new Error(m.error_photos_full({ max: PHOTOS.perEntry }))
    }

    const photos = data.photos.map((photo) => ({
      ...photo,
      id: crypto.randomUUID(),
    }))
    const ids = photos.map((photo) => photo.id)
    const at = Date.now()

    try {
      await Promise.all(
        photos.flatMap((photo) => [
          putPhotoObject(photo.id, 'full', photo.full),
          putPhotoObject(photo.id, 'thumb', photo.thumb),
        ]),
      )
      await db().batch([
        touchMember(data.groupId, username, at),
        // A millisecond apart, so they keep their upload order.
        ...photos.map((photo, index) =>
          db()
            .prepare(
              `INSERT INTO photos (id, entry_id, group_id, username, width, height, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
            )
            .bind(
              photo.id,
              data.entryId,
              data.groupId,
              username,
              photo.width,
              photo.height,
              at + index,
            ),
        ),
        insertActivity({
          groupId: data.groupId,
          username,
          type: 'photo.added',
          entryId: data.entryId,
          entryName: entry.name,
          data: { count: photos.length },
          at,
        }),
      ])
    } catch (error) {
      await deletePhotoObjects(ids)
      throw error
    }
    return { ids }
  })

export const deletePhoto = createServerFn({ method: 'POST' })
  .validator(photoActionInput)
  .handler(async ({ data }) => {
    const photo = await db()
      .prepare(
        `SELECT photos.entry_id, entries.name AS entry_name
         FROM photos JOIN entries ON entries.id = photos.entry_id
         WHERE photos.id = ? AND photos.group_id = ?`,
      )
      .bind(data.photoId, data.groupId)
      .first<{ entry_id: string; entry_name: string }>()
    // Already gone (someone else got there first).
    if (!photo) return

    const username = await resolveActor(data.groupId, data.username)
    const at = Date.now()
    await db().batch([
      db().prepare('DELETE FROM photos WHERE id = ?').bind(data.photoId),
      touchMember(data.groupId, username, at),
      insertActivity({
        groupId: data.groupId,
        username,
        type: 'photo.deleted',
        entryId: photo.entry_id,
        entryName: photo.entry_name,
        at,
      }),
    ])
    await deletePhotoObjects([data.photoId])
  })
