"use client";

import Navbar from "../../components/Navbar";
import Card from "../../components/ui/Card";
import { getClientSession } from "../../lib/authSession";

const WEBMASTER_VID = "739898";

const demoDocs = [
  {
    title: "ILS Basics & Localizer Intercept",
    category: "Approach",
    type: "YouTube",
    difficulty: "Beginner",
    thumbnail:
      "https://img.youtube.com/vi/6nZ5qSWf4YQ/maxresdefault.jpg",
  },
  {
    title: "Radar Vectoring Fundamentals",
    category: "Radar",
    type: "Website",
    difficulty: "Intermediate",
    thumbnail:
      "https://images.unsplash.com/photo-1529074963764-98f45c47344b?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "RNAV vs RNP Explained",
    category: "IFR",
    type: "Training Docs",
    difficulty: "Advanced",
    thumbnail:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1200&auto=format&fit=crop",
  },
];

export default function TrainingDocsPage() {
  const session = getClientSession();
  const isWebmaster = String(session?.vid || "") === WEBMASTER_VID;

  if (!isWebmaster) {
    return (
      <main className="relative z-10 min-h-screen px-6 py-6">
        <Navbar />

        <section className="mx-auto max-w-[1000px] py-24">
          <Card>
            <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
              preview restricted
            </div>

            <h1 className="mt-3 text-5xl font-black tracking-[-0.04em]">
              <span className="font-normal italic text-[#4b4b48]">Training</span>{" "}
              Docs<span className="text-[#ff5a1f]">.</span>
            </h1>

            <div className="mt-5 text-base font-semibold text-[#4b4b48]">
              This preview is currently visible only to the webmaster.
            </div>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="relative z-10 min-h-screen px-6 py-6">
      <Navbar />

      <section className="mx-auto max-w-[1480px] py-10">
        <div className="mb-10 flex items-end justify-between gap-5">
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
              ivao-th / academy / knowledge hub
            </div>

            <h1 className="mt-3 text-6xl font-black tracking-[-0.05em] leading-none">
              <span className="font-normal italic text-[#4b4b48]">Training</span>{" "}
              Docs<span className="text-[#ff5a1f]">.</span>
            </h1>

            <div className="mt-5 max-w-2xl text-lg font-semibold text-[#6d6d68]">
              A centralized knowledge hub for IVAO Thailand training resources,
              procedures, radar tutorials, phraseology, and examination preparation.
            </div>
          </div>

          <div className="rounded-full border border-[#ececea] bg-white px-5 py-3 text-sm font-black text-[#4b4b48] shadow-sm">
            Webmaster Preview
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          {[
            "All",
            "Approach",
            "Radar",
            "Phraseology",
            "Charts",
            "IFR",
            "Exams",
          ].map((category) => (
            <button
              key={category}
              className="rounded-full border border-[#dddbd6] bg-white/70 px-5 py-2 text-sm font-black text-[#4b4b48] transition hover:bg-[#0a2342] hover:text-white"
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {demoDocs.map((doc, index) => (
            <a
              key={index}
              href="#"
              className="group overflow-hidden rounded-[2rem] border border-[#ececea] bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:border-[#0a2342] hover:shadow-2xl"
            >
              <div className="relative h-[230px] overflow-hidden">
                <img
                  src={doc.thumbnail}
                  alt={doc.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[#0a2342] backdrop-blur">
                  {doc.type}
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-[#0a2342] px-3 py-1 text-xs font-black text-white">
                    {doc.category}
                  </div>

                  <div className="rounded-full border border-[#dddbd6] bg-[#fbfbfa] px-3 py-1 text-xs font-black text-[#4b4b48]">
                    {doc.difficulty}
                  </div>
                </div>

                <div className="mt-5 text-2xl font-black leading-tight tracking-[-0.03em] transition group-hover:text-[#0a2342]">
                  {doc.title}
                </div>

                <div className="mt-4 flex items-center justify-between text-sm font-bold text-[#8b8a84]">
                  <span>Open learning resource</span>
                  <span>↗</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
