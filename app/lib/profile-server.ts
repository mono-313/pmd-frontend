import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_CONFIG } from "@/app/lib/api-config";

export async function getAccessToken(): Promise<string | null> {
  return (await cookies()).get("access-token")?.value ?? null;
}

export function unauthorized() {
  return NextResponse.json(
    { message: "برای انجام این عملیات باید وارد سامانه شوید." },
    { status: 401 }
  );
}

export async function parseBackendResponse(response: Response) {
  if (response.status === 204 || response.status === 205) {
    return new NextResponse(null, { status: response.status });
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  return NextResponse.json(
    typeof body === "string" ? { message: body } : body ?? {},
    { status: response.status }
  );
}

export async function isCurrentUserAdmin(token: string): Promise<boolean> {
  const response = await fetch(`${API_CONFIG.baseUrl}/auth/me`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) return false;

  const payload = await response.json().catch(() => null);
  const roles = payload?.roles ?? payload?.data?.roles ?? [];

  return Array.isArray(roles) &&
    roles.some((role: unknown) =>
      String(typeof role === "string" ? role : (role as { name?: string })?.name)
        .toLowerCase()
        .replace(/[\s_-]/g, "") === "admin"
    );
}

export function forbidden() {
  return NextResponse.json(
    { message: "فقط مدیر سامانه اجازه انجام این عملیات را دارد." },
    { status: 403 }
  );
}
