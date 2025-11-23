"use client";

import { Title, Text, Button } from "@mantine/core";
import Link from "next/link";
import Image from "next/image";
import image from "@/assets/home.jpg";

export default function Home() {
  return (
    <main className="flex grow-0 min-h-screen flex-row items-center justify-center gap-20 px-8 bg-background">
      <div className="flex max-w-2xl flex-col items-start gap-4">
        <Title
          unstyled
          className="bg-linear-to-r from-(--theme-primary) to-(--theme-secondary) bg-clip-text text-3xl font-bold text-transparent md:text-5xl pb-4"
        >
          Unified Patient Management & Diagnostic Reporting
        </Title>
        <Text className="text-lg text-slate-600">
          Streamline your diagnostic process. From managing patient demographics
          and treatment history to visualizing complex mutation
          distributions—GenoView brings your entire clinical database into one
          unified platform.
        </Text>
        <Button component={Link} href="/register" size="md" radius="xl">
          Sign Up Now!
        </Button>
      </div>
      <Image
        src={image}
        alt="Health Illustration"
        width={500}
        height={500}
        className="hidden md:block"
      />
    </main>
  );
}
