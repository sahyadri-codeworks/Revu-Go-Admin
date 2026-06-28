import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function verifySuperAdmin(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("super_admins")
    .select("id")
    .eq("email", user.email)
    .single();

  return data ? user.email : null;
}

export async function GET(req: NextRequest) {
  const adminEmail = await verifySuperAdmin(req);
  if (!adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const admin = createAdminClient();
  const action = req.nextUrl.searchParams.get("action");

  if (action === "check-admin") {
    return NextResponse.json({ isAdmin: true });
  }

  if (action === "overview") {
    const [businesses, reviews, campaigns, coupons, plans, subscriptions] = await Promise.all([
      admin.from("businesses").select("id, is_active, plan, created_at"),
      admin.from("review_sessions").select("id, created_at"),
      admin.from("campaigns").select("id"),
      admin.from("coupons").select("id"),
      admin.from("plans").select("*").order("price_monthly"),
      admin.from("subscriptions").select("*, plans(name)"),
    ]);

    const biz = businesses.data || [];
    const subs = subscriptions.data || [];
    const trialCount = subs.filter((s) => s.status === "trial").length;
    const paidCount = subs.filter((s) => s.status === "active").length;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthlyReviews = (reviews.data || []).filter((r) => r.created_at >= monthStart).length;

    return NextResponse.json({
      totalBusinesses: biz.length,
      activeBusinesses: biz.filter((b) => b.is_active).length,
      trialAccounts: trialCount,
      paidAccounts: paidCount,
      totalReviews: (reviews.data || []).length,
      monthlyReviews,
      totalCampaigns: (campaigns.data || []).length,
      totalCoupons: (coupons.data || []).length,
      plans: plans.data || [],
      subscriptions: subs,
    });
  }

  if (action === "accounts") {
    const { data } = await admin
      .from("businesses")
      .select("*, profiles:owner_id(full_name, email)")
      .order("created_at", { ascending: false });

    const { data: subs } = await admin
      .from("subscriptions")
      .select("*, plans(name, slug)");

    const subsMap: Record<string, (typeof subs extends (infer U)[] | null ? U : never)> = {};
    (subs || []).forEach((s) => { subsMap[s.business_id] = s; });

    const { data: reviewCounts } = await admin
      .from("review_sessions")
      .select("business_id");
    const { data: campaignCounts } = await admin
      .from("campaigns")
      .select("business_id");

    const revMap: Record<string, number> = {};
    (reviewCounts || []).forEach((r) => { revMap[r.business_id] = (revMap[r.business_id] || 0) + 1; });
    const campMap: Record<string, number> = {};
    (campaignCounts || []).forEach((c) => { campMap[c.business_id] = (campMap[c.business_id] || 0) + 1; });

    const accounts = (data || []).map((b) => ({
      ...b,
      subscription: subsMap[b.id] || null,
      review_count: revMap[b.id] || 0,
      campaign_count: campMap[b.id] || 0,
    }));

    return NextResponse.json({ accounts });
  }

  if (action === "plans") {
    const { data } = await admin.from("plans").select("*").order("price_monthly");
    return NextResponse.json({ plans: data || [] });
  }

  if (action === "subscriptions") {
    const { data } = await admin
      .from("subscriptions")
      .select("*, businesses(name, slug), plans(name, slug)")
      .order("created_at", { ascending: false });
    return NextResponse.json({ subscriptions: data || [] });
  }

  if (action === "analytics") {
    const [businesses, reviews, campaigns, coupons, feedback] = await Promise.all([
      admin.from("businesses").select("id, is_active, plan, created_at, location_city"),
      admin.from("review_sessions").select("id, star_rating, created_at"),
      admin.from("campaigns").select("id, is_active, created_at"),
      admin.from("coupons").select("id, is_redeemed, created_at"),
      admin.from("private_feedback").select("id, created_at"),
    ]);

    const biz = businesses.data || [];
    const revs = reviews.data || [];

    const cityDist: Record<string, number> = {};
    biz.forEach((b) => {
      const city = b.location_city || "Unknown";
      cityDist[city] = (cityDist[city] || 0) + 1;
    });

    const months: Record<string, { businesses: number; reviews: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = { businesses: 0, reviews: 0 };
    }
    biz.forEach((b) => {
      const key = b.created_at.substring(0, 7);
      if (months[key]) months[key].businesses++;
    });
    revs.forEach((r) => {
      const key = r.created_at.substring(0, 7);
      if (months[key]) months[key].reviews++;
    });

    const avgRating = revs.length > 0
      ? revs.reduce((sum, r) => sum + r.star_rating, 0) / revs.length
      : 0;

    return NextResponse.json({
      totalBusinesses: biz.length,
      activeBusinesses: biz.filter((b) => b.is_active).length,
      totalReviews: revs.length,
      totalCampaigns: (campaigns.data || []).length,
      totalCoupons: (coupons.data || []).length,
      totalFeedback: (feedback.data || []).length,
      avgRating: Number(avgRating.toFixed(1)),
      cityDistribution: cityDist,
      monthlyGrowth: months,
      activeCampaigns: (campaigns.data || []).filter((c) => c.is_active).length,
      redeemedCoupons: (coupons.data || []).filter((c) => c.is_redeemed).length,
    });
  }

  if (action === "logs") {
    const { data } = await admin
      .from("admin_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    return NextResponse.json({ logs: data || [] });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const adminEmail = await verifySuperAdmin(req);
  if (!adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const admin = createAdminClient();
  const body = await req.json();
  const { action } = body;

  const log = async (act: string, targetType: string, targetId: string, details = {}) => {
    await admin.from("admin_logs").insert({
      admin_email: adminEmail,
      action: act,
      target_type: targetType,
      target_id: targetId,
      details,
    });
  };

  if (action === "bootstrap-subscriptions") {
    const { data: businesses } = await admin.from("businesses").select("id, plan");
    const { data: existingSubs } = await admin.from("subscriptions").select("business_id");
    const existingIds = new Set((existingSubs || []).map((s: { business_id: string }) => s.business_id));
    const { data: allPlans } = await admin.from("plans").select("id, slug");
    const planMap = new Map((allPlans || []).map((p: { id: string; slug: string }) => [p.slug, p.id]));
    const fallbackPlanId = planMap.get("starter") || (allPlans && allPlans[0]?.id);

    let created = 0;
    for (const biz of (businesses || [])) {
      if (existingIds.has(biz.id)) continue;
      const planId = planMap.get(biz.plan || "starter") || fallbackPlanId;
      if (!planId) continue;
      const now = new Date();
      await admin.from("subscriptions").insert({
        business_id: biz.id,
        plan_id: planId,
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString(),
      });
      created++;
    }
    return NextResponse.json({ success: true, created });
  }

  if (action === "create-account") {
    const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { full_name: body.ownerName },
    });
    if (authErr || !authUser.user) {
      return NextResponse.json({ error: authErr?.message || "Failed to create user" }, { status: 400 });
    }

    const userId = authUser.user.id;
    const slug = body.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20) + "-" + Math.random().toString(36).slice(2, 10);

    const { data: biz, error: bizErr } = await admin.from("businesses").insert({
      owner_id: userId,
      name: body.businessName,
      slug,
      logo_url: "",
      google_maps_url: "",
      google_place_id: "",
      category: "other",
      location_city: body.city || "",
      location_area: body.area || "",
      industry_segment: body.industry || "",
      sub_industry: body.subIndustry || "",
      plan: body.plan || "starter",
      is_active: true,
    }).select("id").single();

    if (bizErr) {
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: bizErr.message }, { status: 400 });
    }

    const { data: planRow } = await admin.from("plans").select("id").eq("slug", body.plan || "starter").single();
    if (planRow) {
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 14);
      await admin.from("subscriptions").insert({
        business_id: biz.id,
        plan_id: planRow.id,
        status: "trial",
        trial_ends_at: trialEnd.toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: trialEnd.toISOString(),
      });
    }

    await log("create_account", "business", biz.id, { email: body.email, businessName: body.businessName });
    return NextResponse.json({ success: true, businessId: biz.id, userId });
  }

  if (action === "edit-account") {
    const updates: Record<string, unknown> = {};
    if (body.name) updates.name = body.name;
    if (body.locationArea !== undefined) updates.location_area = body.locationArea;
    if (body.locationCity !== undefined) updates.location_city = body.locationCity;
    if (body.industry !== undefined) updates.industry_segment = body.industry;
    if (body.subIndustry !== undefined) updates.sub_industry = body.subIndustry;
    if (body.plan) updates.plan = body.plan;
    if (body.googleMapsUrl !== undefined) updates.google_maps_url = body.googleMapsUrl;

    const { error } = await admin.from("businesses").update(updates).eq("id", body.businessId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await log("edit_account", "business", body.businessId, updates);
    return NextResponse.json({ success: true });
  }

  if (action === "impersonate") {
    const { data: biz } = await admin
      .from("businesses")
      .select("owner_id")
      .eq("id", body.businessId)
      .single();
    if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: body.email,
    });
    if (linkErr || !linkData) {
      return NextResponse.json({ error: linkErr?.message || "Failed to generate link" }, { status: 400 });
    }

    const { data: otpData, error: otpErr } = await admin.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "magiclink",
    });
    if (otpErr || !otpData.session) {
      return NextResponse.json({ error: otpErr?.message || "Failed to create session" }, { status: 400 });
    }

    await log("impersonate", "business", body.businessId, { email: body.email });

    return NextResponse.json({
      success: true,
      accessToken: otpData.session.access_token,
      refreshToken: otpData.session.refresh_token,
    });
  }

  if (action === "suspend-account") {
    await admin.from("businesses").update({ is_active: false }).eq("id", body.businessId);
    await admin.from("subscriptions").update({ status: "suspended" }).eq("business_id", body.businessId);
    await log("suspend_account", "business", body.businessId);
    return NextResponse.json({ success: true });
  }

  if (action === "activate-account") {
    await admin.from("businesses").update({ is_active: true }).eq("id", body.businessId);
    const now = new Date();
    await admin.from("subscriptions").update({
      status: "active",
      current_period_start: now.toISOString(),
      current_period_end: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString(),
    }).eq("business_id", body.businessId);
    await log("activate_account", "business", body.businessId);
    return NextResponse.json({ success: true });
  }

  if (action === "delete-account") {
    const bizId = body.businessId;
    const sessionIds = (await admin.from("review_sessions").select("id").eq("business_id", bizId)).data?.map((r) => r.id) || [];
    if (sessionIds.length > 0) await admin.from("scrape_jobs").delete().in("session_id", sessionIds);
    await admin.from("coupons").delete().eq("business_id", bizId);
    await admin.from("private_feedback").delete().eq("business_id", bizId);
    await admin.from("review_sessions").delete().eq("business_id", bizId);
    await admin.from("campaigns").delete().eq("business_id", bizId);
    await admin.from("subscriptions").delete().eq("business_id", bizId);
    await admin.from("businesses").delete().eq("id", bizId);
    await log("delete_account", "business", bizId);
    return NextResponse.json({ success: true });
  }

  if (action === "create-plan") {
    const { data, error } = await admin.from("plans").insert({
      name: body.name,
      slug: body.slug,
      price_monthly: body.priceMonthly,
      price_yearly: body.priceYearly,
      campaign_limit: body.campaignLimit,
      qr_limit: body.qrLimit,
      ai_usage_limit: body.aiUsageLimit,
      review_limit: body.reviewLimit,
      storage_limit_mb: body.storageLimitMb,
      features: body.features || [],
    }).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await log("create_plan", "plan", data.id);
    return NextResponse.json({ plan: data });
  }

  if (action === "update-plan") {
    const { error } = await admin.from("plans").update({
      name: body.name,
      slug: body.slug,
      price_monthly: body.priceMonthly,
      price_yearly: body.priceYearly,
      campaign_limit: body.campaignLimit,
      qr_limit: body.qrLimit,
      ai_usage_limit: body.aiUsageLimit,
      review_limit: body.reviewLimit,
      storage_limit_mb: body.storageLimitMb,
      features: body.features || [],
      is_active: body.isActive,
    }).eq("id", body.planId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await log("update_plan", "plan", body.planId);
    return NextResponse.json({ success: true });
  }

  if (action === "delete-plan") {
    await admin.from("plans").delete().eq("id", body.planId);
    await log("delete_plan", "plan", body.planId);
    return NextResponse.json({ success: true });
  }

  if (action === "update-subscription") {
    const updates: Record<string, unknown> = {};
    if (body.status) updates.status = body.status;
    if (body.planId) updates.plan_id = body.planId;
    if (body.trialEndsAt) updates.trial_ends_at = body.trialEndsAt;
    if (body.periodStart) updates.current_period_start = body.periodStart;
    if (body.periodEnd) updates.current_period_end = body.periodEnd;
    if (body.status === "cancelled") updates.cancelled_at = new Date().toISOString();
    const { error } = await admin.from("subscriptions").update(updates).eq("id", body.subscriptionId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await log("update_subscription", "subscription", body.subscriptionId, updates);
    return NextResponse.json({ success: true });
  }

  if (action === "create-subscription") {
    const { data, error } = await admin.from("subscriptions").insert({
      business_id: body.businessId,
      plan_id: body.planId,
      status: body.status || "trial",
      trial_ends_at: body.trialEndsAt || new Date(Date.now() + 14 * 86400000).toISOString(),
      current_period_end: body.periodEnd || new Date(Date.now() + 30 * 86400000).toISOString(),
    }).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await log("create_subscription", "subscription", data.id);
    return NextResponse.json({ subscription: data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
