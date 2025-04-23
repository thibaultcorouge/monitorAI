// app/layout.tsx
import './globals.css';
import { AuthProvider } from './context/AuthContext';

export const metadata = {
  title: 'Cognivis',
  description: 'Latest news and update',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}