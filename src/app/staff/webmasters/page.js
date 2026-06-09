"use client";

import { useEffect, useState } from "react";

import { adminDataRequest } from "../../../lib/adminDataClient";
import ProtectedStaffPage from "../../../components/ProtectedStaffPage";
import Navbar from "../../../components/Navbar";
import Card from "../../../components/ui/Card";
import { useClientSession } from "../../../lib/authSession";
import { CORE_WEBMASTER_VID, isCoreWebmasterVid } from "../../../lib/useWebmasterAccess";

const emptyForm = {
  vid: "",
  name: "",
  note: "",
};

function withCoreWebmaster(list) {
  const hasCoreOwner = list.some(
    (item) => String(item.vid || item.firestoreId) === CORE_WEBMASTER_VID,
  );
  if (hasCoreOwner) return list;

  return [
    {
      firestoreId: CORE_WEBMASTER_VID,
      vid: CORE_WEBMASTER_VID,
      name: "Ecgkasit Bunyakhachai",
      note: "Core webmaster",
      active: true,
      protected: true,
    },
    ...list,
  ];
}

function WebmasterManager() {
  const session = useClientSession();
  const [webmasters, setWebmasters] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const isCoreOwner = isCoreWebmasterVid(session?.vid);

  async function loadWebmasters(signal) {
    const data = await adminDataRequest("/webmasters", { signal });
    setWebmasters(withCoreWebmaster(data.webmasters || []));
  }

  useEffect(() => {
    if (!isCoreOwner) return;
    const controller = new AbortController();
    adminDataRequest("/webmasters", { signal: controller.signal })
      .then((data) => setWebmasters(withCoreWebmaster(data.webmasters || [])))
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });
    return () => controller.abort();
  }, [isCoreOwner]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAddWebmaster() {
    if (!isCoreOwner) return;

    const cleanVid = form.vid.replace(/\D/g, "").trim();

    if (!cleanVid || !form.name.trim()) {
      alert("กรอก VID และ Name ก่อน");
      return;
    }

    await adminDataRequest("/webmasters", {
      method: "POST",
      body: JSON.stringify({
        vid: cleanVid,
        name: form.name.trim(),
        note: form.note.trim(),
      }),
    });

    setForm(emptyForm);
    await loadWebmasters();
  }

  async function handleDeleteWebmaster(item) {
    if (!isCoreOwner) return;

    const vid = String(item.vid || item.firestoreId || "");

    if (isCoreWebmasterVid(vid)) {
      alert("Core webmaster 739898 cannot be removed.");
      return;
    }

    await adminDataRequest(`/webmasters/${vid}`, { method: "DELETE" });
    await loadWebmasters();
  }

  if (!isCoreOwner) {
    return (
      <main className="relative z-10 min-h-screen px-6 py-6">
        <Navbar />

        <section className="mx-auto max-w-[900px] py-20">
          <Card>
            <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">restricted access</div>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em]">
              <span className="font-normal italic text-[#4b4b48]">Core</span> webmaster only
              <span className="text-[#ff5a1f]">.</span>
            </h1>
            <div className="mt-5 text-base font-semibold text-[#4b4b48]">
              Only VID {CORE_WEBMASTER_VID} can manage webmaster access.
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
            ivao-th / system access / core webmaster
          </div>

          <h1 className="mt-3 text-5xl font-black tracking-[-0.04em]">
            <span className="font-normal italic text-[#4b4b48]">Manage</span> webmasters
            <span className="text-[#ff5a1f]">.</span>
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Card>
            <div className="text-xs font-black uppercase text-[#8b8a84]">Add Webmaster</div>

            <div className="mt-5 space-y-4">
              <input
                value={form.vid}
                onChange={(e) => updateField("vid", e.target.value.replace(/\D/g, ""))}
                placeholder="VID"
                className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
              />

              <input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Full name"
                className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
              />

              <textarea
                value={form.note}
                onChange={(e) => updateField("note", e.target.value)}
                placeholder="Note / reason"
                rows={4}
                className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
              />

              <button onClick={handleAddWebmaster} className="w-full rounded-2xl bg-black px-5 py-3 font-black text-white transition hover:bg-[#16a34a]">
                Add Webmaster
              </button>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-[#ececea] px-6 py-5">
              <div className="text-2xl font-black">
                <span className="font-normal italic text-[#8b8a84]">webmaster/</span>access list
              </div>
            </div>

            <div>
              {webmasters.map((item) => {
                const vid = String(item.vid || item.firestoreId || "");
                const protectedOwner = isCoreWebmasterVid(vid);

                return (
                  <div key={vid} className="grid grid-cols-[1fr_160px] items-center gap-4 border-b border-[#ececea] px-6 py-5">
                    <div>
                      <div className="font-black">{item.name || "Unnamed webmaster"}</div>
                      <div className="mt-1 text-sm font-bold italic text-[#8b8a84]">
                        VID {vid} {protectedOwner ? "· core protected" : ""}
                      </div>

                      {item.note && <div className="mt-2 text-sm font-semibold text-[#4b4b48]">{item.note}</div>}
                    </div>

                    <div className="flex justify-end">
                      {protectedOwner ? (
                        <span className="rounded-full bg-[#0a2342] px-3 py-1 text-xs font-black text-white">locked</span>
                      ) : (
                        <button
                          onClick={() => handleDeleteWebmaster(item)}
                          className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-600 hover:bg-red-100"
                        >
                          remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}

export default function WebmastersPage() {
  return (
    <ProtectedStaffPage>
      <WebmasterManager />
    </ProtectedStaffPage>
  );
}
