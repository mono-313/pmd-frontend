"use client";

import type {
  ReactNode,
} from "react";

import {
  useAuthorization,
} from "@/app/hooks/use-authorization";

import type {
  Permission,
}  from "@/app/types/authorization"

interface PermissionGuardProps {
  permission:
    Permission;

  children:
    ReactNode;

  fallback?:
    ReactNode;
}


export default function PermissionGuard({
  permission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const {
    can,
    isLoading,
  } = useAuthorization();


  if (isLoading) {
    return null;
  }


  if (!can(permission)) {
    return fallback;
  }


  return children;
}