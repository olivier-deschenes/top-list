import { createFileRoute } from '@tanstack/react-router'
import { isPhotoVariant } from '#/lib/photos'
import { photoIdSchema } from '#/lib/schemas'
import { getPhotoObject } from '#/server/photos.server'

const notFound = () => new Response('Not found', { status: 404 })

/** A photo's image. Ids are never reused, so it caches forever. */
export const Route = createFileRoute('/api/photos/$photoId/$variant')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { photoId, variant } = params
        if (
          !photoIdSchema.safeParse(photoId).success ||
          !isPhotoVariant(variant)
        ) {
          return notFound()
        }
        const object = await getPhotoObject(photoId, variant)
        if (!object) return notFound()
        return new Response(object.body, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Content-Length': String(object.size),
            'Cache-Control': 'public, max-age=31536000, immutable',
            ETag: object.httpEtag,
            // User uploads: never sniffed, run, or embedded by other sites.
            'X-Content-Type-Options': 'nosniff',
            'Content-Security-Policy': "default-src 'none'; sandbox",
            'Cross-Origin-Resource-Policy': 'same-origin',
          },
        })
      },
    },
  },
})
