import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_CONFIG, API_ENDPOINTS } from "@/app/lib/api-config";
import type {
  CreateExpertRequest,
  EducationLevel,
  ExpertResponse,
  ExpertsPaginationMetadata,
} from "@/app/types/expert";

export async function GET(request: Request) {
  try {
    const token = await getToken();
    if (!token) return jsonMessage("نشست کاربری معتبر نیست.", 401);

    const requestUrl = new URL(request.url);
    const backendUrl = new URL(
      `${API_CONFIG.baseUrl}${API_ENDPOINTS.experts.list}`
    );

    requestUrl.searchParams.forEach((value, key) => {
      backendUrl.searchParams.set(key, value);
    });

    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const text = await response.text();
    const data = parseJson(text);

    if (!response.ok) {
      return backendErrorResponse(
        response.status,
        data,
        "دریافت کارشناسان انجام نشد."
      );
    }

    if (!Array.isArray(data)) {
      return jsonMessage("ساختار پاسخ کارشناسان معتبر نیست.", 502);
    }

    const experts =
  data.filter(
    isExpertResponse
  );

    if (experts.length !== data.length) {
      return jsonMessage("ساختار یکی از کارشناسان دریافتی معتبر نیست.", 502);
    }

    const pagination = parsePaginationHeader(
      response.headers.get("Pagination")
    );

    return NextResponse.json(
      { experts, pagination },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get experts route error:", error);
    return jsonMessage("ارتباط با وب‌سرویس کارشناسان برقرار نشد.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const token = await getToken();
    if (!token) return jsonMessage("نشست کاربری معتبر نیست.", 401);

    const requestData = (await request.json()) as unknown;

    if (!isCreateExpertRequest(requestData)) {
      return jsonMessage("ساختار اطلاعات کارشناس معتبر نیست.", 400);
    }

    /*
     * دقیقاً مطابق مستند Backend؛ fullName یا networkId ارسال نمی‌شود.
     */
    const backendBody: CreateExpertRequest = {
      firstName: requestData.firstName.trim(),
      lastName: requestData.lastName.trim(),
      specialty: requestData.specialty.trim(),
      education: requestData.education,
      workplace: requestData.workplace.trim(),
      mobilePhone: requestData.mobilePhone.trim(),
      nationalCode: requestData.nationalCode.trim(),
      ...(requestData.workPhone?.trim()
        ? { workPhone: requestData.workPhone.trim() }
        : {}),
      networkIds: requestData.networkIds,
    };

    const response = await fetch(
      `${API_CONFIG.baseUrl}${API_ENDPOINTS.experts.create}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(backendBody),
        cache: "no-store",
      }
    );

    const text = await response.text();
    const data = parseJson(text);

    if (!response.ok) {
      console.error("Create expert backend error:", {
        status: response.status,
        body: backendBody,
        response: data ?? text,
      });

      return backendErrorResponse(
        response.status,
        data,
        response.status === 409
          ? "کارشناسی با این کد ملی قبلاً ثبت شده است."
          : "ثبت کارشناس انجام نشد."
      );
    }

    const createdExpert =
      getExpertFromResponse(data) ??
      buildExpertFromSuccessfulCreate(
        data,
        response.headers.get("Location"),
        backendBody
      ) ??
      (await getCreatedExpertFromLocation(
        response.headers.get("Location"),
        token
      )) ??
      (await findCreatedExpertByNationalCode(
        backendBody.nationalCode,
        token
      ));

    if (!createdExpert) {
      console.error("Expert created but response could not be read:", {
        status: response.status,
        location: response.headers.get("Location"),
        response: data ?? text,
      });

      return jsonMessage(
        "کارشناس ثبت شد، اما اطلاعات کارشناس جدید از پاسخ سرور دریافت نشد.",
        502
      );
    }

    return NextResponse.json(
  {
    message:
      "کارشناس با موفقیت ثبت شد.",

    /*
     * همان ExpertResponse دریافتی
     * بدون افزودن fullName
     */
    expert:
      createdExpert,
  },
  {
    status: 201,
  }
);
  } catch (error) {
    console.error("Create expert route error:", error);

    if (error instanceof SyntaxError) {
      return jsonMessage("بدنه درخواست JSON معتبر نیست.", 400);
    }

    return jsonMessage("ارتباط با وب‌سرویس ثبت کارشناس برقرار نشد.", 500);
  }
}

async function getToken(): Promise<string | undefined> {
  return (await cookies()).get("access-token")?.value;
}

function isCreateExpertRequest(value: unknown): value is CreateExpertRequest {
  if (!isRecord(value)) return false;

  return (
    isNonEmptyString(value.firstName) &&
    isNonEmptyString(value.lastName) &&
    isNonEmptyString(value.specialty) &&
    isEducationLevel(value.education) &&
    isNonEmptyString(value.workplace) &&
    isNonEmptyString(value.mobilePhone) &&
    isNonEmptyString(value.nationalCode) &&
    (value.workPhone === undefined || typeof value.workPhone === "string") &&
    Array.isArray(value.networkIds) &&
    value.networkIds.length > 0 &&
    value.networkIds.every(
      (networkId) =>
        typeof networkId === "number" &&
        Number.isInteger(networkId) &&
        networkId > 0
    )
  );
}

function isExpertResponse(
  value: unknown
): value is ExpertResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id ===
      "string" &&

    typeof value.firstName ===
      "string" &&

    typeof value.lastName ===
      "string" &&

    typeof value.specialty ===
      "string" &&

    isEducationLevel(
      value.education
    ) &&

    typeof value.workplace ===
      "string" &&

    typeof value.mobilePhone ===
      "string" &&

    typeof value.nationalCode ===
      "string" &&

    (
      typeof value.workPhone ===
        "string" ||
      value.workPhone === null
    ) &&

    typeof value.isActive ===
      "boolean" &&

    Array.isArray(
      value.networkIds
    ) &&

    value.networkIds.every(
      (networkId) =>
        typeof networkId ===
        "number"
    ) &&

    typeof value.createdAt ===
      "string"
  );
}

/*
 * بعضی نسخه‌های Backend پاسخ را مستقیم و بعضی نسخه‌ها
 * داخل data یا expert برمی‌گردانند.
 */
function getExpertFromResponse(
  value: unknown
): ExpertResponse | null {
  /*
   * پاسخ مستقیم Backend
   */
  if (isExpertResponse(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return null;
  }

  /*
   * پشتیبانی از پاسخ‌های Wrapper
   */
  if (
    isExpertResponse(
      value.expert
    )
  ) {
    return value.expert;
  }

  if (
    isExpertResponse(
      value.data
    )
  ) {
    return value.data;
  }

  if (
    isExpertResponse(
      value.result
    )
  ) {
    return value.result;
  }

  return null;
}

/*
 * ثبت موفق نباید به‌خاطر ناقص بودن Response DTO خطا شود.
 * شناسه از پاسخ/Location و سایر مقادیر از Request موفق گرفته می‌شوند.
 */
function buildExpertFromSuccessfulCreate(
  responseData: unknown,
  location: string | null,
  requestData: CreateExpertRequest
): ExpertResponse | null {
  const responseObject = unwrapResponseObject(responseData);

  const responseId =
    typeof responseData === "string"
      ? responseData
      : responseObject && typeof responseObject.id === "string"
      ? responseObject.id
      : null;

  const locationId = getIdFromLocation(location);
  const id = responseId ?? locationId;

  if (!id) return null;

  return {
    id,
    firstName: requestData.firstName,
    lastName: requestData.lastName,
    specialty: requestData.specialty,
    education: requestData.education,
    workplace: requestData.workplace,
    mobilePhone: requestData.mobilePhone,
    nationalCode: requestData.nationalCode,
    workPhone: requestData.workPhone ?? null,
    isActive:
      responseObject && typeof responseObject.isActive === "boolean"
        ? responseObject.isActive
        : true,
    networkIds: requestData.networkIds,
    createdAt:
      responseObject && typeof responseObject.createdAt === "string"
        ? responseObject.createdAt
        : new Date().toISOString(),
  };
}

function unwrapResponseObject(
  value: unknown
): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  if (isRecord(value.expert)) return value.expert;
  if (isRecord(value.data)) return value.data;
  if (isRecord(value.result)) return value.result;
  return value;
}

function getIdFromLocation(location: string | null): string | null {
  if (!location) return null;

  try {
    const url = new URL(location, `${API_CONFIG.baseUrl}/`);
    const segments = url.pathname.split("/").filter(Boolean);
    return segments.at(-1) ?? null;
  } catch {
    return null;
  }
}

/*
 * اگر POST فقط 201 و هدر Location برگرداند، رکورد تازه
 * از همان آدرس دریافت می‌شود تا انتخاب خودکار همچنان کار کند.
 */
async function getCreatedExpertFromLocation(
  location: string | null,
  token: string
): Promise<ExpertResponse | null> {
  if (!location) return null;

  try {
    const locationUrl = new URL(
      location,
      `${API_CONFIG.baseUrl}/`
    );

    const response = await fetch(locationUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) return null;

    return getExpertFromResponse(
      parseJson(await response.text())
    );
  } catch (error) {
    console.error("Read created expert from Location error:", error);
    return null;
  }
}

/* آخرین fallback برای Backendهایی که در پاسخ POST بدنه/Location قابل استفاده ندارند. */
async function findCreatedExpertByNationalCode(
  nationalCode: string,
  token: string
): Promise<ExpertResponse | null> {
  try {
    const url = new URL(
      `${API_CONFIG.baseUrl}${API_ENDPOINTS.experts.list}`
    );
    url.searchParams.set("searchTerm", nationalCode);
    url.searchParams.set("pageNumber", "1");
    url.searchParams.set("pageSize", "20");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = parseJson(await response.text());
    if (!Array.isArray(data)) return null;

    return (
      data
        .filter(isExpertResponse)
        .find((expert) => expert.nationalCode === nationalCode) ??
      null
    );
  } catch (error) {
    console.error("Find created expert error:", error);
    return null;
  }
}


function isEducationLevel(value: unknown): value is EducationLevel {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parsePaginationHeader(
  headerValue: string | null
): ExpertsPaginationMetadata | null {
  if (!headerValue) return null;

  const value = parseJson(headerValue);
  if (!isRecord(value)) return null;

  const pagination: ExpertsPaginationMetadata = {
    totalCount: Number(value.totalCount),
    pageNumber: Number(value.pageNumber),
    pageSize: Number(value.pageSize),
    totalPages: Number(value.totalPages),
    hasNext: value.hasNext === true,
    hasPrevious: value.hasPrevious === true,
  };

  return Object.values(pagination).some(
    (item) => typeof item === "number" && Number.isNaN(item)
  )
    ? null
    : pagination;
}

function parseJson(text: string): unknown | null {
  if (!text.trim()) return null;
  try { return JSON.parse(text) as unknown; } catch { return null; }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getErrorMessage(value: unknown): string | null {
  if (!isRecord(value)) return null;

  if (value.code === "Expert.NationalCodeExists") {
    return "کارشناسی با این کد ملی قبلاً ثبت شده است.";
  }
  if (typeof value.message === "string") return value.message;
  if (typeof value.description === "string") return value.description;

  const validationMessages = getValidationMessages(value.errors);
  if (validationMessages.length > 0) return validationMessages.join("، ");

  if (typeof value.title === "string") return value.title;
  return null;
}

function getValidationMessages(errors: unknown): string[] {
  if (!isRecord(errors)) return [];
  return Object.values(errors).flatMap((item) => {
    if (typeof item === "string") return [item];
    if (Array.isArray(item)) {
      return item.filter((message): message is string => typeof message === "string");
    }
    return [];
  });
}

function backendErrorResponse(status: number, data: unknown, fallback: string) {
  return NextResponse.json(
    { message: getErrorMessage(data) ?? fallback },
    { status }
  );
}

function jsonMessage(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}
