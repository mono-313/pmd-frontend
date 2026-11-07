
"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type { Program } from "@/app/types/wizard";

import {
  getProgramsByNetwork,
} from "@/app/services/program-service";

interface UseProgramsResult {
  programs: Program[];
  isLoading: boolean;
  error: string;
  refresh: () => Promise<void>;
}

export function usePrograms(
  networkId: number | null | undefined
): UseProgramsResult {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPrograms = useCallback(async () => {
    if (!networkId || networkId <= 0) {
      setPrograms([]);
      setIsLoading(false);
      setError("");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await getProgramsByNetwork(networkId);
      setPrograms(result);
    } catch (loadError) {
      setPrograms([]);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "دریافت برنامه‌ها انجام نشد."
      );
    } finally {
      setIsLoading(false);
    }
  }, [networkId]);

  useEffect(() => {
    let active = true;

    if (!networkId || networkId <= 0) {
      setPrograms([]);
      setIsLoading(false);
      setError("");
      return;
    }

    setIsLoading(true);
    setError("");

    getProgramsByNetwork(networkId)
      .then((result) => {
        if (active) {
          setPrograms(result);
        }
      })
      .catch((loadError) => {
        if (active) {
          setPrograms([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "دریافت برنامه‌ها انجام نشد."
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [networkId]);

  return {
    programs,
    isLoading,
    error,
    refresh: loadPrograms,
  };
}
