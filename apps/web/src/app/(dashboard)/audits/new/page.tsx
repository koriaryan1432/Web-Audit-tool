'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

const CATEGORIES = [
  { id: 'performance', label: 'Performance', icon: '⚡' },
  { id: 'accessibility', label: 'Accessibility', icon: '♿' },
  { id: 'best-practices', label: 'Best Practices', icon: '✅' },
  { id: 'seo', label: 'SEO', icon: '🔍' },
] as const;

export default function NewAuditPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [categories, setCategories] = useState<string[]>([
    'performance', 'accessibility', 'best-practices', 'seo',
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleCategory(id: string) {
    setCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (categories.length === 0) {
      setError('Select at least one category');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.audits.create({
        url,
        options: { categories, device, throttling: 'simulated' },
      });
      router.push(`/dashboard/audits/${result.auditId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start audit');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">New Audit</h1>
        <p className="text-gray-400 mt-1">Enter a URL to audit. Results in under 60 seconds.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URL input */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Website URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            placeholder="https://example.com"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          />
        </div>

        {/* Categories */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Audit Categories
          </label>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  categories.includes(cat.id)
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Device */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">Device</label>
          <div className="flex gap-3">
            {(['mobile', 'desktop'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDevice(d)}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium capitalize transition-colors ${
                  device === d
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                {d === 'mobile' ? '📱' : '🖥️'} {d}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !url}
          className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span> Starting audit...
            </span>
          ) : (
            '🚀 Run Audit'
          )}
        </button>
      </form>
    </div>
  );
}
