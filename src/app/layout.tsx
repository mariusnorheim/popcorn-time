import "~/styles/globals.css";

import { Inter } from "next/font/google";
import Header from "@components/header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Popcorn time!",
  description: "Get your movie and TV recommendations here!",
  icons: [{ rel: "icon", url: "/popcorn.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`font-sans ${inter.variable} min-h-full bg-slate-950 text-slate-100`}
      >
        <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
          <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_55%)]" />
          <Header />
          <div className="relative">{children}</div>
        </div>
      </body>
    </html>
  );
}
