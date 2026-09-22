/*
 * نقش‌های شناخته‌شده سامانه
 */
export const APP_ROLES = {
  ADMIN:
    "Admin",

  NETWORK_MANAGER:
    "NetworkManager",

  NETWORK_GROUP_MANAGER:
    "NetworkGroupManager",

  PROVIDERS:
    "Providers",

  SUPERVISOR:
    "Supervisor",

  LIVE_SUPERVISOR:
    "LiveSupervisor",

  BROADCAST_MANAGER:
    "BroadcastManager",

  PLAN_MANAGER:
    "PlanManager",
} as const;


export type AppRole =
  typeof APP_ROLES[
    keyof typeof APP_ROLES
  ];


/*
 * مجوزهای قابل استفاده در Frontend
 */
export const PERMISSIONS = {
  /*
   * پیش‌بینی
   */
  FORECAST_VIEW:
    "forecast.view",

  FORECAST_CREATE:
    "forecast.create",

  FORECAST_EDIT:
    "forecast.edit",

  FORECAST_DELETE:
    "forecast.delete",

  FORECAST_SUBMIT:
    "forecast.submit",

  /*
   * کارتابل بررسی پیش‌بینی
   */
  FORECAST_REVIEW_LIST:
    "forecast.review.list",

  FORECAST_REVIEW_DETAILS:
    "forecast.review.details",

  FORECAST_APPROVE:
    "forecast.approve",

  FORECAST_REJECT:
    "forecast.reject",

  FORECAST_RETURN_FOR_EDIT:
    "forecast.returnForEdit",

  /*
   * پیش‌بینی‌های تأییدشده
   */
  APPROVED_FORECAST_VIEW:
    "approvedForecast.view",

  /*
   * شناسنامه برنامه
   */
  PROFILE_VIEW:
    "profile.view",

  PROFILE_ISSUE:
    "profile.issue",

  PROFILE_EDIT:
    "profile.edit",

  PROFILE_SUBMIT:
    "profile.submit",

  /*
   * کارتابل گردش‌کار شناسنامه
   */
  PROFILE_REVIEW_LIST:
    "profile.review.list",

  PROFILE_REVIEW_DETAILS:
    "profile.review.details",

  PROFILE_APPROVE:
    "profile.approve",

  PROFILE_RETURN:
    "profile.return",

  /*
   * نظرات ناظر
   */
  PROFILE_SUPERVISOR_COMMENT_VIEW:
    "profile.supervisorComment.view",

  PROFILE_SUPERVISOR_COMMENT_CREATE:
    "profile.supervisorComment.create",

  /*
   * مدیریت سامانه
   */
  USER_MANAGE:
    "user.manage",
} as const;


export type Permission =
  typeof PERMISSIONS[
    keyof typeof PERMISSIONS
  ];