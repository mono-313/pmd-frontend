export const APP_ROLES = {
  ADMIN:
    "Admin",

  NETWORK_GROUP_MANAGER:
    "NetworkGroupManager",

  PROVIDERS:
    "Providers",

  PLAN_MANAGER:
    "PlanManager",
} as const;


export type AppRole =
  typeof APP_ROLES[
    keyof typeof APP_ROLES
  ];


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
   * موضوعات تأییدشده
   */
  APPROVED_FORECAST_VIEW:
    "approvedForecast.view",

  /*
   * شناسنامه
   */
  PROFILE_VIEW:
    "profile.view",

  PROFILE_ISSUE:
    "profile.issue",

  PROFILE_EDIT:
    "profile.edit",

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