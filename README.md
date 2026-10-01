# Top List

Private group rankings. Make a group, share its link, and let everyone add places (or anything else) and rate them with 1 to 5 stars and a comment. The best one rises to the top: the rankings page shows the top three above the full list, and you can rate (or change your rating) straight from either.

- **No accounts.** A group is a random UUID; anyone with the link can view and change it.
- **Pick a name, no password.** Each device remembers who it is in each group (localStorage). Anyone can act as anyone, by design.
- **Tracked per person.** Every entry, review, rename, and delete is attributed and shown in the group's activity feed.
- **English and French**, following the browser language (with a picker in the footer).

## Stack

TanStack Start (React 19, SSR) on Cloudflare Workers, Cloudflare D1 for storage, TanStack Router/Query/Form/Table/DB, shadcn/ui + Tailwind CSS, Paraglide for i18n.

| Path                  | What                                                                        |
| --------------------- | --------------------------------------------------------------------------- |
| `migrations/`         | D1 schema (plain SQL, applied with `wrangler d1 migrations`)                |
| `src/server/`         | Server functions (`*.functions.ts`) and D1 access (`db.server.ts`)          |
| `src/lib/schemas.ts`  | Zod validation shared by forms and server functions                         |
| `src/lib/ranking.ts`  | Ranking and per-member stats (unit tested)                                  |
| `src/lib/queries.ts`  | TanStack Query options and mutation hooks                                   |
| `src/db-collections/` | Device-local "your groups" and identity (TanStack DB, localStorage)         |
| `src/routes/`         | Pages: home, `/g/$groupId` (rankings, entries, members, activity, settings) |
| `messages/`           | `en.json` and `fr.json` UI strings                                          |

### Ranking

Entries are ordered by a weighted rating, `(2 × 3 + sum of ratings) / (2 + number of reviews)`: every entry starts as if it had two 3-star reviews, so one 5-star review can't beat ten 4.8s. The prior is fixed, so an entry's score only changes when its own reviews change. Ties go to the entry with more reviews, then by name.

## Develop

```bash
bun install
bun run cf-typegen
bun run db:migrate:local
bun run dev
```

The app runs at http://localhost:3000 with a local D1 database in `.wrangler/state`.

```bash
bun run test        # unit tests (Vitest)
bun run typecheck   # tsc
bun run lint        # eslint
bun run build       # production build
```

After changing `wrangler.jsonc`, rerun `bun run cf-typegen`. To change the schema, add a new numbered file in `migrations/` and apply it with `bun run db:migrate:local`.

## Deploy to Cloudflare

Live at https://list.odeschenes.dev.

```bash
bun run deploy
```

This builds, applies pending migrations to the remote D1 database, and deploys the Worker. Run `bunx wrangler login` first if needed.

To deploy to a different Cloudflare account, create a database with `bunx wrangler d1 create top-list` and put its id in `wrangler.jsonc` as the `DB` binding's `database_id`. Keep a single `DB` entry without `"remote": true`, so local dev keeps using the local database.
