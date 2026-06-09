"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClientReady, useClientSession } from "../lib/authSession";

export default function ProtectedStaffPage({ children }) {
  const router = useRouter();
  const session = useClientSession();
  const ready = useClientReady();
  const allowed = Boolean(session?.hasTrainingAccess);

  useEffect(() => {
    if (ready && !allowed) {
      router.replace("/");
    }
  }, [allowed, ready, router]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <div className="text-lg font-black text-[#8b8a84]">
          Checking permissions...
        </div>
      </main>
    );
  }

  if (!allowed) return null;

  return children;
}
