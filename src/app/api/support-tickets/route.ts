import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function verifySuperAdmin(email: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("super_admins")
    .select("id")
    .eq("email", email)
    .single();
  return !!data;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const action = req.nextUrl.searchParams.get("action");

  if (action === "all") {
    const isAdmin = user.email ? await verifySuperAdmin(user.email) : false;
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data: tickets } = await admin
      .from("support_tickets")
      .select("*, businesses(name, slug)")
      .order("updated_at", { ascending: false });

    const ticketIds = (tickets || []).map((t) => t.id);
    const { data: messages } = ticketIds.length > 0
      ? await admin.from("ticket_messages").select("*").in("ticket_id", ticketIds).order("created_at")
      : { data: [] };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msgMap: Record<string, any[]> = {};
    (messages || []).forEach((m: any) => {
      if (!msgMap[m.ticket_id]) msgMap[m.ticket_id] = [];
      msgMap[m.ticket_id].push(m);
    });

    return NextResponse.json({
      tickets: (tickets || []).map((t) => ({ ...t, messages: msgMap[t.id] || [] })),
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const body = await req.json();
  const { action } = body;

  if (action === "admin-reply") {
    const isAdmin = user.email ? await verifySuperAdmin(user.email) : false;
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await admin.from("ticket_messages").insert({
      ticket_id: body.ticketId,
      sender_type: "admin",
      sender_email: user.email,
      message: body.message,
      is_internal_note: body.isInternalNote || false,
    });

    await admin
      .from("support_tickets")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", body.ticketId);

    return NextResponse.json({ success: true });
  }

  if (action === "update-ticket") {
    const isAdmin = user.email ? await verifySuperAdmin(user.email) : false;
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updates: Record<string, string> = { updated_at: new Date().toISOString() };
    if (body.status) updates.status = body.status;
    if (body.priority) updates.priority = body.priority;

    await admin
      .from("support_tickets")
      .update(updates)
      .eq("id", body.ticketId);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
