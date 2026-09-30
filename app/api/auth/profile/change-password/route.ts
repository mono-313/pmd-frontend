import { NextResponse } from "next/server";

import { API_CONFIG } from "@/app/lib/api-config";
import {
  getAccessToken,
  parseBackendResponse,
  unauthorized,
} from "@/app/lib/profile-server";

export async function POST(request: Request) {
  const token = await getAccessToken();
  if (!token) return unauthorized();

  const body = await request.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword || newPassword.length < 8) {
    return NextResponse.json(
      { message: "رمز فعلی و رمز جدید حداقل ۸ کاراکتری الزامی است." },
      { status: 400 }
    );
  }

  const response = await fetch(`${API_CONFIG.baseUrl}/auth/profile/change-password`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
    cache: "no-store",
  });

  return parseBackendResponse(response);
}
