import { z } from 'zod'
import { m } from '#/paraglide/messages'

// Validation shared by forms (client) and server functions. Error messages are
// functions so they resolve in the locale active when validation runs.

export const LIMITS = {
  username: 32,
  groupName: 60,
  description: 280,
  entryName: 80,
  notes: 500,
  url: 500,
  tag: 24,
  tags: 8,
  comment: 1000,
} as const

const requiredError = () => m.validation_required()
const tooLongError = (max: number) => () => m.validation_too_long({ max })

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: tooLongError(max) })

const requiredText = (max: number) => text(max).min(1, { error: requiredError })

/** Empty input is stored as null. Forms always send a string. */
const optionalText = (max: number) =>
  text(max).transform((value) => value || null)

const collapseSpaces = (value: string) => value.replace(/\s+/g, ' ')

/** Adds https:// when no scheme is given; null when not an http(s) URL. */
export function toHttpUrl(raw: string): string | null {
  const value = raw.trim()
  if (!value) return null
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(value)
    ? value
    : `https://${value}`
  try {
    const url = new URL(candidate)
    const isHttp = url.protocol === 'http:' || url.protocol === 'https:'
    if (!isHttp || !url.hostname.includes('.')) return null
    return url.href
  } catch {
    return null
  }
}

/** Trims, drops empties, and de-duplicates case-insensitively (first spelling wins). */
export function normalizeTags(tags: ReadonlyArray<string>): Array<string> {
  const seen = new Set<string>()
  const result: Array<string> = []
  for (const raw of tags) {
    const tag = collapseSpaces(raw.trim())
    const key = tag.toLocaleLowerCase()
    if (!tag || seen.has(key)) continue
    seen.add(key)
    result.push(tag)
  }
  return result
}

export const groupIdSchema = z.uuid()
export const entryIdSchema = z.uuid()

export const usernameSchema = requiredText(LIMITS.username).transform(
  collapseSpaces,
)
export const groupNameSchema = requiredText(LIMITS.groupName)
export const descriptionSchema = optionalText(LIMITS.description)
export const entryNameSchema = requiredText(LIMITS.entryName)
export const notesSchema = optionalText(LIMITS.notes)
export const commentSchema = optionalText(LIMITS.comment)

export const urlSchema = text(LIMITS.url)
  .refine((value) => !value || toHttpUrl(value) !== null, {
    error: () => m.validation_url(),
  })
  .transform((value) => (value ? toHttpUrl(value) : null))

export const tagsSchema = z
  .array(text(LIMITS.tag))
  .transform(normalizeTags)
  .refine((tags) => tags.length <= LIMITS.tags, {
    error: () => m.validation_tags_max({ max: LIMITS.tags }),
  })

export const ratingSchema = z
  .number({ error: () => m.validation_rating() })
  .int()
  .min(1, { error: () => m.validation_rating() })
  .max(5, { error: () => m.validation_rating() })

// Server function inputs. Every write names the acting member.

const actor = {
  groupId: groupIdSchema,
  username: usernameSchema,
}

export const groupIdInput = z.object({ groupId: groupIdSchema })

export const groupDetailsSchema = z.object({
  name: groupNameSchema,
  description: descriptionSchema,
})

export const createGroupInput = groupDetailsSchema.extend({
  username: usernameSchema,
})

export const updateGroupInput = groupDetailsSchema.extend(actor)

export const actorInput = z.object(actor)

export const renameMemberInput = z.object({
  ...actor,
  newUsername: usernameSchema,
})

export const entryFieldsSchema = z.object({
  name: entryNameSchema,
  notes: notesSchema,
  url: urlSchema,
  tags: tagsSchema,
})

export const createEntryInput = entryFieldsSchema.extend(actor)

export const updateEntryInput = createEntryInput.extend({
  entryId: entryIdSchema,
})

export const entryActionInput = z.object({ ...actor, entryId: entryIdSchema })

export const reviewFieldsSchema = z.object({
  rating: ratingSchema,
  comment: commentSchema,
})

export const saveReviewInput = reviewFieldsSchema.extend({
  ...actor,
  entryId: entryIdSchema,
})

export const activityPageInput = z.object({
  groupId: groupIdSchema,
  cursor: z
    .object({ createdAt: z.number().int(), id: z.string().max(64) })
    .nullish(),
})

export type EntryFieldsInput = z.input<typeof entryFieldsSchema>
export type ReviewFieldsInput = z.input<typeof reviewFieldsSchema>
export type GroupDetailsInput = z.input<typeof groupDetailsSchema>
