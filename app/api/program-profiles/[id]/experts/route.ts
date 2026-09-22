import {
  cookies,
} from "next/headers";

import {
  NextResponse,
} from "next/server";

import {
  API_CONFIG,
} from "@/app/lib/api-config";


interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}


export async function PUT(
  request: Request,
  context: RouteContext
) {
  const {
    id,
  } = await context.params;

  const profileId =
    id.trim();

  if (!profileId) {
    return NextResponse.json(
      {
        message:
          "شناسه شناسنامه معتبر نیست.",
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

  let requestData: unknown;

  try {
    requestData =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        message:
          "اطلاعات کارشناسان معتبر نیست.",
      },
      {
        status: 400,
      }
    );
  }

  const backendUrl =
    API_CONFIG.baseUrl.replace(
      /\/+$/,
      ""
    ) +
    `/api/program-profiles/${encodeURIComponent(
      profileId
    )}/experts`;

  console.log(
    "UPDATE PROFILE EXPERTS REQUEST:",
    {
      profileId,
      backendUrl,
      requestData,
    }
  );

  try {
    const backendResponse =
      await fetch(
        backendUrl,
        {
          method: "PUT",

          headers: {
            Accept:
              "application/json",

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${accessToken}`,
          },

          body:
            JSON.stringify(
              requestData
            ),

          cache:
            "no-store",
        }
      );

    const responseText =
      await backendResponse.text();

    console.log(
      "UPDATE PROFILE EXPERTS RESPONSE:",
      {
        profileId,
        status:
          backendResponse.status,
        response:
          responseText,
      }
    );

    if (!responseText.trim()) {
      return new NextResponse(
        null,
        {
          status:
            backendResponse.status,
        }
      );
    }

    return new NextResponse(
      responseText,
      {
        status:
          backendResponse.status,

        headers: {
          "Content-Type":
            backendResponse.headers.get(
              "content-type"
            ) ??
            "application/json; charset=utf-8",
        },
      }
    );
  } catch (error) {
    console.error(
      "Update profile experts route error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "ارتباط با وب‌سرویس ثبت کارشناسان برقرار نشد.",
      },
      {
        status: 500,
      }
    );
  }
}