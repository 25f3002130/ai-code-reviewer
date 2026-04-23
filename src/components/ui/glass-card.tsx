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
        backdrop-blur-md bg-white/10 border border-white/20
        rounded-2xl shadow-xl
        ${hover ? 'transition-all duration-300 hover:bg-white/15 hover:scale-105 hover:shadow-2xl' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
