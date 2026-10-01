import { useEffect } from 'react'
import { revalidateLogic } from '@tanstack/react-form'
import { z } from 'zod'
import { submitHandler, useAppForm } from '#/components/form'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { FieldGroup } from '#/components/ui/field'
import { rememberGroup } from '#/db-collections'
import { useLastUsername } from '#/hooks/use-my-groups'
import { useJoinGroup } from '#/lib/queries'
import { isSameUser } from '#/lib/ranking'
import { LIMITS, usernameSchema } from '#/lib/schemas'
import type { Group, Member } from '#/lib/types'
import { m } from '#/paraglide/messages'

const newMemberSchema = z.object({ username: usernameSchema })

/** "Who are you?": pick an existing member or join under a new name. */
export function IdentityDialog({
  group,
  members,
  open,
  onOpenChange,
}: {
  group: Group
  members: Array<Member>
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const joinGroup = useJoinGroup(group.id)
  const lastUsername = useLastUsername()
  const recentFirst = [...members].sort(
    (a, b) => b.lastActiveAt - a.lastActiveAt,
  )

  const actAs = (username: string) => {
    rememberGroup(group.id, {
      groupName: group.name,
      username,
      lastVisitedAt: Date.now(),
    })
    onOpenChange(false)
  }

  const form = useAppForm({
    defaultValues: { username: '' },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: newMemberSchema },
    onSubmit: async ({ value }) => {
      const { username } = await joinGroup.mutateAsync(value.username)
      actAs(username)
      form.reset()
    },
  })

  // Suggest the name used elsewhere, unless it already belongs to someone here.
  useEffect(() => {
    const taken = members.some((member) =>
      isSameUser(member.username, lastUsername),
    )
    if (open && lastUsername && !taken && !form.getFieldValue('username')) {
      form.setFieldValue('username', lastUsername, { dontUpdateMeta: true })
    }
  }, [form, lastUsername, members, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{m.identity_title()}</DialogTitle>
          <DialogDescription>{m.identity_body()}</DialogDescription>
        </DialogHeader>

        {recentFirst.length > 0 ? (
          <section aria-labelledby="identity-pick" className="space-y-2">
            <h3
              id="identity-pick"
              className="text-xs font-medium text-muted-foreground"
            >
              {m.identity_pick()}
            </h3>
            <ul className="flex flex-wrap gap-2">
              {recentFirst.map((member) => (
                <li key={member.username}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => actAs(member.username)}
                  >
                    {member.username}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <form onSubmit={submitHandler(form)} noValidate className="space-y-3">
          <FieldGroup>
            <form.AppField name="username">
              {(field) => (
                <field.TextField
                  label={
                    recentFirst.length > 0
                      ? m.identity_new()
                      : m.field_your_name()
                  }
                  placeholder={m.field_your_name_placeholder()}
                  autoComplete="nickname"
                  maxLength={LIMITS.username}
                />
              )}
            </form.AppField>
          </FieldGroup>
          <form.AppForm>
            <form.SubmitButton>{m.identity_join()}</form.SubmitButton>
          </form.AppForm>
        </form>
      </DialogContent>
    </Dialog>
  )
}
