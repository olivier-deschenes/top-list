import { createFileRoute } from '@tanstack/react-router'
import { IconArrowRight } from '@tabler/icons-react'
import { CreateGroupForm } from '#/components/home/create-group-form'
import { JoinGroupForm } from '#/components/home/join-group-form'
import { MyGroups } from '#/components/home/my-groups'
import { RankingDemo } from '#/components/home/ranking-demo'
import { PageContainer, Section } from '#/components/page'
import { Button } from '#/components/ui/button'
import { m } from '#/paraglide/messages'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <PageContainer className="space-y-16 py-10 sm:space-y-20 sm:py-16">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-12">
        <div className="min-w-0 space-y-7">
          <div className="max-w-xl space-y-4">
            <p className="text-sm text-muted-foreground">{m.home_intro()}</p>
            <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
              {m.home_title()}
            </h1>
            <p className="max-w-md text-base leading-relaxed text-pretty text-muted-foreground">
              {m.home_lede()}
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-10 px-4 text-sm">
                <a href="#create-group">
                  {m.home_start()}
                  <IconArrowRight aria-hidden="true" data-icon="inline-end" />
                </a>
              </Button>
              <Button asChild variant="ghost" size="lg" className="text-sm">
                <a href="#join-group">{m.home_join()}</a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {m.home_no_account()}
            </p>
          </div>
        </div>
        <RankingDemo />
      </div>

      <section
        aria-labelledby="how-it-works"
        className="space-y-6 border-t pt-8"
      >
        <h2 id="how-it-works" className="text-xl font-semibold tracking-tight">
          {m.home_how_title()}
        </h2>
        <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
          <HowItWorks
            title={m.home_step_create_title()}
            body={m.home_step_create_body()}
          />
          <HowItWorks
            title={m.home_step_share_title()}
            body={m.home_step_share_body()}
          />
          <HowItWorks
            title={m.home_step_rate_title()}
            body={m.home_step_rate_body()}
          />
        </div>
      </section>

      <div className="grid gap-10 border-t pt-8 md:grid-cols-2 md:gap-0">
        <Section
          id="create-group"
          title={m.create_group_title()}
          description={m.create_group_hint()}
          className="md:border-r md:pr-10"
        >
          <CreateGroupForm />
        </Section>
        <Section
          id="join-group"
          title={m.join_group_title()}
          description={m.join_group_hint()}
          className="md:pl-10"
        >
          <JoinGroupForm />
        </Section>
      </div>

      <MyGroups />
    </PageContainer>
  )
}

function HowItWorks({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
        {body}
      </p>
    </div>
  )
}
