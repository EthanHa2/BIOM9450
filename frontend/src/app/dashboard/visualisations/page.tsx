"use client";

import { Button, Loader } from "@mantine/core";
import { useState } from "react";

import { DashboardNavBar } from "@/components/DashboardNavBar";

export default function VisualisationsPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden">
      <DashboardNavBar />
      <main className="flex-1 flex flex-col px-40 py-25 overflow-y-auto">
        {/* Header Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold ">Mutations Overview</h1>
        </div>

        {/* Grid Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader size="xl" />
          </div>
        ) : (
          <div> Visualisations Placeholder</div>
        )}
      </main>
    </div>
  );
}
