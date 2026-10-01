import { IconChevronDown, IconUser } from '@tabler/icons-react'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { m } from '#/paraglide/messages'

export function IdentityMenu({
  username,
  onSwitch,
  onRename,
  onForget,
}: {
  username: string | null
  onSwitch: () => void
  onRename: () => void
  onForget: () => void
}) {
  if (!username) {
    return (
      <Button variant="outline" size="lg" onClick={onSwitch}>
        <IconUser data-icon="inline-start" aria-hidden="true" />
        {m.identity_choose()}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="max-w-56"
          aria-label={`${m.identity_acting_as()} ${username}`}
        >
          <IconUser data-icon="inline-start" aria-hidden="true" />
          <span className="truncate">{username}</span>
          <IconChevronDown data-icon="inline-end" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="font-normal text-muted-foreground">
          {m.identity_acting_as()}{' '}
          <span className="font-medium text-foreground">{username}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSwitch}>
          {m.identity_switch()}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onRename}>
          {m.identity_rename()}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onForget}>
          {m.identity_forget()}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
