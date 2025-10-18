"use client";

import dynamic from "next/dynamic";
import { Toaster } from "@/components/ui/sonner";

const ErudaProvider = dynamic(
  () => import("../components/eruda-provider").then((c) => c.Eruda),
  { ssr: false }
);

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ErudaProvider>
      {children}
      <Toaster />
    </ErudaProvider>
  );
}
