"use client";

import { Title, Text, Button } from "@mantine/core";
import Link from "next/link";
import Image from "next/image";
import image from "@/assets/home.jpg";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-row items-center justify-center gap-20 px-8">
      <div className="flex max-w-lg flex-col items-start gap-4">
        <Title
          unstyled
          className="bg-linear-to-r from-(--theme-primary) to-(--theme-secondary) bg-clip-text text-5xl font-bold text-transparent md:text-6xl pb-4"
        >
          Patient Management System
        </Title>
        <Text className="text-lg text-slate-600">
          Welcome to (name of app), your one-stop solution for all your patient
          management needs.
        </Text>
        <Button component={Link} href="/register" size="md" radius="xl">
          Sign Up Now!
        </Button>
      </div>
      <Image
        src={image}
        alt="Health Illustration"
        width={600}
        height={600}
        className="hidden md:block"
      />
    </main>
  );
}
