import { Fragment } from 'react'
import type { ReactNode } from 'react'

/**
 * Renders a translated message with React nodes in its placeholders.
 * `render` receives a token per slot to pass as the message parameter.
 *
 *   <RichMessage
 *     render={(t) => m.activity_entry_created({ username: t.username, entry: t.entry })}
 *     slots={{ username: <b>Alex</b>, entry: <Link>Pho</Link> }}
 *   />
 */
export function RichMessage<TSlot extends string>({
  render,
  slots,
}: {
  render: (tokens: Record<TSlot, string>) => string
  slots: Record<TSlot, ReactNode>
}) {
  const names = Object.keys(slots) as Array<TSlot>
  const tokens = Object.fromEntries(
    names.map((name, index) => [name, `\u0000${index}\u0000`]),
  ) as Record<TSlot, string>
  const parts = render(tokens).split('\u0000')
  return (
    <>
      {parts.map((part, index) => {
        // Odd parts are slot indexes, even parts are literal text.
        if (index % 2 === 0) return part
        const name = names[Number(part)]
        return <Fragment key={index}>{name ? slots[name] : null}</Fragment>
      })}
    </>
  )
}
