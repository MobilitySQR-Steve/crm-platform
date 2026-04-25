import { createContext, useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const qc = useQueryClient();

  // /auth/me — runs on app boot and after login/logout.
  // Returns null (not an error) when not authenticated, so the rest of
  // the app can branch cleanly on `user === null` vs. genuine errors.
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const data = await api('/auth/me');
        return data.user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: Infinity,
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }) =>
      api('/auth/login', { method: 'POST', body: { email, password } }),
    onSuccess: (data) => {
      qc.setQueryData(['me'], data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      qc.setQueryData(['me'], null);
      // Drop everything else from the cache so a returning user doesn't
      // briefly see the previous user's data flash on screen.
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
    },
  });

  const value = {
    user: meQuery.data ?? null,
    isLoading: meQuery.isLoading,
    isAuthenticated: !!meQuery.data,
    error: meQuery.error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
