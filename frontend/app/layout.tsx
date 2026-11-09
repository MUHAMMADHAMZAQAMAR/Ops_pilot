import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZeroTrust.AI | Enterprise AI Business Automation Platform",
  description: "Enterprise SaaS built on Zero-Trust AI Execution, LangGraph state machine, and cryptographic HITL approval gates.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 font-sans text-zinc-100">
        {children}
      </body>
    </html>
  );
}

