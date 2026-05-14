export default function Button({ children, variant = "primary" }) {
  const styles = {
    primary:
      "rounded-full bg-[#16a34a] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#0b6e35]",
    secondary:
      "rounded-full border border-[#dddbd6] bg-white px-6 py-3 text-sm font-black text-[#0a0a0a] shadow-sm transition hover:bg-[#f3f3f1]",
    black:
      "rounded-full bg-[#0a0a0a] px-5 py-2.5 text-base font-extrabold text-white shadow-sm transition hover:scale-[1.02]",
  };

  return <button className={styles[variant]}>{children}</button>;
}