import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getMyHistory, exportMyHistoryCsv } from '../api/convert';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function History() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    getMyHistory()
      .then(res  => setHistory(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = history.filter(r =>
    r.fromCurrency?.includes(search.toUpperCase()) ||
    r.toCurrency?.includes(search.toUpperCase())
  );

  const canExport = user?.role === 'PremiumUser' || user?.role === 'Admin';

  const handleExport = async () => {
    try {
      const res = await exportMyHistoryCsv();
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `conversion-history-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">

        {/* Header */}
        <div className="animate-fadeUp" style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <div style={{ width: '4px', height: '36px', background: 'linear-gradient(to bottom, var(--deep), var(--warm))', borderRadius: '2px' }} />
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '900' }}>Conversion History</h1>
                <p style={{ color: 'var(--muted)', fontSize: '15px', marginTop: '2px' }}>
                  Records decrypted from AES-256 encrypted database
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search currency..."
                style={{ width: '220px', paddingLeft: '36px' }}
              />
              <span style={{
                position: 'absolute', left: '12px', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '14px'
              }}>🔍</span>
            </div>
            {canExport && (
              <button className="btn-primary" onClick={handleExport} style={{ padding: '10px 14px' }}>
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Encryption note */}
        <div className="animate-fadeUp delay-1" style={{
          padding: '14px 18px', marginBottom: '20px',
          background: 'rgba(98,43,20,0.06)',
          border: '1px solid rgba(98,43,20,0.15)',
          borderLeft: '3px solid var(--deep)',
          borderRadius: '2px',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <span style={{ fontSize: '20px' }}>🔒</span>
          <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: '1.5' }}>
            <strong style={{ color: 'var(--deep)', fontFamily: 'Playfair Display,serif' }}>AES-256 Encryption:</strong> Converted amounts and rates are stored scrambled in the SQL Server database. This page decrypts them in real-time using your secure key — raw DB records are unreadable.
          </p>
        </div>

        {loading ? (
          <LoadingSpinner label="Decrypting records..." />
        ) : filtered.length === 0 ? (
          <div className="card animate-scaleIn" style={{
            padding: '64px', textAlign: 'center',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '16px'
          }}>
            <div style={{ fontSize: '48px', opacity: 0.25, animation: 'float 3s ease-in-out infinite' }}>📋</div>
            <p style={{ color: 'var(--muted)', fontFamily: 'Playfair Display,serif', fontSize: '17px' }}>
              {search ? `No results for "${search}"` : 'No conversion history yet'}
            </p>
            <p style={{ color: 'var(--sage)', fontSize: '14px' }}>
              Go to the Convert page to make your first conversion
            </p>
          </div>
        ) : (
          <div className="card animate-fadeUp delay-2" style={{ overflow: 'hidden' }}>
            {/* Summary bar */}
            <div style={{
              padding: '14px 20px',
              background: 'var(--deep)',
              display: 'flex', gap: '24px', alignItems: 'center'
            }}>
              <span style={{ fontFamily: 'Playfair Display,serif', fontSize: '13px', color: 'var(--cream)', fontWeight: '600' }}>
                {filtered.length} records
              </span>
              <span style={{ color: 'rgba(228,214,169,0.5)', fontSize: '12px' }}>
                All amounts decrypted from AES-256 cipher text
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    {['From', 'To', 'Original', 'Converted', 'Rate', 'Date & Time', 'Trace ID'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr key={row.id} style={{ animation: `fadeUp 0.4s ease ${i * 0.03}s both` }}>
                      <td>
                        <span className="badge badge-deep">{row.fromCurrency}</span>
                      </td>
                      <td>
                        <span className="badge badge-warm">{row.toCurrency}</span>
                      </td>
                      <td style={{ fontWeight: '600', color: 'var(--text)' }}>
                        {row.originalAmount}
                      </td>
                      <td style={{ fontWeight: '700', color: 'var(--deep)', fontFamily: 'Playfair Display,serif', fontSize: '16px' }}>
                        {parseFloat(row.convertedAmount).toFixed(4)}
                      </td>
                      <td style={{ color: 'var(--muted)', fontSize: '13px', fontFamily: 'monospace' }}>
                        {parseFloat(row.rate).toFixed(6)}
                      </td>
                      <td style={{ color: 'var(--muted)', fontSize: '13px' }}>
                        {new Date(row.convertedAt).toLocaleString()}
                      </td>
                      <td>
                        <span style={{
                          fontFamily: 'monospace', fontSize: '11px',
                          background: 'var(--cream2)', padding: '3px 8px',
                          borderRadius: '2px', color: 'var(--sage)',
                          border: '1px solid var(--border)'
                        }}>
                          {row.correlationId?.substring(0, 8)}...
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
