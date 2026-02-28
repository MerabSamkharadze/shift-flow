import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionProfile } from "@/lib/auth";
import { getManagerTemplatesData } from "@/lib/cache";

export default async function TemplatesPage() {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/auth/login");
  if (profile.role !== "manager") redirect(`/${profile.role}`);

  const { templates: allTemplates } = await getManagerTemplatesData(profile.id);

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1
          className="text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          Shift Templates
        </h1>
        <p className="text-sm md:text-base text-[#7A94AD]">
          Overview of all shift templates across your groups
        </p>
      </div>

      {allTemplates.length === 0 ? (
        <div className="bg-[#142236] border border-dashed border-white/[0.15] rounded-xl p-12 text-center">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 rounded-full bg-[#0A1628]">
            <i className="ri-time-line text-3xl text-[#7A94AD]" />
          </div>
          <h3 className="text-base font-semibold text-[#F0EDE8] mb-2">No templates yet</h3>
          <p className="text-sm text-[#7A94AD] max-w-sm mx-auto">
            Create shift templates inside your groups to define recurring shift patterns.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {allTemplates.map((t) => (
            <Link
              key={t.id}
              href={`/manager/groups/${t.groupId}`}
              className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] hover:border-[#F5A623]/30 transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: (t.color ?? "#F5A623") + "20" }}
                >
                  <i className="ri-time-line text-lg" style={{ color: t.color ?? "#F5A623" }} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#F0EDE8] truncate">{t.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: t.groupColor }}
                    />
                    <span className="text-xs text-[#7A94AD] truncate">{t.groupName}</span>
                  </div>
                </div>
              </div>
              <div
                className="text-sm text-[#F0EDE8]"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                {t.start_time?.slice(0, 5)} – {t.end_time?.slice(0, 5)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
