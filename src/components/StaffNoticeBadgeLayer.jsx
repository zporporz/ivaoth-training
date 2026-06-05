"use client";

import { useEffect } from "react";
import { getClientSession } from "../lib/authSession";

function noticeKey(vid) {
  return `staff-session-bell-notices-${vid}`;
}

function makeBadge(type) {
  const badge = document.createElement("span");
  badge.dataset.staffNoticeBadge = type;
  badge.textContent = type === "new" ? "NEW" : "MODIFIED";
  badge.className =
    type === "new"
      ? "inline-flex w-fit shrink-0 rounded-full bg-[#ff5a1f] px-2 py-1 text-[10px] font-black leading-none text-white"
      : "inline-flex w-fit shrink-0 rounded-full bg-[#16a34a] px-2 py-1 text-[10px] font-black leading-none text-white";
  return badge;
}

function readNotices(vid) {
  if (typeof window === "undefined") return { newIds: [], modifiedIds: [] };

  try {
    const parsed = JSON.parse(sessionStorage.getItem(noticeKey(vid)) || "{}");
    return {
      newIds: Array.isArray(parsed.newIds) ? parsed.newIds : [],
      modifiedIds: Array.isArray(parsed.modifiedIds) ? parsed.modifiedIds : [],
    };
  } catch {
    return { newIds: [], modifiedIds: [] };
  }
}

function clearExistingBadges() {
  document
    .querySelectorAll("[data-staff-notice-badge]")
    .forEach((badge) => badge.remove());

  document
    .querySelectorAll("[data-staff-notice-row]")
    .forEach((row) => {
      row.removeAttribute("data-staff-notice-row");
      row.classList.remove(
        "bg-[#fff7ed]",
        "bg-[#f0fdf4]",
        "outline-[#ff5a1f]/30",
        "outline-[#16a34a]/30",
        "outline",
        "outline-1",
        "outline-offset-[-1px]"
      );
    });
}

function getScheduleRows() {
  return Array.from(document.querySelectorAll("div")).filter((item) => {
    const className = String(item.className || "");
    return (
      className.includes("grid") &&
      className.includes("grid-cols-[90px_120px_80px_1fr_220px]") &&
      item.children?.length >= 5
    );
  });
}

function findScheduleRow(sessionId) {
  const shortId = String(sessionId || "").slice(0, 7);
  if (!shortId) return null;

  return getScheduleRows().find((item) => {
    const idCell = item.children?.[0];
    return String(idCell?.textContent || "").trim() === shortId;
  });
}

function applyBadgeToRow(sessionId, type) {
  const row = findScheduleRow(sessionId);

  if (!row) return false;
  if (row.querySelector(`[data-staff-notice-badge="${type}"]`)) return true;

  const contentCell = row.children?.[3];
  const titleLine = contentCell?.children?.[0];

  if (titleLine) {
    titleLine.classList.add("flex", "flex-wrap", "items-center", "gap-2");
    titleLine.appendChild(makeBadge(type));
  }

  row.dataset.staffNoticeRow = type;
  row.classList.add(
    type === "new" ? "bg-[#fff7ed]" : "bg-[#f0fdf4]",
    type === "new" ? "outline-[#ff5a1f]/30" : "outline-[#16a34a]/30",
    "outline",
    "outline-1",
    "outline-offset-[-1px]"
  );

  return true;
}

export default function StaffNoticeBadgeLayer() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.location.search.includes("notice=1")) return;

    const session = getClientSession();
    const vid = String(session?.vid || "");
    if (!vid) return;

    const notices = readNotices(vid);
    const allIds = [...notices.newIds, ...notices.modifiedIds];
    if (!allIds.length) return;

    let tries = 0;

    function apply() {
      tries += 1;
      clearExistingBadges();

      notices.newIds.forEach((id) => applyBadgeToRow(id, "new"));
      notices.modifiedIds.forEach((id) => applyBadgeToRow(id, "modified"));

      const firstRow = findScheduleRow(allIds[0]);

      if (firstRow && tries <= 2) {
        firstRow.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    apply();

    const interval = window.setInterval(() => {
      apply();
      if (tries >= 10) window.clearInterval(interval);
    }, 300);

    return () => window.clearInterval(interval);
  }, []);

  return null;
}
