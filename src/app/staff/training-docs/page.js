"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import Navbar from "../../../components/Navbar";
import Card from "../../../components/ui/Card";
import ProtectedStaffPage from "../../../components/ProtectedStaffPage";
import { getClientSession } from "../../../lib/authSession";
import { db } from "../../../lib/firebase";

const WEBMASTER_VID = "739898";

const emptyForm = {
  title: "",
  description: "",
  category: "Approach",
  type: "YouTube",
  url: "",
  thumbnailUrl: "",
  difficulty: "Beginner",
  order: "",
  active: true,
};

function youtubeThumbnail(url) {
  try {
    const parsed = new URL(url);
    const videoId = parsed.searchParams.get("v");

    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }

    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
    }
  } catch {}

  return "";
}

function DocsManager() {
  const [session, setSession] = useState(null);
  const [docs, setDocs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const isWebmaster = String(session?.vid || "") === WEBMASTER_VID;

  useEffect(() => {
    setSession(getClientSession());
  }, []);

  useEffect(() => {
    if (!isWebmaster) return;

    const q = query(collection(db, "trainingDocs"), orderBy("order", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDocs(snapshot.docs.map((item) => ({ firestoreId: item.id, ...item.data() })));
    });

    return () => unsubscribe();
  }, [isWebmaster]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    const thumbnail =
      form.thumbnailUrl ||
      (form.type === "YouTube" ? youtubeThumbnail(form.url) : "");

    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      type: form.type,
      url: form.url,
      thumbnailUrl: thumbnail,
      difficulty: form.difficulty,
      order: Number(form.order || 9999),
      active: form.active,
      updatedAt: serverTimestamp(),
    };

    if (editingId) {
      await updateDoc(doc(db, "trainingDocs", editingId), payload);
    } else {
      await addDoc(collection(db, "trainingDocs"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }

    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, "trainingDocs", id));
  }

  function handleEdit(item) {
    setEditingId(item.firestoreId);
    setForm({
      title: item.title || "",
      description: item.description || "",
      category: item.category || "Approach",
      type: item.type || "Website",
      url: item.url || "",
      thumbnailUrl: item.thumbnailUrl || "",
      difficulty: item.difficulty || "Beginner",
      order: String(item.order || ""),
      active: item.active !== false,
    });
  }

  if (!isWebmaster) {
    return null;
  }

  return (
    <main className="relative z-10 min-h-screen px-6 py-6">
      <Navbar />

      <section className="mx-auto max-w-[1480px] py-10">
        <div className="mb-8">
          <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
            ivao-th / academy cms
          </div>

          <h1 className="mt-3 text-5xl font-black tracking-[-0.04em]">
            <span className="font-normal italic text-[#4b4b48]">Manage</span> training docs
            <span className="text-[#ff5a1f]">.</span>
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Card>
            <div className="space-y-4">
              <input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Title" className="w-full rounded-2xl border border-[#dddbd6] px-4 py-3 font-bold" />

              <textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Description" rows={3} className="w-full rounded-2xl border border-[#dddbd6] px-4 py-3 font-bold" />

              <div className="grid grid-cols-2 gap-4">
                <select value={form.category} onChange={(e) => updateField("category", e.target.value)} className="rounded-2xl border border-[#dddbd6] px-4 py-3 font-bold">
                  <option>Approach</option>
                  <option>Radar</option>
                  <option>Phraseology</option>
                  <option>Charts</option>
                  <option>IFR</option>
                  <option>Exams</option>
                </select>

                <select value={form.type} onChange={(e) => updateField("type", e.target.value)} className="rounded-2xl border border-[#dddbd6] px-4 py-3 font-bold">
                  <option>YouTube</option>
                  <option>Website</option>
                  <option>PDF</option>
                </select>
              </div>

              <input value={form.url} onChange={(e) => updateField("url", e.target.value)} placeholder="Resource URL" className="w-full rounded-2xl border border-[#dddbd6] px-4 py-3 font-bold" />

              <input value={form.thumbnailUrl} onChange={(e) => updateField("thumbnailUrl", e.target.value)} placeholder="Thumbnail URL (optional for YouTube)" className="w-full rounded-2xl border border-[#dddbd6] px-4 py-3 font-bold" />

              <div className="grid grid-cols-2 gap-4">
                <select value={form.difficulty} onChange={(e) => updateField("difficulty", e.target.value)} className="rounded-2xl border border-[#dddbd6] px-4 py-3 font-bold">
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>

                <input value={form.order} onChange={(e) => updateField("order", e.target.value)} placeholder="Order" className="rounded-2xl border border-[#dddbd6] px-4 py-3 font-bold" />
              </div>

              <button onClick={handleSave} className="w-full rounded-2xl bg-black px-5 py-3 font-black text-white">
                {editingId ? "Update Doc" : "Publish Doc"}
              </button>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-[#ececea] px-6 py-5 text-2xl font-black">
              training docs database
            </div>

            {docs.map((item) => (
              <div key={item.firestoreId} className="flex items-center justify-between border-b border-[#ececea] px-6 py-5">
                <div>
                  <div className="font-black">{item.title}</div>
                  <div className="mt-1 text-sm font-bold italic text-[#8b8a84]">
                    {item.category} · {item.type}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => handleEdit(item)} className="rounded-full border border-[#dddbd6] px-3 py-1 text-xs font-black">
                    edit
                  </button>

                  <button onClick={() => handleDelete(item.firestoreId)} className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-600">
                    delete
                  </button>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </section>
    </main>
  );
}

export default function Page() {
  return (
    <ProtectedStaffPage>
      <DocsManager />
    </ProtectedStaffPage>
  );
}
