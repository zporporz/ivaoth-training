"use client";

export default function LoginRequiredModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm sm:px-6">
      <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-2xl">
        <div className="border-t-[8px] border-[#0a2342] px-5 py-6 sm:px-8 sm:py-7">
          <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
            login required
          </div>

          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#242421] sm:text-3xl">
            Please login with IVAO first
            <span className="text-[#ff5a1f]">.</span>
          </h2>

          <p className="mt-3 text-base font-bold leading-relaxed text-[#8b8a84]">
            Session details are available for logged-in IVAO members only.
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#ececea] px-5 py-5 sm:flex-row sm:items-center sm:justify-end sm:px-8">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-full border border-[#dddbd6] bg-white px-5 py-3 text-sm font-black text-[#4b4b48] hover:bg-[#f3f3f1]"
          >
            close
          </button>

          <a
            href="/api/auth/login"
            className="rounded-full bg-[#0a2342] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#163b6d] hover:shadow-lg"
          >
            Login with IVAO
          </a>
        </div>
      </div>
    </div>
  );
}
