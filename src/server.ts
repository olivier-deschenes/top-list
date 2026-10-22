import { env } from 'cloudflare:workers'
import handler from '@tanstack/react-start/server-entry'
import { m } from './paraglide/messages.js'
import { paraglideMiddleware } from './paraglide/server.js'

/**
 * Every write is a POST (server functions), so reads are never limited.
 * Photo uploads (multipart) draw from a smaller budget of their own.
 */
async function isRateLimited(request: Request) {
  if (request.method === 'GET' || request.method === 'HEAD') return false
  const isUpload = request.headers
    .get('Content-Type')
    ?.startsWith('multipart/form-data')
  const limiter = isUpload ? env.UPLOAD_LIMIT : env.WRITE_LIMIT
  const key = request.headers.get('CF-Connecting-IP') ?? 'local'
  const { success } = await limiter.limit({ key })
  return !success
}

const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  // A group's link is its only key, so other sites never see our paths.
  'Referrer-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
}

/**
 * Scripts only from our origin or carrying this request's nonce (TanStack
 * puts it on the scripts SSR writes, see src/router.tsx). Styles allow
 * inline because components set style attributes. The only frame is the
 * Google map on an entry's page.
 */
const contentSecurityPolicy = (nonce: string) =>
  [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    'frame-src https://www.google.com',
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')

/** Adds the headers a response doesn't set itself (photos set a stricter CSP). */
function withSecurityHeaders(response: Response, nonce: string) {
  const headers = new Headers(response.headers)
  const policies: Record<string, string> = import.meta.env.DEV
    ? // Vite's dev client injects inline scripts without the nonce.
      SECURITY_HEADERS
    : {
        ...SECURITY_HEADERS,
        'Content-Security-Policy': contentSecurityPolicy(nonce),
      }
  for (const [name, value] of Object.entries(policies)) {
    if (!headers.has(name)) headers.set(name, value)
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

// Resolves the request locale (cookie, then Accept-Language) before SSR runs.
export default {
  async fetch(request: Request): Promise<Response> {
    const nonce = crypto.randomUUID()
    const response = await paraglideMiddleware(request, async () => {
      if (await isRateLimited(request)) {
        // Plain text: the server function client shows it as the error message.
        return new Response(m.error_rate_limited(), {
          status: 429,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Retry-After': '60',
          },
        })
      }
      return handler.fetch(request, { context: { nonce } })
    })
    return withSecurityHeaders(response, nonce)
  },
}
