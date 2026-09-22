import type {
  AppRole,
  Permission,
} from "@/app/types/authorization";

import {
  APP_ROLES,
  PERMISSIONS,
} from "@/app/types/authorization";


const ALL_PERMISSIONS:
  readonly Permission[] =
  Object.values(
    PERMISSIONS
  );


/*
 * ارتباط نقش‌های سامانه
 * با مجوزهای Frontend
 *
 * این بخش فقط نمایش منوها و
 * عملیات Frontend را کنترل می‌کند.
 *
 * بررسی نهایی دسترسی همچنان
 * برعهده Backend است.
 */
export const ROLE_PERMISSIONS:
  Record<
    AppRole,
    readonly Permission[]
  > = {
  /*
   * مدیر سامانه
   */
  [APP_ROLES.ADMIN]:
    ALL_PERMISSIONS,

  /*
   * مدیر شبکه
   *
   * طبق مستند فقط رکوردهای شبکه‌های
   * خودش را مشاهده می‌کند و نقش اجرایی
   * در گردش‌کار شناسنامه ندارد.
   */
  [APP_ROLES.NETWORK_MANAGER]: [
    PERMISSIONS.FORECAST_VIEW,
    PERMISSIONS.APPROVED_FORECAST_VIEW,
    PERMISSIONS.PROFILE_VIEW,
  ],

  /*
   * تهیه‌کننده
   */
  [APP_ROLES.PROVIDERS]: [
    PERMISSIONS.FORECAST_VIEW,
    PERMISSIONS.FORECAST_CREATE,
    PERMISSIONS.FORECAST_EDIT,
    PERMISSIONS.FORECAST_DELETE,
    PERMISSIONS.FORECAST_SUBMIT,

    PERMISSIONS.APPROVED_FORECAST_VIEW,

    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_ISSUE,
    PERMISSIONS.PROFILE_EDIT,
    PERMISSIONS.PROFILE_SUBMIT,
  ],

  /*
   * مدیر گروه برنامه‌ساز
   *
   * مرحله اول گردش‌کار شناسنامه
   */
  [APP_ROLES.NETWORK_GROUP_MANAGER]: [
    /*
     * پیش‌بینی
     */
    PERMISSIONS.FORECAST_VIEW,
    PERMISSIONS.FORECAST_REVIEW_LIST,
    PERMISSIONS.FORECAST_REVIEW_DETAILS,
    PERMISSIONS.FORECAST_APPROVE,
    PERMISSIONS.FORECAST_REJECT,
    PERMISSIONS.FORECAST_RETURN_FOR_EDIT,

    /*
     * شناسنامه
     */
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_REVIEW_LIST,
    PERMISSIONS.PROFILE_REVIEW_DETAILS,
    PERMISSIONS.PROFILE_APPROVE,
    PERMISSIONS.PROFILE_RETURN,
  ],

  /*
   * ناظر برنامه ضبطی
   */
  [APP_ROLES.SUPERVISOR]: [
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_REVIEW_LIST,
    PERMISSIONS.PROFILE_REVIEW_DETAILS,
    PERMISSIONS.PROFILE_APPROVE,

    PERMISSIONS
      .PROFILE_SUPERVISOR_COMMENT_VIEW,

    PERMISSIONS
      .PROFILE_SUPERVISOR_COMMENT_CREATE,
  ],

  /*
   * ناظر برنامه زنده
   */
  [APP_ROLES.LIVE_SUPERVISOR]: [
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_REVIEW_LIST,
    PERMISSIONS.PROFILE_REVIEW_DETAILS,
    PERMISSIONS.PROFILE_APPROVE,

    PERMISSIONS
      .PROFILE_SUPERVISOR_COMMENT_VIEW,

    PERMISSIONS
      .PROFILE_SUPERVISOR_COMMENT_CREATE,
  ],

  /*
   * مدیر پخش
   */
  [APP_ROLES.BROADCAST_MANAGER]: [
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_REVIEW_LIST,
    PERMISSIONS.PROFILE_REVIEW_DETAILS,
    PERMISSIONS.PROFILE_APPROVE,
    PERMISSIONS.PROFILE_RETURN,
  ],

  /*
   * مدیر طرح و برنامه‌ریزی
   */
  [APP_ROLES.PLAN_MANAGER]: [
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_REVIEW_LIST,
    PERMISSIONS.PROFILE_REVIEW_DETAILS,
    PERMISSIONS.PROFILE_APPROVE,
    PERMISSIONS.PROFILE_RETURN,
  ],
};


/*
 * تبدیل Roleهای Backend
 * به Roleهای شناخته‌شده Frontend
 */
export function normalizeRole(
  role: string
): AppRole | null {
  const normalizedRole =
    role
      .trim()
      .toLowerCase()
      .replace(
        /[\s_-]/g,
        ""
      );

  const roleMap:
    Record<
      string,
      AppRole
    > = {
    admin:
      APP_ROLES.ADMIN,

    networkmanager:
      APP_ROLES.NETWORK_MANAGER,

    networkgroupmanager:
      APP_ROLES.NETWORK_GROUP_MANAGER,

    networkgroup:
      APP_ROLES.NETWORK_GROUP_MANAGER,

    providers:
      APP_ROLES.PROVIDERS,

    provider:
      APP_ROLES.PROVIDERS,

    user:
      APP_ROLES.PROVIDERS,

    supervisor:
      APP_ROLES.SUPERVISOR,

    livesupervisor:
      APP_ROLES.LIVE_SUPERVISOR,

    broadcastmanager:
      APP_ROLES.BROADCAST_MANAGER,

    planmanager:
      APP_ROLES.PLAN_MANAGER,
  };

  return (
    roleMap[normalizedRole] ??
    null
  );
}


/*
 * بررسی داشتن یک مجوز
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