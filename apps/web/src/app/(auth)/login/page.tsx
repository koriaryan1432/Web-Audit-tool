'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '../../../lib/supabase';

type AuthMode = 'signin' | 'signup' | 'magic';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(null);
    const supabase = getSupabaseClient();
    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/dashboard` } });
        if (error) throw error;
        setSuccess('Check your email for a magic link.');
        return;
      }
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/dashboard` } });
        if (error) throw error;
        setSuccess('Account created. Check your email to confirm.');
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally { setLoading(false); }
  };

  const TABS: { key: AuthMode; label: string }[] = [
    { key: 'signin', label: 'Sign In' },
    { key: 'signup', label: 'Sign Up' },
    { key: 'magic',  label: 'Magic Link' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 32, color: 'var(--color-ink)' }}>Site</span>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 32, fontWeight: 600, color: 'var(--color-signal)' }}>Grade</span>
          </div>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-mist)' }}>Website Performance and UX Audits</p>
        </div>
        <div className="card" style={{ padding: 'var(--space-8)' }}>
          <div style={{ display: 'flex', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', padding: 3, marginBottom: 'var(--space-6)' }}>
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => { setMode(tab.key); setError(null); setSuccess(null); }}
                style={{ flex: 1, padding: '6px 0', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', background: mode === tab.key ? 'var(--color-surface)' : 'transparent', color: mode === tab.key ? 'var(--color-ink)' : 'var(--color-mist)', boxShadow: mode === tab.key ? 'var(--shadow-float)' : 'none', transition: `all 150ms var(--ease-out)` }}>
                {tab.label}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label htmlFor="email" style={{ display: 'block', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-ink)', marginBottom: 'var(--space-2)' }}>Email address</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" className="input" />
            </div>
            {mode !== 'magic' && (
              <div>
                <label htmlFor="password" style={{ display: 'block', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-ink)', marginBottom: 'var(--space-2)' }}>Password</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'} minLength={mode === 'signup' ? 8 : undefined} className="input" />
              </div>
            )}
            {error && <div style={{ padding: 'var(--space-3) var(--space-4)', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: '#991B1B' }}>{error}</div>}
            {success && <div style={{ padding: 'var(--space-3) var(--space-4)', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: '#166534' }}>{success}</div>}
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '11px var(--space-4)' }}>
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Magic Link'}
            </button>
          </form>
          {mode === 'signin' && (
            <p style={{ textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--color-mist)', marginTop: 'var(--space-4)' }}>
              No account? <button onClick={() => setMode('signup')} style={{ background: 'none', border: 'none', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-signal)', cursor: 'pointer', padding: 0 }}>Sign up free</button>
            </p>
          )}
        </div>
        <p style={{ textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--color-mist)', marginTop: 'var(--space-6)' }}>
          By signing in, you agree to our <a href="/terms" style={{ color: 'var(--color-dust)' }}>Terms</a> and <a href="/privacy" style={{ color: 'var(--color-dust)' }}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
