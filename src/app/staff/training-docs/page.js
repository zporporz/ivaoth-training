"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import Navbar from "../../../components/Navbar";
import Card from "../../../components/ui/Card";
import ProtectedStaffPage from "../../../components/ProtectedStaffPage";
import { useClientSession } from "../../../lib/authSession";
import { adminDataRequest } from "../../../lib/adminDataClient";
import { db } from "../../../lib/firebase";
import { canManageDocs } from "../../../lib/permissions";

const emptyForm = {
  title: "",
  description: "",
  type: "YouTube",
  url: "",
  thumbnailUrl: "",
  order: "",
  active: true,
};

function youtubeThumbnail(url) {
  try {
    const parsed = new URL(url);
    const videoId = parsed.searchParams.get("v");

    if (videoId) return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
    }
  } catch {}

  return "";
}

function DocsManager() {
  const session = useClientSession();
  const [docs, setDocs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const canManage = canManageDocs(session);

  useEffect(() => {
    if (!canManage) return;

    const q = query(collection(db, "trainingDocs"), orderBy("order", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDocs(snapshot.docs.map((item) => ({ firestoreId: item.id, ...item.data() })));
    });

    return () => unsubscribe();
  }, [canManage]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!canManage) return;

    if (!form.title || !form.url) {
      alert("กรอก Title และ Resource URL ก่อน");
      return;
    }

    const thumbnail = form.thumbnailUrl || (form.type === "YouTube" ? youtubeThumbnail(form.url) : "");

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      url: form.url.trim(),
      thumbnailUrl: thumbnail,
      order: Number(form.order || 9999),
      active: form.active,
    };

    if (editingId) {
      await adminDataRequest(`/docs/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      await adminDataRequest("/docs", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id) {
    if (!canManage) return;
    await adminDataRequest(`/docs/${id}`, { method: "DELETE" });
  }

  function handleEdit(item) {
    if (!canManage) return;

    setEditingId(item.firestoreId);
    setForm({
      title: item.title || "",
      description: item.description || "",
      type: item.type || "Website",
      url: item.url || "",
      thumbnailUrl: item.thumbnailUrl || "",
      order: String(item.order || ""),
      active: item.active !== false,
    });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  if (!canManage) {
    return (
      <main className="relative z-10 min-h-screen px-6 py-6">
        <Navbar />
        <section className="mx-auto max-w-[900px] py-20">
          <Card>
            <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">restricted access</div>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em]">
              Training staff access required<span className="text-[#ff5a1f]">.</span>
            </h1>
            <div className="mt-5 text-base font-semibold text-[#4b4b48]">
              This page is available to IVAO Thailand training staff.
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
        <div className="mb-8">
          <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">ivao-th / academy cms</div>
          <h1 className="mt-3 text-5xl font-black tracking-[-0.04em]">
            <span className="font-normal italic text-[#4b4b48]">Manage</span> training docs<span className="text-[#ff5a1f]">.</span>
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div className="text-xs font-black uppercase text-[#8b8a84]">{editingId ? "Edit Doc" : "Add Doc"}</div>
              {editingId && <button onClick={handleCancelEdit} className="rounded-full border border-[#dddbd6] px-3 py-1 text-xs font-black text-[#4b4b48]">cancel</button>}
            </div>

            <div className="space-y-4">
              <input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Title" className="w-full rounded-2xl border border-[#dddbd6] px-4 py-3 font-bold outline-none" />
              <textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Description" rows={3} className="w-full rounded-2xl border border-[#dddbd6] px-4 py-3 font-bold outline-none" />
              <select value={form.type} onChange={(e) => updateField("type", e.target.value)} className="w-full rounded-2xl border border-[#dddbd6] px-4 py-3 font-bold outline-none"><option>YouTube</option><option>Website</option><option>PDF</option></select>
              <input value={form.url} onChange={(e) => updateField("url", e.target.value)} placeholder="Resource URL" className="w-full rounded-2xl border border-[#dddbd6] px-4 py-3 font-bold outline-none" />
              <input value={form.thumbnailUrl} onChange={(e) => updateField("thumbnailUrl", e.target.value)} placeholder="Thumbnail URL / card cover image" className="w-full rounded-2xl border border-[#dddbd6] px-4 py-3 font-bold outline-none" />
              <input value={form.order} onChange={(e) => updateField("order", e.target.value.replace(/[^0-9]/g, ""))} placeholder="Order e.g. 1, 2, 3" inputMode="numeric" className="w-full rounded-2xl border border-[#dddbd6] px-4 py-3 font-bold outline-none" />
              <label className="flex items-center gap-3 rounded-2xl border border-[#ececea] bg-[#fbfbfa] px-4 py-3 font-bold text-[#4b4b48]"><input type="checkbox" checked={form.active} onChange={(e) => updateField("active", e.target.checked)} />Active / show on Training Docs</label>
              <button onClick={handleSave} className="w-full rounded-2xl bg-black px-5 py-3 font-black text-white">{editingId ? "Update Doc" : "Publish Doc"}</button>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-[#ececea] px-6 py-5 text-2xl font-black">training docs database</div>
            <div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
              {docs.length === 0 ? <div className="px-6 py-8 text-sm font-bold text-[#8b8a84]">No docs yet.</div> : docs.map((item) => (
                <div key={item.firestoreId} className="flex items-center justify-between border-b border-[#ececea] px-6 py-5">
                  <div><div className="font-black">{item.title}</div><div className="mt-1 text-sm font-bold italic text-[#8b8a84]">#{item.order ?? "-"} · {item.type} {item.active === false ? "· inactive" : ""}</div></div>
                  <div className="flex gap-2"><button onClick={() => handleEdit(item)} className="rounded-full border border-[#dddbd6] px-3 py-1 text-xs font-black">edit</button><button onClick={() => handleDelete(item.firestoreId)} className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-600">delete</button></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}

export default function Page() {
  return <ProtectedStaffPage><DocsManager /></ProtectedStaffPage>;
}
