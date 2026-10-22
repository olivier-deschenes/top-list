import { useState } from 'react'
import { useHydrated } from '@tanstack/react-router'
import { revalidateLogic } from '@tanstack/react-form'
import { IconCheck, IconCopy, IconShare } from '@tabler/icons-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { submitHandler, useAppForm } from '#/components/form'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '#/components/ui/input-group'
import { useEmailGroupLink } from '#/lib/queries'
import { LIMITS, emailLinkSchema } from '#/lib/schemas'
import { m } from '#/paraglide/messages'

function useGroupUrl(groupId: string) {
  const hydrated = useHydrated()
  const path = `/g/${groupId}`
  return hydrated ? new URL(path, window.location.origin).href : path
}

/** Read-only group link with copy (and native share where available). */
export function ShareLink({
  groupId,
  groupName,
}: {
  groupId: string
  groupName: string
}) {
  const url = useGroupUrl(groupId)
  const hydrated = useHydrated()
  const [copied, setCopied] = useState(false)
  const canShare = hydrated && typeof navigator.share === 'function'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success(m.invite_copied())
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(m.error_generic())
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <InputGroup className="h-9">
        <InputGroupInput
          readOnly
          value={url}
          aria-label={m.invite_link_label()}
          onFocus={(event) => event.currentTarget.select()}
          className="font-mono text-xs"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton onClick={copy} size="sm">
            {copied ? (
              <IconCheck aria-hidden="true" />
            ) : (
              <IconCopy aria-hidden="true" />
            )}
            {m.invite_copy()}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {canShare ? (
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            navigator.share({ title: groupName, url }).catch(() => {})
          }}
        >
          <IconShare data-icon="inline-start" aria-hidden="true" />
          {m.invite_share()}
        </Button>
      ) : null}
    </div>
  )
}

/**
 * The group link as a QR code, for opening it on a phone nearby. Always dark
 * on white, since some scanners can't read inverted codes.
 */
function GroupQrCode({ groupId }: { groupId: string }) {
  const url = useGroupUrl(groupId)
  return (
    <div className="flex items-center gap-4">
      <div className="shrink-0 bg-white p-2 ring-1 ring-foreground/10">
        <QRCodeSVG
          value={url}
          size={112}
          marginSize={0}
          role="img"
          aria-label={m.invite_qr_label()}
        />
      </div>
      <p className="text-sm text-pretty text-muted-foreground">
        {m.invite_qr_hint()}
      </p>
    </div>
  )
}

/** Sends the group link to an address, so it can be found again anywhere. */
export function EmailLinkForm({ groupId }: { groupId: string }) {
  const emailLink = useEmailGroupLink(groupId)
  const form = useAppForm({
    defaultValues: { email: '' },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: emailLinkSchema },
    onSubmit: async ({ value, formApi }) => {
      const email = value.email.trim()
      await emailLink.mutateAsync(email)
      toast.success(m.email_link_sent({ email }))
      formApi.reset()
    },
  })

  return (
    <form onSubmit={submitHandler(form)} noValidate className="space-y-3">
      <form.AppField name="email">
        {(field) => (
          <field.TextField
            label={m.email_link_label()}
            description={m.email_link_hint()}
            placeholder={m.email_link_placeholder()}
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={LIMITS.email}
          />
        )}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton variant="outline" className="w-fit">
          {m.email_link_send()}
        </form.SubmitButton>
      </form.AppForm>
    </form>
  )
}

export function InviteDialog({
  groupId,
  groupName,
  open,
  onOpenChange,
}: {
  groupId: string
  groupName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{m.invite_title()}</DialogTitle>
          <DialogDescription>{m.invite_hint()}</DialogDescription>
        </DialogHeader>
        <ShareLink groupId={groupId} groupName={groupName} />
        <GroupQrCode groupId={groupId} />
        <div className="border-t pt-4">
          <EmailLinkForm groupId={groupId} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
