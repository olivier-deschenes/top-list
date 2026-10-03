import { useCreateStore, useSelector } from '@tanstack/react-store'
import { IconRefresh, IconStarFilled } from '@tabler/icons-react'
import { StarVote } from '#/components/star-rating'
import { Button } from '#/components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { formatRating } from '#/lib/format'
import { DEMO_SCENARIOS, getDemoRankings } from '#/lib/home-demo'
import type { DemoScenario } from '#/lib/home-demo'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

interface DemoState {
  scenario: DemoScenario
  ratings: Record<string, number>
  feedback: { name: string; rating: number; rank: number } | 'reset' | null
}

const scenarioLabels = {
  coffee: () => m.demo_coffee(),
  movies: () => m.demo_movies(),
  weekends: () => m.demo_weekends(),
}

const groupNames = {
  coffee: () => m.demo_coffee_group(),
  movies: () => m.demo_movies_group(),
  weekends: () => m.demo_weekends_group(),
}

/** A separate store per mounted demo keeps example votes out of real groups. */
export function RankingDemo() {
  const store = useCreateStore<DemoState>({
    scenario: 'coffee',
    ratings: {},
    feedback: null,
  })
  const { scenario, ratings, feedback } = useSelector(store)

  function vote(entryId: string, rating: number) {
    store.setState((state) => {
      const nextRatings = { ...state.ratings, [entryId]: rating }
      const result = getDemoRankings(state.scenario, nextRatings).entries.find(
        (item) => item.entry.id === entryId,
      )!
      return {
        ...state,
        ratings: nextRatings,
        feedback: {
          name: result.entry.name,
          rating,
          rank: result.rank!,
        },
      }
    })
  }

  const status =
    feedback === 'reset'
      ? m.demo_reset_done()
      : feedback
        ? m.demo_vote_saved(feedback)
        : m.demo_hint()

  return (
    <section
      aria-labelledby="home-demo-title"
      className="min-w-0 border bg-background"
    >
      <h2 id="home-demo-title" className="sr-only">
        {m.demo_title()}
      </h2>
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
        <p className="text-sm text-muted-foreground">{m.demo_label()}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={Object.keys(ratings).length === 0}
          onClick={() =>
            store.setState((state) => ({
              ...state,
              ratings: {},
              feedback: 'reset',
            }))
          }
        >
          <IconRefresh aria-hidden="true" data-icon="inline-start" />
          {m.demo_reset()}
        </Button>
      </div>

      <Tabs
        value={scenario}
        onValueChange={(next) =>
          store.setState((state) => ({
            ...state,
            scenario: next as DemoScenario,
            feedback: null,
          }))
        }
        className="gap-0"
      >
        <div className="px-4 pt-5 sm:px-5">
          <TabsList aria-label={m.demo_title()} className="w-full">
            {DEMO_SCENARIOS.map((item) => (
              <TabsTrigger key={item} value={item} className="text-sm">
                {scenarioLabels[item]()}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {DEMO_SCENARIOS.map((item) => {
          const rankings = getDemoRankings(item, ratings)
          return (
            <TabsContent key={item} value={item} className="min-w-0">
              <div className="space-y-1 px-4 pt-5 pb-4 sm:px-5">
                <h3 className="text-xl font-semibold tracking-tight">
                  {groupNames[item]()}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {m.demo_group_meta()}
                </p>
              </div>

              <div className="px-3 sm:px-4">
                <Table className="table-fixed text-sm">
                  <TableCaption className="sr-only">
                    {m.demo_table_caption()}
                  </TableCaption>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-7 px-1 text-right">
                        <span className="sr-only">{m.col_rank()}</span>#
                      </TableHead>
                      <TableHead className="px-2">{m.col_entry()}</TableHead>
                      <TableHead className="hidden w-12 px-1 text-right min-[400px]:table-cell">
                        {m.col_rating()}
                      </TableHead>
                      <TableHead className="w-32 pr-0 text-right sm:w-40">
                        {m.col_your_rating()}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankings.entries.map((ranked) => (
                      <TableRow
                        key={ranked.entry.id}
                        className={cn(
                          'hover:bg-transparent',
                          ranked.rank === 1 && 'bg-muted/50',
                        )}
                      >
                        <TableCell className="px-1 py-5 text-right align-baseline text-muted-foreground tabular-nums">
                          {ranked.rank}
                        </TableCell>
                        <TableCell className="px-2 py-5 align-baseline whitespace-normal">
                          <p className="font-medium">{ranked.entry.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            <span className="min-[400px]:hidden">
                              {formatRating(ranked.average!)}
                              {'/5 · '}
                            </span>
                            {m.review_count({ count: ranked.reviewCount })}
                          </p>
                        </TableCell>
                        <TableCell className="hidden px-1 py-5 text-right align-baseline font-medium tabular-nums min-[400px]:table-cell">
                          <span className="inline-flex items-center gap-1">
                            <IconStarFilled
                              aria-hidden="true"
                              className="hidden size-3 sm:block"
                            />
                            {formatRating(ranked.average!)}
                          </span>
                        </TableCell>
                        <TableCell className="py-5 pr-0 align-baseline">
                          <StarVote
                            value={ratings[ranked.entry.id] ?? null}
                            onChange={(rating) => vote(ranked.entry.id, rating)}
                            aria-label={m.demo_entry_aria({
                              name: ranked.entry.name,
                            })}
                            className="ml-auto [&_button]:size-6 sm:[&_button]:size-7"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )
        })}
      </Tabs>

      <div className="space-y-1 border-t px-4 py-4 sm:px-5">
        <p role="status" aria-live="polite" className="min-h-10 text-sm">
          {status}
        </p>
        <p className="text-xs text-muted-foreground">{m.demo_sample_note()}</p>
      </div>
    </section>
  )
}
