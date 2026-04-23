'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Settings, LogOut, X, AlertTriangle, ShieldCheck, Unlink } from 'lucide-react';
import { signOut, updateDisplayName, updateEmail, updatePassword, linkEmailPassword, unlinkGoogle } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase/config';

export function UserMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Form states
  const [name, setName] = useState(auth.currentUser?.displayName || '');
  const [email, setEmail] = useState(auth.currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isGoogleUser = auth.currentUser?.providerData.some(p => p.providerId === 'google.com') || false;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push('/signin');
  };

  const handleUnlinkGoogle = async () => {
    if (!password) {
      setError('SET_PASSWORD_FIRST // YOU_MUST_CREATE_A_PASSWORD_BEFORE_UNLINKING_GOOGLE.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // First link the email/password to the account
      await linkEmailPassword(email, password);
      // Then unlink Google
      await unlinkGoogle();
      setSuccess('GOOGLE_UNLINKED // YOUR_ACCOUNT_IS_NOW_PROTECTED_BY_PASSWORD.');
      setPassword('');
      setCurrentPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'UNLINK_FAILED';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (name !== auth.currentUser?.displayName) {
        await updateDisplayName(name);
      }
      if (email !== auth.currentUser?.email) {
        await updateEmail(email, currentPassword);
      }
      if (password) {
        await updatePassword(password, currentPassword);
      }
      setSuccess('PROFILE_UPDATED_SUCCESSFULLY');
      setPassword('');
      setCurrentPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'UPDATE_FAILED';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 border-2 border-white text-white hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
      >
        <Menu className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-64 bg-black border-4 border-white shadow-[10px_10px_0px_0px_rgba(255,255,255,0.1)] z-50">
          <div className="p-4 border-b-2 border-zinc-800">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">LOGGED_IN_AS</p>
            <p className="text-xs font-black text-white truncate uppercase">{auth.currentUser?.displayName || 'ANONYMOUS_USER'}</p>
          </div>

          <button
            onClick={() => { setShowSettings(true); setIsOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-4 text-xs font-black text-white hover:bg-white hover:text-black transition-all uppercase tracking-widest"
          >
            <Settings className="w-4 h-4" />
            USER_SETTINGS
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-4 text-xs font-black text-red-500 hover:bg-red-600 hover:text-white transition-all uppercase tracking-widest border-t-2 border-zinc-800"
          >
            <LogOut className="w-4 h-4" />
            SYSTEM_LOGOUT
          </button>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-black border-4 border-white shadow-[20px_20px_0px_0px_rgba(255,255,255,0.1)]">
            <div className="p-6 border-b-4 border-white flex items-center justify-between">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                <Settings className="w-6 h-6" />
                ZINC×NH // ACCOUNT_CONFIGURATION
              </h2>
              <button onClick={() => setShowSettings(false)} className="text-white hover:text-zinc-400 transition-colors">
                <X className="w-8 h-8" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
              {error && (
                <div className="p-4 bg-red-950/30 border-2 border-red-500 text-red-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  ERROR // {error}
                </div>
              )}
              {success && (
                <div className="p-4 bg-zinc-900 border-2 border-white text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  STATUS // {success}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 mb-2 tracking-widest">DISPLAY_NAME</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-900 border-2 border-zinc-800 px-4 py-3 text-white text-xs font-black focus:outline-none focus:border-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 mb-2 tracking-widest">EMAIL_ID</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-900 border-2 border-zinc-800 px-4 py-3 text-white text-xs font-black focus:outline-none focus:border-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 mb-2 tracking-widest">
                    {isGoogleUser ? 'SET_ACCOUNT_PASSWORD' : 'NEW_PASSWORD'}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isGoogleUser ? "CREATE A PASSWORD" : "LEAVE BLANK TO KEEP"}
                    className="w-full bg-zinc-900 border-2 border-zinc-800 px-4 py-3 text-white text-xs font-black focus:outline-none focus:border-white transition-all"
                  />
                </div>
                {!isGoogleUser && (
                  <div>
                    <label className="block text-[10px] font-black text-white mb-2 tracking-widest">CURRENT_PASSWORD*</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required={(email !== auth.currentUser?.email) || password.length > 0}
                      placeholder="REQUIRED FOR UPDATES"
                      className="w-full bg-zinc-900 border-2 border-white px-4 py-3 text-white text-xs font-black focus:outline-none focus:ring-1 focus:ring-white transition-all"
                    />
                  </div>
                )}
              </div>

              {isGoogleUser && (
                <div className="pt-4 border-t-2 border-zinc-800">
                  <button
                    type="button"
                    onClick={handleUnlinkGoogle}
                    disabled={loading || !password}
                    className="w-full flex items-center justify-center gap-3 px-4 py-4 border-2 border-white text-white font-black text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Unlink className="w-4 h-4" />
                    UNLINK_GOOGLE_ACCOUNT
                  </button>
                  <p className="text-[9px] font-black text-zinc-500 mt-2 tracking-widest text-center">
                    YOU_MUST_SET_A_PASSWORD_FIRST // THEN_UNLINK_TO_ENABLE_DELETION
                  </p>
                </div>
              )}

              <div className="pt-6 border-t-2 border-zinc-800 flex flex-col md:flex-row gap-4">
                <Button type="submit" disabled={loading} className="flex-1 py-4">
                  {loading ? 'PROCESSING...' : 'SAVE_CHANGES'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
