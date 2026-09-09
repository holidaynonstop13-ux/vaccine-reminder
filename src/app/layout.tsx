import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบแจ้งเตือนวัคซีน",
  description: "ลงทะเบียนรับแจ้งเตือนวันนัดฉีดวัคซีนผ่าน LINE",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&family=Sarabun:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-['Noto_Sans_Thai',_'Sarabun',_sans-serif]">{children}</body>
    </html>
  );
}
