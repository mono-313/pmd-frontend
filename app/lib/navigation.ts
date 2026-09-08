
import type {
  Permission,
  } from "@/app/types/authorization"


  import{
  PERMISSIONS,
} from "@/app/types/authorization";

  

export interface NavigationItem {
  title: string;

  href: string;

  permission:
    Permission;
}


export const NAVIGATION_ITEMS:
  NavigationItem[] = [
  {
    title:
      "ثبت پیش‌بینی جدید",

    href:
      "/wizard",

    permission:
      PERMISSIONS.FORECAST_CREATE,
  },

  {
    title:
      "لیست پیش‌بینی‌ها",

    href:
      "/forecasts",

    permission:
      PERMISSIONS.FORECAST_VIEW,
  },

  {
    title:
      "کارتابل بررسی",

    href:
      "/forecasts/review",

    permission:
      PERMISSIONS
        .FORECAST_REVIEW_LIST,
  },

  {
    title:
      "موضوعات تأییدشده",

    href:
      "/approved-forecasts",

    permission:
      PERMISSIONS
        .APPROVED_FORECAST_VIEW,
  },

  {
    title:
      "لیست شناسنامه‌ها",

    href:
      "/program-profiles",

    permission:
      PERMISSIONS.PROFILE_VIEW,
  },
];