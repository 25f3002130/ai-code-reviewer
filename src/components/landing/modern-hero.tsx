'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';
import { Code2, Bug, Lightbulb, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface ModernHeroProps {
  onGetStarted: () => void;
}

export function ModernHero({ onGetStarted }: ModernHeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        {/* Gradient orbs */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, 100, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/15 rounded-full blur-3xl"
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6">
        <div className="text-center max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <GlassCard className="inline-flex items-center gap-2 px-4 py-2 mb-8">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-300 font-medium">Powered by Gemini & Groq AI</span>
            </GlassCard>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight"
          >
            Review Code{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-gray-400 to-gray-300">
              at the Speed
            </span>
            <br />
            of AI
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            Get instant, intelligent feedback on your code. Catch bugs, improve quality,
            and learn best practices with AI-driven analysis.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <button
              onClick={onGetStarted}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-gray-600 rounded-full text-white font-semibold text-lg shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-300"
            >
              Start Reviewing Code
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-3 text-gray-300 hover:text-white transition-colors"
            >
              Learn more
              <ArrowRight className="w-4 h-4 rotate-90" />
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Free to use
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              No signup required
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Instant results
            </span>
          </motion.div>
        </div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mt-32"
          id="features"
        >
          <FeatureCard
            icon={<Code2 className="w-7 h-7 text-cyan-400" />}
            gradient="from-cyan-500/20 to-cyan-600/20"
            title="Deep Code Analysis"
            description="Understand code structure, patterns, and architecture. Get insights into complexity and maintainability."
          />
          <FeatureCard
            icon={<Bug className="w-7 h-7 text-red-400" />}
            gradient="from-red-500/20 to-red-600/20"
            title="Bug Detection"
            description="Catch bugs, vulnerabilities, and edge cases before they reach production. Sleep better at night."
          />
          <FeatureCard
            icon={<Lightbulb className="w-7 h-7 text-gray-400" />}
            gradient="from-gray-500/20 to-gray-600/20"
            title="Smart Suggestions"
            description="Get actionable recommendations to improve performance, readability, and follow best practices."
          />
        </motion.div>

        {/* Code Example Section */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-32 max-w-4xl mx-auto"
          id="how-it-works"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              See It in Action
            </h2>
            <p className="text-gray-400 text-lg">
              Paste your code and get instant feedback
            </p>
          </div>

          <GlassCard className="p-1">
            <div className="bg-slate-900/80 rounded-xl overflow-hidden">
              {/* Fake window controls */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-white/10">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              {/* Fake code preview */}
              <div className="p-6 font-mono text-sm">
                <div className="text-gray-500">{'// Paste any code and get instant AI feedback'}</div>
                <div className="text-gray-400 mt-4">function <span className="text-yellow-300">analyzeCode</span>(<span className="text-cyan-300">code</span>) {'{'}</div>
                <div className="text-gray-400 pl-4">{'// AI will review for bugs, style, and best practices'}</div>
                <div className="text-gray-400 pl-4">{'// Supports TypeScript, Python, Go, Rust, and more'}</div>
                <div className="text-gray-400">{'}'}</div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
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

interface FeatureCardProps {
  icon: React.ReactNode;
  gradient: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, gradient, title, description }: FeatureCardProps) {
  return (
    <GlassCard hover className="p-6 group">
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </GlassCard>
  );
}
