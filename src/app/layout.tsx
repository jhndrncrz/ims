import type { Metadata } from "next";
import { createTheme, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { Inter } from "next/font/google";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/dropzone/styles.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const theme = createTheme({
  primaryColor: "red",
  fontFamily: inter.style.fontFamily,
});

export const metadata: Metadata = {
  title: "Barangay AI SMS Hub",
  description: "Hackathon-ready MVP combining Alibaba Cloud AI + SMS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className={`${inter.variable} antialiased`}>
        <MantineProvider theme={theme}>
          <Notifications position="top-right" limit={3} />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
