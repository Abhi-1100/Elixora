import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/context/AuthContext";

const bodyFont = localFont({
  src: [
    { path: "../bolt-design/fonts/SchibstedGrotesk-Regular.ttf", weight: "400", style: "normal" },
    { path: "../bolt-design/fonts/SchibstedGrotesk-Medium.ttf", weight: "500", style: "normal" },
    { path: "../bolt-design/fonts/SchibstedGrotesk-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../bolt-design/fonts/SchibstedGrotesk-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Elixora — AI Healthcare Assistant",
  description: "Talk with your AI healthcare assistant about symptoms, medicines, prescriptions, and lab reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${bodyFont.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Anti-FOUC: apply dark class before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('elixora-theme');
                  if (stored === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else if (!stored) {
                    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[var(--bg)] text-[var(--ink)] transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
