import { Link, useMatchRoute } from '@tanstack/react-router'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

const tabClass =
  '-mb-px inline-flex h-10 shrink-0 items-center border-b-2 px-1 text-sm no-underline transition-colors'

export function GroupNav({ groupId }: { groupId: string }) {
  const matchRoute = useMatchRoute()
  const params = { groupId }

  const tabs = [
    {
      to: '/g/$groupId',
      label: m.nav_rankings(),
      active:
        !!matchRoute({ to: '/g/$groupId', params }) ||
        !!matchRoute({ to: '/g/$groupId/entries/$entryId', fuzzy: true }),
    },
    {
      to: '/g/$groupId/members',
      label: m.nav_members(),
      active: !!matchRoute({ to: '/g/$groupId/members', params, fuzzy: true }),
    },
    {
      to: '/g/$groupId/activity',
      label: m.nav_activity(),
      active: !!matchRoute({ to: '/g/$groupId/activity', params }),
    },
    {
      to: '/g/$groupId/settings',
      label: m.nav_settings(),
      active: !!matchRoute({ to: '/g/$groupId/settings', params }),
    },
  ] as const

  return (
    <nav
      aria-label={m.nav_label()}
      className="no-scrollbar -mx-1 overflow-x-auto overflow-y-hidden"
    >
      <ul className="flex gap-5 px-1">
        {tabs.map((tab) => (
          <li key={tab.to}>
            <Link
              to={tab.to}
              params={params}
              aria-current={tab.active ? 'page' : undefined}
              className={cn(
                tabClass,
                tab.active
                  ? 'border-foreground font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
