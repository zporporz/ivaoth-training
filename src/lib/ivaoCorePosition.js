const CORE_CODES = new Set(["TC", "TAC", "DIR", "ADIR"]);

export function getIvaoCorePosition(position) {
  const staff = position?.staffPosition || position?.staff_position || position;
  const division = position?.division || position?.divisionStaffPosition?.division;
  const divisionId = String(
    division?.id || division?.code || position?.divisionId || position?.division_id || "",
  ).trim().toUpperCase();

  for (const value of [staff?.shortName, staff?.short_name, staff?.code, staff?.id]) {
    const code = String(value || "").trim().toUpperCase();
    const qualified = code.match(/^([A-Z]{2})-(TC|TAC|DIR|ADIR)$/);
    if (qualified) {
      if (divisionId && divisionId !== qualified[1]) return null;
      return code;
    }
    const suffix = code.replace(/^-/, "");
    if (divisionId && CORE_CODES.has(suffix)) return `${divisionId}-${suffix}`;
  }
  return null;
}
