function sessionToDate(session) {
  const rawDate = String(session?.date || "").trim();
  const rawTime = String(session?.time || "").replace(/\D/g, "");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate) || rawTime.length < 4) {
    return null;
  }

  const hour = rawTime.slice(0, 2);
  const minute = rawTime.slice(2, 4);
  const date = new Date(`${rawDate}T${hour}:${minute}:00Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

export default function ProgramCard({ p, sessions = [] }) {
  const now = new Date();
  const related = sessions.filter((s) => s.program === p.code);

  const upcoming = related.filter((session) => {
    const sessionDate = sessionToDate(session);
    return sessionDate && sessionDate >= now;
  }).length;

  const completed = related.filter((session) => {
    const sessionDate = sessionToDate(session);
    return sessionDate && sessionDate < now;
  }).length;

  const exams = related.filter((s) => s.status === "Exam").length;

  return (
    <div
      className="min-w-0 rounded-[16px] border border-[#dddbd6] bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
      style={{ borderBottomColor: p.color }}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="truncate text-[2rem] font-black leading-none"
          style={{ color: p.color }}
        >
          {p.code}
        </div>

        <span
          className="shrink-0 rounded-full px-2 py-[4px] text-[9px] font-black italic"
          style={{ background: p.tint, color: p.color }}
        >
          {p.tag}
        </span>
      </div>

      <div className="mt-2 text-[13px] font-black leading-tight">
        {p.name}
      </div>

      <div className="mt-1 text-[11px] font-semibold italic text-[#8b8a84] leading-tight">
        {p.desc}
      </div>

      <div className="mt-3 grid grid-cols-3 border-t border-[#ececea] pt-2">
        <div>
          <div className="text-xl font-black" style={{ color: p.color }}>
            {upcoming}
          </div>

          <div className="text-[9px] italic text-[#8b8a84]">
            upcoming
          </div>
        </div>

        <div>
          <div className="text-xl font-black text-[#4b4b48]">
            {completed}
          </div>

          <div className="text-[9px] italic text-[#8b8a84]">
            completed
          </div>
        </div>

        <div>
          <div className="text-xl font-black text-red-600">
            {exams}
          </div>

          <div className="text-[9px] italic text-[#8b8a84]">
            exams
          </div>
        </div>
      </div>
    </div>
  );
}
