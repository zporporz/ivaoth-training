import { NextResponse } from "next/server";

const TRAINING_PORTAL_URL = "https://ivaoth-training.vercel.app/staff";

function field(name, value, inline = true) {
  return {
    name,
    value: value ? String(value).slice(0, 1024) : "-",
    inline,
  };
}

function buildEmbed(action, session) {
  const isModify = action === "modified";
  const color = isModify ? 0x16a34a : 0xff5a1f;
  const title = isModify ? "🟢 Session Modified" : "🟠 New Session Arrival";

  return {
    title,
    color,
    description: `**${session.program || "-"} · ${session.type || "Training Session"}**\n${session.topic || "-"}`,
    fields: [
      field("Date", session.date),
      field("Time", session.time),
      field("Position", session.position),
      field("Trainee", `${session.traineeName || session.trainee || "-"}${session.traineeVid ? ` (${session.traineeVid})` : ""}`, false),
      field("Trainer", `${session.trainerName || "-"}${session.trainerStaffPosition ? ` · ${session.trainerStaffPosition}` : ""}`, false),
      field("Status", session.status),
      field("Open Portal", TRAINING_PORTAL_URL, false),
    ],
    footer: {
      text: "IVAO Thailand Training Portal",
    },
    timestamp: new Date().toISOString(),
  };
}

export async function POST(request) {
  const webhookUrl = process.env.DISCORD_TRAINING_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json(
      { ok: false, error: "DISCORD_TRAINING_WEBHOOK_URL is not configured" },
      { status: 200 }
    );
  }

  try {
    const body = await request.json();
    const action = body?.action === "modified" ? "modified" : "new";
    const session = body?.session || {};

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "<@&1494746777432096818>",
        username: "IVAO TH Training Portal",
        embeds: [buildEmbed(action, session)],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 5,
                label: "Open Training Portal",
                url: TRAINING_PORTAL_URL,
              },
            ],
          },
        ],
        allowed_mentions: {
          roles: ["1494746777432096818"],
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: `Discord webhook failed: ${response.status}`, detail: text.slice(0, 500) },
        { status: 200 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unknown Discord webhook error" },
      { status: 200 }
    );
  }
}
