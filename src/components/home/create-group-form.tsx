import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { revalidateLogic } from '@tanstack/react-form'
import { submitHandler, useAppForm } from '#/components/form'
import { FieldGroup } from '#/components/ui/field'
import { rememberGroup } from '#/db-collections'
import { useLastUsername } from '#/hooks/use-my-groups'
import { useCreateGroup } from '#/lib/queries'
import { LIMITS, createGroupInput } from '#/lib/schemas'
import { m } from '#/paraglide/messages'

export function CreateGroupForm() {
  const navigate = useNavigate()
  const createGroup = useCreateGroup()
  const lastUsername = useLastUsername()

  const form = useAppForm({
    defaultValues: { name: '', description: '', username: '' },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: createGroupInput },
    onSubmit: async ({ value }) => {
      const { id, username } = await createGroup.mutateAsync(value)
      rememberGroup(id, {
        groupName: value.name.trim(),
        username,
        lastVisitedAt: Date.now(),
      })
      await navigate({
        to: '/g/$groupId',
        params: { groupId: id },
        search: { invite: true },
      })
    },
  })

  // Prefill the name used last time, once local storage is readable.
  useEffect(() => {
    if (lastUsername && !form.getFieldValue('username')) {
      form.setFieldValue('username', lastUsername, { dontUpdateMeta: true })
    }
  }, [form, lastUsername])

  return (
    <form onSubmit={submitHandler(form)} noValidate>
      <FieldGroup>
        <form.AppField name="name">
          {(field) => (
            <field.TextField
              label={m.field_group_name()}
              placeholder={m.field_group_name_placeholder()}
              maxLength={LIMITS.groupName}
            />
          )}
        </form.AppField>
        <form.AppField name="description">
          {(field) => (
            <field.TextField
              label={m.field_description()}
              placeholder={m.field_description_placeholder()}
              maxLength={LIMITS.description}
              optional
            />
          )}
        </form.AppField>
        <form.AppField name="username">
          {(field) => (
            <field.TextField
              label={m.field_your_name()}
              placeholder={m.field_your_name_placeholder()}
              autoComplete="nickname"
              maxLength={LIMITS.username}
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton className="w-full sm:w-fit">
            {m.create_group_submit()}
          </form.SubmitButton>
        </form.AppForm>
      </FieldGroup>
    </form>
  )
}
