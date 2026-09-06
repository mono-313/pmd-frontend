"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Bell,
  ChevronDown,
  LogOut,
  Network,
  UserRound,
  UsersRound,
} from "lucide-react";


/*
 * اطلاعات امن نشست کاربر
 * ذخیره‌شده در Local Storage
 */
interface UserSession {
  userName: string;

  expiresAt: string;

  roles: string[];

  networkIds: number[];

  networkGroupId:
    | number
    | null;
}


/*
 * وضعیت‌های موردنیاز برای اعلان
 */
type NotificationStatus =
  | "PendingReview"
  | "ReturnedForEdit";


export default function Header() {
  const router =
    useRouter();


  /*
   * وضعیت بازبودن منوی پروفایل
   */
  const [
    openProfile,
    setOpenProfile,
  ] = useState(false);


  /*
   * اطلاعات کاربر
   */
  const [
    userInfo,
    setUserInfo,
  ] =
    useState<
      UserSession | null
    >(null);


  /*
   * وضعیت بارگذاری اطلاعات نشست
   */
  const [
    isLoading,
    setIsLoading,
  ] = useState(true);


  /*
   * تعداد اعلان‌های نیازمند اقدام
   */
  const [
    notificationCount,
    setNotificationCount,
  ] = useState(0);


  /*
   * وضعیت بارگذاری اعلان
   */
  const [
    isNotificationLoading,
    setIsNotificationLoading,
  ] = useState(false);


  /*
   * خطای دریافت اعلان
   */
  const [
    notificationError,
    setNotificationError,
  ] = useState("");


  /*
   * دریافت اطلاعات نشست از Local Storage
   */
  useEffect(() => {
    const storedUser =
      localStorage.getItem(
        "pmd-user-session"
      );


    if (!storedUser) {
      setIsLoading(false);

      return;
    }


    try {
      const parsedUser =
        JSON.parse(
          storedUser
        ) as UserSession;


      /*
       * بررسی ساختار اولیه نشست
       */
      if (
        !isValidUserSession(
          parsedUser
        )
      ) {
        throw new Error(
          "ساختار اطلاعات نشست معتبر نیست."
        );
      }


      /*
       * بررسی زمان انقضای نشست
       */
      const expirationDate =
        new Date(
          parsedUser.expiresAt
        );


      const isExpired =
        Number.isNaN(
          expirationDate.getTime()
        ) ||
        expirationDate.getTime() <=
          Date.now();


      if (isExpired) {
        localStorage.removeItem(
          "pmd-user-session"
        );


        setUserInfo(null);

        router.replace(
          "/login"
        );

        return;
      }


      setUserInfo(
        parsedUser
      );
    } catch (error) {
      console.error(
        "Local Storage parse error:",
        error
      );


      localStorage.removeItem(
        "pmd-user-session"
      );


      setUserInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, [router]);


  /*
   * دریافت تعداد موارد نیازمند اقدام
   *
   * ProgramGroup:
   * موضوعات PendingReview
   *
   * User:
   * موضوعات ReturnedForEdit
   */
  useEffect(() => {
    if (!userInfo) {
      setNotificationCount(
        0
      );

      return;
    }


    const requiredStatus =
      getRequiredNotificationStatus(
        userInfo.roles
      );


    /*
     * نقش فعلی اعلان مخصوصی ندارد.
     */
    if (!requiredStatus) {
      setNotificationCount(
        0
      );

      setNotificationError(
        ""
      );

      return;
    }


    let isActive =
      true;



      const notificationStatus:
  NotificationStatus =
    requiredStatus;

    async function loadNotificationCount() {
      try {
        setIsNotificationLoading(
          true
        );


        setNotificationError(
          ""
        );


      const query =
            new URLSearchParams();

          query.set(
            "status",
            notificationStatus
          );

          query.set(
            "pageNumber",
            "1"
          );

          query.set(
            "pageSize",
            "1"
          );


        const response =
          await fetch(
            `/api/forecasts?${query.toString()}`,
            {
              method:
                "GET",

              cache:
                "no-store",
            }
          );


        const responseText =
          await response.text();


        const responseData =
          parseJsonResponse(
            responseText
          );


        if (!response.ok) {
          throw new Error(
            getResponseMessage(
              responseData
            ) ??
              "دریافت اعلان‌ها انجام نشد."
          );
        }


            const count =
        getNotificationCount(
          responseData,
          notificationStatus
        );

        if (isActive) {
          setNotificationCount(
            count
          );
        }
      } catch (error) {
        console.error(
          "Notification count error:",
          error
        );


        if (isActive) {
          setNotificationCount(
            0
          );


          setNotificationError(
            error instanceof Error
              ? error.message
              : "دریافت اعلان‌ها انجام نشد."
          );
        }
      } finally {
        if (isActive) {
          setIsNotificationLoading(
            false
          );
        }
      }
    }


    /*
     * دریافت اولیه اعلان
     */
    void loadNotificationCount();


    /*
     * دریافت مجدد هر ۶۰ ثانیه
     */
    const intervalId =
      window.setInterval(
        () => {
          void loadNotificationCount();
        },
        60_000
      );


    /*
     * دریافت مجدد هنگام بازگشت
     * کاربر به پنجره مرورگر
     */
    function handleWindowFocus() {
      void loadNotificationCount();
    }


    window.addEventListener(
      "focus",
      handleWindowFocus
    );


    return () => {
      isActive = false;


      window.clearInterval(
        intervalId
      );


      window.removeEventListener(
        "focus",
        handleWindowFocus
      );
    };
  }, [userInfo]);


  /*
   * خروج از حساب کاربری
   */
  async function handleLogout() {
    try {
      /*
       * Route داخلی باید:
       *
       * ۱. Refresh Token را Revoke کند.
       * ۲. Cookieهای HttpOnly را حذف کند.
       */
      await fetch(
        "/api/auth/logout",
        {
          method:
            "POST",
        }
      );
    } catch (error) {
      console.error(
        "Logout request failed:",
        error
      );
    } finally {
      localStorage.removeItem(
        "pmd-user-session"
      );


      setUserInfo(null);

      setNotificationCount(
        0
      );

      setOpenProfile(
        false
      );


      router.replace(
        "/login"
      );

      router.refresh();
    }
  }


  /*
   * انتقال کاربر به صفحه
   * مرتبط با اعلان
   */
  function handleNotificationClick() {
    if (!userInfo) {
      return;
    }


    /*
     * مدیر گروه به صفحه بررسی می‌رود.
     */
    if (
      userInfo.roles.includes(
        "ProgramGroup"
      )
    ) {
      router.push(
        "/forecasts/review"
      );

      return;
    }


    /*
     * ثبت‌کننده به فهرست موضوعات خود می‌رود.
     */
    if (
      userInfo.roles.includes(
        "User"
      )
    ) {
      router.push(
        "/forecasts"
      );
    }
  }


  /*
   * نقش اصلی کاربر
   */
  const primaryRole =
    userInfo?.roles?.[0];


  /*
   * عنوان فارسی نقش اصلی
   */
  const roleTitle =
    getRoleTitle(
      primaryRole
    );


  /*
   * حرف اول نام کاربری
   */
  const avatarLetter =
    userInfo?.userName
      ?.charAt(0)
      .toUpperCase() ||
    "?";


  /*
   * عنوان Tooltip زنگ اعلان
   */
  const notificationTitle =
    notificationError
      ? notificationError
      : notificationCount > 0
        ? `${notificationCount} مورد نیازمند اقدام`
        : "مورد جدیدی وجود ندارد";


  return (
    <header
      className="
        h-20
        w-full
        bg-[#007fcf]
        text-white
        shadow-md
      "
    >
      <div
        className="
          flex
          h-full
          items-center
          justify-between
          px-6
          lg:px-12
        "
      >
        {/*
         * نام سایت
         */}
        <div className="text-2xl font-bold">
          موج پلاس +
        </div>


        {/*
         * اعلان و پروفایل
         */}
        <div className="flex items-center gap-3">
          {/*
           * زنگ اعلان
           */}
          <div className="relative">
            <button
              type="button"
              onClick={
                handleNotificationClick
              }
              disabled={
                isLoading ||
                !userInfo
              }
              className="
                relative
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                transition
                hover:bg-white/20
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
              aria-label={
                notificationCount >
                0
                  ? `${notificationCount} مورد نیازمند اقدام`
                  : "اعلان‌ها"
              }
              title={
                notificationTitle
              }
            >
              <Bell
                size={23}
                className={
                  notificationCount >
                  0
                    ? "fill-white/20"
                    : ""
                }
              />


              {/*
               * عدد اعلان
               */}
              {notificationCount >
                0 && (
                <span
                  className="
                    absolute
                    -right-1
                    -top-1
                    flex
                    h-5
                    min-w-5
                    items-center
                    justify-center
                    rounded-full
                    bg-red-600
                    px-1
                    text-[11px]
                    font-bold
                    leading-none
                    text-white
                    ring-2
                    ring-[#007fcf]
                  "
                >
                  {notificationCount >
                  99
                    ? "99+"
                    : notificationCount}
                </span>
              )}


              {/*
               * نشانگر دریافت اعلان
               */}
              {isNotificationLoading &&
                notificationCount ===
                  0 && (
                  <span
                    className="
                      absolute
                      bottom-1
                      right-1
                      h-2
                      w-2
                      animate-pulse
                      rounded-full
                      bg-amber-300
                    "
                  />
                )}
            </button>
          </div>


          {/*
           * پروفایل
           */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setOpenProfile(
                  (
                    previous
                  ) =>
                    !previous
                )
              }
              disabled={
                isLoading
              }
              className="
                flex
                items-center
                gap-3
                rounded-lg
                px-4
                py-2
                transition
                duration-300
                hover:bg-white/20
                disabled:opacity-60
              "
              aria-expanded={
                openProfile
              }
              aria-label="نمایش اطلاعات حساب کاربری"
            >
              {/*
               * آواتار
               */}
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  bg-white
                  font-bold
                  text-[#007fcf]
                "
              >
                {isLoading ? (
                  <UserRound
                    size={22}
                  />
                ) : (
                  avatarLetter
                )}
              </div>


              {/*
               * اطلاعات خلاصه کاربر
               */}
              <div className="min-w-28 text-right">
                <div className="font-semibold">
                  {isLoading
                    ? "در حال بارگذاری..."
                    : userInfo
                        ?.userName ||
                      "کاربر مهمان"}
                </div>


                <div className="text-xs text-white/80">
                  {isLoading
                    ? "..."
                    : roleTitle}
                </div>
              </div>


              {/*
               * فلش منوی پروفایل
               */}
              <ChevronDown
                size={18}
                className={`
                  transition-transform
                  duration-300
                  ${
                    openProfile
                      ? "rotate-180"
                      : ""
                  }
                `}
              />
            </button>


            {/*
             * پنجره اطلاعات کاربر
             */}
            {openProfile &&
              userInfo && (
                <div
                  className="
                    absolute
                    left-0
                    z-50
                    mt-2
                    w-72
                    overflow-hidden
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    text-gray-800
                    shadow-xl
                  "
                >
                  {/*
                   * اطلاعات اصلی
                   */}
                  <div className="border-b border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="
                          flex
                          h-12
                          w-12
                          items-center
                          justify-center
                          rounded-full
                          bg-blue-100
                          text-lg
                          font-bold
                          text-[#007fcf]
                        "
                      >
                        {
                          avatarLetter
                        }
                      </div>


                      <div>
                        <p className="font-bold">
                          {
                            userInfo.userName
                          }
                        </p>


                        <p className="text-sm text-gray-500">
                          {
                            roleTitle
                          }
                        </p>
                      </div>
                    </div>
                  </div>


                  {/*
                   * شبکه‌های مجاز
                   */}
                  <div
                    className="
                      flex
                      items-start
                      gap-3
                      border-b
                      border-gray-100
                      px-4
                      py-3
                      text-sm
                    "
                  >
                    <Network
                      size={18}
                      className="
                        mt-0.5
                        shrink-0
                        text-gray-500
                      "
                    />


                    <div>
                      <p className="text-gray-500">
                        شبکه‌های مجاز
                      </p>


                      <p className="mt-1 font-semibold">
                        {userInfo
                          .networkIds
                          .length >
                        0
                          ? userInfo.networkIds.join(
                              "، "
                            )
                          : "تخصیص داده نشده"}
                      </p>
                    </div>
                  </div>


                  {/*
                   * گروه برنامه‌ساز
                   */}
                  <div
                    className="
                      flex
                      items-start
                      gap-3
                      border-b
                      border-gray-100
                      px-4
                      py-3
                      text-sm
                    "
                  >
                    <UsersRound
                      size={18}
                      className="
                        mt-0.5
                        shrink-0
                        text-gray-500
                      "
                    />


                    <div>
                      <p className="text-gray-500">
                        گروه برنامه‌ساز
                      </p>


                      <p className="mt-1 font-semibold">
                        {userInfo.networkGroupId ??
                          "تخصیص داده نشده"}
                      </p>
                    </div>
                  </div>


                  {/*
                   * نقش‌ها
                   */}
                  <div className="px-4 py-3 text-sm">
                    <p className="mb-2 text-gray-500">
                      نقش‌های کاربر
                    </p>


                    <div className="flex flex-wrap gap-2">
                      {userInfo.roles
                        .length >
                      0 ? (
                        userInfo.roles.map(
                          (
                            role
                          ) => (
                            <span
                              key={
                                role
                              }
                              className="
                                rounded-md
                                bg-blue-50
                                px-2
                                py-1
                                text-xs
                                font-semibold
                                text-[#007fcf]
                              "
                            >
                              {getRoleTitle(
                                role
                              )}
                            </span>
                          )
                        )
                      ) : (
                        <span className="text-gray-500">
                          بدون نقش
                        </span>
                      )}
                    </div>
                  </div>


                  {/*
                   * خروج
                   */}
                  <button
                    type="button"
                    onClick={
                      handleLogout
                    }
                    className="
                      flex
                      w-full
                      items-center
                      gap-3
                      border-t
                      border-gray-200
                      px-4
                      py-3
                      text-red-600
                      transition
                      hover:bg-red-50
                    "
                  >
                    <LogOut
                      size={18}
                    />

                    خروج از حساب کاربری
                  </button>
                </div>
              )}
          </div>
        </div>
      </div>
    </header>
  );
}


/*
 * تبدیل نام انگلیسی Role
 * به عنوان فارسی
 */
function getRoleTitle(
  role:
    | string
    | undefined
) {
  const roleTitles:
    Record<
      string,
      string
    > = {
    Admin:
      "مدیر سامانه",

    ProgramGroup:
      "گروه برنامه‌ساز",

    Expert:
      "کارشناس",

    User:
      "کاربر",
  };


  if (!role) {
    return "بدون نقش";
  }


  return (
    roleTitles[role] ??
    role
  );
}


/*
 * تعیین وضعیت موردنیاز برای اعلان
 */
function getRequiredNotificationStatus(
  roles: string[]
): NotificationStatus | null {
  /*
   * اگر کاربر هم User و هم ProgramGroup
   * باشد، اولویت با صندوق بررسی است.
   */
  if (
    roles.includes(
      "ProgramGroup"
    )
  ) {
    return "PendingReview";
  }


  if (
    roles.includes(
      "User"
    )
  ) {
    return "ReturnedForEdit";
  }


  return null;
}


/*
 * بررسی اولیه ساختار نشست
 */
function isValidUserSession(
  value: unknown
): value is UserSession {
  if (!isRecord(value)) {
    return false;
  }


  return (
    typeof value.userName ===
      "string" &&
    typeof value.expiresAt ===
      "string" &&
    Array.isArray(
      value.roles
    ) &&
    value.roles.every(
      (
        role
      ): role is string =>
        typeof role ===
        "string"
    ) &&
    Array.isArray(
      value.networkIds
    ) &&
    value.networkIds.every(
      (
        networkId
      ): networkId is number =>
        typeof networkId ===
        "number"
    ) &&
    (
      typeof value.networkGroupId ===
        "number" ||
      value.networkGroupId ===
        null
    )
  );
}


/*
 * تبدیل امن پاسخ Text به JSON
 */
function parseJsonResponse(
  responseText: string
): unknown | null {
  if (!responseText.trim()) {
    return null;
  }


  try {
    return JSON.parse(
      responseText
    ) as unknown;
  } catch {
    return null;
  }
}


/*
 * بررسی Object بودن مقدار
 */
function isRecord(
  value: unknown
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


/*
 * استخراج پیام پاسخ خطا
 */
function getResponseMessage(
  value: unknown
): string | null {
  if (!isRecord(value)) {
    return null;
  }


  if (
    typeof value.message ===
    "string"
  ) {
    return value.message;
  }


  if (
    typeof value.description ===
    "string"
  ) {
    return value.description;
  }


  return null;
}


/*
 * استخراج تعداد موارد نیازمند اقدام
 */
function getNotificationCount(
  value: unknown,
  requiredStatus:
    NotificationStatus
): number {
  /*
   * پاسخ استاندارد Route داخلی:
   *
   * {
   *   items: [],
   *   pagination: {
   *     totalCount: 10
   *   }
   * }
   */
  if (
    isRecord(value) &&
    isRecord(
      value.pagination
    ) &&
    typeof value.pagination
      .totalCount ===
      "number"
  ) {
    return value.pagination
      .totalCount;
  }


  /*
   * اگر Backend یا Route داخلی
   * مستقیماً آرایه برگرداند.
   */
  if (Array.isArray(value)) {
    return value.filter(
      (item) =>
        isRecord(item) &&
        item.status ===
          requiredStatus
    ).length;
  }


  /*
   * اگر items وجود داشته باشد،
   * ولی pagination وجود نداشته باشد.
   */
  if (
    isRecord(value) &&
    Array.isArray(
      value.items
    )
  ) {
    return value.items.filter(
      (item) =>
        isRecord(item) &&
        item.status ===
          requiredStatus
    ).length;
  }


  return 0;
}