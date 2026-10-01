import { useHydrated } from '@tanstack/react-router'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { myGroupsCollection } from '#/db-collections'

/** Groups remembered on this device, most recent first. Empty until hydrated. */
export function useMyGroups() {
  const hydrated = useHydrated()
  const { data } = useLiveQuery({
    query: (q) =>
      q
        .from({ group: myGroupsCollection })
        .orderBy(({ group }) => group.lastVisitedAt, 'desc'),
  })
  return { groups: hydrated ? data : [], ready: hydrated }
}

/**
 * Who this device acts as in a group. `ready` is false during SSR and
 * hydration, when localStorage can't be read yet.
 */
export function useIdentity(groupId: string) {
  const hydrated = useHydrated()
  const { data, isReady } = useLiveQuery({
    query: (q) =>
      q
        .from({ group: myGroupsCollection })
        .where(({ group }) => eq(group.groupId, groupId)),
  })
  const ready = hydrated && isReady
  return { username: ready ? (data[0]?.username ?? null) : null, ready }
}

/** The name used most recently in any group, to prefill name fields. */
export function useLastUsername() {
  const { groups } = useMyGroups()
  return groups.find((group) => group.username)?.username ?? ''
}
