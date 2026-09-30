"use client";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  UserRound,
  ChevronDown,
  LogOut,
  Network,
  UsersRound,
} from "lucide-react";


interface UserSession {
  userName: string;
  expiresAt: string;
  roles: string[];
  networkIds: number[];
  networkGroupId: number | null;
}

export default function Header() {
  const router = useRouter();

  const [openProfile, setOpenProfile] =
    useState(false);

  const [userInfo, setUserInfo] =
    useState<UserSession | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {



    const storedUser =
      localStorage.getItem("pmd-user-session");

    if (!storedUser) {
      setIsLoading(false);
      return;
    }

    try {
      const parsedUser =
        JSON.parse(storedUser) as UserSession;


      const expirationDate =
        new Date(parsedUser.expiresAt);

      const isExpired =
        expirationDate.getTime() <
        Date.now();

      if (isExpired) {
        localStorage.removeItem("userInfo");

        setUserInfo(null);
        setIsLoading(false);

        router.replace("/login");

        return;
      }

      setUserInfo(parsedUser);
    } catch (error) {
      console.error(
        "Local Storage parse error:",
        error
      );


      localStorage.removeItem("pmd-user-session");

      setUserInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  async function handleLogout() {
    try {
      /*
       * این Route باید کوکی‌های HttpOnly را
       * حذف و Refresh Token را Revoke کند.
       */
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error(
        "Logout request failed:",
        error
      );
    } finally {
      localStorage.removeItem("userInfo");

      setUserInfo(null);
      setOpenProfile(false);

      router.replace("/login");
      router.refresh();
    }
  }

  /*
   * نقش اصلی کاربر
   */
  const primaryRole =
    userInfo?.roles?.[0];

  /*
   * تبدیل عنوان انگلیسی نقش به فارسی
   */
  const roleTitle =
    getRoleTitle(primaryRole);

  /*
   * حرف اول نام کاربری برای Avatar
   */
  const avatarLetter =
    userInfo?.userName
      ?.charAt(0)
      .toUpperCase() || "?";

  return (
    <header
      className="
        w-full h-20
        bg-[#007fcf]
        text-white
        shadow-md
      "
    >
      <div
        className="
          h-full
          flex items-center justify-between
          px-6 lg:px-12
        "
      >
        {/* نام سایت */}
        <div className="text-2xl font-bold">
          موج پلاس +
        </div>

        {/* پروفایل */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setOpenProfile(
                (previous) => !previous
              )
            }
            disabled={isLoading}
            className="
              flex items-center gap-3
              px-4 py-2
              rounded-lg
              hover:bg-white/20
              transition duration-300
              disabled:opacity-60
            "
            aria-expanded={openProfile}
            aria-label="نمایش اطلاعات حساب کاربری"
          >
            {/* آواتار کاربر */}
            <div
              className="
                w-10 h-10
                rounded-full
                bg-white
                text-[#007fcf]
                flex items-center justify-center
                font-bold
              "
            >
              {isLoading ? (
                <UserRound size={22} />
              ) : (
                avatarLetter
              )}
            </div>

            {/* اطلاعات کاربر */}
            <div className="text-right min-w-28">
              <div className="font-semibold">
                {isLoading
                  ? "در حال بارگذاری..."
                  : userInfo?.userName ||
                    "کاربر مهمان"}
              </div>

              <div className="text-xs text-white/80">
                {isLoading
                  ? "..."
                  : roleTitle}
              </div>
            </div>

            {/* فلش */}
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

          {/* پنجره اطلاعات کاربر */}
          {openProfile && userInfo && (
            <div
              className="
                absolute left-0 mt-2
                w-72
                bg-white
                text-gray-800
                rounded-xl
                shadow-xl
                border border-gray-200
                overflow-hidden
                z-50
              "
            >
              {/* اطلاعات اصلی */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div
                    className="
                      w-12 h-12
                      rounded-full
                      bg-blue-100
                      text-[#007fcf]
                      flex items-center justify-center
                      font-bold text-lg
                    "
                  >
                    {avatarLetter}
                  </div>

                  <div>
                    <p className="font-bold">
                      {userInfo.userName}
                    </p>

                    <p className="text-sm text-gray-500">
                      {roleTitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* شبکه‌های مجاز */}
              <div
                className="
                  px-4 py-3
                  flex items-start gap-3
                  text-sm
                  border-b border-gray-100
                "
              >
                <Network
                  size={18}
                  className="
                    text-gray-500
                    mt-0.5
                    shrink-0
                  "
                />

                <div>
                  <p className="text-gray-500">
                    شبکه‌های مجاز
                  </p>

                  <p className="font-semibold mt-1">
                    {userInfo.networkIds.length > 0
                      ? userInfo.networkIds.join("، ")
                      : "تخصیص داده نشده"}
                  </p>
                </div>
              </div>

              {/* گروه برنامه‌ساز */}
              <div
                className="
                  px-4 py-3
                  flex items-start gap-3
                  text-sm
                  border-b border-gray-100
                "
              >
                <UsersRound
                  size={18}
                  className="
                    text-gray-500
                    mt-0.5
                    shrink-0
                  "
                />

                <div>
                  <p className="text-gray-500">
                    گروه برنامه‌ساز
                  </p>

                  <p className="font-semibold mt-1">
                    {userInfo.networkGroupId ??
                      "تخصیص داده نشده"}
                  </p>
                </div>
              </div>

              {/* نقش‌ها */}
              <div className="px-4 py-3 text-sm">
                <p className="text-gray-500 mb-2">
                  نقش‌های کاربر
                </p>

                <div className="flex flex-wrap gap-2">
                  {userInfo.roles.length > 0 ? (
                    userInfo.roles.map((role) => (
                      <span
                        key={role}
                        className="
                          px-2 py-1
                          rounded-md
                          bg-blue-50
                          text-[#007fcf]
                          text-xs
                          font-semibold
                        "
                      >
                        {getRoleTitle(role)}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">
                      بدون نقش
                    </span>
                  )}
                </div>
              </div>

              {/* خروج */}
              {/* <button
                type="button"
                onClick={() => {
                  setOpenProfile(false);
                  router.push("/profile");
                }}
                className="
                  w-full
                  flex items-center gap-3
                  px-4 py-3
                  border-t border-gray-200
                  text-[#007fcf]
                  hover:bg-blue-50
                  transition
                "
              >
                <UserRound size={18} />
                مشاهده و ویرایش پروفایل
              </button> */}

              <button
                type="button"
                onClick={handleLogout}
                className="
                  w-full
                  flex items-center gap-3
                  px-4 py-3
                  border-t border-gray-200
                  text-red-600
                  hover:bg-red-50
                  transition
                "
              >
                <LogOut size={18} />

                خروج از حساب کاربری
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/*
 * تبدیل نام انگلیسی Role به عنوان فارسی
 */
function getRoleTitle(
  role: string | undefined
) {
  const roleTitles: Record<string, string> = {
    Admin: "مدیر سامانه",
    ProgramGroup: "گروه برنامه‌ساز",
    Expert: "کارشناس",
    User: "کاربر",
  };

  if (!role) {
    return "بدون نقش";
  }

  return roleTitles[role] ?? role;
}
