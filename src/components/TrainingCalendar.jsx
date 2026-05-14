import Card from "./ui/Card";

export default function TrainingCalendar({ calendarDays, programs }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-[#ececea] px-6 py-5">
        <div className="text-2xl font-black">
          <span className="font-normal italic text-[#8b8a84]">the/</span>
          schedule
          <span className="ml-3 text-sm font-bold text-[#8b8a84]">
            MAY 2026 · <span className="text-[#ff5a1f]">32</span> sessions
          </span>
        </div>

        <div className="flex gap-2">
          <button className="rounded-lg border border-[#dddbd6] bg-white px-3 py-2 font-black">‹</button>
          <button className="rounded-lg bg-black px-4 py-2 text-sm font-black text-white">today</button>
          <button className="rounded-lg border border-[#dddbd6] bg-white px-3 py-2 font-black">›</button>
        </div>
      </div>

      <div className="grid grid-cols-7 bg-[#fbfbfa] text-xs font-black italic text-[#8b8a84]">
        {["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((d) => (
          <div key={d} className="border-b border-[#ececea] px-4 py-3">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarDays.map(([day, time, type, pos, sessionType], i) => {
          const program = programs.find((p) => p.code === type);
          const isToday = day === "13";
          const isExam = sessionType === "exam";
          const isOfficial = sessionType === "official";
          const isUnofficial = sessionType === "unofficial";
          const isTheory = sessionType === "theory";

          return (
            <div
              key={i}
              className={`min-h-[118px] border-b border-r border-[#ececea] p-3 ${
                isToday ? "bg-[#e3f7ea]" : "bg-white/40"
              }`}
            >
              <div
                className={`mb-4 text-lg font-black ${
                  isToday ? "text-[#16a34a]" : "text-[#b8b6ae]"
                }`}
              >
                {day}
              </div>

              {type && (
                <div
                  className={`max-w-full overflow-hidden rounded-md px-2 py-1 text-xs font-black ${
                    isExam
                      ? "border border-red-500 bg-red-50 shadow-sm"
                      : isOfficial
                      ? "border border-sky-500 bg-sky-50 shadow-sm"
                      : isUnofficial
                      ? "border border-zinc-300 bg-zinc-50"
                      : isTheory
                      ? "border border-[#dddbd6] bg-[#fbfbfa]"
                      : "bg-[#fbfbfa]"
                  }`}
                  style={{
                    borderLeft: `4px solid ${
                      isExam ? "#dc2626" : program?.color
                    }`,
                  }}
                >
                  {(isExam || isOfficial || isUnofficial) && (
                    <div className="mb-1 flex">
                      {isExam && (
                        <span className="rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-black text-white">
                          EXAM
                        </span>
                      )}

                      {isOfficial && (
                        <span className="rounded bg-sky-600 px-1.5 py-0.5 text-[9px] font-black text-white">
                          OFFICIAL
                        </span>
                      )}

                      {isUnofficial && (
                        <span className="rounded bg-zinc-700 px-1.5 py-0.5 text-[9px] font-black text-white">
                          UNOFF
                        </span>
                      )}
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <div className="flex min-w-0 items-center gap-1">
                      <span className="shrink-0 text-[11px]">{time}</span>

                      <span
                        className="truncate"
                        style={{
                          color: isExam ? "#dc2626" : program?.color,
                        }}
                      >
                        {type}
                      </span>
                    </div>

                    <div className="truncate text-[10px] font-bold text-[#8b8a84]">
                      {pos}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}