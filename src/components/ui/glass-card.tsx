import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className = '', hover = false }: GlassCardProps) {
  return (
    <div
      className={`
        bg-black border-2 border-white
        ${hover ? 'transition-all duration-300 hover:bg-zinc-900 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
