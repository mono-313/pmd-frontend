import { cookies } from "next/headers";

import {
  NextResponse,
} from "next/server";

import {
  API_BASE_URL,
  API_ENDPOINTS,
} from "@/app/lib/api-config";

import type {
  ApiErrorResponse,
  RegisterApiResponse,
  RegisterRequest,
  SafeUserSession,
} from "@/app/types/auth";


type ClientRegisterRequest = Omit<
  RegisterRequest,
  "roles"
>;


/*
 * POST /api/auth/register
 */
export async function POST(
  request: Request
) {
  try {
    const requestUrl =
      new URL(request.url);

    const isHttpsRequest =
      requestUrl.protocol ===
      "https:";


    /*
     * دریافت اطلاعات فرم ثبت‌نام
     */
    const clientData =
      (await request.json()) as
        ClientRegisterRequest;


    /*
     * اعتبارسنجی اولیه اطلاعات
     */
    if (
      !clientData.fullName ||
      !clientData.fullName.trim()
    ) {
      return NextResponse.json(
        {
          message:
            "نام کامل الزامی است.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !clientData.userName ||
      !clientData.userName.trim()
    ) {
      return NextResponse.json(
        {
          message:
            "نام کاربری الزامی است.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !clientData.email ||
      !clientData.email.trim()
    ) {
      return NextResponse.json(
        {
          message:
            "ایمیل الزامی است.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !clientData.password ||
      clientData.password.length < 8
    ) {
      return NextResponse.json(
        {
          message:
            "رمز عبور باید حداقل هشت کاراکتر باشد.",
        },
        {
          status: 400,
        }
      );
    }


    const backendBody:
      RegisterRequest = {
        fullName:
          clientData.fullName.trim(),

        userName:
          clientData.userName.trim(),

        email:
          clientData.email.trim(),

        password:
          clientData.password,

        roles: [
          "User",
        ],

        networkIds:
          clientData.networkIds ?? [],

        networkGroupId:
          clientData.networkGroupId ??
          null,
      };


    /*
     * ارسال درخواست به Backend
     */
    const backendResponse =
    await fetch(
    `${API_BASE_URL}` +
      `${API_ENDPOINTS.auth.register}`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        Accept:
          "application/json",
      },

      body: JSON.stringify(
        backendBody
      ),

      cache:
        "no-store",
    }
  );

    /*
     *اول text
     */
    const responseText =
      await backendResponse.text();

    const responseData =
      parseJsonResponse(
        responseText
      );


    /*
     * پاسخ ناموفق Backend
     */
    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message:
            getRegisterErrorMessage(
              backendResponse.status,
              responseData
            ),

          code:
            getStringProperty(
              responseData,
              "code"
            ),

          errors:
            getProperty(
              responseData,
              "errors"
            ),
        },
        {
          status:
            backendResponse.status,
        }
      );
    }


    /*
     * پاسخ موفق باید JSON معتبر باشد.
     */
    if (
      !isRegisterApiResponse(
        responseData
      )
    ) {
      return NextResponse.json(
        {
          message:
            "ساختار پاسخ وب‌سرویس ثبت‌نام معتبر نیست.",
        },
        {
          status: 502,
        }
      );
    }

    const result =
      responseData;


    /*
     * ذخیره Access Token در HttpOnly Cookie
     */
    const cookieStore =
      await cookies();

    cookieStore.set({
      name:
        "access-token",

      value:
        result.accessToken,

      httpOnly:
        true,

      secure:
        isHttpsRequest,

      sameSite:
        "lax",

      path:
        "/",

      /*
       * ۱۵ دقیقه
       */
      maxAge:
        15 * 60,
    });


    /*
     * ذخیره Refresh Token در HttpOnly Cookie
     */
    cookieStore.set({
      name:
        "refresh-token",

      value:
        result.refreshToken,

      httpOnly:
        true,

      secure:
        isHttpsRequest,

      sameSite:
        "strict",

      /*
       * Refresh Token فقط برای Routeهای Auth
       * ارسال می‌شود.
       */
      path:
        "/api/auth",

      /*
       * ۷ روز
       */
      maxAge:
        7 * 24 * 60 * 60,
    });

//اطلاعات امن شد
    const safeSession:
      SafeUserSession = {
        userName:
          clientData.userName.trim(),

        expiresAt:
          result.expiresAt,

        roles:
          result.roles ?? [
            "User",
          ],

        networkIds:
          result.networkIds ?? [],

        networkGroupId:
          result.networkGroupId ??
          null,
      };


    return NextResponse.json(
      safeSession,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Register route error:",
      error
    );

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          message:
            "ساختار اطلاعات ارسال‌شده معتبر نیست.",
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        message:
          "ارتباط با وب‌سرویس ثبت‌نام برقرار نشد.",
      },
      {
        status: 500,
      }
    );
  }
}


/*
 * تبدیل امن پاسخ Text به JSON
 */
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


/*
 * بررسی پاسخ موفق ثبت‌نام
 */
function isRegisterApiResponse(
  value: unknown
): value is RegisterApiResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.accessToken ===
      "string" &&
    value.accessToken.length > 0 &&
    typeof value.refreshToken ===
      "string" &&
    value.refreshToken.length > 0 &&
    typeof value.expiresAt ===
      "string" &&
    Array.isArray(
      value.roles
    ) &&
    value.roles.every(
      (role) =>
        typeof role === "string"
    ) &&
    Array.isArray(
      value.networkIds
    ) &&
    value.networkIds.every(
      (networkId) =>
        typeof networkId ===
        "number"
    ) &&
    (
      typeof value.networkGroupId ===
        "number" ||
      value.networkGroupId ===
        null
    )
  );
}


/*
 * تشخیص Object بودن مقدار
 */
function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}


/*
 * دریافت یک Property عمومی
 */
function getProperty(
  value: unknown,
  propertyName: string
): unknown {
  if (!isRecord(value)) {
    return undefined;
  }

  return value[propertyName];
}


/*
 * دریافت یک Property متنی
 */
function getStringProperty(
  value: unknown,
  propertyName: string
): string | undefined {
  const propertyValue =
    getProperty(
      value,
      propertyName
    );

  return typeof propertyValue ===
    "string"
    ? propertyValue
    : undefined;
}


/*
 * نمایش خطاهای Backend
 */
function getRegisterErrorMessage(
  status: number,
  error: unknown
): string {
  const errorCode =
    getStringProperty(
      error,
      "code"
    );

  if (
    errorCode ===
    "Auth.EmailExists"
  ) {
    return "این ایمیل قبلاً ثبت شده است.";
  }

  if (
    errorCode ===
    "Auth.UserNameExists"
  ) {
    return "این نام کاربری قبلاً ثبت شده است.";
  }

  if (
    errorCode ===
    "Auth.InvalidNetworkOrGroupId"
  ) {
    return "شناسه شبکه یا گروه برنامه‌ساز معتبر نیست.";
  }


  const description =
    getStringProperty(
      error,
      "description"
    );

  if (description) {
    return description;
  }


  const errors =
    getProperty(
      error,
      "errors"
    );

  if (typeof errors === "string") {
    return errors;
  }


  const validationMessage =
    getValidationErrorMessage(
      errors
    );

  if (validationMessage) {
    return validationMessage;
  }


  const title =
    getStringProperty(
      error,
      "title"
    );

  if (title) {
    return title;
  }


  if (
    status === 400
  ) {
    return "اطلاعات فرم معتبر نیست.";
  }

  if (
    status === 404
  ) {
    return "مسیر وب‌سرویس ثبت‌نام پیدا نشد.";
  }

  if (
    status === 409
  ) {
    return "اطلاعات واردشده قبلاً ثبت شده است.";
  }

  if (
    error === null
  ) {
    return "وب‌سرویس پاسخ JSON معتبر برنگرداند.";
  }

  return "ثبت‌نام انجام نشد.";
}


function getValidationErrorMessage(
  errors: unknown
): string | null {
  if (!isRecord(errors)) {
    return null;
  }

  const messages =
    Object.values(
      errors
    ).flatMap((value) => {
      if (typeof value === "string") {
        return [
          value,
        ];
      }

      if (Array.isArray(value)) {
        return value.filter(
          (
            message
          ): message is string =>
            typeof message ===
            "string"
        );
      }

      return [];
    });

  return messages.length > 0
    ? messages.join("، ")
    : null;
}