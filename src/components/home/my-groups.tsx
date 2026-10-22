import { Link } from '@tanstack/react-router'
import { IconX } from '@tabler/icons-react'
import { toast } from 'sonner'
import { Section } from '#/components/page'
import { RelativeTime } from '#/components/relative-time'
import { Button } from '#/components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { forgetGroup, rememberGroup } from '#/db-collections'
import type { MyGroup } from '#/db-collections'
import { useMyGroups } from '#/hooks/use-my-groups'
import { m } from '#/paraglide/messages'

/** Removes the group from this device, with a toast to put it back. */
function forgetWithUndo({ groupId, ...rest }: MyGroup) {
  forgetGroup(groupId)
  toast.success(m.settings_forgotten(), {
    action: { label: m.undo(), onClick: () => rememberGroup(groupId, rest) },
  })
}

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
              <TableHead className="text-right">{m.col_last_visit()}</TableHead>
              <TableHead className="w-px pr-0">
                <span className="sr-only">{m.col_actions()}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => {
              const forgetLabel = m.your_groups_forget({
                name: group.groupName || group.groupId,
              })
              return (
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
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    <RelativeTime timestamp={group.lastVisitedAt} />
                  </TableCell>
                  <TableCell className="pr-0 text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={forgetLabel}
                          onClick={() => forgetWithUndo(group)}
                          className="text-muted-foreground"
                        >
                          <IconX aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{forgetLabel}</TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </Section>
  )
}
