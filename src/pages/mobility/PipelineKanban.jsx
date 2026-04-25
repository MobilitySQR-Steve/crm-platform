import { useState, useMemo } from "react";
import {
  Search, Plus, Clock,
  MoreHorizontal, LayoutGrid, List, X
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────
const TODAY   = new Date('2026-04-22');
const MTH_END = new Date('2026-04-30');

const STAGES = [
  { id:'new',             label:'New',             color:'#64748B', terminal:false },
  { id:'contacted',       label:'Contacted',        color:'#60A5FA', terminal:false },
  { id:'qualified',       label:'Qualified',        color:'#3B82F6', terminal:false },
  { id:'discovery',       label:'Discovery',        color:'#00BFE6', terminal:false },
  { id:'demo_scheduled',  label:'Demo Scheduled',   color:'#8C78FF', terminal:false },
  { id:'proposal_shared', label:'Proposal Shared',  color:'#963FA6', terminal:false },
  { id:'negotiation',     label:'Negotiation',      color:'#8D3B9D', terminal:false },
  { id:'won',             label:'Won',              color:'#38AC87', terminal:true  },
  { id:'lost',            label:'Lost',             color:'#EF4444', terminal:true  },
  { id:'nurture',         label:'Nurture',          color:'#F59E0B', terminal:false },
];

const PRODUCTS = {
  voyager:          { label:'Voyager',     color:'#00BFE6' },
  immigration_tool: { label:'Immigration', color:'#8C78FF' },
  expense_tool:     { label:'Expense',     color:'#F9B878' },
};

const OWNERS = ['All', 'Steve W.', 'Maulshree'];

const SEED = [
  { id:'o1',  account:'Reliance Industries',   opp:'Global Mobility Suite',          products:['voyager'],                                   value:120000, prob:10,  close:'2026-07-30', owner:'Steve W.',  stage:'new',             priority:'normal', industry:'Energy',        days:3  },
  { id:'o2',  account:'Tech Mahindra',          opp:'Voyager Platform',               products:['voyager'],                                   value:85000,  prob:20,  close:'2026-06-30', owner:'Steve W.',  stage:'contacted',       priority:'normal', industry:'IT Services',   days:5  },
  { id:'o3',  account:'HCL Technologies',       opp:'Immigration Compliance',         products:['immigration_tool'],                          value:45000,  prob:30,  close:'2026-06-15', owner:'Maulshree', stage:'qualified',       priority:'high',   industry:'IT Services',   days:8  },
  { id:'o4',  account:'HDFC Bank',              opp:'Mobility + Expense Bundle',      products:['voyager','expense_tool'],                    value:95000,  prob:35,  close:'2026-05-31', owner:'Steve W.',  stage:'discovery',       priority:'high',   industry:'Financial',     days:6  },
  { id:'o5',  account:'Bajaj Auto',             opp:'Voyager Implementation',         products:['voyager'],                                   value:62000,  prob:30,  close:'2026-06-20', owner:'Steve W.',  stage:'discovery',       priority:'normal', industry:'Manufacturing', days:12 },
  { id:'o6',  account:'Wipro Technologies',     opp:'Enterprise Suite',               products:['voyager','immigration_tool','expense_tool'], value:180000, prob:45,  close:'2026-05-15', owner:'Steve W.',  stage:'demo_scheduled',  priority:'urgent', industry:'IT Services',   days:4  },
  { id:'o7',  account:'Axis Bank',              opp:'Immigration Tool',               products:['immigration_tool'],                          value:38000,  prob:40,  close:'2026-05-20', owner:'Maulshree', stage:'demo_scheduled',  priority:'normal', industry:'Financial',     days:9  },
  { id:'o8',  account:'Tata Consultancy Svcs',  opp:'Global Mobility + Immigration',  products:['voyager','immigration_tool'],                value:250000, prob:55,  close:'2026-04-30', owner:'Steve W.',  stage:'proposal_shared', priority:'urgent', industry:'IT Services',   days:11 },
  { id:'o9',  account:'Infosys Limited',        opp:'Voyager Enterprise',             products:['voyager'],                                   value:145000, prob:50,  close:'2026-05-10', owner:'Steve W.',  stage:'proposal_shared', priority:'high',   industry:'IT Services',   days:7  },
  { id:'o10', account:'Mahindra Group',         opp:'Mobility Suite',                 products:['voyager','expense_tool'],                    value:98000,  prob:70,  close:'2026-04-30', owner:'Steve W.',  stage:'negotiation',     priority:'urgent', industry:'Conglomerate',  days:14 },
  { id:'o11', account:'Asian Paints',           opp:'Immigration Compliance',         products:['immigration_tool'],                          value:42000,  prob:65,  close:'2026-05-05', owner:'Maulshree', stage:'negotiation',     priority:'high',   industry:'Manufacturing', days:10 },
  { id:'o12', account:'Larsen & Toubro',        opp:'Voyager + Expense Tool',         products:['voyager','expense_tool'],                    value:115000, prob:100, close:'2026-04-10', owner:'Steve W.',  stage:'won',             priority:'normal', industry:'Engineering',   days:0  },
  { id:'o13', account:'Sun Pharma',             opp:'Global Mobility Suite',          products:['voyager','immigration_tool'],                value:88000,  prob:100, close:'2026-03-28', owner:'Maulshree', stage:'won',             priority:'normal', industry:'Pharma',        days:0  },
  { id:'o14', account:'ITC Limited',            opp:'Voyager Platform',               products:['voyager'],                                   value:72000,  prob:0,   close:'2026-03-15', owner:'Steve W.',  stage:'lost',            priority:'normal', industry:'Conglomerate',  days:0  },
  { id:'o15', account:'ICICI Bank',             opp:'Future Mobility Programme',      products:['voyager'],                                   value:200000, prob:15,  close:'2026-12-31', owner:'Steve W.',  stage:'nurture',         priority:'low',    industry:'Financial',     days:22 },
  { id:'o16', account:'Hero MotoCorp',          opp:'Immigration Compliance Tool',    products:['immigration_tool'],                          value:35000,  prob:20,  close:'2026-09-30', owner:'Maulshree', stage:'nurture',         priority:'low',    industry:'Manufacturing', days:18 },
];

// ── Helpers ───────────────────────────────────────────────────
const fmtVal = (v) => v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : `$${Math.round(v/1000)}k`;
const fmt    = (s) => new Date(s).toLocaleDateString('en-US', { month:'short', day:'numeric' });
const inits  = (n) => n.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

const getClose = (closeStr, stage) => {
  if (stage === 'won' || stage === 'lost') return null;
  const d = Math.floor((new Date(closeStr) - TODAY) / 86400000);
  if (d < 0)  return { text:`${Math.abs(d)}d overdue`, color:'#EF4444' };
  if (d === 0) return { text:'Closes today',            color:'#EF4444' };
  if (d <= 7)  return { text:`${d}d to close`,          color:'#F59E0B' };
  if (d <= 30) return { text:fmt(closeStr),             color:'#F59E0B' };
  return        { text:fmt(closeStr),                   color:'#9CA3AF' };
};

const probColor = (p) => p >= 70 ? '#38AC87' : p >= 40 ? '#8D3B9D' : '#9CA3AF';
const PBORDER   = { urgent:'#EF4444', high:'#F59E0B', normal:'#E5E7EB', low:'#E5E7EB' };

// ── Product Badge ─────────────────────────────────────────────
function PBadge({ pid }) {
  const p = PRODUCTS[pid];
  if (!p) return null;
  return (
    <span style={{ background:p.color+'1A', color:p.color, fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:4, letterSpacing:0.2, whiteSpace:'nowrap' }}>
      {p.label.toUpperCase()}
    </span>
  );
}

// ── Deal Card ─────────────────────────────────────────────────
function DealCard({ opp, stageColor, isDragging, onDragStart, onDragEnd, onClick }) {
  const close = getClose(opp.close, opp.stage);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{
        background:'white', borderRadius:10, border:'1px solid #EDE8F3',
        borderLeft:`3px solid ${PBORDER[opp.priority]}`,
        padding:'11px 12px 10px', marginBottom:8,
        cursor:isDragging?'grabbing':'grab',
        opacity:isDragging?0.3:1,
        boxShadow:isDragging?'none':'0 1px 4px rgba(0,0,0,0.05)',
        userSelect:'none', transition:'opacity 0.15s',
      }}>

      {/* Account + opp name */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:6, marginBottom:4 }}>
        <div style={{ width:22, height:22, borderRadius:6, background:stageColor+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:stageColor, flexShrink:0, marginTop:1 }}>
          {inits(opp.account)}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:12, color:'#0F0A1E', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{opp.account}</div>
          <div style={{ fontSize:10, color:'#9CA3AF', marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{opp.opp}</div>
        </div>
        <button onClick={e => e.stopPropagation()} style={{ background:'none', border:'none', cursor:'pointer', color:'#D1D5DB', padding:0, flexShrink:0 }}>
          <MoreHorizontal size={13} />
        </button>
      </div>

      {/* Products + urgent */}
      <div style={{ display:'flex', gap:4, flexWrap:'wrap', margin:'8px 0' }}>
        {opp.products.map(p => <PBadge key={p} pid={p} />)}
        {opp.priority === 'urgent' && (
          <span style={{ background:'#FEE2E2', color:'#EF4444', fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:4 }}>🔥 HOT</span>
        )}
      </div>

      {/* Value + probability */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:5 }}>
        <span style={{ fontSize:15, fontWeight:800, color:'#0F0A1E', letterSpacing:-0.3 }}>{fmtVal(opp.value)}</span>
        <span style={{ fontSize:11, fontWeight:700, color:probColor(opp.prob) }}>{opp.prob}%</span>
      </div>

      {/* Probability bar */}
      <div style={{ height:3, background:'#F3F4F6', borderRadius:2, marginBottom:9 }}>
        <div style={{ height:'100%', borderRadius:2, width:`${opp.prob}%`, background:probColor(opp.prob), opacity:0.65 }} />
      </div>

      {/* Close date + owner */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        {close ? (
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <Clock size={10} color={close.color} />
            <span style={{ fontSize:10, color:close.color, fontWeight:600 }}>{close.text}</span>
          </div>
        ) : (
          <span style={{ fontSize:10, fontWeight:600, color:opp.stage==='won'?'#38AC87':'#9CA3AF' }}>
            {opp.stage==='won' ? `✓ ${fmt(opp.close)}` : `✗ ${fmt(opp.close)}`}
          </span>
        )}
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <div style={{ width:18, height:18, borderRadius:'50%', background:stageColor+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:stageColor }}>
            {inits(opp.owner)}
          </div>
          <span style={{ fontSize:10, color:'#9CA3AF' }}>{opp.owner.split(' ')[0]}</span>
        </div>
      </div>
    </div>
  );
}

// ── Column ────────────────────────────────────────────────────
function PipelineColumn({ stage, opps, dragging, isOver, onDragOver, onDrop, onCardDragStart, onCardDragEnd, onCardClick }) {
  const col      = opps.filter(o => o.stage === stage.id);
  const total    = col.reduce((s,o) => s+o.value, 0);
  const weighted = col.reduce((s,o) => s+o.value*o.prob/100, 0);
  const closing  = col.filter(o => !stage.terminal && o.close && new Date(o.close) <= MTH_END).length;

  return (
    <div style={{ width:208, flexShrink:0, display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Header */}
      <div style={{ flexShrink:0, marginBottom:2 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:stage.color, flexShrink:0 }} />
          <span style={{ fontSize:10.5, fontWeight:700, color:'#374151', flex:1, letterSpacing:0.4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {stage.label.toUpperCase()}
          </span>
          <span style={{ background:stage.color+'20', color:stage.color, fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:100 }}>{col.length}</span>
        </div>
        {/* Value line */}
        <div style={{ paddingLeft:14, marginBottom:10, fontSize:10, display:'flex', flexWrap:'wrap', gap:6, alignItems:'center' }}>
          {total > 0 && <span style={{ fontWeight:700, color:'#374151' }}>{fmtVal(total)}</span>}
          {total > 0 && !stage.terminal && <span style={{ color:'#9CA3AF' }}>· {fmtVal(weighted)} wtd</span>}
          {closing > 0 && <span style={{ color:'#F59E0B', fontWeight:700 }}>⚡{closing} closing</span>}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        style={{
          flex:1, overflowY:'auto', overflowX:'hidden',
          padding:isOver?'6px':'2px 0',
          background:isOver?stage.color+'0C':'transparent',
          border:isOver?`2px dashed ${stage.color}55`:'2px solid transparent',
          borderRadius:10, transition:'all 0.12s',
        }}>
        {col.map(opp => (
          <DealCard
            key={opp.id}
            opp={opp}
            stageColor={stage.color}
            isDragging={dragging === opp.id}
            onDragStart={e => onCardDragStart(e, opp.id)}
            onDragEnd={onCardDragEnd}
            onClick={() => onCardClick(opp)}
          />
        ))}
        {col.length === 0 && !isOver && (
          <div style={{ padding:'20px 0', textAlign:'center', color:'#D1D5DB', fontSize:11 }}>Drop here</div>
        )}
        {!stage.terminal && (
          <button style={{ width:'100%', padding:'7px 0', marginTop:col.length>0?2:0, borderRadius:8, border:`1.5px dashed ${stage.color}35`, background:'transparent', color:stage.color, fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4, opacity:0.6, fontWeight:500 }}>
            <Plus size={11} /> Add deal
          </button>
        )}
      </div>
    </div>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────
function Drawer({ opp, onClose, onMove }) {
  if (!opp) return null;
  const stage    = STAGES.find(s => s.id === opp.stage);
  const close    = getClose(opp.close, opp.stage);
  const weighted = Math.round(opp.value * opp.prob / 100);

  const stakeholders = [
    { name:'Rajiv Sharma', title:'Head of HR',         role:'Decision Maker' },
    { name:'Priti Nair',   title:'IT Director',         role:'Influencer'     },
    { name:'Anand Kumar',  title:'Procurement Manager', role:'Gatekeeper'     },
  ];
  const ROLE_COLOR = { 'Decision Maker':'#8D3B9D', 'Influencer':'#00BFE6', 'Gatekeeper':'#F59E0B' };

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,7,32,0.28)', zIndex:40, backdropFilter:'blur(2px)' }} />
      <div style={{ position:'fixed', right:0, top:0, bottom:0, width:400, background:'white', zIndex:50, boxShadow:'-6px 0 36px rgba(0,0,0,0.12)', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid #EDE8F3', background:stage.color+'08', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <span style={{ fontSize:10, fontWeight:700, color:stage.color, letterSpacing:1, textTransform:'uppercase', background:stage.color+'18', padding:'3px 10px', borderRadius:100 }}>{stage.label}</span>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', display:'flex' }}><X size={16} /></button>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:stage.color+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:stage.color, flexShrink:0 }}>
              {inits(opp.account)}
            </div>
            <div>
              <div style={{ fontSize:17, fontWeight:800, color:'#0F0A1E', lineHeight:1.2 }}>{opp.account}</div>
              <div style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>{opp.opp}</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {opp.products.map(p => <PBadge key={p} pid={p} />)}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>

          {/* Value / prob / weighted band */}
          <div style={{ background:stage.color+'0C', border:`1px solid ${stage.color}20`, borderRadius:10, padding:'14px 18px', marginBottom:18, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, textAlign:'center' }}>
            {[
              { l:'Deal Value',  v:fmtVal(opp.value),  big:true,  c:'#0F0A1E'         },
              { l:'Probability', v:`${opp.prob}%`,      big:true,  c:probColor(opp.prob) },
              { l:'Weighted',    v:fmtVal(weighted),    big:false, c:'#6B7280'         },
            ].map(f => (
              <div key={f.l}>
                <div style={{ fontSize:9, color:'#9CA3AF', fontWeight:600, letterSpacing:0.5, textTransform:'uppercase', marginBottom:4 }}>{f.l}</div>
                <div style={{ fontSize:f.big?18:14, fontWeight:800, color:f.c, lineHeight:1 }}>{f.v}</div>
              </div>
            ))}
          </div>

          {/* Prob bar */}
          <div style={{ marginBottom:18 }}>
            <div style={{ height:6, background:'#F3F4F6', borderRadius:3 }}>
              <div style={{ height:'100%', borderRadius:3, width:`${opp.prob}%`, background:probColor(opp.prob), opacity:0.7 }} />
            </div>
          </div>

          {/* Field rows */}
          <div style={{ marginBottom:20 }}>
            {[
              { label:'Close Date',    value:close?close.text:fmt(opp.close),  color:close?.color||'#38AC87'                },
              { label:'Owner',         value:opp.owner,                          color:'#374151'                              },
              { label:'Industry',      value:opp.industry,                       color:'#374151'                              },
              { label:'Priority',      value:opp.priority.charAt(0).toUpperCase()+opp.priority.slice(1), color:PBORDER[opp.priority] },
              { label:'Days in Stage', value:`${opp.days} days`,                color:opp.days > 14 ? '#EF4444' : '#374151'  },
              { label:'Competitor',    value:'Not tracked',                      color:'#9CA3AF'                              },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 0', borderBottom:'1px solid #F3F4F6' }}>
                <span style={{ fontSize:13, color:'#9CA3AF' }}>{label}</span>
                <span style={{ fontSize:13, fontWeight:600, color }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Stakeholders */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', letterSpacing:0.5, textTransform:'uppercase', marginBottom:10 }}>Stakeholders</div>
            {stakeholders.map(s => (
              <div key={s.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid #F9F8FC' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:stage.color+'1A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:stage.color }}>
                    {inits(s.name)}
                  </div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:'#374151' }}>{s.name}</div>
                    <div style={{ fontSize:10, color:'#9CA3AF' }}>{s.title}</div>
                  </div>
                </div>
                <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:100, background:(ROLE_COLOR[s.role]||'#9CA3AF')+'18', color:ROLE_COLOR[s.role]||'#9CA3AF' }}>
                  {s.role}
                </span>
              </div>
            ))}
          </div>

          {/* Move stage */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', letterSpacing:0.5, textTransform:'uppercase', marginBottom:10 }}>Move to Stage</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {STAGES.map(s => {
                const active = s.id === opp.stage;
                return (
                  <button key={s.id} onClick={() => onMove(opp.id, s.id)}
                    style={{ padding:'4px 11px', borderRadius:100, border:`1px solid ${active?s.color:'#EDE8F3'}`, background:active?s.color+'18':'white', color:active?s.color:'#6B7280', fontSize:11, fontWeight:active?700:400, cursor:'pointer' }}>
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', letterSpacing:0.5, textTransform:'uppercase', marginBottom:10 }}>Notes</div>
            <div style={{ background:'#F7F4FC', borderRadius:8, padding:'12px 14px', fontSize:13, color:'#C4C0D4', fontStyle:'italic', lineHeight:1.6 }}>
              No notes yet — click to add...
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 24px', borderTop:'1px solid #EDE8F3', display:'flex', gap:10, flexShrink:0 }}>
          <button style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid #EDE8F3', background:'white', color:'#6B7280', fontSize:13, fontWeight:500, cursor:'pointer' }}>
            Edit Details
          </button>
          <button onClick={() => { onMove(opp.id,'won'); onClose(); }}
            style={{ flex:1, padding:'10px', borderRadius:8, border:'none', background:'#38AC87', color:'white', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            Mark Won ✓
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function PipelineKanban() {
  const [opps,     setOpps]     = useState(SEED);
  const [dragging, setDragging] = useState(null);
  const [over,     setOver]     = useState(null);
  const [search,   setSearch]   = useState('');
  const [owner,    setOwner]    = useState('All');
  const [selected, setSelected] = useState(null);

  // DnD
  const onCardDragStart = (e, id) => { setDragging(id); e.dataTransfer.effectAllowed='move'; };
  const onCardDragEnd   = ()       => { setDragging(null); setOver(null); };
  const onColDragOver   = (e,sid)  => { e.preventDefault(); setOver(sid); };
  const onColDrop       = (e,sid)  => {
    e.preventDefault();
    if (dragging) setOpps(prev => prev.map(o => o.id===dragging ? {...o,stage:sid} : o));
    setDragging(null); setOver(null);
  };
  const moveOpp = (id, stage) => {
    setOpps(prev => prev.map(o => o.id===id ? {...o,stage} : o));
    setSelected(prev => prev?.id===id ? {...prev,stage} : prev);
  };

  // Filter
  const filtered = useMemo(() => opps.filter(o => {
    const q = search.toLowerCase();
    if (q && !o.account.toLowerCase().includes(q) && !o.opp.toLowerCase().includes(q)) return false;
    if (owner !== 'All' && o.owner !== owner) return false;
    return true;
  }), [opps, search, owner]);

  // Stats
  const active       = opps.filter(o => o.stage !== 'won' && o.stage !== 'lost');
  const totalPipe    = active.reduce((s,o) => s+o.value, 0);
  const weightedPipe = active.reduce((s,o) => s+o.value*o.prob/100, 0);
  const closingMo    = active.filter(o => new Date(o.close) <= MTH_END).length;
  const wonValue     = opps.filter(o => o.stage==='won').reduce((s,o) => s+o.value, 0);

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', fontFamily:'system-ui,-apple-system,sans-serif', background:'#F0EBF8', overflow:'hidden' }}>
      {/* Filter bar */}
      <div style={{ height:50, background:'white', borderBottom:'1px solid #EDE8F3', padding:'0 22px', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, background:'#F7F4FC', border:'1px solid #EDE8F3', borderRadius:7, padding:'6px 12px', width:230 }}>
          <Search size={13} color="#9CA3AF" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts or deals..."
            style={{ background:'none', border:'none', outline:'none', fontSize:13, color:'#374151', width:'100%' }} />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ fontSize:11, color:'#9CA3AF', whiteSpace:'nowrap' }}>Owner:</span>
          {OWNERS.map(o => (
            <button key={o} onClick={() => setOwner(o)}
              style={{ padding:'3px 10px', borderRadius:100, border:`1px solid ${owner===o?'#8D3B9D':'#EDE8F3'}`, background:owner===o?'#8D3B9D15':'white', color:owner===o?'#8D3B9D':'#6B7280', fontSize:11, fontWeight:owner===o?700:400, cursor:'pointer', whiteSpace:'nowrap' }}>
              {o}
            </button>
          ))}
        </div>
        <div style={{ flex:1 }} />
        <div style={{ display:'flex', background:'#F3F4F6', borderRadius:7, padding:3, gap:1 }}>
          <button style={{ padding:'5px 10px', borderRadius:5, background:'white', border:'none', cursor:'pointer', color:'#374151', display:'flex', boxShadow:'0 1px 2px rgba(0,0,0,0.06)' }}><LayoutGrid size={14} /></button>
          <button style={{ padding:'5px 10px', borderRadius:5, background:'transparent', border:'none', cursor:'pointer', color:'#9CA3AF', display:'flex' }}><List size={14} /></button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ height:38, background:'#F7F4FC', borderBottom:'1px solid #EDE8F3', padding:'0 22px', display:'flex', alignItems:'center', gap:16, flexShrink:0, fontSize:12 }}>
        <span style={{ color:'#6B7280' }}>Active pipeline <b style={{ color:'#374151' }}>{fmtVal(totalPipe)}</b></span>
        <span style={{ color:'#D1D5DB' }}>|</span>
        <span style={{ color:'#6B7280' }}>Weighted <b style={{ color:'#8D3B9D' }}>{fmtVal(weightedPipe)}</b></span>
        <span style={{ color:'#D1D5DB' }}>|</span>
        {closingMo > 0 && <>
          <span style={{ color:'#F59E0B', fontWeight:600 }}>⚡ {closingMo} closing this month</span>
          <span style={{ color:'#D1D5DB' }}>|</span>
        </>}
        <span style={{ color:'#6B7280' }}>Won this Q <b style={{ color:'#38AC87' }}>{fmtVal(wonValue)}</b></span>
        {(search || owner !== 'All') && <>
          <span style={{ color:'#D1D5DB' }}>|</span>
          <span style={{ color:'#8C78FF' }}>Showing {filtered.length} of {opps.length}</span>
          <button onClick={() => { setSearch(''); setOwner('All'); }} style={{ background:'none', border:'none', color:'#9CA3AF', cursor:'pointer', fontSize:11, display:'flex', alignItems:'center', gap:3 }}>
            <X size={10} /> Clear
          </button>
        </>}
      </div>

      {/* Board */}
      <div style={{ flex:1, overflowX:'auto', overflowY:'hidden' }}>
        <div style={{ display:'flex', gap:12, height:'100%', padding:'16px 22px 20px', minWidth:'max-content', boxSizing:'border-box' }}>
          {STAGES.map(stage => (
            <PipelineColumn
              key={stage.id}
              stage={stage}
              opps={filtered}
              dragging={dragging}
              isOver={over === stage.id}
              onDragOver={e => onColDragOver(e, stage.id)}
              onDrop={e => onColDrop(e, stage.id)}
              onCardDragStart={onCardDragStart}
              onCardDragEnd={onCardDragEnd}
              onCardClick={opp => setSelected(opp)}
            />
          ))}
        </div>
      </div>

      {/* Drawer */}
      {selected && <Drawer opp={selected} onClose={() => setSelected(null)} onMove={moveOpp} />}
    </div>
  );
}
