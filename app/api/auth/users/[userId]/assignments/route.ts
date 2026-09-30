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

export async function PUT(request: Request, context: Context) {
  const token = await getAccessToken();
  if (!token) return unauthorized();
  if (!(await isCurrentUserAdmin(token))) return forbidden();

  const { userId } = await context.params;
  const body = await request.json().catch(() => null);
  const networkIds = Array.isArray(body?.networkIds)
    ? body.networkIds.map(Number).filter((id: number) => Number.isInteger(id) && id > 0)
    : [];
  const networkGroupId = Number(body?.networkGroupId);

  if (!networkIds.length || !Number.isInteger(networkGroupId) || networkGroupId <= 0) {
    return NextResponse.json(
      { message: "حداقل یک شبکه و یک زیرشبکه معتبر انتخاب کنید." },
      { status: 400 }
    );
  }

  const response = await fetch(
    `${API_CONFIG.baseUrl}/auth/users/${encodeURIComponent(userId)}/assignments`,
    {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, networkIds, networkGroupId }),
      cache: "no-store",
    }
  );
  return parseBackendResponse(response);
}
