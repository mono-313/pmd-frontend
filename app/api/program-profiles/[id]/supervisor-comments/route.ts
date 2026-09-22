import {
  cookies,
} from "next/headers";

import {
  NextResponse,
} from "next/server";

import {
  API_CONFIG,
} from "@/app/lib/api-config";

import type {
  SupervisorCommentListResponse,
  SupervisorCommentResponse,
} from "@/app/types/program-profile";


interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}


/*
 * GET
 * دریافت تمام نظرات ناظر
 */
export async function GET(
  _request:
    Request,

  context:
    RouteContext
) {
  const {
    id,
  } = await context.params;

  const profileId =
    id.trim();

  if (!profileId) {
    return jsonError(
      "شناسه شناسنامه معتبر نیست.",
      400
    );
  }

  const accessToken =
    await getAccessToken();

  if (!accessToken) {
    return jsonError(
      "نشست کاربری معتبر نیست.",
      401
    );
  }

  const backendUrl =
    createBackendUrl(
      profileId
    );

  try {
    const backendResponse =
      await fetch(
        backendUrl,
        {
          method:
            "GET",

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
      await backendResponse.text();

    const responseData =
      parseJsonResponse(
        responseText
      );

    if (!backendResponse.ok) {
      return createBackendErrorResponse(
        backendResponse.status,
        responseData,
        responseText
      );
    }

    const comments =
      extractComments(
        responseData
      );

    if (!comments) {
      console.error(
        "Invalid supervisor comments response:",
        {
          backendUrl,
          responseData,
          responseText,
        }
      );

      return jsonError(
        "ساختار پاسخ نظرات ناظر معتبر نیست.",
        502
      );
    }

    const result:
      SupervisorCommentListResponse = {
      items:
        comments,
    };

    return NextResponse.json(
      result,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Get supervisor comments route error:",
      error
    );

    return jsonError(
      "ارتباط با وب‌سرویس نظرات ناظر برقرار نشد.",
      500
    );
  }
}


/*
 * POST
 * ثبت نظر جدید ناظر
 */
export async function POST(
  request:
    Request,

  context:
    RouteContext
) {
  const {
    id,
  } = await context.params;

  const profileId =
    id.trim();

  if (!profileId) {
    return jsonError(
      "شناسه شناسنامه معتبر نیست.",
      400
    );
  }

  const comment =
    await readComment(
      request
    );

  if (!comment) {
    return jsonError(
      "متن نظر ناظر الزامی است.",
      400
    );
  }

  const accessToken =
    await getAccessToken();

  if (!accessToken) {
    return jsonError(
      "نشست کاربری معتبر نیست.",
      401
    );
  }

  const backendUrl =
    createBackendUrl(
      profileId
    );

  try {
    const backendResponse =
      await fetch(
        backendUrl,
        {
          method:
            "POST",

          headers: {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${accessToken}`,

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              comment,
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
      return createBackendErrorResponse(
        backendResponse.status,
        responseData,
        responseText
      );
    }

    const createdComment =
      isSupervisorComment(
        responseData
      )
        ? responseData
        : isRecord(
            responseData
          ) &&
          isSupervisorComment(
            responseData.data
          )
          ? responseData.data
          : null;

    return NextResponse.json(
      {
        message:
          "نظر ناظر با موفقیت ثبت شد.",

        comment:
          createdComment,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Create supervisor comment route error:",
      error
    );

    return jsonError(
      "ارتباط با وب‌سرویس ثبت نظر ناظر برقرار نشد.",
      500
    );
  }
}


async function readComment(
  request:
    Request
): Promise<string> {
  try {
    const requestData =
      await request.json() as
        unknown;

    if (
      isRecord(
        requestData
      ) &&
      typeof requestData.comment ===
        "string"
    ) {
      return requestData.comment.trim();
    }
  } catch {
    return "";
  }

  return "";
}


async function getAccessToken():
  Promise<string | null> {
  const cookieStore =
    await cookies();

  return (
    cookieStore.get(
      "access-token"
    )?.value ??
    null
  );
}


function createBackendUrl(
  profileId:
    string
): string {
  return (
    API_CONFIG.baseUrl.replace(
      /\/+$/,
      ""
    ) +
    `/api/program-profiles/${encodeURIComponent(
      profileId
    )}/supervisor-comments`
  );
}


function extractComments(
  value:
    unknown
): SupervisorCommentResponse[] | null {
  if (
    Array.isArray(
      value
    )
  ) {
    return value.filter(
      isSupervisorComment
    );
  }

  if (
    !isRecord(
      value
    )
  ) {
    return null;
  }

  const possibleValues = [
    value.items,
    value.data,
    value.result,
    value.comments,
    value.supervisorComments,
  ];

  for (
    const possibleValue of
    possibleValues
  ) {
    if (
      Array.isArray(
        possibleValue
      )
    ) {
      return possibleValue.filter(
        isSupervisorComment
      );
    }

    if (
      isRecord(
        possibleValue
      )
    ) {
      const nestedComments =
        extractComments(
          possibleValue
        );

      if (nestedComments) {
        return nestedComments;
      }
    }
  }

  return null;
}


function isSupervisorComment(
  value:
    unknown
): value is SupervisorCommentResponse {
  return (
    isRecord(
      value
    ) &&
    typeof value.id ===
      "string" &&
    typeof value.comment ===
      "string" &&
    typeof value.createdDate ===
      "string"
  );
}


function createBackendErrorResponse(
  status:
    number,

  responseData:
    unknown,

  responseText:
    string
) {
  return NextResponse.json(
    {
      message:
        getSupervisorCommentErrorMessage(
          responseData,
          status
        ),

      details:
        responseData ??
        responseText.slice(
          0,
          1000
        ),
    },
    {
      status,
    }
  );
}


function getSupervisorCommentErrorMessage(
  value:
    unknown,

  status:
    number
): string {
  if (
    isRecord(
      value
    )
  ) {
    const code =
      getString(
        value.code
      );

    switch (code) {
      case "Profile.CommentNotAllowedAtStage":
        return "ثبت نظر فقط در مرحله بررسی ناظر مجاز است.";

      case "Profile.CommentTextEmpty":
        return "متن نظر ناظر نمی‌تواند خالی باشد.";

      case "Profile.NotAuthorizedForStage":
        return "نقش شما مجاز به ثبت نظر برای این شناسنامه نیست.";
    }

    const backendMessage =
      getString(
        value.message
      ) ??
      getString(
        value.description
      ) ??
      getString(
        value.detail
      ) ??
      getString(
        value.title
      ) ??
      getString(
        value.errors
      );

    if (backendMessage) {
      return backendMessage;
    }
  }

  if (status === 401) {
    return "نشست کاربری معتبر نیست.";
  }

  if (status === 403) {
    return "شما مجوز ثبت یا مشاهده نظرات این شناسنامه را ندارید.";
  }

  if (status === 404) {
    return "شناسنامه موردنظر پیدا نشد.";
  }

  return (
    "عملیات نظرات ناظر انجام نشد. " +
    `کد پاسخ Backend: ${status}`
  );
}


function jsonError(
  message:
    string,

  status:
    number
) {
  return NextResponse.json(
    {
      message,
    },
    {
      status,
    }
  );
}


function parseJsonResponse(
  responseText:
    string
): unknown | null {
  if (
    !responseText.trim()
  ) {
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


function getString(
  value:
    unknown
): string | null {
  return (
    typeof value ===
      "string" &&
    value.trim()
  )
    ? value.trim()
    : null;
}


function isRecord(
  value:
    unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(
      value
    )
  );
}