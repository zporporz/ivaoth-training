export default function StatusBadge({ status }) {
  const style =
    status === "Exam"
      ? "bg-red-600 text-white"
      : status === "Official"
        ? "bg-sky-600 text-white"
        : status === "Completed"
          ? "bg-[#ececea] text-[#4b4b48]"
          : "bg-[#e3f7ea] text-[#0b6e35]";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${style}`}>
      {status}
    </span>
  );
}
