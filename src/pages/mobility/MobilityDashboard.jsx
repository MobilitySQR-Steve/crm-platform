import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, TrendingUp, DollarSign, BarChart3,
  Plus, ChevronRight, Loader2,
} from 'lucide-react';
import { useAccounts, useOpportunities } from '../../lib/queries';
import { OPP_STAGE, OPP_STAGE_COLORS, OPP_STAGE_ORDER, fmtMoney } from '../../constants/enums';

const ACCENT = '#2563EB';
const TERMINAL = new Set(['CLOSED_WON', 'CLOSED_LOST', 'ON_HOLD']);

// Pipeline stages we visualize (active funnel — terminal/paused excluded).
const FUNNEL_STAGES = OPP_STAGE_ORDER.filter(s => !TERMINAL.has(s));

const fmtCompact = (n) => {
  const v = typeof n === 'string' ? parseFloat(n) : (n ?? 0);
  if (Number.isNaN(v) || v === 0) return '$0';
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return `$${Math.round(v)}`;
};

function StatCard({ label, value, sub, color, Icon, loading }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: '18px 20px', border: '1px solid #EDE8F3', flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 8, fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#0F0A1E', lineHeight: 1 }}>
            {loading ? <Loader2 size={18} className="spin" color="#C4C0D4" /> : value}
          </div>
          {sub && !loading && <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 5 }}>{sub}</div>}
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={17} color={color} />
        </div>
      </div>
    </div>
  );
}

export default function MobilityDashboard() {
  // Just want the total — limit=1 keeps the payload tiny.
  const { data: accountsData, isLoading: loadingAccounts } = useAccounts({ limit: 1 });
  // For opp stats we need every row so we can group + sum client-side.
  const { data: oppsData, isLoading: loadingOpps } = useOpportunities({ limit: 200 });

  const accountsTotal = accountsData?.total ?? 0;
  const opps = oppsData?.items ?? [];

  const stats = useMemo(() => {
    const active = opps.filter(o => !TERMINAL.has(o.stage));
    const totalPipe = active.reduce((s, o) => s + (parseFloat(o.amountUsd) || 0), 0);
    const won = opps.filter(o => o.stage === 'CLOSED_WON');
    const lost = opps.filter(o => o.stage === 'CLOSED_LOST');
    const winRate = (won.length + lost.length) > 0
      ? Math.round((won.length / (won.length + lost.length)) * 100)
      : null;

    // Group active opps by stage for the funnel chart
    const byStage = FUNNEL_STAGES.map(stage => {
      const inStage = active.filter(o => o.stage === stage);
      return {
        stage,
        count: inStage.length,
        value: inStage.reduce((s, o) => s + (parseFloat(o.amountUsd) || 0), 0),
      };
    });
    const maxValue = Math.max(1, ...byStage.map(s => s.value));

    // Recent active for the right-hand table
    const recent = [...active]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 6);

    return { active, totalPipe, wonCount: won.length, lostCount: lost.length, winRate, byStage, maxValue, recent };
  }, [opps]);

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F0EBF8' }}>
      <div style={{ padding: '22px 28px 40px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F0A1E', margin: 0 }}>Dashboard</h1>
            <div style={{ fontSize: 14, color: '#9CA3AF', marginTop: 3 }}>MobilitySQR · B2B Sales Pipeline</div>
          </div>
          <Link to="/mobility/accounts/new"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: ACCENT, color: 'white', borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            <Plus size={14} /> New Account
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <StatCard label="Accounts"        value={accountsTotal} sub={accountsTotal === 1 ? 'in pipeline' : 'in pipeline'} color={ACCENT}    Icon={Building2}  loading={loadingAccounts} />
          <StatCard label="Active Opps"     value={stats.active.length}                                                       color="#00BFE6"   Icon={TrendingUp}  loading={loadingOpps} />
          <StatCard label="Pipeline Value"  value={fmtCompact(stats.totalPipe)}                                              color="#F9B878"   Icon={DollarSign}  loading={loadingOpps} />
          <StatCard label="Win Rate"        value={stats.winRate != null ? `${stats.winRate}%` : '—'} sub={`${stats.wonCount} won · ${stats.lostCount} lost`} color="#38AC87"   Icon={BarChart3}   loading={loadingOpps} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 14 }}>
          {/* Pipeline by stage */}
          <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #EDE8F3' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0F0A1E', marginBottom: 16 }}>Pipeline by Stage</div>
            {loadingOpps ? (
              <Skeleton lines={5} />
            ) : stats.byStage.every(s => s.count === 0) ? (
              <div style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', padding: '20px 0' }}>
                No active opportunities yet.
                <div style={{ marginTop: 8 }}>
                  <Link to="/mobility/pipeline/kanban" style={{ color: ACCENT, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Open kanban →</Link>
                </div>
              </div>
            ) : (
              stats.byStage.map(s => (
                <div key={s.stage} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 14 }}>
                    <span style={{ color: '#6B7280' }}>{OPP_STAGE[s.stage]}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ color: '#9CA3AF' }}>{s.count}</span>
                      <span style={{ fontWeight: 600, color: '#374151' }}>{fmtCompact(s.value)}</span>
                    </div>
                  </div>
                  <div style={{ height: 5, background: '#F3F4F6', borderRadius: 3 }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      width: `${(s.value / stats.maxValue) * 100}%`,
                      background: OPP_STAGE_COLORS[s.stage], opacity: 0.75,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Recent active opps */}
          <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #EDE8F3' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0F0A1E' }}>Recent Active Opportunities</div>
              <Link to="/mobility/pipeline/kanban" style={{ fontSize: 14, color: ACCENT, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
                View pipeline <ChevronRight size={12} />
              </Link>
            </div>
            {loadingOpps ? (
              <Skeleton lines={5} />
            ) : stats.recent.length === 0 ? (
              <div style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', padding: '24px 0' }}>
                No opportunities yet — open an account and click "New Opportunity".
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
                <thead>
                  <tr>
                    {['Account', 'Stage', 'Amount', 'Owner'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0 8px 10px', color: '#9CA3AF', fontWeight: 500, fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.map(o => {
                    const color = OPP_STAGE_COLORS[o.stage];
                    return (
                      <tr key={o.id} style={{ borderTop: '1px solid #F8F7FC' }}>
                        <td style={{ padding: '10px 8px' }}>
                          <Link to={o.account ? `/mobility/accounts/${o.account.id}` : '#'}
                            style={{ fontWeight: 500, color: '#0F0A1E', textDecoration: 'none' }}>
                            {o.account?.name ?? '—'}
                          </Link>
                          <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 1 }}>{o.name}</div>
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <span style={{ padding: '3px 9px', borderRadius: 100, fontSize: 13, fontWeight: 600, background: color + '18', color }}>
                            {OPP_STAGE[o.stage]}
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px', fontWeight: 600, color: '#374151' }}>{fmtMoney(o.amountUsd)}</td>
                        <td style={{ padding: '10px 8px', color: '#6B7280', fontSize: 14 }}>
                          {o.owner ? `${o.owner.firstName} ${o.owner.lastName}` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
          {[
            { label: 'Open Pipeline Kanban', path: '/mobility/pipeline/kanban', color: ACCENT },
            { label: 'View All Accounts',    path: '/mobility/accounts',         color: '#6B7280' },
          ].map(l => (
            <Link key={l.label} to={l.path}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'white', border: '1px solid #EDE8F3', borderRadius: 8, fontSize: 15, fontWeight: 500, color: l.color, textDecoration: 'none' }}>
              {l.label} <ChevronRight size={13} />
            </Link>
          ))}
        </div>
      </div>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Skeleton({ lines = 4 }) {
  return (
    <div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{ height: 28, background: '#F3F4F6', borderRadius: 6, marginBottom: 8, opacity: 1 - i * 0.12 }} />
      ))}
    </div>
  );
}
