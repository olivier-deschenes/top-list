import { createServerFn } from '@tanstack/react-start'
import {
  createEntryInput,
  entryActionInput,
  updateEntryInput,
} from '#/lib/schemas'
import {
  db,
  insertActivity,
  requireEntry,
  requireGroup,
  resolveActor,
  touchMember,
} from './db.server'

export const createEntry = createServerFn({ method: 'POST' })
  .validator(createEntryInput)
  .handler(async ({ data }) => {
    await requireGroup(data.groupId)
    const username = await resolveActor(data.groupId, data.username)
    const id = crypto.randomUUID()
    const at = Date.now()
    await db().batch([
      touchMember(data.groupId, username, at),
      db()
        .prepare(
          `INSERT INTO entries (id, group_id, name, address, notes, url, tags, created_by, created_at, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9)`,
        )
        .bind(
          id,
          data.groupId,
          data.name,
          data.address,
          data.notes,
          data.url,
          JSON.stringify(data.tags),
          username,
          at,
        ),
      insertActivity({
        groupId: data.groupId,
        username,
        type: 'entry.created',
        entryId: id,
        entryName: data.name,
        at,
      }),
    ])
    return { id }
  })

export const updateEntry = createServerFn({ method: 'POST' })
  .validator(updateEntryInput)
  .handler(async ({ data }) => {
    await requireEntry(data.groupId, data.entryId)
    const username = await resolveActor(data.groupId, data.username)
    const at = Date.now()
    await db().batch([
      touchMember(data.groupId, username, at),
      db()
        .prepare(
          `UPDATE entries SET name = ?, address = ?, notes = ?, url = ?, tags = ?, updated_by = ?, updated_at = ?
           WHERE id = ? AND group_id = ?`,
        )
        .bind(
          data.name,
          data.address,
          data.notes,
          data.url,
          JSON.stringify(data.tags),
          username,
          at,
          data.entryId,
          data.groupId,
        ),
      insertActivity({
        groupId: data.groupId,
        username,
        type: 'entry.updated',
        entryId: data.entryId,
        entryName: data.name,
        at,
      }),
    ])
  })

export const deleteEntry = createServerFn({ method: 'POST' })
  .validator(entryActionInput)
  .handler(async ({ data }) => {
    const entry = await requireEntry(data.groupId, data.entryId)
    const username = await resolveActor(data.groupId, data.username)
    const at = Date.now()
    await db().batch([
      touchMember(data.groupId, username, at),
      // Reviews cascade with the entry.
      db()
        .prepare('DELETE FROM entries WHERE id = ? AND group_id = ?')
        .bind(data.entryId, data.groupId),
      insertActivity({
        groupId: data.groupId,
        username,
        type: 'entry.deleted',
        entryId: data.entryId,
        entryName: entry.name,
        at,
      }),
    ])
  })
