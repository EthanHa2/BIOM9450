"use client";

import { Button, Loader } from "@mantine/core";
import { useState } from "react";

import { DashboardNavBar } from "@/components/DashboardNavBar";

export default function MutationsPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen flex">
      <DashboardNavBar />
      <main className="flex-1 flex flex-col px-40 py-25 overflow-y-auto">
        {/* Header Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold ">Mutations Overview</h1>
        </div>

        {/* Controls Row */}
        <div className="flex justify-between items-center mb-8">
          <Button variant="filled" size="md" radius="md">
            Search & Filter
          </Button>

          <div className="flex gap-4">
            <Button variant="filled" size="md" radius="md">
              Upload Mutations
            </Button>
            <Button variant="filled" size="md" radius="md">
              Download Report
            </Button>
          </div>
        </div>

        {/* Grid Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader size="xl" />
          </div>
        ) : (
          <div> Mutations Placeholder</div>
        )}
      </main>
    </div>
  );
}
