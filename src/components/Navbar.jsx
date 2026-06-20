"use client";

import Image from "next/image";
import Link from "next/link";
import { useClientSession } from "../lib/authSession";
import StaffSessionBell from "./StaffSessionBell";
import UserBadge from "./UserBadge";

const WEBMASTER_VID = "739898";

export default function Navbar() {
  const session = useClientSession();
  const isWebmaster = String(session?.vid || "") === WEBMASTER_VID;

  return (
    <nav className="mx-auto grid max-w-[1480px] grid-cols-1 gap-4 rounded-[28px] border border-[#ececea] bg-white/70 px-4 py-4 shadow-sm backdrop-blur backdrop-saturate-150 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
      <div className="flex w-full items-center justify-between gap-4 lg:w-auto lg:justify-start">
        <div className="flex items-center gap-4">
        <Image
          src="/logo.png"
          alt="IVAO Thailand"
          width={200}
          height={100}
          className="w-[150px] sm:w-[200px]"
          priority
          style={{ height: "auto" }}
        />

        <div className="hidden sm:block">
          <div className="text-lg font-black leading-tight">Training Department</div>
          <div className="text-base font-bold text-[#8b8a84]">IVAO Thailand Division</div>
        </div>
      </div>

        {!session && (
          <a href="/api/auth/login" className="rounded-full bg-[#0a2342] px-4 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-[#163b6d] hover:shadow-lg sm:px-5 sm:py-3 sm:text-sm">
            Login
          </a>
        )}
      </div>

      {session && (
        <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 lg:items-center lg:justify-start lg:pb-0 xl:justify-center">
          <Link href="/" className="shrink-0 rounded-full px-3 py-2 text-sm font-extrabold text-[#4b4b48] transition hover:bg-[#f3f3f1] 2xl:px-4 2xl:text-base">
            Portal
          </Link>

          <a href="/my-training" className="shrink-0 rounded-full px-3 py-2 text-sm font-extrabold text-[#4b4b48] transition hover:bg-[#f3f3f1] 2xl:px-4 2xl:text-base">
            My Training
          </a>

          <a href="/training-docs" className="shrink-0 rounded-full px-3 py-2 text-sm font-extrabold text-[#4b4b48] transition hover:bg-[#f3f3f1] 2xl:px-4 2xl:text-base">
            Training Docs
          </a>

          <a href="/training-list" className="shrink-0 rounded-full px-3 py-2 text-sm font-extrabold text-[#4b4b48] transition hover:bg-[#f3f3f1] 2xl:px-4 2xl:text-base">
            Trainer List
          </a>

          {session.hasTrainingAccess && (
            <>
              <a href="/staff/training-docs" className="shrink-0 rounded-full px-3 py-2 text-sm font-extrabold text-[#4b4b48] transition hover:bg-[#f3f3f1] 2xl:px-4 2xl:text-base">
                Manage Docs
              </a>

              {isWebmaster && (
                <a href="/staff/training-staff" className="shrink-0 rounded-full px-3 py-2 text-sm font-extrabold text-[#4b4b48] transition hover:bg-[#f3f3f1] 2xl:px-4 2xl:text-base">
                  Manage List
                </a>
              )}

              <a href="/staff" className="shrink-0 rounded-full bg-[#0a2342] px-3 py-2 text-sm font-extrabold text-white transition hover:bg-[#163b6d] 2xl:px-4 2xl:text-base">
                Staff Console
              </a>
            </>
          )}
        </div>
      )}

      {session ? (
        <div className="flex w-full flex-wrap items-center justify-between gap-3 lg:ml-6 lg:w-auto lg:flex-nowrap lg:justify-start lg:gap-4">
          {session.hasTrainingAccess && (
            <div className="shrink-0 pl-2">
              <StaffSessionBell session={session} />
            </div>
          )}

          <UserBadge
            name={session.name}
            role={session.hasTrainingAccess ? `Training Staff · ${session.vid}` : `${session.atcRating || "Member"} · ${session.vid}`}
          />

          <a href="/api/auth/logout" className="rounded-full border border-[#dddbd6] bg-white px-4 py-2 text-sm font-black text-[#4b4b48] transition hover:bg-[#f3f3f1]">
            logout
          </a>
        </div>
      ) : null}
    </nav>
  );
}
