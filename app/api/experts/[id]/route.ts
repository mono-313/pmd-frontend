import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  API_CONFIG,
  API_ENDPOINTS,
} from "@/app/lib/api-config";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id: rawId } = await context.params;
    const id = rawId?.trim();

    if (!id) {
      return NextResponse.json(
        { message: "شناسه کارشناس معتبر نیست." },
        { status: 400 }
      );
    }

    const token = (await cookies()).get("access-token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "نشست کاربری معتبر نیست." },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${API_CONFIG.baseUrl}${API_ENDPOINTS.experts.byId(id)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const text = await response.text();
    const data = parseJson(text);

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            getMessage(data) ??
            (response.status === 404
              ? "کارشناس موردنظر پیدا نشد."
              : "دریافت اطلاعات کارشناس انجام نشد."),
        },
        { status: response.status }
      );
    }

    if (!isRecord(data) || typeof data.id !== "string") {
      return NextResponse.json(
        { message: "ساختار پاسخ کارشناس معتبر نیست." },
        { status: 502 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Get expert by id route error:", error);
    return NextResponse.json(
      { message: "ارتباط با وب‌سرویس کارشناس برقرار نشد." },
      { status: 500 }
    );
  }
}

function parseJson(text: string): unknown | null {
  if (!text.trim()) return null;
  try { return JSON.parse(text) as unknown; } catch { return null; }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getMessage(value: unknown): string | null {
  if (!isRecord(value)) return null;
  if (typeof value.message === "string") return value.message;
  if (typeof value.description === "string") return value.description;
  return null;
}
