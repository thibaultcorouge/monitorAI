// (pages)/admin/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/home');
    }
  }, [isAdmin, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Don't render anything, we're redirecting
  }

  const isActive = (path: string) => {
    return pathname === path ? 'bg-blue-700' : 'hover:bg-blue-600';
  };

  return (
    <div className="flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-blue-800 text-white p-4">
        <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
        <nav>
          <ul className="space-y-2">
            <li>
              <Link
                href="/admin"
                className={`block py-2 px-4 rounded ${isActive('/admin')}`}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/admin/users"
                className={`block py-2 px-4 rounded ${isActive('/admin/users')}`}
              >
                User Management
              </Link>
            </li>
            <li>
              <Link
                href="/admin/articles"
                className={`block py-2 px-4 rounded ${isActive('/admin/articles')}`}
              >
                Article Management
              </Link>
            </li>
            <li>
              <Link
                href="/admin/rssfeeds"
                className={`block py-2 px-4 rounded ${isActive('/admin/rssfeeds')}`}
              >
                RSS Feeds Management
              </Link>
            </li>
            <li>
              <Link
                href="/admin/generickeywords"
                className={`block py-2 px-4 rounded ${isActive('/admin/generickeywords')}`}
              >
                Generic Keywords Management
              </Link>
            </li>
            <li>
              <Link
                href="/admin/categorykeywords"
                className={`block py-2 px-4 rounded ${isActive('/admin/categorykeywords')}`}
              >
                Category Keywords Management
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-gray-100 min-h-screen">
        {children}
      </main>
    </div>
  );
}