import { useState, useMemo } from "react";
import {
  Search, Plus, Clock,
  MoreHorizontal, LayoutGrid, List, User, X,
  AlertCircle, FileText, DollarSign, CheckCircle
} from "lucide-react";

// ── Stages ────────────────────────────────────────────────────
const STAGES = [
  { id: 'onboarding',     label: 'Onboarding',     color: '#00BFE6' },
  { id: 'doc_collection', label: 'Doc Collection', color: '#F59E0B' },
  { id: 'preparation',    label: 'Preparation',    color: '#8C78FF' },
  { id: 'review',         label: 'Review',         color: '#2563EB' },
  { id: 'filing',         label: 'Filing',         color: '#3B82F6' },
  { id: 'completed',      label: 'Completed',      color: '#38AC87' },
  { id: 'on_hold',        label: 'On Hold',        color: '#9CA3AF' },
];

const PREPARERS = ['All', 'Priya S.', 'Amit K.', 'Maulshree'];
const YEARS     = ['All', '2024', '2023', '2022'];
const TODAY     = new Date('2026-04-22');

// ── Mock Data ─────────────────────────────────────────────────
const SEED = [
  { id:'c1',  name:'Arjun Patel',      year:'2024', country:'US',     preparer:'Priya S.',  due:'2026-05-15', fee:850,  stage:'onboarding',     priority:'normal' },
  { id:'c2',  name:'Lisa Thompson',    year:'2024', country:'US',     preparer:null,         due:'2026-05-30', fee:1100, stage:'onboarding',     priority:'normal' },
  { id:'c3',  name:'Rajesh Mehra',     year:'2024', country:'US',     preparer:'Priya S.',  due:'2026-04-30', fee:850,  stage:'doc_collection', priority:'high'   },
  { id:'c4',  name:'Wei Zhang',        year:'2024', country:'US',     preparer:'Amit K.',   due:'2026-05-10', fee:950,  stage:'doc_collection', priority:'normal' },
  { id:'c5',  name:'Sarah Johnson',    year:'2023', country:'UK',     preparer:'Maulshree', due:'2026-04-25', fee:1200, stage:'doc_collection', priority:'urgent' },
  { id:'c6',  name:'David Kim',        year:'2024', country:'US',     preparer:'Priya S.',  due:'2026-04-28', fee:650,  stage:'preparation',    priority:'high'   },
  { id:'c7',  name:'Nina Rodriguez',   year:'2024', country:'US',     preparer:'Amit K.',   due:'2026-05-05', fee:780,  stage:'preparation',    priority:'normal' },
  { id:'c8',  name:'Tom Harrison',     year:'2023', country:'US',     preparer:'Priya S.',  due:'2026-05-20', fee:920,  stage:'preparation',    priority:'normal' },
  { id:'c9',  name:'Maria Santos',     year:'2024', country:'US',     preparer:'Maulshree', due:'2026-04-22', fee:950,  stage:'review',         priority:'urgent' },
  { id:'c10', name:'James Chen',       year:'2023', country:'Canada', preparer:'Amit K.',   due:'2026-04-24', fee:780,  stage:'review',         priority:'high'   },
  { id:'c11', name:'Fatima Al-Hassan', year:'2024', country:'US',     preparer:'Priya S.',  due:'2026-05-08', fee:1050, stage:'review',         priority:'normal' },
  { id:'c12', name:'Robert Chang',     year:'2023', country:'US',     preparer:'Maulshree', due:'2026-04-18', fee:870,  stage:'filing',         priority:'urgent' },
  { id:'c13', name:'Priya Kapoor',     year:'2024', country:'US',     preparer:'Amit K.',   due:'2026-04-22', fee:750,  stage:'filing',         priority:'high'   },
  { id:'c14', name:'Michael Torres',   year:'2023', country:'US',     preparer:'Priya S.',  due:null,         fee:890,  stage:'completed',      priority:'normal' },
  { id:'c15', name:'Aisha Mohammed',   year:'2023', country:'UK',     preparer:'Maulshree', due:null,         fee:1300, stage:'completed',      priority:'normal' },
  { id:'c16', name:'Carlos Mendez',    year:'2022', country:'US',     preparer:'Amit K.',   due:null,         fee:680,  stage:'completed',      priority:'normal' },
  { id:'c17', name:'Sophie Laurent',   year:'2024', country:'US',     preparer:'Priya S.',  due:'2026-06-15', fee:1100, stage:'on_hold',        priority:'low'    },
  { id:'c18', name:'Vikram Sharma',    year:'2023', country:'US',     preparer:null,         due:'2026-06-30', fee:860,  stage:'on_hold',        priority:'low'    },
];

// ── Helpers ───────────────────────────────────────────────────
const fmt   = (s) => new Date(s).toLocaleDateString('en-US', { month:'short', day:'numeric' });
const inits = (n) => n.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

const getDue = (due) => {
  if (!due) return null;
  const d    = Math.floor((new Date(due) - TODAY) / 86400000);
  if (d < 0)  return { text:`${Math.abs(d)}d overdue`, color:'#EF4444', hot:true };
  if (d === 0) return { text:'Due today',               color:'#EF4444', hot:true };
  if (d <= 3)  return { text:`${d}d left`,              color:'#F59E0B', hot:true };
  if (d <= 7)  return { text:fmt(due),                  color:'#F59E0B', hot:false };
  return        { text:fmt(due),                        color:'#9CA3AF', hot:false };
};

const PRIORITY_COLOR = { urgent:'#EF4444', high:'#F59E0B', normal:'#E5E7EB', low:'#E5E7EB' };
const PRIORITY_BG    = { urgent:'#FEE2E2', high:'#FEF3C7', normal:null, low:null };

// ── Card ──────────────────────────────────────────────────────
function Card({ card, stageColor, isDragging, onDragStart, onDragEnd, onClick }) {
  const due = getDue(card.due);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{
        background: 'white',
        borderRadius: 10,
        border: '1px solid #ECEAF3',
        borderLeft: `3px solid ${PRIORITY_COLOR[card.priority]}`,
        padding: '11px 12px 10px',
        marginBottom: 8,
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.3 : 1,
        boxShadow: isDragging ? 'none' : '0 1px 4px rgba(0,0,0,0.05)',
        userSelect: 'none',
        transition: 'opacity 0.15s, box-shadow 0.15s',
        position: 'relative',
      }}>

      {/* Name row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8, gap:4 }}>
        <div style={{ fontWeight:600, fontSize:15, color:'#0F0A1E', lineHeight:1.3, flex:1 }}>{card.name}</div>
        <button onClick={e => e.stopPropagation()} style={{ background:'none', border:'none', cursor:'pointer', color:'#D1D5DB', padding:0, display:'flex', flexShrink:0 }}>
          <MoreHorizontal size={13} />
        </button>
      </div>

      {/* Chips row */}
      <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:9 }}>
        <span style={{ background:'#F3F4F6', color:'#6B7280', fontSize:12, fontWeight:600, padding:'2px 6px', borderRadius:4 }}>{card.year}</span>
        <span style={{ background:'#F3F4F6', color:'#6B7280', fontSize:12, fontWeight:600, padding:'2px 6px', borderRadius:4 }}>{card.country}</span>
        {card.priority === 'urgent' && (
          <span style={{ background:'#FEE2E2', color:'#EF4444', fontSize:12, fontWeight:700, padding:'2px 6px', borderRadius:4 }}>URGENT</span>
        )}
        {card.priority === 'high' && (
          <span style={{ background:'#FEF3C7', color:'#D97706', fontSize:12, fontWeight:700, padding:'2px 6px', borderRadius:4 }}>HIGH</span>
        )}
      </div>

      {/* Due + fee row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:9 }}>
        {due ? (
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <Clock size={10} color={due.color} />
            <span style={{ fontSize:13, color:due.color, fontWeight:600 }}>{due.text}</span>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <CheckCircle size={10} color="#38AC87" />
            <span style={{ fontSize:13, color:'#38AC87', fontWeight:600 }}>Filed</span>
          </div>
        )}
        <span style={{ fontSize:14, fontWeight:700, color:'#374151' }}>${card.fee.toLocaleString()}</span>
      </div>

      {/* Preparer row */}
      {card.preparer ? (
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:20, height:20, borderRadius:'50%', background:stageColor+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:stageColor, flexShrink:0 }}>
            {inits(card.preparer)}
          </div>
          <span style={{ fontSize:13, color:'#6B7280' }}>{card.preparer}</span>
        </div>
      ) : (
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:20, height:20, borderRadius:'50%', border:'1.5px dashed #D1D5DB', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <User size={9} color="#D1D5DB" />
          </div>
          <span style={{ fontSize:13, color:'#C4C0D4', fontStyle:'italic' }}>Unassigned</span>
        </div>
      )}
    </div>
  );
}

// ── Column ────────────────────────────────────────────────────
function Column({ stage, cards, dragging, isOver, onDragOver, onDrop, onCardDragStart, onCardDragEnd, onCardClick }) {
  const colCards = cards.filter(c => c.stage === stage.id);
  const fees     = colCards.reduce((s, c) => s + c.fee, 0);
  const overdue  = colCards.filter(c => c.due && new Date(c.due) < TODAY).length;

  return (
    <div style={{ width:224, flexShrink:0, display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Column header */}
      <div style={{ flexShrink:0, marginBottom:4, padding:'0 2px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
          <div style={{ width:9, height:9, borderRadius:'50%', background:stage.color, flexShrink:0 }} />
          <span style={{ fontSize:13, fontWeight:700, color:'#374151', flex:1, letterSpacing:0.4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {stage.label.toUpperCase()}
          </span>
          <span style={{ background:stage.color+'20', color:stage.color, fontSize:13, fontWeight:700, padding:'1px 8px', borderRadius:100, flexShrink:0 }}>
            {colCards.length}
          </span>
        </div>
        {/* Sub-stats */}
        <div style={{ display:'flex', gap:8, paddingLeft:16, marginBottom:10 }}>
          {fees > 0 && <span style={{ fontSize:12, color:'#9CA3AF' }}>${(fees/1000).toFixed(1)}k fees</span>}
          {overdue > 0 && <span style={{ fontSize:12, color:'#EF4444', fontWeight:600 }}>⚠ {overdue} overdue</span>}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        style={{
          flex:1,
          overflowY:'auto',
          overflowX:'hidden',
          padding: isOver ? '6px' : '2px 0',
          background: isOver ? stage.color+'0C' : 'transparent',
          border: isOver ? `2px dashed ${stage.color}55` : '2px solid transparent',
          borderRadius:10,
          transition:'border 0.12s, background 0.12s, padding 0.12s',
        }}>
        {colCards.map(card => (
          <Card
            key={card.id}
            card={card}
            stageColor={stage.color}
            isDragging={dragging === card.id}
            onDragStart={(e) => onCardDragStart(e, card.id)}
            onDragEnd={onCardDragEnd}
            onClick={() => onCardClick(card)}
          />
        ))}

        {/* Empty state */}
        {colCards.length === 0 && !isOver && (
          <div style={{ padding:'24px 0', textAlign:'center', color:'#D1D5DB', fontSize:14 }}>
            Drop cases here
          </div>
        )}

        {/* Add button */}
        <button style={{ width:'100%', padding:'8px 0', marginTop:colCards.length > 0 ? 4 : 0, borderRadius:8, border:`1.5px dashed ${stage.color}35`, background:'transparent', color:stage.color, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5, opacity:0.65, fontWeight:500 }}>
          <Plus size={12} /> Add case
        </button>
      </div>
    </div>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────
function Drawer({ card, onClose, onMove }) {
  if (!card) return null;
  const stage = STAGES.find(s => s.id === card.stage);
  const due   = getDue(card.due);
  const caseId = `TX-2026-${card.id.replace('c','').padStart(4,'0')}`;

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,7,32,0.3)', zIndex:40, backdropFilter:'blur(2px)' }} />
      <div style={{ position:'fixed', right:0, top:0, bottom:0, width:380, background:'white', zIndex:50, boxShadow:'-6px 0 32px rgba(0,0,0,0.12)', display:'flex', flexDirection:'column' }}>

        {/* Drawer header */}
        <div style={{ padding:'22px 24px 18px', borderBottom:'1px solid #ECEAF3', background:stage.color+'08', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
            <span style={{ fontSize:12, fontWeight:700, color:stage.color, letterSpacing:1, textTransform:'uppercase', background:stage.color+'18', padding:'3px 10px', borderRadius:100 }}>{stage.label}</span>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', display:'flex', padding:2 }}><X size={16} /></button>
          </div>
          <div style={{ fontSize:20, fontWeight:700, color:'#0F0A1E', marginBottom:4 }}>{card.name}</div>
          <div style={{ fontSize:14, color:'#9CA3AF' }}>{caseId} · Tax Year {card.year} · {card.country}</div>
        </div>

        {/* Drawer body */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>

          {/* Key fields */}
          <div style={{ marginBottom:22, display:'flex', flexDirection:'column', gap:0 }}>
            {[
              { icon:Clock,       label:'Due Date',    value:due ? due.text : 'Filed',              vc:due?.color || '#38AC87' },
              { icon:DollarSign,  label:'Filing Fee',  value:`$${card.fee.toLocaleString()}`,       vc:'#374151' },
              { icon:User,        label:'Preparer',    value:card.preparer || 'Unassigned',         vc:card.preparer ? '#374151' : '#9CA3AF' },
              { icon:User,        label:'Reviewer',    value:'Not assigned',                        vc:'#9CA3AF' },
              { icon:AlertCircle, label:'Priority',    value:card.priority.charAt(0).toUpperCase() + card.priority.slice(1), vc:PRIORITY_COLOR[card.priority] },
            ].map(({ icon:Icon, label, value, vc }) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'13px 0', borderBottom:'1px solid #F3F4F6' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <Icon size={13} color="#9CA3AF" />
                  <span style={{ fontSize:15, color:'#9CA3AF' }}>{label}</span>
                </div>
                <span style={{ fontSize:15, fontWeight:600, color:vc }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Move stage */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#9CA3AF', letterSpacing:0.5, textTransform:'uppercase', marginBottom:10 }}>Move to Stage</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {STAGES.map(s => {
                const active = s.id === card.stage;
                return (
                  <button key={s.id} onClick={() => onMove(card.id, s.id)}
                    style={{ padding:'5px 12px', borderRadius:100, border:`1px solid ${active ? s.color : '#ECEAF3'}`, background:active ? s.color+'18' : 'white', color:active ? s.color : '#6B7280', fontSize:13, fontWeight:active ? 700 : 400, cursor:'pointer', transition:'all 0.1s' }}>
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Doc checklist */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#9CA3AF', letterSpacing:0.5, textTransform:'uppercase', marginBottom:10 }}>Document Checklist</div>
            {[
              { label:'Prior year return',     done:true  },
              { label:'W-2 / Foreign income',  done:true  },
              { label:'FBAR (FinCEN 114)',      done:card.stage !== 'doc_collection' && card.stage !== 'onboarding' },
              { label:'Bank statements',        done:false },
              { label:'Foreign tax paid docs',  done:false },
            ].map(({ label, done }) => (
              <div key={label} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid #F9F8FC' }}>
                <div style={{ width:16, height:16, borderRadius:4, border:`1.5px solid ${done ? '#38AC87' : '#D1D5DB'}`, background:done ? '#38AC87' : 'white', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {done && <span style={{ color:'white', fontSize:12, lineHeight:1 }}>✓</span>}
                </div>
                <span style={{ fontSize:15, color:done ? '#374151' : '#9CA3AF', textDecoration:done ? 'none' : 'none' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'#9CA3AF', letterSpacing:0.5, textTransform:'uppercase', marginBottom:10 }}>Notes</div>
            <div style={{ background:'#F7F6FC', borderRadius:8, padding:'12px 14px', fontSize:15, color:'#C4C0D4', fontStyle:'italic', lineHeight:1.6 }}>
              No notes yet — click to add...
            </div>
          </div>
        </div>

        {/* Drawer footer */}
        <div style={{ padding:'14px 24px', borderTop:'1px solid #ECEAF3', display:'flex', gap:10, flexShrink:0 }}>
          <button style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid #ECEAF3', background:'white', color:'#6B7280', fontSize:15, fontWeight:500, cursor:'pointer' }}>
            Edit Details
          </button>
          <button style={{ flex:1, padding:'10px', borderRadius:8, border:'none', background:stage.color, color:'white', fontSize:15, fontWeight:600, cursor:'pointer' }}>
            Mark Complete
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Board ────────────────────────────────────────────────
export default function TaxKanban() {
  const [cards,    setCards]    = useState(SEED);
  const [dragging, setDragging] = useState(null);
  const [over,     setOver]     = useState(null);
  const [search,   setSearch]   = useState('');
  const [preparer, setPreparer] = useState('All');
  const [year,     setYear]     = useState('All');
  const [selected, setSelected] = useState(null);

  // ── DnD ──
  const onCardDragStart  = (e, id)  => { setDragging(id); e.dataTransfer.effectAllowed = 'move'; };
  const onCardDragEnd    = ()        => { setDragging(null); setOver(null); };
  const onColDragOver    = (e, sid)  => { e.preventDefault(); setOver(sid); };
  const onColDrop        = (e, sid)  => {
    e.preventDefault();
    if (dragging) setCards(prev => prev.map(c => c.id === dragging ? { ...c, stage: sid } : c));
    setDragging(null); setOver(null);
  };

  const moveCard = (id, stage) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, stage } : c));
    setSelected(prev => prev?.id === id ? { ...prev, stage } : prev);
  };

  // ── Filter ──
  const filtered = useMemo(() => cards.filter(c => {
    if (search   && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (preparer !== 'All' && c.preparer !== preparer) return false;
    if (year     !== 'All' && c.year !== year)         return false;
    return true;
  }), [cards, search, preparer, year]);

  // ── Stats ──
  const active   = cards.filter(c => c.stage !== 'completed' && c.stage !== 'on_hold');
  const overdue  = active.filter(c => c.due && new Date(c.due) < TODAY).length;
  const fees     = active.reduce((s, c) => s + c.fee, 0);
  const unassign = active.filter(c => !c.preparer).length;

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', fontFamily:'system-ui,-apple-system,sans-serif', background:'#EFECF7', overflow:'hidden' }}>

      {/* ── Filter bar ── */}
      <div style={{ height:50, background:'white', borderBottom:'1px solid #ECEAF3', padding:'0 22px', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, background:'#F7F5FC', border:'1px solid #ECEAF3', borderRadius:7, padding:'6px 12px', width:210 }}>
          <Search size={13} color="#9CA3AF" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..."
            style={{ background:'none', border:'none', outline:'none', fontSize:15, color:'#374151', width:'100%' }} />
        </div>
        {/* Preparer chips */}
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ fontSize:13, color:'#9CA3AF', whiteSpace:'nowrap' }}>Preparer:</span>
          {PREPARERS.map(p => (
            <button key={p} onClick={() => setPreparer(p)}
              style={{ padding:'3px 10px', borderRadius:100, border:`1px solid ${preparer===p?'#38AC87':'#ECEAF3'}`, background:preparer===p?'#38AC8715':'white', color:preparer===p?'#38AC87':'#6B7280', fontSize:13, fontWeight:preparer===p?700:400, cursor:'pointer', whiteSpace:'nowrap' }}>
              {p}
            </button>
          ))}
        </div>
        {/* Year chips */}
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ fontSize:13, color:'#9CA3AF' }}>Year:</span>
          {YEARS.map(y => (
            <button key={y} onClick={() => setYear(y)}
              style={{ padding:'3px 10px', borderRadius:100, border:`1px solid ${year===y?'#38AC87':'#ECEAF3'}`, background:year===y?'#38AC8715':'white', color:year===y?'#38AC87':'#6B7280', fontSize:13, fontWeight:year===y?700:400, cursor:'pointer' }}>
              {y}
            </button>
          ))}
        </div>
        <div style={{ flex:1 }} />
        <div style={{ display:'flex', background:'#F3F4F6', borderRadius:7, padding:3, gap:1 }}>
          <button style={{ padding:'5px 10px', borderRadius:5, background:'white', border:'none', cursor:'pointer', color:'#374151', display:'flex', boxShadow:'0 1px 2px rgba(0,0,0,0.06)' }}><LayoutGrid size={14} /></button>
          <button style={{ padding:'5px 10px', borderRadius:5, background:'transparent', border:'none', cursor:'pointer', color:'#9CA3AF', display:'flex' }}><List size={14} /></button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div style={{ height:38, background:'#F7F5FC', borderBottom:'1px solid #ECEAF3', padding:'0 22px', display:'flex', alignItems:'center', gap:16, flexShrink:0, fontSize:14 }}>
        <span style={{ color:'#6B7280' }}><b style={{ color:'#374151' }}>{cards.length}</b> total cases</span>
        <span style={{ color:'#D1D5DB' }}>|</span>
        <span style={{ color:'#6B7280' }}><b style={{ color:'#38AC87' }}>{cards.filter(c=>c.stage==='completed').length}</b> completed</span>
        {overdue > 0 && <>
          <span style={{ color:'#D1D5DB' }}>|</span>
          <span style={{ color:'#EF4444', fontWeight:600 }}>⚠ {overdue} overdue</span>
        </>}
        {unassign > 0 && <>
          <span style={{ color:'#D1D5DB' }}>|</span>
          <span style={{ color:'#F59E0B' }}>⚡ {unassign} unassigned</span>
        </>}
        <span style={{ color:'#D1D5DB' }}>|</span>
        <span style={{ color:'#6B7280' }}><b style={{ color:'#374151' }}>${(fees/1000).toFixed(1)}k</b> in active fees</span>
        {search || preparer !== 'All' || year !== 'All' ? (
          <>
            <span style={{ color:'#D1D5DB' }}>|</span>
            <span style={{ color:'#8C78FF' }}>Showing {filtered.length} of {cards.length}</span>
            <button onClick={()=>{setSearch('');setPreparer('All');setYear('All');}} style={{ background:'none', border:'none', color:'#9CA3AF', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', gap:3 }}>
              <X size={10} /> Clear filters
            </button>
          </>
        ) : null}
      </div>

      {/* ── Board ── */}
      <div style={{ flex:1, overflowX:'auto', overflowY:'hidden' }}>
        <div style={{ display:'flex', gap:14, height:'100%', padding:'16px 22px 20px', minWidth:'max-content', boxSizing:'border-box' }}>
          {STAGES.map(stage => (
            <Column
              key={stage.id}
              stage={stage}
              cards={filtered}
              dragging={dragging}
              isOver={over === stage.id}
              onDragOver={(e) => onColDragOver(e, stage.id)}
              onDrop={(e)     => onColDrop(e, stage.id)}
              onCardDragStart={onCardDragStart}
              onCardDragEnd={onCardDragEnd}
              onCardClick={card => setSelected(card)}
            />
          ))}
        </div>
      </div>

      {/* ── Drawer ── */}
      {selected && (
        <Drawer
          card={selected}
          onClose={() => setSelected(null)}
          onMove={(id, stage) => moveCard(id, stage)}
        />
      )}
    </div>
  );
}
