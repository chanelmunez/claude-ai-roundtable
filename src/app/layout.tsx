import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Roundtable - Intelligent Conversations",
  description: "Experience dynamic conversations between multiple AI models with unique personas in real-time.",
  keywords: ["AI", "conversation", "roundtable", "artificial intelligence", "chat"],
  authors: [{ name: "AI Roundtable Team" }],
  openGraph: {
    title: "AI Roundtable",
    description: "Dynamic AI conversations with multiple models",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
