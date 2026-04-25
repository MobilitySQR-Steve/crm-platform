import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Globe, Linkedin, MapPin, Pencil, Plus, Mail, Phone,
  CheckCircle2, AlertCircle, Loader2, Sparkles, Clock, ArrowLeft, ExternalLink,
} from 'lucide-react';
import { useAccount, useEnrichAccount } from '../../lib/queries';
import { ApiError } from '../../lib/api';
import {
  EMPLOYEE_BAND, MOVES_BAND, TRIGGER_EVENT, PURSUIT_STATUS, PURSUIT_COLORS,
  ACCOUNT_SOURCE, OPP_STAGE, OPP_STAGE_COLORS,
  CONTACT_PERSONA, CONTACT_PERSONA_COLORS,
  ACTIVITY_TYPE, ACTIVITY_COLORS, ACTIVITY_ICONS,
  ENRICHMENT_STATUS_COLORS,
  initials, fmtDate, fmtDateTime, fmtMoney,
} from '../../constants/enums';
import AddContactModal from './account/AddContactModal';
import AddOpportunityModal from './account/AddOpportunityModal';
import LogActivityModal from './account/LogActivityModal';

const ACCENT = '#2563EB';

export default function AccountDetail() {
  const { id } = useParams();
  const { data: account, isLoading, isError, error } = useAccount(id);
  const [tab, setTab] = useState('overview');
  const [contactOpen, setContactOpen] = useState(false);
  const [oppOpen, setOppOpen] = useState(false);
  const [actOpen, setActOpen] = useState(false);

  if (isLoading) {
    return <div style={{ padding: 40, color: '#9CA3AF', fontSize: 15 }}>
      <Loader2 size={16} className="spin" style={{ marginRight: 8, verticalAlign: 'middle' }} />
      Loading account…
    </div>;
  }

  if (isError) {
    return <div style={{ padding: 40, color: '#B91C1C', fontSize: 15 }}>
      Failed to load account: {error?.message ?? 'unknown error'}
    </div>;
  }

  if (!account) {
    return <div style={{ padding: 40 }}>
      <Link to="/mobility/accounts" style={{ color: ACCENT, fontSize: 15, textDecoration: 'none' }}>← Back to accounts</Link>
      <div style={{ marginTop: 20, color: '#6B7280', fontSize: 16 }}>Account not found.</div>
    </div>;
  }

  const TABS = [
    { id: 'overview',     label: 'Overview' },
    { id: 'contacts',     label: 'Contacts',     count: account.contacts?.length },
    { id: 'opportunities', label: 'Opportunities', count: account.opportunities?.length },
    { id: 'activities',   label: 'Activities',   count: account._count?.activities ?? account.activities?.length },
    { id: 'enrichment',   label: 'Enrichment',   count: account.enrichmentRuns?.length },
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F0EBF8', fontFamily: 'DM Sans, system-ui, -apple-system, sans-serif' }}>
      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{ background: 'white', borderBottom: '1px solid #ECEAF3', padding: '20px 28px 0' }}>
        <Link to="/mobility/accounts" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, color: '#6B7280', textDecoration: 'none', marginBottom: 12 }}>
          <ArrowLeft size={12} /> Back to accounts
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{
              width: 58, height: 58, borderRadius: 14,
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}AA)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: 'white', flexShrink: 0,
              boxShadow: `0 4px 14px ${ACCENT}35`,
            }}>
              {initials(account.name)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F0A1E', margin: 0, lineHeight: 1 }}>{account.name}</h1>
                <Pill label={PURSUIT_STATUS[account.pursuitStatus]} color={PURSUIT_COLORS[account.pursuitStatus]} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                {account.website && (
                  <a href={account.website} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 15, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}>
                    <Globe size={12} color="#9CA3AF" /> {account.domain || account.website} <ExternalLink size={10} color="#C4C0D4" />
                  </a>
                )}
                {account.linkedinUrl && (
                  <a href={account.linkedinUrl} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 15, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}>
                    <Linkedin size={12} color="#9CA3AF" /> LinkedIn <ExternalLink size={10} color="#C4C0D4" />
                  </a>
                )}
                {(account.hqCountry || account.hqCity) && (
                  <span style={{ fontSize: 15, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <MapPin size={12} color="#9CA3AF" /> {[account.hqCity, account.hqCountry].filter(Boolean).join(', ')}
                  </span>
                )}
                {account.owner && (
                  <span style={{ fontSize: 15, color: '#6B7280' }}>
                    Owner: <b style={{ color: '#374151' }}>{account.owner.firstName} {account.owner.lastName}</b>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Link to={`/mobility/accounts/${account.id}/edit`}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', background: 'white', border: '1px solid #ECEAF3', borderRadius: 8, fontSize: 15, color: '#6B7280', textDecoration: 'none', fontWeight: 500 }}>
              <Pencil size={13} /> Edit
            </Link>
            <button onClick={() => setOppOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', background: ACCENT, color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus size={13} /> New Opportunity
            </button>
          </div>
        </div>

        {/* Quick stats row */}
        <div style={{ display: 'flex', borderTop: '1px solid #F3F4F6', marginBottom: 0, overflowX: 'auto' }}>
          {[
            { label: 'Employees',     value: EMPLOYEE_BAND[account.employeeBand] },
            { label: 'Moves / yr',    value: MOVES_BAND[account.crossBorderMovesBand] },
            { label: 'Countries',     value: account.countriesWithEmployees?.length || 0 },
            { label: 'Opportunities', value: account.opportunities?.length || 0, color: account.opportunities?.length ? ACCENT : undefined },
            { label: 'Contacts',      value: account.contacts?.length || 0 },
            { label: 'Source',        value: ACCOUNT_SOURCE[account.source] },
            { label: 'Last enriched', value: account.lastEnrichedAt ? fmtDate(account.lastEnrichedAt) : 'Never', color: account.lastEnrichedAt ? '#374151' : '#C4C0D4' },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: '12px 20px', borderLeft: i > 0 ? '1px solid #F3F4F6' : 'none', flexShrink: 0 }}>
              <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: s.color ?? '#0F0A1E', whiteSpace: 'nowrap' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginTop: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '12px 20px',
                fontSize: 15, fontWeight: tab === t.id ? 600 : 400,
                color: tab === t.id ? ACCENT : '#6B7280',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: `2px solid ${tab === t.id ? ACCENT : 'transparent'}`,
                whiteSpace: 'nowrap', fontFamily: 'inherit',
              }}>
              {t.label}
              {t.count !== undefined && t.count !== null && (
                <span style={{ background: tab === t.id ? ACCENT + '18' : '#F3F4F6', color: tab === t.id ? ACCENT : '#9CA3AF', fontSize: 12, fontWeight: 700, padding: '1px 7px', borderRadius: 100 }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────── */}
      <div style={{ padding: '22px 28px 40px', maxWidth: 1100, margin: '0 auto' }}>
        {tab === 'overview'      && <OverviewTab account={account} />}
        {tab === 'contacts'      && <ContactsTab account={account} onAdd={() => setContactOpen(true)} />}
        {tab === 'opportunities' && <OpportunitiesTab account={account} onAdd={() => setOppOpen(true)} />}
        {tab === 'activities'    && <ActivitiesTab account={account} onLog={() => setActOpen(true)} />}
        {tab === 'enrichment'    && <EnrichmentTab account={account} />}
      </div>

      <AddContactModal open={contactOpen} onClose={() => setContactOpen(false)} accountId={account.id} />
      <AddOpportunityModal open={oppOpen} onClose={() => setOppOpen(false)} accountId={account.id} />
      <LogActivityModal open={actOpen} onClose={() => setActOpen(false)} accountId={account.id} />

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Atoms ─────────────────────────────────────────────────────────

const Pill = ({ label, color }) => (
  <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 13, fontWeight: 600, background: color + '18', color, whiteSpace: 'nowrap' }}>{label}</span>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: 'white', borderRadius: 12, border: '1px solid #ECEAF3', padding: '20px 22px', ...style }}>{children}</div>
);

const SecTitle = ({ children }) => (
  <div style={{ fontSize: 13, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 14 }}>{children}</div>
);

const FieldRow = ({ label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #F3F4F6', gap: 12 }}>
    <span style={{ fontSize: 15, color: '#9CA3AF', flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: 15, fontWeight: 500, color: color || '#374151', textAlign: 'right', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || '—'}</span>
  </div>
);

const Empty = ({ icon: Icon, title, action }) => (
  <Card style={{ padding: '40px 22px', textAlign: 'center' }}>
    {Icon && <Icon size={28} color="#C4C0D4" style={{ marginBottom: 10 }} />}
    <div style={{ fontSize: 15, color: '#9CA3AF', marginBottom: action ? 14 : 0 }}>{title}</div>
    {action}
  </Card>
);

// ── Tabs ──────────────────────────────────────────────────────────

function OverviewTab({ account }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card>
          <SecTitle>Identity</SecTitle>
          <FieldRow label="Name"      value={account.name} />
          <FieldRow label="Domain"    value={account.domain} />
          <FieldRow label="HQ"        value={[account.hqCity, account.hqCountry].filter(Boolean).join(', ')} />
          <FieldRow label="Industry"  value={account.industry} />
          <FieldRow label="Website"   value={account.website} />
          <FieldRow label="LinkedIn"  value={account.linkedinUrl} />
        </Card>
        <Card>
          <SecTitle>Pursuit</SecTitle>
          <FieldRow label="Status"        value={PURSUIT_STATUS[account.pursuitStatus]} color={PURSUIT_COLORS[account.pursuitStatus]} />
          <FieldRow label="Source"        value={ACCOUNT_SOURCE[account.source]} />
          <FieldRow label="Owner"         value={account.owner ? `${account.owner.firstName} ${account.owner.lastName}` : null} />
          <FieldRow label="Trigger"       value={TRIGGER_EVENT[account.triggerEvent]} />
          {account.triggerNote && (
            <div style={{ padding: '12px 0 4px', fontSize: 15, color: '#374151', lineHeight: 1.55 }}>{account.triggerNote}</div>
          )}
        </Card>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card>
          <SecTitle>Fit signals</SecTitle>
          <FieldRow label="Employees"           value={EMPLOYEE_BAND[account.employeeBand]} />
          <FieldRow label="Cross-border moves"  value={MOVES_BAND[account.crossBorderMovesBand]} />
          <FieldRow label="Countries with EE"   value={account.countriesWithEmployees?.length ? account.countriesWithEmployees.join(', ') : null} />
          <div style={{ padding: '12px 0 0' }}>
            <div style={{ fontSize: 15, color: '#9CA3AF', marginBottom: 8 }}>Current tooling</div>
            {account.currentToolingTags?.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {account.currentToolingTags.map(t => (
                  <span key={t} style={{ padding: '3px 9px', background: '#F3F4F6', color: '#6B7280', borderRadius: 6, fontSize: 13, fontWeight: 500 }}>{t}</span>
                ))}
              </div>
            ) : <div style={{ fontSize: 15, color: '#C4C0D4' }}>—</div>}
          </div>
        </Card>
        <Card>
          <SecTitle>Enrichment</SecTitle>
          <FieldRow label="Last enriched" value={account.lastEnrichedAt ? fmtDateTime(account.lastEnrichedAt) : null} />
          <FieldRow label="Confidence"    value={account.enrichmentConfidence != null ? `${Math.round(account.enrichmentConfidence * 100)}%` : null} />
          <FieldRow label="Recent runs"   value={account.enrichmentRuns?.length || 0} />
        </Card>
      </div>
    </div>
  );
}

function ContactsTab({ account, onAdd }) {
  const contacts = account.contacts ?? [];
  if (contacts.length === 0) {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
          <NewBtn onClick={onAdd} label="Add Contact" />
        </div>
        <Empty title="No contacts yet for this account." />
      </>
    );
  }
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <NewBtn onClick={onAdd} label="Add Contact" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {contacts.map(c => (
          <Card key={c.id} style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: CONTACT_PERSONA_COLORS[c.persona] + '1A', color: CONTACT_PERSONA_COLORS[c.persona], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                {initials(`${c.firstName} ${c.lastName}`)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#0F0A1E' }}>{c.firstName} {c.lastName}</span>
                  <Pill label={CONTACT_PERSONA[c.persona]} color={CONTACT_PERSONA_COLORS[c.persona]} />
                  {c.isPrimary && <span style={{ padding: '2px 8px', background: '#FEF3C7', color: '#92400E', borderRadius: 100, fontSize: 12, fontWeight: 700 }}>PRIMARY</span>}
                </div>
                {c.title && <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 6 }}>{c.title}</div>}
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 14, color: '#6B7280' }}>
                  {c.email && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={11} /> <a href={`mailto:${c.email}`} style={{ color: '#6B7280', textDecoration: 'none' }}>{c.email}</a></span>}
                  {c.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} /> {c.phone}</span>}
                  {c.linkedinUrl && <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280', textDecoration: 'none' }}><Linkedin size={11} /> LinkedIn</a>}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function OpportunitiesTab({ account, onAdd }) {
  const opps = account.opportunities ?? [];
  if (opps.length === 0) {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
          <NewBtn onClick={onAdd} label="New Opportunity" />
        </div>
        <Empty title="No opportunities yet." />
      </>
    );
  }
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <NewBtn onClick={onAdd} label="New Opportunity" />
      </div>
      <Card style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ECEAF3' }}>
              {['Name', 'Stage', 'Amount', 'Expected close', 'Owner'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '11px 16px', color: '#9CA3AF', fontWeight: 500, fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {opps.map(o => (
              <tr key={o.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                <td style={{ padding: '13px 16px', fontWeight: 600, color: '#0F0A1E' }}>{o.name}</td>
                <td style={{ padding: '13px 16px' }}><Pill label={OPP_STAGE[o.stage]} color={OPP_STAGE_COLORS[o.stage]} /></td>
                <td style={{ padding: '13px 16px', color: '#374151', fontWeight: 600 }}>{fmtMoney(o.amountUsd)}</td>
                <td style={{ padding: '13px 16px', color: '#6B7280' }}>{fmtDate(o.expectedCloseDate)}</td>
                <td style={{ padding: '13px 16px', color: '#6B7280' }}>
                  {o.owner ? `${o.owner.firstName} ${o.owner.lastName}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function ActivitiesTab({ account, onLog }) {
  const acts = account.activities ?? [];
  if (acts.length === 0) {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
          <NewBtn onClick={onLog} label="Log Activity" variant="secondary" />
        </div>
        <Empty title="No activities yet." />
      </>
    );
  }
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <NewBtn onClick={onLog} label="Log Activity" variant="secondary" />
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 19, top: 20, bottom: 16, width: 2, background: '#ECEAF3', borderRadius: 2 }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {acts.map(a => {
            const color = ACTIVITY_COLORS[a.type] ?? '#9CA3AF';
            const icon = ACTIVITY_ICONS[a.type] ?? '•';
            return (
              <div key={a.id} style={{ display: 'flex', gap: 16, paddingBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: color + '15', border: `2px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0, position: 'relative', zIndex: 1, marginTop: 2 }}>
                  {icon}
                </div>
                <div style={{ flex: 1, background: 'white', borderRadius: 10, border: '1px solid #ECEAF3', padding: '13px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5, gap: 12 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>{a.subject}</span>
                    <span style={{ fontSize: 13, color: '#9CA3AF', whiteSpace: 'nowrap', flexShrink: 0 }}>{fmtDateTime(a.occurredAt)}</span>
                  </div>
                  {a.body && <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.55, margin: '0 0 8px' }}>{a.body}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Pill label={ACTIVITY_TYPE[a.type]} color={color} />
                    {a.user && (
                      <span style={{ fontSize: 13, color: '#9CA3AF' }}>by {a.user.firstName} {a.user.lastName}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function EnrichmentTab({ account }) {
  const runs = account.enrichmentRuns ?? [];
  const enrich = useEnrichAccount();
  const [forceFlag, setForceFlag] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [lastError, setLastError] = useState(null);

  async function runEnrichment() {
    setLastResult(null);
    setLastError(null);
    try {
      const result = await enrich.mutateAsync({ accountId: account.id, force: forceFlag });
      setLastResult(result);
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setLastError('Enrichment is disabled — set ANTHROPIC_API_KEY in api/.env and restart the server.');
      } else if (err instanceof ApiError) {
        setLastError(err.details?.message ?? err.code ?? `Request failed (${err.status})`);
      } else {
        setLastError(err?.message ?? 'Unknown error');
      }
    }
  }

  return (
    <>
      {/* Action header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 14, color: '#6B7280' }}>
          {account.lastEnrichedAt
            ? <>Last enriched <b style={{ color: '#374151' }}>{fmtDateTime(account.lastEnrichedAt)}</b>{account.enrichmentConfidence != null && <> · confidence <b style={{ color: '#374151' }}>{Math.round(account.enrichmentConfidence * 100)}%</b></>}</>
            : <>Never enriched. Click <b>Run enrichment</b> to research this account via web search.</>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#6B7280' }}>
            <input type="checkbox" checked={forceFlag} onChange={(e) => setForceFlag(e.target.checked)} disabled={enrich.isPending} />
            Force re-run
          </label>
          <button onClick={runEnrichment} disabled={enrich.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: ACCENT, color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: enrich.isPending ? 'not-allowed' : 'pointer', opacity: enrich.isPending ? 0.6 : 1, fontFamily: 'inherit' }}>
            {enrich.isPending
              ? <><Loader2 size={13} className="spin" /> Researching…</>
              : <><Sparkles size={13} /> Run enrichment</>}
          </button>
        </div>
      </div>

      {/* Status banner */}
      {enrich.isPending && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', borderRadius: 10, padding: '12px 16px', fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Loader2 size={14} className="spin" /> Web research in progress — this typically takes 30–60 seconds.
        </div>
      )}
      {lastError && !enrich.isPending && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 10, padding: '12px 16px', fontSize: 14, marginBottom: 14 }}>
          <b>Enrichment failed:</b> {lastError}
        </div>
      )}
      {lastResult?.skipped && !enrich.isPending && (
        <div style={{ background: '#FEFCE8', border: '1px solid #FEF08A', color: '#A16207', borderRadius: 10, padding: '12px 16px', fontSize: 14, marginBottom: 14 }}>
          <b>Skipped:</b> {lastResult.reason}. Tick "Force re-run" to enrich anyway.
        </div>
      )}
      {lastResult && !lastResult.skipped && !enrich.isPending && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D', borderRadius: 10, padding: '12px 16px', fontSize: 14, marginBottom: 14 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Enrichment complete · {lastResult.status} · confidence {Math.round((lastResult.confidence ?? 0) * 100)}%</div>
          {lastResult.fieldsUpdated?.length > 0
            ? <div>Fields filled: {lastResult.fieldsUpdated.join(', ')}</div>
            : <div>No new fields added — model did not find new information.</div>}
          {lastResult.rationale && <div style={{ marginTop: 6, fontSize: 13, color: '#15803D', opacity: 0.85 }}>{lastResult.rationale}</div>}
        </div>
      )}

      {/* Run history */}
      {runs.length === 0 ? (
        <Empty icon={Sparkles} title="No enrichment runs yet for this account." />
      ) : (
        <Card style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ECEAF3' }}>
                {['Started', 'Kind', 'Status', 'Fields updated', 'Confidence', 'Model'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '11px 16px', color: '#9CA3AF', fontWeight: 500, fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.map(r => {
                const color = ENRICHMENT_STATUS_COLORS[r.status] ?? '#9CA3AF';
                const StatusIcon = r.status === 'SUCCESS' ? CheckCircle2 : r.status === 'FAILED' ? AlertCircle : r.status === 'RUNNING' ? Loader2 : Clock;
                return (
                  <tr key={r.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '13px 16px', color: '#374151' }}>{fmtDateTime(r.startedAt)}</td>
                    <td style={{ padding: '13px 16px', color: '#6B7280' }}>{r.kind}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 100, fontSize: 13, fontWeight: 600, background: color + '18', color }}>
                        <StatusIcon size={11} className={r.status === 'RUNNING' ? 'spin' : ''} /> {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', color: '#6B7280', fontSize: 14 }}>
                      {r.fieldsUpdated?.length ? r.fieldsUpdated.join(', ') : '—'}
                    </td>
                    <td style={{ padding: '13px 16px', color: '#374151' }}>
                      {r.confidence != null ? `${Math.round(r.confidence * 100)}%` : '—'}
                    </td>
                    <td style={{ padding: '13px 16px', color: '#9CA3AF', fontSize: 14 }}>{r.modelUsed || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

function NewBtn({ onClick, label, variant = 'primary' }) {
  if (variant === 'secondary') {
    return (
      <button onClick={onClick}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'white', color: '#374151', border: '1px solid #ECEAF3', borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
        <Plus size={13} /> {label}
      </button>
    );
  }
  return (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: ACCENT, color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
      <Plus size={13} /> {label}
    </button>
  );
}
