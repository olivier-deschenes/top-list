import { useId, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { IconPlus, IconSearch } from '@tabler/icons-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { EntryFormDialog } from '#/components/entries/entry-form-dialog'
import { Leaderboard, SORT_COLUMNS } from '#/components/entries/leaderboard'
import type { LeaderboardSort } from '#/components/entries/leaderboard'
import { useGroup } from '#/components/group/group-context'
import { PageHeader } from '#/components/page'
import { Button } from '#/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '#/components/ui/empty'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '#/components/ui/input-group'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import { groupQuery, useCreateEntry } from '#/lib/queries'
import { collectTags, isSameUser, rankEntries } from '#/lib/ranking'
import { m } from '#/paraglide/messages'

export const Route = createFileRoute('/g/$groupId/')({
  validateSearch: z.object({
    q: z.string().optional().catch(undefined),
    tags: z.array(z.string()).optional().catch(undefined),
    sort: z.enum(SORT_COLUMNS).optional().catch(undefined),
    dir: z.enum(['asc', 'desc']).optional().catch(undefined),
  }),
  component: Rankings,
})

/** Default order: rank ascending (best first). Other columns remember direction. */
const DEFAULT_SORT: LeaderboardSort = { column: 'rank', desc: false }

function Rankings() {
  const { groupId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data } = useSuspenseQuery(groupQuery(groupId))
  const { username, requireIdentity } = useGroup()
  const createEntry = useCreateEntry(groupId)
  const [addOpen, setAddOpen] = useState(false)
  const searchId = useId()

  const rankings = rankEntries(data.entries, data.reviews)
  const allTags = collectTags(data.entries)
  const activeTags = (search.tags ?? []).filter((tag) => allTags.includes(tag))
  const myRatings = new Map(
    username
      ? data.reviews
          .filter((review) => isSameUser(review.username, username))
          .map((review) => [review.entryId, review.rating])
      : [],
  )
  const sort: LeaderboardSort = search.sort
    ? { column: search.sort, desc: search.dir === 'desc' }
    : DEFAULT_SORT

  const updateSearch = (changes: Partial<typeof search>) =>
    navigate({
      search: (prev) => ({ ...prev, ...changes }),
      replace: true,
      resetScroll: false,
    })

  const openAddEntry = () => {
    if (requireIdentity()) setAddOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={m.rankings_title()}
        actions={
          data.entries.length > 0 ? (
            <Button size="lg" onClick={openAddEntry}>
              <IconPlus data-icon="inline-start" aria-hidden="true" />
              {m.add_entry()}
            </Button>
          ) : null
        }
      />

      {data.entries.length === 0 ? (
        <Empty className="border py-14">
          <EmptyHeader>
            <EmptyTitle className="text-base">
              {m.rankings_empty_title()}
            </EmptyTitle>
            <EmptyDescription>{m.rankings_empty_body()}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="lg" onClick={openAddEntry}>
              <IconPlus data-icon="inline-start" aria-hidden="true" />
              {m.add_entry()}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="sm:w-72">
              <label htmlFor={searchId} className="sr-only">
                {m.search_label()}
              </label>
              <InputGroup className="h-9">
                <InputGroupAddon>
                  <IconSearch aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  id={searchId}
                  type="search"
                  value={search.q ?? ''}
                  placeholder={m.search_placeholder()}
                  onChange={(event) =>
                    updateSearch({ q: event.target.value || undefined })
                  }
                  className="text-base md:text-sm"
                />
              </InputGroup>
            </div>
            {allTags.length > 0 ? (
              <ToggleGroup
                type="multiple"
                variant="outline"
                size="sm"
                spacing={1}
                value={activeTags}
                onValueChange={(next) =>
                  updateSearch({ tags: next.length > 0 ? next : undefined })
                }
                aria-label={m.filter_tags_label()}
                className="flex-wrap"
              >
                {allTags.map((tag) => (
                  <ToggleGroupItem
                    key={tag}
                    value={tag}
                    className="h-9 px-3 text-xs"
                  >
                    {tag}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            ) : null}
          </div>

          <Leaderboard
            groupId={groupId}
            data={rankings.entries}
            myRatings={myRatings}
            query={search.q ?? ''}
            tags={activeTags}
            sort={sort}
            onSortChange={(next) =>
              updateSearch(
                next.column === DEFAULT_SORT.column && !next.desc
                  ? { sort: undefined, dir: undefined }
                  : { sort: next.column, dir: next.desc ? 'desc' : 'asc' },
              )
            }
            onClearFilters={() =>
              updateSearch({ q: undefined, tags: undefined })
            }
          />
        </>
      )}

      <EntryFormDialog
        tagSuggestions={allTags}
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={async (values) => {
          const actor = requireIdentity()
          if (!actor) return
          const { id } = await createEntry.mutateAsync({
            ...values,
            username: actor,
          })
          setAddOpen(false)
          toast.success(m.entry_added())
          await navigate({
            to: '/g/$groupId/entries/$entryId',
            params: { groupId, entryId: id },
          })
        }}
      />
    </div>
  )
}
