"use client";

import { useEffect, useState } from "react";
import { Search, Edit3, X } from "lucide-react";

interface Subscription {
  id: string;
  business_id: string;
  plan_id: string;
  status: string;
  trial_ends_at: string | null;
  current_period_start: string;
  current_period_end: string | null;
  cancelled_at: string | null;
  created_at: string;
  businesses: { name: string; slug: string } | null;
  plans: { name: string; slug: string } | null;
}

interface PlanOption { id: string; name: string; }

const statusColors: Record<string, { bg: string; text: string }> = {
  trial: { bg: "#FFFBEB", text: "#D97706" },
  active: { bg: "#F0FDF4", text: "#166534" },
  cancelled: { bg: "#F3F4F6", text: "#6B7280" },
  expired: { bg: "#FEF2F2", text: "#EF4444" },
  suspended: { bg: "#FEF2F2", text: "#EF4444" },
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editModal, setEditModal] = useState<Subscription | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editPlanId, setEditPlanId] = useState("");
  const [editTrialEnd, setEditTrialEnd] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");

  const fetchData = async (tryBootstrap = false) => {
    const [subsData, plansData] = await Promise.all([
      fetch("/api/super-admin?action=subscriptions").then((r) => r.json()),
      fetch("/api/super-admin?action=plans").then((r) => r.json()),
    ]);
    const subs = subsData.subscriptions || [];
    setPlans((plansData.plans || []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));

    if (subs.length === 0 && tryBootstrap) {
      await fetch("/api/super-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bootstrap-subscriptions" }),
      });
      const refreshed = await fetch("/api/super-admin?action=subscriptions").then((r) => r.json());
      setSubscriptions(refreshed.subscriptions || []);
    } else {
      setSubscriptions(subs);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(true); }, []);

  const openEdit = (s: Subscription) => {
    setEditModal(s);
    setEditStatus(s.status);
    setEditPlanId(s.plan_id);
    setEditTrialEnd(s.trial_ends_at ? s.trial_ends_at.substring(0, 10) : "");
    setEditStartDate(s.current_period_start ? s.current_period_start.substring(0, 10) : "");
    setEditEndDate(s.current_period_end ? s.current_period_end.substring(0, 10) : "");
  };

  const handleUpdate = async () => {
    if (!editModal) return;
    await fetch("/api/super-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update-subscription",
        subscriptionId: editModal.id,
        status: editStatus,
        planId: editPlanId,
        trialEndsAt: editTrialEnd ? new Date(editTrialEnd).toISOString() : undefined,
        periodStart: editStartDate ? new Date(editStartDate).toISOString() : undefined,
        periodEnd: editEndDate ? new Date(editEndDate).toISOString() : undefined,
      }),
    });
    setEditModal(null);
    fetchData();
  };

  const filtered = subscriptions.filter((s) => {
    const matchSearch = (s.businesses?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || s.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search business..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#111] placeholder:text-[#9CA3AF] focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "trial", "active", "cancelled", "expired", "suspended"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-[11px] font-medium capitalize transition-all ${filter === f ? "bg-[#166534] text-white" : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:border-[#166534]/30"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#F3F4F6] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#9CA3AF]">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[#9CA3AF]">No subscriptions found</div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F3F4F6]">
                    {["Business", "Plan", "Status", "Start Date", "End Date", "Validity", "Actions"].map((h) => (
                      <th key={h} className={`${h === "Actions" ? "text-right" : "text-left"} px-5 py-3 text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wider`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const sc = statusColors[s.status] || statusColors.expired;
                    return (
                      <tr key={s.id} className="border-b border-[#F9FAFB] hover:bg-[#FAFBFC]">
                        <td className="px-5 py-3.5 text-[13px] font-medium text-[#111]">{s.businesses?.name || "—"}</td>
                        <td className="px-5 py-3.5"><span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F0FDF4] text-[#166534]">{s.plans?.name || "—"}</span></td>
                        <td className="px-5 py-3.5"><span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: sc.bg, color: sc.text }}>{s.status}</span></td>
                        <td className="px-5 py-3.5 text-[12px] text-[#6B7280]">{s.current_period_start ? new Date(s.current_period_start).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
                        <td className="px-5 py-3.5 text-[12px] text-[#6B7280]">{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
                        <td className="px-5 py-3.5">
                          {(() => {
                            const endDate = s.current_period_end || s.trial_ends_at;
                            if (!endDate) return <span className="text-[11px] text-[#9CA3AF]">—</span>;
                            const daysLeft = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                            return (
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${daysLeft <= 0 ? "bg-[#FEF2F2] text-[#EF4444]" : daysLeft <= 7 ? "bg-[#FFFBEB] text-[#D97706]" : "bg-[#F0FDF4] text-[#166534]"}`}>
                                {daysLeft <= 0 ? "Expired" : `${daysLeft}d left`}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button onClick={() => openEdit(s)} className="w-8 h-8 rounded-lg hover:bg-[#F3F4F6] inline-flex items-center justify-center">
                            <Edit3 className="w-3.5 h-3.5 text-[#6B7280]" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-[#F3F4F6]">
              {filtered.map((s) => {
                const sc = statusColors[s.status] || statusColors.expired;
                return (
                  <div key={s.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[13px] font-semibold text-[#111]">{s.businesses?.name || "—"}</p>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase" style={{ backgroundColor: sc.bg, color: sc.text }}>{s.status}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] mb-2">
                      <span>Plan: {s.plans?.name || "—"}</span>
                    </div>
                    <button onClick={() => openEdit(s)} className="w-full py-2 rounded-lg border border-[#E5E7EB] text-[11px] font-medium text-[#6B7280]">Edit Subscription</button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {editModal && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-bold text-[#111]">Edit Subscription</h3>
              <button onClick={() => setEditModal(null)} className="w-8 h-8 rounded-lg hover:bg-[#F3F4F6] flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-[13px] text-[#6B7280] mb-4">Business: <strong className="text-[#111]">{editModal.businesses?.name}</strong></p>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-[#6B7280] uppercase tracking-wider font-medium mb-1 block">Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#111] focus:border-[#166534]">
                  {["trial", "active", "cancelled", "expired", "suspended"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#6B7280] uppercase tracking-wider font-medium mb-1 block">Plan</label>
                <select value={editPlanId} onChange={(e) => setEditPlanId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#111] focus:border-[#166534]">
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] text-[#6B7280] uppercase tracking-wider font-medium mb-1 block">Start Date</label><input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#111] focus:border-[#166534]" /></div>
                <div><label className="text-[10px] text-[#6B7280] uppercase tracking-wider font-medium mb-1 block">End Date</label><input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#111] focus:border-[#166534]" /></div>
              </div>
              <div><label className="text-[10px] text-[#6B7280] uppercase tracking-wider font-medium mb-1 block">Trial End Date</label><input type="date" value={editTrialEnd} onChange={(e) => setEditTrialEnd(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#111] focus:border-[#166534]" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditModal(null)} className="flex-1 py-2.5 rounded-xl border border-[#E5E7EB] text-[12px] font-medium text-[#6B7280]">Cancel</button>
              <button onClick={handleUpdate} className="flex-1 py-2.5 rounded-xl bg-[#166534] text-white text-[12px] font-bold">Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
