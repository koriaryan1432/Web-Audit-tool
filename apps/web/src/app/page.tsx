import Link from 'next/link';

const CATEGORIES = ['Performance', 'SEO', 'Accessibility', 'Security', 'UX/UI', 'Best Practices'];

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
      <div style={{ maxWidth: 640, width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'var(--text-4xl)', color: 'var(--color-ink)' }}>Site</span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-4xl)', fontWeight: 600, color: 'var(--color-signal)', letterSpacing: 'var(--tracking-tight)' }}>Grade</span>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-lg)', color: 'var(--color-dust)', marginTop: 'var(--space-3)' }}>Know your score. Fix what matters.</p>
        </div>
        <form action="/audit" method="GET" style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
          <input type="url" name="url" placeholder="https://yourwebsite.com" required className="input" style={{ flex: 1, height: 44, fontSize: 'var(--text-base)' }} />
          <button type="submit" className="btn-primary" style={{ padding: '10px var(--space-6)', height: 44, flexShrink: 0 }}>Run Audit</button>
        </form>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-8)' }}>
          {CATEGORIES.map((cat) => (
            <span key={cat} style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-dust)' }}>{cat}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)' }}>
          <Link href="/login" className="btn-primary">Get Started Free</Link>
          <Link href="/login" className="btn-secondary">Sign In</Link>
        </div>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--color-mist)', marginTop: 'var(--space-6)' }}>Free tier: 5 audits/month. No credit card required.</p>
      </div>
    </div>
  );
}
