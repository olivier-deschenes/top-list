import { Link } from '@tanstack/react-router'
import { LogoMark } from '#/components/brand'
import { PageContainer } from '#/components/page'
import { m } from '#/paraglide/messages'

export function AppHeader() {
  return (
    <header className="border-b">
      <PageContainer className="flex h-14 items-center">
        <Link
          to="/"
          className="-mx-1 flex items-center gap-2 px-1 py-1 text-sm font-semibold tracking-tight text-foreground no-underline"
        >
          <LogoMark />
          {m.app_name()}
        </Link>
      </PageContainer>
    </header>
  )
}
