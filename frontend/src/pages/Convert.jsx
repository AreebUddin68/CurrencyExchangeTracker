import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { convertMultiple, saveFavoritePair, getFavoritePairs } from '../api/convert';
import toast from 'react-hot-toast';

const ALL_CURRENCIES = ['USD','EUR','GBP','PKR','JPY','SAR','AED','CAD','AUD','CHF','CNY','INR','TRY','KWD','BHD'];

export default function Convert() {
  const [from,     setFrom]     = useState('USD');
  const [amount,   setAmount]   = useState('');
  const [selected, setSelected] = useState(['PKR', 'EUR', 'GBP']);
  const [results,  setResults]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [favorites, setFavorites] = useState([]);

  const toggle = (c) =>
    setSelected(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const loadFavorites = async () => {
    try {
      const res = await getFavoritePairs();
      setFavorites(res.data || []);
    } catch {
      setFavorites([]);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleSaveFavorite = async (toCurrency) => {
    try {
      await saveFavoritePair({ from, to: toCurrency });
      toast.success(`Saved favorite pair ${from} → ${toCurrency}`);
      loadFavorites();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save favorite pair');
    }
  };

  const handleConvert = async () => {
    if (!amount || !parseFloat(amount)) { toast.error('Enter a valid amount'); return; }
    if (selected.length === 0)          { toast.error('Select at least one currency'); return; }
    setLoading(true);
    try {
      const res = await convertMultiple({ from, amount: parseFloat(amount), toCurrencies: selected });
      setResults(res.data);
      toast.success(`Converted to ${res.data.totalConversions} currencies in parallel!`);
    } catch (err) {
      toast.error('Conversion failed. Ensure all services are running.');
    } finally {
      setLoading(false);
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
              <h1 style={{ fontSize: '28px', fontWeight: '900' }}>Currency Converter</h1>
              <p style={{ color: 'var(--muted)', fontSize: '15px', marginTop: '2px' }}>
                Parallel conversion using Task.WhenAll across all currencies simultaneously
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* Input panel */}
          <div>
            <div className="card animate-fadeUp delay-1" style={{ padding: '28px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '20px', color: 'var(--deep)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--warm)' }}>⇄</span> Conversion Settings
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label className="label">From</label>
                  <select className="input" value={from} onChange={e => setFrom(e.target.value)}>
                    {ALL_CURRENCIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Amount</label>
                  <input
                    className="input" type="number" value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="e.g. 100"
                    min="0" step="any"
                  />
                </div>
              </div>

              <div>
                <label className="label" style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Target Currencies</span>
                  <span style={{ fontSize: '11px', color: 'var(--sage)', fontWeight: '400', letterSpacing: 0, textTransform: 'none' }}>
                    {selected.length} selected — all run in parallel ⚡
                  </span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {ALL_CURRENCIES.filter(c => c !== from).map(c => (
                    <button key={c} onClick={() => toggle(c)} style={{
                      padding: '6px 14px', borderRadius: '2px', cursor: 'pointer',
                      background: selected.includes(c) ? 'var(--deep)' : 'var(--cream2)',
                      color:      selected.includes(c) ? 'var(--cream)' : 'var(--muted)',
                      border:     `1.5px solid ${selected.includes(c) ? 'var(--deep)' : 'var(--border)'}`,
                      fontFamily: 'Playfair Display,serif', fontSize: '12px',
                      fontWeight: '600', transition: 'all 0.18s', letterSpacing: '0.3px'
                    }}>{c}</button>
                  ))}
                </div>
              </div>
            </div>

            {favorites.length > 0 && (
              <div className="card animate-fadeUp delay-2" style={{ padding: '16px', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '10px' }}>
                  Favorite pairs
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {favorites.map((f, i) => (
                    <button
                      key={`${f.fromCurrency}-${f.toCurrency}-${i}`}
                      onClick={() => {
                        setFrom(f.fromCurrency);
                        setSelected(prev => prev.includes(f.toCurrency) ? prev : [...prev, f.toCurrency]);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '2px',
                        border: '1px solid var(--border)',
                        background: 'var(--cream2)',
                        color: 'var(--deep)',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {f.fromCurrency} → {f.toCurrency}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              className="btn-primary animate-fadeUp delay-2"
              onClick={handleConvert}
              disabled={loading}
              style={{ width: '100%', padding: '14px', fontSize: '16px' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <div style={{
                    width: '18px', height: '18px',
                    border: '2px solid rgba(228,214,169,0.3)',
                    borderTop: '2px solid var(--cream)',
                    borderRadius: '50%', animation: 'spin 0.7s linear infinite'
                  }} />
                  Converting in Parallel...
                </span>
              ) : `⚡ Convert ${amount || '0'} ${from} to ${selected.length} currencies`}
            </button>

            {/* Concurrency note */}
            <div style={{
              marginTop: '14px', padding: '14px 16px',
              background: 'rgba(98,43,20,0.07)',
              border: '1px solid rgba(98,43,20,0.15)',
              borderLeft: '3px solid var(--warm)',
              borderRadius: '2px'
            }}>
              <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.6' }}>
                <strong style={{ color: 'var(--warm)', fontFamily: 'Playfair Display,serif' }}>Task.WhenAll</strong> — All {selected.length} conversions run simultaneously in parallel threads, not one-by-one. This demonstrates the <strong style={{ color: 'var(--deep)' }}>Concurrency requirement</strong> of your course project.
              </p>
            </div>
          </div>

          {/* Results panel */}
          <div className="animate-fadeUp delay-3">
            {!results ? (
              <div className="card" style={{
                padding: '48px', textAlign: 'center',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '16px', height: '100%',
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: '48px', opacity: 0.3, animation: 'float 3s ease-in-out infinite' }}>💱</div>
                <p style={{ color: 'var(--muted)', fontFamily: 'Playfair Display,serif', fontSize: '16px' }}>
                  Select currencies and click Convert
                </p>
                <p style={{ color: 'var(--sage)', fontSize: '13px' }}>
                  Results will appear here
                </p>
              </div>
            ) : (
              <div className="card" style={{ padding: '24px' }}>
                {/* Results header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', color: 'var(--deep)' }}>
                      {results.originalAmount} {results.from}
                    </h3>
                    <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '2px' }}>
                      {results.totalConversions} currencies converted
                    </p>
                  </div>
                  <span className="badge badge-deep" style={{ fontSize: '10px' }}>
                    {results.processedWith?.split('—')[0] || 'Parallel'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '480px', overflowY: 'auto', paddingRight: '4px' }}>
                  {results.results?.map((r, i) => (
                    <div key={r.to} style={{
                      padding: '14px 16px',
                      background: r.error ? 'rgba(139,32,32,0.06)' : 'var(--cream2)',
                      border: `1px solid ${r.error ? 'rgba(139,32,32,0.2)' : 'var(--border)'}`,
                      borderLeft: `3px solid ${r.error ? 'var(--error)' : 'var(--warm)'}`,
                      borderRadius: '2px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      animation: `fadeUp 0.4s ease ${i * 0.04}s both`
                    }}>
                      <div>
                        <div style={{ fontFamily: 'Playfair Display,serif', fontWeight: '700', fontSize: '15px', color: 'var(--deep)' }}>
                          {results.from} → {r.to}
                        </div>
                        {!r.error && (
                          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                            Rate: {r.rate?.toFixed(6)}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {r.error ? (
                          <span style={{ color: 'var(--error)', fontSize: '13px' }}>{r.error}</span>
                        ) : (
                          <>
                            <div style={{ fontFamily: 'Playfair Display,serif', fontWeight: '900', fontSize: '20px', color: 'var(--deep)' }}>
                              {r.convertedAmount?.toFixed(2)}
                            </div>
                            <button
                              onClick={() => handleSaveFavorite(r.to)}
                              style={{
                                marginTop: '6px',
                                padding: '4px 8px',
                                fontSize: '11px',
                                border: '1px solid var(--border)',
                                borderRadius: '2px',
                                background: 'var(--cream3)',
                                color: 'var(--deep)',
                                cursor: 'pointer'
                              }}
                            >
                              ☆ Save
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
