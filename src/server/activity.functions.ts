import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { activityPageInput } from '#/lib/schemas'
import type { ActivityPage } from '#/lib/types'
import { ACTIVITY_COLUMNS, db, requireGroup, toActivity } from './db.server'
import type { ActivityRow } from './db.server'

const PAGE_SIZE = 30

/** Newest-first activity, paged by a (created_at, id) cursor. */
export const getActivityPage = createServerFn({ method: 'GET' })
  .validator(activityPageInput)
  .handler(async ({ data }): Promise<ActivityPage> => {
    setResponseHeader('Cache-Control', 'no-store')
    await requireGroup(data.groupId)

    const cursor = data.cursor
    const statement = cursor
      ? db()
          .prepare(
            `SELECT ${ACTIVITY_COLUMNS} FROM activity
             WHERE group_id = ?1 AND (created_at < ?2 OR (created_at = ?2 AND id < ?3))
             ORDER BY created_at DESC, id DESC LIMIT ?4`,
          )
          .bind(data.groupId, cursor.createdAt, cursor.id, PAGE_SIZE + 1)
      : db()
          .prepare(
            `SELECT ${ACTIVITY_COLUMNS} FROM activity
             WHERE group_id = ?1 ORDER BY created_at DESC, id DESC LIMIT ?2`,
          )
          .bind(data.groupId, PAGE_SIZE + 1)

    const { results } = await statement.all<ActivityRow>()
    const hasMore = results.length > PAGE_SIZE
    const rows = hasMore ? results.slice(0, PAGE_SIZE) : results
    const last = rows.at(-1)
    return {
      items: rows.map(toActivity),
      nextCursor:
        hasMore && last ? { createdAt: last.created_at, id: last.id } : null,
    }
  })
