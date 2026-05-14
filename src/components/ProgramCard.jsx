export default function ProgramCard({ p, sessions = [] }) {
  const related = sessions.filter((s) => s.program === p.code);

  const upcoming = related.length;

  const official = related.filter((s) => s.status === "Official").length;

  const exams = related.filter((s) => s.status === "Exam").length;

  return (
    <div
      className="min-w-0 rounded-[18px] border border-[#dddbd6] bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
      style={{ borderBottomColor: p.color }}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="truncate text-3xl font-black"
          style={{ color: p.color }}
        >
          {p.code}
        </div>

        <span
          className="shrink-0 rounded-full px-2 py-1 text-[10px] font-black italic"
          style={{ background: p.tint, color: p.color }}
        >
          {p.tag}
        </span>
      </div>

      <div className="mt-3 text-sm font-black leading-tight">{p.name}</div>

      <div className="mt-1 text-xs font-semibold italic text-[#8b8a84]">
        {p.desc}
      </div>

      <div className="mt-4 grid grid-cols-3 border-t border-[#ececea] pt-3">
        <div>
          <div className="text-2xl font-black" style={{ color: p.color }}>
            {upcoming}
          </div>
          <div className="text-[10px] italic text-[#8b8a84]">upcoming</div>
        </div>

        <div>
          <div className="text-2xl font-black text-[#b8b6ae]">
            {official}
          </div>
          <div className="text-[10px] italic text-[#8b8a84]">official</div>
        </div>

        <div>
          <div className="text-2xl font-black">{exams}</div>
          <div className="text-[10px] italic text-[#8b8a84]">exams</div>
        </div>
      </div>
    </div>
  );
}
