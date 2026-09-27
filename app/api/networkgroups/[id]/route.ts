import { NextResponse } from "next/server";
import { BASE_INFO_API_CONFIG } from "@/app/lib/api-config";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const response = await fetch(
      `${BASE_INFO_API_CONFIG.baseUrl}${BASE_INFO_API_CONFIG.networkGroups}/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: {
          "X-API-KEY": BASE_INFO_API_CONFIG.apiKey,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

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