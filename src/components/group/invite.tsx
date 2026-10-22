import { useState } from 'react'
import { useHydrated } from '@tanstack/react-router'
import { IconCheck, IconCopy, IconShare } from '@tabler/icons-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
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
      </DialogContent>
    </Dialog>
  )
}
