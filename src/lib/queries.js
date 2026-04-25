// Shared TanStack Query hooks. Each hook owns its query key shape so
// invalidation is consistent — one place to change if the API surface
// shifts.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

// ── Accounts ─────────────────────────────────────────────────────

export function useAccounts(filters = {}) {
  return useQuery({
    queryKey: ['accounts', filters],
    queryFn: () => {
      const qs = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
      });
      const suffix = qs.toString() ? `?${qs}` : '';
      return api(`/accounts${suffix}`);
    },
    placeholderData: (prev) => prev, // keep previous results visible while refetching
  });
}

export function useAccount(id) {
  return useQuery({
    queryKey: ['account', id],
    queryFn: () => api(`/accounts/${id}`),
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api('/accounts', { method: 'POST', body: data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api(`/accounts/${id}`, { method: 'PATCH', body: data }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      if (updated?.id) qc.setQueryData(['account', updated.id], (old) => old ? { ...old, ...updated } : old);
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api(`/accounts/${id}`, { method: 'DELETE' }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.removeQueries({ queryKey: ['account', id] });
    },
  });
}

// ── Opportunities ────────────────────────────────────────────────

export function useOpportunities(filters = {}) {
  return useQuery({
    queryKey: ['opportunities', filters],
    queryFn: () => {
      const qs = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
      });
      const suffix = qs.toString() ? `?${qs}` : '';
      return api(`/opportunities${suffix}`);
    },
    placeholderData: (prev) => prev,
  });
}

export function useCreateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api('/opportunities', { method: 'POST', body: data }),
    onSuccess: (opp) => {
      qc.invalidateQueries({ queryKey: ['opportunities'] });
      if (opp?.accountId) qc.invalidateQueries({ queryKey: ['account', opp.accountId] });
    },
  });
}

export function useUpdateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api(`/opportunities/${id}`, { method: 'PATCH', body: data }),
    onSuccess: (opp) => {
      qc.invalidateQueries({ queryKey: ['opportunities'] });
      if (opp?.accountId) qc.invalidateQueries({ queryKey: ['account', opp.accountId] });
    },
  });
}

// ── Contacts ─────────────────────────────────────────────────────

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api('/contacts', { method: 'POST', body: data }),
    onSuccess: (contact) => {
      if (contact?.accountId) qc.invalidateQueries({ queryKey: ['account', contact.accountId] });
    },
  });
}

// ── Activities ───────────────────────────────────────────────────

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api('/activities', { method: 'POST', body: data }),
    onSuccess: (act) => {
      if (act?.accountId) qc.invalidateQueries({ queryKey: ['account', act.accountId] });
    },
  });
}

// ── Users (for owner-picker dropdowns) ───────────────────────────

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api('/users'),
    staleTime: 5 * 60 * 1000, // user list rarely changes
  });
}
