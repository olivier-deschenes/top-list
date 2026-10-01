import { cn } from '#/lib/utils'

/** Three bars of falling length: a ranking at a glance. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn('size-4 shrink-0', className)}
      fill="currentColor"
    >
      <rect x="4" y="6" width="24" height="5" />
      <rect x="4" y="14" width="17" height="5" />
      <rect x="4" y="22" width="10" height="5" />
    </svg>
  )
}
