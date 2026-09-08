"use client";

import type {
  ReactNode,
} from "react";

import {
  useEffect,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useAuthorization,
} from "@/app/hooks/use-authorization";

import type {
  Permission,

} from "@/app/types/authorization"



interface RouteGuardProps {
  permission:
    Permission;

  children:
    ReactNode;
}


export default function RouteGuard({
  permission,
  children,
}: RouteGuardProps) {
  const router =
    useRouter();

  const {
    can,
    isLoading,
    isAuthenticated,
  } = useAuthorization();


  const isAllowed =
    can(permission);


  useEffect(() => {
    if (isLoading) {
      return;
    }


    if (!isAuthenticated) {
      router.replace(
        "/login"
      );

      return;
    }


    if (!isAllowed) {
      router.replace(
        "/unauthorized"
      );
    }
  }, [
    isLoading,
    isAuthenticated,
    isAllowed,
    router,
  ]);


  if (
    isLoading ||
    !isAuthenticated ||
    !isAllowed
  ) {
    return (
      <div
        className="
          flex min-h-64
          items-center
          justify-center
          text-gray-500
        "
      >
        در حال بررسی دسترسی...
      </div>
    );
  }


  return children;
}