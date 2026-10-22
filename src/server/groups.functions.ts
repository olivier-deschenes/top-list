import { createServerFn } from '@tanstack/react-start'
import {
  getRequest,
  getRequestHeader,
  setResponseHeader,
} from '@tanstack/react-start/server'
import {
  actorInput,
  createGroupInput,
  emailGroupLinkInput,
  groupIdInput,
  updateGroupInput,
} from '#/lib/schemas'
import { m } from '#/paraglide/messages'
import {
  db,
  insertActivity,
  loadSnapshot,
  requireGroup,
  resolveActor,
  touchMember,
  writeBatch,
} from './db.server'
import { isEmailRateLimited, sendGroupLink } from './email.server'
import { deletePhotoObjects, photoIdsWhere } from './photos.server'

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
    await writeBatch([
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
    await writeBatch([
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
    const photoIds = await photoIdsWhere('group_id', data.groupId)
    // Members, entries, reviews, photos, and activity cascade.
    await db()
      .prepare('DELETE FROM groups WHERE id = ?')
      .bind(data.groupId)
      .run()
    await deletePhotoObjects(photoIds)
  })

export const emailGroupLink = createServerFn({ method: 'POST' })
  .validator(emailGroupLinkInput)
  .handler(async ({ data }) => {
    const ip = getRequestHeader('CF-Connecting-IP') ?? 'local'
    if (await isEmailRateLimited({ ip, ...data })) {
      throw new Error(m.error_rate_limited())
    }
    const group = await requireGroup(data.groupId)
    const url = new URL(`/g/${group.id}`, getRequest().url).href
    try {
      await sendGroupLink({ to: data.email, groupName: group.name, url })
    } catch (error) {
      // The code only (E_SENDER_NOT_VERIFIED, …), never the address.
      console.error('emailGroupLink failed', (error as { code?: string }).code)
      throw new Error(m.email_link_failed())
    }
  })
