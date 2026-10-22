import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { getGlobalStartContext } from '@tanstack/react-start'
import { routeTree } from './routeTree.gen'

import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { getContext } from './integrations/tanstack-query/root-provider'

/** The request's CSP nonce (src/server.ts), for the scripts SSR writes. */
function requestNonce() {
  try {
    // Start types the context as never when no global middleware is set.
    const context = getGlobalStartContext() as { nonce?: string } | undefined
    return context?.nonce
  } catch {
    // Outside a request's middleware (resolving a server function's
    // redirect), where nothing is rendered.
    return undefined
  }
}

export function getRouter() {
  const context = getContext()

  const router = createTanStackRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    ssr: { nonce: requestNonce() },
  })

  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
    server: { requestContext: { nonce: string } }
  }
}
