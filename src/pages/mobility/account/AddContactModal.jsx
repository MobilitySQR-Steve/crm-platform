import { useState } from 'react';
import Modal, { modalInputStyle, modalLabelStyle, primaryBtn, secondaryBtn } from './Modal';
import { useCreateContact } from '../../../lib/queries';
import { CONTACT_PERSONA } from '../../../constants/enums';

const EMPTY = {
  firstName: '', lastName: '', email: '', phone: '',
  title: '', linkedinUrl: '', persona: 'OTHER', isPrimary: false,
};

export default function AddContactModal({ open, onClose, accountId }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const create = useCreateContact();
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First and last name are required.');
      return;
    }
    const nz = (s) => (s.trim() === '' ? null : s.trim());
    try {
      await create.mutateAsync({
        accountId,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: nz(form.email),
        phone: nz(form.phone),
        title: nz(form.title),
        linkedinUrl: nz(form.linkedinUrl),
        persona: form.persona,
        isPrimary: form.isPrimary,
      });
      setForm(EMPTY);
      onClose();
    } catch (err) {
      setError(err?.code || err?.message || 'Failed to add contact.');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add contact"
      footer={
        <>
          <button type="button" onClick={onClose} style={secondaryBtn}>Cancel</button>
          <button type="submit" form="add-contact-form" disabled={create.isPending} style={primaryBtn(create.isPending)}>
            {create.isPending ? 'Saving…' : 'Add contact'}
          </button>
        </>
      }>
      <form id="add-contact-form" onSubmit={onSubmit}>
        <Row>
          <Field label="First name *" value={form.firstName} onChange={set('firstName')} required disabled={create.isPending} />
          <Field label="Last name *"  value={form.lastName}  onChange={set('lastName')}  required disabled={create.isPending} />
        </Row>
        <Row>
          <Field label="Title" value={form.title} onChange={set('title')} placeholder="VP People" disabled={create.isPending} />
          <Sel   label="Persona" value={form.persona} onChange={set('persona')} options={CONTACT_PERSONA} disabled={create.isPending} />
        </Row>
        <Row>
          <Field label="Email" type="email" value={form.email} onChange={set('email')} placeholder="jane@acme.com" disabled={create.isPending} />
          <Field label="Phone" value={form.phone} onChange={set('phone')} disabled={create.isPending} />
        </Row>
        <Row>
          <Field label="LinkedIn URL" value={form.linkedinUrl} onChange={set('linkedinUrl')} placeholder="https://linkedin.com/in/..." disabled={create.isPending} />
        </Row>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', marginTop: 4 }}>
          <input type="checkbox" checked={form.isPrimary} onChange={(e) => set('isPrimary')(e.target.checked)} disabled={create.isPending} />
          Primary contact for this account
        </label>
        {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginTop: 12 }}>{error}</div>}
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
    <div style={{ flex: 1, minWidth: 0 }}>
      <label style={modalLabelStyle}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={{ ...modalInputStyle(disabled), cursor: disabled ? 'not-allowed' : 'pointer' }}>
        {Object.entries(options).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
