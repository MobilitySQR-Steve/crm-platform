import { useState } from 'react';
import { Search, Filter, Plus, MoreHorizontal } from 'lucide-react';

const ACCENT = '#8D3B9D';

const ACCOUNTS = [
  { id:'a1', name:'Tata Consultancy Services', industry:'IT Services',       country:'India', contacts:4, opps:2, value:'$130k', owner:'Steve W.'  },
  { id:'a2', name:'HDFC Bank Ltd.',            industry:'Financial Services', country:'India', contacts:3, opps:1, value:'$32k',  owner:'Maulshree' },
  { id:'a3', name:'Infosys Limited',           industry:'IT Services',       country:'India', contacts:5, opps:1, value:'$85k',  owner:'Steve W.'  },
  { id:'a4', name:'Wipro Technologies',        industry:'IT Services',       country:'India', contacts:3, opps:1, value:'$180k', owner:'Steve W.'  },
  { id:'a5', name:'Mahindra Group',            industry:'Conglomerate',       country:'India', contacts:2, opps:1, value:'$98k',  owner:'Steve W.'  },
  { id:'a6', name:'Asian Paints',              industry:'Manufacturing',      country:'India', contacts:2, opps:1, value:'$42k',  owner:'Maulshree' },
  { id:'a7', name:'Axis Bank',                 industry:'Financial Services', country:'India', contacts:3, opps:1, value:'$38k',  owner:'Maulshree' },
  { id:'a8', name:'Bajaj Auto',                industry:'Manufacturing',      country:'India', contacts:2, opps:1, value:'$62k',  owner:'Steve W.'  },
  { id:'a9', name:'Reliance Industries',       industry:'Energy',             country:'India', contacts:2, opps:1, value:'$120k', owner:'Steve W.'  },
  { id:'a10',name:'ICICI Bank',                industry:'Financial Services', country:'India', contacts:2, opps:1, value:'$200k', owner:'Steve W.'  },
];

const inits = (n) => n.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();

export default function AccountList() {
  const [search, setSearch] = useState('');

  const filtered = ACCOUNTS.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.industry.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ height:'100%', overflowY:'auto', background:'#F0EBF8' }}>
      <div style={{ padding:'22px 28px 40px' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:700, color:'#0F0A1E', margin:0 }}>Accounts</h1>
            <div style={{ fontSize:12, color:'#9CA3AF', marginTop:3 }}>MobilitySQR · {ACCOUNTS.length} accounts</div>
          </div>
          <button style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', background:ACCENT, color:'white', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
            <Plus size={14} /> New Account
          </button>
        </div>

        {/* Filter bar */}
        <div style={{ display:'flex', gap:10, marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'white', border:'1px solid #EDE8F3', borderRadius:8, padding:'8px 14px', flex:1 }}>
            <Search size={13} color="#9CA3AF" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by account or industry..."
              style={{ background:'none', border:'none', outline:'none', fontSize:13, color:'#374151', width:'100%' }} />
          </div>
          <button style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'white', border:'1px solid #EDE8F3', borderRadius:8, fontSize:13, color:'#6B7280', cursor:'pointer' }}>
            <Filter size={13} /> Filter
          </button>
        </div>

        {/* Table */}
        <div style={{ background:'white', borderRadius:12, border:'1px solid #EDE8F3', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid #EDE8F3' }}>
                {['Account','Industry','Contacts','Open Opps','Value','Owner',''].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'11px 16px', color:'#9CA3AF', fontWeight:500, fontSize:11, letterSpacing:0.5, textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} style={{ borderTop:'1px solid #F8F7FC', cursor:'pointer' }}>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:8, background:ACCENT+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:ACCENT, flexShrink:0 }}>
                        {inits(a.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight:600, color:'#0F0A1E' }}>{a.name}</div>
                        <div style={{ fontSize:11, color:'#9CA3AF' }}>{a.country}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px', color:'#6B7280', fontSize:12 }}>{a.industry}</td>
                  <td style={{ padding:'12px 16px', color:'#374151', fontWeight:500, textAlign:'center' }}>{a.contacts}</td>
                  <td style={{ padding:'12px 16px', textAlign:'center' }}>
                    {a.opps > 0
                      ? <span style={{ fontWeight:700, color:ACCENT }}>{a.opps}</span>
                      : <span style={{ color:'#C4C0D4' }}>—</span>}
                  </td>
                  <td style={{ padding:'12px 16px', fontWeight:600, color:'#374151' }}>{a.value}</td>
                  <td style={{ padding:'12px 16px', color:'#6B7280', fontSize:12 }}>{a.owner}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <button style={{ background:'none', border:'none', cursor:'pointer', color:'#C4C0D4', display:'flex' }}>
                      <MoreHorizontal size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding:'12px 16px', borderTop:'1px solid #EDE8F3', fontSize:12, color:'#9CA3AF' }}>
            Showing {filtered.length} of {ACCOUNTS.length} accounts
          </div>
        </div>
      </div>
    </div>
  );
}
