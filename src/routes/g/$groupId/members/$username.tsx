import { useState } from 'react'
import {
  ClientOnly,
  Link,
  createFileRoute,
  useNavigate,
} from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { IconArrowLeft } from '@tabler/icons-react'
import { toast } from 'sonner'
import { useGroup } from '#/components/group/group-context'
import { RenameMemberDialog } from '#/components/group/rename-member-dialog'
import { PageHeader, Section } from '#/components/page'
import { LocalDate, RelativeTime } from '#/components/relative-time'
import { StarRating } from '#/components/star-rating'
import { StatusPage } from '#/components/status-page'
import { Button } from '#/components/ui/button'
import { rememberGroup } from '#/db-collections'
import { formatRating } from '#/lib/format'
import { groupPageTitle, groupQuery } from '#/lib/queries'
import { isSameUser, memberStats } from '#/lib/ranking'
import { m } from '#/paraglide/messages'

export const Route = createFileRoute('/g/$groupId/members/$username')({
  loader: async ({ context, params }) => {
    const snapshot = await context.queryClient.ensureQueryData(
      groupQuery(params.groupId),
    )
    return { groupName: snapshot.group.name }
  },
  head: ({ params, loaderData }) => ({
    meta: [{ title: groupPageTitle(params.username, loaderData?.groupName) }],
  }),
  component: MemberPage,
})

function MemberPage() {
  const { groupId, username: memberName } = Route.useParams()
  const navigate = useNavigate()
  const { data } = useSuspenseQuery(groupQuery(groupId))
  const { username } = useGroup()
  const [renameOpen, setRenameOpen] = useState(false)

  const member = data.members.find((item) =>
    isSameUser(item.username, memberName),
  )
  if (!member) {
    return (
      <StatusPage
        title={m.member_not_found_title()}
        description={m.member_not_found_body()}
        action={
          <Button asChild variant="outline">
            <Link to="/g/$groupId/members" params={{ groupId }}>
              {m.member_back()}
            </Link>
          </Button>
        }
      />
    )
  }

  const stats = memberStats([member], data.entries, data.reviews)[0]
  const entriesById = new Map(data.entries.map((entry) => [entry.id, entry]))
  const reviews = data.reviews
    .filter((review) => isSameUser(review.username, member.username))
    .sort((a, b) => b.updatedAt - a.updatedAt)
  const added = data.entries
    .filter((entry) => isSameUser(entry.createdBy, member.username))
    .sort((a, b) => b.createdAt - a.createdAt)
  const isMe = !!username && isSameUser(username, member.username)

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <Link
          to="/g/$groupId/members"
          params={{ groupId }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground no-underline hover:text-foreground"
        >
          <IconArrowLeft aria-hidden="true" className="size-4" />
          {m.member_back()}
        </Link>
        <PageHeader
          title={member.username}
          actions={
            <ClientOnly>
              {!isMe ? (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    rememberGroup(groupId, {
                      groupName: data.group.name,
                      username: member.username,
                    })
                    toast.success(
                      `${m.identity_acting_as()} ${member.username}`,
                    )
                  }}
                >
                  {m.member_this_is_me()}
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="lg"
                onClick={() => setRenameOpen(true)}
              >
                {m.identity_rename()}
              </Button>
            </ClientOnly>
          }
        />
        <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">{m.col_reviews()}</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {stats.reviewCount}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{m.col_entries_added()}</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {stats.entriesAdded}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{m.col_avg_given()}</dt>
            {stats.averageGiven === null ? (
              <dd className="pt-1 text-muted-foreground">
                {m.member_no_reviews()}
              </dd>
            ) : (
              <dd className="text-lg font-semibold tabular-nums">
                {formatRating(stats.averageGiven)}
              </dd>
            )}
          </div>
          <div>
            <dt className="text-muted-foreground">{m.member_joined()}</dt>
            <dd className="text-lg font-semibold">
              <LocalDate timestamp={member.joinedAt} />
            </dd>
          </div>
        </dl>
      </div>

      <Section id="member-reviews" title={m.member_reviews_title()}>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {m.member_no_reviews()}
          </p>
        ) : (
          <ul className="divide-y border-y">
            {reviews.map((review) => {
              const entry = entriesById.get(review.entryId)
              return (
                <li key={review.entryId} className="space-y-1.5 py-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {entry ? (
                      <Link
                        to="/g/$groupId/entries/$entryId"
                        params={{ groupId, entryId: entry.id }}
                        className="font-medium text-foreground hover:underline"
                      >
                        {entry.name}
                      </Link>
                    ) : null}
                    <StarRating value={review.rating} />
                    <RelativeTime
                      timestamp={review.updatedAt}
                      className="text-xs text-muted-foreground"
                    />
                  </div>
                  {review.comment ? (
                    <p className="max-w-prose text-sm whitespace-pre-line text-pretty">
                      {review.comment}
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      <Section id="member-entries" title={m.member_entries_title()}>
        {added.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {m.member_no_entries()}
          </p>
        ) : (
          <ul className="divide-y border-y">
            {added.map((entry) => (
              <li
                key={entry.id}
                className="flex items-baseline justify-between gap-4 py-3"
              >
                <Link
                  to="/g/$groupId/entries/$entryId"
                  params={{ groupId, entryId: entry.id }}
                  className="font-medium text-foreground hover:underline"
                >
                  {entry.name}
                </Link>
                <RelativeTime
                  timestamp={entry.createdAt}
                  className="shrink-0 text-xs text-muted-foreground"
                />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <RenameMemberDialog
        groupId={groupId}
        username={member.username}
        open={renameOpen}
        onOpenChange={setRenameOpen}
        onRenamed={(newUsername) =>
          navigate({
            to: '/g/$groupId/members/$username',
            params: { groupId, username: newUsername },
            replace: true,
          })
        }
      />
    </div>
  )
}
