import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import {
  actorInput,
  createGroupInput,
  groupIdInput,
  updateGroupInput,
} from '#/lib/schemas'
import {
  db,
  insertActivity,
  loadSnapshot,
  requireGroup,
  resolveActor,
  touchMember,
} from './db.server'

export const getGroupSnapshot = createServerFn({ method: 'GET' })
  .validator(groupIdInput)
  .handler(async ({ data }) => {
    setResponseHeader('Cache-Control', 'no-store')
    return loadSnapshot(data.groupId)
  })

export const createGroup = createServerFn({ method: 'POST' })
  .validator(createGroupInput)
  .handler(async ({ data }) => {
    const id = crypto.randomUUID()
    const at = Date.now()
    await db().batch([
      db()
        .prepare(
          `INSERT INTO groups (id, name, description, created_by, created_at, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?5)`,
        )
        .bind(id, data.name, data.description, data.username, at),
      touchMember(id, data.username, at),
      insertActivity({
        groupId: id,
        username: data.username,
        type: 'group.created',
        data: { name: data.name },
        at,
      }),
    ])
    return { id, username: data.username }
  })

export const updateGroup = createServerFn({ method: 'POST' })
  .validator(updateGroupInput)
  .handler(async ({ data }) => {
    await requireGroup(data.groupId)
    const username = await resolveActor(data.groupId, data.username)
    const at = Date.now()
    await db().batch([
      db()
        .prepare(
          'UPDATE groups SET name = ?, description = ?, updated_at = ? WHERE id = ?',
        )
        .bind(data.name, data.description, at, data.groupId),
      touchMember(data.groupId, username, at),
      insertActivity({
        groupId: data.groupId,
        username,
        type: 'group.updated',
        data: { name: data.name },
        at,
      }),
    ])
  })

export const deleteGroup = createServerFn({ method: 'POST' })
  .validator(actorInput)
  .handler(async ({ data }) => {
    await requireGroup(data.groupId)
    // Members, entries, reviews, and activity cascade.
    await db()
      .prepare('DELETE FROM groups WHERE id = ?')
      .bind(data.groupId)
      .run()
  })
