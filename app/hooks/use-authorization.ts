"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getUserSession,
} from "@/app/lib/storage";

import {
  hasPermission,
} from "@/app/lib/permissions";

import type {
  Permission,
} from "@/app/types/authorization"


interface AuthorizationState {
  roles: string[];

  isLoading: boolean;

  isAuthenticated: boolean;

  can:
    (
      permission: Permission
    ) => boolean;
}


export function useAuthorization():
  AuthorizationState {
  const [
    roles,
    setRoles,
  ] = useState<string[]>([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isAuthenticated,
    setIsAuthenticated,
  ] = useState(false);


  useEffect(() => {
    const session =
      getUserSession();


    if (!session) {
      setRoles([]);
      setIsAuthenticated(false);
      setIsLoading(false);

      return;
    }


    setRoles(
      Array.isArray(
        session.roles
      )
        ? session.roles
        : []
    );

    setIsAuthenticated(true);
    setIsLoading(false);
  }, []);


  function can(
    permission: Permission
  ): boolean {
    return hasPermission(
      roles,
      permission
    );
  }


  return {
    roles,

    isLoading,

    isAuthenticated,

    can,
  };
}