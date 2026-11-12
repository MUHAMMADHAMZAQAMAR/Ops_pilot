import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OpsPilot — AI Operations Assistant',
  description: 'AI-powered operations assistant for automotive e-commerce',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full flex flex-col antialiased selection:bg-[#c8f135]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
