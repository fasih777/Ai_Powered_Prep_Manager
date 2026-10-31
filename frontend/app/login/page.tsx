import { login } from './actions';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center font-sans p-4">
      <div className="max-w-md w-full bg-surface border border-line p-8 rounded-xl shadow-overlay">
        <h2 className="text-2xl font-semibold text-ink mb-6 text-center">AI Prep Manager Login</h2>
        {searchParams.error && (
          <div className="mb-4 p-3 bg-verdict-fail-bg border border-verdict-fail-line text-verdict-fail-fg text-sm rounded-lg text-center">
            {searchParams.error}
          </div>
        )}
        <form action={login} className="space-y-4">
          <input type="hidden" name="next" value={searchParams.next || ''} />
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full bg-surface border border-line rounded-lg px-4 py-2 text-ink focus:outline-none focus:border-brand transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Password</label>
            <input
              name="password"
              type="password"
              required
              className="w-full bg-surface border border-line rounded-lg px-4 py-2 text-ink focus:outline-none focus:border-brand transition-colors"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-brand hover:bg-brand-hover text-on-brand font-medium py-2 rounded-lg transition-colors mt-2"
          >
            Log in
          </button>
        </form>
      </div>
    </div>
  );
}
