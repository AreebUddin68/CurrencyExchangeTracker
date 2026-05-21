import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
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
  const intervalRef = useRef(null);

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

  const handleCheck = async (silent = false) => {
    try {
      const res = await checkRateAlerts();
      const triggeredAlerts = res.data?.alerts || [];
      setTriggered(triggeredAlerts);

      if (triggeredAlerts.length > 0) {
        triggeredAlerts.forEach(a => toast.success(a.message));
        await loadAlerts();
      } else if (!silent) {
        toast('No alerts triggered right now.');
      }
    } catch (err) {
      if (!silent)
        toast.error(err.response?.data?.message || 'Failed to check alert triggers.');
    }
  };

  useEffect(() => {
    loadAlerts();
    loadThreshold();

    intervalRef.current = setInterval(() => {
      handleCheck(true);
    }, 15000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
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
      toast.success('Rate alert created.');
      loadAlerts();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create alert.';
      setMessage(msg);
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteRateAlert(id);
      toast.success('Alert deleted.');
      loadAlerts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete alert.');
    }
  };

  const handleThresholdUpdate = async () => {
    try {
      await updateAlertThreshold(parseInt(threshold, 10) || 1);
      loadThreshold();
      setMessage('Threshold updated.');
      toast.success('Threshold updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update threshold.');
    }
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
            <button className="btn-primary" onClick={() => handleCheck(false)}>Check Triggers</button>
          </div>

          <p style={{ color: 'var(--muted)', marginBottom: '10px' }}>
            Auto-check runs every 15 seconds and shows instant notifications when a threshold is crossed.
          </p>

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
