import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, MoreHorizontal } from 'lucide-react';

const ACCENT = '#38AC87';

const CLIENTS = [
  { id:'c1',  name:'Rajesh Mehra',     email:'rajesh.mehra@gmail.com',    country:'US', cases:3, status:'Active',   owner:'Priya S.'  },
  { id:'c2',  name:'Sarah Johnson',    email:'sarah.j@gmail.com',         country:'US', cases:1, status:'Active',   owner:'Amit K.'   },
  { id:'c3',  name:'David Kim',        email:'d.kim@corp.com',            country:'US', cases:2, status:'Active',   owner:'Priya S.'  },
  { id:'c4',  name:'Maria Santos',     email:'m.santos@yahoo.com',        country:'UK', cases:1, status:'Active',   owner:'Maulshree' },
  { id:'c5',  name:'James Chen',       email:'james.chen@email.com',      country:'US', cases:4, status:'Active',   owner:'Amit K.'   },
  { id:'c6',  name:'Fatima Al-Hassan', email:'fatima.h@corp.com',         country:'US', cases:1, status:'Active',   owner:'Priya S.'  },
  { id:'c7',  name:'Robert Chang',     email:'r.chang@email.com',         country:'US', cases:2, status:'Active',   owner:'Maulshree' },
  { id:'c8',  name:'Priya Kapoor',     email:'priya.k@corp.in',           country:'US', cases:1, status:'Inactive', owner:'Priya S.'  },
  { id:'c9',  name:'Wei Zhang',        email:'w.zhang@corp.com',          country:'US', cases:1, status:'Active',   owner:'Amit K.'   },
  { id:'c10', name:'Sophie Laurent',   email:'s.laurent@outlook.com',     country:'UK', cases:1, status:'Active',   owner:'Maulshree' },
];

const inits = (n) => n.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

export default function ClientList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = CLIENTS.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ height:'100%', overflowY:'auto', background:'#EFECF7' }}>
      <div style={{ padding:'22px 28px 40px' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:700, color:'#0F0A1E', margin:0 }}>Clients</h1>
            <div style={{ fontSize:14, color:'#9CA3AF', marginTop:3 }}>TaxSQR · {CLIENTS.length} total</div>
          </div>
          <button style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', background:ACCENT, color:'white', border:'none', borderRadius:8, fontSize:15, fontWeight:600, cursor:'pointer' }}>
            <Plus size={14} /> New Client
          </button>
        </div>

        {/* Filter bar */}
        <div style={{ display:'flex', gap:10, marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'white', border:'1px solid #ECEAF3', borderRadius:8, padding:'8px 14px', flex:1 }}>
            <Search size={13} color="#9CA3AF" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
              style={{ background:'none', border:'none', outline:'none', fontSize:15, color:'#374151', width:'100%' }} />
          </div>
          <button style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'white', border:'1px solid #ECEAF3', borderRadius:8, fontSize:15, color:'#6B7280', cursor:'pointer' }}>
            <Filter size={13} /> Filter
          </button>
        </div>

        {/* Table */}
        <div style={{ background:'white', borderRadius:12, border:'1px solid #ECEAF3', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:15 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid #ECEAF3' }}>
                {['Client','Email','Country','Cases','Status','Owner',''].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'11px 16px', color:'#9CA3AF', fontWeight:500, fontSize:13, letterSpacing:0.5, textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} onClick={() => navigate(`/taxsqr/clients/${c.id}`)}
                  style={{ borderTop:'1px solid #F8F7FC', cursor:'pointer' }}>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:ACCENT+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:ACCENT, flexShrink:0 }}>
                        {inits(c.name)}
                      </div>
                      <span style={{ fontWeight:500, color:'#0F0A1E' }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px', color:'#6B7280' }}>{c.email}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ background:'#F3F4F6', color:'#374151', fontSize:13, fontWeight:600, padding:'2px 8px', borderRadius:5 }}>{c.country}</span>
                  </td>
                  <td style={{ padding:'12px 16px', color:'#374151', fontWeight:500 }}>{c.cases}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ padding:'3px 9px', borderRadius:100, fontSize:13, fontWeight:600, background:c.status==='Active'?'#38AC8718':'#6B728018', color:c.status==='Active'?'#38AC87':'#6B7280' }}>{c.status}</span>
                  </td>
                  <td style={{ padding:'12px 16px', color:'#6B7280', fontSize:14 }}>{c.owner}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <button onClick={e => e.stopPropagation()} style={{ background:'none', border:'none', cursor:'pointer', color:'#C4C0D4', display:'flex' }}>
                      <MoreHorizontal size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding:'12px 16px', borderTop:'1px solid #ECEAF3', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:14, color:'#9CA3AF' }}>
            <span>Showing {filtered.length} of {CLIENTS.length} clients</span>
            <Link to="/taxsqr/clients/c1" style={{ color:ACCENT, fontWeight:500, fontSize:14, textDecoration:'none' }}>
              View Rajesh Mehra (demo profile) →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
