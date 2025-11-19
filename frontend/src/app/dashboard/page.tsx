"use client";

import { Paper } from "@mantine/core";

import { DashboardNavBar } from "@/components/DashboardNavBar";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background flex">
      <DashboardNavBar />
      <main className="flex-1 flex flex-col items-center justify-center">
        <section className="w-full max-w-4xl px-10">
          <h1 className="text-3xl font-semibold text-gray-800 mb-6">
            Welcome back, username
          </h1>
        </section>
      </main>
    </div>
  );
}
