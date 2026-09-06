import {
  NextResponse,
} from "next/server";

import {
  cookies,
} from "next/headers";

import {
  API_CONFIG,
  API_ENDPOINTS,
} from "@/app/lib/api-config";

import type {
  ApiErrorResponse,
  ForecastReasonRequest,
} from "@/app/types/forecast";


interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}


export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const {
      id,
    } = await context.params;


    if (!id) {
      return NextResponse.json(
        {
          message:
            "شناسه موضوع معتبر نیست.",
        },
        {
          status: 400,
        }
      );
    }


    const cookieStore =
      await cookies();

    const accessToken =
      cookieStore.get(
        "access-token"
      )?.value;


    if (!accessToken) {
      return NextResponse.json(
        {
          message:
            "نشست کاربری معتبر نیست.",
        },
        {
          status: 401,
        }
      );
    }


    const requestData =
      await request.json() as
        ForecastReasonRequest;


    const reason =
      requestData.reason?.trim();


    if (!reason) {
      return NextResponse.json(
        {
          message:
            "وارد کردن دلیل رد الزامی است.",
        },
        {
          status: 400,
        }
      );
    }


    const backendUrl =
      `${API_CONFIG.baseUrl}` +
      `${API_ENDPOINTS.forecasts.reject(id)}`;


    const backendResponse =
      await fetch(
        backendUrl,
        {
          method: "POST",

          headers: {
            Accept:
              "application/json",

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${accessToken}`,
          },

          body:
            JSON.stringify({
              reason,
            }),

          cache:
            "no-store",
        }
      );


    const responseText =
      await backendResponse.text();

    const responseData =
      parseJsonResponse(
        responseText
      );


    if (!backendResponse.ok) {
      const apiError =
        responseData as
          | ApiErrorResponse
          | null;


      return NextResponse.json(
        {
          message:
            apiError?.message ??
            apiError?.description ??
            "رد موضوع انجام نشد.",
        },
        {
          status:
            backendResponse.status,
        }
      );
    }


    return NextResponse.json(
      {
        message:
          "موضوع رد شد.",

        data:
          responseData,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Reject forecast error:",
      error
    );


    if (
      error instanceof
      SyntaxError
    ) {
      return NextResponse.json(
        {
          message:
            "اطلاعات ارسال‌شده معتبر نیست.",
        },
        {
          status: 400,
        }
      );
    }


    return NextResponse.json(
      {
        message:
          "ارتباط با وب‌سرویس برقرار نشد.",
      },
      {
        status: 500,
      }
    );
  }
}


function parseJsonResponse(
  responseText: string
): unknown | null {
  if (!responseText.trim()) {
    return null;
  }


  try {
    return JSON.parse(
      responseText
    ) as unknown;
  } catch {
    return null;
  }
}