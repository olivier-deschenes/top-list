import { useState } from 'react'
import { useHydrated } from '@tanstack/react-router'
import { IconCheck, IconCopy, IconShare } from '@tabler/icons-react'
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
      </DialogContent>
    </Dialog>
  )
}
