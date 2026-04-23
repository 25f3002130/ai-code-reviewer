'use client';

import { Code2 } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="relative z-10 border-t-2 border-white bg-black py-20">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white flex items-center justify-center">
                <Code2 className="w-6 h-6 text-black" />
              </div>
              <span className="text-2xl font-black text-white uppercase tracking-tighter">ZINC×NH</span>
            </Link>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-sm font-bold uppercase tracking-tight">
              INDUSTRIAL CODE ANALYSIS. 
              POWERED BY NILGIRI HOUSE.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-black uppercase text-xs tracking-widest mb-6">Product</h4>
            <ul className="space-y-4">
              <li>
                <Link href="#features" className="text-zinc-500 hover:text-white transition-colors uppercase text-xs font-black tracking-widest">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="text-zinc-500 hover:text-white transition-colors uppercase text-xs font-black tracking-widest">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Nilgiri House */}
          <div>
            <h4 className="text-white font-black uppercase text-xs tracking-widest mb-6">Nilgiri House</h4>
            <ul className="space-y-4">
              <li>
                <a 
                  href="https://nilgiri.iitmbs.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-white transition-colors uppercase text-xs font-black tracking-widest"
                >
                  nilgiri.iitmbs.org
                </a>
              </li>
              <li className="text-zinc-600 uppercase text-[10px] font-black tracking-widest leading-relaxed">
                Made by Nilgiri WebOps Team
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-white/10 text-center space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
            MADE BY NILGIRI HOUSE // IIT MADRAS
          </p>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
            &copy; {new Date().getFullYear()} ZINC×NH. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
}
