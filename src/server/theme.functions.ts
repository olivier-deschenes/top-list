import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { THEME_COOKIE, parseTheme } from '#/lib/theme'
import type { Theme } from '#/lib/theme'

/** Reads the saved theme so the server renders the right colors on first paint. */
export const getTheme = createServerFn({ method: 'GET' }).handler((): Theme =>
  parseTheme(getCookie(THEME_COOKIE)),
)
