
import type { Program } from "@/app/types/wizard";

interface ProgramsApiResponse {
  programs: Program[];
}

interface CacheEntry {
  programs: Program[];
  expiresAt: number;
}

const CACHE_DURATION = 5 * 60 * 1000;

const programCache = new Map<number, CacheEntry>();

const pendingRequests = new Map<
  number,
  Promise<Program[]>
>();

function normalizeDigits(value: string): string {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

  return value
    .replace(/[۰-۹]/g, (digit) =>
      String(persianDigits.indexOf(digit))
    )
    .replace(/[٠-٩]/g, (digit) =>
      String(arabicDigits.indexOf(digit))
    );
}

function normalizeProgramId(value: unknown): number | null {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(normalizeDigits(value.trim()))
        : Number.NaN;

  return Number.isSafeInteger(numericValue) &&
    numericValue > 0
    ? numericValue
    : null;
}

function isProgram(value: unknown): value is Program {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    normalizeProgramId(item.id) !== null &&
    typeof item.name === "string" &&
    typeof item.networkId === "number"
  );
}

function extractPrograms(value: unknown): Program[] {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    throw new Error("ساختار پاسخ برنامه‌ها معتبر نیست.");
  }

  const data = value as Record<string, unknown>;

  if (!Array.isArray(data.programs)) {
    throw new Error("فهرست برنامه‌ها در پاسخ API پیدا نشد.");
  }

  return data.programs.filter(isProgram);
}

export async function getProgramsByNetwork(
  networkId: number,
  options?: {
    forceRefresh?: boolean;
  }
): Promise<Program[]> {
  const normalizedNetworkId =
    normalizeProgramId(networkId);

  if (normalizedNetworkId === null) {
    throw new Error("شناسه شبکه معتبر نیست.");
  }

  const cached = programCache.get(normalizedNetworkId);

  if (
    !options?.forceRefresh &&
    cached &&
    cached.expiresAt > Date.now()
  ) {
    return cached.programs;
  }

  const pending = pendingRequests.get(normalizedNetworkId);

  if (pending && !options?.forceRefresh) {
    return pending;
  }

  const request = (async () => {
    const query = new URLSearchParams({
      networkId: String(normalizedNetworkId),
    });

    const response = await fetch(
      `/api/programs?${query.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const responseText = await response.text();

    let responseData: unknown;

    try {
      responseData = responseText
        ? JSON.parse(responseText)
        : null;
    } catch {
      throw new Error("پاسخ سرویس برنامه‌ها معتبر نیست.");
    }

    if (!response.ok) {
      const message =
        typeof responseData === "object" &&
        responseData !== null &&
        "message" in responseData &&
        typeof responseData.message === "string"
          ? responseData.message
          : `دریافت برنامه‌ها ناموفق بود. کد پاسخ: ${response.status}`;

      throw new Error(message);
    }

    const programs = extractPrograms(responseData)
      .filter(
        (program) =>
          program.networkId === normalizedNetworkId
      );

    programCache.set(normalizedNetworkId, {
      programs,
      expiresAt: Date.now() + CACHE_DURATION,
    });

    return programs;
  })();

  pendingRequests.set(normalizedNetworkId, request);

  try {
    return await request;
  } finally {
    if (
      pendingRequests.get(normalizedNetworkId) === request
    ) {
      pendingRequests.delete(normalizedNetworkId);
    }
  }
}

export function invalidateProgramCache(
  networkId?: number
): void {
  if (networkId === undefined) {
    programCache.clear();
    return;
  }

  const normalizedNetworkId =
    normalizeProgramId(networkId);

  if (normalizedNetworkId !== null) {
    programCache.delete(normalizedNetworkId);
  }
}
