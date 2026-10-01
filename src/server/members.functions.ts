import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import { actorInput, renameMemberInput } from '#/lib/schemas'
import { m } from '#/paraglide/messages'
import {
  db,
  findMemberName,
  insertActivity,
  requireGroup,
  touchMember,
} from './db.server'

/** Joins (or re-joins) a group and returns the member's stored spelling. */
export const joinGroup = createServerFn({ method: 'POST' })
  .validator(actorInput)
  .handler(async ({ data }) => {
    await requireGroup(data.groupId)
    const existing = await findMemberName(data.groupId, data.username)
    const username = existing ?? data.username
    const at = Date.now()
    await db().batch([
      touchMember(data.groupId, username, at),
      ...(existing
        ? []
        : [
            insertActivity({
              groupId: data.groupId,
              username,
              type: 'member.joined',
              at,
            }),
          ]),
    ])
    return { username }
  })

/** Renames a member. Their entries, reviews, and history follow (ON UPDATE CASCADE). */
export const renameMember = createServerFn({ method: 'POST' })
  .validator(renameMemberInput)
  .handler(async ({ data }) => {
    await requireGroup(data.groupId)
    const current = await findMemberName(data.groupId, data.username)
    if (!current) throw notFound()

    const holder = await findMemberName(data.groupId, data.newUsername)
    if (holder && holder !== current) throw new Error(m.error_name_taken())
    if (current === data.newUsername) return { username: current }

    const at = Date.now()
    await db().batch([
      db()
        .prepare(
          'UPDATE members SET username = ?, last_active_at = ? WHERE group_id = ? AND username = ?',
        )
        .bind(data.newUsername, at, data.groupId, current),
      db()
        .prepare(
          'UPDATE groups SET created_by = ? WHERE id = ? AND created_by = ? COLLATE NOCASE',
        )
        .bind(data.newUsername, data.groupId, current),
      insertActivity({
        groupId: data.groupId,
        username: data.newUsername,
        type: 'member.renamed',
        data: { from: current },
        at,
      }),
    ])
    return { username: data.newUsername }
  })
