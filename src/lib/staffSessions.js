const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function timeToPickerValue(value) {
  const match = String(value || "").match(/^(\d{2})(\d{2})Z?$/i);
  return match ? `${match[1]}:${match[2]}` : "";
}

export function pickerValueToZulu(value) {
  if (!value) return "";

  const [hour = "00", minute = "00"] = value.split(":");
  return `${hour.padStart(2, "0")}${minute.padStart(2, "0")}Z`;
}

export function sessionToDate(session) {
  const rawDate = String(session?.date || "").trim();
  const rawTime = String(session?.time || "").replace(/\D/g, "");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate) || rawTime.length < 4) {
    return null;
  }

  const date = new Date(
    `${rawDate}T${rawTime.slice(0, 2)}:${rawTime.slice(2, 4)}:00Z`
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

export function monthLabel(item) {
  return item.sessionDate ? monthFormatter.format(item.sessionDate).toUpperCase() : "NO DATE";
}

export function splitSessionsByTime(items) {
  const now = new Date();
  const withDates = items
    .map((session) => ({ ...session, sessionDate: sessionToDate(session) }))
    .filter((session) => session.sessionDate);

  return {
    upcoming: withDates
      .filter((session) => session.sessionDate >= now)
      .sort((a, b) => a.sessionDate - b.sessionDate),
    completed: withDates
      .filter((session) => session.sessionDate < now)
      .sort((a, b) => b.sessionDate - a.sessionDate),
  };
}

export function getMonthOptions(items) {
  return [...new Set(items.map(monthLabel))];
}

export function filterByMonth(items, month) {
  return month === "ALL" ? items : items.filter((item) => monthLabel(item) === month);
}

export function groupByMonth(items) {
  return items.reduce((acc, item) => {
    const label = monthLabel(item);
    const group = acc.find((entry) => entry.label === label);

    if (group) {
      group.items.push(item);
    } else {
      acc.push({ label, items: [item] });
    }

    return acc;
  }, []);
}
