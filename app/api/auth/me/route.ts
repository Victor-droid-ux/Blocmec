import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server";

export async function POST() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ user: null });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
