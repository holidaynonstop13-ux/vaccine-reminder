import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบแจ้งเตือนวัคซีน",
  description: "ลงทะเบียนรับแจ้งเตือนวันนัดฉีดวัคซีนผ่าน LINE",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
