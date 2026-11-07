
"use client";

import { usePrograms } from "@/app/hooks/use-programs";

interface ProgramNameProps {
  planId: number | null | undefined;
  networkId: number | null | undefined;
  fallback?: string;
  className?: string;
}

export default function ProgramName({
  planId,
  networkId,
  fallback,
  className = "",
}: ProgramNameProps) {
  const {
    programs,
    isLoading,
    error,
  } = usePrograms(networkId);

  if (!planId || !networkId) {
    return (
      <span className={className}>
        {fallback ?? "—"}
      </span>
    );
  }

  if (isLoading) {
    return (
      <span className={className}>
        در حال دریافت...
      </span>
    );
  }

  const program = programs.find(
    (item) =>
      item.id === planId &&
      item.networkId === networkId
  );

  if (!program) {
    return (
      <span
        className={className}
        title={error || undefined}
      >
        {fallback ?? `برنامه شماره ${planId}`}
      </span>
    );
  }

  return (
    <span className={className}>
      {program.name}
    </span>
  );
}
