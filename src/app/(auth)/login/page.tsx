'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  KeyRound,
  Mail,
  User,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const demoEmail = process.env.NEXT_PUBLIC_DEMO_OPERATOR_EMAIL || '';
  const demoPassword = process.env.NEXT_PUBLIC_DEMO_OPERATOR_PASSWORD || '';
  const defaultName = process.env.NEXT_PUBLIC_DEFAULT_OPERATOR_NAME || 'Alex Henderson';

  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [emailValue, setEmailValue] = useState(demoEmail);
  const [passwordValue, setPasswordValue] = useState(demoPassword);
  const [fullNameValue, setFullNameValue] = useState('');

  function fillDemoCredentials() {
    setEmailValue(demoEmail);
    setPasswordValue(demoPassword);
    setIsSignUp(false);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanEmail = emailValue.trim().toLowerCase();
    const cleanPassword = passwordValue.trim();

    try {
      const supabase = createClient();

      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: {
              full_name: fullNameValue.trim() || 'Operator',
            },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          setIsLoading(false);
          return;
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (signInError) {
          setError(signInError.message);
          setIsLoading(false);
          return;
        }

        if (!data?.session) {
          setError('No session returned. Please check email confirmation.');
          setIsLoading(false);
          return;
        }
      }

      // Hard redirect to dashboard ensures fresh session cookies are loaded
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center p-4">
      <div className="relative z-10 w-full max-w-md">
        {/* Top Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-slate-300 hover:text-white mb-6 font-medium transition-colors group pl-1"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Back to Landing</span>
        </Link>

        {/* Smoked Transparent Frosted Glass Card */}
        <GlassCard className="p-8 sm:p-9 shadow-[0_30px_70px_rgba(0,0,0,0.6)]">
          {/* Brand Header */}
          <div className="flex items-center gap-3.5 mb-7">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#c8f135] to-[#22d3ee] flex items-center justify-center text-slate-950 shadow-[0_0_20px_rgba(200,241,53,0.4)]">
              <Zap className="w-5 h-5 fill-slate-950 text-slate-950" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white">
                {isSignUp ? 'Create Operator Profile' : 'Operator Portal'}
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                {isSignUp
                  ? 'Register identity in Supabase Auth'
                  : 'Sign in to access automotive operations'}
              </p>
            </div>
          </div>

          {/* Frosted Toggle Capsule */}
          <div className="flex rounded-full glass-panel-inset p-1 mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError(null);
              }}
              className={`flex-1 py-2 rounded-full transition-all duration-200 cursor-pointer ${
                !isSignUp
                  ? 'glass-pill-active text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setError(null);
              }}
              className={`flex-1 py-2 rounded-full transition-all duration-200 cursor-pointer ${
                isSignUp
                  ? 'glass-pill-active text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register
            </button>
          </div>

          {/* Quick Auto-Fill Seeded Credentials Pod */}
          {!isSignUp && (
            <div className="mb-5 flex items-center justify-between p-3 rounded-[20px] glass-panel-inset text-xs">
              <span className="text-slate-300 font-medium text-[11px]">
                Demo Operator Account:
              </span>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="px-3.5 py-1 rounded-full bg-[#c8f135] hover:bg-[#bde827] text-slate-950 text-[11px] font-bold transition-all shadow-[0_0_15px_rgba(200,241,53,0.35)] cursor-pointer"
              >
                Auto Fill
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/35 text-rose-200 text-xs flex items-start gap-2.5 backdrop-blur-md animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-300" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5 pl-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    name="fullName"
                    type="text"
                    value={fullNameValue}
                    onChange={(e) => setFullNameValue(e.target.value)}
                    placeholder={defaultName}
                    required
                    className="w-full pl-11 pr-4 py-3 text-xs text-white placeholder-slate-400 glass-panel-inset rounded-2xl focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5 pl-1">
                Operator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  name="email"
                  type="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  placeholder={demoEmail || 'operator@company.com'}
                  required
                  className="w-full pl-11 pr-4 py-3 text-xs text-white placeholder-slate-400 glass-panel-inset rounded-2xl focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5 pl-1">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  placeholder="••••••••••••"
                  minLength={6}
                  required
                  className="w-full pl-11 pr-11 py-3 text-xs text-white placeholder-slate-400 glass-panel-inset rounded-2xl focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all"
                />

                {/* Show/Hide Password Eye Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-3 p-1 text-slate-400 hover:text-white transition-colors cursor-pointer rounded-lg"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-[#c8f135]" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Capsule Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3 px-5 rounded-full bg-white/[0.14] hover:bg-white/[0.22] text-white text-xs font-bold border border-white/25 shadow-[0_4px_25px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : isSignUp ? (
                'Register Operator'
              ) : (
                'Sign In to OpsPilot'
              )}
            </button>
          </form>

          {/* Secure Sync Indicator */}
          <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-center text-[11px] text-slate-300 gap-2">
            <Shield className="w-3.5 h-3.5 text-[#c8f135]" />
            <span>Supabase Session Authentication</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
