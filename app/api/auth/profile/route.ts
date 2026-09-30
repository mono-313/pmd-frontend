import { NextResponse } from "next/server";

import { API_CONFIG } from "@/app/lib/api-config";
import {
  getAccessToken,
  parseBackendResponse,
  unauthorized,
} from "@/app/lib/profile-server";

export async function GET() {
  const token = await getAccessToken();
  if (!token) return unauthorized();

  const response = await fetch(`${API_CONFIG.baseUrl}/auth/profile`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  return parseBackendResponse(response);
}

export async function PUT(request: Request) {
  const token = await getAccessToken();
  if (!token) return unauthorized();

  const body = await request.json().catch(() => null);
  const phoneNumber = typeof body?.phoneNumber === "string" ? body.phoneNumber.trim() : "";

  if (phoneNumber && !/^09\d{9}$/.test(phoneNumber)) {
    return NextResponse.json(
      { message: "شماره تلفن همراه باید با 09 شروع شود و 11 رقم باشد." },
      { status: 400 }
    );
  }

  const response = await fetch(`${API_CONFIG.baseUrl}/auth/profile`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ phoneNumber }),
    cache: "no-store",
  });

  return parseBackendResponse(response);
}
