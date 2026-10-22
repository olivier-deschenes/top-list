import { env } from 'cloudflare:workers'
import { m } from '#/paraglide/messages'

/** Must match `allowed_sender_addresses` in wrangler.jsonc. */
const FROM = { email: 'noreply@odeschenes.dev', name: 'Top List' }

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  )
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

/**
 * Anyone can ask for an email to any address, so each sender, recipient,
 * and group gets its own small budget (EMAIL_LIMIT). The recipient key is
 * hashed so the address isn't sent anywhere else.
 */
export async function isEmailRateLimited({
  ip,
  email,
  groupId,
}: {
  ip: string
  email: string
  groupId: string
}) {
  const keys = [
    `ip:${ip}`,
    `to:${await sha256(email.toLowerCase())}`,
    `group:${groupId}`,
  ]
  const results = await Promise.all(
    keys.map((key) => env.EMAIL_LIMIT.limit({ key })),
  )
  return results.some((result) => !result.success)
}

/** Group names are typed by anyone with the link; keep them to one line. */
const oneLine = (value: string) => value.replace(/\s+/g, ' ').trim()

/**
 * Emails a group's link, in the request's locale. The address is used for
 * this one message only: it's never stored or logged.
 */
export async function sendGroupLink({
  to,
  groupName,
  url,
}: {
  to: string
  groupName: string
  url: string
}) {
  const name = oneLine(groupName)
  const intro = m.email_link_intro({ name })
  const warning = m.email_link_warning()
  const footer = m.email_link_footer()
  const href = escapeHtml(url)

  await env.EMAIL.send({
    from: FROM,
    to,
    subject: m.email_link_subject({ name }),
    text: [intro, url, '', warning, '', footer].join('\n'),
    html: `<!doctype html>
<html>
  <body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:#171717;background:#ffffff">
    <p style="margin:0 0 16px">${escapeHtml(intro)}</p>
    <p style="margin:0 0 16px">
      <a href="${href}" style="display:inline-block;padding:10px 16px;background:#171717;color:#ffffff;text-decoration:none;font-weight:500">${escapeHtml(m.email_link_open())}</a>
    </p>
    <p style="margin:0 0 24px;word-break:break-all"><a href="${href}" style="color:#171717">${href}</a></p>
    <p style="margin:0 0 16px;color:#525252">${escapeHtml(warning)}</p>
    <p style="margin:0;font-size:13px;color:#737373">${escapeHtml(footer)}</p>
  </body>
</html>`,
  })
}
