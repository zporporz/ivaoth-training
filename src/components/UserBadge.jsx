export default function UserBadge({
  name,
  role,
}) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-[#dddbd6] bg-white px-4 py-2 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#16a34a] text-sm font-black text-white">
        {name.charAt(0)}
      </div>

      <div>
        <div className="text-sm font-black">
          {name}
        </div>

        <div className="text-xs font-bold text-[#8b8a84]">
          {role}
        </div>
      </div>
    </div>
  );
}