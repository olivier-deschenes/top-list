import { useEffect, useRef, useState } from 'react'
import { IconPhotoPlus, IconTrash } from '@tabler/icons-react'
import { toast } from 'sonner'
import { useGroup } from '#/components/group/group-context'
import { Section } from '#/components/page'
import { RelativeTime } from '#/components/relative-time'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#/components/ui/alert-dialog'
import { Button } from '#/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '#/components/ui/carousel'
import type { CarouselApi } from '#/components/ui/carousel'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Skeleton } from '#/components/ui/skeleton'
import { Spinner } from '#/components/ui/spinner'
import { photoUrl } from '#/lib/photos'
import { useDeletePhoto, useUploadPhotos } from '#/lib/queries'
import { PHOTOS } from '#/lib/schemas'
import type { Entry, Photo } from '#/lib/types'
import { m } from '#/paraglide/messages'

/** An entry's photos: a grid of thumbnails that opens into a swipeable viewer. */
export function EntryPhotos({
  groupId,
  entry,
  photos,
}: {
  groupId: string
  entry: Entry
  photos: Array<Photo>
}) {
  const { requireIdentity } = useGroup()
  const upload = useUploadPhotos(groupId)
  const inputRef = useRef<HTMLInputElement>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  // Closed for good once the last photo is gone, so the next upload doesn't
  // reopen it.
  if (openIndex !== null && photos.length === 0) setOpenIndex(null)

  const remaining = PHOTOS.perEntry - photos.length
  const uploading = upload.isPending ? upload.variables.files.length : 0

  const pick = () => {
    if (requireIdentity()) inputRef.current?.click()
  }

  const onPicked = (files: Array<File>) => {
    const username = requireIdentity()
    if (!username || files.length === 0) return
    if (files.length > remaining) {
      toast.error(m.error_photos_full({ max: PHOTOS.perEntry }))
      return
    }
    if (files.length > PHOTOS.perUpload) {
      toast.error(m.validation_photos_max({ max: PHOTOS.perUpload }))
      return
    }
    upload.mutate(
      { username, entryId: entry.id, files },
      {
        onSuccess: () => toast.success(m.photos_added({ count: files.length })),
      },
    )
  }

  return (
    <Section
      id="photos"
      title={m.photos_title()}
      description={
        remaining <= 0 ? m.photos_full({ max: PHOTOS.perEntry }) : null
      }
      actions={
        <Button
          variant="outline"
          size="lg"
          disabled={remaining <= 0 || upload.isPending}
          onClick={pick}
        >
          <IconPhotoPlus data-icon="inline-start" aria-hidden="true" />
          {m.photos_add()}
        </Button>
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          // Lets the same file be picked again after a failed upload.
          event.target.value = ''
          onPicked(files)
        }}
      />

      {photos.length === 0 && uploading === 0 ? (
        <p className="text-sm text-muted-foreground">{m.photos_empty()}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {photos.map((photo, index) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => setOpenIndex(index)}
                className="block aspect-square w-full overflow-hidden bg-muted outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:transition-opacity"
              >
                <img
                  src={photoUrl(photo.id, 'thumb')}
                  alt={m.photo_alt({
                    name: entry.name,
                    username: photo.username,
                  })}
                  width={photo.width}
                  height={photo.height}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
              </button>
            </li>
          ))}
          {Array.from({ length: uploading }, (_, index) => (
            <li key={`uploading-${index}`}>
              <Skeleton className="aspect-square w-full" />
            </li>
          ))}
        </ul>
      )}

      <p
        role="status"
        className="flex items-center gap-2 text-sm text-muted-foreground empty:hidden"
      >
        {uploading > 0 ? (
          <>
            <Spinner aria-hidden="true" />
            {m.photos_uploading({ count: uploading })}
          </>
        ) : null}
      </p>

      <PhotoViewer
        groupId={groupId}
        entry={entry}
        photos={photos}
        index={openIndex}
        onIndexChange={setOpenIndex}
      />
    </Section>
  )
}

function PhotoViewer({
  groupId,
  entry,
  photos,
  index,
  onIndexChange,
}: {
  groupId: string
  entry: Entry
  photos: Array<Photo>
  index: number | null
  onIndexChange: (index: number | null) => void
}) {
  // Someone may delete photos while the viewer is open.
  const current =
    index === null ? undefined : photos[Math.min(index, photos.length - 1)]

  return (
    <Dialog
      open={current !== undefined}
      onOpenChange={(open) => {
        if (!open) onIndexChange(null)
      }}
    >
      {current ? (
        <PhotoViewerContent
          groupId={groupId}
          entry={entry}
          photos={photos}
          current={current}
          onIndexChange={onIndexChange}
        />
      ) : null}
    </Dialog>
  )
}

/** Mounted while the viewer is open, so it starts on the photo picked. */
function PhotoViewerContent({
  groupId,
  entry,
  photos,
  current,
  onIndexChange,
}: {
  groupId: string
  entry: Entry
  photos: Array<Photo>
  current: Photo
  onIndexChange: (index: number | null) => void
}) {
  const { requireIdentity } = useGroup()
  const deletePhoto = useDeletePhoto(groupId)
  const [api, setApi] = useState<CarouselApi>()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const position = photos.indexOf(current)
  const [startIndex] = useState(position)

  useEffect(() => {
    if (!api) return
    const onSelect = () => onIndexChange(api.selectedScrollSnap())
    api.on('select', onSelect).on('reInit', onSelect)
    return () => {
      api.off('select', onSelect).off('reInit', onSelect)
    }
  }, [api, onIndexChange])

  return (
    <DialogContent
      className="gap-3 sm:max-w-4xl"
      onKeyDown={(event) => {
        // The carousel handles arrows itself while it has focus.
        if (event.defaultPrevented) return
        if (event.key === 'ArrowLeft') api?.scrollPrev()
        if (event.key === 'ArrowRight') api?.scrollNext()
      }}
    >
      <DialogHeader className="pr-8">
        <DialogTitle className="text-base font-semibold tracking-tight">
          {entry.name}
        </DialogTitle>
        <DialogDescription className="tabular-nums">
          {m.photo_position({ index: position + 1, total: photos.length })}
        </DialogDescription>
      </DialogHeader>

      <Carousel setApi={setApi} opts={{ startIndex, duration: 20 }}>
        <CarouselContent>
          {photos.map((photo) => (
            <CarouselItem
              key={photo.id}
              className="flex items-center justify-center"
            >
              <img
                src={photoUrl(photo.id, 'full')}
                alt={m.photo_alt({
                  name: entry.name,
                  username: photo.username,
                })}
                width={photo.width}
                height={photo.height}
                loading={photo === current ? 'eager' : 'lazy'}
                decoding="async"
                className="block h-auto max-h-[70svh] w-auto max-w-full bg-muted object-contain"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        {photos.length > 1 ? (
          <>
            <CarouselPrevious
              className="left-2"
              aria-label={m.photo_previous()}
            />
            <CarouselNext className="right-2" aria-label={m.photo_next()} />
          </>
        ) : null}
      </Carousel>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-sm text-muted-foreground">
          {m.photo_added_by({ username: current.username })}
          {', '}
          <RelativeTime timestamp={current.createdAt} />
        </p>
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            if (requireIdentity()) setDeleteOpen(true)
          }}
        >
          <IconTrash data-icon="inline-start" aria-hidden="true" />
          {m.delete()}
        </Button>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{m.photo_delete_title()}</AlertDialogTitle>
            <AlertDialogDescription>
              {m.photo_delete_body()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{m.cancel()}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deletePhoto.isPending}
              onClick={async (event) => {
                event.preventDefault()
                const username = requireIdentity()
                if (!username) return
                await deletePhoto.mutateAsync({
                  username,
                  photoId: current.id,
                })
                setDeleteOpen(false)
                toast.success(m.photo_deleted())
              }}
            >
              {m.delete()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DialogContent>
  )
}
