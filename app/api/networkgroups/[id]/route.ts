
import { NextResponse } from "next/server";

import {
  BASE_INFO_API_CONFIG,
} from "@/app/lib/api-config";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const backendUrl =
      `${BASE_INFO_API_CONFIG.baseUrl}` +
      `${BASE_INFO_API_CONFIG.networkGroups}/` +
      encodeURIComponent(id);

    console.log("NETWORK GROUP BACKEND URL:", backendUrl);
    console.log("NETWORK GROUP NETWORK ID:", id);

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "X-API-KEY": BASE_INFO_API_CONFIG.apiKey,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const responseText = await response.text();

    console.log("NETWORK GROUP BACKEND STATUS:", response.status);
    console.log("NETWORK GROUP BACKEND BODY:", responseText);

    let data: unknown;

    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { message: "پاسخ وب‌سرویس گروه‌ها JSON نیست." },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Network groups API error:", error);

    return NextResponse.json(
      { message: "دریافت زیرشبکه‌ها انجام نشد." },
      { status: 500 }
    );
  }
}
