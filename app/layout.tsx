import "./globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";


const mitra = localFont({
  src: [
    {
      path: "./fonts/B Mitra.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/B Mitra_Bold.ttf",
      weight: "500",
      style: "normal",
    }
  ],
  variable: "--font-mitra",
  display: "swap",
});




export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" 
     className={mitra.variable}>
      <body>
        {children}
        </body>
      
    </html>
  );
}