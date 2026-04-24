'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { signUp, signInWithGoogle, handleSignInRedirectResult } from '@/lib/firebase/auth';
import { useAuth } from '@/lib/firebase/auth-context';
import { GlassCard } from '@/components/ui/glass-card';
import { Code2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface AuthError extends Error {
  code?: string;
}

export default function SignUpPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && currentUser) {
      router.push('/chat');
    }
  }, [authLoading, currentUser, router]);

  // Handle redirect result on mount
  useEffect(() => {
    let cancelled = false;
    const handleRedirect = async () => {
      console.log('Checking for Google redirect result (signup)...');
      try {
        const user = await handleSignInRedirectResult(true);
        if (user && !cancelled) {
          console.log('Redirect result received (signup), navigating to chat');
          router.push('/chat');
        }
      } catch (err) {
        if (!cancelled) {
          const authError = err as AuthError;
          console.error('Redirect error (signup):', authError);
          setError(authError.message || 'Google sign in failed.');
        }
      }
    };
    handleRedirect();
    return () => { cancelled = true; };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      console.log('[SIGNUP] Calling signUp function...');
      const user = await signUp(email, password, name);
      console.log('[SIGNUP] signUp success, user:', user.uid);
      
      console.log('[SIGNUP] Attempting hard redirect to /chat/new...');
      // Use window.location for a hard redirect to ensure state is fresh and bypass routing issues
      window.location.href = '/chat/new';
    } catch (err) {
      const authError = err as AuthError;
      setError(
        authError.code === 'auth/email-already-in-use'
          ? 'Email already in use.'
          : authError.message || 'Sign up failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await signInWithGoogle(true);
      if (user) {
        window.location.href = '/chat/new';
      }
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message || 'Google sign in failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 font-black uppercase tracking-tighter">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-white flex items-center justify-center">
              <Code2 className="w-6 h-6 text-black" />
            </div>
            <span className="text-3xl font-black text-white">ZINC×NH</span>
          </Link>
          <h1 className="text-5xl font-black text-white leading-none">JOIN NOW</h1>
        </div>

        <GlassCard className="p-10 border-4">
          {error && (
            <div className="mb-8 p-6 bg-red-950/30 border-2 border-red-500 text-red-500 font-black text-xs shadow-[6px_6px_0px_0px_rgba(239,68,68,0.1)]">
              SYSTEM_ERROR // {error.toUpperCase()}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-zinc-500 mb-3 tracking-widest">DISPLAY NAME</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="YOUR NAME"
                className="w-full bg-zinc-900 border-2 border-zinc-800 px-5 py-4 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-white transition-all font-black"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-zinc-500 mb-3 tracking-widest">EMAIL ADDRESS</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="USER@EXAMPLE.COM"
                className="w-full bg-zinc-900 border-2 border-zinc-800 px-5 py-4 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-white transition-all font-black"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-zinc-500 mb-3 tracking-widest">PASSWORD</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-zinc-900 border-2 border-zinc-800 px-5 py-4 text-white placeholder-zinc-700 text-sm focus:outline-none focus:border-white transition-all font-black"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-500 hover:text-white transition-all uppercase tracking-widest"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-6 text-lg mt-4"
              isLoading={loading}
            >
              CREATE_ACCOUNT
            </Button>
          </form>

          <div className="my-10 flex items-center gap-4">
            <div className="flex-1 h-0.5 bg-zinc-800" />
            <span className="text-[10px] text-zinc-600 font-black">OR</span>
            <div className="flex-1 h-0.5 bg-zinc-800" />
          </div>

          <Button
            onClick={handleGoogle}
            variant="secondary"
            disabled={loading}
            className="w-full py-6"
          >
            CONTINUE_WITH_GOOGLE
          </Button>

          <p className="text-center text-[10px] text-zinc-500 mt-10 tracking-widest">
            ALREADY JOINED?{' '}
            <Link href="/signin" className="text-white hover:underline transition-all">
              SIGN IN
            </Link>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
