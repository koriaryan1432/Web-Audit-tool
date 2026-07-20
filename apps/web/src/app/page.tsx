/**
 * SiteGrade — Landing Page (Milestone 3 will flesh this out fully)
 * For now: a functional placeholder that renders the audit URL input form.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold text-white tracking-tight">
            Site<span className="text-indigo-500">Grade</span>
          </h1>
          <p className="text-xl text-slate-400">
            Know your score. Fix what matters.
          </p>
        </div>
        <form action="/audit" method="GET" className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            name="url"
            placeholder="https://yourwebsite.com"
            required
            className="flex-1 px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            Run Audit
          </button>
        </form>
        <div className="flex flex-wrap justify-center gap-2 text-sm text-slate-400">
          {["Performance", "SEO", "Accessibility", "Security", "UX/UI", "Best Practices"].map((category) => (
            <span key={category} className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
              {category}
            </span>
          ))}
        </div>
        <p className="text-slate-500 text-sm">Free tier: 5 audits/month. No credit card required.</p>
      </div>
    </main>
  );
}
