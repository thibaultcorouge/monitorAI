'use client';
import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface TransitionLayoutProps {
  children: ReactNode;
}

export default function TransitionLayout({ children }: TransitionLayoutProps) {
  const [fadeIn, setFadeIn] = useState(false);
  const pathname = usePathname();
  
  // Reset fade state on route change
  useEffect(() => {
    setFadeIn(false);
    
    // Start fade-in after a short delay
    const timer = setTimeout(() => {
      setFadeIn(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [pathname]); // Re-run effect when route changes
  
  return (
    <div 
      style={{ 
        opacity: fadeIn ? 1 : 0,
        transition: 'opacity 800ms ease-in-out'
      }}
    >
      {children}
    </div>
  );
}