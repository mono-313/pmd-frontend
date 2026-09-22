import "server-only";

import {
  cookies,
} from "next/headers";

import {
  NextResponse,
} from "next/server";

import {
  API_CONFIG,
} from "@/app/lib/api-config";


export type ProgramProfileWorkflowAction =
  | "submit"
  | "approve"
  | "return";


interface ExecuteWorkflowActionOptions {
  profileId:
    string;

  action:
    ProgramProfileWorkflowAction;

  reason?:
    string;
}


interface JwtPayload {
  profile_role?:
    unknown;

  profileRole?:
    unknown;

  roles?:
    unknown;

  role?:
    unknown;

  [
    key: string
  ]:
    unknown;
}


const PROFILE_WORKFLOW_ROLES =
  new Set([
    "Admin",
    "Providers",
    "NetworkGroupManager",
    "Supervisor",
    "LiveSupervisor",
    "BroadcastManager",
    "PlanManager",
  ]);


/*
 * اجرای عملیات گردش‌کار شناسنامه:
 *
 * POST /api/program-profiles/{id}/submit
 * POST /api/program-profiles/{id}/approve
 * POST /api/program-profiles/{id}/return
 */
export async function executeProgramProfileWorkflowAction({
  profileId,
  action,
  reason,
}: ExecuteWorkflowActionOptions) {
  /*
   * شناسه مشترک تمام لاگ‌های یک درخواست.
   * با این مقدار می‌توان REQUEST، RESPONSE و ERROR
   * مربوط به یک عملیات را در Terminal کنار هم پیدا کرد.
   */
  const requestId =
    globalThis.crypto.randomUUID();

  const startedAt =
    Date.now();

  const normalizedProfileId =
    profileId.trim();

  if (!normalizedProfileId) {
    console.warn(
      "PROGRAM PROFILE WORKFLOW VALIDATION ERROR:",
      {
        requestId,
        action,
        reason:
          "EMPTY_PROFILE_ID",
      }
    );

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

  const normalizedReason =
    reason?.trim() ?? "";

  /*
   * طبق مستند جدید، دلیل بازگشت اجباری است.
   */
  if (
    action === "return" &&
    !normalizedReason
  ) {
    console.warn(
      "PROGRAM PROFILE WORKFLOW VALIDATION ERROR:",
      {
        requestId,
        profileId:
          normalizedProfileId,
        action,
        reason:
          "RETURN_REASON_IS_EMPTY",
      }
    );

    return NextResponse.json(
      {
        message:
          "وارد کردن دلیل بازگشت الزامی است.",
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
    console.warn(
      "PROGRAM PROFILE WORKFLOW AUTH ERROR:",
      {
        requestId,
        profileId:
          normalizedProfileId,
        action,
        hasAccessToken:
          false,
      }
    );

    return NextResponse.json(
      {
        message:
          "نشست کاربری معتبر نیست. دوباره وارد سامانه شوید.",
      },
      {
        status: 401,
      }
    );
  }

  /*
   * طبق مستند Backend، در عملیات return
   * باید role همراه reason ارسال شود.
   *
   * role از Claim با نام profile_role
   * داخل Access Token استخراج می‌شود.
   */
  const profileRole =
    action === "return"
      ? extractProfileRole(
          accessToken
        )
      : null;

  if (
    action === "return" &&
    !profileRole
  ) {
    console.warn(
      "PROGRAM PROFILE WORKFLOW AUTH ERROR:",
      {
        requestId,
        profileId:
          normalizedProfileId,
        action,
        hasAccessToken:
          true,
        hasProfileRole:
          false,
      }
    );

    return NextResponse.json(
      {
        message:
          "نقش کاربر در چرخه تأیید شناسنامه داخل توکن پیدا نشد. دوباره وارد سامانه شوید.",
      },
      {
        status: 403,
      }
    );
  }

  const backendUrl =
    buildProgramProfileWorkflowUrl(
      API_CONFIG.baseUrl,
      normalizedProfileId,
      action
    );

  const hasRequestBody =
    action === "return";

  /*
   * اطلاعات امن درخواست برای عیب‌یابی.
   * خود Access Token و متن reason عمداً چاپ نمی‌شوند.
   */
  const logContext = {
    requestId,
    profileId:
      normalizedProfileId,
    action,
    backendUrl,
    hasAccessToken:
      true,
    hasRequestBody,
    profileRole,
    reasonLength:
      action === "return"
        ? normalizedReason.length
        : 0,
  };

  console.info(
    "PROGRAM PROFILE WORKFLOW REQUEST:",
    logContext
  );

  try {
    const backendResponse =
      await fetch(
        backendUrl,
        {
          method: "POST",

          headers: {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${accessToken}`,

            ...(hasRequestBody
              ? {
                  "Content-Type":
                    "application/json",
                }
              : {}),
          },

          /*
           * submit و approve بدنه ندارند.
           *
           * return بدنه زیر را دارد:
           * {
           *   role,
           *   reason
           * }
           */
          body:
            action === "return"
              ? JSON.stringify({
                  role:
                    profileRole,

                  reason:
                    normalizedReason,
                })
              : undefined,

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

    const responseLog = {
      ...logContext,
      status:
        backendResponse.status,
      ok:
        backendResponse.ok,
      elapsedMs:
        Date.now() -
        startedAt,
      contentType:
        backendResponse.headers.get(
          "content-type"
        ),
      hasResponseBody:
        responseText.trim().length > 0,
    };

    if (!backendResponse.ok) {
      console.error(
        "PROGRAM PROFILE WORKFLOW ERROR:",
        {
          ...responseLog,
          response:
            getLoggableResponse(
              responseData,
              responseText
            ),
        }
      );

      return NextResponse.json(
        {
          message:
            getWorkflowErrorMessage(
              responseData,
              backendResponse.status,
              action
            ),

          details:
            responseData ??
            responseText.slice(
              0,
              1000
            ),
        },
        {
          status:
            backendResponse.status,
        }
      );
    }

    console.info(
      "PROGRAM PROFILE WORKFLOW SUCCESS:",
      responseLog
    );

    return NextResponse.json(
      {
        message:
          getWorkflowSuccessMessage(
            action
          ),

        data:
          responseData,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "PROGRAM PROFILE WORKFLOW CONNECTION ERROR:",
      {
        ...logContext,
        elapsedMs:
          Date.now() -
          startedAt,
        error:
          serializeError(
            error
          ),
      }
    );

    return NextResponse.json(
      {
        message:
          "ارتباط با وب‌سرویس گردش‌کار شناسنامه برقرار نشد.",
      },
      {
        status: 500,
      }
    );
  }
}


function extractProfileRole(
  accessToken:
    string
): string | null {
  const payload =
    decodeJwtPayload(
      accessToken
    );

  if (!payload) {
    return null;
  }

  /*
   * Claim اصلی طبق مستند جدید.
   */
  const directProfileRole =
    getString(
      payload.profile_role
    ) ??
    getString(
      payload.profileRole
    );

  if (
    directProfileRole &&
    PROFILE_WORKFLOW_ROLES.has(
      directProfileRole
    )
  ) {
    return directProfileRole;
  }

  /*
   * حالت سازگاری:
   * اگر Backend نقش را داخل role یا roles
   * قرار داده باشد.
   */
  const directRole =
    getString(
      payload.role
    );

  if (
    directRole &&
    PROFILE_WORKFLOW_ROLES.has(
      directRole
    )
  ) {
    return directRole;
  }

  const tokenRoles =
    normalizeRoles(
      payload.roles
    );

  return (
    tokenRoles.find(
      (role) =>
        PROFILE_WORKFLOW_ROLES.has(
          role
        )
    ) ??
    null
  );
}


function decodeJwtPayload(
  token:
    string
): JwtPayload | null {
  try {
    const tokenParts =
      token.split(".");

    if (
      tokenParts.length < 2
    ) {
      return null;
    }

    const encodedPayload =
      tokenParts[1];

    const normalizedBase64 =
      encodedPayload
        .replace(
          /-/g,
          "+"
        )
        .replace(
          /_/g,
          "/"
        )
        .padEnd(
          Math.ceil(
            encodedPayload.length /
              4
          ) * 4,
          "="
        );

    const decodedPayload =
      atob(
        normalizedBase64
      );

    const parsedPayload =
      JSON.parse(
        decodedPayload
      ) as unknown;

    return isRecord(
      parsedPayload
    )
      ? parsedPayload
      : null;
  } catch {
    return null;
  }
}


function normalizeRoles(
  value:
    unknown
): string[] {
  if (
    typeof value ===
      "string"
  ) {
    return value
      .split(",")
      .map(
        (role) =>
          role.trim()
      )
      .filter(Boolean);
  }

  if (
    Array.isArray(
      value
    )
  ) {
    return value.filter(
      (
        role
      ): role is string =>
        typeof role ===
          "string" &&
        role.trim().length > 0
    );
  }

  return [];
}


function getWorkflowSuccessMessage(
  action:
    ProgramProfileWorkflowAction
): string {
  switch (action) {
    case "submit":
      return "شناسنامه با موفقیت وارد چرخه تأیید شد.";

    case "approve":
      return "مرحله جاری شناسنامه با موفقیت تأیید شد.";

    case "return":
      return "شناسنامه با موفقیت به مرحله قبلی بازگردانده شد.";
  }
}


function getWorkflowErrorMessage(
  responseData:
    unknown,

  status:
    number,

  action:
    ProgramProfileWorkflowAction
): string {
  const backendMessage =
    getApiErrorMessage(
      responseData
    );

  if (backendMessage) {
    return backendMessage;
  }

  if (status === 401) {
    return "نشست کاربری معتبر نیست. دوباره وارد سامانه شوید.";
  }

  if (status === 403) {
    return (
      "شما مجوز انجام عملیات در مرحله جاری شناسنامه را ندارید. " +
      "نقش کاربر و مقدار profile_role داخل توکن را بررسی کنید."
    );
  }

  if (status === 404) {
    return "شناسنامه موردنظر پیدا نشد.";
  }

  if (status === 409) {
    return (
      "وضعیت شناسنامه تغییر کرده است. " +
      "صفحه را به‌روزرسانی و دوباره تلاش کنید."
    );
  }

  if (
    status === 400 &&
    action === "return"
  ) {
    return (
      "بازگشت شناسنامه انجام نشد. " +
      "دلیل بازگشت، نقش کاربر و مرحله جاری را بررسی کنید."
    );
  }

  return (
    "عملیات گردش‌کار شناسنامه انجام نشد. " +
    `کد پاسخ Backend: ${status}`
  );
}


function getApiErrorMessage(
  value:
    unknown
): string | null {
  if (!isRecord(value)) {
    return null;
  }

  const code =
    getString(
      value.code
    );

  switch (code) {
    case "Profile.InvalidStatusForSubmit":
      return "شناسنامه در وضعیت قابل ارسال قرار ندارد.";

    case "Profile.NotAuthorizedForStage":
      return "نقش شما مجاز به انجام عملیات در مرحله جاری نیست.";

    case "Profile.ReturnNotAllowedAtStage":
      return "بازگشت شناسنامه در این مرحله مجاز نیست.";

    case "Profile.ReturnReasonRequired":
      return "وارد کردن دلیل بازگشت الزامی است.";
  }

  const directMessage =
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
    );

  /*
   * در برخی پاسخ‌های Backend،
   * errors یک رشته فارسی است.
   */
  const directErrors =
    getString(
      value.errors
    );

  if (directErrors) {
    return directErrors;
  }

  /*
   * در پاسخ‌های Validation استاندارد ASP.NET،
   * errors ممکن است یک Object باشد.
   */
  if (
    isRecord(
      value.errors
    )
  ) {
    for (
      const errorValue of
      Object.values(
        value.errors
      )
    ) {
      if (
        typeof errorValue ===
          "string" &&
        errorValue.trim()
      ) {
        return errorValue.trim();
      }

      if (
        Array.isArray(
          errorValue
        )
      ) {
        const firstError =
          errorValue.find(
            (
              item
            ): item is string =>
              typeof item ===
                "string" &&
              item.trim().length > 0
          );

        if (firstError) {
          return firstError;
        }
      }
    }
  }

  return directMessage;
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


/*
 * پاسخ خطای Backend را برای لاگ محدود می‌کند
 * تا Terminal با متن‌های بسیار بزرگ پر نشود.
 */
function getLoggableResponse(
  responseData:
    unknown,

  responseText:
    string
): unknown {
  if (
    responseData === null
  ) {
    return responseText
      .slice(
        0,
        2000
      );
  }

  try {
    const serializedResponse =
      JSON.stringify(
        responseData
      );

    if (
      serializedResponse.length <=
        2000
    ) {
      return responseData;
    }

    return (
      serializedResponse.slice(
        0,
        2000
      ) +
      "... [TRUNCATED]"
    );
  } catch {
    return "[UNSERIALIZABLE_RESPONSE]";
  }
}


/*
 * Error به‌صورت پیش‌فرض همیشه اطلاعات مفیدی
 * در console object نشان نمی‌دهد؛ این تابع
 * فیلدهای لازم را صریح نگه می‌دارد.
 */
function serializeError(
  error:
    unknown
): Record<string, unknown> {
  if (
    error instanceof Error
  ) {
    return {
      name:
        error.name,
      message:
        error.message,
      stack:
        error.stack,
    };
  }

  return {
    value:
      error,
  };
}


/*
 * آدرس عملیات گردش‌کار را طوری می‌سازد
 * که /api فقط یک بار در URL وجود داشته باشد.
 *
 * هر دو مقدار زیر معتبرند:
 * http://172.16.60.34:8000
 * http://172.16.60.34:8000/api
 */
function buildProgramProfileWorkflowUrl(
  baseUrl:
    string,

  profileId:
    string,

  action:
    ProgramProfileWorkflowAction
): string {
  const normalizedBaseUrl =
    baseUrl
      .trim()
      .replace(
        /\/+$/,
        ""
      );

  const apiBaseUrl =
    normalizedBaseUrl
      .toLowerCase()
      .endsWith(
        "/api"
      )
      ? normalizedBaseUrl
      : `${normalizedBaseUrl}/api`;

  return (
    `${apiBaseUrl}/program-profiles/` +
    `${encodeURIComponent(profileId)}/` +
    action
  );
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
