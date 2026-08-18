import { useState } from 'react';
import { Warehouse, Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/auth';
import { classNames } from '@/lib/utils';

export function LoginPage() {
  const { login, signup, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    setTimeout(() => {
      if (mode === 'login') {
        const result = login(email, password);
        if (!result.success) setError(result.error || 'Login failed');
      } else if (mode === 'signup') {
        if (!name.trim()) { setError('Please enter your name'); setLoading(false); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
        const result = signup(name, email, password);
        if (!result.success) setError(result.error || 'Signup failed');
      } else {
        const result = resetPassword(email);
        if (result.success) setSuccess('Password reset link sent to your email.');
        else setError(result.error || 'Reset failed');
      }
      setLoading(false);
    }, 400);
  };

  const fillDemo = () => {
    setEmail('liam.kowalski@warehouseiq.io');
    setPassword('demo123');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-ink-900 via-primary-950 to-ink-900 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-primary-500 blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-accent-500 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-xl shadow-primary-900/50">
            <Warehouse className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">WarehouseIQ</h1>
            <p className="text-xs text-ink-400 font-medium uppercase tracking-wider">Operations Command Center</p>
          </div>
        </div>

        <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-2xl border border-ink-200 dark:border-ink-800 p-6 animate-scale-in">
          <div className="flex gap-1 mb-5 p-1 rounded-lg bg-ink-100 dark:bg-ink-800">
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className={classNames('flex-1 py-2 rounded-md text-sm font-semibold transition-all', mode === 'login' ? 'bg-white dark:bg-ink-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-ink-500')}
            >Sign In</button>
            <button
              onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
              className={classNames('flex-1 py-2 rounded-md text-sm font-semibold transition-all', mode === 'signup' ? 'bg-white dark:bg-ink-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-ink-500')}
            >Sign Up</button>
          </div>

          {mode === 'reset' && (
            <div className="mb-4 p-3 rounded-lg bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 text-xs text-primary-700 dark:text-primary-300">
              Enter your email and we'll send you a password reset link.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-error-50 dark:bg-error-950/40 border border-error-200 dark:border-error-800 flex items-center gap-2 text-xs text-error-700 dark:text-error-400 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-success-50 dark:bg-success-950/40 border border-success-200 dark:border-success-800 flex items-center gap-2 text-xs text-success-700 dark:text-success-400 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="label block mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder="John Smith" className="input pl-9" />
                </div>
              </div>
            )}
            <div>
              <label className="label block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@company.com" className="input pl-9" required />
              </div>
            </div>
            {mode !== 'reset' && (
              <div>
                <label className="label block mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="input pl-9 pr-9" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full !py-2.5">
              {loading ? 'Please wait...' : (
                <>
                  {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {mode === 'login' && (
            <>
              <div className="mt-4 text-center">
                <button onClick={() => { setMode('reset'); setError(''); setSuccess(''); }} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-ink-200 dark:border-ink-800">
                <button onClick={fillDemo} className="btn-secondary w-full !text-xs">
                  Fill Demo Credentials
                </button>
                <p className="text-[10px] text-ink-400 text-center mt-2">
                  Demo: liam.kowalski@warehouseiq.io / demo123
                </p>
              </div>
            </>
          )}
          {mode === 'reset' && (
            <div className="mt-4 text-center">
              <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                Back to sign in
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-ink-500 mt-6">
          WarehouseIQ © 2026 · Smart Warehouse Operations Platform
        </p>
      </div>
    </div>
  );
}
