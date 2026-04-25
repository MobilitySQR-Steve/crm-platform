import { QueryClient } from '@tanstack/react-query';

// Don't retry auth errors (401/403) — the user needs to log in, not wait.
// Other errors get a couple of retries with backoff.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, err) => {
        if (err?.status === 401 || err?.status === 403) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      staleTime: 30_000, // 30s — most CRM data isn't changing every render
    },
  },
});
