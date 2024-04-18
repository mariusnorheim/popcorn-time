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
    <html lang="en">
          <body className={`font-sans ${inter.variable} bg-teal-700`}>
            <Header />
            {children}
          </body>
    </html>
  );
}
