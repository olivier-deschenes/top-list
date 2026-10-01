import { revalidateLogic } from '@tanstack/react-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { submitHandler, useAppForm } from '#/components/form'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { FieldError, FieldGroup } from '#/components/ui/field'
import { myGroupsCollection, rememberGroup } from '#/db-collections'
import { errorMessage, useRenameMember } from '#/lib/queries'
import { isSameUser } from '#/lib/ranking'
import { LIMITS, usernameSchema } from '#/lib/schemas'
import { m } from '#/paraglide/messages'

const renameSchema = z.object({ newUsername: usernameSchema })

export function RenameMemberDialog({
  groupId,
  username,
  open,
  onOpenChange,
  onRenamed,
}: {
  groupId: string
  username: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onRenamed?: (newUsername: string) => void
}) {
  const renameMember = useRenameMember(groupId)
  const form = useAppForm({
    defaultValues: { newUsername: username },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: renameSchema },
    onSubmit: async ({ value }) => {
      const result = await renameMember.mutateAsync({
        username,
        newUsername: value.newUsername,
      })
      // Follow the rename if this device was acting as that member.
      const mine = myGroupsCollection.get(groupId)
      if (mine?.username && isSameUser(mine.username, username)) {
        rememberGroup(groupId, { username: result.username })
      }
      toast.success(m.member_renamed())
      onOpenChange(false)
      onRenamed?.(result.username)
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) form.reset({ newUsername: username })
        renameMember.reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{m.member_rename_title({ username })}</DialogTitle>
          <DialogDescription>{m.member_rename_body()}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submitHandler(form)} noValidate>
          <FieldGroup>
            <form.AppField name="newUsername">
              {(field) => (
                <field.TextField
                  label={m.field_new_name()}
                  autoComplete="off"
                  maxLength={LIMITS.username}
                />
              )}
            </form.AppField>
            {renameMember.error ? (
              <FieldError>{errorMessage(renameMember.error)}</FieldError>
            ) : null}
          </FieldGroup>
          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="lg">
                {m.cancel()}
              </Button>
            </DialogClose>
            <form.AppForm>
              <form.SubmitButton>{m.save()}</form.SubmitButton>
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
