import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.scss';           // ← .scss not .css
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ThemeInitializer from '@/components/ThemeInitializer';
import { SocketProvider } from '@/contexts/SocketContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'N-10 Wings — E-Sports Management',
  description: 'The ultimate E-Sports Development and Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SocketProvider>
          <ThemeInitializer />
          <Navbar />
          {children}
          <Footer />
        </SocketProvider>
      </body>
    </html>
  );
}