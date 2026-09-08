
import type {
  AppRole,
  Permission,
} from "@/app/types/authorization"


import {
  APP_ROLES,
  PERMISSIONS,
} from "@/app/types/authorization";

const ALL_PERMISSIONS =
  Object.values(
    PERMISSIONS
  );


export const ROLE_PERMISSIONS:
  Record<
    AppRole,
    readonly Permission[]
  > = {
  [APP_ROLES.ADMIN]:
    ALL_PERMISSIONS,

  [APP_ROLES.PROVIDERS]: [
    PERMISSIONS.FORECAST_VIEW,
    PERMISSIONS.FORECAST_CREATE,
    PERMISSIONS.FORECAST_EDIT,
    PERMISSIONS.FORECAST_DELETE,
    PERMISSIONS.FORECAST_SUBMIT,
  ],

  [APP_ROLES.NETWORK_GROUP_MANAGER]: [
    PERMISSIONS.FORECAST_VIEW,
    PERMISSIONS.FORECAST_REVIEW_LIST,
    PERMISSIONS.FORECAST_REVIEW_DETAILS,
    PERMISSIONS.FORECAST_APPROVE,
    PERMISSIONS.FORECAST_REJECT,
    PERMISSIONS.FORECAST_RETURN_FOR_EDIT,
  ],

  [APP_ROLES.PLAN_MANAGER]: [
    PERMISSIONS.APPROVED_FORECAST_VIEW,
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_ISSUE,
    PERMISSIONS.PROFILE_EDIT,
  ],
};


/*
 * تبدیل Roleهای Backend
 * به Role شناخته‌شده Frontend
 */
export function normalizeRole(
  role: string
): AppRole | null {
  const normalizedRole =
    role.trim().toLowerCase();


  const roleMap:
    Record<
      string,
      AppRole
    > = {
    admin:
      APP_ROLES.ADMIN,

    networkgroupmanager:
      APP_ROLES
        .NETWORK_GROUP_MANAGER,

    networkgroup:
      APP_ROLES
        .NETWORK_GROUP_MANAGER,

    providers:
      APP_ROLES.PROVIDERS,

    provider:
      APP_ROLES.PROVIDERS,

    user:
      APP_ROLES.PROVIDERS,

    planmanager:
      APP_ROLES.PLAN_MANAGER,
  };


  return (
    roleMap[normalizedRole] ??
    null
  );
}


/*
 * بررسی یک مجوز
 */
export function hasPermission(
  roles:
    readonly string[] |
    null |
    undefined,

  permission:
    Permission
): boolean {
  if (!roles?.length) {
    return false;
  }


  return roles.some(
    (role) => {
      const normalizedRole =
        normalizeRole(
          role
        );


      if (!normalizedRole) {
        return false;
      }


      return ROLE_PERMISSIONS[
        normalizedRole
      ].includes(
        permission
      );
    }
  );
}


/*
 * بررسی داشتن حداقل یکی
 * از مجوزهای موردنظر
 */
export function hasAnyPermission(
  roles:
    readonly string[] |
    null |
    undefined,

  permissions:
    readonly Permission[]
): boolean {
  return permissions.some(
    (permission) =>
      hasPermission(
        roles,
        permission
      )
  );
}