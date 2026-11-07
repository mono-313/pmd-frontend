"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter, usePathname } from "next/navigation";

import {
  Bell,
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
        !Number.isFinite(expirationDate.getTime()) ||
        expirationDate.getTime() <=
        Date.now();

      if (isExpired) {
        localStorage.removeItem("pmd-user-session");
      localStorage.removeItem("userInfo");

        setUserInfo(null);
        setIsLoading(false);

        router.replace("/login");

        return;
      }

      if (!parsedUser || 
        typeof parsedUser.userName !== "string" ||
          !Array.isArray(parsedUser.roles) || 
          !parsedUser.roles.every(role => typeof role === "string") ||
          !Array.isArray(parsedUser.networkIds))
          throw new Error("Invalid session");
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
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Logout failed");
    } catch (error) {
      console.error(
        "Logout request failed:",
        error
      );
      window.alert("خروج از حساب انجام نشد؛ دوباره تلاش کنید.");
      return;
    }
    {
      localStorage.removeItem("pmd-user-session");
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

        {/* اعلان‌ها و پروفایل */}
        <div className="flex items-center gap-2">
        {userInfo && <InboxNotifications user={userInfo} />}
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
                    <ProfileAssignmentName user={userInfo} kind="network" />
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
                    <ProfileAssignmentName user={userInfo} kind="group" />
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
  const roleTitles = ROLE_TITLES;

  if (!role) {
    return "بدون نقش";
  }

  return roleTitles[role] ?? role;
}


type InboxRow = Record<string, unknown> & { id: string };
type InboxNotice = 
{ key: string; title: string; label: string;
  mainTopic: string; broadcastDate: string;
  planId: number | null; networkId: number | null; 
  href: string | null };
const ROLE_TITLES: Record<string, string> = {
  Admin: "مدیر سامانه", NetworkManager: "مدیر شبکه",
  NetworkGroupManager: "مدیر گروه برنامه‌ساز", Providers: "تهیه‌کننده",
  Supervisor: "ناظر ضبطی", LiveSupervisor: "ناظر زنده",
  BroadcastManager: "مدیر پخش", PlanManager: "مدیر طرح و برنامه",
  ProgramGroup: "گروه برنامه‌ساز", Expert: "کارشناس", User: "کاربر",
};
function objectValue(value: unknown): 
value is Record<string, unknown> {
  return typeof value === "object" && 
  value !== null && !Array.isArray(value);
}

function normalizedRole(value: string) {
  return value.trim().toLowerCase();
}
function profileStage(value: unknown): number | null {
  const names: Record<string, number> = {
    Draft: 0, PendingGroupManager: 10, PendingSupervisor: 20,
    PendingBroadcastManager: 30, PendingPlanningManager: 40,
    Approved: 50, ReturnedForEdit: 60,
  };
  if (typeof value === "string" && value in names) 
    return names[value];
  const number = typeof value === "number" ? value :
    typeof value === "string" && /^\d+$/.test(value) 
    ? Number(value) : NaN;
  return [0, 10, 20, 30, 40, 50, 60].includes(number) 
  ? number : null;
}
function productionKind(row: InboxRow): 10 | 20 | null {
    const method = typeof row.productionMethod === "string"
    ? row.productionMethod.trim().
    replace(/ي/g, "ی").
    replace(/ك/g, "ک") : "";

  if (method === "زنده") return 10;
  if (["ضبطی", "تولیدی", "ضبطی (تولیدی)"].includes(method))
     return 20;
  const value = Number(row.programType);
  return value === 10 ||
   value === 20 ? 
   value : null;
}

function ownRecord(row: InboxRow, user: UserSession): 
boolean {
  
  const name = row.createdByUserName ?? row.userCreatorName;
  return typeof name === "string" && 
  name.trim().toLowerCase() === user.userName.trim().toLowerCase();
}

function makeNotice
( row: InboxRow,
  kind: "forecast" | "profile", 
  user: UserSession):
 InboxNotice | null 
 {
  const roles = new Set(user.roles.map(normalizedRole));
  const admin = roles.has("admin");
  let label = "";
  let returned = false;
  if (kind === "forecast") {
    const status = String(row.status);
    if (["PendingReview", "2"].includes(status) &&
     (admin || roles.has("networkgroupmanager"))) {
      label = "پیش‌بینی منتظر بررسی";
      }
      
      if (
  kind === "forecast" &&
  ["Approved", "3"].includes(String(row.status)) &&
  user.roles.some(
    role => normalizedRole(role) === "providers"
  ) &&
  ownRecord(row, user)
) {
  return {
    key: `forecast:${row.id}`,
    ...noticeDetails(row),
    label: "پیش‌بینی شما تأیید شد",
    href: `/approved-forecasts?forecastId=${encodeURIComponent(row.id)}`,
  };
}
      
      else if (["ReturnedForEdit", "5"].includes(status) 
      && roles.has("providers") && ownRecord(row, user))
     {
      label = "پیش‌بینی برگشتی؛ نیازمند اصلاح"; 
      returned = true;
    }
  } else {
    const status = profileStage(row.status);
    const assigned = status === 10 
    ? roles.has("networkgroupmanager") :
      status === 20 
      ? (productionKind(row) === 10 
      ? roles.has("livesupervisor") :
        productionKind(row) === 20 
        ? roles.has("supervisor") : false) :
      status === 30 
      ? roles.has("broadcastmanager") 
      : status === 40 ? roles.has("planmanager") 
      : false;
    if ([10, 20, 30, 40].includes(status ?? -1) 
      && (admin || assigned)) {
      const stages: 
      Record<number, string> = 
      {10: "مدیر گروه", 20: "ناظر", 30: "مدیر پخش", 
        40: "مدیر طرح و برنامه"};
      label = `شناسنامه منتظر بررسی ${stages[status!]}`;
    } 
    else if 
    (status === 60 && roles.has("providers") 
    && ownRecord(row, user)) {
      label = "شناسنامه برگشتی؛ نیازمند اصلاح"; 
      returned = true;
    }
  }
  if (!label) return null;
  return {
    key: `${kind}:${row.id}`, label,
    ...noticeDetails(row),
     href: returned ? null : 
     `${kind === "forecast" ? "/forecasts" :
       "/program-profiles"}/review/${encodeURIComponent(row.id)}`,
  };
}

async function readInboxPages
(path: string, signal: AbortSignal): 
Promise<InboxRow[]> {
  const rows = new Map<string, InboxRow>();
  for (let page = 1; page <= 200; page += 1) {
    const url = new URL(path, window.location.origin);
    url.searchParams.set("pageNumber", String(page));
    url.searchParams.set("pageSize", "100");
    const response = await fetch(url.pathname + url.search,
       {
      cache: "no-store", credentials: "same-origin", signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      if (response.status === 401) 
        throw new Error("نشست معتبر نیست؛ دوباره وارد شوید.");
      if (response.status === 403) 
        throw new Error("دسترسی به فهرست مجاز نیست.");
      throw new Error(`دریافت اطلاعات ناموفق بود (${response.status}).`);
    }

    let body: unknown;
    try { body = await response.json(); } 
    catch { throw new Error
      ("پاسخ سرویس JSON معتبر نیست."); }
    if (!objectValue(body) || !Array.isArray(body.items)) 
      throw new Error("ساختار فهرست معتبر نیست.");
    if (body.items.length === 0) 
      return [...rows.values()];

    let added = 0;
    for (const item of body.items) {
      if (!objectValue(item) || 
      typeof item.id !== "string" || 
      !item.id || 
      item.status === undefined)
       {
        throw new Error
        ("شناسه یا وضعیت یک رکورد در پاسخ سرویس معتبر نیست.");
      }
      if (!rows.has(item.id)) added += 1;
      rows.set(item.id, item as InboxRow);
    }
    if (added === 0) 
      throw new Error
    ("صفحه‌بندی سرویس تکراری است؛ شمارش کامل ممکن نشد.");
  }
  throw new Error
  ("حجم کارتابل از سقف دریافت بیشتر است؛ شمارش کامل به سرویس اختصاصی نیاز دارد.");
}

function InboxNotifications
({ user }: { user: UserSession }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [notices, setNotices] = useState<InboxNotice[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const roleKey = user.roles.map(normalizedRole).sort().join(",");
  const canForecast = 
  roleKey.split(",").some(role => 
    ["admin", "networkgroupmanager", "providers"].includes(role));
  const canProfile = 
  roleKey.split(",").some(role => 
    ["admin", "networkgroupmanager",
       "providers", "supervisor", "livesupervisor", 
       "broadcastmanager", "planmanager"].includes(role));

  useEffect(() => {
    const dismiss = (event: MouseEvent) => 
      { if (!panel.current?.contains(event.target as Node)) 
        setOpen(false); };
    const escape = (event: KeyboardEvent) => 
      { if (event.key === "Escape") 
        setOpen(false); };
    document.addEventListener("mousedown", dismiss); 
    document.addEventListener("keydown", escape);
    return () => 
      { document.removeEventListener("mousedown", dismiss);
        document.removeEventListener("keydown", escape); 
      };
  }, 
  []);

  useEffect(() => 
    { setOpen(false); }, 
          [pathname]);
  useEffect(() => {
    let disposed = false;
    let active: AbortController | null = null;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      if (active || disposed ||
         document.visibilityState  === "hidden") 
         return;
      clearTimeout(timer);
      const controller = new AbortController();
       active = controller;
      const timeout = setTimeout(
        () => controller.abort(), 60000);
      setBusy(true);
      const sources: { 
        kind: "forecast" | "profile";
         path: string; 
         title: string }[] = [];
      if (canForecast) sources.push(
        { kind: "forecast", 
          path: "/api/forecasts", 
          title: "پیش‌بینی‌ها" 
        });
      if (canProfile) sources.push(
        { kind: "profile", 
          path: "/api/program-profiles", 
          title: "شناسنامه‌ها" 
        });
      try {
        const results = await Promise.allSettled
        (sources.map(source =>
           readInboxPages(source.path, controller.signal)));
        if (disposed)
           return;
        const next: InboxNotice[] = []; 
        const failures: string[] = [];
        const profileIndex = sources.findIndex(
  source => source.kind === "profile"
);

const profileResult = results[profileIndex];

const profileRows =
  profileResult?.status === "fulfilled"
    ? profileResult.value
    : null;

const canCheckIssuedProfiles =
  profileRows !== null &&
  profileRows.every(
    profile =>
      typeof profile.forecastId === "string" &&
      profile.forecastId.trim().length > 0
  );

const issuedForecastIds = new Set(
  (profileRows ?? []).map(profile =>
    String(profile.forecastId ?? "").trim().toLowerCase()
  )
);

if (profileRows !== null && !canCheckIssuedProfiles) {
  failures.push(
    "شناسهٔ پیش‌بینی در بعضی شناسنامه‌ها موجود نیست؛ اعلان آمادهٔ صدور فعلاً نمایش داده نمی‌شود."
  );
}
        results.forEach((result, index) => {
          const source = sources[index];
          if (result.status === "fulfilled") {
  //           result.value.forEach(row => {
  // const isApprovedForecast =
  //   source.kind === "forecast" &&
  //   ["Approved", "3"].includes(String(row.status));

  // const notice = makeNotice(row, source.kind, user);

  // if (notice) next.push(notice);

  result.value.forEach(row => {
  if (source.kind === "forecast") {
    console.log("FORECAST NOTIFICATION DEBUG", {
      userName: user.userName,
      roles: user.roles,
      rowId: row.id,
      status: row.status,
      createdByUserName: row.createdByUserName,
      userCreatorName: row.userCreatorName,
      ownRecord: ownRecord(row, user),
    });
  }

  const notice = makeNotice(row, source.kind, user);

  if (notice) next.push(notice);

});
            if (source.kind === "profile"
              && roleKey.split(",").some(
                role => ["supervisor", "livesupervisor"]
                .includes(role)) &&
                result.value.some(
                  row => profileStage(row.status) === 20 
                  && productionKind(row) === null)) {
              failures.push
              ("نوع تولید بعضی شناسنامه‌های منتظر ناظر مشخص نیست؛ شمارش نیازمند بررسی است.");
            }
          } else failures.push(`${source.title}: 
            ${controller.signal.aborted 
            ? "زمان دریافت به پایان رسید." : 
            result.reason instanceof Error ? 
            result.reason.message : "دریافت ناموفق بود."}`);
        });
        const namedNotices = await resolveNoticePrograms(next, controller.signal);
        if (disposed) return;
        setNotices(namedNotices);
        setErrors(failures); 
        setLoaded(true);
      }
       finally {
        clearTimeout(timeout); 
        active = null;
        if (!disposed) { 
          setBusy(false); 
          timer = setTimeout(() => void load(), 120000); }
      }
    };
    const refresh = () =>
       { if (document.visibilityState === "visible") 
        void load(); };
    void load();
    window.addEventListener("focus", refresh);
    window.addEventListener("pmd-inbox-refresh", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      disposed = true;
       clearTimeout(timer); 
       active?.abort();
      window.removeEventListener("focus", refresh); 
      window.removeEventListener("pmd-inbox-refresh", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  },
   [user,
     roleKey,
      canForecast,
       canProfile,
        pathname,
         refreshKey]);
  const count = notices.length.toLocaleString("fa-IR");

  return <div ref={panel} className="relative" dir="rtl">
    <button type="button"
     aria-label=
     {`اعلان‌ها${loaded && !errors.length ?
       `، ${count} مورد` : ""}`} 
       aria-expanded={open}
      aria-controls="header-inbox" 
      className="relative 
                rounded-lg p-3 
                hover:bg-white/20 
                focus-visible:outline 
                focus-visible:outline-2"
      onClick={() => 
      { setOpen(!open); 
      if (!open && !busy) 
      setRefreshKey(key => key + 1); 
    }}>
      <Bell size={23} />
      {(errors.length > 0 
        || notices.length > 0)
         && <span 
         className="absolute
          -right-1 
          -top-1 
          min-w-5 
          rounded-full 
          bg-red-600 px-1 
          text-center 
          text-xs 
          leading-5 
          text-white">
            {errors.length ? "!" : notices.length > 99 
            ? "۹۹+" : count}
            </span>}
    </button>
    
    {open && 
    <section 
    id="header-inbox" 
    aria-label="کارتابل اعلان‌ها" 
    className="absolute 
              left-0 z-50 
              mt-3 
              w-[min(23rem,calc(100vw-2rem))] 
              overflow-hidden 
              rounded-xl 
              border border-gray-200 
              bg-white text-right
              text-gray-800
              shadow-xl">
      <div className="flex
                     items-center 
                     justify-between 
                     border-b 
                     p-4">
        <strong>{roleKey.split(",").includes("admin") ?
         "موارد در انتظار بررسی" : "در انتظار اقدام شما"}
         </strong>
        <button type="button" 
        disabled={busy}
         onClick=
         {() => setRefreshKey(key => key + 1)} 
         className="text-sm 
                    text-blue-700 
                    disabled:opacity-50">
                      {busy ?
                       "در حال دریافت…" : "به‌روزرسانی"}
                       </button>
      </div>
      <div className="
                    max-h-96 
                    overflow-y-auto" 
                    aria-live="polite" 
                    aria-busy={busy}>
        {errors.map(message =>
           <p key={message} 
           role="alert" 
           className="border-b
                      bg-amber-50 
                      p-3 text-sm 
                      text-amber-900">
                        {message}
                        </p>
                      )}
        {!loaded && 
        <p className="p-4 text-sm">در حال دریافت اعلان‌ها…
        </p>}
        {loaded && 
        !errors.length 
        && 
        !notices.length 
        && 
        <p className="p-4 text-sm
                     text-gray-600">
                      {canProfile || canForecast 
                      ? "موردی برای اقدام شما وجود ندارد." 
                      : "برای نقش شما مرحلهٔ بررسی تعریف نشده است."}
                      </p>
                      }
        {notices.map(notice => 
        <div key={notice.key} 
        className="border-b last:border-0">
          {notice.href 
          ? <button type="button" 
          className="w-full p-4 
                    text-right 
                    hover:bg-blue-50" 
                    onClick={() => 
                    { setOpen(false); 
                    router.push(notice.href!);
                     }}>
            <span 
            className="block text-xs text-blue-700">
              {notice.label}
              </span>
              <NoticeDetails notice={notice} />
          </button> : 
          <div className="p-4">
            <p className="text-xs text-amber-700">
              {notice.label}
              </p>
              <NoticeDetails notice={notice} />
              <p className="mt-1 text-xs
                           text-gray-500">از فهرست موارد ثبت‌شدهٔ خودتان، اصلاح را انجام دهید.
                           </p>
                           </div>
                           }
        </div>)}
      </div>
      {loaded && 
      <p className="border-t 
                    p-3 text-xs 
                    text-gray-500">
                      {errors.length 
                      ? 
                      "شمارش کامل تأیید نشده است." :
                       `${count} مورد؛ با انجام اقدام از فهرست خارج می‌شود.`}
                       </p>}
    </section>}
  </div>;
}


function noticeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function noticeId(value: unknown): number | null {
  const id = typeof value === "number" ? value :
    typeof value === "string" && value.trim() ? Number(value) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function noticeDetails(row: InboxRow) {
  return {
    title: noticeText(row.planName) || noticeText(row.programName),
    mainTopic: noticeText(row.mainTopic) || "موضوع ثبت نشده",
    broadcastDate: noticeText(row.broadcastDate),
    planId: noticeId(row.planId),
    networkId: noticeId(row.networkId),
  };
}

function noticeBroadcastDate(value: string): string {
  if (!value) return "ثبت نشده";
  // Broadcast date is a calendar date; do not shift it by the browser timezone.
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/.exec(value);
  if (!match) return "نامشخص";
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T12:00:00Z`);
  if (!Number.isFinite(date.getTime())) return "نامشخص";
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC",
  }).format(date);
}

function noticeProgramRows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter(objectValue);
  if (!objectValue(value)) return [];
  for (const key of ["programs", "Programs", "items", "Items", "data", "Data", "result", "Result"]) {
    const rows = noticeProgramRows(value[key]);
    if (rows.length) return rows;
  }
  return [];
}

async function resolveNoticePrograms(notices: InboxNotice[], signal: AbortSignal): Promise<InboxNotice[]> {
  const networkIds = [...new Set(notices.filter(notice => !notice.title && notice.planId !== null)
    .map(notice => notice.networkId).filter((id): id is number => id !== null))];
  const names = new Map<string, string>();
  // Limit parallel requests and request each network only once per refresh.
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(4, networkIds.length) }, async () => {
    while (cursor < networkIds.length && !signal.aborted) {
      const networkId = networkIds[cursor++];
      const controller = new AbortController();
      const abort = () => controller.abort();
      signal.addEventListener("abort", abort, { once: true });
      if (signal.aborted) controller.abort();
      const timeout = setTimeout(abort, 10000);
      try {
        const response = await fetch(`/api/programs?networkId=${networkId}`, {
          cache: "no-store", credentials: "same-origin",
          headers: { Accept: "application/json" }, signal: controller.signal,
        });
        if (!response.ok) continue;
        const body: unknown = await response.json();
        for (const row of noticeProgramRows(body)) {
          const id = noticeId(row.planId ?? row.PlanId ?? row.id ?? row.Id ?? row.value ?? row.Value);
          const rowNetwork = noticeId(row.networkId ?? row.NetworkId);
          if (id === null || (rowNetwork !== null && rowNetwork !== networkId)) continue;
          const name = [row.name, row.Name, row.planName, row.programName, row.title, row.Title, row.text, row.Text]
            .map(noticeText).find(Boolean);
          if (name) names.set(`${networkId}:${id}`, name);
        }
      } catch {
        // A lookup failure must not hide an actionable notification.
      } finally {
        clearTimeout(timeout);
        signal.removeEventListener("abort", abort);
      }
    }
  }));
  return notices.map(notice => ({
    ...notice,
    title: notice.title || names.get(`${notice.networkId}:${notice.planId}`) || "نام برنامه در دسترس نیست",
  }));
}

function NoticeDetails({ notice }: { notice: InboxNotice }) {
  return <span className="mt-1 block min-w-0 max-w-full">
    <span title={notice.title} className="block truncate text-sm font-semibold leading-6 text-gray-800">
      {notice.title}
    </span>
    <span className="mt-0.5 block text-[11px] leading-5 text-gray-500">
      تاریخ پخش: {noticeBroadcastDate(notice.broadcastDate)}
    </span>
    <span title={notice.mainTopic}
      className="mt-0.5 block break-words text-xs font-normal leading-5 text-gray-600"
      style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden", overflowWrap: "anywhere" }}>
      {notice.mainTopic}
    </span>
  </span>;
}


function assignmentRows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter(objectValue);
  if (!objectValue(value)) return [];
  for (const key of ["networks", "Networks", "networkGroups", "NetworkGroups", "items", "Items", "data", "Data", "result", "Result"]) {
    const rows = assignmentRows(value[key]);
    if (rows.length) return rows;
  }
  return [];
}

function assignmentName(row: Record<string, unknown>, kind: "network" | "group"): string {
  const fields = kind === "network"
    ? [row.networkName, row.NetworkName, row.networkTitle, row.NetworkTitle]
    : [row.networkGroupName, row.NetworkGroupName, row.networkGroupTitle, row.NetworkGroupTitle, row.groupName, row.GroupName];
  return [...fields, row.name, row.Name, row.title, row.Title, row.text, row.Text].map(noticeText).find(Boolean) || "";
}

async function fetchAssignmentRows(path: string, signal: AbortSignal) {
  const response = await fetch(path, { cache: "no-store", credentials: "same-origin", signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("دریافت نام انجام نشد");
  return assignmentRows(await response.json());
}

function ProfileAssignmentName({ user, kind }: { user: UserSession; kind: "network" | "group" }) {
  const networkKey = user.networkIds.join(",");
  const groupId = user.networkGroupId;
  const [name, setName] = useState("در حال دریافت نام…");
  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const networkIds = networkKey.split(",").map(noticeId).filter((id): id is number => id !== null);
    setName("در حال دریافت نام…");
    async function load() {
      if (kind === "group" && groupId === null) return "تخصیص داده نشده";
      if (!networkIds.length) return kind === "network" ? "تخصیص داده نشده" : "نام گروه در دسترس نیست";
      if (kind === "network") {
        const rows = await fetchAssignmentRows("/api/networks", controller.signal);
        return networkIds.map(id => {
          const row = rows.find(item => noticeId(item.id ?? item.Id ?? item.networkId ?? item.NetworkId ?? item.value ?? item.Value) === id);
          return row && assignmentName(row, kind) || "نام شبکه در دسترس نیست";
        }).join("، ");
      }
      const results = await Promise.allSettled(networkIds.map(id =>
        fetchAssignmentRows(`/api/networkgroups/${id}`, controller.signal).then(rows => ({ networkId: id, rows }))));
      for (const result of results) {
        if (result.status !== "fulfilled") continue;
        for (const row of result.value.rows) {
          const id = noticeId(row.id ?? row.Id ?? row.networkGroupId ?? row.NetworkGroupId ?? row.value ?? row.Value);
          const networkId = noticeId(row.networkId ?? row.NetworkId);
          if (id !== groupId || (networkId !== null && networkId !== result.value.networkId)) continue;
          const title = assignmentName(row, kind);
          if (title) return title;
        }
      }
      return "نام گروه در دسترس نیست";
    }
    void load().then(value => { if (!disposed) setName(value); })
      .catch(() => { if (!disposed) setName(kind === "network" ? "نام شبکه در دسترس نیست" : "نام گروه در دسترس نیست"); })
      .finally(() => clearTimeout(timeout));
    return () => { disposed = true; clearTimeout(timeout); controller.abort(); };
  }, [networkKey, groupId, kind]);
  return <span className="block break-words" title={name}>{name}</span>;
}
