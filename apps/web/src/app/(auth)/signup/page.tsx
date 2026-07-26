'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/dashboard` } });
    if (error) { setError(error.message); setLoading(false); } else { setSuccess(true); }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <p style={{ fontSize: 48, marginBottom: 'var(--space-4)' }}>📧</p>
          <h2 style={{ marginBottom: 'var(--space-2)' }}>Check your email</h2>
          <p style={{ fontSize: 'var(--text-sm)' }}>We sent a confirmation link to <strong style={{ color: 'var(--color-ink)' }}>{email}</strong>. Click it to activate your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 32, color: 'var(--color-ink)' }}>Site</span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 32, fontWeight: 600, color: 'var(--color-signal)' }}>Grade</span>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-mist)', marginTop: 'var(--space-2)' }}>Start auditing for free</p>
        </div>
        <div className="card" style={{ padding: 'var(--space-8)' }}>
          <h2 style={{ marginBottom: 'var(--space-6)' }}>Create account</h2>
          {error && <div style={{ padding: 'var(--space-3) var(--space-4)', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: '#991B1B', marginBottom: 'var(--space-4)' }}>{error}</div>}
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-ink)', marginBottom: 'var(--space-2)' }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className="input" />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-ink)', marginBottom: 'var(--space-2)' }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="Min. 8 characters" className="input" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '11px var(--space-4)' }}>{loading ? 'Creating account…' : 'Create free account'}</button>
          </form>
          <p style={{ textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-mist)', marginTop: 'var(--space-6)' }}>Already have an account? <Link href="/login" style={{ color: 'var(--color-signal)', fontWeight: 500 }}>Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
