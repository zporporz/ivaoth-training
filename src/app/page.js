import Image from "next/image";

const trainingTypes = ["AS1", "AS2", "AS3", "ADC", "APC", "ACC", "GCA"];

export default function Home() {
  return (
    <main className="relative z-10 min-h-screen px-6 py-6">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-[28px] border border-[#ececea] bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="IVAO Thailand" width={150} height={60} priority />
          <div className="hidden sm:block">
            <div className="text-sm font-black leading-tight">Training Department</div>
            <div className="text-xs font-bold text-[#8b8a84]">IVAO Thailand Division</div>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <a className="rounded-full px-4 py-2 text-sm font-extrabold text-[#4b4b48] hover:bg-[#f3f3f1]">Portal</a>
          <a className="rounded-full px-4 py-2 text-sm font-extrabold text-[#4b4b48] hover:bg-[#f3f3f1]">Sessions</a>
          <a className="rounded-full px-4 py-2 text-sm font-extrabold text-[#4b4b48] hover:bg-[#f3f3f1]">Requests</a>
        </div>

        <button className="rounded-full bg-[#0a0a0a] px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:scale-[1.02]">
          Login with IVAO
        </button>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-6 py-12 lg:grid-cols-[1.15fr_.85fr] lg:py-16">
        <div className="rounded-[36px] border border-[#ececea] bg-white/80 p-8 shadow-sm backdrop-blur md:p-12">
          <div className="mb-5 inline-flex rounded-full border border-[#dddbd6] bg-[#fbfbfa] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#4b4b48]">
            IVAO Thailand Training Portal
          </div>

          <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.04em] text-[#0a0a0a] md:text-7xl">
            Train smarter.
            <br />
            Control cleaner.
          </h1>

          <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-[#4b4b48]">
            Manage training requests, staff sessions, trainee progress, and rating workflows
            in one clean portal for IVAO Thailand.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button className="rounded-full bg-[#16a34a] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#0b6e35]">
              Request Training
            </button>
            <button className="rounded-full border border-[#dddbd6] bg-white px-6 py-3 text-sm font-black text-[#0a0a0a] shadow-sm transition hover:bg-[#f3f3f1]">
              Staff Console
            </button>
          </div>

          <div className="mt-10 flex flex-wrap gap-2">
            {trainingTypes.map((type) => (
              <span
                key={type}
                className="rounded-full border border-[#dddbd6] bg-[#fbfbfa] px-4 py-2 text-xs font-black text-[#4b4b48]"
              >
                {type}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[32px] border border-[#ececea] bg-white p-6 shadow-sm">
            <div className="text-xs font-black uppercase text-[#8b8a84]">Portal Modes</div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-[24px] border border-[#dddbd6] bg-[#fbfbfa] p-4">
                <div className="text-lg font-black">Trainee Portal</div>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#4b4b48]">
                  Request training, view sessions, track rating progress.
                </p>
              </div>

              <div className="rounded-[24px] border border-[#16a34a] bg-[#e3f7ea] p-4">
                <div className="text-lg font-black text-[#0b6e35]">Staff Console</div>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#4b4b48]">
                  Approve requests, assign instructors, manage sessions.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[32px] border border-[#ececea] bg-white p-6 shadow-sm">
              <div className="text-xs font-black uppercase text-[#8b8a84]">Pending</div>
              <div className="mt-4 text-5xl font-black">12</div>
            </div>

            <div className="rounded-[32px] border border-[#ececea] bg-white p-6 shadow-sm">
              <div className="text-xs font-black uppercase text-[#8b8a84]">Sessions</div>
              <div className="mt-4 text-5xl font-black">8</div>
            </div>
          </div>

          <div className="rounded-[32px] border border-[#0a0a0a] bg-[#0a0a0a] p-6 text-white shadow-sm">
            <div className="text-xs font-black uppercase text-white/50">Next Step</div>
            <div className="mt-3 text-2xl font-black">Connect IVAO OAuth</div>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/65">
              After login, the website will detect staff access automatically.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}