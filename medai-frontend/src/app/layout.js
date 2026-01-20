import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="h-screen flex bg-gray-100">{children}</body>
    </html>
  );
}
