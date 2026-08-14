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
        className="antialiased min-h-screen flex flex-col"
        style={{
          backgroundColor: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          fontFamily: "var(--font-sans)",
        }}
      >
        {/* Navigation */}
        <header
          className="border-b sticky top-0 z-50 backdrop-blur-sm"
          style={{
            borderColor: "hsl(var(--border))",
            backgroundColor: "hsl(var(--background) / 0.95)",
          }}
        >
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-sm font-semibold hover:opacity-80 transition-opacity"
              style={{ color: "hsl(var(--primary))" }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
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
            <div className="flex items-center gap-1">
              <NavLink href="/">Analyze</NavLink>
              <NavLink href="/methodology">Methodology</NavLink>
              <NavLink href="/evaluation">Evaluation</NavLink>
            </div>
          </nav>
        </header>

        {/* Main content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer
          className="border-t py-6 px-4 text-center"
          style={{
            borderColor: "hsl(var(--border))",
            backgroundColor: "hsl(var(--secondary))",
          }}
        >
          <p
            className="text-xs max-w-2xl mx-auto"
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
