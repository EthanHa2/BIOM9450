import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@mantine/core/styles.css";
import "./globals.css";

import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";

import "@mantine/notifications/styles.css";
import { Notifications } from "@mantine/notifications";
import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/context/AuthContext";
import { theme } from "./theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GenoView",
  description: "Genomic Data Visualization and Analysis Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MantineProvider theme={theme}>
          <AuthProvider>
            <AppShell>
              <Notifications />
              {children}
            </AppShell>
          </AuthProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
