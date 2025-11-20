import type { Metadata } from "next";
import { Card, Container, createTheme, Paper, rem, Select, MantineProvider } from "@mantine/core";
import type { MantineThemeOverride } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { Inter } from "next/font/google";

import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/dropzone/styles.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const theme: MantineThemeOverride = createTheme({
  /** Put your mantine theme override here */
  fontSizes: {
    xs: rem("12px"),
    sm: rem("14px"),
    md: rem("16px"),
    lg: rem("18px"),
    xl: rem("20px"),
    "2xl": rem("24px"),
    "3xl": rem("30px"),
    "4xl": rem("36px"),
    "5xl": rem("48px"),
  },
  spacing: {
    "3xs": rem("4px"),
    "2xs": rem("8px"),
    xs: rem("10px"),
    sm: rem("12px"),
    md: rem("16px"),
    lg: rem("20px"),
    xl: rem("24px"),
    "2xl": rem("28px"),
    "3xl": rem("32px"),
  },
  primaryColor: "red",
  other: {
    style: "mantine",
  },
});

export const metadata: Metadata = {
  title: "BarangaAI",
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
