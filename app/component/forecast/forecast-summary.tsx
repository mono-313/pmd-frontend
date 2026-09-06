"use client";

import type {
  ForecastResponse,
} from "@/app/types/forecast";

interface ForecastSummaryProps {
  forecast:
    ForecastResponse;

  programName?: string;

  expertNames?: string[];

  onEditStep?: (
    step: number
  ) => void;

  readOnly?: boolean;
}

export default function ForecastSummary({
  forecast,
  programName,
  expertNames = [],
  onEditStep,
  readOnly = false,
}: ForecastSummaryProps) {
  return (
    <div>
      {/* جدول مشخصات برنامه */}

      {/* جدول محورهای موضوعی */}

      {/* جدول کارشناسان */}

      {!readOnly &&
        onEditStep && (
          <button
            type="button"
            onClick={() =>
              onEditStep(1)
            }
          >
            ویرایش
          </button>
        )}
    </div>
  );
}