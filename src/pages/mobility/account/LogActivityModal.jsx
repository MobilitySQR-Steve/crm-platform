import { useState } from 'react';
import Modal, { modalInputStyle, modalLabelStyle, primaryBtn, secondaryBtn } from './Modal';
import { useCreateActivity } from '../../../lib/queries';
import { ACTIVITY_TYPE } from '../../../constants/enums';

const EMPTY = { type: 'NOTE', subject: '', body: '' };

// SYSTEM is reserved for activities the backend creates — humans pick from the rest.
const HUMAN_TYPES = Object.fromEntries(Object.entries(ACTIVITY_TYPE).filter(([k]) => k !== 'SYSTEM'));

export default function LogActivityModal({ open, onClose, accountId, opportunityId }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const create = useCreateActivity();
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.subject.trim()) { setError('Subject is required.'); return; }
    try {
      await create.mutateAsync({
        accountId,
        opportunityId: opportunityId || null,
        type: form.type,
        subject: form.subject.trim(),
        body: form.body.trim() || null,
      });
      setForm(EMPTY);
      onClose();
    } catch (err) {
      setError(err?.code || err?.message || 'Failed to log activity.');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Log activity"
      footer={
        <>
          <button type="button" onClick={onClose} style={secondaryBtn}>Cancel</button>
          <button type="submit" form="log-act-form" disabled={create.isPending} style={primaryBtn(create.isPending)}>
            {create.isPending ? 'Saving…' : 'Log activity'}
          </button>
        </>
      }>
      <form id="log-act-form" onSubmit={onSubmit}>
        <Row>
          <Sel label="Type" value={form.type} onChange={set('type')} options={HUMAN_TYPES} disabled={create.isPending} />
          <Field label="Subject *" value={form.subject} onChange={set('subject')} placeholder="Discovery call with VP People" required disabled={create.isPending} />
        </Row>
        <div>
          <label style={modalLabelStyle}>Notes</label>
          <textarea value={form.body} onChange={(e) => set('body')(e.target.value)} disabled={create.isPending} rows={5}
            placeholder="Discussed mobility volume (~80 assignments/yr), currently using spreadsheets…"
            style={{ ...modalInputStyle(create.isPending), resize: 'vertical', minHeight: 96 }} />
        </div>
        {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 8, padding: '8px 12px', fontSize: 14, marginTop: 10 }}>{error}</div>}
      </form>
    </Modal>
  );
}

function Row({ children }) { return <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>{children}</div>; }

function Field({ label, value, onChange, type = 'text', placeholder, required, disabled }) {
  return (
    <div style={{ flex: 2, minWidth: 0 }}>
      <label style={modalLabelStyle}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} disabled={disabled} style={modalInputStyle(disabled)} />
    </div>
  );
}

function Sel({ label, value, onChange, options, disabled }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label style={modalLabelStyle}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={{ ...modalInputStyle(disabled), cursor: disabled ? 'not-allowed' : 'pointer' }}>
        {Object.entries(options).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
