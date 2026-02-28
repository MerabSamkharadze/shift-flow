"use client";

import { useRouter } from "next/navigation";

type Props = {
  currentMonth: string;
  options: { value: string; label: string }[];
  basePath?: string;
};

export function MonthSelector({ currentMonth, options, basePath = "/owner/reports" }: Props) {
  const router = useRouter();

  return (
    <select
      value={currentMonth}
      onChange={(e) => router.push(`${basePath}?month=${e.target.value}`)}
      className="px-4 py-2.5 bg-[#142236] border border-white/[0.07] text-[#F0EDE8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50 appearance-none cursor-pointer"
      style={{ fontFamily: "JetBrains Mono, monospace" }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
