import { useState } from "react";
import {
  Mail, Phone, Globe, Plus,
  Pencil, MoreHorizontal, CheckCircle, Clock,
  FileText, Upload
} from "lucide-react";

// ── Mock client ───────────────────────────────────────────────
const CLIENT = {
  code: 'TX-2022-0003',
  name: 'Rajesh Mehra',
  email: 'rajesh.mehra@gmail.com',
  phone: '+1 (408) 555-0192',
  dob: '1978-03-15',
  nationality: 'Indian',
  residence: 'United States',
  taxResidency: 'US Resident Alien',
  filingCountry: 'US',
  clientType: 'Individual — Expat',
  source: 'Referral — BNI',
  owner: 'Priya S.',
  since: 'January 2022',
};

const CASES = [
  { id:'tc1', year:'2022', form:'1040-NR', status:'completed', preparer:'Amit K.',   reviewer:'Maulshree', fee:680,  due:null,         filed:'2023-04-10' },
  { id:'tc2', year:'2023', form:'1040-NR', status:'completed', preparer:'Priya S.',  reviewer:'Maulshree', fee:850,  due:null,         filed:'2024-03-28' },
  { id:'tc3', year:'2024', form:'1040-NR', status:'preparation',preparer:'Priya S.', reviewer:null,        fee:850,  due:'2026-04-30', filed:null         },
];

const DOCUMENTS = [
  { year:'2024', docs:[
    { name:'Prior Year Return (2023)',  type:'Tax Return', received:true,  date:'2026-02-10' },
    { name:'W-2 / Employment Income',  type:'Income',     received:true,  date:'2026-02-14' },
    { name:'Foreign Bank Statements',  type:'Bank',       received:false, date:null         },
    { name:'FBAR (FinCEN 114)',         type:'Compliance', received:false, date:null         },
    { name:'Foreign Tax Paid (1116)',   type:'Tax Credit', received:false, date:null         },
    { name:'Signed Engagement Letter', type:'Admin',      received:true,  date:'2026-01-20' },
  ]},
  { year:'2023', docs:[
    { name:'Prior Year Return (2022)',  type:'Tax Return', received:true, date:'2023-02-15' },
    { name:'W-2 / Employment Income',  type:'Income',     received:true, date:'2023-02-20' },
    { name:'Foreign Bank Statements',  type:'Bank',       received:true, date:'2023-03-01' },
    { name:'FBAR (FinCEN 114)',         type:'Compliance', received:true, date:'2023-03-05' },
    { name:'Signed Engagement Letter', type:'Admin',      received:true, date:'2023-01-18' },
  ]},
  { year:'2022', docs:[
    { name:'Prior Year Return (2021)',  type:'Tax Return', received:true, date:'2022-02-20' },
    { name:'W-2 / Employment Income',  type:'Income',     received:true, date:'2022-02-25' },
    { name:'Foreign Bank Statements',  type:'Bank',       received:true, date:'2022-03-10' },
    { name:'Signed Engagement Letter', type:'Admin',      received:true, date:'2022-01-15' },
  ]},
];

const TIMELINE = [
  { id:'t1', type:'system', date:'2026-04-15', subject:'Case 2024 moved to Preparation',       by:'System',   detail:'Status changed from Doc Collection → Preparation.' },
  { id:'t2', type:'call',   date:'2026-04-12', subject:'Call — FBAR requirements',              by:'Priya S.', detail:'15-min call. Client confirmed two foreign accounts at SBI India. Will send statements by Apr 20.' },
  { id:'t3', type:'email',  date:'2026-04-08', subject:'Document request sent',                by:'Priya S.', detail:'Sent 2024 document checklist via email. 3 items outstanding.' },
  { id:'t4', type:'system', date:'2026-03-28', subject:'Case 2024 opened',                     by:'System',   detail:'New tax case created for tax year 2024. Assigned to Priya S.' },
  { id:'t5', type:'note',   date:'2024-04-10', subject:'Extension filed — 2023 return',         by:'Priya S.', detail:'Client requested 6-month extension. Filed Form 4868. New deadline Oct 15, 2024.' },
  { id:'t6', type:'email',  date:'2024-03-28', subject:'2023 return filed successfully',        by:'Amit K.',  detail:'1040-NR filed electronically. Refund of $1,240 expected within 21 days.' },
  { id:'t7', type:'system', date:'2023-04-10', subject:'Case 2022 completed',                  by:'System',   detail:'Tax return for 2022 filed and marked complete. Fee collected.' },
];

const TASKS = [
  { id:'tk1', title:'Follow up — missing FBAR statements',  due:'2026-04-25', priority:'high'   },
  { id:'tk2', title:'Send draft 1040-NR for client review', due:'2026-04-28', priority:'medium' },
  { id:'tk3', title:'Collect signed Form 8879',             due:'2026-04-30', priority:'urgent' },
];

const NOTES = [
  { id:'n1', date:'2026-04-12', by:'Priya S.', text:'Client has two foreign bank accounts at SBI India (savings + fixed deposit). Combined balance exceeds $10k threshold so FBAR is mandatory. Also holds RSUs from previous employer — need Schedule D for vesting events in 2024.' },
  { id:'n2', date:'2026-02-10', by:'Priya S.', text:'Onboarding call complete. Client on H-1B visa, arrived USA Jan 2020. Indian portfolio includes PPF and mutual funds — PFIC rules will apply to mutual fund reporting. May need Form 8621.' },
  { id:'n3', date:'2024-03-25', by:'Amit K.',  text:'2023 return more complex than expected — partial year India income Jan–Mar 2023. Applied treaty relief under US-India Article 16. Foreign tax credit carried forward to 2024.' },
];

// ── Constants ─────────────────────────────────────────────────
const ACCENT = '#38AC87';
const TODAY  = new Date('2026-04-22');

const S_COLOR = { onboarding:'#00BFE6', doc_collection:'#F59E0B', preparation:'#8C78FF', review:'#8D3B9D', filing:'#3B82F6', completed:'#38AC87', on_hold:'#9CA3AF' };
const S_LABEL = { onboarding:'Onboarding', doc_collection:'Doc Collection', preparation:'Preparation', review:'Review', filing:'Filing', completed:'Completed', on_hold:'On Hold' };
const T_CONFIG = { system:{ color:'#9CA3AF', icon:'⚙' }, call:{ color:'#38AC87', icon:'📞' }, email:{ color:'#00BFE6', icon:'✉' }, note:{ color:'#8C78FF', icon:'📝' } };

const fmt      = (s) => new Date(s).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
const fmtShort = (s) => new Date(s).toLocaleDateString('en-US', { month:'short', day:'numeric' });
const inits    = (n) => n.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
const getDue   = (d) => {
  if (!d) return null;
  const days = Math.floor((new Date(d) - TODAY) / 86400000);
  if (days < 0)  return { text:`${Math.abs(days)}d overdue`, color:'#EF4444' };
  if (days <= 3)  return { text:`${days}d left`,             color:'#EF4444' };
  if (days <= 7)  return { text:`${days}d left`,             color:'#F59E0B' };
  return           { text:fmtShort(d),                       color:'#9CA3AF' };
};

// ── Shared atoms ──────────────────────────────────────────────
const Pill = ({ label, color }) => (
  <span style={{ padding:'3px 10px', borderRadius:100, fontSize:11, fontWeight:600, background:color+'18', color, whiteSpace:'nowrap' }}>{label}</span>
);
const Card = ({ children, style={} }) => (
  <div style={{ background:'white', borderRadius:12, border:'1px solid #ECEAF3', padding:'20px 22px', ...style }}>{children}</div>
);
const SecTitle = ({ children }) => (
  <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', letterSpacing:0.5, textTransform:'uppercase', marginBottom:14 }}>{children}</div>
);
const FieldRow = ({ label, value, color }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:'1px solid #F3F4F6' }}>
    <span style={{ fontSize:13, color:'#9CA3AF' }}>{label}</span>
    <span style={{ fontSize:13, fontWeight:500, color:color||'#374151' }}>{value||'—'}</span>
  </div>
);

// ── Overview Tab ──────────────────────────────────────────────
function OverviewTab() {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
      {/* Left */}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <Card>
          <SecTitle>Personal Information</SecTitle>
          <FieldRow label="Full Name"            value={CLIENT.name}          />
          <FieldRow label="Email"                value={CLIENT.email}         />
          <FieldRow label="Phone"                value={CLIENT.phone}         />
          <FieldRow label="Date of Birth"        value={fmt(CLIENT.dob)}      />
          <FieldRow label="Nationality"          value={CLIENT.nationality}   />
          <FieldRow label="Country of Residence" value={CLIENT.residence}     />
          <FieldRow label="Client Since"         value={CLIENT.since}         />
          <FieldRow label="Lead Source"          value={CLIENT.source}        />
        </Card>
        <Card>
          <SecTitle>Filing Configuration</SecTitle>
          <FieldRow label="Filing Country"   value={CLIENT.filingCountry} />
          <FieldRow label="Resident Status"  value={CLIENT.taxResidency}  />
          <FieldRow label="Client Type"      value={CLIENT.clientType}    />
          <FieldRow label="Client Code"      value={CLIENT.code}          />
          <FieldRow label="Case Owner"       value={CLIENT.owner}         />
        </Card>
      </div>

      {/* Right */}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {/* Case history */}
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <SecTitle>Case History</SecTitle>
            <button style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', background:ACCENT, color:'white', border:'none', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer', marginTop:-12 }}>
              <Plus size={12} /> New Case
            </button>
          </div>
          {[...CASES].reverse().map(c => {
            const due = getDue(c.due);
            return (
              <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 0', borderBottom:'1px solid #F3F4F6' }}>
                <div style={{ width:36, height:36, borderRadius:9, background:S_COLOR[c.status]+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:S_COLOR[c.status], flexShrink:0 }}>
                  {c.year.slice(2)}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:'#374151' }}>Tax Year {c.year}</span>
                    <Pill label={S_LABEL[c.status]} color={S_COLOR[c.status]} />
                  </div>
                  <div style={{ fontSize:11, color:'#9CA3AF' }}>{c.form} · {c.preparer} · ${c.fee.toLocaleString()}{c.filed && ` · Filed ${fmtShort(c.filed)}`}</div>
                </div>
                {due && (
                  <div style={{ display:'flex', alignItems:'center', gap:3, flexShrink:0 }}>
                    <Clock size={10} color={due.color} />
                    <span style={{ fontSize:11, color:due.color, fontWeight:600 }}>{due.text}</span>
                  </div>
                )}
                <button style={{ background:'none', border:'none', cursor:'pointer', color:'#D1D5DB', flexShrink:0 }}><MoreHorizontal size={14} /></button>
              </div>
            );
          })}
        </Card>

        {/* Open tasks */}
        <Card>
          <SecTitle>Open Tasks</SecTitle>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {TASKS.map(t => {
              const d = getDue(t.due);
              const pc = { urgent:'#EF4444', high:'#F59E0B', medium:'#38AC87' };
              return (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'#F9F8FC', borderRadius:8, border:'1px solid #ECEAF3' }}>
                  <div style={{ width:14, height:14, borderRadius:4, border:`1.5px solid ${pc[t.priority]||'#D1D5DB'}`, flexShrink:0 }} />
                  <span style={{ fontSize:13, color:'#374151', flex:1 }}>{t.title}</span>
                  {d && <span style={{ fontSize:11, color:d.color, fontWeight:600, whiteSpace:'nowrap' }}>{d.text}</span>}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Tax Cases Tab ─────────────────────────────────────────────
function CasesTab() {
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
        <button style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:ACCENT, color:'white', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
          <Plus size={13} /> New Tax Case
        </button>
      </div>
      <Card style={{ padding:0 }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #ECEAF3' }}>
              {['Tax Year','Form','Status','Preparer','Reviewer','Due / Filed','Fee',''].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'11px 16px', color:'#9CA3AF', fontWeight:500, fontSize:11, letterSpacing:0.5, textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...CASES].reverse().map(c => {
              const due = getDue(c.due);
              return (
                <tr key={c.id} style={{ borderTop:'1px solid #F3F4F6' }}>
                  <td style={{ padding:'13px 16px', fontWeight:700, color:'#0F0A1E' }}>Tax Year {c.year}</td>
                  <td style={{ padding:'13px 16px', color:'#6B7280' }}>{c.form}</td>
                  <td style={{ padding:'13px 16px' }}><Pill label={S_LABEL[c.status]} color={S_COLOR[c.status]} /></td>
                  <td style={{ padding:'13px 16px', color:'#374151' }}>{c.preparer}</td>
                  <td style={{ padding:'13px 16px', color:c.reviewer?'#374151':'#C4C0D4', fontStyle:c.reviewer?'normal':'italic' }}>
                    {c.reviewer||'Not assigned'}
                  </td>
                  <td style={{ padding:'13px 16px' }}>
                    {c.filed ? (
                      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <CheckCircle size={13} color="#38AC87" />
                        <span style={{ color:'#38AC87', fontWeight:500, fontSize:12 }}>Filed {fmtShort(c.filed)}</span>
                      </div>
                    ) : due ? (
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <Clock size={12} color={due.color} />
                        <span style={{ color:due.color, fontWeight:600, fontSize:12 }}>{due.text}</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td style={{ padding:'13px 16px', fontWeight:700, color:'#374151' }}>${c.fee.toLocaleString()}</td>
                  <td style={{ padding:'13px 16px' }}><button style={{ background:'none', border:'none', cursor:'pointer', color:'#C4C0D4' }}><MoreHorizontal size={14} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ padding:'12px 16px', borderTop:'1px solid #ECEAF3', display:'flex', justifyContent:'space-between', fontSize:12, color:'#9CA3AF' }}>
          <span>3 cases total · 2 completed</span>
          <span style={{ fontWeight:600, color:'#374151' }}>Total fees: ${CASES.reduce((s,c)=>s+c.fee,0).toLocaleString()}</span>
        </div>
      </Card>
    </div>
  );
}

// ── Documents Tab ─────────────────────────────────────────────
function DocumentsTab() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {DOCUMENTS.map(yr => {
        const recv = yr.docs.filter(d => d.received).length;
        const pct  = Math.round(recv / yr.docs.length * 100);
        const cs   = CASES.find(c => c.year === yr.year);

        return (
          <Card key={yr.year}>
            {/* Year header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:15, fontWeight:700, color:'#0F0A1E' }}>Tax Year {yr.year}</span>
                {cs && <Pill label={S_LABEL[cs.status]} color={S_COLOR[cs.status]} />}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:12, color:'#9CA3AF' }}>{recv}/{yr.docs.length} received</span>
                  <div style={{ width:72, height:4, background:'#F3F4F6', borderRadius:2 }}>
                    <div style={{ height:'100%', borderRadius:2, width:`${pct}%`, background:pct===100?ACCENT:'#F59E0B', transition:'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, color:pct===100?ACCENT:'#F59E0B' }}>{pct}%</span>
                </div>
                <button style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', border:`1px solid ${ACCENT}35`, borderRadius:7, background:'transparent', color:ACCENT, fontSize:12, cursor:'pointer', fontWeight:500 }}>
                  <Upload size={12} /> Upload
                </button>
              </div>
            </div>

            {/* Doc rows */}
            {yr.docs.map(doc => (
              <div key={doc.name} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 0', borderTop:'1px solid #F9F8FC' }}>
                {/* Checkbox */}
                <div style={{ width:20, height:20, borderRadius:5, border:`1.5px solid ${doc.received?ACCENT:'#E5E7EB'}`, background:doc.received?ACCENT:'white', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
                  {doc.received && <span style={{ color:'white', fontSize:11, fontWeight:700, lineHeight:1 }}>✓</span>}
                </div>
                <span style={{ fontSize:13, color:doc.received?'#374151':'#9CA3AF', flex:1 }}>{doc.name}</span>
                <span style={{ fontSize:10, color:'#9CA3AF', background:'#F3F4F6', padding:'2px 7px', borderRadius:4, fontWeight:500, whiteSpace:'nowrap' }}>{doc.type}</span>
                {doc.received && doc.date
                  ? <span style={{ fontSize:11, color:'#9CA3AF', whiteSpace:'nowrap' }}>{fmtShort(doc.date)}</span>
                  : <span style={{ fontSize:11, color:'#EF4444', fontWeight:600, whiteSpace:'nowrap' }}>Missing</span>
                }
                {doc.received
                  ? <button style={{ background:'none', border:'none', cursor:'pointer', color:'#C4C0D4', display:'flex', flexShrink:0 }}><FileText size={13} /></button>
                  : <div style={{ width:13, flexShrink:0 }} />
                }
              </div>
            ))}
          </Card>
        );
      })}
    </div>
  );
}

// ── Timeline Tab ──────────────────────────────────────────────
function TimelineTab() {
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
        <button style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'white', color:'#374151', border:'1px solid #ECEAF3', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' }}>
          <Plus size={13} /> Log Activity
        </button>
      </div>
      <div style={{ position:'relative' }}>
        {/* Spine */}
        <div style={{ position:'absolute', left:19, top:20, bottom:40, width:2, background:'#ECEAF3', borderRadius:2 }} />
        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {TIMELINE.map(t => {
            const cfg = T_CONFIG[t.type] || T_CONFIG.note;
            return (
              <div key={t.id} style={{ display:'flex', gap:16, paddingBottom:16 }}>
                {/* Icon */}
                <div style={{ width:40, height:40, borderRadius:'50%', background:cfg.color+'15', border:`2px solid ${cfg.color}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0, position:'relative', zIndex:1, marginTop:2 }}>
                  {cfg.icon}
                </div>
                {/* Content */}
                <div style={{ flex:1, background:'white', borderRadius:10, border:'1px solid #ECEAF3', padding:'13px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:5 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:'#374151' }}>{t.subject}</span>
                    <span style={{ fontSize:11, color:'#9CA3AF', whiteSpace:'nowrap', marginLeft:12, flexShrink:0 }}>{fmtShort(t.date)}</span>
                  </div>
                  <p style={{ fontSize:12, color:'#6B7280', lineHeight:1.55, margin:'0 0 10px' }}>{t.detail}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', background:ACCENT+'1A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:ACCENT }}>
                      {inits(t.by)}
                    </div>
                    <span style={{ fontSize:11, color:'#9CA3AF' }}>{t.by}</span>
                    <span style={{ fontSize:10, color:cfg.color, background:cfg.color+'12', padding:'1px 7px', borderRadius:100, fontWeight:600, textTransform:'capitalize' }}>{t.type}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Notes Tab ─────────────────────────────────────────────────
function NotesTab() {
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
        <button style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:ACCENT, color:'white', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
          <Plus size={13} /> Add Note
        </button>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {NOTES.map(n => (
          <Card key={n.id}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                <div style={{ width:30, height:30, borderRadius:'50%', background:ACCENT+'1A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:ACCENT, flexShrink:0 }}>
                  {inits(n.by)}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#374151' }}>{n.by}</div>
                  <div style={{ fontSize:11, color:'#9CA3AF' }}>{fmt(n.date)}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button style={{ background:'none', border:'none', cursor:'pointer', color:'#C4C0D4', display:'flex' }}><Pencil size={13} /></button>
                <button style={{ background:'none', border:'none', cursor:'pointer', color:'#C4C0D4', display:'flex' }}><MoreHorizontal size={13} /></button>
              </div>
            </div>
            <p style={{ fontSize:13, color:'#374151', lineHeight:1.65, margin:0 }}>{n.text}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function ClientProfile() {
  const [tab, setTab] = useState('overview');

  const totalFees = CASES.reduce((s,c) => s+c.fee, 0);
  const completed = CASES.filter(c => c.status === 'completed').length;
  const openCase  = CASES.find(c => c.status !== 'completed');
  const missing   = DOCUMENTS[0].docs.filter(d => !d.received).length;

  const TABS = [
    { id:'overview',  label:'Overview'  },
    { id:'cases',     label:'Tax Cases' },
    { id:'documents', label:'Documents', badge:missing||null },
    { id:'timeline',  label:'Timeline'  },
    { id:'notes',     label:'Notes'     },
  ];

  return (
    <div style={{ height:'100%', overflowY:'auto', background:'#EFECF7', fontFamily:'system-ui,-apple-system,sans-serif' }}>
      {/* ── Profile header ── */}
      <div style={{ background:'white', borderBottom:'1px solid #ECEAF3', padding:'26px 28px 0' }}>

        {/* Name + actions */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
            {/* Avatar */}
            <div style={{ width:58, height:58, borderRadius:16, background:`linear-gradient(135deg,${ACCENT},${ACCENT}AA)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, color:'white', flexShrink:0, boxShadow:`0 4px 14px ${ACCENT}35` }}>
              {inits(CLIENT.name)}
            </div>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                <h1 style={{ fontSize:22, fontWeight:800, color:'#0F0A1E', margin:0, lineHeight:1 }}>{CLIENT.name}</h1>
                <span style={{ padding:'3px 10px', borderRadius:100, fontSize:11, fontWeight:700, background:ACCENT+'18', color:ACCENT }}>Active</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:18, flexWrap:'wrap' }}>
                <span style={{ fontSize:13, color:'#6B7280', display:'flex', alignItems:'center', gap:5 }}>
                  <Mail size={12} color="#9CA3AF" /> {CLIENT.email}
                </span>
                <span style={{ fontSize:13, color:'#6B7280', display:'flex', alignItems:'center', gap:5 }}>
                  <Phone size={12} color="#9CA3AF" /> {CLIENT.phone}
                </span>
                <span style={{ fontSize:13, color:'#6B7280', display:'flex', alignItems:'center', gap:5 }}>
                  <Globe size={12} color="#9CA3AF" /> {CLIENT.filingCountry} · {CLIENT.taxResidency}
                </span>
                <span style={{ fontSize:13, color:'#6B7280' }}>Owner: <b style={{ color:'#374151' }}>{CLIENT.owner}</b></span>
              </div>
            </div>
          </div>
          {/* Actions */}
          <div style={{ display:'flex', gap:8, flexShrink:0 }}>
            <button style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 14px', background:'white', border:'1px solid #ECEAF3', borderRadius:8, fontSize:13, color:'#6B7280', cursor:'pointer', fontWeight:500 }}>
              <Pencil size={13} /> Edit
            </button>
            <button style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 16px', background:ACCENT, color:'white', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
              <Plus size={13} /> New Case
            </button>
          </div>
        </div>

        {/* Quick stats row */}
        <div style={{ display:'flex', borderTop:'1px solid #F3F4F6', marginBottom:0 }}>
          {[
            { label:'Total Cases',   value:CASES.length },
            { label:'Completed',     value:completed,                                color:ACCENT   },
            { label:'Open Case',     value:openCase?`${openCase.year} (${S_LABEL[openCase.status]})`:'None' },
            { label:'Total Fees',    value:`$${totalFees.toLocaleString()}`,         color:'#374151' },
            { label:'Docs Missing',  value:missing?`${missing} for 2024`:'All received', color:missing?'#EF4444':ACCENT },
            { label:'Client Since',  value:CLIENT.since },
          ].map((s,i) => (
            <div key={s.label} style={{ padding:'12px 20px', borderLeft:i>0?'1px solid #F3F4F6':'none', flexShrink:0 }}>
              <div style={{ fontSize:10, color:'#9CA3AF', fontWeight:600, letterSpacing:0.3, textTransform:'uppercase', marginBottom:3 }}>{s.label}</div>
              <div style={{ fontSize:14, fontWeight:700, color:s.color||'#0F0A1E', whiteSpace:'nowrap' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tab nav */}
        <div style={{ display:'flex', gap:0, marginTop:4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'12px 20px', fontSize:13, fontWeight:tab===t.id?600:400, color:tab===t.id?ACCENT:'#6B7280', background:'none', border:'none', cursor:'pointer', borderBottom:`2px solid ${tab===t.id?ACCENT:'transparent'}`, transition:'all 0.15s', whiteSpace:'nowrap' }}>
              {t.label}
              {t.badge && (
                <span style={{ background:'#EF4444', color:'white', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:100, lineHeight:1.4 }}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div style={{ padding:'22px 28px 40px', maxWidth:1100, margin:'0 auto' }}>
        {tab === 'overview'  && <OverviewTab />}
        {tab === 'cases'     && <CasesTab />}
        {tab === 'documents' && <DocumentsTab />}
        {tab === 'timeline'  && <TimelineTab />}
        {tab === 'notes'     && <NotesTab />}
      </div>
    </div>
  );
}
