import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  KeyRound, 
  Mail, 
  Lock, 
  User, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Wrench
} from 'lucide-react';
import type { UserRole, UserAccount } from '../types/auth';
import { registerUser, loginUser, resetPassword } from '../services/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserAccount) => void;
  initialTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialTab = 'login',
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>(initialTab);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [role, setRole] = useState<UserRole>('citizen');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (tab === 'register') {
        const res = await registerUser(email, password, displayName, role);
        if (res.success && res.user) {
          onAuthSuccess(res.user);
          onClose();
        } else {
          setErrorMessage(res.error || 'Registration failed.');
        }
      } else if (tab === 'login') {
        const res = await loginUser(email, password);
        if (res.success && res.user) {
          onAuthSuccess(res.user);
          onClose();
        } else {
          setErrorMessage(res.error || 'Login failed.');
        }
      } else if (tab === 'forgot') {
        const res = await resetPassword(email, password);
        if (res.success) {
          setSuccessMessage('Password reset successfully. You can now sign in with your new password.');
          setTab('login');
        } else {
          setErrorMessage(res.error || 'Failed to reset password.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                {tab === 'login' && 'Sign In to REPAIR.AI'}
                {tab === 'register' && 'Create Contributor Account'}
                {tab === 'forgot' && 'Reset Password'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Verified identities &amp; transparent accountability
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        {tab !== 'forgot' && (
          <div className="flex border-b border-slate-100 bg-slate-50/50 p-1">
            <button
              type="button"
              onClick={() => { setTab('login'); setErrorMessage(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                tab === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setErrorMessage(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                tab === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {tab === 'register' && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@university.edu"
                className="w-full pl-9 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                {tab === 'forgot' ? 'New Password' : 'Password'}
              </label>
              {tab === 'login' && (
                <button
                  type="button"
                  onClick={() => { setTab('forgot'); setErrorMessage(null); }}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
              />
            </div>
          </div>

          {tab === 'register' && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Contributor Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('citizen')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    role === 'citizen'
                      ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">Community Reporter</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Report faults &amp; earn points</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('maintenance')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    role === 'maintenance'
                      ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-blue-600" />
                    <span>Maintenance</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Resolve &amp; verify repairs</div>
                </button>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {isLoading ? (
                <span>Processing...</span>
              ) : tab === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              ) : tab === 'register' ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>

          {tab === 'forgot' && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => { setTab('login'); setErrorMessage(null); }}
                className="text-xs text-slate-500 hover:text-slate-900 font-medium"
              >
                &larr; Back to Sign In
              </button>
            </div>
          )}

          <div className="pt-2 text-[10px] text-slate-400 text-center leading-relaxed">
            Passwords are cryptographically salted and hashed using SHA-256 before local persistence. Plaintext credentials are never saved.
          </div>
        </form>
      </div>
    </div>
  );
};
