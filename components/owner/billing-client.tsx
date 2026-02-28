"use client";

import { useState, useEffect, useMemo } from "react";

type Props = {
  /** ISO date when subscription was activated (or last payment date) */
  activatedAt: string;
  /** Whether the current billing period is paid */
  isPaid: boolean;
};

function useCountdown(targetDate: Date) {
  const [now, setNow] = useState(() => new Date());
  const expired = targetDate.getTime() - now.getTime() <= 0;

  useEffect(() => {
    if (expired) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [expired]);

  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, expired: false };
}

// Mock payment history for UI
const mockInvoices = [
  { id: "INV-2026-002", date: "Feb 1, 2026", amount: "₾49", status: "paid" as const },
  { id: "INV-2026-001", date: "Jan 1, 2026", amount: "₾49", status: "paid" as const },
  { id: "INV-2025-012", date: "Dec 1, 2025", amount: "₾49", status: "paid" as const },
];

export function BillingClient({ activatedAt, isPaid }: Props) {
  // Next renewal = activatedAt + 30 days
  const nextRenewal = useMemo(() => {
    const d = new Date(activatedAt);
    d.setDate(d.getDate() + 30);
    return d;
  }, [activatedAt]);

  const countdown = useCountdown(nextRenewal);

  const pad = (n: number) => String(n).padStart(2, "0");

  const renewalFormatted = useMemo(() => nextRenewal.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }), [nextRenewal]);

  const activatedFormatted = useMemo(() => new Date(activatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }), [activatedAt]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Subscription Status + Countdown */}
      <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left: Status */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-[#F5A623] to-[#E09415] flex items-center justify-center shadow-lg shadow-[#F5A623]/20">
              <i className="ri-vip-crown-line text-2xl md:text-3xl text-[#0A1628]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-lg md:text-xl font-semibold text-[#F0EDE8]"
                  style={{ fontFamily: "var(--font-syne), sans-serif" }}
                >
                  ShiftFlow Pro
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                    isPaid
                      ? "bg-[#4ECBA0]/15 text-[#4ECBA0]"
                      : "bg-[#E8604C]/15 text-[#E8604C]"
                  }`}
                >
                  {isPaid ? "ACTIVE" : "PAYMENT DUE"}
                </span>
              </div>
              <p className="text-sm text-[#7A94AD]">
                Activated {activatedFormatted} &middot; Renews {renewalFormatted}
              </p>
            </div>
          </div>

          {/* Right: Countdown Timer */}
          <div className="flex items-center gap-3">
            <div className="text-xs text-[#7A94AD] mr-1 hidden sm:block">Next renewal in</div>
            <div className="flex items-center gap-2">
              {[
                { value: countdown.days, label: "Days" },
                { value: countdown.hours, label: "Hrs" },
                { value: countdown.minutes, label: "Min" },
                { value: countdown.seconds, label: "Sec" },
              ].map((unit, idx) => (
                <div key={unit.label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-xl md:text-2xl font-semibold ${
                        countdown.expired
                          ? "bg-[#E8604C]/10 text-[#E8604C] border border-[#E8604C]/20"
                          : "bg-[#0A1628] text-[#F0EDE8] border border-white/[0.07]"
                      }`}
                      style={{ fontFamily: "JetBrains Mono, monospace" }}
                    >
                      {pad(unit.value)}
                    </div>
                    <span className="text-[10px] text-[#7A94AD] mt-1">{unit.label}</span>
                  </div>
                  {idx < 3 && (
                    <span
                      className="text-lg text-[#7A94AD] font-semibold mb-4"
                      style={{ fontFamily: "JetBrains Mono, monospace" }}
                    >
                      :
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expired warning */}
        {countdown.expired && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-[#E8604C]/10 rounded-lg border border-[#E8604C]/20">
            <i className="ri-error-warning-line text-[#E8604C]" />
            <span className="text-sm text-[#E8604C]">
              Subscription period has expired. Please make a payment to continue.
            </span>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#F5A623]/10 flex items-center justify-center">
              <i className="ri-vip-crown-line text-xl text-[#F5A623]" />
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isPaid ? "bg-[#4ECBA0]/15 text-[#4ECBA0]" : "bg-[#E8604C]/15 text-[#E8604C]"
              }`}
            >
              {isPaid ? "Active" : "Due"}
            </span>
          </div>
          <div
            className="text-lg md:text-xl font-semibold text-[#F0EDE8] mb-1"
            style={{ fontFamily: "var(--font-syne), sans-serif" }}
          >
            Pro
          </div>
          <div className="text-xs md:text-sm text-[#7A94AD]">Current Plan</div>
        </div>

        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#4ECBA0]/10 flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-xl text-[#4ECBA0]" />
            </div>
          </div>
          <div
            className="text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            ₾49
          </div>
          <div className="text-xs md:text-sm text-[#7A94AD]">Monthly Cost</div>
        </div>

        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center">
              <i className="ri-calendar-check-line text-xl text-[#14B8A6]" />
            </div>
          </div>
          <div className="text-base md:text-lg font-semibold text-[#F0EDE8] mb-1">
            {renewalFormatted}
          </div>
          <div className="text-xs md:text-sm text-[#7A94AD]">Next Billing Date</div>
        </div>

        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-4 md:p-5 hover:bg-[#1A2E45] transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#F5A623]/10 flex items-center justify-center">
              <i className="ri-receipt-line text-xl text-[#F5A623]" />
            </div>
          </div>
          <div
            className="text-2xl md:text-3xl font-semibold text-[#F0EDE8] mb-1"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            {mockInvoices.length}
          </div>
          <div className="text-xs md:text-sm text-[#7A94AD]">Invoices Paid</div>
        </div>
      </div>

      {/* Payment Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Bank of Georgia Payment */}
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-5 md:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-[#F5A623]/10 flex items-center justify-center">
              <i className="ri-bank-card-line text-xl text-[#F5A623]" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8]">Payment</h2>
              <p className="text-xs text-[#7A94AD]">Bank of Georgia</p>
            </div>
          </div>

          {/* BOG Payment Placeholder */}
          <div className="bg-[#0A1628] border border-dashed border-white/[0.15] rounded-xl p-6 md:p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F5A623]/10 flex items-center justify-center">
              <i className="ri-bank-line text-3xl text-[#F5A623]" />
            </div>
            <h3 className="text-sm md:text-base font-semibold text-[#F0EDE8] mb-2">
              Bank of Georgia Payment
            </h3>
            <p className="text-xs text-[#7A94AD] mb-5 max-w-xs mx-auto">
              Secure payment integration with Bank of Georgia will be available here.
              Pay with any Georgian bank card.
            </p>
            <button
              disabled
              className="px-6 py-3 bg-[#F5A623]/30 text-[#0A1628]/50 font-medium rounded-lg text-sm cursor-not-allowed"
            >
              <i className="ri-bank-card-line mr-2" />
              Pay ₾49 — Coming Soon
            </button>
            <p className="text-[10px] text-[#7A94AD] mt-3">
              <i className="ri-shield-check-line mr-1" />
              Secured by Bank of Georgia Payment Gateway
            </p>
          </div>
        </div>

        {/* Plan Features */}
        <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-5 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8] mb-5">
            Plan Features
          </h2>
          <div className="space-y-3">
            {[
              "Unlimited employees",
              "Unlimited branches",
              "Schedule builder",
              "Shift templates",
              "Hours analytics & reports",
              "Marketplace access",
              "Excel export",
              "Email support",
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2.5 py-1.5">
                <div className="w-5 h-5 flex items-center justify-center rounded-full bg-[#4ECBA0]/15 flex-shrink-0">
                  <i className="ri-check-line text-xs text-[#4ECBA0]" />
                </div>
                <span className="text-sm text-[#F0EDE8]">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div className="bg-[#142236] border border-white/[0.07] rounded-xl p-5 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-[#F0EDE8] mb-5">
          Payment History
        </h2>

        {mockInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  <th className="text-left text-xs font-medium text-[#7A94AD] uppercase tracking-wider pb-3 pr-4">
                    Invoice
                  </th>
                  <th className="text-left text-xs font-medium text-[#7A94AD] uppercase tracking-wider pb-3 pr-4">
                    Date
                  </th>
                  <th className="text-right text-xs font-medium text-[#7A94AD] uppercase tracking-wider pb-3 pr-4">
                    Amount
                  </th>
                  <th className="text-center text-xs font-medium text-[#7A94AD] uppercase tracking-wider pb-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3.5 pr-4">
                      <span
                        className="text-sm text-[#F0EDE8]"
                        style={{ fontFamily: "JetBrains Mono, monospace" }}
                      >
                        {inv.id}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="text-sm text-[#7A94AD]">{inv.date}</span>
                    </td>
                    <td className="py-3.5 pr-4 text-right">
                      <span
                        className="text-sm text-[#F0EDE8]"
                        style={{ fontFamily: "JetBrains Mono, monospace" }}
                      >
                        {inv.amount}
                      </span>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[#4ECBA0]/15 text-[#4ECBA0] whitespace-nowrap">
                        <i className="ri-check-line" />
                        Paid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-[#7A94AD] text-sm">No payment history yet.</div>
        )}
      </div>
    </div>
  );
}
