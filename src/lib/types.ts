// API shapes shared by server functions and the UI. Timestamps are epoch ms.

export interface Group {
  id: string
  name: string
  description: string | null
  createdBy: string
  createdAt: number
  updatedAt: number
}

export interface Member {
  username: string
  joinedAt: number
  lastActiveAt: number
}

export interface Entry {
  id: string
  name: string
  address: string | null
  notes: string | null
  url: string | null
  tags: Array<string>
  createdBy: string
  updatedBy: string | null
  createdAt: number
  updatedAt: number
}

export interface Review {
  entryId: string
  username: string
  rating: number
  comment: string | null
  createdAt: number
  updatedAt: number
}

export interface GroupSnapshot {
  group: Group
  members: Array<Member>
  entries: Array<Entry>
  reviews: Array<Review>
}

interface ActivityBase {
  id: string
  username: string
  entryId: string | null
  entryName: string | null
  createdAt: number
}

export type ActivityItem = ActivityBase &
  (
    | { type: 'group.created' | 'group.updated'; data: { name: string } }
    | { type: 'member.joined'; data: null }
    | { type: 'member.renamed'; data: { from: string } }
    | {
        type: 'entry.created' | 'entry.updated' | 'entry.deleted'
        data: null
      }
    | { type: 'review.saved'; data: { rating: number } }
    | { type: 'review.deleted'; data: null }
  )

export type ActivityType = ActivityItem['type']

export interface ActivityCursor {
  createdAt: number
  id: string
}

export interface ActivityPage {
  items: Array<ActivityItem>
  nextCursor: ActivityCursor | null
}
