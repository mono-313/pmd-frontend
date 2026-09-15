"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  getUserSession,
} from "@/app/lib/storage";

export default function SessionGuard({
  children,
}: {
  children:
    React.ReactNode;
}) {
  const router =
    useRouter();

  const [
    isChecked,
    setIsChecked,
  ] = useState(false);

  useEffect(() => {
    const session =
      getUserSession();

    const expiresAtTime =
      session?.expiresAt
        ? new Date(
            session.expiresAt
          ).getTime()
        : Number.NaN;

    const hasValidSession =
      Boolean(session) &&
      Number.isFinite(
        expiresAtTime
      ) &&
      expiresAtTime >
        Date.now();

    if (!hasValidSession) {
      router.replace(
        "/login"
      );

      return;
    }

    setIsChecked(true);
  }, [router]);

  if (!isChecked) {
    return null;
  }

  return <>{children}</>;
}