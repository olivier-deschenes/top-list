import { env } from 'cloudflare:workers'
import { notFound } from '@tanstack/react-router'
import type {
  ActivityItem,
  ActivityType,
  Entry,
  Group,
  GroupSnapshot,
  Member,
  Review,
} from '#/lib/types'

// Raw D1 rows (snake_case, JSON stored as text) and their API mappings.

export interface GroupRow {
  id: string
  name: string
  description: string | null
  created_by: string
  created_at: number
  updated_at: number
}

export interface MemberRow {
  username: string
  joined_at: number
  last_active_at: number
}

export interface EntryRow {
  id: string
  name: string
  notes: string | null
  url: string | null
  tags: string
  created_by: string
  updated_by: string | null
  created_at: number
  updated_at: number
}

export interface ReviewRow {
  entry_id: string
  username: string
  rating: number
  comment: string | null
  created_at: number
  updated_at: number
}

export interface ActivityRow {
  id: string
  username: string
  type: ActivityType
  entry_id: string | null
  entry_name: string | null
  data: string | null
  created_at: number
}

const GROUP_COLUMNS =
  'id, name, description, created_by, created_at, updated_at'
const MEMBER_COLUMNS = 'username, joined_at, last_active_at'
const ENTRY_COLUMNS =
  'id, name, notes, url, tags, created_by, updated_by, created_at, updated_at'
const REVIEW_COLUMNS =
  'entry_id, username, rating, comment, created_at, updated_at'
export const ACTIVITY_COLUMNS =
  'id, username, type, entry_id, entry_name, data, created_at'

export const db = () => env.DB

export const toGroup = (row: GroupRow): Group => ({
  id: row.id,
  name: row.name,
  description: row.description,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const toMember = (row: MemberRow): Member => ({
  username: row.username,
  joinedAt: row.joined_at,
  lastActiveAt: row.last_active_at,
})

const parseTags = (raw: string): Array<string> => {
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === 'string')
      : []
  } catch {
    return []
  }
}

const toEntry = (row: EntryRow): Entry => ({
  id: row.id,
  name: row.name,
  notes: row.notes,
  url: row.url,
  tags: parseTags(row.tags),
  createdBy: row.created_by,
  updatedBy: row.updated_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const toReview = (row: ReviewRow): Review => ({
  entryId: row.entry_id,
  username: row.username,
  rating: row.rating,
  comment: row.comment,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const toActivity = (row: ActivityRow): ActivityItem => ({
  id: row.id,
  username: row.username,
  type: row.type,
  entryId: row.entry_id,
  entryName: row.entry_name,
  data: row.data ? JSON.parse(row.data) : null,
  createdAt: row.created_at,
})

export async function loadSnapshot(groupId: string): Promise<GroupSnapshot> {
  const [groups, members, entries, reviews] = await db().batch([
    db()
      .prepare(`SELECT ${GROUP_COLUMNS} FROM groups WHERE id = ?`)
      .bind(groupId),
    db()
      .prepare(
        `SELECT ${MEMBER_COLUMNS} FROM members WHERE group_id = ? ORDER BY username`,
      )
      .bind(groupId),
    db()
      .prepare(
        `SELECT ${ENTRY_COLUMNS} FROM entries WHERE group_id = ? ORDER BY created_at`,
      )
      .bind(groupId),
    db()
      .prepare(
        `SELECT ${REVIEW_COLUMNS} FROM reviews WHERE group_id = ? ORDER BY updated_at DESC`,
      )
      .bind(groupId),
  ])

  const group = (groups.results as Array<GroupRow>).at(0)
  if (!group) throw notFound()

  return {
    group: toGroup(group),
    members: (members.results as Array<MemberRow>).map(toMember),
    entries: (entries.results as Array<EntryRow>).map(toEntry),
    reviews: (reviews.results as Array<ReviewRow>).map(toReview),
  }
}

export async function requireGroup(groupId: string): Promise<GroupRow> {
  const group = await db()
    .prepare(`SELECT ${GROUP_COLUMNS} FROM groups WHERE id = ?`)
    .bind(groupId)
    .first<GroupRow>()
  if (!group) throw notFound()
  return group
}

export async function requireEntry(
  groupId: string,
  entryId: string,
): Promise<EntryRow> {
  const entry = await db()
    .prepare(
      `SELECT ${ENTRY_COLUMNS} FROM entries WHERE id = ? AND group_id = ?`,
    )
    .bind(entryId, groupId)
    .first<EntryRow>()
  if (!entry) throw notFound()
  return entry
}

/**
 * The stored spelling of a member's name (usernames match case-insensitively),
 * or null when nobody in the group uses it yet.
 */
export async function findMemberName(
  groupId: string,
  username: string,
): Promise<string | null> {
  return db()
    .prepare('SELECT username FROM members WHERE group_id = ? AND username = ?')
    .bind(groupId, username)
    .first<string>('username')
}

/** Resolves the acting member, keeping an existing member's spelling. */
export async function resolveActor(groupId: string, username: string) {
  return (await findMemberName(groupId, username)) ?? username
}

/** Creates the member if needed and marks them active. */
export function touchMember(groupId: string, username: string, at: number) {
  return db()
    .prepare(
      `INSERT INTO members (group_id, username, joined_at, last_active_at)
       VALUES (?1, ?2, ?3, ?3)
       ON CONFLICT (group_id, username) DO UPDATE SET last_active_at = excluded.last_active_at`,
    )
    .bind(groupId, username, at)
}

export function insertActivity(activity: {
  groupId: string
  username: string
  type: ActivityType
  at: number
  entryId?: string
  entryName?: string
  data?: Record<string, string | number>
}) {
  return db()
    .prepare(
      `INSERT INTO activity (id, group_id, username, type, entry_id, entry_name, data, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      activity.groupId,
      activity.username,
      activity.type,
      activity.entryId ?? null,
      activity.entryName ?? null,
      activity.data ? JSON.stringify(activity.data) : null,
      activity.at,
    )
}
