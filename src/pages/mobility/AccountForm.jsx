import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import {
  useAccount, useCreateAccount, useUpdateAccount, useDeleteAccount, useUsers,
} from '../../lib/queries';
import {
  EMPLOYEE_BAND, MOVES_BAND, TRIGGER_EVENT, PURSUIT_STATUS, ACCOUNT_SOURCE,
} from '../../constants/enums';

const ACCENT = '#8D3B9D';

const EMPTY = {
  name: '', domain: '', website: '', linkedinUrl: '',
  hqCountry: '', hqCity: '', industry: '',
  employeeBand: 'UNKNOWN', crossBorderMovesBand: 'UNKNOWN',
  countriesWithEmployees: '', currentToolingTags: '',
  triggerEvent: 'UNKNOWN', triggerNote: '',
  pursuitStatus: 'NEW', source: 'MANUAL',
  ownerId: '',
};

function fromApi(a) {
  return {
    name: a.name ?? '',
    domain: a.domain ?? '',
    website: a.website ?? '',
    linkedinUrl: a.linkedinUrl ?? '',
    hqCountry: a.hqCountry ?? '',
    hqCity: a.hqCity ?? '',
    industry: a.industry ?? '',
    employeeBand: a.employeeBand ?? 'UNKNOWN',
    crossBorderMovesBand: a.crossBorderMovesBand ?? 'UNKNOWN',
    countriesWithEmployees: (a.countriesWithEmployees ?? []).join(', '),
    currentToolingTags: (a.currentToolingTags ?? []).join(', '),
    triggerEvent: a.triggerEvent ?? 'UNKNOWN',
    triggerNote: a.triggerNote ?? '',
    pursuitStatus: a.pursuitStatus ?? 'NEW',
    source: a.source ?? 'MANUAL',
    ownerId: a.ownerId ?? '',
  };
}

function toApi(form) {
  // Empty strings → null so the DB doesn't store '' for nullable columns.
  const nz = (s) => (s.trim() === '' ? null : s.trim());
  const csv = (s) => s.split(',').map(x => x.trim()).filter(Boolean);
  return {
    name: form.name.trim(),
    domain: nz(form.domain),
    website: nz(form.website),
    linkedinUrl: nz(form.linkedinUrl),
    hqCountry: nz(form.hqCountry)?.toUpperCase() ?? null,
    hqCity: nz(form.hqCity),
    industry: nz(form.industry),
    employeeBand: form.employeeBand,
    crossBorderMovesBand: form.crossBorderMovesBand,
    countriesWithEmployees: csv(form.countriesWithEmployees).map(s => s.toUpperCase()),
    currentToolingTags: csv(form.currentToolingTags),
    triggerEvent: form.triggerEvent,
    triggerNote: nz(form.triggerNote),
    pursuitStatus: form.pursuitStatus,
    source: form.source,
    ownerId: form.ownerId || null,
  };
}

export default function AccountForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: account, isLoading: loadingAccount } = useAccount(id);
  const { data: usersData } = useUsers();
  const users = usersData?.items ?? [];

  const create = useCreateAccount();
  const update = useUpdateAccount();
  const del = useDeleteAccount();

  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isEdit && account) setForm(fromApi(account));
  }, [isEdit, account]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const submitting = create.isPending || update.isPending;

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError('Account name is required.');
      return;
    }
    try {
      const payload = toApi(form);
      if (isEdit) {
        await update.mutateAsync({ id, ...payload });
        navigate(`/mobility/accounts/${id}`);
      } else {
        const created = await create.mutateAsync(payload);
        navigate(`/mobility/accounts/${created.id}`);
      }
    } catch (err) {
      setError(err?.code || err?.message || 'Failed to save account.');
    }
  }

  async function onDelete() {
    if (!isEdit) return;
    try {
      await del.mutateAsync(id);
      navigate('/mobility/accounts');
    } catch (err) {
      setError(err?.code || err?.message || 'Failed to delete account.');
    }
  }

  if (isEdit && loadingAccount) {
    return <div style={{ padding: 40, color: '#9CA3AF', fontSize: 13 }}>Loading…</div>;
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F0EBF8' }}>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '22px 28px 60px' }}>
        {/* Header */}
        <div style={{ marginBottom: 18 }}>
          <Link to={isEdit ? `/mobility/accounts/${id}` : '/mobility/accounts'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#6B7280', fontSize: 12, textDecoration: 'none', marginBottom: 12 }}>
            <ArrowLeft size={13} /> {isEdit ? 'Back to account' : 'Back to accounts'}
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F0A1E', margin: 0 }}>
            {isEdit ? 'Edit account' : 'New account'}
          </h1>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
            {isEdit ? 'Update fields and save.' : 'Add a company to your pipeline.'}
          </div>
        </div>

        <form onSubmit={onSubmit}>
          {/* Identity */}
          <Section title="Identity">
            <Row>
              <Field label="Name *" value={form.name} onChange={set('name')} required disabled={submitting} />
              <Field label="Domain" value={form.domain} onChange={set('domain')} placeholder="acme.com" disabled={submitting} />
            </Row>
            <Row>
              <Field label="Website" value={form.website} onChange={set('website')} placeholder="https://acme.com" disabled={submitting} />
              <Field label="LinkedIn URL" value={form.linkedinUrl} onChange={set('linkedinUrl')} placeholder="https://linkedin.com/company/..." disabled={submitting} />
            </Row>
            <Row>
              <Field label="HQ country (ISO)" value={form.hqCountry} onChange={set('hqCountry')} placeholder="US" maxLength={2} disabled={submitting} />
              <Field label="HQ city" value={form.hqCity} onChange={set('hqCity')} placeholder="San Francisco" disabled={submitting} />
              <Field label="Industry" value={form.industry} onChange={set('industry')} placeholder="Software" disabled={submitting} />
            </Row>
          </Section>

          {/* Fit signals */}
          <Section title="Fit signals" subtitle="The 4 fields that determine whether this account is worth pursuing.">
            <Row>
              <Select label="Employees" value={form.employeeBand} onChange={set('employeeBand')} options={EMPLOYEE_BAND} disabled={submitting} />
              <Select label="Cross-border moves" value={form.crossBorderMovesBand} onChange={set('crossBorderMovesBand')} options={MOVES_BAND} disabled={submitting} />
            </Row>
            <Row>
              <Field label="Countries with employees" value={form.countriesWithEmployees} onChange={set('countriesWithEmployees')} placeholder="US, GB, DE, NL  (ISO codes, comma-separated)" disabled={submitting} />
            </Row>
            <Row>
              <Field label="Current tooling" value={form.currentToolingTags} onChange={set('currentToolingTags')} placeholder="Spreadsheets, Topia, Deel  (comma-separated)" disabled={submitting} />
            </Row>
          </Section>

          {/* Pursuit */}
          <Section title="Pursuit">
            <Row>
              <Select label="Trigger event" value={form.triggerEvent} onChange={set('triggerEvent')} options={TRIGGER_EVENT} disabled={submitting} />
              <Select label="Pursuit status" value={form.pursuitStatus} onChange={set('pursuitStatus')} options={PURSUIT_STATUS} disabled={submitting} />
            </Row>
            <Row>
              <Field label="Trigger note" value={form.triggerNote} onChange={set('triggerNote')} placeholder="Recently opened London office (Crunchbase, 4 days ago)" disabled={submitting} />
            </Row>
            <Row>
              <Select label="Source" value={form.source} onChange={set('source')} options={ACCOUNT_SOURCE} disabled={submitting} />
              <SelectRaw label="Owner" value={form.ownerId} onChange={set('ownerId')} disabled={submitting}>
                <option value="">— Unassigned —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </SelectRaw>
            </Row>
          </Section>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <div>
              {isEdit && (
                confirmDelete ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#B91C1C' }}>Delete this account permanently?</span>
                    <button type="button" onClick={onDelete} disabled={del.isPending}
                      style={{ padding: '7px 14px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {del.isPending ? 'Deleting…' : 'Yes, delete'}
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(false)}
                      style={{ padding: '7px 14px', background: 'white', border: '1px solid #ECEAF3', borderRadius: 8, fontSize: 12, color: '#6B7280', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmDelete(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'white', color: '#B91C1C', border: '1px solid #FECACA', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <Trash2 size={13} /> Delete
                  </button>
                )
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to={isEdit ? `/mobility/accounts/${id}` : '/mobility/accounts'}
                style={{ padding: '10px 18px', background: 'white', border: '1px solid #ECEAF3', borderRadius: 8, fontSize: 13, color: '#6B7280', textDecoration: 'none', fontWeight: 500 }}>
                Cancel
              </Link>
              <button type="submit" disabled={submitting}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: ACCENT, color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1, fontFamily: 'inherit' }}>
                <Save size={13} /> {submitting ? 'Saving…' : (isEdit ? 'Save changes' : 'Create account')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Shared form atoms ─────────────────────────────────────────────

function Section({ title, subtitle, children }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #EDE8F3', padding: '20px 22px', marginBottom: 14 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.5, textTransform: 'uppercase' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function Row({ children }) {
  return <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>{children}</div>;
}

function inputBase(disabled) {
  return {
    width: '100%',
    padding: '9px 12px',
    fontSize: 13,
    border: '1px solid #ECEAF3',
    borderRadius: 8,
    background: disabled ? '#F9F8FC' : 'white',
    color: '#0F0A1E',
    outline: 'none',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };
}

function Field({ label, value, onChange, placeholder, type = 'text', required, disabled, maxLength }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 5 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        style={inputBase(disabled)}
        onFocus={(e) => { e.target.style.borderColor = ACCENT; }}
        onBlur={(e) => { e.target.style.borderColor = '#ECEAF3'; }}
      />
    </div>
  );
}

function Select({ label, value, onChange, options, disabled }) {
  return (
    <SelectRaw label={label} value={value} onChange={onChange} disabled={disabled}>
      {Object.entries(options).map(([v, l]) => (
        <option key={v} value={v}>{l}</option>
      ))}
    </SelectRaw>
  );
}

function SelectRaw({ label, value, onChange, disabled, children }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 5 }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        style={{ ...inputBase(disabled), cursor: disabled ? 'not-allowed' : 'pointer' }}>
        {children}
      </select>
    </div>
  );
}
