export default function UserBadge({
  name,
  role,
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-full border border-[#dddbd6] bg-white px-3 py-2 shadow-sm sm:gap-3 sm:px-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#16a34a] text-sm font-black text-white sm:h-10 sm:w-10">
        {name.charAt(0)}
      </div>

      <div className="min-w-0">
        <div className="truncate text-sm font-black">
          {name}
        </div>

        <div className="hidden text-xs font-bold text-[#8b8a84] sm:block">
          {role}
        </div>
      </div>
    </div>
  );
}
