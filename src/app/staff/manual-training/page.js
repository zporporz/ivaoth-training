"use client";

import { useEffect, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import ProtectedStaffPage from "../../../components/ProtectedStaffPage";
import Navbar from "../../../components/Navbar";
import Card from "../../../components/ui/Card";
import { useClientSession } from "../../../lib/authSession";
import { db } from "../../../lib/firebase";
import { CORE_WEBMASTER_VID, isCoreWebmasterVid } from "../../../lib/useWebmasterAccess";
import programs from "../../../data/programs";

const emptyForm = {
  date: "",
  time: "",
  program: "ASx",
  type: "Theory Training",
  position: "",
  traineeVid: "",
  traineeName: "",
  trainerVid: "",
  trainerName: "",
  trainerStaffPosition: "",
  topic: "",
  remarks: "",
};

function timeToPickerValue(value) {
  const match = String(value || "").match(/^(\d{2})(\d{2})Z?$/i);
  if (!match) return "";
  return `${match[1]}:${match[2]}`;
}

function pickerValueToZulu(value) {
  if (!value) return "";
  const [hour = "00", minute = "00"] = value.split(":");
  return `${hour.padStart(2, "0")}${minute.padStart(2, "0")}Z`;
}

function ManualTrainingManager() {
  const session = useClientSession();
  const [form, setForm] = useState(emptyForm);
  const [traineeLookupStatus, setTraineeLookupStatus] = useState("idle");
  const [trainerLookupStatus, setTrainerLookupStatus] = useState("idle");

  const isCoreOwner = isCoreWebmasterVid(session?.vid);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    const traineeVid = form.traineeVid.trim();

    if (traineeVid.length < 5) {
      const timeout = setTimeout(() => setTraineeLookupStatus("idle"), 0);
      return () => clearTimeout(timeout);
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setTraineeLookupStatus("loading");
        const response = await fetch(`/api/ivao/user/${traineeVid}`, { signal: controller.signal });

        if (!response.ok) {
          setTraineeLookupStatus("not-found");
          return;
        }

        const data = await response.json();
        setForm((prev) => {
          if (prev.traineeVid !== traineeVid) return prev;
          return { ...prev, traineeName: data.name || prev.traineeName };
        });
        setTraineeLookupStatus("found");
      } catch (error) {
        if (error.name !== "AbortError") setTraineeLookupStatus("error");
      }
    }, 600);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [form.traineeVid]);

  useEffect(() => {
    const trainerVid = form.trainerVid.trim();

    if (trainerVid.length < 5) {
      const timeout = setTimeout(() => setTrainerLookupStatus("idle"), 0);
      return () => clearTimeout(timeout);
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setTrainerLookupStatus("loading");
        const response = await fetch(`/api/ivao/user/${trainerVid}`, { signal: controller.signal });

        if (!response.ok) {
          setTrainerLookupStatus("not-found");
          return;
        }

        const data = await response.json();
        setForm((prev) => {
          if (prev.trainerVid !== trainerVid) return prev;
          return { ...prev, trainerName: data.name || prev.trainerName };
        });
        setTrainerLookupStatus("found");
      } catch (error) {
        if (error.name !== "AbortError") setTrainerLookupStatus("error");
      }
    }, 600);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [form.trainerVid]);

  async function handlePublish() {
    if (!isCoreOwner) return;

    if (
      !form.date ||
      !form.time ||
      !form.position ||
      !form.traineeName ||
      !form.traineeVid ||
      !form.trainerName ||
      !form.trainerVid ||
      !form.topic
    ) {
      alert("กรอก Date, Time, Position, Trainee, Trainer และ Topic ก่อน");
      return;
    }

    const isExam = form.type.includes("Exam");
    const isOfficial = form.type.includes("Official");

    await addDoc(collection(db, "trainingSessions"), {
      date: form.date,
      time: form.time,
      program: form.program,
      type: form.type,
      topic: form.topic.trim(),
      remarks: form.remarks.trim(),
      position: form.position.toUpperCase(),
      traineeName: form.traineeName.trim(),
      traineeVid: form.traineeVid.trim(),
      trainerName: form.trainerName.trim(),
      trainerVid: form.trainerVid.trim(),
      trainerStaffPosition: form.trainerStaffPosition.trim(),
      status: isExam ? "Exam" : isOfficial ? "Official" : "Scheduled",
      createdByWebmaster: String(session?.vid || ""),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setForm(emptyForm);
    setTraineeLookupStatus("idle");
    setTrainerLookupStatus("idle");
    alert("Manual training session published.");
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
              Only VID {CORE_WEBMASTER_VID} can manually add training for another trainer.
            </div>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="relative z-10 min-h-screen px-6 py-6">
      <Navbar />

      <section className="mx-auto max-w-[1100px] py-10">
        <div className="mb-8">
          <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
            ivao-th / core webmaster / manual training
          </div>

          <h1 className="mt-3 text-5xl font-black tracking-[-0.04em]">
            <span className="font-normal italic text-[#4b4b48]">Manual</span> add training
            <span className="text-[#ff5a1f]">.</span>
          </h1>

          <div className="mt-4 max-w-3xl text-base font-semibold text-[#6d6d68]">
            Create a training session on behalf of another trainer. The session owner will be the trainer entered below, not VID {CORE_WEBMASTER_VID}.
          </div>
        </div>

        <Card>
          <div className="grid gap-5 md:grid-cols-2">
            <input type="date" value={form.date} onChange={(e) => updateForm("date", e.target.value)} className="w-full cursor-pointer rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none" />

            <div className="relative">
              <input type="time" step="300" value={timeToPickerValue(form.time)} onChange={(e) => updateForm("time", pickerValueToZulu(e.target.value))} className="w-full cursor-pointer rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 pr-16 font-bold outline-none" />
              <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-[#8b8a84]">Z</span>
            </div>

            <select value={form.program} onChange={(e) => updateForm("program", e.target.value)} className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none">
              {programs.map((program) => (
                <option key={program.code} value={program.code}>
                  {program.code} — {program.name}
                </option>
              ))}
            </select>

            <select value={form.type} onChange={(e) => updateForm("type", e.target.value)} className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none">
              <option>Theory Training</option><option>Unofficial Practical</option><option>Official Practical</option><option>Theory Exam</option><option>Practical Exam</option>
            </select>

            <input value={form.position} onChange={(e) => updateForm("position", e.target.value)} placeholder="Position e.g. VTBS_TWR" className="md:col-span-2 w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold uppercase outline-none" />

            <div>
              <input value={form.trainerVid} onChange={(e) => updateForm("trainerVid", e.target.value.replace(/\D/g, ""))} placeholder="Trainer VID *" inputMode="numeric" className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none" />
              {trainerLookupStatus !== "idle" && (
                <div className={`mt-2 text-xs font-black ${trainerLookupStatus === "found" ? "text-[#16a34a]" : trainerLookupStatus === "loading" ? "text-[#8b8a84]" : "text-red-600"}`}>
                  {trainerLookupStatus === "loading" && "Looking up trainer profile..."}
                  {trainerLookupStatus === "found" && "Trainer name filled from IVAO profile."}
                  {trainerLookupStatus === "not-found" && "Could not find this trainer VID. You can still type the name manually."}
                  {trainerLookupStatus === "error" && "Could not lookup trainer VID right now. You can still type the name manually."}
                </div>
              )}
            </div>

            <input value={form.trainerName} onChange={(e) => updateForm("trainerName", e.target.value)} placeholder="Trainer name *" className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none" />

            <input value={form.trainerStaffPosition} onChange={(e) => updateForm("trainerStaffPosition", e.target.value)} placeholder="Trainer position e.g. TH-TC" className="md:col-span-2 w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold uppercase outline-none" />

            <div>
              <input value={form.traineeVid} onChange={(e) => updateForm("traineeVid", e.target.value.replace(/\D/g, ""))} placeholder="Trainee VID *" inputMode="numeric" className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none" />
              {traineeLookupStatus !== "idle" && (
                <div className={`mt-2 text-xs font-black ${traineeLookupStatus === "found" ? "text-[#16a34a]" : traineeLookupStatus === "loading" ? "text-[#8b8a84]" : "text-red-600"}`}>
                  {traineeLookupStatus === "loading" && "Looking up trainee profile..."}
                  {traineeLookupStatus === "found" && "Trainee name filled from IVAO profile."}
                  {traineeLookupStatus === "not-found" && "Could not find this trainee VID. You can still type the name manually."}
                  {traineeLookupStatus === "error" && "Could not lookup trainee VID right now. You can still type the name manually."}
                </div>
              )}
            </div>

            <input value={form.traineeName} onChange={(e) => updateForm("traineeName", e.target.value)} placeholder="Trainee name *" className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none" />

            <textarea value={form.topic} onChange={(e) => updateForm("topic", e.target.value)} placeholder="Session topic / what will be trained" rows={4} className="md:col-span-2 w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none" />

            <textarea value={form.remarks} onChange={(e) => updateForm("remarks", e.target.value)} placeholder="Remarks / preparation / frequency / notes" rows={3} className="md:col-span-2 w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none" />
          </div>

          <button onClick={handlePublish} className="mt-6 w-full cursor-pointer rounded-2xl bg-black px-5 py-3 font-black text-white transition hover:-translate-y-0.5 hover:bg-[#16a34a] hover:shadow-lg active:translate-y-0">
            Publish Manual Training
          </button>
        </Card>
      </section>
    </main>
  );
}

export default function ManualTrainingPage() {
  return (
    <ProtectedStaffPage>
      <ManualTrainingManager />
    </ProtectedStaffPage>
  );
}
