import { createFileRoute } from '@tanstack/react-router'
import { CreateGroupForm } from '#/components/home/create-group-form'
import { JoinGroupForm } from '#/components/home/join-group-form'
import { MyGroups } from '#/components/home/my-groups'
import { PageContainer, Section } from '#/components/page'
import { m } from '#/paraglide/messages'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <PageContainer className="space-y-14 py-10 sm:py-16">
      <div className="max-w-2xl space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {m.home_title()}
        </h1>
        <p className="text-base text-pretty text-muted-foreground sm:text-lg">
          {m.home_lede()}
        </p>
      </div>

      <div className="grid gap-12 border-t pt-10 md:grid-cols-2 md:gap-0">
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
