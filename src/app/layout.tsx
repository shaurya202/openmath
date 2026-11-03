import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/ui/Navbar';

export const metadata: Metadata = {
  title: 'OpenMath - AI Math Solver, Homework Helper & Graphing Calculator',
  description:
    'Free and open-source AI math homework assistant with step-by-step solutions, interactive formula keyboard, multimodal photo OCR, and 2D coordinate grapher.',
  keywords: [
    'open-source math solver',
    'math gpt',
    'ai homework helper',
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
