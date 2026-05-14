import Image from "next/image";
import Button from "./ui/Button";
import UserBadge from "./UserBadge";

export default function Navbar() {
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

      <UserBadge
  name="Voravit"
  role="Training Staff"
/>
    </nav>
  );
}