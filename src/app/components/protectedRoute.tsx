// 'use client';
// import { ReactNode, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '../context/AuthContext';

// interface ProtectedRouteProps {
//   children: ReactNode;
//   requireAdmin?: boolean;
// }

// export default function ProtectedRoute({ 
//   children, 
//   requireAdmin = false 
// }: ProtectedRouteProps) {
//   const { user, isAdmin, loading } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     if (!loading) {
//       if (!user) {
//         router.push('/login');
//       } else if (requireAdmin && !isAdmin) {
//         router.push('/access-denied'); // Create this page for unauthorized access
//       }
//     }
//   }, [user, isAdmin, loading, router, requireAdmin]);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="w-12 h-12 border-t-4 border-var(--fontdark) rounded-full animate-spin"></div>
//       </div>
//     );
//   }

//   // Only render children if authenticated and authorization checks pass
//   if (!user || (requireAdmin && !isAdmin)) {
//     return null; // Don't render anything while redirecting
//   }

//   return <>{children}</>;
// }

'use client';
import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false
}: ProtectedRouteProps) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [fadeIn, setFadeIn] = useState(false);
  
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (requireAdmin && !isAdmin) {
        router.push('/access-denied');
      } else {
        // Start fade-in animation when auth checks pass
        const timer = setTimeout(() => {
          setFadeIn(true);
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [user, isAdmin, loading, router, requireAdmin]);

  // Show a smooth loading spinner while authenticating
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-t-4 border-var(--fontdark) rounded-full animate-[spin_1.5s_linear_infinite]"></div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!user || (requireAdmin && !isAdmin)) {
    return null;
  }

  // Render children with fade-in effect
  return (
    <div 
      style={{ 
        opacity: fadeIn ? 1 : 0,
        transition: 'opacity 1500ms ease-in-out'
      }}
    >
      {children}
    </div>
  );
}