"use client";

import { Group, Button, Title, Flex } from "@mantine/core";
import Link from "next/link";

export function Navbar() {
  return (
    <Flex
      justify="space-between"
      align="center"
      style={{ padding: "1rem 2rem", borderBottom: "1px solid #e9ecef" }}
    >
      <Title order={3}>
        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
          Name of app
        </Link>
      </Title>
      <Group>
        <Button component={Link} href="/login" variant="default">
          Log in
        </Button>
        <Button component={Link} href="/register">
          Sign up
        </Button>
      </Group>
    </Flex>
  );
}
