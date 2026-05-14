import Image from "next/image";
import { cookies } from "next/headers";
import UserBadge from "./UserBadge";

function decodeSession(value) {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

export default async function Navbar() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("ivao_session")?.value;
  const session = sessionCookie ? decodeSession(sessionCookie) : null;

  return (
    <nav className="mx-auto flex max-w-[1480px] items-center justify-between rounded-[28px] border border-[#ececea] bg-white/70 px-5 py-4 shadow-sm backdrop-blur backdrop-saturate-150">
      <div className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="IVAO Thailand"
          width={200}
          height={100}
          priority
        />

        <div className="hidden sm:block">
          <div className="text-lg font-black leading-tight">
            Training Department
          </div>

          <div className="text-base font-bold text-[#8b8a84]">
            IVAO Thailand Division
          </div>
        </div>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <a
          href="/"
          className="rounded-full px-4 py-2 text-base font-extrabold text-[#4b4b48] transition hover:bg-[#f3f3f1]"
        >
          Portal
        </a>

        <a
          href="/staff"
          className="rounded-full px-4 py-2 text-base font-extrabold text-[#4b4b48] transition hover:bg-[#f3f3f1]"
        >
          Staff Console
        </a>
      </div>

      {session ? (
        <div className="flex items-center gap-3">
          <UserBadge
            name={session.name}
            role={`${session.atcRating || "Member"} · ${session.vid}`}
          />

          <a
            href="/api/auth/logout"
            className="rounded-full border border-[#dddbd6] bg-white px-4 py-2 text-sm font-black text-[#4b4b48] transition hover:bg-[#f3f3f1]"
          >
            logout
          </a>
        </div>
      ) : (
        <a
          href="/api/auth/login"
          className="rounded-full bg-[#0a2342] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#163b6d] hover:shadow-lg"
        >
          Login with IVAO
        </a>
      )}
    </nav>
  );
}
