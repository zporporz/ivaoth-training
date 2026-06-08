import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getBangkokTodayKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export async function GET() {
  const now = new Date();

  return NextResponse.json(
    {
      todayKey: getBangkokTodayKey(now),
      serverTime: now.toISOString(),
      timeZone: "Asia/Bangkok",
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
