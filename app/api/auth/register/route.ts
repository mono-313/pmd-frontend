import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  API_BASE_URL,
  API_ENDPOINTS,
} from "@/app/lib/api-config";

import type {
  RegisterApiResponse,
  RegisterRequest,
  SafeUserSession,
} from "@/app/types/auth";


const ALLOWED_ROLES = new Set([
  "User",
  "Providers",
  "NetworkGroupManager",
  "NetworkManager",
  "Supervisor",
  "LiveSupervisor",
  "BroadcastManager",
  "PlanManager",
  "Admin",
]);


export async function POST(
  request: Request
) {
  try {
    const requestData =
      await readRequestBody(request);

    const validation =
      validateRegisterRequest(
        requestData
      );

    if (!validation.success) {
      return NextResponse.json(
        {
          message: validation.message,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * roles و networkIds آرایه هستند.
     * networkGroupId طبق قرارداد Backend تنها یک مقدار است.
     */
    const backendBody:
      RegisterRequest =
      validation.data;

    const backendResponse =
      await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.auth.register}`,
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
          cache: "no-store",
        }
      );

    const responseData =
      await readBackendResponse(
        backendResponse
      );

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message:
            getRegisterErrorMessage(
              backendResponse.status,
              responseData
            ),
          code:
            getStringField(
              responseData,
              "code"
            ),
          errors:
            isRecord(responseData)
              ? responseData.errors
              : undefined,
        },
        {
          status:
            backendResponse.status,
        }
      );
    }

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

    await setAuthenticationCookies(
      request,
      responseData
    );

    const safeSession:
      SafeUserSession = {
      userName:
        backendBody.userName,
      expiresAt:
        responseData.expiresAt,
      roles:
        normalizeRoles(
          responseData.roles
        ).length > 0
          ? normalizeRoles(
              responseData.roles
            )
          : backendBody.roles,
      networkIds:
        normalizePositiveIntegerArray(
          responseData.networkIds
        ),
      networkGroupId:
        readNullablePositiveInteger(
          responseData.networkGroupId
        ),
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


async function readRequestBody(
  request: Request
): Promise<unknown> {
  try {
    return await request.json() as unknown;
  } catch {
    return null;
  }
}


function validateRegisterRequest(
  value: unknown
):
  | {
      success: true;
      data: RegisterRequest;
    }
  | {
      success: false;
      message: string;
    } {
  if (!isRecord(value)) {
    return {
      success: false,
      message:
        "بدنه درخواست ثبت‌نام معتبر نیست.",
    };
  }

  const fullName =
    readRequiredString(
      value.fullName
    );
  const userName =
    readRequiredString(
      value.userName
    );
  const email =
    readRequiredString(
      value.email
    );
  const password =
    typeof value.password ===
      "string"
      ? value.password
      : "";

  if (!fullName) {
    return {
      success: false,
      message:
        "نام و نام خانوادگی الزامی است.",
    };
  }

  if (!userName) {
    return {
      success: false,
      message:
        "نام کاربری الزامی است.",
    };
  }

  if (
    !/^[a-zA-Z0-9._-]+$/.test(
      userName
    )
  ) {
    return {
      success: false,
      message:
        "نام کاربری فقط می‌تواند شامل حروف انگلیسی، عدد، نقطه، خط تیره و زیرخط باشد.",
    };
  }

  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    )
  ) {
    return {
      success: false,
      message:
        "ایمیل واردشده معتبر نیست.",
    };
  }

  if (password.length < 8) {
    return {
      success: false,
      message:
        "رمز عبور باید حداقل هشت کاراکتر باشد.",
    };
  }

  const roles =
    value.roles == null
      ? ["User"]
      : normalizeRoles(
          value.roles
        );

  if (
    roles.length === 0 ||
    roles.some(
      (role) =>
        !ALLOWED_ROLES.has(role)
    )
  ) {
    return {
      success: false,
      message:
        "نقش انتخاب‌شده معتبر نیست.",
    };
  }

  if (
    value.networkIds != null &&
    !Array.isArray(
      value.networkIds
    )
  ) {
    return {
      success: false,
      message:
        "شبکه‌ها باید به‌صورت آرایه ارسال شوند.",
    };
  }

  const networkIds =
    normalizePositiveIntegerArray(
      value.networkIds
    );

  if (
    Array.isArray(value.networkIds) &&
    networkIds.length !==
      value.networkIds.length
  ) {
    return {
      success: false,
      message:
        "یکی از شبکه‌های انتخاب‌شده معتبر نیست.",
    };
  }

  const networkGroupId =
    readNullablePositiveInteger(
      value.networkGroupId
    );

  if (
    value.networkGroupId != null &&
    networkGroupId === null
  ) {
    return {
      success: false,
      message:
        "گروه شبکه انتخاب‌شده معتبر نیست.",
    };
  }

  return {
    success: true,
    data: {
      fullName,
      userName,
      email,
      password,
      roles:
        Array.from(
          new Set(roles)
        ),
      networkIds,
      networkGroupId,
    },
  };
}


async function readBackendResponse(
  response: Response
): Promise<unknown> {
  const responseText =
    await response.text();

  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(
      responseText
    ) as unknown;
  } catch {
    return {
      description:
        responseText.trim(),
    };
  }
}


async function setAuthenticationCookies(
  request: Request,
  response: RegisterApiResponse
) {
  const cookieStore =
    await cookies();
  const isHttpsRequest =
    new URL(request.url).protocol ===
    "https:";

  cookieStore.set({
    name: "access-token",
    value: response.accessToken,
    httpOnly: true,
    secure: isHttpsRequest,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });

  cookieStore.set({
    name: "refresh-token",
    value: response.refreshToken,
    httpOnly: true,
    secure: isHttpsRequest,
    sameSite: "strict",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60,
  });
}


function isRegisterApiResponse(
  value: unknown
): value is RegisterApiResponse {
  return (
    isRecord(value) &&
    typeof value.accessToken ===
      "string" &&
    Boolean(value.accessToken) &&
    typeof value.refreshToken ===
      "string" &&
    Boolean(value.refreshToken) &&
    typeof value.expiresAt ===
      "string" &&
    Boolean(value.expiresAt)
  );
}


function getRegisterErrorMessage(
  status: number,
  value: unknown
): string {
  const code =
    getStringField(
      value,
      "code"
    );

  if (code === "Auth.EmailExists") {
    return "این ایمیل قبلاً ثبت شده است.";
  }

  if (
    code ===
    "Auth.UserNameExists"
  ) {
    return "این نام کاربری قبلاً ثبت شده است.";
  }

  if (
    code ===
    "Auth.InvalidNetworkOrGroupId"
  ) {
    return "شبکه یا گروه شبکه انتخاب‌شده معتبر نیست.";
  }

  const backendMessage =
    getFirstStringField(
      value,
      [
        "message",
        "description",
        "detail",
        "title",
      ]
    );

  if (backendMessage) {
    return backendMessage;
  }

  if (status === 400) {
    return "اطلاعات فرم معتبر نیست.";
  }

  return "ثبت‌نام انجام نشد.";
}


function normalizeRoles(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (role): role is string =>
        typeof role === "string" &&
        Boolean(role.trim())
    )
    .map((role) => role.trim());
}


function normalizePositiveIntegerArray(
  value: unknown
): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.filter(
        (item): item is number =>
          typeof item === "number" &&
          Number.isInteger(item) &&
          item > 0
      )
    )
  );
}


function readNullablePositiveInteger(
  value: unknown
): number | null {
  if (value == null) {
    return null;
  }

  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
  )
    ? value
    : null;
}


function readRequiredString(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}


function getStringField(
  value: unknown,
  field: string
): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const fieldValue = value[field];

  return typeof fieldValue ===
    "string"
    ? fieldValue
    : undefined;
}


function getFirstStringField(
  value: unknown,
  fields: string[]
): string | null {
  for (const field of fields) {
    const fieldValue =
      getStringField(
        value,
        field
      );

    if (fieldValue?.trim()) {
      return fieldValue.trim();
    }
  }

  return null;
}


function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}
