import type { Metadata } from "next";
import { Inter, Lora, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Essay Lens — AI Writing Detector for Admissions Essays",
  description:
    "Analyze college admissions essays for statistical signals associated with machine-generated writing. Evidence-based, explainable, and transparent.",
  keywords: [
    "AI detector",
    "admissions essay",
    "college essay",
    "AI writing detection",
    "machine-generated text",
  ],
  openGraph: {
    title: "Essay Lens — AI Writing Detector",
    description:
      "Evidence-based analysis of writing style signals in college admissions essays.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable} ${jetbrainsMono.variable}`}>
      <body
        className="antialiased min-h-screen flex flex-col relative"
        style={{
          backgroundColor: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          fontFamily: "var(--font-sans)",
        }}
      >
        {/* Background Blobs for Ambient depth */}
        <div className="bg-blob-container" aria-hidden="true">
          <div className="bg-blob blob-cyan" />
          <div className="bg-blob blob-pink" />
          <div className="bg-blob blob-peach" />
        </div>

        {/* Floating Glass Navigation */}
        <div className="w-full px-4 sm:px-6 pt-4 sticky top-0 z-50">
          <header
            className="rounded-2xl border backdrop-blur-md max-w-7xl mx-auto"
            style={{
              borderColor: "rgba(255, 255, 255, 0.4)",
              backgroundColor: "rgba(255, 255, 255, 0.45)",
              boxShadow: "0 4px 30px rgba(0, 0, 0, 0.03)",
            }}
          >
            <nav className="px-6 py-3.5 flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-semibold tracking-tight hover:opacity-80 transition-opacity"
                style={{ color: "hsl(var(--primary))" }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                  <path d="M8 11h6M11 8v6" />
                </svg>
                Essay Lens
              </Link>
              <div className="flex items-center gap-1.5">
                <NavLink href="/">Analyze</NavLink>
                <NavLink href="/methodology">Methodology</NavLink>
                <NavLink href="/evaluation">Evaluation</NavLink>
              </div>
            </nav>
          </header>
        </div>

        {/* Main content */}
        <main className="flex-1 relative z-10">{children}</main>

        {/* Footer */}
        <footer
          className="border-t py-8 px-4 text-center mt-auto"
          style={{
            borderColor: "rgba(255, 255, 255, 0.3)",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
          }}
        >
          <p
            className="text-xs max-w-2xl mx-auto leading-relaxed"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Essay Lens uses statistical analysis to identify linguistic patterns. It{" "}
            <strong>cannot prove authorship</strong> and should not be used as evidence
            of misconduct. Results are probabilistic estimates, not definitive classifications.{" "}
            <Link
              href="/methodology"
              className="underline hover:no-underline"
              style={{ color: "hsl(var(--primary))" }}
            >
              Learn more about our methodology.
            </Link>
          </p>
        </footer>
      </body>
    </html>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-gray-100"
      style={{ color: "hsl(var(--muted-foreground))" }}
    >
      {children}
    </Link>
  );
}
