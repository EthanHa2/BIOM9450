"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";

const NAVBARLESS_PREFIXES = ["/dashboard"]; // dashboard pages renders their own navbar

interface AppShellProps {
  children: ReactNode;
}

function shouldHideNavbar(pathname: string): boolean {
  return NAVBARLESS_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const hideNavbar = shouldHideNavbar(pathname); // avoid double nav when already inside dashboard

  return (
    <div className="min-h-screen">
      {!hideNavbar && <Navbar />}
      <div className={hideNavbar ? "" : "pt-20"}>{children}</div>
    </div>
  );
}
