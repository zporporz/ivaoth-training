"use client";

function DetailItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#ececea] bg-[#fbfbfa] p-4">
      <div className="text-[10px] font-black uppercase tracking-wide text-[#8b8a84]">
        {label}
      </div>
      <div className="mt-1 text-sm font-black text-[#242421]">
        {value || "-"}
      </div>
    </div>
  );
}

export default function SessionDetailModal({ session, program, onClose }) {
  if (!session) return null;

  const isExam = session.status === "Exam";
  const accentColor = isExam ? "#dc2626" : program?.color || "#0a0a0a";
  const traineeName = session.traineeName || session.trainee || "Unknown trainee";
  const traineeVid = session.traineeVid || "-";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-2xl">
        <div
          className="border-b border-[#ececea] px-8 py-6"
          style={{ borderTop: `8px solid ${accentColor}` }}
        >
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
                session details
              </div>

              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#242421]">
                {session.program} — {session.type}
                <span style={{ color: accentColor }}>.</span>
              </h2>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-bold text-[#8b8a84]">
                <span>{session.date}</span>
                <span>·</span>
                <span>{session.time}</span>
                <span>·</span>
                <span>{session.position}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="cursor-pointer rounded-full border border-[#dddbd6] bg-white px-4 py-2 text-sm font-black text-[#4b4b48] hover:bg-[#f3f3f1]"
            >
              close
            </button>
          </div>
        </div>

        <div className="space-y-5 px-8 py-7">
          <div className="grid grid-cols-3 gap-4">
            <DetailItem label="Status" value={session.status} />
            <DetailItem label="Program" value={session.program} />
            <DetailItem label="Position" value={session.position} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DetailItem label="Trainee name" value={traineeName} />
            <DetailItem label="Trainee VID" value={traineeVid} />
          </div>

          <div className="rounded-3xl border border-[#ececea] bg-[#fbfbfa] p-5">
            <div className="text-[10px] font-black uppercase tracking-wide text-[#8b8a84]">
              topic
            </div>
            <div className="mt-2 whitespace-pre-wrap text-base font-bold leading-relaxed text-[#242421]">
              {session.topic || "-"}
            </div>
          </div>

          <div className="rounded-3xl border border-[#ececea] bg-[#fbfbfa] p-5">
            <div className="text-[10px] font-black uppercase tracking-wide text-[#8b8a84]">
              remarks / preparation
            </div>
            <div className="mt-2 whitespace-pre-wrap text-base font-bold leading-relaxed text-[#4b4b48]">
              {session.remarks || "No remarks."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
