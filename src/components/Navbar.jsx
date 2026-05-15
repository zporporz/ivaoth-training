"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getClientSession } from "../lib/authSession";
import UserBadge from "./UserBadge";

const WEBMASTER_VID = "739898";

export default function Navbar() {
  const [session, setSession] = useState(null);
  const isWebmaster = String(session?.vid || "") === WEBMASTER_VID;

  useEffect(() => {
    setSession(getClientSession());
  }, []);

  return (
    <nav className="mx-auto flex max-w-[1480px] items-center justify-between rounded-[28px] border border-[#ececea] bg-white/70 px-6 py-4 shadow-sm backdrop-blur backdrop-saturate-150">
      <div className="flex items-center gap-4">
        <Image src="/logo.png" alt="IVAO Thailand" width={200} height={100} priority />

        <div className="hidden sm:block">
          <div className="text-lg font-black leading-tight">Training Department</div>
          <div className="text-base font-bold text-[#8b8a84]">IVAO Thailand Division</div>
        </div>
      </div>

      {session && (
        <div className="hidden items-center gap-2 lg:flex">
          <a href="/" className="rounded-full px-4 py-2 text-base font-extrabold text-[#4b4b48] transition hover:bg-[#f3f3f1]">
            Portal
          </a>

          <a href="/my-training" className="rounded-full px-4 py-2 text-base font-extrabold text-[#4b4b48] transition hover:bg-[#f3f3f1]">
            My Training
          </a>

          <a href="/training-list" className="rounded-full px-4 py-2 text-base font-extrabold text-[#4b4b48] transition hover:bg-[#f3f3f1]">
            Training List
          </a>

          {session.hasTrainingAccess && (
            <>
              {isWebmaster && (
                <a href="/staff/training-staff" className="rounded-full px-4 py-2 text-base font-extrabold text-[#4b4b48] transition hover:bg-[#f3f3f1]">
                  Manage List
                </a>
              )}

              <a href="/staff" className="rounded-full bg-[#0a2342] px-4 py-2 text-base font-extrabold text-white transition hover:bg-[#163b6d]">
                Staff Console
              </a>
            </>
          )}
        </div>
      )}

      {session ? (
        <div className="flex items-center gap-3">
          <UserBadge
            name={session.name}
            role={session.hasTrainingAccess ? `Training Staff · ${session.vid}` : `${session.atcRating || "Member"} · ${session.vid}`}
          />

          <a href="/api/auth/logout" className="rounded-full border border-[#dddbd6] bg-white px-4 py-2 text-sm font-black text-[#4b4b48] transition hover:bg-[#f3f3f1]">
            logout
          </a>
        </div>
      ) : (
        <a href="/api/auth/login" className="rounded-full bg-[#0a2342] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#163b6d] hover:shadow-lg">
          Login with IVAO
        </a>
      )}
    </nav>
  );
}
