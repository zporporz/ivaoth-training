import Navbar from "../../components/Navbar";
import Card from "../../components/ui/Card";

const sessions = [
  {
    id: "TRN-001",
    date: "14 May 2026",
    time: "1300Z",
    program: "ASx",
    type: "Theory",
    topic: "Airspace structure and basic ATC phraseology",
    position: "VTBS_TWR",
    trainee: "You (Trainee)",
    status: "Scheduled",
  },
  {
    id: "TRN-002",
    date: "19 May 2026",
    time: "1400Z",
    program: "ADC",
    type: "Official Practical",
    topic: "Tower operations, runway separation, and traffic flow",
    position: "VTBD_TWR",
    trainee: "Karuna L.",
    status: "Official",
  },
  {
    id: "EXM-001",
    date: "23 May 2026",
    time: "1600Z",
    program: "GCA",
    type: "Exam",
    topic: "Final practical checkride",
    position: "VTBS_APP",
    trainee: "Chayanin V.",
    status: "Exam",
  },
];

function StatusBadge({ status }) {
  const style =
    status === "Exam"
      ? "bg-red-600 text-white"
      : status === "Official"
      ? "bg-sky-600 text-white"
      : "bg-[#e3f7ea] text-[#0b6e35]";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${style}`}>
      {status}
    </span>
  );
}

export default function StaffPage() {
  return (
    <main className="relative z-10 min-h-screen px-6 py-6">
      <Navbar />

      <section className="mx-auto max-w-[1480px] py-10">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
              ivao-th / training department / staff console
            </div>

            <h1 className="mt-3 text-5xl font-black tracking-[-0.04em]">
              <span className="font-normal italic text-[#4b4b48]">Staff</span>{" "}
              console — manage schedule
              <span className="text-[#ff5a1f]">.</span>
            </h1>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Card>
            <div className="text-xs font-black uppercase text-[#8b8a84]">
              Create Session
            </div>

            <div className="mt-5 space-y-4">
              <input
                placeholder="Date"
                className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
              />

              <input
                placeholder="Time e.g. 1300Z"
                className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
              />

              <select className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none">
                <option>ASx</option>
                <option>ADC</option>
                <option>APC</option>
                <option>ACC</option>
                <option>GCA</option>
              </select>

              <select className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none">
                <option>Theory Training</option>
                <option>Unofficial Practical</option>
                <option>Official Practical</option>
                <option>Knowledge Check-up</option>
                <option>Practical Exam</option>
              </select>

              <input
                placeholder="Position e.g. VTBS_TWR"
                className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
              />

              <input
                placeholder="Trainee name / VID"
                className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
              />

              <textarea
                placeholder="Session topic / what will be trained today"
                rows={4}
                className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
              />

              <textarea
                placeholder="Remarks / preparation / frequency / notes"
                rows={3}
                className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
              />

              <button className="w-full rounded-2xl bg-black px-5 py-3 font-black text-white">
                Publish Session
              </button>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-[#ececea] px-6 py-5">
              <div className="text-2xl font-black">
                <span className="font-normal italic text-[#8b8a84]">
                  training/
                </span>
                schedule entries
              </div>
            </div>

            <div>
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="grid grid-cols-[90px_120px_90px_1fr_120px] items-center gap-4 border-b border-[#ececea] px-6 py-5"
                >
                  <div className="text-sm font-black text-[#8b8a84]">
                    {s.id}
                  </div>

                  <div>
                    <div className="font-black">{s.date}</div>
                    <div className="text-sm font-bold italic text-[#8b8a84]">
                      {s.time}
                    </div>
                  </div>

                  <div className="font-black">{s.program}</div>

                  <div>
                    <div className="font-black">{s.type}</div>
                    <div className="mt-1 text-sm font-semibold text-[#4b4b48]">
                      {s.topic}
                    </div>
                    <div className="mt-1 text-sm font-semibold italic text-[#8b8a84]">
                      {s.position} · {s.trainee}
                    </div>
                  </div>

                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}