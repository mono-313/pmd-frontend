import {
  NextResponse,
} from "next/server";

import {
  cookies,
} from "next/headers";

import {
  API_CONFIG,
  API_ENDPOINTS,
  BASE_INFO_API_CONFIG,
} from "@/app/lib/api-config";

import type {
  Program,
} from "@/app/types/wizard";


interface UserAssignments {
  networkIds: number[];

  networkGroupId:
    number | null;
}


interface BaseInfoItem {
  Value: string;

  Text: string;

  Selected?: boolean;

  Disabled?: boolean;

  Group?: unknown;
}


interface BaseInfoResponse {
  IsSuccess: boolean;

  Message:
    string | null;

  Data:
    BaseInfoItem[];
}


export async function GET(request: Request) {
  try {
    const cookieStore =
      await cookies();

    const accessToken =
      cookieStore.get(
        "access-token"
      )?.value;


    if (!accessToken) {
      return jsonError(
        "نشست کاربری معتبر نیست.",
        401
      );
    }


    if (
      !BASE_INFO_API_CONFIG
        .apiKey
    ) {
      return jsonError(
        "کلید وب‌سرویس اطلاعات پایه تنظیم نشده است.",
        500
      );
    }


    const currentUserUrl =
      `${API_CONFIG.baseUrl}` +
      `${API_ENDPOINTS.auth.currentUser}`;


    const currentUserResponse =
      await fetch(
        currentUserUrl,
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


    const currentUserText =
      await currentUserResponse.text();

    const currentUserData =
      parseJsonResponse(
        currentUserText
      );


    if (!currentUserResponse.ok) {
      return NextResponse.json(
        {
          message:
            getErrorMessage(
              currentUserData
            ) ??
            "دریافت اطلاعات کاربر انجام نشد.",
        },
        {
          status:
            currentUserResponse.status,
        }
      );
    }


if (!isRecord(currentUserData)) {
  console.error(
    "Invalid current user response:",
    currentUserData
  );

  return jsonError(
    "ساختار اطلاعات کاربر معتبر نیست.",
    502
  );
}

const isAdmin =
  Array.isArray(currentUserData.roles) &&
  currentUserData.roles.some((role) => role === "Admin");

const isProvider =
  Array.isArray(currentUserData.roles) &&
  currentUserData.roles.some((role) => role === "Providers");

const assignments = getUserAssignmentsFromToken(accessToken);
const requestedNetwork = new URL(request.url).searchParams.get("networkId");
let selectedNetworkId: number | null = null;

if (requestedNetwork !== null) {
  const normalizedNetwork = normalizeDigits(requestedNetwork.trim());
  if (!/^[0-9]+$/.test(normalizedNetwork) ||
      !Number.isSafeInteger(Number(normalizedNetwork)) ||
      Number(normalizedNetwork) <= 0) {
    return jsonError("شناسه شبکه معتبر نیست.", 400);
  }
  selectedNetworkId = Number(normalizedNetwork);
}

if (!isAdmin && !assignments) {
  return jsonError("اطلاعات شبکه کاربر از توکن قابل استخراج نیست.", 403);
}

const assignedNetworks = [...new Set(assignments?.networkIds ?? [])];
if (!isAdmin && selectedNetworkId !== null &&
    !assignedNetworks.includes(selectedNetworkId)) {
  return jsonError("دسترسی به برنامه‌های این شبکه مجاز نیست.", 403);
}

const networkIds = selectedNetworkId !== null
  ? [selectedNetworkId]
  : assignedNetworks;

if (!networkIds.length) {
  return jsonError(
    isAdmin
      ? "برای دریافت نام برنامه، networkId شناسنامه یا پیش‌بینی را ارسال کنید."
      : "هیچ شبکه‌ای برای این کاربر تعریف نشده است.",
    isAdmin ? 400 : 403
  );
}
//این بخش بریا بعد که وب سرویس تهیه کننده و مشاهده گروه درست شد
// ادمین به گروه حساب خودش محدود نیست؛ فیلتر گروه سایر کاربران حفظ می‌شود.
// const networkGroupId =
//   isAdmin || isProvider
//     ? null
//     : assignments?.networkGroupId ?? null;
// اطمینان از اینکه تهیه‌کننده گروه برنامه‌ساز دارد
if (
  isProvider &&
  !assignments?.networkGroupId
) {
  return jsonError(
    "گروه برنامه‌ساز برای تهیه‌کننده در توکن تعریف نشده است.",
    403
  );
}

// ادمین محدودیت گروه ندارد؛
// سایر کاربران، از جمله تهیه‌کننده، فقط برنامه‌های گروه خود را می‌بینند.
const networkGroupId =
  isAdmin
    ? null
    : assignments?.networkGroupId ?? null;
/*
 * دریافت برنامه‌های شبکه‌های کاربر
 */
const programGroups:
  Program[][] =
  await Promise.all(
    networkIds.map(
      (
        networkId:
          number
      ) =>
        loadNetworkPrograms(
          networkId,
          networkGroupId
        )
    )
  );

    /*
     * حذف برنامه‌های تکراری بر اساس id
     */
    const programMap =
      new Map<
        number,
        Program
      >();


    for (
      const programGroup of
      programGroups
    ) {
    
     for (
        const program of
        programGroup
      ) {
        if (
          !programMap.has(
            program.id
          )
        ) {
          programMap.set(
            program.id,
            program
          );
        }
      }
    }


    /*
     * مرتب‌سازی نام برنامه‌ها به زبان فارسی
     */
    const programs = [
      ...programMap.values(),
    ].sort(
      (
        firstProgram,
        secondProgram
      ) =>
        firstProgram.name.localeCompare(
          secondProgram.name,
          "fa",
          {
            sensitivity:
              "base",
          }
        )
    );


    return NextResponse.json(
      {
        programs,
      },
      {
        status:
          200,
      }
    );
  } catch (error) {
    console.error(
      "Programs route error:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "ارتباط با وب‌سرویس برنامه‌ها برقرار نشد.",
      500
    );
  }
}


async function loadNetworkPrograms(
  networkId: number,
  networkGroupId:
    number | null
): Promise<Program[]> {
  /*
   * آدرس اولیه:
   * /plans
   */
  const backendUrl =
    new URL(
      `${BASE_INFO_API_CONFIG.baseUrl}` +
        `${BASE_INFO_API_CONFIG.endpoints.plans}`
    );

  /*
   * networkId همیشه ارسال می‌شود.
   */
  backendUrl.searchParams.set(
    "networkId",
    String(networkId)
  );

  if (
    typeof networkGroupId ===
      "number" &&
    Number.isInteger(
      networkGroupId
    ) &&
    networkGroupId > 0
  ) {
    backendUrl.searchParams.set(
      "networkGroupId",
      String(networkGroupId)
    );
  }

  console.log(
    "Base-info programs request:",
    backendUrl.toString()
  );

  const response =
    await fetch(
      backendUrl.toString(),
      {
        method: "GET",

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",

          "X-API-KEY":
            BASE_INFO_API_CONFIG
              .apiKey,
        },

        cache:
          "no-store",
      }
    );

  const responseText =
    await response.text();

  const responseData =
    parseJsonResponse(
      responseText
    );

  if (!response.ok) {
    console.error(
      "Base-info plans error:",
      {
        networkId,

        networkGroupId,

        backendUrl:
          backendUrl.toString(),

        status:
          response.status,

        responseText,
      }
    );

    throw new Error(
      getErrorMessage(
        responseData
      ) ??
        `دریافت برنامه‌های شبکه ${networkId} انجام نشد.`
    );
  }

  if (
    !isBaseInfoResponse(
      responseData
    )
  ) {
    console.error(
      "Invalid base-info plans response:",
      {
        networkId,

        networkGroupId,

        responseData,
      }
    );

    throw new Error(
      `ساختار پاسخ برنامه‌های شبکه ${networkId} معتبر نیست.`
    );
  }

  if (!responseData.IsSuccess) {
    throw new Error(
      responseData.Message ??
        `دریافت برنامه‌های شبکه ${networkId} ناموفق بود.`
    );
  }

  return responseData.Data
    .map(
      (
        item
      ): Program | null => {
        const programId =
          Number(
            normalizeDigits(
              item.Value
            )
          );

        const programName =
          item.Text.trim();

        if (
          !Number.isInteger(
            programId
          ) ||
          programId <= 0 ||
          !programName
        ) {
          return null;
        }

        return {
          id:
            programId,

          name:
            programName,

          /*
           * برای ثبت نهایی Forecast
           * شبکه برنامه را نگه می‌داریم.
           */
          networkId,
        };
      }
    )
    .filter(
      (
        program
      ): program is Program =>
        program !== null
    );
}


function isBaseInfoResponse(
  value: unknown
): value is BaseInfoResponse {
  return (
    isRecord(value) &&

    typeof value.IsSuccess ===
      "boolean" &&

    (
      typeof value.Message ===
        "string" ||
      value.Message === null
    ) &&

    Array.isArray(
      value.Data
    ) &&

    value.Data.every(
      isBaseInfoItem
    )
  );
}


function isBaseInfoItem(
  value: unknown
): value is BaseInfoItem {
  return (
    isRecord(value) &&

    typeof value.Value ===
      "string" &&

    typeof value.Text ===
      "string"
  );
}


function normalizeDigits(
  value: string
): string {
  const persianDigits =
    "۰۱۲۳۴۵۶۷۸۹";

  const arabicDigits =
    "٠١٢٣٤٥٦٧٨٩";

  return value
    .replace(
      /[۰-۹]/g,
      (digit) =>
        String(
          persianDigits.indexOf(
            digit
          )
        )
    )
    .replace(
      /[٠-٩]/g,
      (digit) =>
        String(
          arabicDigits.indexOf(
            digit
          )
        )
    );
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


function getErrorMessage(
  value: unknown
): string | null {
  if (!isRecord(value)) {
    return null;
  }

  /*
   * PMD
   */
  if (
    typeof value.message ===
    "string"
  ) {
    return value.message;
  }

  if (
    typeof value.description ===
    "string"
  ) {
    return value.description;
  }

  /*
   * اطلاعات پایه
   */
  if (
    typeof value.Message ===
    "string"
  ) {
    return value.Message;
  }

  return null;
}


function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}


function jsonError(
  message: string,
  status: number
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



/*
 * استخراج شبکه‌ها و گروه برنامه‌ساز
 * از Access Token
 */
function getUserAssignmentsFromToken(
  accessToken: string
): UserAssignments | null {
  const payload =
    decodeJwtPayload(
      accessToken
    );

  if (!payload) {
    return null;
  }
  
console.log(
  "JWT claim keys:",
  Object.keys(
    payload
  )
);

  /*
   * طبق مستند Backend:
   *
   * network_id
   * network_group_id
   */
  const networkClaim =
    payload.network_id;

  const networkGroupClaim =
    payload.network_group_id;


  const networkIds =
    readNumericClaimValues(
      networkClaim
    );


  const networkGroupValues =
    readNumericClaimValues(
      networkGroupClaim
    );


  return {
    networkIds,

    networkGroupId:
      networkGroupValues[0] ??
      null,
  };
}


function decodeJwtPayload(
  accessToken: string
): Record<string, unknown> | null {
  try {
    const tokenParts =
      accessToken.split(".");

    if (
      tokenParts.length !== 3
    ) {
      return null;
    }


    const encodedPayload =
      tokenParts[1]
        .replace(
          /-/g,
          "+"
        )
        .replace(
          /_/g,
          "/"
        );


    const paddingLength =
      (
        4 -
        (
          encodedPayload.length %
          4
        )
      ) % 4;


    const paddedPayload =
      encodedPayload +
      "=".repeat(
        paddingLength
      );


    const decodedText =
      Buffer.from(
        paddedPayload,
        "base64"
      ).toString(
        "utf8"
      );


    const decodedValue =
      JSON.parse(
        decodedText
      ) as unknown;


    return isRecord(
      decodedValue
    )
      ? decodedValue
      : null;
  } catch (error) {
    console.error(
      "JWT payload parse error:",
      error
    );

    return null;
  }
}

function readNumericClaimValues(
  value: unknown
): number[] {
  const rawValues =
    Array.isArray(value)
      ? value
      : value === undefined ||
        value === null
        ? []
        : [value];


  return rawValues
    .map((rawValue) => {
      if (
        typeof rawValue ===
          "number"
      ) {
        return rawValue;
      }

      if (
        typeof rawValue ===
          "string"
      ) {
        return Number(
          normalizeDigits(
            rawValue
          )
        );
      }

      return Number.NaN;
    })
    .filter(
      (
        numberValue
      ): numberValue is number =>
        Number.isInteger(
          numberValue
        ) &&
        numberValue > 0
    );
}