import {
  createCollection,
  localStorageCollectionOptions,
} from '@tanstack/react-db'
import { z } from 'zod'

const MyGroupSchema = z.object({
  groupId: z.string(),
  groupName: z.string(),
  /** Who this device acts as in the group; null until they pick a name. */
  username: z.string().nullable(),
  lastVisitedAt: z.number(),
})

export type MyGroup = z.infer<typeof MyGroupSchema>

/**
 * Groups opened on this device and who the visitor is in each one.
 * Lives in localStorage and syncs across tabs. On the server it is an
 * empty in-memory store, so read it only after hydration.
 */
export const myGroupsCollection = createCollection(
  localStorageCollectionOptions({
    id: 'my-groups',
    storageKey: 'top-list:my-groups',
    getKey: (group) => group.groupId,
    schema: MyGroupSchema,
    startSync: true,
  }),
)

export function rememberGroup(
  groupId: string,
  changes: Partial<Omit<MyGroup, 'groupId'>>,
) {
  if (myGroupsCollection.has(groupId)) {
    myGroupsCollection.update(groupId, (draft) => {
      Object.assign(draft, changes)
    })
  } else {
    myGroupsCollection.insert({
      groupId,
      groupName: '',
      username: null,
      lastVisitedAt: Date.now(),
      ...changes,
    })
  }
}

export function forgetGroup(groupId: string) {
  if (myGroupsCollection.has(groupId)) myGroupsCollection.delete(groupId)
}
