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
        setSuccess('Check your email for a magic link!');
        return;
      }
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/dashboard` } });
        if (error) throw error;
        setSuccess('Account created! Check your email to confirm.');
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl mb-4">
            <span className="text-white font-bold text-lg">SG</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SiteGrade</h1>
          <p className="text-gray-500 mt-1 text-sm">Website Performance and UX Audits</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            {([{ key: 'signin', label: 'Sign In' }, { key: 'signup', label: 'Sign Up' }, { key: 'magic', label: 'Magic Link' }] as { key: AuthMode; label: string }[]).map((tab) => (
              <button key={tab.key} onClick={() => { setMode(tab.key); setError(null); setSuccess(null); }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400" />
            </div>
            {mode !== 'magic' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'} minLength={mode === 'signup' ? 8 : undefined}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400" />
              </div>
            )}
            {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3"><p className="text-sm text-red-700">{error}</p></div>}
            {success && <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3"><p className="text-sm text-green-700">{success}</p></div>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Magic Link'}
            </button>
          </form>
          {mode === 'signin' && (
            <p className="text-center text-xs text-gray-500 mt-4">
              No account? <button onClick={() => setMode('signup')} className="text-indigo-600 hover:underline font-medium">Sign up free</button>
            </p>
          )}
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">
          By signing in, you agree to our <a href="/terms" className="hover:underline">Terms</a> and <a href="/privacy" className="hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
