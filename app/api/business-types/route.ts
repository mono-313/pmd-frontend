import { NextResponse } from "next/server";

import { BASE_INFO_API_CONFIG } from "@/app/lib/api-config";

interface BaseInfoItem {
  Value: string;
  Text: string;
  Disabled?: boolean;
}

interface BaseInfoResponse {
  IsSuccess: boolean;
  Message: string | null;
  Data: BaseInfoItem[];
}

/**
 * GET /api/business-types
 *
 * مسیر فایل:
 * app/api/business-types/route.ts
 */
export async function GET() {
  try {
    const apiKey = BASE_INFO_API_CONFIG.apiKey;

    if (!apiKey) {
      return NextResponse.json(
        { message: "کلید API اطلاعات پایه تعریف نشده است." },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${BASE_INFO_API_CONFIG.baseUrl}${BASE_INFO_API_CONFIG.businessTypes}`,
      {
        method: "GET",
        headers: {
          "X-API-KEY": apiKey,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const responseText = await response.text();
    const responseData = parseBaseInfoResponse(responseText);

    if (!responseData) {
      return NextResponse.json(
        { message: "پاسخ وب‌سرویس عناوین شغلی معتبر نیست." },
        { status: 502 }
      );
    }

    if (!response.ok || !responseData.IsSuccess) {
      return NextResponse.json(
        {
          message:
            responseData.Message || "دریافت عناوین شغلی انجام نشد.",
        },
        { status: response.ok ? 502 : response.status }
      );
    }

    const businessTypes = responseData.Data.flatMap((item) => {
      const id = Number(item.Value);
      const name = item.Text?.trim();

      if (!Number.isInteger(id) || id <= 0 || !name) return [];

      return [
        {
          id,
          name,
          disabled: item.Disabled === true,
        },
      ];
    });

    return NextResponse.json({ businessTypes }, { status: 200 });
  } catch (error) {
    console.error("Business types API error:", error);

    return NextResponse.json(
      { message: "ارتباط با وب‌سرویس عناوین شغلی برقرار نشد." },
      { status: 500 }
    );
  }
}

function parseBaseInfoResponse(text: string): BaseInfoResponse | null {
  try {
    const value = JSON.parse(text) as unknown;

    if (
      typeof value !== "object" ||
      value === null ||
      !("IsSuccess" in value) ||
      typeof value.IsSuccess !== "boolean" ||
      !("Data" in value) ||
      !Array.isArray(value.Data)
    ) {
      return null;
    }

    return value as BaseInfoResponse;
  } catch {
    return null;
  }
}
