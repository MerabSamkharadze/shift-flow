"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { inviteManager } from "@/app/actions/owner";

export function InviteManagerDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showToast, setShowToast] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const resetForm = () => {
    setFormData({ firstName: "", lastName: "", email: "" });
    setError(null);
    setSent(false);
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fd = new FormData();
    fd.set("first_name", formData.firstName.trim());
    fd.set("last_name", formData.lastName.trim());
    fd.set("email", formData.email.trim());

    startTransition(async () => {
      const result = await inviteManager(fd);
      if (result.error) {
        setError(result.error);
      } else {
        setSent(true);
        setShowToast(true);
        router.refresh();
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    });
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const isFormValid = formData.firstName.trim() && formData.lastName.trim() && formData.email.trim();

  const inputClass =
    "w-full px-4 py-3 bg-[#0A1628] border border-white/[0.07] rounded-lg text-[#F0EDE8] text-sm placeholder-[#7A94AD] focus:outline-none focus:border-[#F5A623]/50 transition-colors";
  const labelClass = "block text-sm font-medium text-[#7A94AD] mb-1.5";

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="px-4 md:px-6 py-2.5 bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628] font-medium rounded-lg transition-colors whitespace-nowrap text-sm md:text-base"
      >
        <i className="ri-user-star-line mr-2" />
        Add Manager
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="relative w-full max-w-lg bg-[#142236] border border-white/[0.07] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-4 md:py-5 border-b border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg bg-[#F5A623]/10">
                  <i className="ri-user-star-line text-[#F5A623] text-base md:text-lg" />
                </div>
                <div>
                  <h2
                    className="text-base md:text-lg font-semibold text-[#F0EDE8]"
                    style={{ fontFamily: "Syne, sans-serif" }}
                  >
                    Invite Manager
                  </h2>
                  <p className="text-xs text-[#7A94AD]">Send an invitation email</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg hover:bg-white/[0.05] text-[#7A94AD] hover:text-[#F0EDE8] transition-colors flex-shrink-0"
              >
                <i className="ri-close-line text-lg md:text-xl" />
              </button>
            </div>

            {sent ? (
              /* Success State */
              <div className="px-6 py-10 text-center">
                <div className="w-16 h-16 rounded-full bg-[#4ECBA0]/10 flex items-center justify-center mx-auto mb-4">
                  <i className="ri-check-line text-3xl text-[#4ECBA0]" />
                </div>
                <h3 className="text-lg font-semibold text-[#F0EDE8] mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
                  Invite Sent!
                </h3>
                <p className="text-sm text-[#7A94AD]">
                  The manager will receive an email to set up their account.
                </p>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit}>
                <div className="px-4 md:px-6 py-4 md:py-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>
                        First Name <span className="text-[#E8604C]">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Davit"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className={inputClass}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        Last Name <span className="text-[#E8604C]">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Tsiklauri"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Email Address <span className="text-[#E8604C]">*</span>
                    </label>
                    <div className="relative">
                      <i className="ri-mail-line absolute left-4 top-1/2 -translate-y-1/2 text-[#7A94AD]" />
                      <input
                        type="email"
                        placeholder="manager@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`${inputClass} pl-11`}
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  {formData.firstName && formData.lastName && (
                    <div className="mt-2 p-4 bg-[#0A1628] rounded-xl border border-white/[0.07]">
                      <div className="text-xs text-[#7A94AD] mb-3 uppercase tracking-wider">Preview</div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#F5A623]/15 text-[#F5A623] flex items-center justify-center font-semibold text-sm">
                          {(formData.firstName[0] + formData.lastName[0]).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[#F0EDE8] font-medium text-sm">
                            {formData.firstName} {formData.lastName}
                          </div>
                          <div className="text-xs text-[#7A94AD]">
                            {formData.email || "No email provided"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-[#E8604C]/10 rounded-lg border border-[#E8604C]/20">
                      <i className="ri-error-warning-line text-[#E8604C]" />
                      <span className="text-sm text-[#E8604C]">{error}</span>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 px-4 md:px-6 py-4 border-t border-white/[0.07] bg-[#0D1B2A]/50">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isPending}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#7A94AD] hover:text-[#F0EDE8] hover:bg-white/[0.05] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid || isPending}
                    className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isFormValid && !isPending
                        ? "bg-[#F5A623] hover:bg-[#E09415] text-[#0A1628]"
                        : "bg-[#F5A623]/30 text-[#0A1628]/50 cursor-not-allowed"
                    }`}
                  >
                    <i className="ri-mail-send-line mr-1.5" />
                    {isPending ? "Sending..." : "Send Invite"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex items-center gap-3 px-4 md:px-5 py-3 md:py-3.5 bg-[#142236] border border-[#4ECBA0]/30 rounded-xl shadow-2xl max-w-[calc(100vw-2rem)]">
          <div className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-[#4ECBA0]/15 flex-shrink-0">
            <i className="ri-check-line text-[#4ECBA0]" />
          </div>
          <span className="text-xs md:text-sm text-[#F0EDE8]">
            Invite sent to {formData.firstName} {formData.lastName}
          </span>
        </div>
      )}
    </>
  );
}
