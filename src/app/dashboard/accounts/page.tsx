"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  MoreVertical,
  Ban,
  CheckCircle,
  Trash2,
  Eye,
  Edit3,
  Plus,
  UserCog,
  X,
  ChevronDown,
  Star,
  Megaphone,
  ExternalLink,
} from "lucide-react";
import { INDUSTRY_SEGMENTS, SUB_INDUSTRIES } from "@/lib/industries";

interface Account {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  location_area: string;
  location_city: string;
  logo_url: string;
  plan: string;
  is_active: boolean;
  created_at: string;
  google_maps_url: string;
  industry_segment: string;
  sub_industry: string;
  review_count: number;
  campaign_count: number;
  profiles: { full_name: string; email: string } | null;
  subscription: {
    status: string;
    current_period_end: string | null;
    trial_ends_at: string | null;
    plans: { name: string } | null;
  } | null;
}

type ModalMode = "create" | "edit" | "view" | null;

const emptyCreate = {
  businessName: "",
  ownerName: "",
  email: "",
  password: "",
  industry: "",
  subIndustry: "",
  plan: "starter",
  area: "",
  city: "",
};

const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || "https://revu-go.vercel.app";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "suspended">("all");
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [editForm, setEditForm] = useState({ name: "", area: "", city: "", industry: "", subIndustry: "", plan: "", googleMapsUrl: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(() => {
    fetch("/api/super-admin?action=accounts")
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleAction = async (action: string, businessId: string) => {
    setActionMenu(null);
    await fetch("/api/super-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, businessId }),
    });
    fetchAccounts();
  };

  const handleCreate = async () => {
    if (!createForm.businessName || !createForm.email || !createForm.password || !createForm.ownerName) {
      setError("All required fields must be filled");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/super-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-account", ...createForm }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.error) { setError(data.error); return; }
    setModalMode(null);
    setCreateForm(emptyCreate);
    fetchAccounts();
  };

  const openEdit = (a: Account) => {
    setSelectedAccount(a);
    setEditForm({
      name: a.name,
      area: a.location_area,
      city: a.location_city,
      industry: a.industry_segment || "",
      subIndustry: a.sub_industry || "",
      plan: a.plan,
      googleMapsUrl: a.google_maps_url || "",
    });
    setError(null);
    setModalMode("edit");
    setActionMenu(null);
  };

  const handleEdit = async () => {
    if (!selectedAccount) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/super-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "edit-account",
        businessId: selectedAccount.id,
        name: editForm.name,
        locationArea: editForm.area,
        locationCity: editForm.city,
        industry: editForm.industry,
        subIndustry: editForm.subIndustry,
        plan: editForm.plan,
        googleMapsUrl: editForm.googleMapsUrl,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.error) { setError(data.error); return; }
    setModalMode(null);
    fetchAccounts();
  };

  const [impersonating, setImpersonating] = useState<string | null>(null);

  const handleImpersonate = async (a: Account) => {
    setActionMenu(null);
    if (!a.profiles?.email) return;
    setImpersonating(a.id);
    try {
      const res = await fetch("/api/super-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "impersonate",
          businessId: a.id,
          email: a.profiles.email,
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert("Impersonation failed: " + data.error);
        return;
      }
      if (data.accessToken) {
        const adminUrl = window.location.origin + "/dashboard/accounts";
        const hash = `#access_token=${data.accessToken}&refresh_token=${data.refreshToken}&business_name=${encodeURIComponent(a.name)}&admin_url=${encodeURIComponent(adminUrl)}`;
        window.open(`${MAIN_APP_URL}/impersonate-session${hash}`, "_blank");
      }
    } finally {
      setImpersonating(null);
    }
  };

  const filtered = accounts.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      a.name.toLowerCase().includes(q) ||
      (a.profiles?.email || "").toLowerCase().includes(q) ||
      (a.profiles?.full_name || "").toLowerCase().includes(q) ||
      (a.industry_segment || "").toLowerCase().includes(q) ||
      (a.location_city || "").toLowerCase().includes(q);
    const matchFilter =
      filter === "all" || (filter === "active" && a.is_active) || (filter === "suspended" && !a.is_active);
    return matchSearch && matchFilter;
  });

  const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-sm text-[#111] placeholder:text-[#9CA3AF] focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/10 transition-all";
  const labelClass = "text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold mb-1.5 block";

  const getIndustryLabel = (val: string) => INDUSTRY_SEGMENTS.find((s) => s.value === val)?.label || val || "—";

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 w-full">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, city, industry..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#111] placeholder:text-[#9CA3AF] focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/10"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "active", "suspended"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-[12px] font-medium capitalize transition-all ${
                  filter === f ? "bg-[#166534] text-white" : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:border-[#166534]/30"
                }`}
              >{f}</button>
            ))}
          </div>
        </div>
        <button
          onClick={() => { setModalMode("create"); setError(null); setCreateForm(emptyCreate); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#166534] text-white text-[12px] font-bold hover:bg-[#15803D] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Account
        </button>
      </div>

      <div className="flex items-center gap-2 text-[12px] text-[#9CA3AF]">
        <span className="font-semibold text-[#111]">{filtered.length}</span> accounts found
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#F3F4F6] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#9CA3AF]">Loading accounts...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[#9CA3AF]">No accounts found</div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F3F4F6] bg-[#FAFBFC]">
                    {["Business", "Owner", "Industry", "Plan", "Stats", "Status", "Validity", "Created", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id} className="border-b border-[#F9FAFB] hover:bg-[#FAFBFC] transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {a.logo_url && a.logo_url.startsWith("http") ? (
                            <img src={a.logo_url} alt={a.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#166534] to-[#15803D] flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold text-white">{a.name.substring(0, 2).toUpperCase()}</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-[#111] truncate">{a.name}</p>
                            <p className="text-[10px] text-[#9CA3AF] truncate">{[a.location_area, a.location_city].filter(Boolean).join(", ") || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[12px] font-medium text-[#374151] truncate max-w-[140px]">{a.profiles?.full_name || "—"}</p>
                        <p className="text-[10px] text-[#9CA3AF] truncate max-w-[140px]">{a.profiles?.email || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[11px] font-medium text-[#374151] truncate max-w-[120px]">{getIndustryLabel(a.industry_segment)}</p>
                        <p className="text-[10px] text-[#9CA3AF] truncate max-w-[120px]">{a.sub_industry || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F0FDF4] text-[#166534]">
                          {a.subscription?.plans?.name || a.plan || "Free"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 text-[10px] text-[#6B7280]">
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-[#D4AF37]" />{a.review_count}</span>
                          <span className="flex items-center gap-1"><Megaphone className="w-3 h-3 text-[#8B5CF6]" />{a.campaign_count}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          a.is_active ? "bg-[#F0FDF4] text-[#166534]" : "bg-[#FEF2F2] text-[#EF4444]"
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${a.is_active ? "bg-[#22C55E]" : "bg-[#EF4444]"}`} />
                          {a.is_active ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const endDate = a.subscription?.current_period_end || a.subscription?.trial_ends_at;
                          if (!endDate) return <span className="text-[11px] text-[#9CA3AF]">—</span>;
                          const end = new Date(endDate);
                          const now = new Date();
                          const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          const isExpired = daysLeft <= 0;
                          const isExpiring = daysLeft > 0 && daysLeft <= 7;
                          return (
                            <div>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                isExpired ? "bg-[#FEF2F2] text-[#EF4444]" : isExpiring ? "bg-[#FFFBEB] text-[#D97706]" : "bg-[#F0FDF4] text-[#166534]"
                              }`}>
                                {isExpired ? "Expired" : isExpiring ? `${daysLeft}d left` : "Valid"}
                              </span>
                              <p className="text-[10px] text-[#9CA3AF] mt-0.5">{end.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[#6B7280] whitespace-nowrap">
                        {new Date(a.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (actionMenu === a.id) { setActionMenu(null); return; }
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuPos({ top: rect.bottom + 4, left: rect.right - 192 });
                            setActionMenu(a.id);
                          }}
                          className="w-8 h-8 rounded-lg hover:bg-[#F3F4F6] flex items-center justify-center transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-[#9CA3AF]" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-[#F3F4F6]">
              {filtered.map((a) => (
                <div key={a.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#166534] to-[#15803D] flex items-center justify-center flex-shrink-0">
                        <span className="text-[11px] font-bold text-white">{a.name.substring(0, 2).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#111]">{a.name}</p>
                        <p className="text-[11px] text-[#9CA3AF]">{a.profiles?.email || "—"}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      a.is_active ? "bg-[#F0FDF4] text-[#166534]" : "bg-[#FEF2F2] text-[#EF4444]"
                    }`}>
                      {a.is_active ? "Active" : "Suspended"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-[#6B7280] flex-wrap">
                    <span>{getIndustryLabel(a.industry_segment)}</span>
                    <span>{a.plan}</span>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-[#D4AF37]" />{a.review_count}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedAccount(a); setModalMode("view"); }}
                      className="flex-1 py-2 rounded-lg border border-[#E5E7EB] text-[11px] font-medium text-[#6B7280] hover:bg-[#F9FAFB] flex items-center justify-center gap-1">
                      <Eye className="w-3 h-3" /> View
                    </button>
                    <button onClick={() => openEdit(a)}
                      className="flex-1 py-2 rounded-lg border border-[#E5E7EB] text-[11px] font-medium text-[#6B7280] hover:bg-[#F9FAFB] flex items-center justify-center gap-1">
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => handleImpersonate(a)}
                      className="flex-1 py-2 rounded-lg border border-[#DDD6FE] text-[11px] font-medium text-[#7C3AED] hover:bg-[#F5F3FF] flex items-center justify-center gap-1">
                      <UserCog className="w-3 h-3" /> Impersonate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Action menu dropdown */}
      {actionMenu && (() => {
        const a = filtered.find((acc) => acc.id === actionMenu);
        if (!a) return null;
        return (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setActionMenu(null)} />
            <div
              className="fixed w-48 bg-white rounded-xl border border-[#E5E7EB] shadow-xl z-[70] py-1"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              <button onClick={() => { setSelectedAccount(a); setModalMode("view"); setActionMenu(null); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-[#374151] hover:bg-[#F9FAFB] font-medium">
                <Eye className="w-3.5 h-3.5 text-[#6B7280]" /> View Details
              </button>
              <button onClick={() => openEdit(a)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-[#374151] hover:bg-[#F9FAFB] font-medium">
                <Edit3 className="w-3.5 h-3.5 text-[#6B7280]" /> Edit Account
              </button>
              <button onClick={() => handleImpersonate(a)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-[#7C3AED] hover:bg-[#F5F3FF] font-medium">
                <UserCog className="w-3.5 h-3.5" /> Impersonate
              </button>
              <div className="h-px bg-[#F3F4F6] mx-3 my-1" />
              {a.is_active ? (
                <button onClick={() => handleAction("suspend-account", a.id)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-[#D97706] hover:bg-[#FFFBEB] font-medium">
                  <Ban className="w-3.5 h-3.5" /> Suspend
                </button>
              ) : (
                <button onClick={() => handleAction("activate-account", a.id)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-[#166534] hover:bg-[#F0FDF4] font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> Activate
                </button>
              )}
              <div className="h-px bg-[#F3F4F6] mx-3 my-1" />
              <button onClick={() => { if (confirm(`Delete "${a.name}"? This cannot be undone.`)) handleAction("delete-account", a.id); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-[#EF4444] hover:bg-[#FEF2F2] font-medium">
                <Trash2 className="w-3.5 h-3.5" /> Delete Account
              </button>
            </div>
          </>
        );
      })()}

      {/* VIEW MODAL */}
      {modalMode === "view" && selectedAccount && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setModalMode(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-[#F3F4F6] px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-[16px] font-bold text-[#111]">Account Details</h3>
              <button onClick={() => setModalMode(null)} className="w-8 h-8 rounded-lg hover:bg-[#F3F4F6] flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                {selectedAccount.logo_url && selectedAccount.logo_url.startsWith("http") ? (
                  <img src={selectedAccount.logo_url} alt="" className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#166534] to-[#15803D] flex items-center justify-center">
                    <span className="text-[14px] font-bold text-white">{selectedAccount.name.substring(0, 2).toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <h4 className="text-[16px] font-bold text-[#111]">{selectedAccount.name}</h4>
                  <p className="text-[11px] text-[#9CA3AF] font-mono">{selectedAccount.slug}</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  ["Owner", selectedAccount.profiles?.full_name || "—"],
                  ["Email", selectedAccount.profiles?.email || "—"],
                  ["Location", [selectedAccount.location_area, selectedAccount.location_city].filter(Boolean).join(", ") || "—"],
                  ["Industry", getIndustryLabel(selectedAccount.industry_segment)],
                  ["Sub Industry", selectedAccount.sub_industry || "—"],
                  ["Plan", selectedAccount.subscription?.plans?.name || selectedAccount.plan || "Free"],
                  ["Status", selectedAccount.is_active ? "Active" : "Suspended"],
                  ["Reviews", String(selectedAccount.review_count)],
                  ["Campaigns", String(selectedAccount.campaign_count)],
                  ["Google Maps", selectedAccount.google_maps_url ? "Configured" : "Not set"],
                  ["Created", new Date(selectedAccount.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-[#F9FAFB] last:border-0">
                    <span className="text-[12px] text-[#6B7280]">{label}</span>
                    <span className="text-[12px] font-medium text-[#111] text-right max-w-[200px] truncate">{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => openEdit(selectedAccount)}
                  className="flex-1 py-2.5 rounded-xl bg-[#166534] text-white text-[12px] font-bold hover:bg-[#15803D] flex items-center justify-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => { handleImpersonate(selectedAccount); setModalMode(null); }}
                  className="flex-1 py-2.5 rounded-xl bg-[#7C3AED] text-white text-[12px] font-bold hover:bg-[#6D28D9] flex items-center justify-center gap-1.5">
                  <UserCog className="w-3.5 h-3.5" /> Impersonate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {modalMode === "create" && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setModalMode(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-[#F3F4F6] px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h3 className="text-[16px] font-bold text-[#111]">Create Business Account</h3>
                <p className="text-[11px] text-[#9CA3AF]">Manually create a new business user</p>
              </div>
              <button onClick={() => setModalMode(null)} className="w-8 h-8 rounded-lg hover:bg-[#F3F4F6] flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={labelClass}>Business Name *</label>
                <input value={createForm.businessName} onChange={(e) => setCreateForm({ ...createForm, businessName: e.target.value })} className={inputClass} placeholder="e.g. Cafe Royale" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Owner Name *</label>
                  <input value={createForm.ownerName} onChange={(e) => setCreateForm({ ...createForm, ownerName: e.target.value })} className={inputClass} placeholder="Full name" />
                </div>
                <div>
                  <label className={labelClass}>Plan</label>
                  <div className="relative">
                    <select value={createForm.plan} onChange={(e) => setCreateForm({ ...createForm, plan: e.target.value })}
                      className={`${inputClass} appearance-none cursor-pointer`}>
                      <option value="starter">Starter</option>
                      <option value="growth">Growth</option>
                      <option value="pro">Pro</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className={labelClass}>Email Address *</label>
                <input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className={inputClass} placeholder="user@business.com" />
              </div>
              <div>
                <label className={labelClass}>Password *</label>
                <input type="text" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} className={inputClass} placeholder="Min 6 characters" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Industry</label>
                  <div className="relative">
                    <select value={createForm.industry} onChange={(e) => setCreateForm({ ...createForm, industry: e.target.value, subIndustry: "" })}
                      className={`${inputClass} appearance-none cursor-pointer`}>
                      <option value="">Select...</option>
                      {INDUSTRY_SEGMENTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Sub Industry</label>
                  <div className="relative">
                    <select value={createForm.subIndustry} onChange={(e) => setCreateForm({ ...createForm, subIndustry: e.target.value })}
                      className={`${inputClass} appearance-none cursor-pointer`}>
                      <option value="">Select...</option>
                      {(SUB_INDUSTRIES[createForm.industry] || []).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Area</label>
                  <input value={createForm.area} onChange={(e) => setCreateForm({ ...createForm, area: e.target.value })} className={inputClass} placeholder="e.g. Bandra" />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input value={createForm.city} onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })} className={inputClass} placeholder="e.g. Mumbai" />
                </div>
              </div>

              {error && <p className="text-[12px] text-[#EF4444] bg-[#FEF2F2] px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalMode(null)} className="flex-1 py-3 rounded-xl border border-[#E5E7EB] text-[12px] font-medium text-[#6B7280] hover:bg-[#F9FAFB]">
                  Cancel
                </button>
                <button onClick={handleCreate} disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-[#166534] text-white text-[12px] font-bold hover:bg-[#15803D] disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? "Creating..." : <><Plus className="w-4 h-4" /> Create Account</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {modalMode === "edit" && selectedAccount && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setModalMode(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-[#F3F4F6] px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h3 className="text-[16px] font-bold text-[#111]">Edit Account</h3>
                <p className="text-[11px] text-[#9CA3AF]">{selectedAccount.profiles?.email}</p>
              </div>
              <button onClick={() => setModalMode(null)} className="w-8 h-8 rounded-lg hover:bg-[#F3F4F6] flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={labelClass}>Business Name</label>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Area</label>
                  <input value={editForm.area} onChange={(e) => setEditForm({ ...editForm, area: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Industry</label>
                  <div className="relative">
                    <select value={editForm.industry} onChange={(e) => setEditForm({ ...editForm, industry: e.target.value, subIndustry: "" })}
                      className={`${inputClass} appearance-none cursor-pointer`}>
                      <option value="">Select...</option>
                      {INDUSTRY_SEGMENTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Sub Industry</label>
                  <div className="relative">
                    <select value={editForm.subIndustry} onChange={(e) => setEditForm({ ...editForm, subIndustry: e.target.value })}
                      className={`${inputClass} appearance-none cursor-pointer`}>
                      <option value="">Select...</option>
                      {(SUB_INDUSTRIES[editForm.industry] || []).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className={labelClass}>Plan</label>
                <div className="relative">
                  <select value={editForm.plan} onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                    className={`${inputClass} appearance-none cursor-pointer`}>
                    <option value="starter">Starter</option>
                    <option value="growth">Growth</option>
                    <option value="pro">Pro</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Google Maps URL</label>
                <input value={editForm.googleMapsUrl} onChange={(e) => setEditForm({ ...editForm, googleMapsUrl: e.target.value })} className={inputClass} placeholder="https://maps.google.com/?cid=..." />
              </div>

              {error && <p className="text-[12px] text-[#EF4444] bg-[#FEF2F2] px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalMode(null)} className="flex-1 py-3 rounded-xl border border-[#E5E7EB] text-[12px] font-medium text-[#6B7280] hover:bg-[#F9FAFB]">
                  Cancel
                </button>
                <button onClick={handleEdit} disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-[#166534] text-white text-[12px] font-bold hover:bg-[#15803D] disabled:opacity-50">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
