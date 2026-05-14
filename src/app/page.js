import Navbar from "../components/Navbar";
import Card from "../components/ui/Card";
import ProgramCard from "../components/ProgramCard";
import TrainingCalendar from "../components/TrainingCalendar";
import UpNext from "../components/UpNext";
import programs from "../data/programs";
import calendarDays from "../data/calendarDays";
import upNext from "../data/upNext";

export default function Home() {
  return (
    <main className="relative z-10 min-h-screen px-6 py-6">
      <Navbar />

      <section className="mx-auto max-w-[1480px] py-10">
        <div className="mb-7">
  <div>
    <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
      ivao-th / training department / training schedule
    </div>

    <h1 className="mt-3 text-5xl font-black tracking-[-0.04em]">
      <span className="font-normal italic text-[#4b4b48]">Training</span>{" "}
      schedule — sessions, check-ups, and exams
      <span className="text-[#ff5a1f]">.</span>
    </h1>

  </div>

</div>

        <div className="mb-7 flex flex-col items-center">
          <div className="mb-4 flex items-baseline justify-center gap-4">
            <h2 className="text-2xl font-black">
              <span className="font-normal italic">Training</span> programs
            </h2>

            <span className="text-sm font-semibold italic text-[#8b8a84]">
              training, check-up, and examination overview
            </span>
          </div>

          <div className="grid max-w-[1080px] grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {programs.map((p) => (
              <ProgramCard key={p.code} p={p} />
            ))}
          </div>
        </div>

        <div className="mb-5 flex items-center gap-8 border-b border-[#dddbd6]">
          <button className="border-b-4 border-[#ff5a1f] pb-3 text-base font-black">
            schedule{" "}
            <span className="ml-2 rounded-full bg-black px-2 py-1 text-xs text-white">
              25
            </span>
          </button>

          <button className="pb-3 text-base font-black italic text-[#8b8a84]">
            my training <span className="ml-2 text-xs text-black">4</span>
          </button>

          <button className="pb-3 text-base font-black italic text-[#8b8a84]">
            my sessions <span className="ml-2 text-xs text-black">1</span>
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <TrainingCalendar calendarDays={calendarDays} programs={programs} />

          <UpNext upNext={upNext} />

        </div>
      </section>
    </main>
  );
}