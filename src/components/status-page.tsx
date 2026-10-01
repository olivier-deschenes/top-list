import type { ReactNode } from 'react'
import { PageContainer } from '#/components/page'

/** Full-page message for not-found and error states. */
export function StatusPage({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <PageContainer className="py-16 sm:py-24">
      <div className="max-w-md space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-base text-muted-foreground">{description}</p>
        {action ? <div className="pt-3">{action}</div> : null}
      </div>
    </PageContainer>
  )
}
