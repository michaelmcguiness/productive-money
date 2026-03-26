export const metadata = {
  title: "Productive Money — Etherealize",
  description: "Ethereum and the Era of Productive Money",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
