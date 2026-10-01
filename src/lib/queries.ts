import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { m } from '#/paraglide/messages'
import { getActivityPage } from '#/server/activity.functions'
import {
  createEntry,
  deleteEntry,
  updateEntry,
} from '#/server/entries.functions'
import {
  createGroup,
  deleteGroup,
  getGroupSnapshot,
  updateGroup,
} from '#/server/groups.functions'
import { joinGroup, renameMember } from '#/server/members.functions'
import { deleteReview, saveReview } from '#/server/reviews.functions'
import { isSameUser } from './ranking'
import type {
  EntryFieldsInput,
  GroupDetailsInput,
  ReviewFieldsInput,
} from './schemas'
import type { ActivityCursor, GroupSnapshot, Review } from './types'

/** Everything about a group lives under this key; invalidate it after writes. */
export const groupKey = (groupId: string) => ['group', groupId] as const

/** Polled so other people's changes show up without a reload. */
export const groupQuery = (groupId: string) =>
  queryOptions({
    queryKey: groupKey(groupId),
    queryFn: () => getGroupSnapshot({ data: { groupId } }),
    refetchInterval: 15_000,
  })

export const activityQuery = (groupId: string) =>
  infiniteQueryOptions({
    queryKey: [...groupKey(groupId), 'activity'],
    queryFn: ({ pageParam }) =>
      getActivityPage({ data: { groupId, cursor: pageParam } }),
    initialPageParam: null as ActivityCursor | null,
    getNextPageParam: (page) => page.nextCursor,
    refetchInterval: 30_000,
  })

/** "<page> · <group>" for document titles. */
export const groupPageTitle = (page: string, groupName: string | undefined) =>
  groupName ? `${page} · ${groupName}` : page

export function errorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : m.error_generic()
}

const toastError = (error: unknown) => toast.error(errorMessage(error))

function useInvalidateGroup(groupId: string) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: groupKey(groupId) })
}

export function useCreateGroup() {
  return useMutation({
    mutationFn: (input: GroupDetailsInput & { username: string }) =>
      createGroup({ data: input }),
    onError: toastError,
  })
}

export function useJoinGroup(groupId: string) {
  const invalidate = useInvalidateGroup(groupId)
  return useMutation({
    mutationFn: (username: string) =>
      joinGroup({ data: { groupId, username } }),
    onError: toastError,
    onSettled: invalidate,
  })
}

export function useRenameMember(groupId: string) {
  const invalidate = useInvalidateGroup(groupId)
  return useMutation({
    mutationFn: (input: { username: string; newUsername: string }) =>
      renameMember({ data: { groupId, ...input } }),
    onSettled: invalidate,
  })
}

export function useUpdateGroup(groupId: string) {
  const invalidate = useInvalidateGroup(groupId)
  return useMutation({
    mutationFn: (input: GroupDetailsInput & { username: string }) =>
      updateGroup({ data: { groupId, ...input } }),
    onError: toastError,
    onSettled: invalidate,
  })
}

export function useDeleteGroup(groupId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (username: string) =>
      deleteGroup({ data: { groupId, username } }),
    onError: toastError,
    onSuccess: () => queryClient.removeQueries({ queryKey: groupKey(groupId) }),
  })
}

export function useCreateEntry(groupId: string) {
  const invalidate = useInvalidateGroup(groupId)
  return useMutation({
    mutationFn: (input: EntryFieldsInput & { username: string }) =>
      createEntry({ data: { groupId, ...input } }),
    onError: toastError,
    onSettled: invalidate,
  })
}

export function useUpdateEntry(groupId: string) {
  const invalidate = useInvalidateGroup(groupId)
  return useMutation({
    mutationFn: (
      input: EntryFieldsInput & { username: string; entryId: string },
    ) => updateEntry({ data: { groupId, ...input } }),
    onError: toastError,
    onSettled: invalidate,
  })
}

export function useDeleteEntry(groupId: string) {
  const invalidate = useInvalidateGroup(groupId)
  return useMutation({
    mutationFn: (input: { username: string; entryId: string }) =>
      deleteEntry({ data: { groupId, ...input } }),
    onError: toastError,
    // Not awaited: the caller navigates away first, so the entry page
    // never re-renders without its entry.
    onSettled: () => {
      void invalidate()
    },
  })
}

type ReviewTarget = { username: string; entryId: string }

/** Applies a review change to the cached snapshot so the ranking moves instantly. */
function useOptimisticReviews(groupId: string) {
  const queryClient = useQueryClient()
  const key = groupKey(groupId)

  return {
    async apply(update: (reviews: Array<Review>) => Array<Review>) {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<GroupSnapshot>(key)
      if (previous) {
        queryClient.setQueryData<GroupSnapshot>(key, {
          ...previous,
          reviews: update(previous.reviews),
        })
      }
      return { previous }
    },
    rollback(context: { previous?: GroupSnapshot } | undefined) {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    settle: () => queryClient.invalidateQueries({ queryKey: key }),
  }
}

const isTarget = (review: Review, target: ReviewTarget) =>
  review.entryId === target.entryId &&
  isSameUser(review.username, target.username)

export function useSaveReview(groupId: string) {
  const optimistic = useOptimisticReviews(groupId)
  return useMutation({
    mutationFn: (input: ReviewFieldsInput & ReviewTarget) =>
      saveReview({ data: { groupId, ...input } }),
    onMutate: (input) =>
      optimistic.apply((reviews) => {
        const now = Date.now()
        const existing = reviews.find((review) => isTarget(review, input))
        const next: Review = {
          entryId: input.entryId,
          username: existing?.username ?? input.username,
          rating: input.rating,
          comment: input.comment.trim() || null,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        }
        return [next, ...reviews.filter((review) => review !== existing)]
      }),
    onError: (error, _input, context) => {
      optimistic.rollback(context)
      toastError(error)
    },
    onSettled: optimistic.settle,
  })
}

export function useDeleteReview(groupId: string) {
  const optimistic = useOptimisticReviews(groupId)
  return useMutation({
    mutationFn: (input: ReviewTarget) =>
      deleteReview({ data: { groupId, ...input } }),
    onMutate: (input) =>
      optimistic.apply((reviews) =>
        reviews.filter((review) => !isTarget(review, input)),
      ),
    onError: (error, _input, context) => {
      optimistic.rollback(context)
      toastError(error)
    },
    onSettled: optimistic.settle,
  })
}
