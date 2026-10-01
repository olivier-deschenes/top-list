import { useId } from 'react'
import { useLoaderData, useRouter } from '@tanstack/react-router'
import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react'
import { LogoMark } from '#/components/brand'
import { PageContainer } from '#/components/page'
import { NativeSelect, NativeSelectOption } from '#/components/ui/native-select'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import { applyTheme, parseTheme } from '#/lib/theme'
import { m } from '#/paraglide/messages'
import { getLocale, locales, setLocale } from '#/paraglide/runtime'
import type { Locale } from '#/paraglide/runtime'

/** "English", "Français": each language named in itself. */
function languageName(locale: Locale) {
  const name = new Intl.DisplayNames([locale], { type: 'language' }).of(locale)
  return name
    ? name.charAt(0).toLocaleUpperCase(locale) + name.slice(1)
    : locale
}

function LocaleSelect() {
  const id = useId()
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="sr-only">
        {m.language_label()}
      </label>
      <NativeSelect
        id={id}
        size="sm"
        value={getLocale()}
        // Stores the choice in a cookie and reloads in the new language.
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        {locales.map((locale) => (
          <NativeSelectOption key={locale} value={locale} lang={locale}>
            {languageName(locale)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  )
}

const THEME_OPTIONS = [
  { value: 'system', icon: IconDeviceDesktop, label: () => m.theme_system() },
  { value: 'light', icon: IconSun, label: () => m.theme_light() },
  { value: 'dark', icon: IconMoon, label: () => m.theme_dark() },
] as const

function ThemeToggle() {
  const router = useRouter()
  const theme = useLoaderData({ from: '__root__' })
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      spacing={0}
      value={theme}
      onValueChange={(next) => {
        // Radix clears the value when the active item is pressed again.
        if (!next) return
        applyTheme(parseTheme(next))
        void router.invalidate({
          filter: (match) => match.routeId === '__root__',
        })
      }}
      aria-label={m.theme_label()}
    >
      {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          aria-label={label()}
          title={label()}
        >
          <Icon aria-hidden="true" />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

export function AppFooter() {
  return (
    <footer className="mt-20 border-t">
      <PageContainer className="flex flex-col gap-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2">
          <LogoMark className="text-foreground" />
          {m.footer_note()}
        </p>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LocaleSelect />
        </div>
      </PageContainer>
    </footer>
  )
}
