import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMultipleRates } from '../api/rates';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CURRENCIES = ['EUR', 'GBP', 'PKR', 'SAR', 'JPY', 'AED', 'CAD', 'AUD'];
const BASE_OPTIONS = ['USD', 'EUR', 'GBP', 'PKR'];
const COLORS = ['#622B14', '#995F2F', '#978F66', '#C8A87A', '#622B14', '#995F2F', '#978F66', '#C8A87A'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'var(--deep)', color: 'var(--cream)',
        padding: '10px 16px', borderRadius: '2px',
        fontFamily: 'Playfair Display, serif', fontSize: '13px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
      }}>
        <div style={{ fontWeight: '700', marginBottom: '4px' }}>{label}</div>
        <div style={{ color: 'var(--sage)' }}>Rate: <strong style={{ color: 'var(--cream)' }}>{payload[0].value?.toFixed(4)}</strong></div>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user }  = useAuth();
  const [rates,   setRates]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [base,    setBase]    = useState('USD');

  useEffect(() => { fetchRates(); }, [base]);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await getMultipleRates([base]);
      setRates(res.data.results?.[0]?.rates || {});
    } catch { setRates({}); }
    finally   { setLoading(false); }
  };

  const chartData = CURRENCIES.map(c => ({ name: c, rate: rates?.[c] || 0 }));

  const statCards = [
    { label: 'Base Currency', value: base,               icon: '◈', color: 'var(--deep)' },
    { label: 'Rates Loaded',  value: Object.keys(rates || {}).length, icon: '◎', color: 'var(--warm)' },
    { label: 'Your Role',     value: user?.role,          icon: '⚑', color: 'var(--sage)' },
    { label: 'Status',        value: 'Live',              icon: '●', color: 'var(--success)' },
  ];

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">

        {/* Header */}
        <div className="animate-fadeUp" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{ width: '4px', height: '36px', background: 'linear-gradient(to bottom, var(--deep), var(--warm))', borderRadius: '2px' }} />
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '900' }}>
                Welcome back, {user?.username}
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: '15px', marginTop: '2px' }}>
                Live exchange rates dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="animate-fadeUp delay-1" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px', marginBottom: '28px'
        }}>
          {statCards.map((s, i) => (
            <div key={s.label} className="card" style={{
              padding: '20px 22px',
              animation: `fadeUp 0.5s ease ${i * 0.07}s both`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Playfair Display,serif', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'Playfair Display,serif', color: s.color }}>
                    {s.value}
                  </div>
                </div>
                <div style={{
                  width: '40px', height: '40px',
                  background: `${s.color}18`,
                  border: `1px solid ${s.color}30`,
                  borderRadius: '2px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', color: s.color
                }}>{s.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Base currency selector */}
        <div className="animate-fadeUp delay-2" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Playfair Display,serif', fontWeight: '600', color: 'var(--deep)', fontSize: '14px' }}>
            Base Currency:
          </span>
          {BASE_OPTIONS.map(c => (
            <button key={c} onClick={() => setBase(c)} style={{
              padding: '7px 20px', borderRadius: '2px', cursor: 'pointer',
              background: base === c ? 'var(--deep)' : 'var(--cream2)',
              color:      base === c ? 'var(--cream)' : 'var(--muted)',
              border:     `1.5px solid ${base === c ? 'var(--deep)' : 'var(--border)'}`,
              fontFamily: 'Playfair Display,serif', fontSize: '13px', fontWeight: '600',
              transition: 'all 0.2s', letterSpacing: '0.3px'
            }}>{c}</button>
          ))}
          <button onClick={fetchRates} style={{
            padding: '7px 16px', borderRadius: '2px', cursor: 'pointer',
            background: 'var(--warm)', color: 'var(--cream)',
            border: 'none', fontFamily: 'Playfair Display,serif',
            fontSize: '13px', fontWeight: '600', transition: 'all 0.2s', marginLeft: 'auto'
          }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--deep)'}
            onMouseOut={e =>  e.currentTarget.style.background = 'var(--warm)'}
          >↻ Refresh</button>
        </div>

        {loading ? <LoadingSpinner label="Fetching live rates..." /> : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            {/* Rate cards grid */}
            <div className="animate-fadeUp delay-3" style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px'
            }}>
              {CURRENCIES.map((c, i) => (
                <div key={c} className="card" style={{
                  padding: '18px 20px',
                  borderLeft: `3px solid ${COLORS[i]}`,
                  animation: `fadeUp 0.45s ease ${i * 0.05}s both`
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'Playfair Display,serif', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    {base} → {c}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'Playfair Display,serif', color: 'var(--deep)' }}>
                    {rates?.[c]?.toFixed(4) || '—'}
                  </div>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div className="card animate-fadeUp delay-4" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '20px', color: 'var(--deep)' }}>
                Exchange Rates from {base}
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} barSize={28}>
                  <XAxis dataKey="name" tick={{ fontFamily: 'Playfair Display, serif', fontSize: 12, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontFamily: 'Crimson Pro, serif', fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="rate" radius={[2, 2, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
