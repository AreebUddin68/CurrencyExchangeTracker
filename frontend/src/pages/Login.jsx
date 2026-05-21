import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form,    setForm]    = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser(form);
      login(res.data.token, { username: res.data.username, role: res.data.role });
      toast.success(`Welcome back, ${res.data.username}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--deep)',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background orbs */}
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: `${180 + i * 60}px`,
          height: `${180 + i * 60}px`,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${
            ['rgba(153,95,47,0.25)','rgba(151,143,102,0.15)','rgba(228,214,169,0.08)','rgba(153,95,47,0.12)','rgba(151,143,102,0.1)'][i]
          }, transparent)`,
          top:  `${[10, 60, 20, 70, 40][i]}%`,
          left: `${[10, 70, 40, 20, 60][i]}%`,
          transform: 'translate(-50%,-50%)',
          animation: `float ${3 + i * 0.7}s ease-in-out infinite`,
          animationDelay: `${i * 0.4}s`,
          pointerEvents: 'none'
        }} />
      ))}

      {/* Decorative left panel */}
      <div className="hide-mobile" style={{
        width: '45%',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'flex-start',
        padding: '60px',
        position: 'relative', zIndex: 1
      }}>
        <div className="animate-slideRight" style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'float 3s ease-in-out infinite' }}>💱</div>
          <h1 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '42px', fontWeight: '900',
            color: 'var(--cream)', lineHeight: '1.2', marginBottom: '16px'
          }}>
            Currency<br />Exchange<br />
            <span style={{ color: 'var(--sage)' }}>Tracker</span>
          </h1>
          <p style={{ color: 'rgba(228,214,169,0.65)', fontSize: '16px', lineHeight: '1.7', maxWidth: '320px' }}>
            Real-time currency conversion powered by microservices with distributed tracing and AES-256 encryption.
          </p>
        </div>

        {/* Feature pills */}
        <div className="animate-fadeUp delay-2" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { icon: '⚡', text: 'Parallel conversions with Task.WhenAll' },
            { icon: '🔐', text: 'JWT Authentication + RBAC roles' },
            { icon: '🔒', text: 'AES-256 encrypted history' },
            { icon: '🔍', text: 'Distributed request tracing' },
          ].map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 16px',
              background: 'rgba(228,214,169,0.07)',
              border: '1px solid rgba(228,214,169,0.15)',
              borderRadius: '2px',
              animation: `fadeUp 0.5s ease ${0.3 + i * 0.08}s both`
            }}>
              <span style={{ fontSize: '16px' }}>{f.icon}</span>
              <span style={{ fontSize: '14px', color: 'rgba(228,214,169,0.8)', fontFamily: 'Crimson Pro, serif' }}>
                {f.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Login form */}
      <div style={{
        flex: 1, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px', position: 'relative', zIndex: 1
      }}>
        <div className="animate-scaleIn" style={{
          background: 'var(--cream3)',
          borderRadius: '4px',
          padding: '48px 44px',
          width: '100%', maxWidth: '420px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.2)',
          border: '1px solid var(--border)'
        }}>
          {/* Form header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: '4px', height: '32px',
                background: 'linear-gradient(to bottom, var(--deep), var(--warm))',
                borderRadius: '2px'
              }} />
              <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--deep)' }}>
                Sign In
              </h2>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '15px', paddingLeft: '14px' }}>
              Enter your credentials to continue
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {[
              { label: 'Username', key: 'username', type: 'text',     placeholder: 'Enter username' },
              { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
            ].map((f, i) => (
              <div key={f.key} className={`animate-fadeUp delay-${i + 2}`} style={{ marginBottom: '20px' }}>
                <label className="label">{f.label}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={f.type}
                    value={form[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    required
                    onFocus={() => setFocused(f.key)}
                    onBlur={() => setFocused('')}
                    style={{
                      boxShadow: focused === f.key ? '0 0 0 3px rgba(153,95,47,0.15)' : 'none'
                    }}
                  />
                  {/* Animated focus indicator */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0,
                    height: '2px', borderRadius: '0 0 2px 2px',
                    background: 'linear-gradient(90deg, var(--deep), var(--warm))',
                    width: focused === f.key ? '100%' : '0%',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            ))}

            <div className="divider animate-fadeIn delay-3">
              <span>or continue</span>
            </div>

            <button
              type="submit"
              className="btn-primary animate-fadeUp delay-4"
              disabled={loading}
              style={{ width: '100%', padding: '13px', fontSize: '16px', marginTop: '8px' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <div style={{
                    width: '16px', height: '16px',
                    border: '2px solid rgba(228,214,169,0.3)',
                    borderTop: '2px solid var(--cream)',
                    borderRadius: '50%', animation: 'spin 0.7s linear infinite'
                  }} />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="animate-fadeIn delay-5" style={{
            textAlign: 'center', marginTop: '24px',
            fontSize: '15px', color: 'var(--muted)'
          }}>
            No account?{' '}
            <Link to="/register" style={{
              color: 'var(--warm)', fontWeight: '600',
              textDecoration: 'none', borderBottom: '1px solid var(--warm)'
            }}>
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
