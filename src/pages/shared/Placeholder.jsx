import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { MODULES } from '../../constants/brand';

export default function Placeholder({ title }) {
  const path     = useLocation().pathname;
  const mod      = path.startsWith('/mobility') ? MODULES.mobility : MODULES.taxsqr;
  const accent   = mod.color;

  return (
    <div style={{ height:'100%', overflowY:'auto', background:'#EFECF7' }}>
      <div style={{ padding:32, maxWidth:800, margin:'0 auto' }}>
        <div style={{ background:'white', borderRadius:14, border:'1px solid #ECEAF3', padding:'64px 40px', textAlign:'center', marginTop:32 }}>
          <div style={{ width:56, height:56, borderRadius:16, background:accent+'15', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
            <Construction size={24} color={accent} />
          </div>
          <h2 style={{ fontSize:20, fontWeight:700, color:'#374151', marginBottom:8 }}>{title}</h2>
          <p style={{ fontSize:16, color:'#9CA3AF', maxWidth:340, margin:'0 auto', lineHeight:1.6 }}>
            This screen is on the roadmap. Wire up your API and drop the component in{' '}
            <code style={{ background:'#F3F4F6', padding:'1px 6px', borderRadius:4, fontSize:14 }}>src/pages</code>{' '}
            to activate it.
          </p>
          <div style={{ marginTop:24, display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
            {['Phase 1 — Foundation', 'Phase 2 — Core CRM', 'Phase 3 — Delivery'].map(p => (
              <span key={p} style={{ background:accent+'10', color:accent, fontSize:14, fontWeight:600, padding:'4px 12px', borderRadius:100, border:`1px solid ${accent}25` }}>{p}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
