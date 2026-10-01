import { ClientOnly, Link, createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useGroup } from '#/components/group/group-context'
import { PageHeader } from '#/components/page'
import { RelativeTime } from '#/components/relative-time'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { formatRating } from '#/lib/format'
import { groupPageTitle, groupQuery } from '#/lib/queries'
import { isSameUser, memberStats } from '#/lib/ranking'
import { m } from '#/paraglide/messages'

export const Route = createFileRoute('/g/$groupId/members/')({
  loader: async ({ context, params }) => {
    const snapshot = await context.queryClient.ensureQueryData(
      groupQuery(params.groupId),
    )
    return { groupName: snapshot.group.name }
  },
  head: ({ loaderData }) => ({
    meta: [{ title: groupPageTitle(m.members_title(), loaderData?.groupName) }],
  }),
  component: Members,
})

function Members() {
  const { groupId } = Route.useParams()
  const { data } = useSuspenseQuery(groupQuery(groupId))
  const { username } = useGroup()
  const stats = memberStats(data.members, data.entries, data.reviews).sort(
    (a, b) => b.member.lastActiveAt - a.member.lastActiveAt,
  )

  const head = 'h-9 text-xs font-medium text-muted-foreground'

  return (
    <div className="space-y-6">
      <PageHeader title={m.members_title()} />
      <Table className="text-sm">
        <TableCaption className="mt-4 text-left text-xs text-muted-foreground">
          {m.members_caption()}
        </TableCaption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={`${head} pl-0`}>{m.col_member()}</TableHead>
            <TableHead className={`${head} text-right`}>
              {m.col_reviews()}
            </TableHead>
            <TableHead className={`${head} text-right`}>
              {m.col_entries_added()}
            </TableHead>
            <TableHead className={`${head} hidden text-right sm:table-cell`}>
              {m.col_avg_given()}
            </TableHead>
            <TableHead
              className={`${head} hidden pr-0 text-right sm:table-cell`}
            >
              {m.col_last_active()}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stats.map(({ member, reviewCount, entriesAdded, averageGiven }) => (
            <TableRow key={member.username}>
              <TableCell className="py-3 pl-0 whitespace-normal">
                <Link
                  to="/g/$groupId/members/$username"
                  params={{ groupId, username: member.username }}
                  className="font-medium text-foreground hover:underline"
                >
                  {member.username}
                </Link>
                <ClientOnly>
                  {username && isSameUser(username, member.username) ? (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {m.member_you()}
                    </span>
                  ) : null}
                </ClientOnly>
              </TableCell>
              <TableCell className="py-3 text-right tabular-nums">
                {reviewCount}
              </TableCell>
              <TableCell className="py-3 text-right tabular-nums">
                {entriesAdded}
              </TableCell>
              <TableCell className="hidden py-3 text-right tabular-nums sm:table-cell">
                {averageGiven === null ? '' : formatRating(averageGiven)}
              </TableCell>
              <TableCell className="hidden py-3 pr-0 text-right text-muted-foreground sm:table-cell">
                <RelativeTime timestamp={member.lastActiveAt} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
