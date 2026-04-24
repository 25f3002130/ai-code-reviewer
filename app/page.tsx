'use client';

import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { GLSLHills } from '@/components/ui/glsl-hills';
import { Button } from '@/components/ui/button';
import { Cpu, Zap, Shield, Search, Terminal, Code2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  const handleSignUp = () => {
    router.push('/signup');
  };

  const handleSignIn = () => {
    router.push('/signin');
  };

  return (
    <main className="min-h-screen bg-black flex flex-col relative overflow-x-hidden">
      {/* Background - GLSL Hills */}
      <div className="absolute inset-0 z-0 bg-black overflow-hidden pointer-events-none">
        <GLSLHills />
      </div>
      
      <Navbar onSignUp={handleSignUp} onSignIn={handleSignIn} />

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-6 pt-20 pb-20">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white mb-8 tracking-tighter leading-none uppercase">
              ZINC
              <span className="text-zinc-600 mx-2">{"×"}</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">
                NH
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium uppercase tracking-tight">
              INSTANT CODE ANALYSIS. BUG DETECTION. PERFORMANCE OPTIMIZATION.
              SHIP FASTER WITH AI-DRIVEN INSIGHTS.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-20">
              <Button
                onClick={handleSignUp}
                size="lg"
                className="text-xl py-8 px-12 border-4"
              >
                Get Started
              </Button>
              <Button
                onClick={handleSignIn}
                variant="secondary"
                size="lg"
                className="text-xl py-8 px-12 border-4"
              >
                Sign In
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 px-6 bg-black border-t-4 border-white relative z-20">
          <div className="max-w-7xl mx-auto">
            <div className="mb-20">
              <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4">
                {`FEATURES_LOG // 01`}
              </h2>
              <div className="w-24 h-2 bg-white"></div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Cpu className="w-8 h-8" />,
                  title: "MULTI_MODEL_AI",
                  desc: "Switch between Gemini 2.0 and Groq Llama 3.3 for diverse perspectives and high-speed analysis."
                },
                {
                  icon: <Zap className="w-8 h-8" />,
                  title: "REAL_TIME_FEEDBACK",
                  desc: "Get instant results as you type. No waiting for manual reviews or slow build pipelines."
                },
                {
                  icon: <Shield className="w-8 h-8" />,
                  title: "INDUSTRIAL_SECURITY",
                  desc: "Firestore-backed session security and encryption for your sensitive source code."
                }
              ].map((feature, i) => (
                <div key={i} className="p-8 border-4 border-white bg-zinc-950 hover:bg-white hover:text-black transition-all group shadow-[10px_10px_0px_0px_rgba(255,255,255,0.1)]">
                  <div className="mb-6 text-white group-hover:text-black">{feature.icon}</div>
                  <h3 className="text-xl font-black mb-4 tracking-tighter uppercase text-white group-hover:text-black">{feature.title}</h3>
                  <p className="text-sm font-medium leading-relaxed text-white group-hover:text-black">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-32 px-6 bg-white border-t-4 border-black relative z-20 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="mb-20">
              <h2 className="text-4xl md:text-6xl font-black text-black uppercase tracking-tighter mb-4">
                {`WORKFLOW_PROTOCOL // 02`}
              </h2>
              <div className="w-24 h-2 bg-black"></div>
            </div>

            <div className="space-y-12">
              {[
                {
                  step: "01",
                  icon: <Terminal className="w-10 h-10" />,
                  title: "INPUT_SOURCE",
                  desc: "Paste your code snippet or logic request into the industrial-grade terminal interface."
                },
                {
                  step: "02",
                  icon: <Search className="w-10 h-10" />,
                  title: "SELECT_BRAIN",
                  desc: "Choose from our available high-speed AI models or use AUTO_FALLBACK for guaranteed results."
                },
                {
                  step: "03",
                  icon: <Code2 className="w-10 h-10" />,
                  title: "REVIEW_DATA",
                  desc: "Receive instant, mentored feedback focusing on logic, syntax, and actionable improvements."
                }
              ].map((step, i) => (
                <div key={i} className="flex flex-col md:flex-row items-center gap-12 p-8 border-4 border-black group hover:bg-black hover:text-white transition-all">
                  <div className="text-6xl font-black text-zinc-200 group-hover:text-zinc-800">{step.step}</div>
                  <div className="p-4 bg-black text-white group-hover:bg-white group-hover:text-black border-4 border-black">{step.icon}</div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-black mb-2 tracking-tighter uppercase">{step.title}</h3>
                    <p className="text-sm font-bold opacity-70 uppercase tracking-tight">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Nilgiri House CTA */}
        <section className="py-32 px-6 bg-black border-t-4 border-white text-center relative z-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-8 leading-tight">
              MADE BY<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">{`NILGIRI HOUSE // IIT MADRAS`}</span>
            </h2>
            <Button
              onClick={handleSignUp}
              className="py-10 px-16 text-2xl border-4"
            >
              START_REVIEWING_NOW
            </Button>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
