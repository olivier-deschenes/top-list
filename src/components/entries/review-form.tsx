import { useId } from 'react'
import { revalidateLogic } from '@tanstack/react-form'
import { toast } from 'sonner'
import { submitHandler, useAppForm } from '#/components/form'
import { StarRatingInput } from '#/components/star-rating'
import { Button } from '#/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
import { useDeleteReview, useSaveReview } from '#/lib/queries'
import { LIMITS, reviewFieldsSchema } from '#/lib/schemas'
import type { Review } from '#/lib/types'
import { m } from '#/paraglide/messages'

/**
 * The viewer's review of one entry. Remount it (via `key`) when the saved
 * review changes so it starts from the stored values.
 */
export function ReviewForm({
  groupId,
  entryId,
  username,
  existing,
}: {
  groupId: string
  entryId: string
  username: string
  existing: Review | undefined
}) {
  const ratingLabelId = useId()
  const saveReview = useSaveReview(groupId)
  const deleteReview = useDeleteReview(groupId)

  const form = useAppForm({
    // 0 means "no stars picked yet" and fails validation.
    defaultValues: {
      rating: existing?.rating ?? 0,
      comment: existing?.comment ?? '',
    },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: reviewFieldsSchema },
    onSubmit: async ({ value }) => {
      await saveReview.mutateAsync({ entryId, username, ...value })
      toast.success(m.review_saved())
    },
  })

  return (
    <form onSubmit={submitHandler(form)} noValidate className="max-w-xl">
      <FieldGroup>
        <form.Field name="rating">
          {(field) => {
            const invalid = !field.state.meta.isValid
            return (
              <Field data-invalid={invalid || undefined}>
                <FieldLabel id={ratingLabelId} asChild>
                  <span>{m.field_rating()}</span>
                </FieldLabel>
                <StarRatingInput
                  name={field.name}
                  value={field.state.value || null}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  invalid={invalid}
                  aria-labelledby={ratingLabelId}
                />
                {invalid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : null}
              </Field>
            )
          }}
        </form.Field>
        <form.AppField name="comment">
          {(field) => (
            <field.TextareaField
              label={m.field_comment()}
              placeholder={m.field_comment_placeholder()}
              maxLength={LIMITS.comment}
              optional
            />
          )}
        </form.AppField>
        <div className="flex flex-wrap gap-2">
          <form.AppForm>
            <form.SubmitButton>{m.review_save()}</form.SubmitButton>
          </form.AppForm>
          {existing ? (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              disabled={deleteReview.isPending}
              // mutateAsync: this form remounts once the review is gone,
              // which would drop a mutate()-level onSuccess callback.
              onClick={() =>
                deleteReview
                  .mutateAsync({ entryId, username })
                  .then(() => toast.success(m.review_deleted()))
                  .catch(() => {})
              }
            >
              {m.review_delete()}
            </Button>
          ) : null}
        </div>
      </FieldGroup>
    </form>
  )
}
