import { HTMLAttributes, ReactNode } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hoverGlow?: boolean;
}

export default function GlassCard({ children, hoverGlow, className = '', ...rest }: GlassCardProps) {
  return (
    <div
      className={`card-vidro ${hoverGlow ? 'card-vidro-hover' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
