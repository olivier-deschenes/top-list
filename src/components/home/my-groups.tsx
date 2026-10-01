import { Link } from '@tanstack/react-router'
import { Section } from '#/components/page'
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
import { useMyGroups } from '#/hooks/use-my-groups'
import { m } from '#/paraglide/messages'

/** Groups remembered on this device. Rendered after hydration only. */
export function MyGroups() {
  const { groups, ready } = useMyGroups()
  if (!ready) return null

  return (
    <Section id="your-groups" title={m.your_groups_title()}>
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">{m.your_groups_empty()}</p>
      ) : (
        <Table className="text-sm">
          <TableCaption className="sr-only">
            {m.your_groups_caption()}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-0">{m.col_group()}</TableHead>
              <TableHead>{m.col_you_are()}</TableHead>
              <TableHead className="pr-0 text-right">
                {m.col_last_visit()}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.groupId}>
                <TableCell className="pl-0 font-medium whitespace-normal">
                  <Link
                    to="/g/$groupId"
                    params={{ groupId: group.groupId }}
                    className="text-foreground hover:underline"
                  >
                    {group.groupName || group.groupId}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {group.username ?? ''}
                </TableCell>
                <TableCell className="pr-0 text-right text-muted-foreground tabular-nums">
                  <RelativeTime timestamp={group.lastVisitedAt} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Section>
  )
}
