import { useId } from 'react'
import type { ReactNode } from 'react'
import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import { Button } from '#/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Spinner } from '#/components/ui/spinner'
import { Textarea } from '#/components/ui/textarea'
import { m } from '#/paraglide/messages'

// App-wide TanStack Form setup: shadcn field components bound to form state.
// Forms use `revalidateLogic()`, so errors appear after the first submit
// and then update as people type.

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()

interface TextFieldProps {
  label: ReactNode
  description?: ReactNode
  placeholder?: string
  optional?: boolean
  autoComplete?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  autoFocus?: boolean
  maxLength?: number
}

function FieldLabelText({
  label,
  optional,
}: {
  label: ReactNode
  optional?: boolean
}) {
  return (
    <>
      {label}
      {optional ? ' ' : null}
      {optional ? (
        <span className="font-normal text-muted-foreground">
          {m.optional()}
        </span>
      ) : null}
    </>
  )
}

function TextField({
  label,
  description,
  optional,
  ...inputProps
}: TextFieldProps) {
  const field = useFieldContext<string>()
  const id = useId()
  const invalid = !field.state.meta.isValid
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={id}>
        <FieldLabelText label={label} optional={optional} />
      </FieldLabel>
      <Input
        id={id}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        aria-invalid={invalid || undefined}
        aria-describedby={description ? `${id}-description` : undefined}
        className="h-9 text-base md:text-sm"
        {...inputProps}
      />
      {description ? (
        <FieldDescription id={`${id}-description`}>
          {description}
        </FieldDescription>
      ) : null}
      {invalid ? <FieldError errors={field.state.meta.errors} /> : null}
    </Field>
  )
}

function TextareaField({
  label,
  description,
  optional,
  placeholder,
  rows = 3,
  maxLength,
}: Omit<TextFieldProps, 'autoComplete' | 'inputMode'> & { rows?: number }) {
  const field = useFieldContext<string>()
  const id = useId()
  const invalid = !field.state.meta.isValid
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={id}>
        <FieldLabelText label={label} optional={optional} />
      </FieldLabel>
      <Textarea
        id={id}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        aria-invalid={invalid || undefined}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="text-base md:text-sm"
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {invalid ? <FieldError errors={field.state.meta.errors} /> : null}
    </Field>
  )
}

function SubmitButton({
  children,
  variant,
  className,
}: {
  children: ReactNode
  variant?: React.ComponentProps<typeof Button>['variant']
  className?: string
}) {
  const form = useFormContext()
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button
          type="submit"
          size="lg"
          variant={variant}
          disabled={isSubmitting}
          aria-busy={isSubmitting || undefined}
          className={className}
        >
          {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
          {children}
        </Button>
      )}
    </form.Subscribe>
  )
}

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, TextareaField },
  formComponents: { SubmitButton },
})

/**
 * Standard submit wiring for a TanStack form element. Failed submits are
 * already reported by the mutation (toast or inline error), so the rejected
 * promise is handled here instead of surfacing as unhandled.
 */
export function submitHandler(form: { handleSubmit: () => Promise<void> }) {
  return (event: React.FormEvent) => {
    event.preventDefault()
    event.stopPropagation()
    form.handleSubmit().catch(() => {})
  }
}
