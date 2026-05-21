import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin, isPremium } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: '◈' },
    { to: '/convert',   label: 'Convert',   icon: '⇄' },
    { to: '/history',   label: 'History',   icon: '◎' },
    ...(isPremium() ? [{ to: '/alerts', label: 'Alerts', icon: '🔔' }] : []),
    ...(isAdmin() ? [{ to: '/admin', label: 'Admin', icon: '⚑' }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav style={{
        background: 'var(--deep)',
        borderBottom: '3px solid var(--warm)',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 4px 20px rgba(98,43,20,0.35)'
      }}>
        {/* Decorative top stripe */}
        <div style={{
          height: '3px',
          background: 'linear-gradient(90deg, var(--warm), var(--sage), var(--cream), var(--sage), var(--warm))',
          backgroundSize: '200% 100%',
          animation: 'gradientShift 4s ease infinite'
        }} />

        <div style={{
          maxWidth: '1140px', margin: '0 auto',
          padding: '0 24px', height: '64px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          {/* Logo */}
          <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px',
              background: 'var(--warm)',
              borderRadius: '2px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              transition: 'transform 0.2s',
              animation: 'float 3s ease-in-out infinite'
            }}>💱</div>
            <div>
              <div style={{
                fontFamily: 'Playfair Display, serif',
                fontWeight: '700', fontSize: '17px',
                color: 'var(--cream)', letterSpacing: '0.5px'
              }}>CurrencyTracker</div>
              <div style={{ fontSize: '10px', color: 'var(--sage)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                Exchange Platform
              </div>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {links.map(link => (
              <Link key={link.to} to={link.to} style={{
                textDecoration: 'none',
                padding: '8px 18px',
                fontFamily: 'Playfair Display, serif',
                fontSize: '14px',
                fontWeight: isActive(link.to) ? '700' : '500',
                color: isActive(link.to) ? 'var(--cream)' : 'rgba(228,214,169,0.7)',
                background: isActive(link.to) ? 'rgba(153,95,47,0.35)' : 'transparent',
                borderBottom: isActive(link.to) ? '2px solid var(--cream)' : '2px solid transparent',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '6px',
                letterSpacing: '0.3px'
              }}
                onMouseOver={e => { if (!isActive(link.to)) e.currentTarget.style.color = 'var(--cream)'; }}
                onMouseOut={e =>  { if (!isActive(link.to)) e.currentTarget.style.color = 'rgba(228,214,169,0.7)'; }}
              >
                <span style={{ fontSize: '12px', opacity: 0.8 }}>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* User info + logout */}
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(228,214,169,0.12)',
              border: '1px solid rgba(228,214,169,0.25)',
              borderRadius: '2px', padding: '6px 14px',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-end'
            }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--cream)', fontFamily: 'Playfair Display, serif' }}>
                {user?.username}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--sage)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                {user?.role}
              </span>
            </div>
            <button onClick={handleLogout} style={{
              background: 'transparent',
              border: '1.5px solid rgba(228,214,169,0.4)',
              color: 'var(--cream2)',
              padding: '7px 16px',
              fontFamily: 'Playfair Display, serif',
              fontSize: '13px',
              cursor: 'pointer',
              borderRadius: '2px',
              transition: 'all 0.2s',
              letterSpacing: '0.3px'
            }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(228,214,169,0.15)'; e.currentTarget.style.borderColor = 'var(--cream)'; }}
              onMouseOut={e =>  { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(228,214,169,0.4)'; }}
            >
              Sign Out
            </button>
          </div>

          {/* Mobile hamburger */}
          <button className="hide-desktop" onClick={() => setOpen(!open)} style={{
            background: 'none', border: 'none', color: 'var(--cream)',
            fontSize: '22px', cursor: 'pointer', display: 'none'
          }}
            // show only on mobile via CSS override below
          >{open ? '✕' : '☰'}</button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div style={{
            background: 'var(--dark)',
            borderTop: '1px solid rgba(228,214,169,0.15)',
            padding: '12px 24px 20px',
            animation: 'fadeUp 0.25s ease'
          }}>
            {links.map(link => (
              <Link key={link.to} to={link.to}
                onClick={() => setOpen(false)}
                style={{
                  display: 'block', padding: '12px 0',
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '16px', color: isActive(link.to) ? 'var(--cream)' : 'rgba(228,214,169,0.7)',
                  textDecoration: 'none', borderBottom: '1px solid rgba(228,214,169,0.1)'
                }}>
                {link.icon} {link.label}
              </Link>
            ))}
            <button onClick={handleLogout} style={{
              marginTop: '16px', background: 'var(--warm)',
              color: 'var(--cream)', border: 'none',
              padding: '10px 24px', borderRadius: '2px',
              fontFamily: 'Playfair Display, serif', fontSize: '14px',
              cursor: 'pointer', width: '100%'
            }}>Sign Out</button>
          </div>
        )}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .hide-desktop { display: block !important; }
        }
      `}</style>
    </>
  );
}
