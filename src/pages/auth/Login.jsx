import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ApiError } from '../../lib/api';

const ACCENT = '#2563EB'; // mobility accent

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login, isAuthenticated, isLoggingIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dest = location.state?.from?.pathname || '/mobility/dashboard';

  if (isAuthenticated) return <Navigate to={dest} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password });
      navigate(dest, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid email or password.');
      } else if (err instanceof ApiError && err.status === 400) {
        setError('Please enter a valid email and password.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#EFECF7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'DM Sans, system-ui, -apple-system, sans-serif',
      padding: 20,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        border: '1px solid #ECEAF3',
        padding: '36px 40px 32px',
        width: '100%',
        maxWidth: 380,
        boxShadow: '0 4px 20px rgba(13,7,32,0.06)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: ACCENT,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: 16,
          }}>M</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0F0A1E', lineHeight: 1.2 }}>CRM Platform</div>
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>MobilitySQR</div>
          </div>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F0A1E', margin: 0, marginBottom: 6 }}>Sign in</h1>
        <p style={{ fontSize: 15, color: '#6B7280', margin: 0, marginBottom: 22 }}>
          Welcome back. Enter your credentials below.
        </p>

        <form onSubmit={onSubmit} noValidate>
          <Field label="Email"    type="email"    value={email}    onChange={setEmail}    autoFocus disabled={isLoggingIn} autoComplete="email" />
          <Field label="Password" type="password" value={password} onChange={setPassword}           disabled={isLoggingIn} autoComplete="current-password" />

          {error && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#B91C1C',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 14,
              marginBottom: 14,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn || !email || !password}
            style={{
              width: '100%',
              padding: '11px 14px',
              background: ACCENT,
              color: 'white',
              border: 'none',
              borderRadius: 9,
              fontSize: 16,
              fontWeight: 600,
              cursor: isLoggingIn || !email || !password ? 'not-allowed' : 'pointer',
              opacity: isLoggingIn || !email || !password ? 0.6 : 1,
              transition: 'opacity 0.15s',
              fontFamily: 'inherit',
            }}>
            {isLoggingIn ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, autoFocus, disabled, autoComplete }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        disabled={disabled}
        autoComplete={autoComplete}
        style={{
          width: '100%',
          padding: '10px 12px',
          fontSize: 16,
          border: '1px solid #ECEAF3',
          borderRadius: 8,
          background: disabled ? '#F9F8FC' : 'white',
          color: '#0F0A1E',
          outline: 'none',
          transition: 'border-color 0.15s',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => { e.target.style.borderColor = ACCENT; }}
        onBlur={(e) => { e.target.style.borderColor = '#ECEAF3'; }}
      />
    </div>
  );
}
