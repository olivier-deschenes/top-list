import { useState } from 'react'
import {
  ClientOnly,
  Link,
  createFileRoute,
  notFound,
  useNavigate,
} from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import {
  IconArrowLeft,
  IconExternalLink,
  IconPencil,
  IconTrash,
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { EntryFormDialog } from '#/components/entries/entry-form-dialog'
import { EntryLocation } from '#/components/entries/entry-location'
import { RatingDistribution } from '#/components/entries/rating-distribution'
import { ReviewForm } from '#/components/entries/review-form'
import { useGroup } from '#/components/group/group-context'
import { PageHeader, Section } from '#/components/page'
import { RelativeTime } from '#/components/relative-time'
import { StarRating } from '#/components/star-rating'
import { StatusPage } from '#/components/status-page'
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
import { Skeleton } from '#/components/ui/skeleton'
import { formatRating, linkHost } from '#/lib/format'
import { groupQuery, useDeleteEntry, useUpdateEntry } from '#/lib/queries'
import { collectTags, isSameUser, rankEntries } from '#/lib/ranking'
import type { Review } from '#/lib/types'
import { m } from '#/paraglide/messages'

export const Route = createFileRoute('/g/$groupId/entries/$entryId')({
  loader: async ({ context, params }) => {
    const snapshot = await context.queryClient.ensureQueryData(
      groupQuery(params.groupId),
    )
    const entry = snapshot.entries.find((item) => item.id === params.entryId)
    if (!entry) throw notFound()
    return { entryName: entry.name, groupName: snapshot.group.name }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [{ title: `${loaderData.entryName} · ${loaderData.groupName}` }]
      : [],
  }),
  notFoundComponent: EntryNotFound,
  component: EntryPage,
})

function EntryNotFound() {
  const { groupId } = Route.useParams()
  return (
    <StatusPage
      title={m.entry_not_found_title()}
      description={m.entry_not_found_body()}
      action={
        <Button asChild variant="outline">
          <Link to="/g/$groupId" params={{ groupId }}>
            {m.entry_back()}
          </Link>
        </Button>
      }
    />
  )
}

function EntryPage() {
  const { groupId, entryId } = Route.useParams()
  const navigate = useNavigate()
  const { data } = useSuspenseQuery(groupQuery(groupId))
  const { username, requireIdentity, chooseIdentity } = useGroup()
  const updateEntry = useUpdateEntry(groupId)
  const deleteEntry = useDeleteEntry(groupId)
  // Open from Edit, or from the map's "Add address" (focuses that field).
  const [editing, setEditing] = useState<'entry' | 'address' | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const rankings = rankEntries(data.entries, data.reviews)
  const ranked = rankings.entries.find((item) => item.entry.id === entryId)

  // Deleted while open (someone else, or a background refresh).
  if (!ranked) return <EntryNotFound />

  const { entry } = ranked
  const reviews = data.reviews
    .filter((review) => review.entryId === entryId)
    .sort((a, b) => b.updatedAt - a.updatedAt)
  const myReview = username
    ? reviews.find((review) => isSameUser(review.username, username))
    : undefined

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <Link
          to="/g/$groupId"
          params={{ groupId }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground no-underline hover:text-foreground"
        >
          <IconArrowLeft aria-hidden="true" className="size-4" />
          {m.entry_back()}
        </Link>
        <PageHeader
          title={entry.name}
          actions={
            <>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  if (requireIdentity()) setEditing('entry')
                }}
              >
                <IconPencil data-icon="inline-start" aria-hidden="true" />
                {m.edit()}
              </Button>
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
            </>
          }
        />
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {entry.url ? (
            <div className="flex gap-1.5">
              <dt className="sr-only">{m.field_link()}</dt>
              <dd>
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-foreground hover:underline"
                >
                  {linkHost(entry.url)}
                  <IconExternalLink aria-hidden="true" className="size-3.5" />
                  <span className="sr-only">({m.entry_open_link()})</span>
                </a>
              </dd>
            </div>
          ) : null}
          {entry.tags.length > 0 ? (
            <div className="flex gap-1.5">
              <dt className="text-muted-foreground">{m.entry_tags_label()}</dt>
              <dd>{entry.tags.join(', ')}</dd>
            </div>
          ) : null}
          <div className="flex gap-1.5 text-muted-foreground">
            <dt className="sr-only">{m.col_added_by()}</dt>
            <dd>
              <Link
                to="/g/$groupId/members/$username"
                params={{ groupId, username: entry.createdBy }}
                className="text-muted-foreground hover:text-foreground"
              >
                {m.entry_added_by({ username: entry.createdBy })}
              </Link>
              {', '}
              <RelativeTime timestamp={entry.createdAt} />
            </dd>
          </div>
        </dl>
        {entry.notes ? (
          <p className="max-w-prose text-base whitespace-pre-line text-pretty">
            {entry.notes}
          </p>
        ) : null}
      </div>

      <div className="grid gap-8 border-y py-8 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] md:gap-12">
        <div className="space-y-2">
          {ranked.average === null ? (
            <p className="text-base text-muted-foreground">{m.not_rated()}</p>
          ) : (
            <>
              <p className="text-5xl font-semibold tracking-tight tabular-nums">
                {formatRating(ranked.average)}
              </p>
              <StarRating value={ranked.average} size="md" />
              <p className="text-sm text-muted-foreground">
                {m.review_count({ count: ranked.reviewCount })}
                {ranked.rank
                  ? `, ${m.entry_rank({ rank: ranked.rank, total: rankings.ratedCount }).toLocaleLowerCase()}`
                  : null}
              </p>
            </>
          )}
        </div>
        <RatingDistribution
          distribution={ranked.distribution}
          total={ranked.reviewCount}
        />
      </div>

      <EntryLocation
        entry={entry}
        onAddAddress={() => {
          if (requireIdentity()) setEditing('address')
        }}
      />

      <Section id="your-review" title={m.your_review_title()}>
        <ClientOnly fallback={<Skeleton className="h-40 max-w-xl" />}>
          {username ? (
            <ReviewForm
              key={`${username}:${myReview?.updatedAt ?? 'new'}`}
              groupId={groupId}
              entryId={entryId}
              username={username}
              existing={myReview}
            />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {m.identity_required()}
              </p>
              <Button variant="outline" size="lg" onClick={chooseIdentity}>
                {m.identity_choose()}
              </Button>
            </div>
          )}
        </ClientOnly>
      </Section>

      <Section id="reviews" title={m.reviews_title()}>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">{m.reviews_empty()}</p>
        ) : (
          <ul className="divide-y border-y">
            {reviews.map((review) => (
              <ReviewItem
                key={review.username}
                groupId={groupId}
                review={review}
              />
            ))}
          </ul>
        )}
      </Section>

      <EntryFormDialog
        key={`${entry.id}:${entry.updatedAt}`}
        entry={entry}
        tagSuggestions={collectTags(data.entries)}
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        focusAddress={editing === 'address'}
        onSubmit={async (values) => {
          const actor = requireIdentity()
          if (!actor) return
          await updateEntry.mutateAsync({ ...values, entryId, username: actor })
          setEditing(null)
          toast.success(m.entry_saved())
        }}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {m.entry_delete_title({ name: entry.name })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {m.entry_delete_body()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{m.cancel()}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteEntry.isPending}
              onClick={async (event) => {
                event.preventDefault()
                const actor = requireIdentity()
                if (!actor) return
                await deleteEntry.mutateAsync({ entryId, username: actor })
                setDeleteOpen(false)
                toast.success(m.entry_deleted())
                await navigate({ to: '/g/$groupId', params: { groupId } })
              }}
            >
              {m.delete()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ReviewItem({ groupId, review }: { groupId: string; review: Review }) {
  const edited = review.updatedAt - review.createdAt > 1000
  return (
    <li className="space-y-1.5 py-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Link
          to="/g/$groupId/members/$username"
          params={{ groupId, username: review.username }}
          className="font-medium text-foreground hover:underline"
        >
          {review.username}
        </Link>
        <StarRating value={review.rating} />
        <span className="text-xs text-muted-foreground">
          <RelativeTime timestamp={review.updatedAt} />
          {edited ? `, ${m.review_edited().toLocaleLowerCase()}` : null}
        </span>
      </div>
      {review.comment ? (
        <p className="max-w-prose text-sm whitespace-pre-line text-pretty">
          {review.comment}
        </p>
      ) : null}
    </li>
  )
}
