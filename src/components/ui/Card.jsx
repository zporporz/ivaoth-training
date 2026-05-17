export default function Card({ children, dark = false, className = "" }) {
  const base =
    "rounded-[32px] p-6 shadow-sm transition duration-300";

  const theme = dark
    ? "border border-[#0a0a0a] bg-[#0a0a0a] text-white"
    : "border border-[#ececea] bg-white/80 backdrop-blur";

  return (
    <div className={`${base} ${theme} ${className}`}>
      {children}
    </div>
  );
}