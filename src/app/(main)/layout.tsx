'use client';
import { ReactNode } from 'react';
import ProtectedRoute from '../components/protectedRoute';
import Navbar from '../components/ui/Navbar';
import Footer from '../components/ui/Footer';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
        <Navbar />
      {children}
      <Footer />
    </ProtectedRoute>
  );
}