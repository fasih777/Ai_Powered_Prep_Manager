import { login } from './actions';

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center font-sans">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-xl">
        <h2 className="text-2xl font-semibold text-zinc-100 mb-6 text-center">AI Prep Manager Login</h2>
        {searchParams.error && (
          <div className="mb-4 p-3 bg-rose-950/50 border border-rose-500/50 text-rose-200 text-sm rounded-lg text-center">
            {searchParams.error}
          </div>
        )}
        <form action={login} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
            <input 
              name="email" 
              type="email" 
              required 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Password</label>
            <input 
              name="password" 
              type="password" 
              required 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-2 rounded-lg transition-colors mt-2"
          >
            Log in
          </button>
        </form>
      </div>
    </div>
  );
}
