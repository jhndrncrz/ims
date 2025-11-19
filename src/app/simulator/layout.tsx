"use client";

import { SimulatorLayout } from "@/components/layout/SimulatorLayout";

export default function SimulatorRootLayout({ children }: { children: React.ReactNode }) {
  return <SimulatorLayout>{children}</SimulatorLayout>;
}
