import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import {
  createRateAlert,
  getMyRateAlerts,
  deleteRateAlert,
  checkRateAlerts,
  getAlertThreshold,
  updateAlertThreshold
} from '../api/rates';
import { useAuth } from '../context/AuthContext';

export default function Alerts() {
  const { user, isAdmin } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [threshold, setThreshold] = useState(10);
  const [form, setForm] = useState({ fromCurrency: 'USD', toCurrency: 'PKR', targetRate: '', direction: 'Above' });
  const [triggered, setTriggered] = useState([]);
  const [message, setMessage] = useState('');

  const loadAlerts = async () => {
    try {
      const res = await getMyRateAlerts();
      setAlerts(res.data || []);
    } catch {
      setAlerts([]);
    }
  };

  const loadThreshold = async () => {
    if (!isAdmin()) return;
    try {
      const res = await getAlertThreshold();
      setThreshold(res.data?.maxAlertsPerUser ?? 10);
    } catch {
      setThreshold(10);
    }
  };

  useEffect(() => {
    loadAlerts();
    loadThreshold();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await createRateAlert({
        fromCurrency: form.fromCurrency,
        toCurrency: form.toCurrency,
        targetRate: parseFloat(form.targetRate),
        direction: form.direction
      });
      setForm({ ...form, targetRate: '' });
      setMessage('Alert created.');
      loadAlerts();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create alert.');
    }
  };

  const handleDelete = async (id) => {
    await deleteRateAlert(id);
    loadAlerts();
  };

  const handleCheck = async () => {
    const res = await checkRateAlerts();
    setTriggered(res.data?.alerts || []);
  };

  const handleThresholdUpdate = async () => {
    await updateAlertThreshold(parseInt(threshold, 10) || 1);
    loadThreshold();
    setMessage('Threshold updated.');
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <h1 style={{ marginBottom: '16px' }}>Rate Alerts</h1>

        <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
          <h3 style={{ marginBottom: '12px' }}>Create Alert</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '10px' }}>
            <input className="input" value={form.fromCurrency} onChange={e => setForm({ ...form, fromCurrency: e.target.value.toUpperCase() })} placeholder="From" required />
            <input className="input" value={form.toCurrency} onChange={e => setForm({ ...form, toCurrency: e.target.value.toUpperCase() })} placeholder="To" required />
            <input className="input" type="number" step="any" value={form.targetRate} onChange={e => setForm({ ...form, targetRate: e.target.value })} placeholder="Target rate" required />
            <select className="input" value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })}>
              <option value="Above">Above</option>
              <option value="Below">Below</option>
            </select>
            <button className="btn-primary" type="submit">Create</button>
          </form>
          {message && <p style={{ marginTop: '10px', color: 'var(--muted)' }}>{message}</p>}
        </div>

        <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>My Alerts ({alerts.length})</h3>
            <button className="btn-primary" onClick={handleCheck}>Check Triggers</button>
          </div>

          {alerts.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No alerts yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Pair</th><th>Direction</th><th>Target</th><th>Status</th><th>Created</th><th></th>
                </tr>
              </thead>
              <tbody>
                {alerts.map(a => (
                  <tr key={a.id}>
                    <td>{a.fromCurrency}/{a.toCurrency}</td>
                    <td>{a.direction}</td>
                    <td>{a.targetRate}</td>
                    <td>{a.isTriggered ? 'Triggered' : 'Active'}</td>
                    <td>{new Date(a.createdAt).toLocaleString()}</td>
                    <td><button onClick={() => handleDelete(a.id)} style={{ border: '1px solid var(--border)', background: 'var(--cream2)', cursor: 'pointer' }}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {triggered.length > 0 && (
          <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ marginBottom: '10px' }}>Triggered Alerts</h3>
            <ul>
              {triggered.map(t => (
                <li key={t.alertId}>{t.message}</li>
              ))}
            </ul>
          </div>
        )}

        {isAdmin() && (
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '10px' }}>Admin Threshold Settings</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input className="input" type="number" min="1" value={threshold} onChange={e => setThreshold(e.target.value)} style={{ width: '180px' }} />
              <button className="btn-primary" onClick={handleThresholdUpdate}>Update Max Alerts/User</button>
            </div>
            <p style={{ marginTop: '8px', color: 'var(--muted)' }}>Current max alerts per user: {threshold}</p>
          </div>
        )}

        <p style={{ marginTop: '16px', color: 'var(--muted)' }}>Signed in as {user?.username} ({user?.role})</p>
      </div>
    </div>
  );
}
