import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import { AppFooter } from '#/components/app-footer'
import { AppHeader } from '#/components/app-header'
import { StatusPage } from '#/components/status-page'
import { Button } from '#/components/ui/button'
import { Toaster } from '#/components/ui/sonner'
import { TooltipProvider } from '#/components/ui/tooltip'
import { m } from '#/paraglide/messages'
import { getLocale } from '#/paraglide/runtime'

import appCss from '../styles.css?url'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async () => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', getLocale())
    }
  },

  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: m.app_name() },
      { name: 'description', content: m.app_description() },
      {
        name: 'theme-color',
        content: '#ffffff',
        media: '(prefers-color-scheme: light)',
      },
      {
        name: 'theme-color',
        content: '#0a0a0a',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: () => (
    <StatusPage
      title={m.not_found_title()}
      description={m.not_found_body()}
      action={
        <Button asChild variant="outline">
          <Link to="/">{m.back_home()}</Link>
        </Button>
      }
    />
  ),
  errorComponent: RootError,
})

function RootError({ reset }: ErrorComponentProps) {
  const router = useRouter()
  return (
    <StatusPage
      title={m.error_title()}
      description={m.error_generic()}
      action={
        <Button
          variant="outline"
          onClick={() => {
            reset()
            void router.invalidate()
          }}
        >
          {m.error_retry()}
        </Button>
      }
    />
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang={getLocale()}>
      <head>
        <HeadContent />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only z-50 bg-background px-3 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:ring-2 focus:ring-ring"
        >
          {m.skip_to_content()}
        </a>
        <TooltipProvider>
          <div className="flex min-h-dvh flex-col">
            <AppHeader />
            <main id="main" tabIndex={-1} className="flex-1 outline-none">
              {children}
            </main>
            <AppFooter />
          </div>
          <Toaster position="bottom-center" />
        </TooltipProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
