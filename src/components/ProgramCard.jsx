export default function ProgramCard({ p, sessions = [] }) {
  const related = sessions.filter((s) => s.program === p.code);

  const upcoming = related.length;

  const official = related.filter((s) => s.status === "Official").length;

  const exams = related.filter((s) => s.status === "Exam").length;

  return (
    <div
      className="rounded-[18px] border border-[#dddbd6] bg-white p-5 shadow-sm"
      style={{ borderBottomColor: p.color }}
    >
      <div className="flex items-start justify-between">
        <div className="text-4xl font-black" style={{ color: p.color }}>
          {p.code}
        </div>

        <span
          className="rounded-full px-3 py-1 text-[11px] font-black italic"
          style={{ background: p.tint, color: p.color }}
        >
          {p.tag}
        </span>
      </div>

      <div className="mt-3 text-base font-black">{p.name}</div>

      <div className="mt-1 text-sm font-semibold italic text-[#8b8a84]">
        {p.desc}
      </div>

      <div className="mt-5 grid grid-cols-3 border-t border-[#ececea] pt-4">
        <div>
          <div className="text-3xl font-black" style={{ color: p.color }}>
            {upcoming}
          </div>
          <div className="text-xs italic text-[#8b8a84]">upcoming</div>
        </div>

        <div>
          <div className="text-3xl font-black text-[#b8b6ae]">
            {official}
          </div>
          <div className="text-xs italic text-[#8b8a84]">official</div>
        </div>

        <div>
          <div className="text-3xl font-black">{exams}</div>
          <div className="text-xs italic text-[#8b8a84]">exams</div>
        </div>
      </div>
    </div>
  );
}