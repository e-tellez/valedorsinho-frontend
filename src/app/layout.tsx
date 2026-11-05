import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/context/theme/ThemeContext";
import MockProvider from "@/components/MockProvider";
import "./globals.css";
import "./adyen.css";

const isMockEnabled = process.env.NEXT_PUBLIC_MOCK_API === "true";

export const metadata: Metadata = {
  title: "Valedorsinho",
  description: "Adyen integration demos",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const noFlashScript = `(function(){try{var s=localStorage.getItem('valedorsinho-theme');var sys=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s!=='light'&&sys))document.documentElement.classList.add('dark')}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className="antialiased">
        <div className="scan-line" />
        <ThemeProvider>
          <div className="adyen-page-wrapper">
            {isMockEnabled ? <MockProvider>{children}</MockProvider> : children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
