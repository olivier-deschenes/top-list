import { useId } from 'react'
import { revalidateLogic } from '@tanstack/react-form'
import { submitHandler, useAppForm } from '#/components/form'
import { TagInput } from '#/components/entries/tag-input'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
import { LIMITS, entryFieldsSchema } from '#/lib/schemas'
import type { EntryFieldsInput } from '#/lib/schemas'
import type { Entry } from '#/lib/types'
import { m } from '#/paraglide/messages'

interface EntryFormValues {
  name: string
  address: string
  notes: string
  url: string
  tags: Array<string>
}

const emptyValues: EntryFormValues = {
  name: '',
  address: '',
  notes: '',
  url: '',
  tags: [],
}

const toValues = (entry: Entry | undefined): EntryFormValues =>
  entry
    ? {
        name: entry.name,
        address: entry.address ?? '',
        notes: entry.notes ?? '',
        url: entry.url ?? '',
        tags: entry.tags,
      }
    : emptyValues

/** Add or edit an entry. Mount with a `key` so it resets per entry. */
export function EntryFormDialog({
  entry,
  tagSuggestions,
  open,
  onOpenChange,
  onSubmit,
  focusAddress = false,
}: {
  entry?: Entry
  tagSuggestions: Array<string>
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: EntryFieldsInput) => Promise<void>
  /** Starts in the address field instead of the name. */
  focusAddress?: boolean
}) {
  const tagsId = useId()
  const form = useAppForm({
    defaultValues: toValues(entry),
    validationLogic: revalidateLogic(),
    validators: { onDynamic: entryFieldsSchema },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
      form.reset(toValues(entry))
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset(toValues(entry))
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {entry ? m.entry_edit_title() : m.entry_add_title()}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submitHandler(form)} noValidate>
          <FieldGroup>
            <form.AppField name="name">
              {(field) => (
                <field.TextField
                  label={m.field_entry_name()}
                  placeholder={m.field_entry_name_placeholder()}
                  maxLength={LIMITS.entryName}
                  autoComplete="off"
                />
              )}
            </form.AppField>
            <form.AppField name="address">
              {(field) => (
                <field.TextField
                  label={m.field_address()}
                  description={m.field_address_hint()}
                  placeholder={m.field_address_placeholder()}
                  maxLength={LIMITS.address}
                  autoComplete="off"
                  autoFocus={focusAddress}
                  optional
                />
              )}
            </form.AppField>
            <form.AppField name="url">
              {(field) => (
                <field.TextField
                  label={m.field_link()}
                  placeholder={m.field_link_placeholder()}
                  maxLength={LIMITS.url}
                  inputMode="url"
                  autoComplete="url"
                  optional
                />
              )}
            </form.AppField>
            <form.AppField name="tags">
              {(field) => {
                const invalid = !field.state.meta.isValid
                return (
                  <Field data-invalid={invalid || undefined}>
                    <FieldLabel htmlFor={tagsId}>
                      {m.field_tags()}{' '}
                      <span className="font-normal text-muted-foreground">
                        {m.optional()}
                      </span>
                    </FieldLabel>
                    <TagInput
                      id={tagsId}
                      value={field.state.value}
                      onChange={field.handleChange}
                      onBlur={field.handleBlur}
                      suggestions={tagSuggestions}
                      invalid={invalid}
                      describedBy={`${tagsId}-description`}
                    />
                    <FieldDescription id={`${tagsId}-description`}>
                      {m.field_tags_hint()}
                    </FieldDescription>
                    {invalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                )
              }}
            </form.AppField>
            <form.AppField name="notes">
              {(field) => (
                <field.TextareaField
                  label={m.field_notes()}
                  placeholder={m.field_notes_placeholder()}
                  maxLength={LIMITS.notes}
                  optional
                />
              )}
            </form.AppField>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="lg">
                {m.cancel()}
              </Button>
            </DialogClose>
            <form.AppForm>
              <form.SubmitButton>
                {entry ? m.save() : m.entry_add_title()}
              </form.SubmitButton>
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
