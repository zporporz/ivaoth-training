"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getClientSession } from "../lib/authSession";

export default function ProtectedStaffPage({ children }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const session = getClientSession();

    if (!session?.hasTrainingAccess) {
      router.replace("/");
      return;
    }

    setAllowed(true);
    setChecked(true);
  }, [router]);

  if (!checked) {
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
