// lib/auth/server.ts
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./jwt";

export async function getSessionUserId() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  return payload?.sub ?? null;
}

/** Replacement for the old Supabase `auth.getUser()` + `supabase_id` lookup pattern. */
export async function getAuthenticatedUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  return prisma.user.findUnique({ where: { id: userId } });
}
