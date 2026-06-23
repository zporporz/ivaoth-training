import Card from "../ui/Card";
import { numericInputToZulu, timeToNumericInput } from "../../lib/staffSessions";
import programs from "../../data/programs";
import sessionTypes from "../../data/sessionTypes";

export default function SessionForm({
  editingId,
  form,
  loginSession,
  traineeLookupStatus,
  trainerLabel,
  onChange,
  onCancelEdit,
  onSubmit,
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="text-xs font-black uppercase text-[#8b8a84]">
          {editingId ? "Edit Session" : "Create Session"}
        </div>

        {editingId && (
          <button
            onClick={onCancelEdit}
            className="cursor-pointer rounded-full border border-[#dddbd6] bg-white px-3 py-1 text-xs font-black text-[#4b4b48] hover:bg-[#f3f3f1]"
          >
            cancel edit
          </button>
        )}
      </div>

      <div className="mt-3 rounded-2xl border border-[#ececea] bg-[#fbfbfa] px-4 py-3 text-sm font-bold text-[#8b8a84]">
        Trainer: {loginSession ? trainerLabel(loginSession) : "-"}
      </div>

      <div className="mt-5 space-y-4">
        <input
          type="date"
          value={form.date}
          onChange={(event) => onChange("date", event.target.value)}
          className="w-full cursor-pointer rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
        />

        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={5}
            placeholder="HH:MM"
            value={timeToNumericInput(form.time)}
            onChange={(event) => onChange("time", numericInputToZulu(event.target.value))}
            className="w-full cursor-pointer rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 pr-16 font-bold outline-none"
          />
          <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-[#8b8a84]">
            Z
          </span>
        </div>

        <select
          value={form.program}
          onChange={(event) => onChange("program", event.target.value)}
          className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
        >
          {programs.map((program) => (
            <option key={program.code} value={program.code}>
              {program.code} — {program.name}
            </option>
          ))}
        </select>

        <select
          value={form.type}
          onChange={(event) => onChange("type", event.target.value)}
          className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
        >
          {sessionTypes.map((type) => (
            <option key={type.id}>{type.label}</option>
          ))}
        </select>

        <input
          value={form.position}
          onChange={(event) => onChange("position", event.target.value)}
          placeholder="Position e.g. VTBS_TWR"
          className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold uppercase outline-none"
        />

        <div>
          <input
            value={form.traineeVid}
            onChange={(event) => onChange("traineeVid", event.target.value.replace(/\D/g, ""))}
            placeholder="Trainee VID *"
            inputMode="numeric"
            className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
          />

          {traineeLookupStatus !== "idle" && (
            <div
              className={`mt-2 text-xs font-black ${
                traineeLookupStatus === "found"
                  ? "text-[#16a34a]"
                  : traineeLookupStatus === "history-found"
                    ? "text-[#0a2342]"
                  : traineeLookupStatus === "loading"
                    ? "text-[#8b8a84]"
                    : "text-red-600"
              }`}
            >
              {traineeLookupStatus === "loading" && "Looking up IVAO profile..."}
              {traineeLookupStatus === "found" && "Trainee name filled from IVAO profile."}
              {traineeLookupStatus === "history-found" &&
                "Trainee name filled from existing training records."}
              {traineeLookupStatus === "not-found" &&
                "Could not find this VID. You can still type the name manually."}
              {traineeLookupStatus === "error" &&
                "Could not lookup VID right now. You can still type the name manually."}
            </div>
          )}
        </div>

        <input
          value={form.traineeName}
          onChange={(event) => onChange("traineeName", event.target.value)}
          placeholder="Trainee name *"
          className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
        />

        <textarea
          value={form.topic}
          onChange={(event) => onChange("topic", event.target.value)}
          placeholder="Session topic / what will be trained today"
          rows={4}
          className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
        />

        <textarea
          value={form.remarks}
          onChange={(event) => onChange("remarks", event.target.value)}
          placeholder="Remarks / preparation / frequency / notes"
          rows={3}
          className="w-full rounded-2xl border border-[#dddbd6] bg-[#fbfbfa] px-4 py-3 font-bold outline-none"
        />

        <button
          onClick={onSubmit}
          className="w-full cursor-pointer rounded-2xl bg-black px-5 py-3 font-black text-white transition hover:-translate-y-0.5 hover:bg-[#16a34a] hover:shadow-lg active:translate-y-0"
        >
          {editingId ? "Update Session" : "Publish Session"}
        </button>
      </div>
    </Card>
  );
}
