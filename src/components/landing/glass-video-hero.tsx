'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';
import { Code2, Bug, Lightbulb, Zap } from 'lucide-react';

interface GlassVideoHeroProps {
  onGetStarted: () => void;
}

export function GlassVideoHero({ onGetStarted }: GlassVideoHeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3Crect fill='%230f172a' width='1920' height='1080'/%3E%3C/svg%3E"
        >
          <source
            src="https://cdn.coverr.co/videos/coverr-digital-network-lines-5075/1080p.mp4"
            type="video/mp4"
          />
        </video>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-slate-900/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <GlassCard className="inline-flex items-center gap-2 px-4 py-2 mb-6">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-300">AI-Powered Code Analysis</span>
            </GlassCard>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6"
          >
            AI-Powered{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              Code Reviews
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-300 max-w-2xl mx-auto mb-8"
          >
            Get instant, intelligent feedback on your code. Identify bugs, improve quality,
            and learn best practices with AI-driven analysis.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <button
              onClick={onGetStarted}
              className="group relative inline-flex items-center gap-2 px-8 py-4
                bg-gradient-to-r from-cyan-500 to-purple-600
                rounded-full text-white font-semibold text-lg
                shadow-lg shadow-cyan-500/25
                transition-all duration-300
                hover:shadow-cyan-500/50 hover:scale-105"
            >
              Start Reviewing Code
              <Code2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>
          </motion.div>
        </div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          <GlassCard hover className="p-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 flex items-center justify-center mb-4">
              <Code2 className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Code Analysis</h3>
            <p className="text-gray-400">
              Deep analysis of your code structure, patterns, and potential issues.
            </p>
          </GlassCard>

          <GlassCard hover className="p-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center mb-4">
              <Bug className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Bug Detection</h3>
            <p className="text-gray-400">
              Catch bugs and vulnerabilities before they reach production.
            </p>
          </GlassCard>

          <GlassCard hover className="p-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center mb-4">
              <Lightbulb className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Smart Suggestions</h3>
            <p className="text-gray-400">
              Get actionable recommendations to improve code quality and performance.
            </p>
          </GlassCard>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-3 bg-white/50 rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
}
