const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i

/** Pulls a group id out of a pasted link (any host) or a bare id. */
export function parseGroupId(input: string): string | null {
  const match = UUID_PATTERN.exec(input.trim())
  return match ? match[0].toLowerCase() : null
}
