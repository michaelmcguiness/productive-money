export const metadata = {
  title: "Productive Money — Etherealize",
  description: "Ether's monetary properties are superior to gold and Bitcoin. Here's the path to $300,000.",
  openGraph: {
    title: "Ethereum and the Era of Productive Money",
    description: "Ether's monetary properties are superior to gold and Bitcoin. Here's the path to $300,000.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ethereum and the Era of Productive Money — An Etherealize x Bitmine Research Paper",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ethereum and the Era of Productive Money",
    description: "Ether's monetary properties are superior to gold and Bitcoin. Here's the path to $300,000.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
