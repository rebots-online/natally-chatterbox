import React, { useState } from 'react';
import { NatallyIcon } from './NatallyIcon';
import { X, LogIn, UserPlus, LogOut, Phone, Mail, ShieldCheck } from 'lucide-react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from '../services/firebase';
import { User } from 'firebase/auth';

interface AuthModalProps {
  user: User | null;
  onClose: () => void;
  /** Redo onboarding: clears the stored intake and reopens it. */
  onReonboard?: () => void;
  required?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ user, onClose, onReonboard, required = false }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'phone'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
      const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(result);
    } catch (err: any) {
      setError(err.message || 'Phone verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setError(null);
    setLoading(true);
    try {
      await confirmationResult.confirm(verificationCode);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={user ? 'Account settings' : 'Sign in to Natally'} className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="celestial-panel w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl p-5 border border-[#d4af37]/40 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#322641] pb-3">
          <div className="flex items-center gap-2">
            <NatallyIcon size="header" />
            <h3 className="font-cinzel text-sm text-[#f2ca50] font-bold tracking-wider uppercase">
              {user ? 'Account Settings' : 'Readings by Natally'}
            </h3>
          </div>
          {!required && <button
            type="button"
            aria-label="Close account dialog"
            onClick={onClose}
            className="p-1 rounded hover:bg-[#271c36] text-[#a99dae] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>}
        </div>

        {!user && <div className="space-y-2 text-sm text-[#f1e8d8]">
          <p>Sign in or create your account before introducing yourself to Natally.</p>
          <p>Create your free account for your Natally profile and personal continuity. Signing up does not buy anything or start a subscription.</p>
          <p className="text-xs text-[#a99dae]">Readings and conversation memories currently stay on this device; full cross-device memory sync is not available yet. Any paid reading or prepaid conversation pack requires a separate, explicit purchase when available.</p>
          <details className="text-xs text-[#a99dae] space-y-2">
            <summary className="cursor-pointer text-[#f2ca50]">Storage and credit choices being completed</summary>
            <p><strong>This device only:</strong> profile and lore stay in this browser, without Firebase sync. Purchased credits will be usable only on this device. Clearing browser data or losing the device can remove your history and access.</p>
            <p><strong>Account + sync:</strong> keep device copies and sync through Firebase to your other signed-in devices. Account credits will be available across those devices.</p>
            <p>These complete storage choices and credit packs are not live yet. Hosted readings send the necessary context to the model provider in either mode.</p>
          </details>
        </div>}

        {error && (
          <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-mono">
            {error}
          </div>
        )}

        {user ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1c1428] border border-[#322641]">
              <div className="w-10 h-10 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center font-bold text-sm text-[#f2ca50]">
                {user.displayName?.[0] || user.email?.[0] || 'U'}
              </div>
              <div className="min-w-0">
                <p className="font-cinzel text-xs text-white font-semibold truncate">
                  {onReonboard && (
                    <button
                      type="button"
                      onClick={onReonboard}
                      className="w-full mb-2 px-3 py-2 rounded-lg bg-[#241838] hover:bg-[#342452] border border-[#d4af37]/40 text-[#f2ca50] font-mono text-xs transition-colors cursor-pointer"
                    >
                      ✨ Re-introduce yourself to Natally (redo onboarding)
                    </button>
                  )}
                  {user.displayName || 'Astrolabe Pilgrim'}
                </p>
                <p className="font-mono text-[11px] text-[#a99dae] truncate">
                  {user.email || user.phoneNumber || user.uid}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full py-2 px-4 rounded-lg bg-[#271c36] hover:bg-[#342452] border border-red-500/30 text-red-300 font-mono text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out of Account</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Social Google Login Button */}
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-xl bg-[#271c36] hover:bg-[#342452] border border-[#d4af37]/40 text-[#f1e8d8] font-mono text-xs font-semibold flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.9 6.4C.7 8.8 0 10.3 0 12s.7 3.2 1.9 5.6l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16c1.8 3.8 5.6 7 10.1 7z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#322641] w-full" />
              <span className="bg-[#1c1428] px-2 font-mono text-[10px] text-[#a99dae] uppercase tracking-wider absolute">
                or with email / phone
              </span>
            </div>

            {/* Mode switch tabs */}
            <div className="grid grid-cols-3 gap-1 bg-[#1c1428] p-1 rounded-lg border border-[#322641]">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`py-1 rounded text-xs font-mono transition-colors ${
                  mode === 'login'
                    ? 'bg-[#271c36] text-[#f2ca50] font-semibold'
                    : 'text-[#a99dae] hover:text-white'
                }`}
              >
                Email Log In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`py-1 rounded text-xs font-mono transition-colors ${
                  mode === 'signup'
                    ? 'bg-[#271c36] text-[#f2ca50] font-semibold'
                    : 'text-[#a99dae] hover:text-white'
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => setMode('phone')}
                className={`py-1 rounded text-xs font-mono transition-colors ${
                  mode === 'phone'
                    ? 'bg-[#271c36] text-[#9fb4ff] font-semibold'
                    : 'text-[#a99dae] hover:text-white'
                }`}
              >
                Phone
              </button>
            </div>

            {/* Email form */}
            {mode !== 'phone' ? (
              <form onSubmit={handleEmailAuth} className="space-y-3">
                <div>
                  <label className="block font-mono text-[10px] text-[#a99dae] mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-[#a99dae] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="pilgrim@cosmos.org"
                      className="talisman-input w-full rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[10px] text-[#a99dae] mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="talisman-input w-full rounded-lg px-3 py-1.5 text-xs font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 rounded-lg bg-[#d4af37] hover:bg-[#e5c247] text-[#120c1c] font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {mode === 'signup' ? <UserPlus className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
                  <span>{mode === 'signup' ? 'Create Account' : 'Log In'}</span>
                </button>
              </form>
            ) : (
              /* Phone number form */
              <div className="space-y-3">
                {!confirmationResult ? (
                  <form onSubmit={handleSendPhoneCode} className="space-y-3">
                    <div>
                      <label className="block font-mono text-[10px] text-[#a99dae] mb-1">
                        Phone Number (E.164, e.g. +14155552671)
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-[#a99dae] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+1 555 123 4567"
                          className="talisman-input w-full rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono"
                          required
                        />
                      </div>
                    </div>
                    <div id="recaptcha-container" />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2 px-4 rounded-lg bg-[#9fb4ff] hover:bg-[#b0c2ff] text-[#120c1c] font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Send SMS Verification Code</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyPhoneCode} className="space-y-3">
                    <div>
                      <label className="block font-mono text-[10px] text-[#a99dae] mb-1">
                        6-Digit Verification Code
                      </label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="123456"
                        className="talisman-input w-full rounded-lg px-3 py-1.5 text-xs font-mono text-center tracking-widest text-lg"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2 px-4 rounded-lg bg-[#d4af37] hover:bg-[#e5c247] text-[#120c1c] font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Verify &amp; Log In</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
