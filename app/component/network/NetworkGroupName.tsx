"use client";

import { useEffect, useState } from "react";

import {
  getNetworkGroupName,
} from "@/app/services/network-info-service";

interface NetworkGroupNameProps {
  networkGroupId: number | null;
  networkId?: number | null;
  fallback?: string;
  className?: string;
}

export default function NetworkGroupName({
  networkGroupId,
  networkId = null,
  fallback = "—",
  className = "",
}: NetworkGroupNameProps) {
  const [name, setName] = useState(fallback);

  useEffect(() => {
    let cancelled = false;

    setName(fallback);

    if (
      networkGroupId === null ||
      !Number.isFinite(networkGroupId) ||
      networkGroupId <= 0
    ) {
      return;
    }

    getNetworkGroupName(
      networkGroupId,
      networkId
    ).then((result) => {
      if (cancelled) return;

      setName(result || fallback);
    });

    return () => {
      cancelled = true;
    };
  }, [
    networkGroupId,
    networkId,
    fallback,
  ]);

  return (
    <span className={className}>
      {name}
    </span>
  );
}