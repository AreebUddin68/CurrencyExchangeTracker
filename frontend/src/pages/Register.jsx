import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../api/auth';
import toast from 'react-hot-toast';

export default function Register() {
  const [form,    setForm]    = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerUser(form);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: 'Username', key: 'username', type: 'text',     placeholder: 'Choose a username' },
    { label: 'Email',    key: 'email',    type: 'email',    placeholder: 'your@email.com' },
    { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--deep) 0%, #3D1608 50%, var(--warm) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden'
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `radial-gradient(circle at 20% 50%, rgba(153,95,47,0.2) 0%, transparent 50%),
                          radial-gradient(circle at 80% 20%, rgba(151,143,102,0.15) 0%, transparent 40%)`,
        pointerEvents: 'none'
      }} />

      <div className="animate-scaleIn" style={{
        background: 'var(--cream3)',
        borderRadius: '4px',
        padding: '44px',
        width: '100%', maxWidth: '460px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        border: '1px solid var(--border)',
        position: 'relative', zIndex: 1
      }}>
        {/* Decorative corner */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: '80px', height: '80px',
          background: 'linear-gradient(135deg, transparent 50%, rgba(153,95,47,0.12) 50%)',
          borderRadius: '0 4px 0 0'
        }} />

        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '4px', height: '32px',
              background: 'linear-gradient(to bottom, var(--deep), var(--warm))',
              borderRadius: '2px'
            }} />
            <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--deep)' }}>
              Create Account
            </h2>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '15px', paddingLeft: '14px' }}>
            Join the currency exchange platform
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {fields.map((f, i) => (
            <div key={f.key} className={`animate-fadeUp delay-${i + 1}`} style={{ marginBottom: '18px' }}>
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
                />
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

          <div className="animate-fadeUp delay-4" style={{ marginBottom: '24px' }}>
            <div style={{
              padding: '10px 12px',
              background: 'var(--cream2)',
              border: '1px solid var(--border)',
              borderLeft: '3px solid var(--warm)',
              borderRadius: '2px',
              color: 'var(--muted)',
              fontSize: '13px'
            }}>
              New accounts are created as <strong>User</strong>. Premium/Admin roles are managed securely by admins.
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary animate-fadeUp delay-5"
            disabled={loading}
            style={{ width: '100%', padding: '13px', fontSize: '16px' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <div style={{
                  width: '16px', height: '16px',
                  border: '2px solid rgba(228,214,169,0.3)',
                  borderTop: '2px solid var(--cream)',
                  borderRadius: '50%', animation: 'spin 0.7s linear infinite'
                }} />
                Creating Account...
              </span>
            ) : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '15px', color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{
            color: 'var(--warm)', fontWeight: '600',
            textDecoration: 'none', borderBottom: '1px solid var(--warm)'
          }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
