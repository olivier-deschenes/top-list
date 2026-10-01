import { useNavigate } from '@tanstack/react-router'
import { revalidateLogic } from '@tanstack/react-form'
import { z } from 'zod'
import { submitHandler, useAppForm } from '#/components/form'
import { FieldGroup } from '#/components/ui/field'
import { parseGroupId } from '#/lib/group-id'
import { m } from '#/paraglide/messages'

const joinSchema = z.object({
  link: z.string().refine((value) => parseGroupId(value) !== null, {
    error: () => m.validation_group_link(),
  }),
})

export function JoinGroupForm() {
  const navigate = useNavigate()
  const form = useAppForm({
    defaultValues: { link: '' },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: joinSchema },
    onSubmit: async ({ value }) => {
      const groupId = parseGroupId(value.link)
      if (groupId) await navigate({ to: '/g/$groupId', params: { groupId } })
    },
  })

  return (
    <form onSubmit={submitHandler(form)} noValidate>
      <FieldGroup>
        <form.AppField name="link">
          {(field) => (
            <field.TextField
              label={m.field_group_link()}
              placeholder="https://…/g/3f2b8c1e-…"
              autoComplete="off"
              inputMode="url"
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton variant="outline" className="w-full sm:w-fit">
            {m.join_group_submit()}
          </form.SubmitButton>
        </form.AppForm>
      </FieldGroup>
    </form>
  )
}
