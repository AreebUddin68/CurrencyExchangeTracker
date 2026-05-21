import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { getMonitorSummary, getRecentLogs, getErrors, getTrace } from '../api/audit';
import { getAllUsers, updateUserRole } from '../api/auth';
import { getAllHistory } from '../api/convert';
import LoadingSpinner from '../components/LoadingSpinner';

const TABS = [
  { key: 'monitor', label: 'Monitor',     icon: '📊' },
  { key: 'logs',    label: 'Logs',        icon: '📝' },
  { key: 'errors',  label: 'Errors',      icon: '🚨' },
  { key: 'users',   label: 'Users',       icon: '👥' },
  { key: 'history', label: 'Conversions', icon: '💱' },
  { key: 'trace',   label: 'Trace',       icon: '🔍' },
];

export default function AdminPanel() {
  const [tab,         setTab]         = useState('monitor');
  const [monitor,     setMonitor]     = useState(null);
  const [logs,        setLogs]        = useState([]);
  const [errors,      setErrors]      = useState([]);
  const [users,       setUsers]       = useState([]);
  const [allHistory,  setAllHistory]  = useState([]);
  const [traceId,     setTraceId]     = useState('');
  const [traceResult, setTraceResult] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [roleBusyId,  setRoleBusyId]   = useState(null);

  useEffect(() => { loadTab(tab); }, [tab]);

  const loadTab = async (t) => {
    setLoading(true);
    try {
      if      (t === 'monitor') { const r = await getMonitorSummary(); setMonitor(r.data); }
      else if (t === 'logs')    { const r = await getRecentLogs();     setLogs(r.data); }
      else if (t === 'errors')  { const r = await getErrors();         setErrors(r.data); }
      else if (t === 'users')   { const r = await getAllUsers();        setUsers(r.data); }
      else if (t === 'history') { const r = await getAllHistory();      setAllHistory(r.data); }
    } catch (err) { console.error(err); }
    finally       { setLoading(false); }
  };

  const handleTrace = async () => {
    if (!traceId.trim()) return;
    try {
      const res = await getTrace(traceId.trim());
      setTraceResult(res.data);
    } catch {
      setTraceResult({ error: 'No logs found for this Correlation ID' });
    }
  };

  const handleRoleChange = async (userId, nextRole) => {
    try {
      setRoleBusyId(userId);
      await updateUserRole(userId, nextRole);
      toast.success(`Role updated to ${nextRole}`);
      const res = await getAllUsers();
      setUsers(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setRoleBusyId(null);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">

        {/* Header */}
        <div className="animate-fadeUp" style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div style={{ width: '4px', height: '36px', background: 'linear-gradient(to bottom, var(--deep), var(--warm))', borderRadius: '2px' }} />
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '900' }}>Admin Panel</h1>
              <p style={{ color: 'var(--muted)', fontSize: '15px', marginTop: '2px' }}>
                System monitoring, distributed tracing, and user management
              </p>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="animate-fadeUp delay-1" style={{
          display: 'flex', gap: '4px', marginBottom: '24px',
          flexWrap: 'wrap',
          background: 'var(--cream2)', padding: '6px',
          borderRadius: '4px', border: '1px solid var(--border)'
        }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '9px 20px', borderRadius: '2px',
              background: tab === t.key ? 'var(--deep)' : 'transparent',
              color:      tab === t.key ? 'var(--cream)' : 'var(--muted)',
              border:     'none', cursor: 'pointer',
              fontFamily: 'Playfair Display,serif', fontSize: '13px',
              fontWeight: '600', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <span>{t.icon}</span> {t.label}
              {t.key === 'errors' && errors.length > 0 && (
                <span style={{
                  background: 'var(--error)', color: 'white',
                  borderRadius: '10px', padding: '1px 7px',
                  fontSize: '11px', marginLeft: '2px'
                }}>{errors.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div className="card animate-fadeUp delay-2" style={{ padding: '24px', minHeight: '400px' }}>

          {loading ? <LoadingSpinner /> : (<>

            {/* ── MONITOR TAB ── */}
            {tab === 'monitor' && monitor && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '17px', color: 'var(--deep)' }}>System Health — {monitor.period}</h3>
                  <span className="badge badge-sage" style={{ fontSize: '11px' }}>
                    {monitor.totalRequests} total requests
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  {monitor.services?.map((s, i) => (
                    <div key={s.service} style={{
                      background: 'var(--cream2)', borderRadius: '2px',
                      padding: '18px', border: '1px solid var(--border)',
                      borderTop: `3px solid var(--${['deep','warm','sage','deep','warm'][i % 5]})`,
                      animation: `fadeUp 0.4s ease ${i * 0.07}s both`
                    }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--deep)', marginBottom: '12px', fontSize: '13px' }}>
                        {s.service}
                      </div>
                      {[
                        { l: 'Total Requests', v: s.totalRequests,    c: 'var(--text)' },
                        { l: 'Success',        v: s.successCount,     c: 'var(--success)' },
                        { l: 'Errors',         v: s.errorCount,       c: s.errorCount > 0 ? 'var(--error)' : 'var(--muted)' },
                        { l: 'Avg Latency',    v: `${s.avgLatencyMs}ms`, c: 'var(--warm)' },
                        { l: 'Max Latency',    v: `${s.maxLatencyMs}ms`, c: 'var(--deep)' },
                      ].map(item => (
                        <div key={item.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', borderBottom: '1px solid rgba(200,180,138,0.3)' }}>
                          <span style={{ color: 'var(--muted)' }}>{item.l}</span>
                          <span style={{ fontWeight: '700', color: item.c, fontFamily: 'Playfair Display,serif' }}>{item.v}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── LOGS TAB ── */}
            {tab === 'logs' && (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      {['Service','Method','Endpoint','Status','Latency','User','Time'].map(h => <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr key={log.id} style={{ animation: `fadeUp 0.35s ease ${i * 0.02}s both` }}>
                        <td><span className="badge badge-deep" style={{ fontSize: '11px' }}>{log.serviceName}</span></td>
                        <td><span className="badge badge-sage" style={{ fontSize: '11px' }}>{log.method}</span></td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--muted)' }}>{log.endpoint}</td>
                        <td>
                          <span className={`badge ${log.statusCode < 400 ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '11px' }}>
                            {log.statusCode}
                          </span>
                        </td>
                        <td style={{ color: 'var(--warm)', fontWeight: '600', fontSize: '13px' }}>{log.latencyMs}ms</td>
                        <td style={{ color: 'var(--muted)', fontSize: '13px' }}>{log.username || '—'}</td>
                        <td style={{ color: 'var(--muted)', fontSize: '12px' }}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {logs.length === 0 && <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px', fontFamily: 'Playfair Display,serif' }}>No logs yet. Make some API requests first.</p>}
              </div>
            )}

            {/* ── ERRORS TAB ── */}
            {tab === 'errors' && (
              errors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
                  <p style={{ fontFamily: 'Playfair Display,serif', fontSize: '17px', color: 'var(--success)', fontWeight: '600' }}>
                    No errors found!
                  </p>
                  <p style={{ color: 'var(--muted)', marginTop: '4px' }}>All services are healthy.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {errors.map((e, i) => (
                    <div key={e.id} style={{
                      background: 'rgba(139,32,32,0.05)', borderRadius: '2px',
                      padding: '16px', border: '1px solid rgba(139,32,32,0.2)',
                      borderLeft: '3px solid var(--error)',
                      animation: `fadeUp 0.35s ease ${i * 0.05}s both`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className="badge badge-error" style={{ fontSize: '11px' }}>{e.serviceName}</span>
                          <span className="badge badge-warm" style={{ fontSize: '11px' }}>{e.method}</span>
                          <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--muted)' }}>{e.endpoint}</span>
                          <span className="badge badge-error" style={{ fontSize: '11px' }}>{e.statusCode}</span>
                        </div>
                        <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{new Date(e.timestamp).toLocaleString()}</span>
                      </div>
                      {e.message && <p style={{ fontSize: '13px', color: 'var(--error)', marginTop: '4px' }}>{e.message}</p>}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ── USERS TAB ── */}
            {tab === 'users' && (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>{['ID','Username','Email','Role','Created'].map(h => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u.id} style={{ animation: `fadeUp 0.35s ease ${i * 0.04}s both` }}>
                        <td style={{ color: 'var(--muted)', fontSize: '13px' }}>{u.id}</td>
                        <td style={{ fontWeight: '700', fontFamily: 'Playfair Display,serif', color: 'var(--deep)', fontSize: '16px' }}>{u.username}</td>
                        <td style={{ color: 'var(--muted)', fontSize: '13px' }}>{u.email}</td>
                        <td>
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={roleBusyId === u.id}
                            style={{
                              padding: '6px 8px',
                              borderRadius: '2px',
                              border: '1px solid var(--border)',
                              background: 'var(--cream2)',
                              fontFamily: 'Playfair Display,serif',
                              fontSize: '12px'
                            }}
                          >
                            <option value="User">User</option>
                            <option value="PremiumUser">PremiumUser</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </td>
                        <td style={{ color: 'var(--muted)', fontSize: '13px' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── ALL HISTORY TAB ── */}
            {tab === 'history' && (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>{['User','From','To','Amount','Converted','Date'].map(h => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {allHistory.map((row, i) => (
                      <tr key={row.id} style={{ animation: `fadeUp 0.35s ease ${i * 0.03}s both` }}>
                        <td style={{ fontWeight: '600', color: 'var(--warm)', fontFamily: 'Playfair Display,serif' }}>{row.username}</td>
                        <td><span className="badge badge-deep">{row.fromCurrency}</span></td>
                        <td><span className="badge badge-warm">{row.toCurrency}</span></td>
                        <td style={{ color: 'var(--text)' }}>{row.originalAmount}</td>
                        <td style={{ fontWeight: '700', color: 'var(--deep)', fontFamily: 'Playfair Display,serif', fontSize: '16px' }}>
                          {parseFloat(row.convertedAmount).toFixed(4)}
                        </td>
                        <td style={{ color: 'var(--muted)', fontSize: '13px' }}>{new Date(row.convertedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {allHistory.length === 0 && <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px', fontFamily: 'Playfair Display,serif' }}>No conversion history yet.</p>}
              </div>
            )}

            {/* ── TRACE TAB ── */}
            {tab === 'trace' && (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '17px', color: 'var(--deep)', marginBottom: '8px' }}>
                    Distributed Request Tracing
                  </h3>
                  <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.6' }}>
                    Paste a <strong style={{ color: 'var(--warm)' }}>Correlation ID</strong> from any response header or from the History table to see the complete journey of that request across all microservices.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                  <input
                    className="input"
                    value={traceId}
                    onChange={e => setTraceId(e.target.value)}
                    placeholder="e.g. a3f9b2c1-4d5e-6f7a-8b9c-0d1e2f3a4b5c"
                    style={{ flex: 1, fontFamily: 'monospace', fontSize: '13px' }}
                    onKeyDown={e => e.key === 'Enter' && handleTrace()}
                  />
                  <button className="btn-primary" onClick={handleTrace} style={{ padding: '11px 28px' }}>
                    Trace
                  </button>
                </div>

                {traceResult && (
                  traceResult.error ? (
                    <div style={{ padding: '16px', background: 'rgba(139,32,32,0.06)', border: '1px solid rgba(139,32,32,0.2)', borderRadius: '2px', color: 'var(--error)', fontFamily: 'Playfair Display,serif' }}>
                      {traceResult.error}
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <div style={{ background: 'var(--cream2)', border: '1px solid var(--border)', borderRadius: '2px', padding: '10px 18px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'Playfair Display,serif', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Steps</div>
                          <div style={{ fontSize: '22px', fontWeight: '900', fontFamily: 'Playfair Display,serif', color: 'var(--deep)' }}>{traceResult.totalSteps}</div>
                        </div>
                        <div style={{ background: 'var(--cream2)', border: '1px solid var(--border)', borderRadius: '2px', padding: '10px 18px' }}>
                          <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'Playfair Display,serif', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Total Latency</div>
                          <div style={{ fontSize: '22px', fontWeight: '900', fontFamily: 'Playfair Display,serif', color: 'var(--warm)' }}>{traceResult.totalLatencyMs}ms</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {traceResult.journey?.map((step, i) => (
                          <div key={step.step} style={{
                            display: 'flex', alignItems: 'center', gap: '14px',
                            padding: '14px 18px',
                            background: 'var(--cream2)', borderRadius: '2px',
                            border: '1px solid var(--border)',
                            borderLeft: '3px solid var(--warm)',
                            animation: `fadeUp 0.4s ease ${i * 0.06}s both`
                          }}>
                            <div style={{
                              width: '28px', height: '28px',
                              background: 'var(--deep)', color: 'var(--cream)',
                              borderRadius: '50%', display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              fontSize: '12px', fontWeight: '700',
                              fontFamily: 'Playfair Display,serif', flexShrink: 0
                            }}>{step.step}</div>

                            <div style={{ flex: 1 }}>
                              <span style={{ fontFamily: 'Playfair Display,serif', fontWeight: '700', color: 'var(--deep)', fontSize: '15px' }}>
                                {step.service}
                              </span>
                              <span style={{ margin: '0 10px', color: 'var(--sage)' }}>→</span>
                              <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--muted)' }}>
                                {step.endpoint}
                              </span>
                            </div>

                            <span className={`badge ${step.status < 400 ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '11px' }}>
                              {step.status}
                            </span>
                            <span style={{ color: 'var(--warm)', fontWeight: '700', fontFamily: 'Playfair Display,serif', fontSize: '14px', flexShrink: 0 }}>
                              {step.latencyMs}ms
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

          </>)}
        </div>
      </div>
    </div>
  );
}
