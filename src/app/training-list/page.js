"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

import Navbar from "../../components/Navbar";
import Card from "../../components/ui/Card";
import { db } from "../../lib/firebase";

function initials(name) {
  return String(name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

function StaffAvatar({ staff }) {
  if (staff.avatarUrl) {
    return (
      <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-[#ececea] bg-[#fbfbfa]">
        <Image src={staff.avatarUrl} alt={staff.name} fill className="object-cover" sizes="64px" />
      </div>
    );
  }

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] text-xl font-black text-[#8b8a84]">
      {initials(staff.name)}
    </div>
  );
}

export default function TrainingListPage() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(collection(db, "trainingStaff"), orderBy("position", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStaffList(snapshot.docs.map((item) => ({ firestoreId: item.id, ...item.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const activeStaff = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return staffList
      .filter((staff) => staff.active !== false)
      .filter((staff) => {
        if (!keyword) return true;
        return [staff.name, staff.vid, staff.position, staff.division]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      });
  }, [staffList, search]);

  return (
    <main className="relative z-10 min-h-screen px-6 py-6">
      <Navbar />

      <section className="mx-auto max-w-[1480px] py-10">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-[#8b8a84]">
              ivao-th / training department
            </div>

            <h1 className="mt-3 text-5xl font-black tracking-[-0.04em]">
              <span className="font-normal italic text-[#4b4b48]">Training</span>{" "}
              list<span className="text-[#ff5a1f]">.</span>
            </h1>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, VID, position..."
            className="w-full rounded-2xl border border-[#dddbd6] bg-white/70 px-5 py-3 font-bold outline-none lg:max-w-sm"
          />
        </div>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[#ececea] px-6 py-5">
            <div className="text-2xl font-black">
              <span className="font-normal italic text-[#8b8a84]">staff/</span>
              members
            </div>

            <div className="rounded-full bg-black px-4 py-2 text-sm font-black text-white">
              {activeStaff.length} active
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-8 text-sm font-bold text-[#8b8a84]">Loading training staff...</div>
          ) : activeStaff.length === 0 ? (
            <div className="px-6 py-8 text-sm font-bold text-[#8b8a84]">No active training staff found.</div>
          ) : (
            <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
              {activeStaff.map((staff) => (
                <div key={staff.firestoreId} className="rounded-3xl border border-[#ececea] bg-white/70 p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <StaffAvatar staff={staff} />

                    <div className="min-w-0">
                      <div className="truncate text-xl font-black">{staff.name}</div>
                      <div className="mt-1 text-sm font-bold italic text-[#8b8a84]">VID {staff.vid}</div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#0a2342] px-3 py-1 text-xs font-black text-white">
                      {staff.position || "Training Staff"}
                    </span>
                    <span className="rounded-full border border-[#dddbd6] bg-[#fbfbfa] px-3 py-1 text-xs font-black text-[#4b4b48]">
                      {staff.division || "TH"}
                    </span>
                  </div>

                  {staff.bio && <div className="mt-4 text-sm font-semibold text-[#4b4b48]">{staff.bio}</div>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </main>
  );
}
