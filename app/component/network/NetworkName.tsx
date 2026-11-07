"use client";

import { useEffect, useState } from "react";

import { getNetworkName } from "@/app/services/network-info-service";

interface NetworkNameProps {
  networkId: number | null;
  fallback?: string;
  className?: string;
}

export default function NetworkName({
  networkId,
  fallback = "—",
  className = "",
}: NetworkNameProps) {
  const [name, setName] = useState(fallback);

  useEffect(() => {
    let cancelled = false;

    setName(fallback);

    if (
      networkId === null ||
      !Number.isFinite(networkId) ||
      networkId <= 0
    ) {
      return;
    }

    getNetworkName(networkId).then((result) => {
      if (cancelled) return;

      setName(result || fallback);
    });

    return () => {
      cancelled = true;
    };
  }, [networkId, fallback]);

  return (
    <span className={className}>
      {name}
    </span>
  );
}