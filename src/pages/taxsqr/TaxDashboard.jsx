import { Link } from 'react-router-dom';
import {
  Users, FolderOpen, Clock, DollarSign,
  BarChart3, Plus, ChevronRight,
} from 'lucide-react';

const ACCENT = '#38AC87';

function StatCard({ label, value, sub, color, Icon }) {
  return (
    <div style={{ background:'white', borderRadius:12, padding:'18px 20px', border:'1px solid #ECEAF3', flex:1, minWidth:0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:13, color:'#9CA3AF', marginBottom:8, fontWeight:500, letterSpacing:0.5, textTransform:'uppercase' }}>{label}</div>
          <div style={{ fontSize:26, fontWeight:700, color:'#0F0A1E', lineHeight:1 }}>{value}</div>
          {sub && <div style={{ fontSize:13, color:'#9CA3AF', marginTop:5 }}>{sub}</div>}
        </div>
        <div style={{ width:38, height:38, borderRadius:10, background:color+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon size={17} color={color} />
        </div>
      </div>
    </div>
  );
}

const RECENT = [
  { name:'Rajesh Mehra',   year:'2024', status:'preparation',    due:'Apr 30', fee:'$850'   },
  { name:'Sarah Johnson',  year:'2023', status:'review',          due:'Apr 22', fee:'$1,200' },
  { name:'David Kim',      year:'2024', status:'doc_collection',  due:'May 15', fee:'$650'   },
  { name:'Maria Santos',   year:'2024', status:'filing',          due:'Apr 18', fee:'$950'   },
  { name:'James Chen',     year:'2023', status:'completed',       due:'—',      fee:'$780'   },
];
const SC = { preparation:'#8C78FF', review:'#2563EB', doc_collection:'#F59E0B', filing:'#3B82F6', completed:'#38AC87' };
const SL = { preparation:'Preparation', review:'Review', doc_collection:'Doc Collection', filing:'Filing', completed:'Completed' };
const STAGES = [
  { l:'Onboarding', n:8 }, { l:'Doc Collection', n:14 },
  { l:'Preparation', n:21 }, { l:'Review', n:9 },
  { l:'Filing', n:5 }, { l:'Completed', n:47 },
];

export default function TaxDashboard() {
  return (
    <div style={{ height:'100%', overflowY:'auto', background:'#EFECF7' }}>
      <div style={{ padding:'22px 28px 40px' }}>
        {/* Page header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:700, color:'#0F0A1E', margin:0 }}>Dashboard</h1>
            <div style={{ fontSize:14, color:'#9CA3AF', marginTop:3 }}>TaxSQR · D2C · Tax Services</div>
          </div>
          <Link to="/taxsqr/clients" style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', background:ACCENT, color:'white', borderRadius:8, fontSize:15, fontWeight:600, textDecoration:'none' }}>
            <Plus size={14} /> New Client
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:12, marginBottom:18, flexWrap:'wrap' }}>
          <StatCard label="Total Clients"  value="142"    sub="+6 this month"        color={ACCENT}    Icon={Users}      />
          <StatCard label="Active Cases"   value="57"     sub="28 due in 30 days"    color="#F59E0B"   Icon={FolderOpen} />
          <StatCard label="Due This Week"  value="6"      sub="2 overdue"            color="#EF4444"   Icon={Clock}      />
          <StatCard label="Revenue MTD"    value="$14.2k" sub="↑ vs $11.8k last mo." color={ACCENT}    Icon={DollarSign} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:14 }}>
          {/* Stage bars */}
          <div style={{ background:'white', borderRadius:12, padding:20, border:'1px solid #ECEAF3' }}>
            <div style={{ fontSize:15, fontWeight:600, color:'#0F0A1E', marginBottom:16 }}>Cases by Stage</div>
            {STAGES.map(s => (
              <div key={s.l} style={{ marginBottom:11 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:14 }}>
                  <span style={{ color:'#6B7280' }}>{s.l}</span>
                  <span style={{ fontWeight:600, color:'#374151' }}>{s.n}</span>
                </div>
                <div style={{ height:5, background:'#F3F4F6', borderRadius:3 }}>
                  <div style={{ height:'100%', background:ACCENT, borderRadius:3, width:`${(s.n/47)*100}%`, opacity:0.7 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Recent cases */}
          <div style={{ background:'white', borderRadius:12, padding:20, border:'1px solid #ECEAF3' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ fontSize:15, fontWeight:600, color:'#0F0A1E' }}>Recent Cases</div>
              <Link to="/taxsqr/cases/kanban" style={{ fontSize:14, color:ACCENT, fontWeight:500, display:'flex', alignItems:'center', gap:3 }}>
                View all <ChevronRight size={12} />
              </Link>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:15 }}>
              <thead>
                <tr>
                  {['Client','Year','Status','Due','Fee'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'0 8px 10px', color:'#9CA3AF', fontWeight:500, fontSize:13, letterSpacing:0.5, textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RECENT.map((r,i) => (
                  <tr key={i} style={{ borderTop:'1px solid #F8F7FC' }}>
                    <td style={{ padding:'10px 8px', fontWeight:500, color:'#0F0A1E' }}>{r.name}</td>
                    <td style={{ padding:'10px 8px', color:'#6B7280' }}>{r.year}</td>
                    <td style={{ padding:'10px 8px' }}>
                      <span style={{ padding:'3px 9px', borderRadius:100, fontSize:13, fontWeight:600, background:(SC[r.status]||'#9CA3AF')+'18', color:SC[r.status]||'#9CA3AF' }}>{SL[r.status]||r.status}</span>
                    </td>
                    <td style={{ padding:'10px 8px', color:'#9CA3AF', fontSize:14 }}>{r.due}</td>
                    <td style={{ padding:'10px 8px', fontWeight:600, color:'#374151' }}>{r.fee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick links */}
        <div style={{ display:'flex', gap:12, marginTop:14 }}>
          {[
            { label:'Open Kanban Board', path:'/taxsqr/cases/kanban', color:ACCENT },
            { label:'View All Clients',  path:'/taxsqr/clients',      color:'#6B7280' },
          ].map(l => (
            <Link key={l.label} to={l.path}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 18px', background:'white', border:'1px solid #ECEAF3', borderRadius:8, fontSize:15, fontWeight:500, color:l.color, textDecoration:'none' }}>
              {l.label} <ChevronRight size={13} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
