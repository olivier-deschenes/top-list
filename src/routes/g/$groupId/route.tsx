import { useEffect, useState } from 'react'
import {
  ClientOnly,
  Link,
  Outlet,
  createFileRoute,
  notFound,
  useNavigate,
} from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { IconUserPlus } from '@tabler/icons-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { GroupContext } from '#/components/group/group-context'
import type { GroupContextValue } from '#/components/group/group-context'
import { GroupNav } from '#/components/group/group-nav'
import { IdentityDialog } from '#/components/group/identity-dialog'
import { IdentityMenu } from '#/components/group/identity-menu'
import { InviteDialog } from '#/components/group/invite'
import { RenameMemberDialog } from '#/components/group/rename-member-dialog'
import { PageContainer } from '#/components/page'
import { StatusPage } from '#/components/status-page'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { forgetGroup, rememberGroup } from '#/db-collections'
import { useIdentity } from '#/hooks/use-my-groups'
import { groupQuery } from '#/lib/queries'
import { groupIdSchema } from '#/lib/schemas'
import { m } from '#/paraglide/messages'

export const Route = createFileRoute('/g/$groupId')({
  validateSearch: z.object({
    /** Set right after creating a group to open the invite dialog. */
    invite: z.boolean().optional().catch(undefined),
  }),
  loader: async ({ context, params }) => {
    if (!groupIdSchema.safeParse(params.groupId).success) throw notFound()
    const snapshot = await context.queryClient.ensureQueryData(
      groupQuery(params.groupId),
    )
    return { groupName: snapshot.group.name }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.groupName} · ${m.app_name()}`
          : m.app_name(),
      },
      // Group links are private; keep them out of search engines.
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  notFoundComponent: GroupNotFound,
  component: GroupLayout,
})

function GroupLayout() {
  const { groupId } = Route.useParams()
  const { invite } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data } = useSuspenseQuery(groupQuery(groupId))
  const { username, ready } = useIdentity(groupId)

  const [identityOpen, setIdentityOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)

  // Remember the group on this device (and pick up renames).
  useEffect(() => {
    rememberGroup(groupId, {
      groupName: data.group.name,
      lastVisitedAt: Date.now(),
    })
  }, [groupId, data.group.name])

  // First visit from this device: ask who they are.
  useEffect(() => {
    if (ready && !username) setIdentityOpen(true)
  }, [ready, username])

  // Just created: offer the invite link once, then clean the URL.
  useEffect(() => {
    if (!invite) return
    setInviteOpen(true)
    void navigate({
      search: (prev) => ({ ...prev, invite: undefined }),
      replace: true,
    })
  }, [invite, navigate])

  const context: GroupContextValue = {
    groupId,
    username,
    identityReady: ready,
    chooseIdentity: () => setIdentityOpen(true),
    requireIdentity: () => {
      if (username) return username
      setIdentityOpen(true)
      return null
    },
  }

  return (
    <GroupContext.Provider value={context}>
      <div className="border-b">
        <PageContainer className="space-y-4 pt-6 sm:pt-8">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <div className="min-w-0 space-y-1">
              <Link
                to="/g/$groupId"
                params={{ groupId }}
                className="text-lg font-semibold tracking-tight text-foreground no-underline hover:underline"
              >
                {data.group.name}
              </Link>
              {data.group.description ? (
                <p className="max-w-prose text-sm text-pretty text-muted-foreground">
                  {data.group.description}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <ClientOnly fallback={<Skeleton className="h-9 w-28" />}>
                <IdentityMenu
                  username={username}
                  onSwitch={() => setIdentityOpen(true)}
                  onRename={() => setRenameOpen(true)}
                  onForget={() => {
                    forgetGroup(groupId)
                    toast.success(m.settings_forgotten())
                    void navigate({ to: '/' })
                  }}
                />
              </ClientOnly>
              <Button size="lg" onClick={() => setInviteOpen(true)}>
                <IconUserPlus data-icon="inline-start" aria-hidden="true" />
                {m.invite_button()}
              </Button>
            </div>
          </div>
          <GroupNav groupId={groupId} />
        </PageContainer>
      </div>

      <PageContainer className="py-8 sm:py-10">
        <Outlet />
      </PageContainer>

      <IdentityDialog
        group={data.group}
        members={data.members}
        open={identityOpen}
        onOpenChange={setIdentityOpen}
      />
      <InviteDialog
        groupId={groupId}
        groupName={data.group.name}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />
      {username ? (
        <RenameMemberDialog
          groupId={groupId}
          username={username}
          open={renameOpen}
          onOpenChange={setRenameOpen}
        />
      ) : null}
    </GroupContext.Provider>
  )
}

function GroupNotFound() {
  const { groupId } = Route.useParams()

  // A deleted group shouldn't linger in "Your groups".
  useEffect(() => {
    forgetGroup(groupId)
  }, [groupId])

  return (
    <StatusPage
      title={m.group_not_found_title()}
      description={m.group_not_found_body()}
      action={
        <Button asChild variant="outline">
          <Link to="/">{m.back_home()}</Link>
        </Button>
      }
    />
  )
}
