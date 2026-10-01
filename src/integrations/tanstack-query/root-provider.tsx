import { QueryClient } from '@tanstack/react-query'
import { isNotFound } from '@tanstack/react-router'

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5_000,
        // A missing group or entry won't appear by retrying.
        retry: (failureCount, error) => !isNotFound(error) && failureCount < 2,
      },
    },
  })

  return {
    queryClient,
  }
}
