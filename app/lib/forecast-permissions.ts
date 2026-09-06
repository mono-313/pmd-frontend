import type {
  ForecastRowPermissions,
  ForecastStatus,
} from "@/app/types/forecast";


export function getForecastRowPermissions(
  rawStatus: unknown
): ForecastRowPermissions {
  const status =
    normalizeForecastStatus(
      rawStatus
    );

  const canEditOrSubmit =
    status === "Draft" ||
    status === "ReturnedForEdit";

  return {
    canView:
      true,

    canEdit:
      canEditOrSubmit,

    canDelete:
      true,

    canSubmit:
      canEditOrSubmit,
  };
}


export function normalizeForecastStatus(
  value: unknown
): ForecastStatus | null {
  /*
   * پشتیبانی از Enum عددی
   */
  if (
    value === 1 ||
    value === "1"
  ) {
    return "Draft";
  }

  if (
    value === 2 ||
    value === "2"
  ) {
    return "PendingReview";
  }

  if (
    value === 3 ||
    value === "3"
  ) {
    return "Approved";
  }

  if (
    value === 4 ||
    value === "4"
  ) {
    return "Rejected";
  }

  if (
    value === 5 ||
    value === "5"
  ) {
    return "ReturnedForEdit";
  }


  if (typeof value !== "string") {
    return null;
  }


  const normalized =
    value
      .trim()
      .toLowerCase()
      .replace(
        /[\s_-]/g,
        ""
      );


  switch (normalized) {
    case "draft":
      return "Draft";

    case "pendingreview":
      return "PendingReview";

    case "approved":
      return "Approved";

    case "rejected":
      return "Rejected";

    case "returnedforedit":
      return "ReturnedForEdit";

    default:
      console.warn(
        "Unknown forecast status:",
        value
      );

      return null;
  }
}