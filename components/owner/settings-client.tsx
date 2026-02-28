"use client";

import { useState, useTransition } from "react";
import { updateCompanyName, updateOwnerProfile } from "@/app/actions/owner";

type Props = {
  company: { id: string; name: string; created_at: string };
  owner: { id: string; first_name: string | null; last_name: string | null; email: string; phone: string | null };
};

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
        enabled ? "bg-[#F5A623]" : "bg-[#7A94AD]/30"
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-[#0A1628] rounded-full transition-all ${
          enabled ? "right-1" : "left-1"
        }`}
      />
    </button>
  );
}

export function SettingsClient({ company, owner }: Props) {
  const [isPending, startTransition] = useTransition();

  // Company info
  const [companyName, setCompanyName] = useState(company.name);

  // Owner profile
  const [firstName, setFirstName] = useState(owner.first_name ?? "");
  const [lastName, setLastName] = useState(owner.last_name ?? "");
  const [phone, setPhone] = useState(owner.phone ?? "");

  // Toggles (UI-only, no DB backing yet)
  const [allowSwaps, setAllowSwaps] = useState(true);
  const [notifSwaps, setNotifSwaps] = useState(true);
  const [notifPublished, setNotifPublished] = useState(true);
  const [notifOvertime, setNotifOvertime] = useState(true);
  const [notifAbsence, setNotifAbsence] = useState(true);

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      // Save company name
      const companyResult = await updateCompanyName(companyName);
      if (companyResult.error) {
        setError(companyResult.error);
        return;
      }

      // Save owner profile
      const fd = new FormData();
      fd.set("first_name", firstName);
      fd.set("last_name", lastName);
      fd.set("phone", phone);
      const profileResult = await updateOwnerProfile(fd);
      if (profileResult.error) {
        setError(profileResult.error);
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  };

  const notifications = [
    { label: "Shift swap requests", desc: "Get notified when employees request swaps", value: notifSwaps, toggle: () => setNotifSwaps(!notifSwaps) },
    { label: "Schedule published", desc: "Alert when new schedules are published", value: notifPublished, toggle: () => setNotifPublished(!notifPublished) },
    { label: "Overtime alerts", desc: "Notify when employees approach overtime", value: notifOvertime, toggle: () => setNotifOvertime(!notifOvertime) },
    { label: "Absence notifications", desc: "Alert for unplanned absences", value: notifAbsence, toggle: () => setNotifAbsence(!notifAbsence) },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-[#E8604C]/10 rounded-lg border border-[#E8604C]/20">
          <i className="ri-error-warning-line text-[#E8604C]" />
          <span className="text-sm text-[#E8604C]">{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-[#4ECBA0]/10 rounded-lg border border-[#4ECBA0]/20">
          <i className="ri-check-line text-[#4ECBA0]" />
          <span className="text-sm text-[#4ECBA0]">Settings saved successfully</span>
        </div>
      )}

      {/* Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Company Information */}
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8] mb-4">Company Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-[#7A94AD] mb-2">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm focus:outline-none focus:border-[#F5A623]/50"
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-[#7A94AD] mb-2">Created</label>
              <div
                className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#7A94AD] text-sm"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                {new Date(company.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Owner Profile */}
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8] mb-4">Your Profile</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs md:text-sm font-medium text-[#7A94AD] mb-2">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm focus:outline-none focus:border-[#F5A623]/50"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-[#7A94AD] mb-2">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm focus:outline-none focus:border-[#F5A623]/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-[#7A94AD] mb-2">Email</label>
              <div className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#7A94AD] text-sm">
                {owner.email}
              </div>
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-[#7A94AD] mb-2">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+995 ..."
                className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm placeholder-[#7A94AD]/50 focus:outline-none focus:border-[#F5A623]/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Shift Settings */}
      <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8] mb-4">Shift Settings</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 md:p-4 bg-[#0A1628] rounded-lg">
            <div className="flex-1 min-w-0 mr-3">
              <div className="text-xs md:text-sm font-medium text-[#F0EDE8] mb-1">Allow Shift Swaps</div>
              <div className="text-[10px] md:text-xs text-[#7A94AD]">Employees can request shift swaps</div>
            </div>
            <Toggle enabled={allowSwaps} onToggle={() => setAllowSwaps(!allowSwaps)} />
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8] mb-4">Notification Preferences</h2>
        <div className="space-y-3">
          {notifications.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 md:p-4 bg-[#0A1628] rounded-lg hover:bg-[#0D1B2A] transition-colors"
            >
              <div className="flex-1 min-w-0 mr-3">
                <div className="text-xs md:text-sm font-medium text-[#F0EDE8] mb-1">{item.label}</div>
                <div className="text-[10px] md:text-xs text-[#7A94AD]">{item.desc}</div>
              </div>
              <Toggle enabled={item.value} onToggle={item.toggle} />
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setCompanyName(company.name);
            setFirstName(owner.first_name ?? "");
            setLastName(owner.last_name ?? "");
            setPhone(owner.phone ?? "");
          }}
          className="w-full sm:w-auto px-6 py-2.5 bg-[#142236] border border-white/[0.07] text-[#F0EDE8] rounded-lg hover:bg-[#1A2E45] transition-colors whitespace-nowrap cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="w-full sm:w-auto px-6 py-2.5 bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628] font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
        >
          <i className="ri-save-line mr-2" />
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
