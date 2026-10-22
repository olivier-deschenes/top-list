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

// Resolves the request locale (cookie, then Accept-Language) before SSR runs.
export default {
  fetch(request: Request): Promise<Response> {
    return paraglideMiddleware(request, async () => {
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
      return handler.fetch(request)
    })
  },
}
