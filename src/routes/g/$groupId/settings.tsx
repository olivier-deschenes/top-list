import { useId, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { revalidateLogic } from '@tanstack/react-form'
import { toast } from 'sonner'
import { submitHandler, useAppForm } from '#/components/form'
import { useGroup } from '#/components/group/group-context'
import { ShareLink } from '#/components/group/invite'
import { PageHeader, Section } from '#/components/page'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '#/components/ui/alert-dialog'
import { Button } from '#/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { forgetGroup } from '#/db-collections'
import {
  groupPageTitle,
  groupQuery,
  useDeleteGroup,
  useUpdateGroup,
} from '#/lib/queries'
import { LIMITS, groupDetailsSchema } from '#/lib/schemas'
import { m } from '#/paraglide/messages'

export const Route = createFileRoute('/g/$groupId/settings')({
  loader: async ({ context, params }) => {
    const snapshot = await context.queryClient.ensureQueryData(
      groupQuery(params.groupId),
    )
    return { groupName: snapshot.group.name }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: groupPageTitle(m.settings_title(), loaderData?.groupName) },
    ],
  }),
  component: Settings,
})

function Settings() {
  const { groupId } = Route.useParams()
  const navigate = useNavigate()
  const { data } = useSuspenseQuery(groupQuery(groupId))
  const { group } = data

  return (
    <div className="max-w-2xl space-y-12">
      <PageHeader title={m.settings_title()} />

      <Section id="settings-details" title={m.settings_details_title()}>
        <GroupDetailsForm
          key={group.updatedAt}
          groupId={groupId}
          name={group.name}
          description={group.description ?? ''}
        />
      </Section>

      <Section
        id="settings-invite"
        title={m.settings_invite_title()}
        description={m.invite_hint()}
      >
        <ShareLink groupId={groupId} groupName={group.name} />
        <p className="text-xs text-muted-foreground">
          {m.group_id_label()}{' '}
          <code className="font-mono text-foreground">{groupId}</code>
        </p>
      </Section>

      <Section
        id="settings-device"
        title={m.settings_device_title()}
        description={m.settings_device_body()}
      >
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            forgetGroup(groupId)
            toast.success(m.settings_forgotten())
            void navigate({ to: '/' })
          }}
        >
          {m.identity_forget()}
        </Button>
      </Section>

      <Section
        id="settings-delete"
        title={m.settings_danger_title()}
        description={m.settings_danger_body()}
        className="border-t pt-8"
      >
        <DeleteGroup groupId={groupId} groupName={group.name} />
      </Section>
    </div>
  )
}

function GroupDetailsForm({
  groupId,
  name,
  description,
}: {
  groupId: string
  name: string
  description: string
}) {
  const { requireIdentity } = useGroup()
  const updateGroup = useUpdateGroup(groupId)
  const form = useAppForm({
    defaultValues: { name, description },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: groupDetailsSchema },
    onSubmit: async ({ value }) => {
      const username = requireIdentity()
      if (!username) return
      await updateGroup.mutateAsync({ ...value, username })
      toast.success(m.settings_saved())
    },
  })

  return (
    <form onSubmit={submitHandler(form)} noValidate>
      <FieldGroup>
        <form.AppField name="name">
          {(field) => (
            <field.TextField
              label={m.field_group_name()}
              maxLength={LIMITS.groupName}
            />
          )}
        </form.AppField>
        <form.AppField name="description">
          {(field) => (
            <field.TextField
              label={m.field_description()}
              maxLength={LIMITS.description}
              optional
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton className="w-fit">{m.save()}</form.SubmitButton>
        </form.AppForm>
      </FieldGroup>
    </form>
  )
}

function DeleteGroup({
  groupId,
  groupName,
}: {
  groupId: string
  groupName: string
}) {
  const navigate = useNavigate()
  const { requireIdentity } = useGroup()
  const deleteGroup = useDeleteGroup(groupId)
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const confirmId = useId()
  const confirmed = confirmation.trim() === groupName

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setConfirmation('')
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="lg" className="w-fit">
          {m.settings_delete_submit()}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{m.settings_danger_title()}</AlertDialogTitle>
          <AlertDialogDescription>
            {m.settings_danger_body()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Field>
          <FieldLabel htmlFor={confirmId}>
            {m.settings_delete_confirm_label({ name: groupName })}
          </FieldLabel>
          <Input
            id={confirmId}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            className="h-9 text-base md:text-sm"
          />
        </Field>
        <AlertDialogFooter>
          <AlertDialogCancel>{m.cancel()}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!confirmed || deleteGroup.isPending}
            onClick={async (event) => {
              event.preventDefault()
              const username = requireIdentity()
              if (!username) return
              await deleteGroup.mutateAsync(username)
              forgetGroup(groupId)
              toast.success(m.settings_deleted())
              await navigate({ to: '/' })
            }}
          >
            {m.settings_delete_submit()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
