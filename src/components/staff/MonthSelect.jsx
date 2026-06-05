export default function MonthSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-full border border-[#ececea] bg-white px-4 py-2 text-xs font-black text-[#4b4b48] outline-none"
    >
      <option value="ALL">ALL MONTHS</option>
      {options.map((month) => (
        <option key={month} value={month}>
          {month}
        </option>
      ))}
    </select>
  );
}
