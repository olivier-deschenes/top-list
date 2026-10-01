import { createServerFn } from '@tanstack/react-start'
import { entryActionInput, saveReviewInput } from '#/lib/schemas'
import {
  db,
  insertActivity,
  requireEntry,
  resolveActor,
  touchMember,
} from './db.server'

/** Creates or replaces the member's review of an entry (one per person). */
export const saveReview = createServerFn({ method: 'POST' })
  .validator(saveReviewInput)
  .handler(async ({ data }) => {
    const entry = await requireEntry(data.groupId, data.entryId)
    const username = await resolveActor(data.groupId, data.username)
    const at = Date.now()
    await db().batch([
      touchMember(data.groupId, username, at),
      db()
        .prepare(
          `INSERT INTO reviews (entry_id, group_id, username, rating, comment, created_at, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)
           ON CONFLICT (entry_id, username) DO UPDATE SET
             rating = excluded.rating,
             comment = excluded.comment,
             updated_at = excluded.updated_at`,
        )
        .bind(
          data.entryId,
          data.groupId,
          username,
          data.rating,
          data.comment,
          at,
        ),
      insertActivity({
        groupId: data.groupId,
        username,
        type: 'review.saved',
        entryId: data.entryId,
        entryName: entry.name,
        data: { rating: data.rating },
        at,
      }),
    ])
  })

export const deleteReview = createServerFn({ method: 'POST' })
  .validator(entryActionInput)
  .handler(async ({ data }) => {
    const entry = await requireEntry(data.groupId, data.entryId)
    const username = await resolveActor(data.groupId, data.username)
    const existing = await db()
      .prepare(
        'SELECT 1 AS found FROM reviews WHERE entry_id = ? AND username = ?',
      )
      .bind(data.entryId, username)
      .first<number>('found')
    if (!existing) return

    const at = Date.now()
    await db().batch([
      db()
        .prepare('DELETE FROM reviews WHERE entry_id = ? AND username = ?')
        .bind(data.entryId, username),
      touchMember(data.groupId, username, at),
      insertActivity({
        groupId: data.groupId,
        username,
        type: 'review.deleted',
        entryId: data.entryId,
        entryName: entry.name,
        at,
      }),
    ])
  })
