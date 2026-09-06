import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  API_CONFIG,
  API_ENDPOINTS,
} from "@/app/lib/api-config";

import type {
  ForecastActionResponse,
  ForecastResponse,
} from "@/app/types/forecast";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/* POST /api/forecasts/{id}/submit - ارسال Forecast برای مدیر گروه */
export async function POST(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id: rawId } = await context.params;
    const id = rawId?.trim();

    if (!id) {
      return jsonError("شناسه پیش‌بینی معتبر نیست.", 400);
    }

    const accessToken = (await cookies()).get("access-token")?.value;

    if (!accessToken) {
      return jsonError("نشست کاربری معتبر نیست.", 401);
    }

    const backendResponse = await fetch(
      `${API_CONFIG.baseUrl}${API_ENDPOINTS.forecasts.submit(id)}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        /* این Endpoint طبق مستند Body ندارد. */
        cache: "no-store",
      }
    );

    const responseText = await backendResponse.text();
    const responseData = parseJsonResponse(responseText);

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message:
            getApiErrorMessage(responseData) ??
            "ارسال پیش‌بینی برای مدیر گروه انجام نشد.",
        },
        { status: backendResponse.status }
      );
    }

    /* پاسخ Backend می‌تواند خالی یا ForecastResponse باشد. */
    const forecast = getForecastResponse(responseData);

    const result: ForecastActionResponse = {
      message: "پیش‌بینی با موفقیت برای مدیر گروه ارسال شد.",
      ...(forecast ? { forecast } : {}),
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Submit forecast route error:", error);
    return jsonError("ارتباط با وب‌سرویس ارسال پیش‌بینی برقرار نشد.", 500);
  }
}

function getForecastResponse(value: unknown): ForecastResponse | null {
  if (isForecastResponse(value)) return value;
  if (!isRecord(value)) return null;

  if (isForecastResponse(value.forecast)) return value.forecast;
  if (isForecastResponse(value.data)) return value.data;
  if (isForecastResponse(value.result)) return value.result;
  return null;
}

function isForecastResponse(value: unknown): value is ForecastResponse {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.planId === "number" &&
    typeof value.mainTopic === "string" &&
    typeof value.status === "string"
  );
}

function parseJsonResponse(text: string): unknown | null {
  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getApiErrorMessage(value: unknown): string | null {
  if (!isRecord(value)) return null;

  if (value.code === "Forecast.InvalidStatusForSubmit") {
    return "فقط پیش‌نویس یا مورد برگشتی برای اصلاح قابل ارسال است.";
  }

  if (typeof value.message === "string") return value.message;
  if (typeof value.description === "string") return value.description;
  if (typeof value.title === "string") return value.title;
  return null;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}
