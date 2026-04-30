import { NextResponse } from "next/server";
import {
  createOptionalServerSupabaseClient,
  hasSupabaseEnv,
} from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    // In dev mode without Supabase configured, no server session exists.
    // Redux persist handles client-side session restoration.
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ user: null });
    }

    const supabase = await createOptionalServerSupabaseClient();
    if (!supabase) return NextResponse.json({ user: null });

    const userRes = await supabase.auth.getUser();
    const supaUser = userRes.data?.user;
    if (!supaUser) return NextResponse.json({ user: null });

    // find user in prisma and return safe fields
    const user = await prisma.user.findUnique({
      where: { supabase_id: supaUser.id },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user) return NextResponse.json({ user: null });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}
