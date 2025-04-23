// components/ui/Navbar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => {
    return pathname === path ? 'nav-menu-isactive' : 'nav-menu-hover';
  };

  return (
    <nav className="bg-greenwhite shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/home" className="text-2xl font-bold text-fontdark">
              <Image 
              src="/images/logo-cognivis.png" 
              alt="logo Cognivis" 
              width={150} 
              height={150} 
              className="opacity-40"
              >
              </Image>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link 
                href="/home" 
                className={`inline-flex nav-menu items-center px-1 pt-1 border-b-2 ${
                  pathname === '/home' ? '' : 'border-transparent'
                } ${isActive('/home')}`}
              >
                Accueil
              </Link>
              <Link 
                href="/profil" 
                className={`inline-flex nav-menu items-center px-1 pt-1 border-b-2 ${
                  pathname === '/profil' ? '' : 'border-transparent'
                } ${isActive('/profil')}`}
              >
                Profil
              </Link>
              <Link 
                href="/contact" 
                className={`inline-flex nav-menu items-center px-1 pt-1 border-b-2 ${
                  pathname === '/contact' ? '' : 'border-transparent'
                } ${isActive('/contact')}`}
              >
                Contact
              </Link>
              {isAdmin && (
                <Link 
                  href="/admin" 
                  className={`inline-flex nav-menu items-center px-1 pt-1 border-b-2 ${
                    pathname.startsWith('/admin') ? '' : 'border-transparent'
                  } ${pathname.startsWith('/admin') ? 'nav-menu-isactive' : 'nav-menu-hover'}`}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-transparent  font-bold rounded-md shadow-sm text-white bg-darkgreenbutton bg-darkgreenbutton-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Se Déconnecter
              </button>
            ) : (
              <Link 
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent font-bold rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Se Connecter
              </Link>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/home"
              className={`block pl-3 pr-4 py-2 border-l-4 ${
                pathname === '/home' ? 'nav-menu' : 'border-transparent'
              } ${isActive('/home')}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Accueil
            </Link>
            <Link
              href="/profil"
              className={`block pl-3 pr-4 py-2 border-l-4 ${
                pathname === '/profil' ? 'nav-menu' : 'border-transparent'
              } ${isActive('/profil')}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Profil
            </Link>
            <Link
              href="/contact"
              className={`block pl-3 pr-4 py-2 border-l-4 ${
                pathname === '/contact' ? 'nav-menu' : 'border-transparent'
              } ${isActive('/contact')}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className={`block pl-3 pr-4 py-2 border-l-4 ${
                  pathname.startsWith('/admin') ? 'border-blue-500 bg-blue-50' : 'border-transparent'
                } ${pathname.startsWith('/admin') ? 'text-blue-600 font-bold' : 'text-gray-700 hover:text-blue-600'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Admin
              </Link>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              {user ? (
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="mt-1 block w-full px-4 py-2 text-center bg-darkgreenbutton rounded "
                >
                  Se Déconnecter
                </button>
              ) : (
                <Link
                  href="/login"
                  className="mt-1 block w-full px-4 py-2 text-center text-white bg-blue-600 rounded hover:bg-blue-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Se Connecter
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}