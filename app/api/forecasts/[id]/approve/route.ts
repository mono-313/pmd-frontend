import {
  NextResponse,
} from "next/server";

import {
  cookies,
} from "next/headers";

import {
  API_CONFIG,
  API_ENDPOINTS
} from "@/app/lib/api-config";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  context: RouteContext
) {
  const {
    id,
  } = await context.params;

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

  try {
    const response = await fetch(
      `${API_CONFIG.baseUrl}` +
        `${API_ENDPOINTS.forecasts.approve(id)

        }`,
      {
        method: "POST",

        headers: {
          Accept:
            "application/json",

          Authorization:
            `Bearer ${accessToken}`,
        },

        cache:
          "no-store",
      }
    );

    const responseText =
      await response.text();

    const data =
      responseText.trim()
        ? JSON.parse(
            responseText
          )
        : null;

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            data?.message ??
            "تأیید موضوع انجام نشد.",
        },
        {
          status:
            response.status,
        }
      );
    }

    return NextResponse.json(
      data ?? {
        message:
          "موضوع تأیید شد.",
      }
    );
  } catch (error) {
    console.error(
      "Approve forecast error:",
      error
    );

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