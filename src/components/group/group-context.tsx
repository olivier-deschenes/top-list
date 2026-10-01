import { createContext, useContext } from 'react'

export interface GroupContextValue {
  groupId: string
  /** Who this device acts as; null until chosen (and during SSR). */
  username: string | null
  identityReady: boolean
  /** Opens the "Who are you?" dialog. */
  chooseIdentity: () => void
  /** Returns the current username, or opens the picker and returns null. */
  requireIdentity: () => string | null
}

export const GroupContext = createContext<GroupContextValue | null>(null)

export function useGroup() {
  const value = useContext(GroupContext)
  if (!value) throw new Error('useGroup must be used inside a group route')
  return value
}
