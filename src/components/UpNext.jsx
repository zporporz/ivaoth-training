import Card from "./ui/Card";

export default function UpNext({ upNext }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-[#ececea] px-6 py-5">
        <div className="text-2xl font-black">
          <span className="font-normal italic text-[#8b8a84]">up/</span>
          next
        </div>

        <div className="text-sm font-bold text-[#8b8a84]">
          <span className="text-[#ff5a1f]">{upNext.length}</span> sessions
        </div>
      </div>

      <div className="max-h-[720px] overflow-auto">
        {upNext.map((s, i) => (
          <div
            key={i}
            className={`flex gap-4 border-b border-[#ececea] px-6 py-4 ${
              s.mine ? "border-l-4 border-l-[#16a34a] bg-[#e3f7ea]" : ""
            }`}
          >
            <div className="min-w-12">
              <div className="text-2xl font-black" style={{ color: s.color }}>
                {s.day}
              </div>

              <div className="text-xs font-bold italic text-[#8b8a84]">
                {s.month} {s.time}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="rounded-md border px-2 py-1 text-xs font-black"
                  style={{ color: s.color, borderColor: s.color }}
                >
                  {s.type}
                </span>

                <span className="font-black">{s.pos}</span>

                {s.mine && (
                  <span className="ml-auto text-xs font-black italic text-[#16a34a]">
                    you
                  </span>
                )}
              </div>

              <div className="font-black">{s.title}</div>

              <div className="mt-1 truncate text-sm font-semibold italic text-[#8b8a84]">
                {s.name}
                {s.vid ? ` (${s.vid})` : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
