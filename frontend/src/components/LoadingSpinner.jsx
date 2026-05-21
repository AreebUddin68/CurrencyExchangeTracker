export default function LoadingSpinner({ size = 40, label = 'Loading...' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '48px', gap: '16px'
    }}>
      <div style={{
        width: size, height: size,
        border: `3px solid var(--cream2)`,
        borderTop: `3px solid var(--warm)`,
        borderRadius: '50%',
        animation: 'spin 0.85s linear infinite'
      }} />
      <span style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: '13px', color: 'var(--muted)',
        letterSpacing: '1px', textTransform: 'uppercase'
      }}>{label}</span>
    </div>
  );
}
