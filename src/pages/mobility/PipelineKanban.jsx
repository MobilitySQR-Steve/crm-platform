import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Search, Plus, Clock, MoreHorizontal, X, ExternalLink, Loader2,
} from 'lucide-react';
import { useOpportunities, useUpdateOpportunity, useUsers } from '../../lib/queries';
import { OPP_STAGE, OPP_STAGE_COLORS, OPP_STAGE_ORDER, initials, fmtMoney, fmtDate } from '../../constants/enums';

const ACCENT = '#8D3B9D';
const TERMINAL = new Set(['CLOSED_WON', 'CLOSED_LOST', 'ON_HOLD']);

const fmtCompact = (n) => {
  const v = typeof n === 'string' ? parseFloat(n) : (n ?? 0);
  if (Number.isNaN(v) || v === 0) return '$0';
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return `$${Math.round(v)}`;
};

const today = () => new Date();
const monthEnd = () => { const d = today(); return new Date(d.getFullYear(), d.getMonth() + 1, 0); };

function closeBadge(closeStr, stage) {
  if (!closeStr || TERMINAL.has(stage)) return null;
  const d = Math.floor((new Date(closeStr) - today()) / 86400000);
  if (d < 0)  return { text: `${Math.abs(d)}d overdue`, color: '#EF4444' };
  if (d === 0) return { text: 'Closes today',           color: '#EF4444' };
  if (d <= 7)  return { text: `${d}d to close`,         color: '#F59E0B' };
  if (d <= 30) return { text: fmtDate(closeStr),        color: '#F59E0B' };
  return        { text: fmtDate(closeStr),              color: '#9CA3AF' };
}

// ── Card ──────────────────────────────────────────────────────────

function DealCard({ opp, stageColor, isDragging, onDragStart, onDragEnd, onClick }) {
  const close = closeBadge(opp.expectedCloseDate, opp.stage);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{
        background: 'white', borderRadius: 10, border: '1px solid #EDE8F3',
        borderLeft: `3px solid ${stageColor}`,
        padding: '11px 12px 10px', marginBottom: 8,
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.3 : 1,
        boxShadow: isDragging ? 'none' : '0 1px 4px rgba(0,0,0,0.05)',
        userSelect: 'none', transition: 'opacity 0.15s',
      }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: stageColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: stageColor, flexShrink: 0, marginTop: 1 }}>
          {initials(opp.account?.name ?? opp.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#0F0A1E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {opp.account?.name ?? '—'}
          </div>
          <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {opp.name}
          </div>
        </div>
        <button onClick={(e) => e.stopPropagation()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', padding: 0, flexShrink: 0 }}>
          <MoreHorizontal size={13} />
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#0F0A1E', letterSpacing: -0.3 }}>{fmtCompact(opp.amountUsd)}</span>
        {opp.account?.industry && (
          <span style={{ fontSize: 10, color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginLeft: 8 }}>
            {opp.account.industry}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
        {close ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
            <Clock size={10} color={close.color} />
            <span style={{ fontSize: 10, color: close.color, fontWeight: 600, whiteSpace: 'nowrap' }}>{close.text}</span>
          </div>
        ) : opp.expectedCloseDate ? (
          <span style={{ fontSize: 10, fontWeight: 600, color: opp.stage === 'CLOSED_WON' ? '#38AC87' : '#9CA3AF' }}>
            {opp.stage === 'CLOSED_WON' ? `✓ ${fmtDate(opp.expectedCloseDate)}` : fmtDate(opp.expectedCloseDate)}
          </span>
        ) : <span />}
        {opp.owner && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: stageColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: stageColor }}>
              {initials(`${opp.owner.firstName} ${opp.owner.lastName}`)}
            </div>
            <span style={{ fontSize: 10, color: '#9CA3AF' }}>{opp.owner.firstName}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Column ────────────────────────────────────────────────────────

function PipelineColumn({ stageId, label, color, opps, dragging, isOver, onDragOver, onDrop, onCardDragStart, onCardDragEnd, onCardClick }) {
  const total = opps.reduce((s, o) => s + (parseFloat(o.amountUsd) || 0), 0);
  const closingThisMonth = opps.filter(o => !TERMINAL.has(stageId) && o.expectedCloseDate && new Date(o.expectedCloseDate) <= monthEnd()).length;

  return (
    <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, marginBottom: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#374151', flex: 1, letterSpacing: 0.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {label.toUpperCase()}
          </span>
          <span style={{ background: color + '20', color, fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 100 }}>{opps.length}</span>
        </div>
        <div style={{ paddingLeft: 14, marginBottom: 10, fontSize: 10, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {total > 0 && <span style={{ fontWeight: 700, color: '#374151' }}>{fmtCompact(total)}</span>}
          {closingThisMonth > 0 && <span style={{ color: '#F59E0B', fontWeight: 700 }}>⚡{closingThisMonth} closing</span>}
        </div>
      </div>

      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          padding: isOver ? '6px' : '2px 0',
          background: isOver ? color + '0C' : 'transparent',
          border: isOver ? `2px dashed ${color}55` : '2px solid transparent',
          borderRadius: 10, transition: 'all 0.12s',
        }}>
        {opps.map(opp => (
          <DealCard
            key={opp.id}
            opp={opp}
            stageColor={color}
            isDragging={dragging === opp.id}
            onDragStart={(e) => onCardDragStart(e, opp.id)}
            onDragEnd={onCardDragEnd}
            onClick={() => onCardClick(opp)}
          />
        ))}
        {opps.length === 0 && !isOver && (
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#D1D5DB', fontSize: 11 }}>Drop here</div>
        )}
      </div>
    </div>
  );
}

// ── Drawer ────────────────────────────────────────────────────────

function Drawer({ opp, onClose, onMove }) {
  if (!opp) return null;
  const color = OPP_STAGE_COLORS[opp.stage] ?? '#9CA3AF';
  const close = closeBadge(opp.expectedCloseDate, opp.stage);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,7,32,0.28)', zIndex: 40, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 400, background: 'white', zIndex: 50, boxShadow: '-6px 0 36px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', fontFamily: 'DM Sans, system-ui, -apple-system, sans-serif' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #EDE8F3', background: color + '08', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: 1, textTransform: 'uppercase', background: color + '18', padding: '3px 10px', borderRadius: 100 }}>{OPP_STAGE[opp.stage]}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}><X size={16} /></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color, flexShrink: 0 }}>
              {initials(opp.account?.name ?? opp.name)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0F0A1E', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opp.account?.name ?? '—'}</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{opp.name}</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ background: color + '0C', border: `1px solid ${color}20`, borderRadius: 10, padding: '14px 18px', marginBottom: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>Amount</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0F0A1E', lineHeight: 1 }}>{fmtMoney(opp.amountUsd)}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>Expected close</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: close?.color ?? '#374151', lineHeight: 1.1 }}>
                {opp.expectedCloseDate ? fmtDate(opp.expectedCloseDate) : '—'}
              </div>
              {close && <div style={{ fontSize: 10, color: close.color, marginTop: 3 }}>{close.text}</div>}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            {[
              { label: 'Account',   value: opp.account?.name ?? '—' },
              { label: 'Owner',     value: opp.owner ? `${opp.owner.firstName} ${opp.owner.lastName}` : '—' },
              { label: 'Industry',  value: opp.account?.industry ?? '—' },
              { label: 'HQ',        value: opp.account?.hqCountry ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid #F3F4F6' }}>
                <span style={{ fontSize: 13, color: '#9CA3AF' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Move to stage</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {OPP_STAGE_ORDER.map(s => {
                const active = s === opp.stage;
                const c = OPP_STAGE_COLORS[s];
                return (
                  <button key={s} onClick={() => onMove(opp.id, s)}
                    style={{ padding: '4px 11px', borderRadius: 100, border: `1px solid ${active ? c : '#EDE8F3'}`, background: active ? c + '18' : 'white', color: active ? c : '#6B7280', fontSize: 11, fontWeight: active ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {OPP_STAGE[s]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid #EDE8F3', display: 'flex', gap: 10, flexShrink: 0 }}>
          {opp.account && (
            <Link to={`/mobility/accounts/${opp.account.id}`}
              style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #EDE8F3', background: 'white', color: '#6B7280', fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              Open account <ExternalLink size={11} />
            </Link>
          )}
          {opp.stage !== 'CLOSED_WON' && (
            <button onClick={() => { onMove(opp.id, 'CLOSED_WON'); onClose(); }}
              style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#38AC87', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Mark Won ✓
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────

export default function PipelineKanban() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);
  const [selected, setSelected] = useState(null);

  const filters = useMemo(() => ({
    ownerId: ownerId || undefined,
    limit: 200,
  }), [ownerId]);

  const { data, isLoading, isError, error, isFetching } = useOpportunities(filters);
  const { data: usersData } = useUsers();
  const users = usersData?.items ?? [];

  const allOpps = data?.items ?? [];
  const update = useUpdateOpportunity();

  // Refresh selected drawer if its opp updates upstream.
  useEffect(() => {
    if (!selected) return;
    const fresh = allOpps.find(o => o.id === selected.id);
    if (fresh && fresh !== selected) setSelected(fresh);
  }, [allOpps, selected]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allOpps;
    return allOpps.filter(o =>
      o.name.toLowerCase().includes(q) ||
      (o.account?.name ?? '').toLowerCase().includes(q),
    );
  }, [allOpps, search]);

  // Drag-and-drop with optimistic stage update.
  const onCardDragStart = (e, id) => {
    setDragging(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onCardDragEnd = () => { setDragging(null); setOver(null); };
  const onColDragOver = (e, sid) => { e.preventDefault(); setOver(sid); };

  const moveStage = (oppId, newStage) => {
    // Optimistic — patch every cached opportunities query.
    qc.setQueriesData({ queryKey: ['opportunities'] }, (old) => {
      if (!old) return old;
      return { ...old, items: old.items.map(o => o.id === oppId ? { ...o, stage: newStage } : o) };
    });
    update.mutate(
      { id: oppId, stage: newStage },
      {
        onError: () => {
          // Roll back by refetching from the server.
          qc.invalidateQueries({ queryKey: ['opportunities'] });
        },
      },
    );
    setSelected(prev => prev?.id === oppId ? { ...prev, stage: newStage } : prev);
  };

  const onColDrop = (e, sid) => {
    e.preventDefault();
    if (dragging) moveStage(dragging, sid);
    setDragging(null); setOver(null);
  };

  // Stats over the filtered active set.
  const active = filtered.filter(o => !TERMINAL.has(o.stage));
  const totalPipe = active.reduce((s, o) => s + (parseFloat(o.amountUsd) || 0), 0);
  const closingMo = active.filter(o => o.expectedCloseDate && new Date(o.expectedCloseDate) <= monthEnd()).length;
  const wonValue = filtered.filter(o => o.stage === 'CLOSED_WON').reduce((s, o) => s + (parseFloat(o.amountUsd) || 0), 0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'DM Sans, system-ui, -apple-system, sans-serif', background: '#F0EBF8', overflow: 'hidden' }}>
      {/* Filter bar */}
      <div style={{ height: 50, background: 'white', borderBottom: '1px solid #EDE8F3', padding: '0 22px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#F7F4FC', border: '1px solid #EDE8F3', borderRadius: 7, padding: '6px 12px', width: 240 }}>
          <Search size={13} color="#9CA3AF" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search accounts or deals..."
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: '#374151', width: '100%', fontFamily: 'inherit' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap' }}>Owner:</span>
          <button onClick={() => setOwnerId('')}
            style={{ padding: '3px 10px', borderRadius: 100, border: `1px solid ${!ownerId ? ACCENT : '#EDE8F3'}`, background: !ownerId ? ACCENT + '15' : 'white', color: !ownerId ? ACCENT : '#6B7280', fontSize: 11, fontWeight: !ownerId ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
            All
          </button>
          {users.map(u => {
            const active = ownerId === u.id;
            return (
              <button key={u.id} onClick={() => setOwnerId(u.id)}
                style={{ padding: '3px 10px', borderRadius: 100, border: `1px solid ${active ? ACCENT : '#EDE8F3'}`, background: active ? ACCENT + '15' : 'white', color: active ? ACCENT : '#6B7280', fontSize: 11, fontWeight: active ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                {u.firstName}
              </button>
            );
          })}
        </div>
        <div style={{ flex: 1 }} />
        {isFetching && !isLoading && (
          <span style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Loader2 size={12} className="spin" /> refreshing
          </span>
        )}
      </div>

      {/* Stats strip */}
      <div style={{ height: 38, background: '#F7F4FC', borderBottom: '1px solid #EDE8F3', padding: '0 22px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, fontSize: 12 }}>
        <span style={{ color: '#6B7280' }}>Active pipeline <b style={{ color: '#374151' }}>{fmtCompact(totalPipe)}</b></span>
        <span style={{ color: '#D1D5DB' }}>|</span>
        <span style={{ color: '#6B7280' }}>{filtered.length} {filtered.length === 1 ? 'deal' : 'deals'}</span>
        {closingMo > 0 && <>
          <span style={{ color: '#D1D5DB' }}>|</span>
          <span style={{ color: '#F59E0B', fontWeight: 600 }}>⚡ {closingMo} closing this month</span>
        </>}
        {wonValue > 0 && <>
          <span style={{ color: '#D1D5DB' }}>|</span>
          <span style={{ color: '#6B7280' }}>Won <b style={{ color: '#38AC87' }}>{fmtCompact(wonValue)}</b></span>
        </>}
        {(search || ownerId) && <>
          <span style={{ color: '#D1D5DB' }}>|</span>
          <button onClick={() => { setSearch(''); setOwnerId(''); }} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
            <X size={10} /> Clear filters
          </button>
        </>}
      </div>

      {/* States */}
      {isLoading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 13 }}>
          <Loader2 size={18} className="spin" style={{ marginRight: 8 }} /> Loading pipeline…
        </div>
      )}
      {isError && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B91C1C', fontSize: 13 }}>
          Failed to load pipeline: {error?.message ?? 'unknown error'}
        </div>
      )}

      {/* Board */}
      {!isLoading && !isError && (
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
          <div style={{ display: 'flex', gap: 12, height: '100%', padding: '16px 22px 20px', minWidth: 'max-content', boxSizing: 'border-box' }}>
            {OPP_STAGE_ORDER.map(stageId => (
              <PipelineColumn
                key={stageId}
                stageId={stageId}
                label={OPP_STAGE[stageId]}
                color={OPP_STAGE_COLORS[stageId]}
                opps={filtered.filter(o => o.stage === stageId)}
                dragging={dragging}
                isOver={over === stageId}
                onDragOver={(e) => onColDragOver(e, stageId)}
                onDrop={(e) => onColDrop(e, stageId)}
                onCardDragStart={onCardDragStart}
                onCardDragEnd={onCardDragEnd}
                onCardClick={setSelected}
              />
            ))}
          </div>
        </div>
      )}

      <Drawer opp={selected} onClose={() => setSelected(null)} onMove={moveStage} />

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
