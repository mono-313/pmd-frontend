import { NextResponse } from "next/server";

import { API_CONFIG } from "@/app/lib/api-config";
import {
  forbidden,
  getAccessToken,
  isCurrentUserAdmin,
  parseBackendResponse,
  unauthorized,
} from "@/app/lib/profile-server";

type Context = { params: Promise<{ userId: string }> };

async function authorize() {
  const token = await getAccessToken();
  if (!token) return { response: unauthorized() };
  if (!(await isCurrentUserAdmin(token))) return { response: forbidden() };
  return { token };
}

export async function GET(_request: Request, context: Context) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { userId } = await context.params;

  const response = await fetch(`${API_CONFIG.baseUrl}/users/${encodeURIComponent(userId)}/roles`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${auth.token}` },
    cache: "no-store",
  });
  return parseBackendResponse(response);
}

export async function PUT(request: Request, context: Context) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const { userId } = await context.params;
  const body = await request.json().catch(() => null);
  const roleIds = Array.isArray(body?.roleIds)
    ? body.roleIds.map(String).filter(Boolean)
    : [];

  if (!roleIds.length) {
    return NextResponse.json({ message: "حداقل یک نقش انتخاب کنید." }, { status: 400 });
  }

  const response = await fetch(`${API_CONFIG.baseUrl}/users/${encodeURIComponent(userId)}/roles`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.token}`,
    },
    body: JSON.stringify({ userId, roleIds }),
    cache: "no-store",
  });
  return parseBackendResponse(response);
}
