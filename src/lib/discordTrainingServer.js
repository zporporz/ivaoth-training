const PORTAL = "https://ivaoth-training.vercel.app/staff";
const ROLE = "1494746777432096818";
const ACTIONS = {
  new: { title: "New Session Arrival", color: 0xff5a1f },
  modified: { title: "Session Modified", color: 0x16a34a },
  deleted: { title: "Session Deleted", color: 0xdc2626 },
  cancelled: { title: "Session Cancelled", color: 0xdc2626 },
};

export function buildTrainingNotification(action, session) {
  const appearance = ACTIONS[action];
  if (!appearance) throw new Error("Invalid notification action");
  const field = (name, value, inline = true) => ({ name, value: String(value || "-").slice(0, 1024), inline });
  const exam = session.type?.includes("Exam");
  return {
    content: `<@&${ROLE}>`, username: "IVAO TH Training Portal",
    allowed_mentions: { roles: [ROLE], parse: [] },
    embeds: [{
      ...appearance,
      description: `**${session.program || "-"} · ${session.type || "Training Session"}**\n${session.topic || "-"}`.slice(0, 4096),
      fields: [
        field("Date", session.date), field("Time", session.time), field("Position", session.position),
        field(exam ? "Examinee" : "Trainee", `${session.traineeName || session.trainee || "-"}${session.traineeVid ? ` (${session.traineeVid})` : ""}`, false),
        field(exam ? "Examiner" : "Trainer", `${session.trainerName || "-"}${session.trainerStaffPosition ? ` · ${session.trainerStaffPosition}` : ""}`, false),
        field("Status", action === "deleted" ? "Deleted" : action === "cancelled" ? "Cancelled" : session.status),
        field("Open Portal", PORTAL, false),
      ],
      footer: { text: "IVAO Thailand Training Portal" }, timestamp: new Date().toISOString(),
    }],
    components: [{ type: 1, components: [{ type: 2, style: 5, label: "Open Training Portal", url: PORTAL }] }],
  };
}

export async function sendTrainingNotification(action, session, { webhookUrl = process.env.DISCORD_TRAINING_WEBHOOK_URL, fetcher = fetch } = {}) {
  if (!webhookUrl) throw new Error("Discord webhook is not configured");
  const response = await fetcher(webhookUrl, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildTrainingNotification(action, session)),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Discord webhook returned HTTP ${response.status}`);
}
