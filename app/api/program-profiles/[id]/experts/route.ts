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


interface ExpertRequest {
  expertId: string;
  topicAxisId: string;
  duration: string;
  attendanceType: number;
  hasPayment: boolean;
}


interface UpdateExpertsRequest {
  profileId: string;
  experts: ExpertRequest[];
}


/*
 * PUT /api/program-profiles/{profileId}/experts
 *
 * جایگزینی کامل فهرست کارشناسان شناسنامه.
 */
export async function PUT(
  request: Request,
  context: RouteContext
) {
  const requestId =
    globalThis.crypto.randomUUID();

  const { id } =
    await context.params;

  const profileId =
    id.trim();

  if (!isGuid(profileId)) {
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

  const requestData =
    await readRequestBody(
      request
    );

  if (!requestData) {
    return NextResponse.json(
      {
        message:
          "ساختار اطلاعات کارشناسان معتبر نیست.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    requestData.profileId !==
    profileId
  ) {
    return NextResponse.json(
      {
        message:
          "شناسه شناسنامه در مسیر و بدنه درخواست یکسان نیست.",
      },
      {
        status: 400,
      }
    );
  }

  const validationMessage =
    validateExperts(
      requestData.experts
    );

  if (validationMessage) {
    return NextResponse.json(
      {
        message:
          validationMessage,
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
          "نشست کاربری معتبر نیست. دوباره وارد سامانه شوید.",
      },
      {
        status: 401,
      }
    );
  }

  const backendUrl =
    joinUrl(
      API_CONFIG.baseUrl,
      `/program-profiles/${encodeURIComponent(
        profileId
      )}/experts`
    );

  
  console.log("EXPERTS profileId:", profileId);
  console.log("EXPERTS backendUrl:", backendUrl);
  console.log("EXPERTS body:", JSON.stringify
    (requestData, null, 2));
  console.log("EXPERTS token exists:", !!accessToken);

  console.info(
    "PROGRAM PROFILE EXPERTS ROUTE REQUEST:",
    {
      requestId,
      profileId,
      backendUrl,
      expertsCount:
        requestData.experts.length,
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
          cache: "no-store",
        }
      );

      
      console.log("EXPERTS backend status:",
         backendResponse.status);
    const responseText =
      await backendResponse.text();
      console.log("EXPERTS backend response:", responseText);

    
    console.info(
      "PROGRAM PROFILE EXPERTS ROUTE RESPONSE:",
      {
        requestId,
        profileId,
        status:
          backendResponse.status,
        response:
          responseText.slice(
            0,
            1000
          ),
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
      "PROGRAM PROFILE EXPERTS ROUTE ERROR:",
      {
        requestId,
        profileId,
        error,
      }
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


async function readRequestBody(
  request: Request
): Promise<UpdateExpertsRequest | null> {
  try {
    const value =
      await request.json() as
        unknown;

    if (
      !isRecord(value) ||
      typeof value.profileId !==
        "string" ||
      !Array.isArray(
        value.experts
      )
    ) {
      return null;
    }

    const profileId =
      value.profileId.trim();

    if (
      !isGuid(profileId) ||
      !value.experts.every(
        isExpertRequest
      )
    ) {
      return null;
    }

    return {
      profileId,
      experts:
        value.experts.map(
          (expert) => ({
            expertId:
              expert.expertId.trim(),
            topicAxisId:
              expert.topicAxisId.trim(),
            duration:
              expert.duration.trim(),
            attendanceType:
              expert.attendanceType,
            hasPayment:
              expert.hasPayment,
          })
        ),
    };
  } catch {
    return null;
  }
}


function validateExperts(
  experts: ExpertRequest[]
): string | null {
  for (
    let index = 0;
    index < experts.length;
    index += 1
  ) {
    const expert =
      experts[index];

    if (!isGuid(expert.expertId)) {
      return `شناسه کارشناس ردیف ${index + 1} معتبر نیست.`;
    }

    if (!isGuid(expert.topicAxisId)) {
      return `شناسه محور موضوعی ردیف ${index + 1} معتبر نیست.`;
    }

    if (!isTimeSpan(expert.duration)) {
      return `مدت حضور کارشناس ردیف ${index + 1} معتبر نیست.`;
    }

    if (
      ![1, 2, 3, 4].includes(
        expert.attendanceType
      )
    ) {
      return `نحوه حضور کارشناس ردیف ${index + 1} معتبر نیست.`;
    }
  }

  return null;
}


function isExpertRequest(
  value: unknown
): value is ExpertRequest {
  return (
    isRecord(value) &&
    typeof value.expertId ===
      "string" &&
    typeof value.topicAxisId ===
      "string" &&
    typeof value.duration ===
      "string" &&
    typeof value.attendanceType ===
      "number" &&
    typeof value.hasPayment ===
      "boolean"
  );
}


function isGuid(
  value: string
): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}


function isTimeSpan(
  value: string
): boolean {
  const match =
    /^(\d{2}):(\d{2}):(\d{2})$/.exec(
      value
    );

  if (!match) {
    return false;
  }

  const minutes =
    Number(match[2]);
  const seconds =
    Number(match[3]);

  return (
    minutes >= 0 &&
    minutes <= 59 &&
    seconds >= 0 &&
    seconds <= 59
  );
}


function joinUrl(
  baseUrl: string,
  path: string
): string {
  return (
    baseUrl.replace(
      /\/+$/,
      ""
    ) +
    "/" +
    path.replace(
      /^\/+/,
      ""
    )
  );
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
