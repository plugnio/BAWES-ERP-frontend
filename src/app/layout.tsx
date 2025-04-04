import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ServicesProvider } from "@/hooks/use-services";
import { ThemeProvider } from "next-themes";

/** Load Inter font with Latin subset */
const inter = Inter({ subsets: ["latin"] });

/**
 * Application metadata configuration
 * Defines global SEO and page information
 */
export const metadata: Metadata = {
  title: "BAWES ERP",
  description: "Enterprise Resource Planning System",
};

/**
 * Root layout component that wraps all pages
 * Provides global styles, fonts, and UI components
 * 
 * Features:
 * - Inter font for consistent typography
 * - Toast notifications via Toaster component
 * - HTML lang attribute for accessibility
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @returns {JSX.Element} Root layout structure
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ServicesProvider>
            {children}
            <Toaster />
          </ServicesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
