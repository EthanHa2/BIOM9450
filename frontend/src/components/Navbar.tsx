"use client";

import { Group, Button, Title } from "@mantine/core";
import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/logo.png";

export function Navbar() {
  return (
    <div className="fixed z-10 flex w-full items-center justify-between bg-background px-4 py-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Image src={logo} alt="Logo" width={50} height={50} />
        <Title order={3}>
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            GenoView
          </Link>
        </Title>
      </div>
      <Group>
        <Button component={Link} href="/login" variant="default">
          Log in
        </Button>
        <Button component={Link} href="/register">
          Sign up
        </Button>
      </Group>
    </div>
  );
}
