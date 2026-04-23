'use client';

import { useRouter } from 'next/navigation';
import { GlassVideoHero } from '@/components/landing/glass-video-hero';

export default function Home() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/chat/new');
  };

  return (
    <main className="min-h-screen">
      <GlassVideoHero onGetStarted={handleGetStarted} />
    </main>
  );
}
