import { useEffect, useState } from 'react';
import { Loader2, Copy, Check, Sparkles } from 'lucide-react';
import Modal, { modalInputStyle, modalLabelStyle, primaryBtn, secondaryBtn } from './Modal';
import { useCreateActivity, useDraftOutreach } from '../../../lib/queries';
import { ApiError } from '../../../lib/api';

const ACCENT = '#2563EB';

export default function DraftOutreachModal({ open, onClose, accountId }) {
  const draft = useDraftOutreach();
  const logActivity = useCreateActivity();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null); // 'subject' | 'body' | null
  const [loggedAt, setLoggedAt] = useState(null);

  // Run the draft mutation each time the modal opens.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setSubject('');
    setBody('');
    setCopied(null);
    setLoggedAt(null);
    draft.mutate(
      { accountId },
      {
        onSuccess: (data) => {
          setSubject(data.subject);
          setBody(data.body);
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 503) {
            setError('Outreach drafting is disabled — set ANTHROPIC_API_KEY in api/.env and restart the server.');
          } else if (err instanceof ApiError && err.code === 'no_trigger_note') {
            setError('This account has no trigger note yet. Run enrichment from the Enrichment tab, or edit the account and add a trigger note manually, then try again.');
          } else if (err instanceof ApiError) {
            setError(err.details?.message ?? err.code ?? `Request failed (${err.status})`);
          } else {
            setError(err?.message ?? 'Unknown error');
          }
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, accountId]);

  async function copyText(field, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied((c) => (c === field ? null : c)), 1500);
    } catch {
      // Clipboard API may fail in insecure contexts — fall back to selecting
    }
  }

  async function copyAll() {
    const full = `Subject: ${subject}\n\n${body}`;
    await copyText('all', full);
  }

  async function logAsActivity() {
    try {
      await logActivity.mutateAsync({
        accountId,
        type: 'EMAIL',
        subject: `Drafted: ${subject}`.slice(0, 200),
        body,
      });
      setLoggedAt(new Date());
    } catch (err) {
      setError(err?.message ?? 'Failed to log activity.');
    }
  }

  const data = draft.data;
  const showLoading = draft.isPending && !error;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Draft outreach"
      maxWidth={620}
      footer={
        <>
          <button type="button" onClick={onClose} style={secondaryBtn}>Close</button>
          {data && !error && (
            <>
              <button type="button" onClick={copyAll} disabled={!subject || !body}
                style={{ ...secondaryBtn, display: 'flex', alignItems: 'center', gap: 6 }}>
                {copied === 'all' ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy all</>}
              </button>
              <button type="button" onClick={logAsActivity}
                disabled={logActivity.isPending || !!loggedAt}
                style={primaryBtn(logActivity.isPending || !!loggedAt)}>
                {loggedAt ? <><Check size={13} /> Logged</> : (logActivity.isPending ? 'Logging…' : 'Log as activity')}
              </button>
            </>
          )}
        </>
      }
    >
      {/* Loading */}
      {showLoading && (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#6B7280' }}>
          <Loader2 size={22} className="spin" color={ACCENT} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 14 }}>Drafting outreach with Claude…</div>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>~10–30 seconds</div>
        </div>
      )}

      {/* Error */}
      {error && !draft.isPending && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 10, padding: '12px 16px', fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Result */}
      {data && !error && (
        <>
          {/* From / To */}
          <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 14, lineHeight: 1.6 }}>
            {data.recipient && (
              <div><b style={{ color: '#374151' }}>To:</b> {data.recipient.firstName} {data.recipient.lastName}{data.recipient.title ? ` (${data.recipient.title})` : ''}</div>
            )}
            <div><b style={{ color: '#374151' }}>From:</b> {data.sender.firstName} {data.sender.lastName} &lt;{data.sender.email}&gt;</div>
          </div>

          {/* Subject */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <label style={modalLabelStyle}>Subject</label>
              <button onClick={() => copyText('subject', subject)}
                style={{ background: 'none', border: 'none', color: copied === 'subject' ? '#15803D' : ACCENT, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                {copied === 'subject' ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} style={modalInputStyle(false)} />
          </div>

          {/* Body */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <label style={modalLabelStyle}>Body</label>
              <button onClick={() => copyText('body', body)}
                style={{ background: 'none', border: 'none', color: copied === 'body' ? '#15803D' : ACCENT, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                {copied === 'body' ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10}
              style={{ ...modalInputStyle(false), resize: 'vertical', minHeight: 200, lineHeight: 1.5, fontFamily: 'inherit' }} />
          </div>

          {/* Rationale */}
          {data.rationale && (
            <div style={{ background: '#F8FAFF', border: '1px solid #DBEAFE', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#1E40AF', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Sparkles size={13} style={{ marginTop: 2, flexShrink: 0 }} />
              <div><b>Why this hook:</b> {data.rationale}</div>
            </div>
          )}

          {/* Edit hint */}
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 10, textAlign: 'center' }}>
            Edit subject and body inline before copying. "Log as activity" saves an EMAIL activity to this account's timeline.
          </div>
        </>
      )}
    </Modal>
  );
}
