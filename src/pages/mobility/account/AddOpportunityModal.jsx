import { useState } from 'react';
import Modal, { modalInputStyle, modalLabelStyle, primaryBtn, secondaryBtn } from './Modal';
import { useCreateOpportunity, useUsers } from '../../../lib/queries';
import { OPP_STAGE } from '../../../constants/enums';

const EMPTY = { name: '', stage: 'PROSPECT', amountUsd: '', expectedCloseDate: '', ownerId: '' };

export default function AddOpportunityModal({ open, onClose, accountId }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const create = useCreateOpportunity();
  const { data: usersData } = useUsers();
  const users = usersData?.items ?? [];
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) { setError('Opportunity name is required.'); return; }
    try {
      await create.mutateAsync({
        accountId,
        name: form.name.trim(),
        stage: form.stage,
        amountUsd: form.amountUsd ? parseFloat(form.amountUsd) : null,
        expectedCloseDate: form.expectedCloseDate || null,
        ownerId: form.ownerId || null,
      });
      setForm(EMPTY);
      onClose();
    } catch (err) {
      setError(err?.code || err?.message || 'Failed to create opportunity.');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New opportunity"
      footer={
        <>
          <button type="button" onClick={onClose} style={secondaryBtn}>Cancel</button>
          <button type="submit" form="new-opp-form" disabled={create.isPending} style={primaryBtn(create.isPending)}>
            {create.isPending ? 'Saving…' : 'Create opportunity'}
          </button>
        </>
      }>
      <form id="new-opp-form" onSubmit={onSubmit}>
        <Row>
          <Field label="Name *" value={form.name} onChange={set('name')} placeholder="Initial pilot — 50 seats" required disabled={create.isPending} />
        </Row>
        <Row>
          <Sel label="Stage" value={form.stage} onChange={set('stage')} options={OPP_STAGE} disabled={create.isPending} />
          <Field label="Amount (USD)" type="number" value={form.amountUsd} onChange={set('amountUsd')} placeholder="50000" disabled={create.isPending} />
        </Row>
        <Row>
          <Field label="Expected close date" type="date" value={form.expectedCloseDate} onChange={set('expectedCloseDate')} disabled={create.isPending} />
          <SelRaw label="Owner" value={form.ownerId} onChange={set('ownerId')} disabled={create.isPending}>
            <option value="">— Unassigned —</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
          </SelRaw>
        </Row>
        {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 8, padding: '8px 12px', fontSize: 14, marginTop: 6 }}>{error}</div>}
      </form>
    </Modal>
  );
}

function Row({ children }) { return <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>{children}</div>; }

function Field({ label, value, onChange, type = 'text', placeholder, required, disabled }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label style={modalLabelStyle}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} disabled={disabled} style={modalInputStyle(disabled)} />
    </div>
  );
}

function Sel({ label, value, onChange, options, disabled }) {
  return (
    <SelRaw label={label} value={value} onChange={onChange} disabled={disabled}>
      {Object.entries(options).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </SelRaw>
  );
}

function SelRaw({ label, value, onChange, disabled, children }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label style={modalLabelStyle}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={{ ...modalInputStyle(disabled), cursor: disabled ? 'not-allowed' : 'pointer' }}>
        {children}
      </select>
    </div>
  );
}
