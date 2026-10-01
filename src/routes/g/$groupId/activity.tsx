import { ClientOnly, Link, createFileRoute } from '@tanstack/react-router'
import {
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { PageHeader } from '#/components/page'
import { RichMessage } from '#/components/rich-message'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { Spinner } from '#/components/ui/spinner'
import { dayKey, formatDay, formatTime } from '#/lib/format'
import { activityQuery, groupPageTitle, groupQuery } from '#/lib/queries'
import { isSameUser } from '#/lib/ranking'
import type { ActivityItem } from '#/lib/types'
import { m } from '#/paraglide/messages'

export const Route = createFileRoute('/g/$groupId/activity')({
  loader: async ({ context, params }) => {
    const [snapshot] = await Promise.all([
      context.queryClient.ensureQueryData(groupQuery(params.groupId)),
      context.queryClient.ensureInfiniteQueryData(
        activityQuery(params.groupId),
      ),
    ])
    return { groupName: snapshot.group.name }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: groupPageTitle(m.activity_title(), loaderData?.groupName) },
    ],
  }),
  component: Activity,
})

function Activity() {
  const { groupId } = Route.useParams()
  const { data: snapshot } = useSuspenseQuery(groupQuery(groupId))
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(activityQuery(groupId))

  const items = data.pages.flatMap((page) => page.items)
  const days: Array<{ key: number; items: Array<ActivityItem> }> = []
  for (const item of items) {
    const key = dayKey(item.createdAt)
    const last = days.at(-1)
    if (last?.key === key) last.items.push(item)
    else days.push({ key, items: [item] })
  }

  const entryIds = new Set(snapshot.entries.map((entry) => entry.id))
  const person = (name: string) =>
    snapshot.members.some((member) => isSameUser(member.username, name)) ? (
      <Link
        to="/g/$groupId/members/$username"
        params={{ groupId, username: name }}
        className="font-medium text-foreground hover:underline"
      >
        {name}
      </Link>
    ) : (
      <span className="font-medium">{name}</span>
    )
  const entry = (item: ActivityItem) =>
    item.entryId && entryIds.has(item.entryId) ? (
      <Link
        to="/g/$groupId/entries/$entryId"
        params={{ groupId, entryId: item.entryId }}
        className="font-medium text-foreground hover:underline"
      >
        {item.entryName}
      </Link>
    ) : (
      <span className="font-medium">{item.entryName}</span>
    )

  return (
    <div className="space-y-8">
      <PageHeader
        title={m.activity_title()}
        description={m.activity_caption()}
      />
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{m.activity_empty()}</p>
      ) : (
        // Days and times follow the viewer's time zone, so render in the browser.
        <ClientOnly fallback={<Skeleton className="h-64 w-full" />}>
          <div className="space-y-8">
            {days.map((day) => (
              <section
                key={day.key}
                aria-labelledby={`day-${day.key}`}
                className="space-y-2"
              >
                <h2 id={`day-${day.key}`} className="text-sm font-semibold">
                  {formatDay(day.key)}
                </h2>
                <ol className="divide-y border-y">
                  {day.items.map((item) => (
                    <li key={item.id} className="flex gap-4 py-3 text-sm">
                      <time
                        dateTime={new Date(item.createdAt).toISOString()}
                        className="w-12 shrink-0 text-muted-foreground tabular-nums sm:w-16"
                      >
                        {formatTime(item.createdAt)}
                      </time>
                      <p className="min-w-0 text-pretty">
                        {describe(item, person(item.username), entry(item))}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
            {hasNextPage ? (
              <Button
                variant="outline"
                size="lg"
                disabled={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
              >
                {isFetchingNextPage ? (
                  <Spinner data-icon="inline-start" />
                ) : null}
                {m.activity_load_more()}
              </Button>
            ) : null}
          </div>
        </ClientOnly>
      )}
    </div>
  )
}

function describe(item: ActivityItem, user: ReactNode, entry: ReactNode) {
  switch (item.type) {
    case 'group.created':
      return (
        <RichMessage
          slots={{
            username: user,
            name: <span className="font-medium">{item.data.name}</span>,
          }}
          render={(t) => m.activity_group_created(t)}
        />
      )
    case 'group.updated':
      return (
        <RichMessage
          slots={{ username: user }}
          render={(t) => m.activity_group_updated(t)}
        />
      )
    case 'member.joined':
      return (
        <RichMessage
          slots={{ username: user }}
          render={(t) => m.activity_member_joined(t)}
        />
      )
    case 'member.renamed':
      return (
        <RichMessage
          slots={{
            username: user,
            from: <span className="font-medium">{item.data.from}</span>,
          }}
          render={(t) => m.activity_member_renamed(t)}
        />
      )
    case 'entry.created':
      return (
        <RichMessage
          slots={{ username: user, entry }}
          render={(t) => m.activity_entry_created(t)}
        />
      )
    case 'entry.updated':
      return (
        <RichMessage
          slots={{ username: user, entry }}
          render={(t) => m.activity_entry_updated(t)}
        />
      )
    case 'entry.deleted':
      return (
        <RichMessage
          slots={{ username: user, entry }}
          render={(t) => m.activity_entry_deleted(t)}
        />
      )
    case 'review.saved':
      return (
        <RichMessage
          slots={{ username: user, entry }}
          render={(t) =>
            m.activity_review_saved({ ...t, rating: item.data.rating })
          }
        />
      )
    case 'review.deleted':
      return (
        <RichMessage
          slots={{ username: user, entry }}
          render={(t) => m.activity_review_deleted(t)}
        />
      )
  }
}
