"use client";

import Navbar from "../../components/Navbar";
import { getClientSession } from "../../lib/authSession";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useEffect, useState } from "react";

const WEBMASTER_VID = "739898";

export default function TrainingDocsPage() {
  const [docs, setDocs] = useState([]);
  const session = getClientSession();
  const isWebmaster = String(session?.vid || "") === WEBMASTER_VID;

  useEffect(() => {
    if (!isWebmaster) return;

    const q = query(collection(db, "trainingDocs"), orderBy("order", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDocs(
        snapshot.docs
          .map((item) => ({ firestoreId: item.id, ...item.data() }))
          .filter((item) => item.active !== false)
      );
    });

    return () => unsubscribe();
  }, [isWebmaster]);

  if (!isWebmaster) {
    return <main className="relative z-10 min-h-screen px-6 py-6"><Navbar /></main>;
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
              <span className="font-normal italic text-[#4b4b48]">Training</span> Docs
              <span className="text-[#ff5a1f]">.</span>
            </h1>

            <div className="mt-5 max-w-2xl text-lg font-semibold text-[#6d6d68]">
              Centralized training materials, tutorials, references, and IVAO Thailand learning resources.
            </div>
          </div>

          <div className="rounded-full border border-[#ececea] bg-white px-5 py-3 text-sm font-black text-[#4b4b48] shadow-sm">
            {docs.length} docs
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {docs.map((doc) => (
            <a
              key={doc.firestoreId}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group overflow-hidden rounded-[2rem] border border-[#ececea] bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:border-[#0a2342] hover:shadow-2xl"
            >
              <div className="relative h-[230px] overflow-hidden bg-[#f3f3f1]">
                {doc.thumbnailUrl ? (
                  <img src={doc.thumbnailUrl} alt={doc.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center text-lg font-black text-[#8b8a84]">
                    NO THUMBNAIL
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[#0a2342] backdrop-blur">
                  {doc.type}
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2">
                  <div className="rounded-full border border-[#dddbd6] bg-[#fbfbfa] px-3 py-1 text-xs font-black text-[#4b4b48]">
                    {doc.difficulty}
                  </div>
                </div>

                <div className="mt-5 text-2xl font-black leading-tight tracking-[-0.03em] transition group-hover:text-[#0a2342]">
                  {doc.title}
                </div>

                {doc.description && (
                  <div className="mt-3 text-sm font-semibold text-[#6d6d68]">
                    {doc.description}
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between text-sm font-bold text-[#8b8a84]">
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
