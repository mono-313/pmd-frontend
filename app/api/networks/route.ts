import { NextResponse } from "next/server";

import {
  BASE_INFO_API_URL,
  API_ENDPOINTS,
} from "@/app/lib/api-config";

import type {
  BaseInfoResponse,
} from "@/app/types/base-info";

export async function GET() {
  try {
    const apiKey =
      process.env.BASE_INFO_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          message:
            "کلید API اطلاعات پایه تعریف نشده است.",
        },
        {
          status: 500,
        }
      );
    }

    const response = await fetch(
      `${BASE_INFO_API_URL}${API_ENDPOINTS.networks}`,
      {
        method: "GET",

        headers: {
          "X-API-KEY": apiKey,
          Accept: "application/json",
        },

        cache: "no-store",
      }
    );

    const responseText =
      await response.text();

    let responseData: BaseInfoResponse;

    try {
      responseData =
        JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          message:
            "پاسخ وب‌سرویس شبکه‌ها JSON نیست.",
        },
        {
          status: 502,
        }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            responseData.Message ||
            "دریافت شبکه‌ها انجام نشد.",
        },
        {
          status: response.status,
        }
      );
    }

    const networks = responseData.Data.map(
      (item) => ({
        id: Number(item.Value),
        name: item.Text,
        disabled: item.Disabled,
      })
    );

    return NextResponse.json(
      {
        networks,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Networks API error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "ارتباط با وب‌سرویس شبکه‌ها برقرار نشد.",
      },
      {
        status: 500,
      }
    );
  }
}