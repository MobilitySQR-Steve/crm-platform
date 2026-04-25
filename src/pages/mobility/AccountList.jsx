import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, MoreHorizontal, Loader2 } from 'lucide-react';
import { useAccounts, useUsers } from '../../lib/queries';
import {
  PURSUIT_STATUS, PURSUIT_COLORS, ACCOUNT_SOURCE,
  EMPLOYEE_BAND, MOVES_BAND, initials,
} from '../../constants/enums';

const ACCENT = '#8D3B9D';

// Tiny hook so the API isn't hit on every keystroke.
function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function AccountList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [pursuit, setPursuit] = useState('');
  const [source, setSource] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const debouncedQ = useDebounced(search);

  const filters = {
    q: debouncedQ.trim() || undefined,
    pursuit: pursuit || undefined,
    source: source || undefined,
    ownerId: ownerId || undefined,
    limit: 100,
  };
  const { data, isLoading, isError, error, isFetching } = useAccounts(filters);
  const { data: usersData } = useUsers();
  const users = usersData?.items ?? [];

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasFilters = !!(debouncedQ || pursuit || source || ownerId);

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F0EBF8' }}>
      <div style={{ padding: '22px 28px 40px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F0A1E', margin: 0 }}>Accounts</h1>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>
              MobilitySQR · {isLoading ? '…' : `${total} ${total === 1 ? 'account' : 'accounts'}`}
              {isFetching && !isLoading && <span style={{ marginLeft: 8, color: '#9CA3AF' }}>refreshing…</span>}
            </div>
          </div>
          <Link to="/mobility/accounts/new"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: ACCENT, color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            <Plus size={14} /> New Account
          </Link>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid #EDE8F3', borderRadius: 8, padding: '8px 14px', flex: '1 1 280px', minWidth: 240 }}>
            <Search size={13} color="#9CA3AF" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by account, domain, or industry..."
              style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: '#374151', width: '100%', fontFamily: 'inherit' }}
            />
          </div>
          <FilterSelect value={pursuit} onChange={setPursuit} label="All statuses">
            {Object.entries(PURSUIT_STATUS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </FilterSelect>
          <FilterSelect value={source} onChange={setSource} label="All sources">
            {Object.entries(ACCOUNT_SOURCE).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </FilterSelect>
          <FilterSelect value={ownerId} onChange={setOwnerId} label="All owners">
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
            ))}
          </FilterSelect>
          {hasFilters && (
            <button onClick={() => { setSearch(''); setPursuit(''); setSource(''); setOwnerId(''); }}
              style={{ padding: '8px 12px', background: 'white', border: '1px solid #EDE8F3', borderRadius: 8, fontSize: 12, color: '#6B7280', cursor: 'pointer', fontFamily: 'inherit' }}>
              Clear filters
            </button>
          )}
        </div>

        {/* States */}
        {isLoading && <Centered><Loader2 size={20} className="spin" color="#9CA3AF" /></Centered>}
        {isError && <Centered>
          <div style={{ color: '#B91C1C', fontSize: 13 }}>
            Failed to load accounts: {error?.message ?? 'unknown error'}
          </div>
        </Centered>}

        {/* Table */}
        {!isLoading && !isError && (
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #EDE8F3', overflow: 'hidden' }}>
            {items.length === 0 ? (
              <EmptyState hasFilters={hasFilters} />
            ) : (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #EDE8F3' }}>
                      {['Account', 'HQ / Industry', 'Employees', 'Moves / yr', 'Status', 'Owner', ''].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '11px 16px', color: '#9CA3AF', fontWeight: 500, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((a) => (
                      <tr key={a.id}
                        onClick={() => navigate(`/mobility/accounts/${a.id}`)}
                        style={{ borderTop: '1px solid #F8F7FC', cursor: 'pointer' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#FAF8FD'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: ACCENT + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: ACCENT, flexShrink: 0 }}>
                              {initials(a.name)}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: '#0F0A1E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{a.domain || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#6B7280' }}>
                          <div style={{ color: '#374151' }}>{a.hqCountry || '—'}</div>
                          <div style={{ color: '#9CA3AF', fontSize: 11 }}>{a.industry || '—'}</div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#374151', fontSize: 12 }}>{EMPLOYEE_BAND[a.employeeBand]}</td>
                        <td style={{ padding: '12px 16px', color: '#374151', fontSize: 12 }}>{MOVES_BAND[a.crossBorderMovesBand]}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <Pill label={PURSUIT_STATUS[a.pursuitStatus]} color={PURSUIT_COLORS[a.pursuitStatus]} />
                        </td>
                        <td style={{ padding: '12px 16px', color: '#6B7280', fontSize: 12 }}>
                          {a.owner ? `${a.owner.firstName} ${a.owner.lastName}` : '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={(e) => { e.stopPropagation(); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C4C0D4', display: 'flex' }}>
                            <MoreHorizontal size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: '12px 16px', borderTop: '1px solid #EDE8F3', fontSize: 12, color: '#9CA3AF' }}>
                  Showing {items.length} of {total} {total === 1 ? 'account' : 'accounts'}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function FilterSelect({ value, onChange, label, children }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{
        padding: '8px 12px',
        background: 'white',
        border: '1px solid #EDE8F3',
        borderRadius: 8,
        fontSize: 12,
        color: value ? '#374151' : '#9CA3AF',
        cursor: 'pointer',
        fontFamily: 'inherit',
        minWidth: 140,
      }}>
      <option value="">{label}</option>
      {children}
    </select>
  );
}

function Pill({ label, color }) {
  return (
    <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: color + '18', color, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

function Centered({ children }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #EDE8F3', padding: '60px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </div>
  );
}

function EmptyState({ hasFilters }) {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
      {hasFilters ? (
        <>No accounts match the current filters.</>
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>No accounts yet.</div>
          <Link to="/mobility/accounts/new"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: ACCENT, color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            <Plus size={14} /> Create your first account
          </Link>
        </>
      )}
    </div>
  );
}
