"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import {
  ChevronDown,
} from "lucide-react";

import {
  NAVIGATION_ITEMS,
} from "@/app/lib/navigation";

import type {
  NavigationItem,
} from "@/app/lib/navigation";

import {
  hasPermission,
} from "@/app/lib/permissions";


interface StoredUserSession {
  roles?: unknown;

  /*
   * برای سازگاری با حالتی که نقش چرخه
   * جداگانه داخل نشست ذخیره شده باشد.
   */
  profileRole?: unknown;
  profile_role?: unknown;
}


export default function Sidebar() {
  const pathname =
    usePathname();

  const [
    roles,
    setRoles,
  ] = useState<string[]>([]);

  const [
    sessionLoaded,
    setSessionLoaded,
  ] = useState(false);

  const [
    openGroups,
    setOpenGroups,
  ] = useState<Record<string, boolean>>({});


  /*
   * خواندن نقش‌های کاربر از همان نشست
   * مورد استفاده در Header.
   */
  useEffect(() => {
    function loadSessionRoles() {
      setRoles(
        readStoredRoles()
      );

      setSessionLoaded(true);
    }

    loadSessionRoles();

    /*
     * اگر نشست در Tab دیگری تغییر کرد،
     * منو نیز به‌روزرسانی شود.
     */
    window.addEventListener(
      "storage",
      loadSessionRoles
    );

    return () => {
      window.removeEventListener(
        "storage",
        loadSessionRoles
      );
    };
  }, []);


  /*
   * تنها آیتم‌هایی باقی می‌مانند که
   * کاربر مجوز مشاهده آن‌ها را دارد.
   */
  const visibleNavigationItems =
    useMemo(
      () =>
        filterNavigationItems(
          NAVIGATION_ITEMS,
          roles
        ),
      [
        roles,
      ]
    );


  /*
   * مشخص کردن دقیق‌ترین لینک فعال.
   *
   * مثلاً در مسیر:
   * /program-profiles/review/123
   *
   * لینک review فعال می‌شود، نه لینک
   * عمومی /program-profiles.
   */
  const activeHref =
    useMemo(
      () =>
        findActiveHref(
          visibleNavigationItems,
          pathname
        ),
      [
        pathname,
        visibleNavigationItems,
      ]
    );


  /*
   * اگر کاربر وارد یکی از صفحات زیرمنو شد،
   * گروه مربوطه به‌صورت خودکار باز شود.
   */
  useEffect(() => {
    const activeGroup =
      visibleNavigationItems.find(
        (item) =>
          item.children?.some(
            (child) =>
              Boolean(
                child.href &&
                isPathMatch(
                  pathname,
                  child.href
                )
              )
          )
      );

    if (!activeGroup) {
      return;
    }

    setOpenGroups(
      (previous) => ({
        ...previous,

        [activeGroup.title]:
          true,
      })
    );
  }, [
    pathname,
    visibleNavigationItems,
  ]);


  function toggleGroup(
    title: string
  ) {
    setOpenGroups(
      (previous) => ({
        ...previous,

        [title]:
          !previous[title],
      })
    );
  }


  return (
    <aside
      className="
        min-h-screen
        w-64
        border-l
        border-gray-300
        bg-gray-200
        p-4
        shadow-lg
      "
      dir="rtl"
    >
      <nav
        aria-label="منوی اصلی"
      >
        <ul
          className="space-y-3"
        >
          {visibleNavigationItems.map(
            (item) => {
              if (
                item.children?.length
              ) {
                return (
                  <NavigationGroup
                    key={item.title}
                    item={item}
                    activeHref={
                      activeHref
                    }
                    isOpen={
                      Boolean(
                        openGroups[
                          item.title
                        ]
                      )
                    }
                    onToggle={() =>
                      toggleGroup(
                        item.title
                      )
                    }
                  />
                );
              }

              return (
                <li
                  key={item.title}
                >
                  <NavigationLink
                    item={item}
                    isActive={
                      item.href ===
                      activeHref
                    }
                  />
                </li>
              );
            }
          )}
        </ul>
      </nav>

      {/*
       * تا قبل از خواندن localStorage،
       * آیتم‌های عمومی نمایش داده می‌شوند.
       * این عنصر فقط برای حفظ وضعیت دسترس‌پذیری است.
       */}
      {!sessionLoaded && (
        <span
          className="sr-only"
        >
          در حال دریافت دسترسی‌های کاربر
        </span>
      )}
    </aside>
  );
}


interface NavigationGroupProps {
  item:
    NavigationItem;

  isOpen:
    boolean;

  activeHref:
    string | null;

  onToggle:
    () => void;
}


function NavigationGroup({
  item,
  isOpen,
  activeHref,
  onToggle,
}: NavigationGroupProps) {
  const isGroupActive =
    item.children?.some(
      (child) =>
        child.href === activeHref
    ) ?? false;

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`
          flex
          w-full
          items-center
          justify-between
          rounded-lg
          px-4
          py-3
          transition
          duration-300
          ${
            isGroupActive
              ? "bg-[#007fcf] text-white"
              : "hover:bg-[#007fcf] hover:text-white"
          }
        `}
      >
        <span>
          {item.title}
        </span>

        <ChevronDown
          size={18}
          className={`
            transition-transform
            duration-300
            ${
              isOpen
                ? "rotate-180"
                : ""
            }
          `}
        />
      </button>

      {isOpen && (
        <ul
          className="
            mt-2
            mr-5
            space-y-2
            border-r-2
            border-gray-300
            pr-3
          "
        >
          {item.children?.map(
            (child) => (
              <li
                key={child.title}
              >
                <NavigationLink
                  item={child}
                  isActive={
                    child.href ===
                    activeHref
                  }
                />
              </li>
            )
          )}
        </ul>
      )}
    </li>
  );
}


interface NavigationLinkProps {
  item:
    NavigationItem;

  isActive:
    boolean;
}


function NavigationLink({
  item,
  isActive,
}: NavigationLinkProps) {
  /*
   * صفحه هنوز پیاده‌سازی نشده است.
   * به‌جای href خالی، آیتم غیرفعال
   * نمایش داده می‌شود.
   */
  if (
    item.disabled ||
    !item.href
  ) {
    return (
      <span
        aria-disabled="true"
        title="این بخش هنوز پیاده‌سازی نشده است."
        className="
          block
          cursor-not-allowed
          rounded-md
          px-3
          py-2
          text-gray-400
          opacity-70
        "
      >
        {item.title}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={
        isActive
          ? "page"
          : undefined
      }
      className={`
        block
        rounded-md
        px-3
        py-2
        transition
        duration-300
        ${
          isActive
            ? "bg-[#007fcf] text-white"
            : "hover:bg-blue-100"
        }
      `}
    >
      {item.title}
    </Link>
  );
}


/*
 * فیلتر کردن منو طبق مجوزهای نقش کاربر.
 */
function filterNavigationItems(
  items:
    readonly NavigationItem[],

  roles:
    readonly string[]
): NavigationItem[] {
  const result:
    NavigationItem[] = [];

  for (
    const item of items
  ) {
    if (
      item.permission &&
      !hasPermission(
        roles,
        item.permission
      )
    ) {
      continue;
    }

    if (
      item.children
    ) {
      const visibleChildren =
        filterNavigationItems(
          item.children,
          roles
        );

      /*
       * گروه بدون زیرمنوی قابل نمایش
       * اصلاً در Sidebar نشان داده نمی‌شود.
       */
      if (
        visibleChildren.length === 0
      ) {
        continue;
      }

      result.push({
        ...item,
        children:
          visibleChildren,
      });

      continue;
    }

    result.push(item);
  }

  return result;
}


/*
 * خواندن امن نقش‌ها از localStorage.
 */
function readStoredRoles():
  string[] {
  try {
    const storedSession =
      window.localStorage.getItem(
        "pmd-user-session"
      );

    if (!storedSession) {
      return [];
    }

    const parsed =
      JSON.parse(
        storedSession
      ) as unknown;

    if (!isRecord(parsed)) {
      return [];
    }

    const parsedSession =
      parsed as StoredUserSession;

    const roles =
      Array.isArray(
        parsedSession.roles
      )
        ? parsedSession.roles.filter(
            (
              role
            ): role is string =>
              typeof role ===
                "string" &&
              role.trim().length > 0
          )
        : [];

    /*
     * اگر profile_role جداگانه ذخیره شده
     * باشد، به لیست نقش‌ها اضافه می‌شود.
     */
    const profileRole =
      getString(
        parsedSession.profileRole
      ) ??
      getString(
        parsedSession.profile_role
      );

    const allRoles =
      profileRole
        ? [
            ...roles,
            profileRole,
          ]
        : roles;

    return [
      ...new Set(
        allRoles.map(
          (role) =>
            role.trim()
        )
      ),
    ];
  } catch {
    return [];
  }
}


/*
 * پیدا کردن دقیق‌ترین مسیر فعال.
 */
function findActiveHref(
  items:
    readonly NavigationItem[],

  pathname:
    string
): string | null {
  const hrefs =
    collectNavigationHrefs(
      items
    );

  const matches =
    hrefs
      .filter(
        (href) =>
          isPathMatch(
            pathname,
            href
          )
      )
      .sort(
        (
          first,
          second
        ) =>
          second.length -
          first.length
      );

  return matches[0] ?? null;
}


function collectNavigationHrefs(
  items:
    readonly NavigationItem[]
): string[] {
  const hrefs:
    string[] = [];

  for (
    const item of items
  ) {
    if (
      item.href &&
      !item.disabled
    ) {
      hrefs.push(
        item.href
      );
    }

    if (
      item.children
    ) {
      hrefs.push(
        ...collectNavigationHrefs(
          item.children
        )
      );
    }
  }

  return hrefs;
}


function isPathMatch(
  pathname:
    string,

  href:
    string
): boolean {
  if (
    href === "/"
  ) {
    return pathname === "/";
  }

  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`
    )
  );
}


function getString(
  value:
    unknown
): string | null {
  return (
    typeof value ===
      "string" &&
    value.trim()
  )
    ? value.trim()
    : null;
}


function isRecord(
  value:
    unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}