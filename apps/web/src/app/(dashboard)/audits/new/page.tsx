'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

const CATEGORIES = [
  { id: 'performance',    label: 'Performance' },
  { id: 'accessibility',  label: 'Accessibility' },
  { id: 'best-practices', label: 'Best Practices' },
  { id: 'seo',            label: 'SEO' },
] as const;

export default function NewAuditPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [categories, setCategories] = useState<string[]>(['performance', 'accessibility', 'best-practices', 'seo']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleCategory(id: string) {
    setCategories((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (categories.length === 0) { setError('Select at least one category'); return; }
    setLoading(true); setError(null);
    try {
      const result = await apiClient.audits.create({ url, options: { categories, device, throttling: 'simulated' } });
      router.push(`/dashboard/audits/${result.auditId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start audit');
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <div>
        <h1 style={{ marginBottom: 'var(--space-1)' }}>New Audit</h1>
        <p style={{ fontSize: 'var(--text-sm)' }}>Enter a URL to audit. Results in under 60 seconds.</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="card">
          <label htmlFor="url" style={{ display: 'block', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-ink)', marginBottom: 'var(--space-2)' }}>Website URL</label>
          <input id="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://example.com" className="input" style={{ height: 44, fontSize: 'var(--text-base)' }} />
        </div>
        <div className="card">
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-ink)', marginBottom: 'var(--space-3)' }}>Audit Categories</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            {CATEGORIES.map((cat) => {
              const active = categories.includes(cat.id);
              return (
                <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)}
                  style={{ padding: '10px var(--space-4)', borderRadius: 'var(--radius-md)', border: `1px solid ${active ? 'var(--color-signal)' : 'var(--color-border)'}`, background: active ? '#EEF4FD' : 'var(--color-surface)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, color: active ? 'var(--color-signal)' : 'var(--color-dust)', cursor: 'pointer', transition: `all 150ms var(--ease-out)`, textAlign: 'left' }}>
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="card">
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-ink)', marginBottom: 'var(--space-3)' }}>Device</p>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {(['mobile', 'desktop'] as const).map((d) => {
              const active = device === d;
              return (
                <button key={d} type="button" onClick={() => setDevice(d)}
                  style={{ flex: 1, padding: '10px var(--space-4)', borderRadius: 'var(--radius-md)', border: `1px solid ${active ? 'var(--color-signal)' : 'var(--color-border)'}`, background: active ? '#EEF4FD' : 'var(--color-surface)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, color: active ? 'var(--color-signal)' : 'var(--color-dust)', cursor: 'pointer', textTransform: 'capitalize', transition: `all 150ms var(--ease-out)` }}>
                  {d === 'mobile' ? '📱' : '🖥️'} {d}
                </button>
              );
            })}
          </div>
        </div>
        {error && (
          <div style={{ padding: 'var(--space-3) var(--space-4)', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: '#991B1B' }}>{error}</div>
        )}
        <button type="submit" disabled={loading || !url} className="btn-primary" style={{ width: '100%', padding: '12px var(--space-6)', fontSize: 'var(--text-base)' }}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
              <span className="spinner" />Starting audit…
            </span>
          ) : 'Run Audit'}
        </button>
      </form>
    </div>
  );
}
