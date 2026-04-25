import { Link } from 'react-router-dom';
import {
  Building2, TrendingUp, DollarSign, BarChart3,
  Plus, ChevronRight,
} from 'lucide-react';

const ACCENT = '#8D3B9D';

function StatCard({ label, value, sub, color, Icon }) {
  return (
    <div style={{ background:'white', borderRadius:12, padding:'18px 20px', border:'1px solid #EDE8F3', flex:1, minWidth:0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:11, color:'#9CA3AF', marginBottom:8, fontWeight:500, letterSpacing:0.5, textTransform:'uppercase' }}>{label}</div>
          <div style={{ fontSize:26, fontWeight:700, color:'#0F0A1E', lineHeight:1 }}>{value}</div>
          {sub && <div style={{ fontSize:11, color:'#9CA3AF', marginTop:5 }}>{sub}</div>}
        </div>
        <div style={{ width:38, height:38, borderRadius:10, background:color+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon size={17} color={color} />
        </div>
      </div>
    </div>
  );
}

const OPPS = [
  { account:'Tata Consultancy Svcs', industry:'IT Services',    stage:'Proposal Shared',  value:'$250k', owner:'Steve W.'  },
  { account:'Infosys Limited',       industry:'IT Services',    stage:'Proposal Shared',  value:'$145k', owner:'Steve W.'  },
  { account:'Mahindra Group',        industry:'Conglomerate',   stage:'Negotiation',      value:'$98k',  owner:'Steve W.'  },
  { account:'Asian Paints',          industry:'Manufacturing',  stage:'Negotiation',      value:'$42k',  owner:'Maulshree' },
  { account:'Wipro Technologies',    industry:'IT Services',    stage:'Demo Scheduled',   value:'$180k', owner:'Steve W.'  },
];
const SC = { 'Proposal Shared':'#963FA6', 'Negotiation':'#8D3B9D', 'Demo Scheduled':'#8C78FF', 'Discovery':'#00BFE6', 'Won':'#38AC87' };

const PIPE = [
  { l:'Contacted',     n:5, v:'$120k', w:28 },
  { l:'Discovery',     n:8, v:'$340k', w:55 },
  { l:'Demo Scheduled',n:4, v:'$210k', w:38 },
  { l:'Proposal Sent', n:6, v:'$480k', w:72 },
  { l:'Negotiation',   n:3, v:'$290k', w:44 },
];

export default function MobilityDashboard() {
  return (
    <div style={{ height:'100%', overflowY:'auto', background:'#F0EBF8' }}>
      <div style={{ padding:'22px 28px 40px' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:700, color:'#0F0A1E', margin:0 }}>Dashboard</h1>
            <div style={{ fontSize:12, color:'#9CA3AF', marginTop:3 }}>MobilitySQR · B2B · Enterprise Sales</div>
          </div>
          <Link to="/mobility/pipeline/kanban" style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', background:ACCENT, color:'white', borderRadius:8, fontSize:13, fontWeight:600, textDecoration:'none' }}>
            <Plus size={14} /> New Opportunity
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:12, marginBottom:18, flexWrap:'wrap' }}>
          <StatCard label="Active Accounts"  value="38"    sub="+4 this quarter"    color={ACCENT}    Icon={Building2}  />
          <StatCard label="Opportunities"    value="12"    sub="3 closing this mo." color="#00BFE6"   Icon={TrendingUp}  />
          <StatCard label="Pipeline Value"   value="$2.4M" sub="Weighted: $890k"    color="#F9B878"   Icon={DollarSign}  />
          <StatCard label="Win Rate"         value="34%"   sub="↑ from 28% last Q"  color="#38AC87"   Icon={BarChart3}   />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:14 }}>
          {/* Pipeline bars */}
          <div style={{ background:'white', borderRadius:12, padding:20, border:'1px solid #EDE8F3' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#0F0A1E', marginBottom:16 }}>Pipeline by Stage</div>
            {PIPE.map(p => (
              <div key={p.l} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:12 }}>
                  <span style={{ color:'#6B7280' }}>{p.l}</span>
                  <div style={{ display:'flex', gap:8 }}>
                    <span style={{ color:'#9CA3AF' }}>{p.n}</span>
                    <span style={{ fontWeight:600, color:'#374151' }}>{p.v}</span>
                  </div>
                </div>
                <div style={{ height:5, background:'#F3F4F6', borderRadius:3 }}>
                  <div style={{ height:'100%', background:ACCENT, borderRadius:3, width:`${p.w}%`, opacity:0.75 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Active opps */}
          <div style={{ background:'white', borderRadius:12, padding:20, border:'1px solid #EDE8F3' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#0F0A1E' }}>Active Opportunities</div>
              <Link to="/mobility/pipeline/kanban" style={{ fontSize:12, color:ACCENT, fontWeight:500, display:'flex', alignItems:'center', gap:3, textDecoration:'none' }}>
                View pipeline <ChevronRight size={12} />
              </Link>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr>
                  {['Account','Stage','Value','Owner'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'0 8px 10px', color:'#9CA3AF', fontWeight:500, fontSize:11, letterSpacing:0.5, textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {OPPS.map((o,i) => (
                  <tr key={i} style={{ borderTop:'1px solid #F8F7FC' }}>
                    <td style={{ padding:'10px 8px' }}>
                      <div style={{ fontWeight:500, color:'#0F0A1E' }}>{o.account}</div>
                      <div style={{ fontSize:11, color:'#9CA3AF', marginTop:1 }}>{o.industry}</div>
                    </td>
                    <td style={{ padding:'10px 8px' }}>
                      <span style={{ padding:'3px 9px', borderRadius:100, fontSize:11, fontWeight:600, background:(SC[o.stage]||'#9CA3AF')+'18', color:SC[o.stage]||'#9CA3AF' }}>{o.stage}</span>
                    </td>
                    <td style={{ padding:'10px 8px', fontWeight:600, color:'#374151' }}>{o.value}</td>
                    <td style={{ padding:'10px 8px', color:'#6B7280', fontSize:12 }}>{o.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick links */}
        <div style={{ display:'flex', gap:12, marginTop:14 }}>
          {[
            { label:'Open Pipeline Kanban', path:'/mobility/pipeline/kanban', color:ACCENT },
            { label:'View All Accounts',    path:'/mobility/accounts',         color:'#6B7280' },
          ].map(l => (
            <Link key={l.label} to={l.path}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 18px', background:'white', border:'1px solid #EDE8F3', borderRadius:8, fontSize:13, fontWeight:500, color:l.color, textDecoration:'none' }}>
              {l.label} <ChevronRight size={13} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
