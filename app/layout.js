import { Analytics } from "@vercel/analytics/next";
import { SiteFooter } from "./components";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://productivemoney.org"),
  title: "Productive Money — Etherealize",
  description: "Ether's monetary properties are superior to gold and Bitcoin. Here's the case for productive money.",
  openGraph: {
    title: "Ethereum and the Era of Productive Money",
    description: "Ether's monetary properties are superior to gold and Bitcoin. Here's the case for productive money.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ethereum and the Era of Productive Money — An Etherealize Research Paper",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ethereum and the Era of Productive Money",
    description: "Ether's monetary properties are superior to gold and Bitcoin. Here's the case for productive money.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
        <style>{`
          :root {
            --cream: #F5F2EC;
            --cream-alt: #EFEDE1;
            --ink: #29251F;
            --ink-soft: #3A352E;
            --gold: #C2A45B;
            --gold-bright: #D4B775;
            --gold-deep: #9E8443;
            --eth-blue: #8EA4C2;
            --cream-on-dark: #EDE6D6;
            --muted-warm: #8A8075;
            --muted-warmer: #6B6257;
            --rule: rgba(194,164,91,0.35);
            --hairline: rgba(41,37,31,0.12);
            --hairline-dark: rgba(237,230,214,0.12);
          }
          html, body { background: var(--cream); color: var(--ink); }
          html { overflow-x: hidden; }
          body {
            margin: 0;
            overflow-x: hidden;
            font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          *, *::before, *::after { min-width: 0; }
        `}</style>
      </head>
      <body>
        {children}
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
