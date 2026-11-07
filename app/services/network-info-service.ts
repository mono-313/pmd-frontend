type EntityKind = "network" | "networkGroup";

interface CacheItem {
  name: string;
  expiresAt: number;
}

const CACHE_DURATION = 5 * 60 * 1000;

const cache = new Map<string, CacheItem>();

const pendingRequests = new Map<
  string,
  Promise<string | null>
>();

const NETWORK_ID_KEYS = [
  "id",
  "Id",
  "ID",
  "networkId",
  "NetworkId",
  "NetworkID",
  "value",
  "Value",
];

const NETWORK_GROUP_ID_KEYS = [
  "id",
  "Id",
  "ID",
  "networkGroupId",
  "NetworkGroupId",
  "NetworkGroupID",
  "groupId",
  "GroupId",
  "GroupID",
  "value",
  "Value",
];

const NETWORK_NAME_KEYS = [
  "name",
  "Name",
  "networkName",
  "NetworkName",
  "networkTitle",
  "NetworkTitle",
  "title",
  "Title",
  "text",
  "Text",
];

const NETWORK_GROUP_NAME_KEYS = [
  "name",
  "Name",
  "networkGroupName",
  "NetworkGroupName",
  "groupName",
  "GroupName",
  "networkGroupTitle",
  "NetworkGroupTitle",
  "title",
  "Title",
  "text",
  "Text",
];

export async function getNetworkName(
  networkId: number
): Promise<string | null> {
  return getEntityName("network", networkId);
}

export async function getNetworkGroupName(
  networkGroupId: number,
  networkId?: number | null
): Promise<string | null> {
  return getEntityName(
    "networkGroup",
    networkGroupId,
    networkId
  );
}

async function getEntityName(
  kind: EntityKind,
  id: number,
  networkId?: number | null
): Promise<string | null> {
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }

  const cacheKey =
    kind === "network"
      ? `network:${id}`
      : `networkGroup:${networkId ?? "all"}:${id}`;

  const cached = cache.get(cacheKey);

  if (
    cached &&
    cached.expiresAt > Date.now()
  ) {
    return cached.name;
  }

  const pending = pendingRequests.get(cacheKey);

  if (pending) {
    return pending;
  }

  const request = fetchEntityName(
    kind,
    id,
    networkId
  );

  pendingRequests.set(cacheKey, request);

  try {
    const name = await request;

    if (name) {
      cache.set(cacheKey, {
        name,
        expiresAt: Date.now() + CACHE_DURATION,
      });
    }

    return name;
  } finally {
    pendingRequests.delete(cacheKey);
  }
}


async function fetchEntityName(
  kind: EntityKind,
  id: number,
  networkId?: number | null
): Promise<string | null> {
  const urls =
    kind === "network"
      ? ["/api/networks"]
      : networkId && networkId > 0
        ? [
            `/api/networkgroups/${encodeURIComponent(
              String(networkId)
            )}`,
          ]
        : [];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        continue;
      }

      const data: unknown = await response.json();

      const name = findEntityName(
        data,
        id,
        kind === "network"
          ? NETWORK_ID_KEYS
          : NETWORK_GROUP_ID_KEYS,
        kind === "network"
          ? NETWORK_NAME_KEYS
          : NETWORK_GROUP_NAME_KEYS
      );

      if (name) {
        return name;
      }
    } catch {
      // در صورت خطای دریافت اطلاعات، نتیجه‌ای برگردانده نمی‌شود.
    }
  }

  return null;
}


function findEntityName(
  value: unknown,
  targetId: number,
  idKeys: string[],
  nameKeys: string[]
): string | null {
  const queue: unknown[] = [value];
  const visited = new Set<object>();

  while (queue.length > 0) {
    const current = queue.shift();

    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    if (!isRecord(current)) {
      continue;
    }

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    const currentId = idKeys
      .map((key) => readNumber(current[key]))
      .find((item) => item !== null);

    if (currentId === targetId) {
      for (const key of nameKeys) {
        const name = readString(current[key]);

        if (name) {
          return name;
        }
      }
    }

    queue.push(...Object.values(current));
  }

  return null;
}

function readNumber(value: unknown): number | null {
  const normalized =
    typeof value === "string"
      ? normalizeDigits(value.trim())
      : value;

  const number =
    typeof normalized === "number"
      ? normalized
      : typeof normalized === "string" && normalized
        ? Number(normalized)
        : Number.NaN;

  return Number.isFinite(number)
    ? number
    : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
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

export function invalidateNetworkInfoCache(): void {
  cache.clear();
  pendingRequests.clear();
}