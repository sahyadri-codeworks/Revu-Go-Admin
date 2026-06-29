"use client";

import { useEffect, useState } from "react";
import { Plus, Edit3, Trash2, X } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number;
  campaign_limit: number;
  qr_limit: number;
  ai_usage_limit: number;
  review_limit: number;
  storage_limit_mb: number;
  is_active: boolean;
  features: string[];
}

const emptyForm = {
  name: "", slug: "", priceMonthly: 0, priceYearly: 0,
  campaignLimit: 1, qrLimit: 1, aiUsageLimit: 50, reviewLimit: 100,
  storageLimitMb: 100, features: [] as string[], isActive: true,
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [featureInput, setFeatureInput] = useState("");

  const fetchPlans = () => {
    fetch("/api/super-admin?action=plans")
      .then((r) => r.json())
      .then((d) => setPlans(d.plans || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPlans(); }, []);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFeatureInput(""); setModalOpen(true); };

  const openEdit = (p: Plan) => {
    setEditingId(p.id);
    setForm({
      name: p.name, slug: p.slug,
      priceMonthly: p.price_monthly, priceYearly: p.price_yearly,
      campaignLimit: p.campaign_limit, qrLimit: p.qr_limit,
      aiUsageLimit: p.ai_usage_limit, reviewLimit: p.review_limit,
      storageLimitMb: p.storage_limit_mb, features: p.features || [],
      isActive: p.is_active,
    });
    setFeatureInput("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    const action = editingId ? "update-plan" : "create-plan";
    await fetch("/api/super-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...(editingId ? { planId: editingId } : {}), ...form }),
    });
    setModalOpen(false);
    fetchPlans();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this plan?")) return;
    await fetch("/api/super-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-plan", planId: id }),
    });
    fetchPlans();
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setForm({ ...form, features: [...form.features, featureInput.trim()] });
      setFeatureInput("");
    }
  };

  const removeFeature = (i: number) => {
    setForm({ ...form, features: form.features.filter((_, idx) => idx !== i) });
  };

  const formatLimit = (v: number) => v === -1 ? "Unlimited" : v.toLocaleString();

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#111] placeholder:text-[#9CA3AF] focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/10";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-bold text-[#111]">Plans & Billing</h2>
          <p className="text-[12px] text-[#9CA3AF]">Manage subscription plans and pricing</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#166534] text-white text-[12px] font-semibold hover:bg-[#15803D] transition-colors">
          <Plus className="w-4 h-4" /> Create Plan
        </button>
      </div>

      {loading ? (
        <div className="text-center text-[#9CA3AF] py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div key={p.id} className={`bg-white rounded-2xl border p-6 ${p.is_active ? "border-[#F3F4F6]" : "border-[#FDE68A] opacity-70"}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[16px] font-bold text-[#111]">{p.name}</h3>
                  <p className="text-[11px] text-[#9CA3AF]">{p.slug}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-lg hover:bg-[#F3F4F6] flex items-center justify-center">
                    <Edit3 className="w-3.5 h-3.5 text-[#6B7280]" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-lg hover:bg-[#FEF2F2] flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <span className="text-[28px] font-bold text-[#111]">₹{p.price_monthly}</span>
                <span className="text-[12px] text-[#9CA3AF]">/mo</span>
                {p.price_yearly > 0 && <span className="text-[11px] text-[#6B7280] ml-2">₹{p.price_yearly}/yr</span>}
              </div>
              <div className="space-y-2 mb-4">
                {[["Campaigns", formatLimit(p.campaign_limit)], ["QR Codes", formatLimit(p.qr_limit)], ["AI Usage", formatLimit(p.ai_usage_limit)], ["Reviews", formatLimit(p.review_limit)], ["Storage", `${p.storage_limit_mb} MB`]].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-[12px]">
                    <span className="text-[#6B7280]">{label}</span>
                    <span className="font-medium text-[#111]">{value}</span>
                  </div>
                ))}
              </div>
              {p.features && p.features.length > 0 && (
                <div className="border-t border-[#F3F4F6] pt-3 space-y-1.5">
                  {(p.features as string[]).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-[#6B7280]">
                      <div className="w-1 h-1 rounded-full bg-[#166534]" />{f}
                    </div>
                  ))}
                </div>
              )}
              {!p.is_active && (
                <div className="mt-3 px-2.5 py-1 rounded-full bg-[#FEF2F2] text-[10px] text-[#EF4444] font-bold text-center uppercase tracking-wider">Inactive</div>
              )}
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-bold text-[#111]">{editingId ? "Edit Plan" : "Create Plan"}</h3>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-[#F3F4F6] flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] text-[#6B7280] uppercase tracking-wider font-medium mb-1 block">Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Growth" /></div>
                <div><label className="text-[10px] text-[#6B7280] uppercase tracking-wider font-medium mb-1 block">Slug</label><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputClass} placeholder="growth" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] text-[#6B7280] uppercase tracking-wider font-medium mb-1 block">Monthly Price (₹)</label><input type="number" value={form.priceMonthly} onChange={(e) => setForm({ ...form, priceMonthly: Number(e.target.value) })} className={inputClass} /></div>
                <div><label className="text-[10px] text-[#6B7280] uppercase tracking-wider font-medium mb-1 block">Yearly Price (₹)</label><input type="number" value={form.priceYearly} onChange={(e) => setForm({ ...form, priceYearly: Number(e.target.value) })} className={inputClass} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] text-[#6B7280] uppercase tracking-wider font-medium mb-1 block">Campaign Limit (-1 = unlimited)</label><input type="number" value={form.campaignLimit} onChange={(e) => setForm({ ...form, campaignLimit: Number(e.target.value) })} className={inputClass} /></div>
                <div><label className="text-[10px] text-[#6B7280] uppercase tracking-wider font-medium mb-1 block">QR Limit</label><input type="number" value={form.qrLimit} onChange={(e) => setForm({ ...form, qrLimit: Number(e.target.value) })} className={inputClass} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-[10px] text-[#6B7280] uppercase tracking-wider font-medium mb-1 block">AI Usage</label><input type="number" value={form.aiUsageLimit} onChange={(e) => setForm({ ...form, aiUsageLimit: Number(e.target.value) })} className={inputClass} /></div>
                <div><label className="text-[10px] text-[#6B7280] uppercase tracking-wider font-medium mb-1 block">Reviews</label><input type="number" value={form.reviewLimit} onChange={(e) => setForm({ ...form, reviewLimit: Number(e.target.value) })} className={inputClass} /></div>
                <div><label className="text-[10px] text-[#6B7280] uppercase tracking-wider font-medium mb-1 block">Storage (MB)</label><input type="number" value={form.storageLimitMb} onChange={(e) => setForm({ ...form, storageLimitMb: Number(e.target.value) })} className={inputClass} /></div>
              </div>
              <div>
                <label className="text-[10px] text-[#6B7280] uppercase tracking-wider font-medium mb-1 block">Features</label>
                <div className="flex gap-2 mb-2">
                  <input value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())} className={`${inputClass} flex-1`} placeholder="Add feature..." />
                  <button onClick={addFeature} className="px-3 py-2 rounded-lg bg-[#166534] text-white text-[12px] font-medium">Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {form.features.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F0FDF4] text-[11px] text-[#166534] font-medium">
                      {f}<button onClick={() => removeFeature(i)} className="hover:text-[#EF4444]"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
              {editingId && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} id="active" className="rounded" />
                  <label htmlFor="active" className="text-[12px] text-[#6B7280]">Active</label>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-[#E5E7EB] text-[12px] font-medium text-[#6B7280] hover:bg-[#F9FAFB]">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-[#166534] text-white text-[12px] font-bold hover:bg-[#15803D]">{editingId ? "Update Plan" : "Create Plan"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
