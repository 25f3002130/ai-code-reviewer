'use client';

import { motion } from 'framer-motion';

import { Code2, Menu, X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  onSignUp: () => void;
  onSignIn: () => void;
}

export function Navbar({ onSignUp, onSignIn }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-4"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 bg-black border-2 border-white shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-white flex items-center justify-center">
              <Code2 className="w-6 h-6 text-black" />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter uppercase">
              ZINC×NH
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            <Link href="#features" className="text-xs font-black text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-xs font-black text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">
              How It Works
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={onSignIn}
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
            >
              Sign In
            </Button>
            <Button
              onClick={onSignUp}
              size="sm"
              className="hidden sm:inline-flex"
            >
              Get Started
            </Button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 pt-4 border-t border-white/10"
          >
            <div className="flex flex-col gap-4">
              <Link href="#features" className="text-gray-300 hover:text-white transition-colors uppercase text-xs font-black tracking-widest">
                Features
              </Link>
              <Link href="#how-it-works" className="text-gray-300 hover:text-white transition-colors uppercase text-xs font-black tracking-widest">
                How It Works
              </Link>
              <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                <Button
                  onClick={onSignIn}
                  variant="secondary"
                  className="w-full"
                >
                  Sign In
                </Button>
                <Button
                  onClick={onSignUp}
                  className="w-full"
                >
                  Sign Up
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
