import { useState } from 'react';

interface LoginProps {
  onLogin: (token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      onLogin(data.token);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Glass Card */}
        <div className="liquid-card rounded-3xl p-8 transition-glass">
          {/* Logo / Icon */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-5 relative">
              <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-xl" />
              <div className="relative w-full h-full bg-gradient-to-br from-primary to-primary-light rounded-3xl flex items-center justify-center shadow-lg">
                <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-text tracking-tight">Apartment Dashboard</h1>
            <p className="text-text-muted mt-1.5 text-[15px]">Enter your credentials</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 bg-danger/8 rounded-2xl border border-danger/15 text-danger text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-1.5 ml-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl border border-border text-text placeholder-text-muted focus:outline-none focus:border-primary/40 transition-glass text-[15px]"
                placeholder="Enter username"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-text-secondary mb-1.5 ml-1">
                PIN Code
              </label>
              <input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl border border-border text-text placeholder-text-muted focus:outline-none focus:border-primary/40 transition-glass text-[15px] tracking-widest"
                placeholder="••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-primary hover:bg-primary-dark text-white font-medium rounded-2xl transition-glass disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25 mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Bottom text */}
        <p className="text-center text-text-muted text-sm mt-6">
          Secure PIN-protected access
        </p>
      </div>
    </div>
  );
}
