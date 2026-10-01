import { useId } from 'react'
import { LogoMark } from '#/components/brand'
import { PageContainer } from '#/components/page'
import { NativeSelect, NativeSelectOption } from '#/components/ui/native-select'
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

export function AppFooter() {
  return (
    <footer className="mt-20 border-t">
      <PageContainer className="flex flex-col gap-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2">
          <LogoMark className="text-foreground" />
          {m.footer_note()}
        </p>
        <LocaleSelect />
      </PageContainer>
    </footer>
  )
}
