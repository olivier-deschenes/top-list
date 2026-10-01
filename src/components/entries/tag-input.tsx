import { Fragment, useState } from 'react'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '#/components/ui/combobox'
import { LIMITS, normalizeTags } from '#/lib/schemas'
import { m } from '#/paraglide/messages'

const sameTag = (a: string, b: string) =>
  a.toLocaleLowerCase() === b.toLocaleLowerCase()

/**
 * Multi-select of the group's existing tags that can also create new ones:
 * typing a tag nobody used yet offers an "Add …" option.
 */
export function TagInput({
  id,
  value,
  onChange,
  onBlur,
  suggestions,
  invalid,
  describedBy,
}: {
  id: string
  value: Array<string>
  onChange: (tags: Array<string>) => void
  onBlur?: () => void
  suggestions: Array<string>
  invalid?: boolean
  describedBy?: string
}) {
  const anchor = useComboboxAnchor()
  const [query, setQuery] = useState('')
  const draft = query.trim().slice(0, LIMITS.tag)
  const known = normalizeTags([...value, ...suggestions])
  const isNew = draft !== '' && !known.some((tag) => sameTag(tag, draft))
  const items = isNew ? [...known, draft] : known

  return (
    <Combobox
      multiple
      autoHighlight
      items={items}
      value={value}
      inputValue={query}
      onInputValueChange={setQuery}
      onValueChange={(next) => {
        onChange(normalizeTags(next))
        setQuery('')
      }}
    >
      <ComboboxChips
        ref={anchor}
        className="min-h-9 w-full text-base md:text-sm"
      >
        <ComboboxValue>
          {(selected: Array<string>) => (
            <Fragment>
              {selected.map((tag) => (
                <ComboboxChip key={tag}>{tag}</ComboboxChip>
              ))}
              <ComboboxChipsInput
                id={id}
                onBlur={onBlur}
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
                placeholder={
                  selected.length === 0 ? m.field_tags_placeholder() : undefined
                }
                className="text-base md:text-sm"
              />
            </Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>{m.tags_none()}</ComboboxEmpty>
        <ComboboxList>
          {(tag: string) => (
            <ComboboxItem key={tag} value={tag}>
              {isNew && tag === draft ? m.tags_create({ tag }) : tag}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
