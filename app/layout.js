export const metadata = {
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
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
