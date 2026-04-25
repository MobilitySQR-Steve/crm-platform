import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, ChevronDown,
  Search, Bell, Settings, LogOut,
} from 'lucide-react';
import { MODULES, BREADCRUMB_LABELS } from '../../constants/brand';
import { useAuth } from '../../auth/AuthContext';

const SB     = '#0D0720';
const SBBORD = 'rgba(255,255,255,0.07)';

// ── Breadcrumb util ───────────────────────────────────────────
function useBreadcrumb(pathname) {
  return pathname
    .split('/')
    .filter(Boolean)
    .map(seg => BREADCRUMB_LABELS[seg] || seg);
}

// ── Sidebar ───────────────────────────────────────────────────
function Sidebar({ moduleKey, collapsed, setCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoggingOut } = useAuth();
  const [expanded, setExpanded] = useState({});

  const mod    = MODULES[moduleKey];
  const accent = mod.color;
  const path   = location.pathname;

  // Display values: real user when authed, fallback placeholder otherwise.
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Steve W.';
  const displayRole = user
    ? user.role.charAt(0) + user.role.slice(1).toLowerCase()
    : 'Admin';
  const initials = user
    ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
    : 'SW';

  const handleLogout = async () => {
    try { await logout(); }
    catch { /* swallow — UI will still update via cache invalidation */ }
    navigate('/login', { replace: true });
  };

  const switchModule = (key) => {
    navigate(MODULES[key].nav[0].path);
    setExpanded({});
  };

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const isActive = (item) =>
    item.sub
      ? item.sub.some(s => path.startsWith(s.path))
      : path === item.path || path.startsWith(item.path + '/');

  return (
    <div style={{
      width: collapsed ? 64 : 240,
      background: SB,
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
      flexShrink: 0, overflow: 'hidden', zIndex: 20,
    }}>
      {/* Logo */}
      <div style={{ height:60, display:'flex', alignItems:'center', padding: collapsed ? '0 17px' : '0 14px 0 17px', justifyContent: collapsed ? 'center' : 'space-between', borderBottom:`1px solid ${SBBORD}`, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:accent, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, color:'white', flexShrink:0, transition:'background 0.3s' }}>M</div>
          {!collapsed && <span style={{ color:'white', fontWeight:700, fontSize:13.5, whiteSpace:'nowrap' }}>CRM Platform</span>}
        </div>
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.2)', cursor:'pointer', padding:4, borderRadius:5, display:'flex' }}>
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* Module switcher */}
      <div style={{ padding: collapsed ? '10px' : '10px 11px', borderBottom:`1px solid ${SBBORD}`, flexShrink:0 }}>
        {!collapsed ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
            {Object.values(MODULES).map(m => (
              <button key={m.key} onClick={() => switchModule(m.key)}
                style={{ padding:'8px 4px', borderRadius:8, border:'none', cursor:'pointer', background: moduleKey===m.key ? m.colorBg : 'transparent', outline: moduleKey===m.key ? `1px solid ${m.color}35` : 'none', transition:'all 0.15s' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:3 }}>
                  <m.Icon size={14} color={moduleKey===m.key ? m.color : 'rgba(255,255,255,0.28)'} />
                </div>
                <div style={{ fontSize:10.5, fontWeight: moduleKey===m.key ? 700 : 400, color: moduleKey===m.key ? m.color : 'rgba(255,255,255,0.28)', textAlign:'center', lineHeight:1.2 }}>{m.label}</div>
                <div style={{ fontSize:9, color: moduleKey===m.key ? m.color : 'rgba(255,255,255,0.18)', textAlign:'center', opacity:0.75, marginTop:1 }}>{m.sublabel}</div>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'center' }}>
            {Object.values(MODULES).map(m => (
              <button key={m.key} onClick={() => switchModule(m.key)} title={m.label}
                style={{ width:42, height:32, borderRadius:8, border:'none', cursor:'pointer', background: moduleKey===m.key ? m.colorBg : 'transparent', outline: moduleKey===m.key ? `1px solid ${m.color}35` : 'none', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <m.Icon size={14} color={moduleKey===m.key ? m.color : 'rgba(255,255,255,0.28)'} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'10px 9px' }}>
        {mod.nav.map(item => {
          const active = isActive(item);
          const open   = expanded[item.id];
          return (
            <div key={item.id} style={{ marginBottom:1 }}>
              <button
                onClick={() => item.sub ? toggle(item.id) : navigate(item.path)}
                title={collapsed ? item.label : undefined}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding: collapsed ? '9px 0' : '8px 10px', justifyContent: collapsed ? 'center' : 'flex-start', borderRadius:7, border:'none', cursor:'pointer', background: active ? accent+'1C' : 'transparent', borderLeft: !collapsed ? `2px solid ${active ? accent : 'transparent'}` : 'none', color: active ? accent : 'rgba(255,255,255,0.42)', transition:'all 0.12s' }}>
                <item.Icon size={15} style={{ flexShrink:0 }} />
                {!collapsed && (
                  <>
                    <span style={{ fontSize:13, fontWeight: active ? 600 : 400, flex:1, textAlign:'left' }}>{item.label}</span>
                    {item.badge  && <span style={{ background:accent, color:'white', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:100 }}>{item.badge}</span>}
                    {item.count  && <span style={{ fontSize:11, color:'rgba(255,255,255,0.18)' }}>{item.count}</span>}
                    {item.sub    && <ChevronDown size={11} color="rgba(255,255,255,0.25)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.2s', flexShrink:0 }} />}
                  </>
                )}
              </button>
              {item.sub && open && !collapsed && (
                <div style={{ paddingLeft:14, marginTop:2, marginBottom:2 }}>
                  {item.sub.map(s => (
                    <Link key={s.id} to={s.path}
                      style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:6, marginBottom:1, background: path===s.path ? accent+'15' : 'transparent', color: path===s.path ? accent : 'rgba(255,255,255,0.28)', fontSize:12, fontWeight: path===s.path ? 600 : 400 }}>
                      <div style={{ width:4, height:4, borderRadius:'50%', background:'currentColor', opacity:0.55, flexShrink:0 }} />
                      {s.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop:`1px solid ${SBBORD}`, padding: collapsed ? '12px 11px' : '12px 13px', flexShrink:0 }}>
        {collapsed ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
            <button onClick={() => setCollapsed(false)} title="Expand sidebar"
              style={{ background:'none', border:'none', color:'rgba(255,255,255,0.22)', cursor:'pointer', display:'flex', padding:4 }}>
              <ChevronRight size={14} />
            </button>
            <div title={displayName}
              style={{ width:30, height:30, borderRadius:'50%', background:accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'white', transition:'background 0.3s' }}>
              {initials}
            </div>
            {user && (
              <button onClick={handleLogout} disabled={isLoggingOut} title="Sign out"
                style={{ background:'none', border:'none', color:'rgba(255,255,255,0.42)', cursor:'pointer', display:'flex', padding:4, opacity: isLoggingOut ? 0.4 : 1 }}>
                <LogOut size={14} />
              </button>
            )}
          </div>
        ) : (
          <>
            {user ? (
              <button onClick={handleLogout} disabled={isLoggingOut}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 8px', borderRadius:7, border:'none', background:'transparent', color:'rgba(255,255,255,0.42)', marginBottom:2, fontSize:13, cursor: isLoggingOut ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: isLoggingOut ? 0.5 : 1 }}>
                <LogOut size={14} /> {isLoggingOut ? 'Signing out…' : 'Sign out'}
              </button>
            ) : (
              <button
                style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 8px', borderRadius:7, border:'none', background:'transparent', color:'rgba(255,255,255,0.28)', marginBottom:2, fontSize:13, cursor:'pointer', fontFamily: 'inherit' }}>
                <Settings size={14} /> Settings
              </button>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:9, padding:'7px 8px' }}>
              <div style={{ width:30, height:30, borderRadius:'50%', background:accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'white', flexShrink:0, transition:'background 0.3s' }}>{initials}</div>
              <div style={{ minWidth:0, flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.82)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{displayName}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)' }}>{displayRole}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Top bar ───────────────────────────────────────────────────
function TopBar({ breadcrumb, accent }) {
  const { user } = useAuth();
  const initials = user
    ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
    : 'SW';
  return (
    <div style={{ height:56, background:'white', borderBottom:'1px solid #ECEAF3', padding:'0 22px', display:'flex', alignItems:'center', gap:12, flexShrink:0, position:'relative', zIndex:10 }}>
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${accent}70,transparent 40%)`, transition:'background 0.3s' }} />
      {/* Breadcrumb */}
      <div style={{ display:'flex', alignItems:'center', gap:5, flex:1, fontSize:13, minWidth:0 }}>
        {breadcrumb.map((crumb, i) => (
          <span key={i} style={{ display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap' }}>
            {i > 0 && <ChevronRight size={12} color="#D1D5DB" style={{ flexShrink:0 }} />}
            <span style={{ color: i===0 ? accent : i===breadcrumb.length-1 ? '#374151' : '#9CA3AF', fontWeight: i===0 || i===breadcrumb.length-1 ? 600 : 400, transition:'color 0.3s' }}>{crumb}</span>
          </span>
        ))}
      </div>
      {/* Search */}
      <div style={{ display:'flex', alignItems:'center', gap:7, background:'#F7F5FC', border:'1px solid #ECEAF3', borderRadius:8, padding:'7px 12px', minWidth:180, cursor:'pointer' }}>
        <Search size={13} color="#9CA3AF" />
        <span style={{ fontSize:13, color:'#C4C0D4', flex:1 }}>Search...</span>
        <kbd style={{ fontSize:10, color:'#C4C0D4', background:'white', border:'1px solid #ECEAF3', borderRadius:4, padding:'1px 5px' }}>⌘K</kbd>
      </div>
      {/* Bell */}
      <button style={{ position:'relative', background:'none', border:'none', cursor:'pointer', padding:7, borderRadius:7, display:'flex', color:'#9CA3AF' }}>
        <Bell size={17} />
        <span style={{ position:'absolute', top:5, right:5, width:7, height:7, background:'#EF4444', borderRadius:'50%', border:'1.5px solid white' }} />
      </button>
      {/* User avatar */}
      <div style={{ width:32, height:32, borderRadius:'50%', background:accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'white', flexShrink:0, transition:'background 0.3s' }}>{initials}</div>
    </div>
  );
}

// ── Shell ─────────────────────────────────────────────────────
export default function AppShell() {
  const location  = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const pathname  = location.pathname;
  const moduleKey = pathname.startsWith('/mobility') ? 'mobility' : 'taxsqr';
  const mod       = MODULES[moduleKey];
  const accent    = mod.color;
  const crumbs    = useBreadcrumb(pathname);

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <Sidebar moduleKey={moduleKey} collapsed={collapsed} setCollapsed={setCollapsed} />

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        <TopBar breadcrumb={crumbs} accent={accent} />

        {/*
          Content area: overflow:hidden + minHeight:0 so that:
          — Kanban pages fill 100% and control their own overflow
          — Normal pages wrap in a scrollable div internally
        */}
        <div style={{ flex:1, overflow:'hidden', minHeight:0 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
