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

import ProtectedStaffPage from "../../../components/ProtectedStaffPage";
import Navbar from "../../../components/Navbar";
import Card from "../../../components/ui/Card";
import { useClientSession } from "../../../lib/authSession";
import { db } from "../../../lib/firebase";

const WEBMASTER_VID = "739898";

const emptyForm = {
  order: "",
  vid: "",
  name: "",
  position: "",
  division: "TH",
  avatarUrl: "",
  bio: "",
  active: true,
};

function sortTrainingStaff(a, b) {
  const orderA = Number.isFinite(Number(a.order)) ? Number(a.order) : 9999;
  const orderB = Number.isFinite(Number(b.order)) ? Number(b.order) : 9999;

  if (orderA !== orderB) return orderA - orderB;

  const positionCompare = String(a.position || "").localeCompare(String(b.position || ""));
  if (positionCompare !== 0) return positionCompare;

  return String(a.name || "").localeCompare(String(b.name || ""));
}

function TrainingStaffManager() {
  const [staffList, setStaffList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const session = useClientSession();
  const [form, setForm] = useState({
    ...emptyForm,
    order: "0",
    vid: "739898",
    name: "Ecgkasit Bunyakhachai",
    position: "TH-WM",
    avatarUrl: "/staff/avatars/739898.jpg",
    bio: "IVAO Thailand Training Portal Webmaster",
  });

  const isWebmaster = String(session?.vid || "") === WEBMASTER_VID;

  useEffect(() => {
    if (!isWebmaster) return;

    const q = query(collection(db, "trainingStaff"), orderBy("position", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((item) => ({ firestoreId: item.id, ...item.data() }));
      setStaffList(data.sort(sortTrainingStaff));
    });

    return () => unsubscribe();
  }, [isWebmaster]);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!isWebmaster) return;

    if (!form.vid || !form.name) {
      alert("VID และ Name จำเป็นต้องกรอก");
      return;
    }

    const payload = {
      order: form.order === "" ? 9999 : Number(form.order),
      vid: form.vid.trim(),
      name: form.name.trim(),
      position: form.position.trim(),
      division: form.division.trim() || "TH",
      avatarUrl: form.avatarUrl.trim(),
      bio: form.bio.trim(),
      active: form.active,
      updatedAt: serverTimestamp(),
    };

    if (editingId) {
      await updateDoc(doc(db, "trainingStaff", editingId), payload);
    } else {
      await addDoc(collection(db, "trainingStaff"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }

    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id) {
    if (!isWebmaster) return;
    await deleteDoc(doc(db, "trainingStaff", id));
  }

  function handleEdit(staff) {
    if (!isWebmaster) return;

    setEditingId(staff.firestoreId);
    setForm({
      order: staff.order ?? "",
      vid: staff.vid || "",
      name: staff.name || "",
      position: staff.position || "",
      division: staff.division || "TH",
      avatarUrl: staff.avatarUrl || "",
      bio: staff.bio || "",
      active: staff.active !== false,
    });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  if (!isWebmaster) {
    return (
      <main className="relative z-10 min-h-screen px-6 py-6">
        <Navbar />

        <section className="mx-auto max-w-[900px] py-20">
          <Card>
            <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">restricted access</div>

            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em]">
              <span className="font-normal italic text-[#4b4b48]">Webmaster</span> access only
              <span className="text-[#ff5a1f]">.</span>
            </h1>

            <div className="mt-5 text-base font-semibold text-[#4b4b48]">
              This page is restricted to the IVAO Thailand Training Portal webmaster.
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
          <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
            ivao-th / training department / webmaster
          </div>

          <h1 className="mt-3 text-5xl font-black tracking-[-0.04em]">
            <span className="font-normal italic text-[#4b4b48]">Manage</span> training list
            <span className="text-[#ff5a1f]">.</span>
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <Card>
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase text-[#8b8a84]">
                {editingId ? "Edit Training Staff" : "Add Training Staff"}
              </div>

              {editingId && (
                <button
                  onClick={handleCancelEdit}
                  className="rounded-full border border-[#dddbd6] bg-white px-3 py-1 text-xs font-black text-[#4b4b48] hover:bg-[#f3f3f1]"
                >
                  cancel edit
                </button>
              )}
            </div>

            <div className="mt-5 space-y-4">
              <input
                value={form.order}
                onChange={(e) => updateForm("order", e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Order e.g. 0, 1, 2"
                inputMode="numeric"
                className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
              />

              <input
                value={form.vid}
                onChange={(e) => updateForm("vid", e.target.value.replace(/\D/g, ""))}
                placeholder="VID"
                className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
              />

              <input
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                placeholder="Full name"
                className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
              />

              <input
                value={form.position}
                onChange={(e) => updateForm("position", e.target.value)}
                placeholder="Position e.g. TH-DT2"
                className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold uppercase outline-none"
              />

              <input
                value={form.division}
                onChange={(e) => updateForm("division", e.target.value)}
                placeholder="Division"
                className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold uppercase outline-none"
              />

              <input
                value={form.avatarUrl}
                onChange={(e) => updateForm("avatarUrl", e.target.value)}
                placeholder="Avatar URL e.g. /staff/avatars/739898.jpg"
                className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
              />

              <textarea
                value={form.bio}
                onChange={(e) => updateForm("bio", e.target.value)}
                placeholder="Bio / description"
                rows={4}
                className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
              />

              <label className="flex items-center gap-3 rounded-2xl border border-[#ececea] bg-[#fbfbfa] px-4 py-3 font-bold text-[#4b4b48]">
                <input type="checkbox" checked={form.active} onChange={(e) => updateForm("active", e.target.checked)} />
                Active staff member
              </label>

              <button onClick={handleSave} className="w-full rounded-2xl bg-black px-5 py-3 font-black text-white transition hover:bg-[#16a34a]">
                {editingId ? "Update Staff" : "Add Staff"}
              </button>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-[#ececea] px-6 py-5">
              <div className="text-2xl font-black">
                <span className="font-normal italic text-[#8b8a84]">training/</span>staff database
              </div>
            </div>

            <div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
              {staffList.length === 0 ? (
                <div className="px-6 py-8 text-sm font-bold text-[#8b8a84]">No staff added yet.</div>
              ) : (
                staffList.map((staff) => (
                  <div key={staff.firestoreId} className="grid grid-cols-[70px_1fr_180px] items-center gap-4 border-b border-[#ececea] px-6 py-5">
                    <div className="rounded-full bg-[#fbfbfa] px-3 py-1 text-center text-xs font-black text-[#8b8a84]">
                      #{staff.order ?? "-"}
                    </div>

                    <div>
                      <div className="font-black">{staff.name}</div>
                      <div className="mt-1 text-sm font-bold italic text-[#8b8a84]">
                        {staff.position || "Training Staff"} · VID {staff.vid}
                        {staff.active === false ? " · inactive" : ""}
                      </div>

                      {staff.avatarUrl && <div className="mt-1 text-xs font-black text-[#8b8a84]">{staff.avatarUrl}</div>}
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(staff)} className="rounded-full border border-[#dddbd6] bg-white px-3 py-1 text-xs font-black text-[#4b4b48] hover:bg-[#f3f3f1]">
                        edit
                      </button>

                      <button onClick={() => handleDelete(staff.firestoreId)} className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-600 hover:bg-red-100">
                        delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}

export default function TrainingStaffPage() {
  return (
    <ProtectedStaffPage>
      <TrainingStaffManager />
    </ProtectedStaffPage>
  );
}
