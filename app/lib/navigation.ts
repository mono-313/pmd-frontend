import type {
  Permission,
} from "@/app/types/authorization";

import {
  PERMISSIONS,
} from "@/app/types/authorization";

export interface NavigationItem {
  title: string;

  /*
   * اگر آیتم صفحه مستقلی داشته باشد.
   */
  href?: string;

  /*
   * اگر آیتم زیرمنو داشته باشد.
   */
  children?: readonly NavigationItem[];

  /*
   * مجوز لازم برای نمایش آیتم.
   *
   * اگر تعریف نشده باشد، آیتم برای
   * همه کاربران واردشده قابل نمایش است.
   */
  permission?: Permission;

  /*
   * برای منوهایی که هنوز صفحه آن‌ها
   * پیاده‌سازی نشده است.
   */
  disabled?: boolean;
}

export const NAVIGATION_ITEMS:
  readonly NavigationItem[] = [
  {
    title: "صفحه اصلی",
    href: "/",
  },

  {
    title: "پیش‌بینی موضوعات",

    children: [
      {
        title: "درج پیش‌بینی جدید",
        href: "/wizard",
        permission:
          PERMISSIONS.FORECAST_CREATE,
      },

      {
        title: "لیست پیش‌بینی‌ها",
        href: "/forecasts",
        permission:
          PERMISSIONS.FORECAST_VIEW,
      },

      {
        title: "کارتابل ارجاعات موضوعی",
        href: "/forecasts/review",
        permission:
          PERMISSIONS.FORECAST_REVIEW_LIST,
      },

      {
        title: "موضوعات تأییدشده",
        href: "/approved-forecasts",
        permission:
          PERMISSIONS.APPROVED_FORECAST_VIEW,
      },
    ],
  },

  {
    title: "شناسنامه برنامه",

    children: [
      {
        title: "صدور شناسنامه",
        href: "/program-profiles/issue",
        permission:
          PERMISSIONS.PROFILE_VIEW,
      },

      {
        title: "لیست شناسنامه‌ها",
        href: "/program-profiles",
        permission:
          PERMISSIONS.PROFILE_VIEW,
      },

      {
        title: "کارتابل ارجاعات شناسنامه",
        href: "/program-profiles/review",
        permission:
          PERMISSIONS.PROFILE_REVIEW_LIST,
      },

      {
        title: "شناسنامه‌های تأییدشده",
        href:
          "/program-profiles/approved",

        permission:
          PERMISSIONS.PROFILE_VIEW,
      },
    ],
  },

  {
    title: "گزارشات",
    children: [
      {
        title: "گزارش پیش‌بینی‌ها",
        href: "/reports/forecasts",
        permission: PERMISSIONS.FORECAST_VIEW,
          
      },
      {
        title: "گزارش شناسنامه‌ها",
        href: "/reports/program-profile",
        permission: PERMISSIONS.PROFILE_VIEW,
        // disabled: true,
      },
      {
        title: "گزارش موضوعی شناسنامه",
        href: "/reports/topics",
        permission: PERMISSIONS.PROFILE_VIEW,
      },
      {
        title: "گزارش عوامل شناسنامه",
        href: "/reports/crew",
        permission: PERMISSIONS.PROFILE_VIEW,
        disabled: true,
      },
    ],
  },

  {
    title: "راهنما",
    disabled: true,
  },
];