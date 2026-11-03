import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/ui/Navbar';

export const metadata: Metadata = {
  title: 'OpenMath — Mathematical Computing Engine & Grapher',
  description:
    'Open-source math solver with step-by-step derivations, coordinate graphing, and AP exam practice.',
  keywords: [
    'math solver',
    'step-by-step math',
    'latex calculator',
    'graphing calculator',
    'calculus solver',
    'algebra solver',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-brand-500 selection:text-white">
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </body>
    </html>
  );
}
