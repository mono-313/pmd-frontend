
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import DatePicker from "react-multi-date-picker";

import DateObject from "react-date-object";

import persian from "react-date-object/calendars/persian";

import gregorian from "react-date-object/calendars/gregorian";

import persianFa from "react-date-object/locales/persian_fa";

import gregorianEn from "react-date-object/locales/gregorian_en";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Eye,
  FileText,
  LoaderCircle,
  MoreVertical,
  RotateCcw,
  Search,
  Send,
  X,
  ChevronDown,
  Filter,
} from "lucide-react";

import type {
  ProgramProfileListResponse,
  ProgramProfilePagination,
  ProgramProfileResponse,
  ProgramProfileStatus,
} from "@/app/types/program-profile";

import ProgramName from "@/app/component/program/ProgramName";

import {
  getProgramsByNetwork,
} from "@/app/services/program-service";


const PAGE_SIZE = 10;


interface ProgramListItem {
  id: number;
  name: string;
  networkId: number;
}


interface ProfileFilters {
  program: string;
  status: string;
  mainTopic: string;
  duration: string;
  startTime: string;
  productionMethod: string;
  occasion: string;
  floorName: string;
  programDegreeName: string;
  programStructureName: string;
}


const INITIAL_FILTERS: ProfileFilters = {
  program: "",
  status: "",
  mainTopic: "",
  duration: "",
  startTime: "",
  productionMethod: "",
  occasion: "",
  floorName: "",
  programDegreeName: "",
  programStructureName: "",
};


export default function ProgramProfilesPage() {
  const router = useRouter();

  const menuContainerRef =
    useRef<HTMLDivElement | null>(null);

  // تمام شناسنامه‌های دریافت‌شده از API
  const [profiles, setProfiles] =
    useState<ProgramProfileResponse[]>([]);

  // نام برنامه‌ها با کلید ترکیبی شبکه و شناسه برنامه
  const [programNames, setProgramNames] =
    useState<Record<string, string>>({});

  const [programsLoading, setProgramsLoading] =
    useState(false);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [fromDate, setFromDate] =
    useState<DateObject | null>(null);

  const [toDate, setToDate] =
    useState<DateObject | null>(null);

  const [appliedFromDate, setAppliedFromDate] =
    useState("");

  const [appliedToDate, setAppliedToDate] =
    useState("");

  const [filters, setFilters] =
    useState<ProfileFilters>(INITIAL_FILTERS);

  const [showMoreFilters, setShowMoreFilters] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [openMenuId, setOpenMenuId] =
    useState<string | null>(null);

  const [submitProfile, setSubmitProfile] =
    useState<ProgramProfileResponse | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);


  /*
   * دریافت تمام صفحات شناسنامه‌ها
   *
   * ابتدا صفحه اول دریافت می‌شود و سپس با توجه به
   * اطلاعات صفحه‌بندی، دریافت صفحات بعدی ادامه پیدا می‌کند.
   *
   * فیلتر تاریخ در این مرحله به API ارسال نمی‌شود؛
   * چون قرار است فیلترها روی تمام داده‌های دریافتی
   * در سمت فرانت‌اند اعمال شوند.
   */
  const loadProfiles = useCallback(
    async () => {
      try {
        setIsLoading(true);
        setError("");

        const allProfiles: ProgramProfileResponse[] = [];

        let requestedPage = 1;
        let hasNextPage = true;

        while (hasNextPage) {
          const query = new URLSearchParams({
            pageNumber: String(requestedPage),
            pageSize: String(PAGE_SIZE),
          });

          const response = await fetch(
            `/api/program-profiles?${query.toString()}`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
              },
              cache: "no-store",
            }
          );

          const responseText = await response.text();

          const responseData =
            parseJsonResponse(responseText);

          const paginationHeaderData =
            parseJsonResponse(
              response.headers.get("Pagination") ??
              response.headers.get("X-Pagination") ??
              ""
            );

          if (!response.ok) {
            throw new Error(
              getErrorMessage(responseData) ??
              `دریافت شناسنامه‌ها انجام نشد. کد پاسخ: ${response.status}`
            );
          }

          const normalizedResult =
            normalizeListResponse(
              responseData,
              requestedPage,
              paginationHeaderData
            );

          if (!normalizedResult) {
            console.error(
              "Invalid profiles response:",
              {
                responseData,
                responseText,
                requestedPage,
              }
            );

            throw new Error(
              "ساختار پاسخ فهرست شناسنامه‌ها معتبر نیست."
            );
          }

          allProfiles.push(
            ...normalizedResult.items
          );

          hasNextPage =
            normalizedResult.pagination.hasNext &&
            normalizedResult.items.length > 0;

          requestedPage += 1;
        }

        setProfiles(allProfiles);
        setCurrentPage(1);

      } catch (loadError) {
        setProfiles([]);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "دریافت شناسنامه‌ها انجام نشد."
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );


  /*
   * دریافت نام برنامه‌ها برای شبکه‌های موجود در شناسنامه‌ها.
   *
   * کلید هر برنامه به شکل networkId:planId است.
   * این کار مانع تداخل شناسه‌های یکسان در شبکه‌های مختلف می‌شود.
   */
  const loadPrograms = useCallback(
    async () => {
      if (profiles.length === 0) {
        setProgramNames({});
        return;
      }

      try {
        setProgramsLoading(true);

        const networkIds = [
          ...new Set(
            profiles
              .map((profile) =>
                readNumericValue(profile.networkId)
              )
              .filter(
                (id): id is number =>
                  id !== null && id > 0
              )
          ),
        ];

        const results = await Promise.all(
          networkIds.map((networkId) =>
            getProgramsByNetwork(networkId)
          )
        );

        const nextProgramNames: Record<string, string> = {};

        for (const programs of results) {
          for (const program of programs) {
            nextProgramNames[
              `${program.networkId}:${program.id}`
            ] = program.name;
          }
        }

        setProgramNames(nextProgramNames);

      } catch (loadError) {
        console.error(
          "Load programs error:",
          loadError
        );

        setProgramNames({});
      } finally {
        setProgramsLoading(false);
      }
    },
    [profiles]
  );


  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);


  useEffect(() => {
    if (profiles.length > 0) {
      void loadPrograms();
    }
  }, [profiles, loadPrograms]);


  /*
   * بستن منوی عملیات با کلیک خارج از آن
   */
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(
          event.target as Node
        )
      ) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);


  /*
   * ساخت گزینه‌های نام برنامه برای فیلتر
   */
  const programOptions = useMemo(() => {
    const options = new Map<
      string,
      {
        key: string;
        name: string;
      }
    >();

    for (const profile of profiles) {
      const networkId =
        readNumericValue(profile.networkId);

      const planId =
        readNumericValue(profile.planId);

      if (
        networkId === null ||
        planId === null
      ) {
        continue;
      }

      const key = `${networkId}:${planId}`;

      const name = programNames[key];

      if (!name) {
        continue;
      }

      options.set(key, {
        key,
        name,
      });
    }

    return [...options.values()].sort(
      (a, b) =>
        a.name.localeCompare(b.name, "fa")
    );
  }, [profiles, programNames]);


  /*
   * گزینه‌های وضعیت از داده‌های موجود ساخته می‌شوند.
   */
  const statusOptions = useMemo(() => {
    const options = new Map<string, string>();

    for (const profile of profiles) {
      const value = String(profile.status);

      options.set(
        value,
        getProfileStatusTitle(profile)
      );
    }

    return [...options.entries()].map(
      ([value, label]) => ({
        value,
        label,
      })
    );
  }, [profiles]);


  /*
   * اعمال تمام فیلترها روی کل شناسنامه‌های دریافتی
   */
  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const networkId =
        readNumericValue(profile.networkId);

      const planId =
        readNumericValue(profile.planId);

      const profileProgramKey =
        networkId !== null && planId !== null
          ? `${networkId}:${planId}`
          : "";

      // فیلتر نام برنامه
      if (
        filters.program &&
        profileProgramKey !== filters.program
      ) {
        return false;
      }

      // فیلتر وضعیت
      if (
        filters.status &&
        String(profile.status) !== filters.status
      ) {
        return false;
      }

      // فیلتر تاریخ شروع
      if (appliedFromDate) {
        const broadcastDate =
          getComparableDate(profile.broadcastDate);

        if (
          !broadcastDate ||
          broadcastDate < appliedFromDate
        ) {
          return false;
        }
      }

      // فیلتر تاریخ پایان
      if (appliedToDate) {
        const broadcastDate =
          getComparableDate(profile.broadcastDate);

        if (
          !broadcastDate ||
          broadcastDate > appliedToDate
        ) {
          return false;
        }
      }

      // فیلتر موضوع اصلی
      if (
        !includesText(
          profile.mainTopic,
          filters.mainTopic
        )
      ) {
        return false;
      }

      // فیلتر مدت
      if (
        !includesText(
          profile.duration,
          filters.duration
        )
      ) {
        return false;
      }

      // فیلتر ساعت شروع
      if (
        !includesText(
          profile.startTime,
          filters.startTime
        )
      ) {
        return false;
      }

      // فیلتر نحوه تولید
      if (
        !includesText(
          profile.productionMethod,
          filters.productionMethod
        )
      ) {
        return false;
      }

      // فیلتر مناسبت
      if (
        !includesText(
          profile.occasion,
          filters.occasion
        )
      ) {
        return false;
      }

      // فیلتر طبقه
      if (
        !includesText(
          profile.floorName,
          filters.floorName
        )
      ) {
        return false;
      }

      // فیلتر درجه
      if (
        !includesText(
          profile.programDegreeName,
          filters.programDegreeName
        )
      ) {
        return false;
      }

      // فیلتر ساختار
      if (
        !includesText(
          profile.programStructureName,
          filters.programStructureName
        )
      ) {
        return false;
      }

      return true;
    });
  }, [
    profiles,
    filters,
    appliedFromDate,
    appliedToDate,
  ]);


  /*
   * صفحه‌بندی محلی پس از فیلتر
   */
  const totalPages = Math.ceil(
    filteredProfiles.length / PAGE_SIZE
  );

  const pageProfiles = filteredProfiles.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const pagination: ProgramProfilePagination = {
    currentPage,
    pageSize: PAGE_SIZE,
    totalCount: filteredProfiles.length,
    totalPages,
    hasPrevious: currentPage > 1,
    hasNext: currentPage < totalPages,
  };


  /*
   * اگر بعد از تغییر فیلتر، صفحه جاری خارج از محدوده شد،
   * به صفحه معتبر برمی‌گردیم.
   */
  useEffect(() => {
    if (
      currentPage > Math.max(totalPages, 1)
    ) {
      setCurrentPage(
        Math.max(totalPages, 1)
      );
    }
  }, [currentPage, totalPages]);


  function updateFilter(
    field: keyof ProfileFilters,
    value: string
  ) {
    setFilters((previous) => ({
      ...previous,
      [field]: value,
    }));

    setCurrentPage(1);
  }


  function handleApplyFilters() {
    setError("");

    const fromGregorian =
      fromDate
        ? convertPersianDateToGregorian(fromDate)
        : "";

    const toGregorian =
      toDate
        ? convertPersianDateToGregorian(toDate)
        : "";

    if (
      fromGregorian &&
      toGregorian &&
      fromGregorian > toGregorian
    ) {
      setError(
        "تاریخ شروع نباید بعد از تاریخ پایان باشد."
      );

      return;
    }

    setCurrentPage(1);

    setAppliedFromDate(fromGregorian);
    setAppliedToDate(toGregorian);
  }


  function handleResetFilters() {
    setFromDate(null);
    setToDate(null);

    setAppliedFromDate("");
    setAppliedToDate("");

    setFilters(INITIAL_FILTERS);

    setShowMoreFilters(false);

    setCurrentPage(1);

    setError("");
  }


  function handleViewProfile(profileId: string) {
    setOpenMenuId(null);

    router.push(
      `/program-profiles/${encodeURIComponent(
        profileId
      )}`
    );
  }


  async function handleSubmitForReview() {
    if (
      !submitProfile ||
      isSubmitting
    ) {
      return;
    }

    if (!canSubmitProfile(submitProfile)) {
      setSubmitProfile(null);

      setError(
        "این شناسنامه در وضعیت قابل ارسال قرار ندارد."
      );

      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `/api/program-profiles/${encodeURIComponent(
          submitProfile.id
        )}/submit`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      const responseText = await response.text();

      const responseData =
        parseJsonResponse(responseText);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(responseData) ??
          (
            "ارسال شناسنامه برای مدیر انجام نشد. " +
            `کد پاسخ: ${response.status}`
          )
        );
      }

      setSubmitProfile(null);

      setSuccessMessage(
        "شناسنامه با موفقیت برای مدیر ارسال شد."
      );

      await loadProfiles();

    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "ارسال شناسنامه برای مدیر انجام نشد."
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <main
      className="
        min-h-screen
        min-w-0
        w-full
        overflow-x-hidden
        bg-gray-50
        px-4 py-8
      "
      dir="rtl"
    >
      <section
        className="
          mx-auto
          min-w-0
          w-full
          max-w-7xl
        "
      >
        {/* عنوان صفحه */}
        <header className="mb-6">
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-11 w-11
                items-center
                justify-center
                rounded-xl
                bg-blue-100
                text-[#007fcf]
              "
            >
              <FileText size={23} />
            </div>

            <div>
              <h1
                className="
                  text-2xl
                  font-bold
                  text-gray-800
                "
              >
                لیست شناسنامه‌ها
              </h1>

              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >
                شناسنامه‌های صادرشده برنامه‌ها
              </p>
            </div>
          </div>
        </header>


        {/* بخش فیلترها */}
        <section
          className="
            mb-6
            rounded-2xl
            border
            border-gray-200
            bg-white
            p-5
            shadow-sm
          "
        >
          <div
            className="
              mb-5
              flex
              flex-wrap
              items-center
              justify-between
              gap-3
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
                font-bold
                text-gray-800
              "
            >
              <Filter
                size={20}
                className="text-[#007fcf]"
              />

              فیلتر شناسنامه‌ها
            </div>

            <div className="text-xs text-gray-500">
              {filteredProfiles.length.toLocaleString("fa-IR")} نتیجه از{" "}
              {profiles.length.toLocaleString("fa-IR")} شناسنامه
            </div>
          </div>


          {/* فیلترهای اصلی */}
          <div
            className="
              grid
              grid-cols-1
              gap-4
              sm:grid-cols-2
              lg:grid-cols-5
              lg:items-end
            "
          >
            <div>
              <label className={labelClass}>
                نام برنامه
              </label>

              <select
                value={filters.program}
                onChange={(event) =>
                  updateFilter(
                    "program",
                    event.target.value
                  )
                }
                className={selectClass}
                disabled={programsLoading}
              >
                <option value="">
                  همه برنامه‌ها
                </option>

                {programOptions.map((program) => (
                  <option
                    key={program.key}
                    value={program.key}
                  >
                    {program.name}
                  </option>
                ))}
              </select>
            </div>


            <div>
              <label className={labelClass}>
                از تاریخ پخش
              </label>

              <DatePicker
                value={fromDate}
                onChange={(value) => {
                  setFromDate(
                    value instanceof DateObject
                      ? value
                      : null
                  );
                }}
                calendar={persian}
                locale={persianFa}
                format="YYYY/MM/DD"
                calendarPosition="bottom-right"
                placeholder="انتخاب تاریخ شروع"
                inputClass={dateInputClass}
                containerClassName="w-full"
              />
            </div>


            <div>
              <label className={labelClass}>
                تا تاریخ پخش
              </label>

              <DatePicker
                value={toDate}
                onChange={(value) => {
                  setToDate(
                    value instanceof DateObject
                      ? value
                      : null
                  );
                }}
                calendar={persian}
                locale={persianFa}
                format="YYYY/MM/DD"
                calendarPosition="bottom-right"
                placeholder="انتخاب تاریخ پایان"
                inputClass={dateInputClass}
                containerClassName="w-full"
              />
            </div>


            <div>
              <label className={labelClass}>
                وضعیت
              </label>

              <select
                value={filters.status}
                onChange={(event) =>
                  updateFilter(
                    "status",
                    event.target.value
                  )
                }
                className={selectClass}
              >
                <option value="">
                  همه وضعیت‌ها
                </option>

                {statusOptions.map((status) => (
                  <option
                    key={status.value}
                    value={status.value}
                  >
                    {status.label}
                  </option>
                ))}
              </select>
            </div>


            <button
              type="button"
              onClick={() =>
                setShowMoreFilters((previous) => !previous)
              }
              className="
                flex
                h-11
                items-center
                justify-center
                gap-2
                rounded-lg
                border
                border-blue-200
                bg-blue-50
                px-4
                font-semibold
                text-[#007fcf]
                transition
                hover:bg-blue-100
              "
              aria-expanded={showMoreFilters}
            >
              <ChevronDown
                size={18}
                className={
                  showMoreFilters
                    ? "rotate-180 transition-transform"
                    : "transition-transform"
                }
              />

              {showMoreFilters
                ? "بستن فیلترهای بیشتر"
                : "فیلترهای بیشتر"}
            </button>
          </div>


          {/* فیلترهای تکمیلی */}
          {showMoreFilters && (
            <div
              className="
                mt-5
                border-t
                border-gray-100
                pt-5
              "
            >
              <div
                className="
                  mb-4
                  text-sm
                  font-bold
                  text-gray-700
                "
              >
                فیلتر بر اساس سایر ستون‌ها
              </div>

              <div
                className="
                  grid
                  grid-cols-1
                  gap-4
                  sm:grid-cols-2
                  lg:grid-cols-4
                "
              >
                <FilterInput
                  label="موضوع اصلی"
                  placeholder="جستجو در موضوع اصلی"
                  value={filters.mainTopic}
                  onChange={(value) =>
                    updateFilter("mainTopic", value)
                  }
                />

                <FilterInput
                  label="مدت"
                  placeholder="مثلاً ۳۰"
                  value={filters.duration}
                  onChange={(value) =>
                    updateFilter("duration", value)
                  }
                />

                <FilterInput
                  label="ساعت شروع"
                  placeholder="مثلاً ۲۰:۳۰"
                  value={filters.startTime}
                  onChange={(value) =>
                    updateFilter("startTime", value)
                  }
                />

                <FilterInput
                  label="نحوه تولید"
                  placeholder="جستجو در نحوه تولید"
                  value={filters.productionMethod}
                  onChange={(value) =>
                    updateFilter("productionMethod", value)
                  }
                />

                <FilterInput
                  label="مناسبت"
                  placeholder="جستجو در مناسبت"
                  value={filters.occasion}
                  onChange={(value) =>
                    updateFilter("occasion", value)
                  }
                />

                <FilterInput
                  label="طبقه"
                  placeholder="جستجو در طبقه"
                  value={filters.floorName}
                  onChange={(value) =>
                    updateFilter("floorName", value)
                  }
                />

                <FilterInput
                  label="درجه"
                  placeholder="جستجو در درجه"
                  value={filters.programDegreeName}
                  onChange={(value) =>
                    updateFilter("programDegreeName", value)
                  }
                />

                <FilterInput
                  label="ساختار"
                  placeholder="جستجو در ساختار"
                  value={filters.programStructureName}
                  onChange={(value) =>
                    updateFilter("programStructureName", value)
                  }
                />
              </div>
            </div>
          )}


          {/* دکمه‌های اعمال و حذف فیلتر */}
          <div
            className="
              mt-5
              flex
              flex-wrap
              items-center
              justify-end
              gap-3
              border-t
              border-gray-100
              pt-5
            "
          >
            <button
              type="button"
              onClick={handleResetFilters}
              className="
                flex
                h-10
                items-center
                justify-center
                gap-2
                rounded-lg
                border
                border-gray-300
                bg-white
                px-4
                text-sm
                font-semibold
                text-gray-700
                transition
                hover:bg-gray-50
              "
            >
              <RotateCcw size={17} />

              حذف همه فیلترها
            </button>

            <button
              type="button"
              onClick={handleApplyFilters}
              className="
                flex
                h-10
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-[#007fcf]
                px-5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-[#006bab]
              "
            >
              <Search size={17} />

              اعمال فیلتر تاریخ
            </button>
          </div>
        </section>


        {/* پیام خطا */}
        {error && (
          <div
            role="alert"
            className="
              mb-6
              flex
              items-start
              gap-3
              rounded-xl
              border
              border-red-200
              bg-red-50
              p-4
              text-red-700
            "
          >
            <AlertCircle
              size={21}
              className="shrink-0"
            />

            {error}
          </div>
        )}


        {/* پیام موفقیت */}
        {successMessage && (
          <div
            role="status"
            className="
              mb-6
              flex
              items-start
              gap-3
              rounded-xl
              border
              border-green-200
              bg-green-50
              p-4
              text-green-700
            "
          >
            <CheckCircle2
              size={21}
              className="shrink-0"
            />

            {successMessage}
          </div>
        )}


        {/* جدول شناسنامه‌ها */}
        <section
          className="
            min-w-0
            w-full
            overflow-hidden
            rounded-2xl
            border
            border-gray-200
            bg-white
            shadow-sm
          "
        >
          {isLoading ? (
            <div
              className="
                flex
                min-h-64
                items-center
                justify-center
                gap-3
                text-gray-600
              "
            >
              <LoaderCircle
                size={24}
                className="animate-spin"
              />

              در حال دریافت تمام شناسنامه‌ها...
            </div>
          ) : profiles.length === 0 ? (
            <div
              className="
                flex
                min-h-64
                items-center
                justify-center
                text-gray-500
              "
            >
              شناسنامه‌ای دریافت نشد.
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div
              className="
                flex
                min-h-64
                flex-col
                items-center
                justify-center
                gap-3
                text-gray-500
              "
            >
              <Search
                size={30}
                className="text-gray-300"
              />

              <p>
                با فیلترهای انتخاب‌شده شناسنامه‌ای پیدا نشد.
              </p>

              <button
                type="button"
                onClick={handleResetFilters}
                className="
                  text-sm
                  font-semibold
                  text-[#007fcf]
                  hover:underline
                "
              >
                حذف فیلترها
              </button>
            </div>
          ) : (
            <div
              className="
                block
                min-w-0
                w-full
                overflow-x-auto
                overscroll-x-contain
              "
            >
              <table
                className="
                  w-full
                  min-w-[1250px]
                  table-fixed
                  border-collapse
                "
              >
                <colgroup>
                  <col className="w-[4%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                  <col className="w-[8%]" />
                  <col className="w-[6%]" />
                  <col className="w-[7%]" />
                  <col className="w-[7%]" />
                  <col className="w-[7%]" />
                  <col className="w-[6%]" />
                  <col className="w-[6%]" />
                  <col className="w-[7%]" />
                  <col className="w-[10%]" />
                  <col className="w-[6%]" />
                </colgroup>

                <thead>
                  <tr
                    className="
                      bg-gray-50
                      text-right
                      text-sm
                      text-gray-600
                    "
                  >
                    <th className={headerClass}>
                      ردیف
                    </th>

                    <th className={headerClass}>
                      نام برنامه
                    </th>

                    <th className={headerClass}>
                      موضوع اصلی
                    </th>

                    <th className={headerClass}>
                      تاریخ پخش
                    </th>

                    <th className={headerClass}>
                      مدت
                    </th>

                    <th className={headerClass}>
                      ساعت شروع
                    </th>

                    <th className={headerClass}>
                      نحوه تولید
                    </th>

                    <th className={headerClass}>
                      مناسبت
                    </th>

                    <th className={headerClass}>
                      طبقه
                    </th>

                    <th className={headerClass}>
                      درجه
                    </th>

                    <th className={headerClass}>
                      ساختار
                    </th>

                    <th className={headerClass}>
                      وضعیت
                    </th>

                    <th className={headerClass}>
                      عملیات
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {pageProfiles.map(
                    (profile, index) => (
                      <tr
                        key={profile.id}
                        className="
                          border-t
                          border-gray-200
                          text-sm
                          transition
                          hover:bg-blue-50/40
                        "
                      >
                        <td className={cellClass}>
                          {(currentPage - 1) *
                            PAGE_SIZE +
                            index +
                            1}
                        </td>

                        <td
                          className="
                            px-3 py-4
                            align-middle
                            text-sm
                            text-gray-700
                          "
                        >
                          <span
                            className="
                              block
                              overflow-hidden
                              text-ellipsis
                              break-words
                              whitespace-normal
                              leading-6
                              line-clamp-2
                            "
                          >
                            <ProgramName
                              planId={profile.planId}
                              networkId={profile.networkId}
                              fallback={
                                profile.planId
                                  ? `برنامه شماره ${profile.planId}`
                                  : "—"
                              }
                            />
                          </span>
                        </td>

                        <td
                          className={`
                            ${cellClass}
                            max-w-xs
                            font-semibold
                            text-gray-800
                          `}
                        >
                          {profile.mainTopic}
                        </td>

                        <td className={cellClass}>
                          {formatPersianDate(
                            profile.broadcastDate
                          )}
                        </td>

                        <td
                          className={cellClass}
                          dir="ltr"
                        >
                          {profile.duration}
                        </td>

                        <td
                          className={cellClass}
                          dir="ltr"
                        >
                          {profile.startTime}
                        </td>

                        <td className={cellClass}>
                          {profile.productionMethod}
                        </td>

                        <td className={cellClass}>
                          {profile.occasion}
                        </td>

                        <td className={cellClass}>
                          {profile.floorName}
                        </td>

                        <td className={cellClass}>
                          {profile.programDegreeName}
                        </td>

                        <td className={cellClass}>
                          {profile.programStructureName}
                        </td>

                        <td className={cellClass}>
                          <span
                            className={getStatusBadgeClass(
                              profile.status
                            )}
                          >
                            {getProfileStatusTitle(
                              profile
                            )}
                          </span>
                        </td>

                        <td className={cellClass}>
                          <div
                            ref={
                              openMenuId === profile.id
                                ? menuContainerRef
                                : null
                            }
                            className="relative"
                            onMouseDown={(event) =>
                              event.stopPropagation()
                            }
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSuccessMessage("");

                                setOpenMenuId(
                                  (previous) =>
                                    previous === profile.id
                                      ? null
                                      : profile.id
                                );
                              }}
                              className="
                                inline-flex
                                h-9 w-9
                                items-center
                                justify-center
                                rounded-lg
                                text-gray-500
                                transition
                                hover:bg-blue-50
                                hover:text-[#007fcf]
                              "
                              aria-label="نمایش عملیات شناسنامه"
                              aria-expanded={
                                openMenuId === profile.id
                              }
                            >
                              <MoreVertical size={20} />
                            </button>

                            {openMenuId === profile.id && (
                              <div
                                className={`
                                  absolute
                                  left-0
                                  z-40
                                  w-48
                                  overflow-hidden
                                  rounded-xl
                                  border
                                  border-gray-200
                                  bg-white
                                  py-1
                                  shadow-xl
                                  ${
                                    index >=
                                    pageProfiles.length - 2
                                      ? "bottom-full mb-1"
                                      : "top-full mt-1"
                                  }
                                `}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleViewProfile(
                                      profile.id
                                    )
                                  }
                                  className="
                                    flex
                                    w-full
                                    items-center
                                    gap-2
                                    px-4 py-2.5
                                    text-right
                                    text-sm
                                    text-gray-700
                                    transition
                                    hover:bg-blue-50
                                    hover:text-[#007fcf]
                                  "
                                >
                                  <Eye size={17} />

                                  مشاهده
                                </button>

                                {canSubmitProfile(profile) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setError("");
                                      setSuccessMessage("");
                                      setSubmitProfile(profile);
                                    }}
                                    className="
                                      flex
                                      w-full
                                      items-center
                                      gap-2
                                      px-4 py-2.5
                                      text-right
                                      text-sm
                                      text-[#007fcf]
                                      transition
                                      hover:bg-blue-50
                                    "
                                  >
                                    <Send size={17} />

                                    ارسال برای مدیر گروه
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}


          {/* صفحه‌بندی محلی */}
          {!isLoading &&
            filteredProfiles.length > 0 &&
            totalPages > 1 && (
              <footer
                className="
                  flex
                  flex-col
                  items-center
                  justify-between
                  gap-3
                  border-t
                  border-gray-200
                  px-5 py-4
                  sm:flex-row
                "
              >
                <p className="text-sm text-gray-500">
                  تعداد کل نتایج:

                  <span
                    className="
                      mr-1
                      font-bold
                      text-gray-700
                    "
                  >
                    {filteredProfiles.length.toLocaleString("fa-IR")}
                  </span>
                </p>

                <div
                  className="
                    flex
                    flex-wrap
                    items-center
                    gap-2
                  "
                >
                  <button
                    type="button"
                    disabled={!pagination.hasPrevious}
                    onClick={() =>
                      setCurrentPage((previous) =>
                        Math.max(previous - 1, 1)
                      )
                    }
                    className={paginationButtonClass}
                  >
                    قبلی
                  </button>

                  {getVisiblePageNumbers(
                    currentPage,
                    totalPages
                  ).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() =>
                        setCurrentPage(pageNumber)
                      }
                      aria-current={
                        pageNumber === currentPage
                          ? "page"
                          : undefined
                      }
                      className={
                        pageNumber === currentPage
                          ? activePaginationButtonClass
                          : paginationButtonClass
                      }
                    >
                      {pageNumber.toLocaleString("fa-IR")}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={!pagination.hasNext}
                    onClick={() =>
                      setCurrentPage((previous) =>
                        previous + 1
                      )
                    }
                    className={paginationButtonClass}
                  >
                    بعدی
                  </button>
                </div>
              </footer>
            )}
        </section>
      </section>


      {/* پنجره تأیید ارسال برای مدیر */}
      {submitProfile && (
        <div
          className="
            fixed
            inset-0
            z-[80]
            flex
            items-center
            justify-center
            bg-black/50
            p-4
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-profile-title"
          onMouseDown={() => {
            if (!isSubmitting) {
              setSubmitProfile(null);
            }
          }}
        >
          <div
            className="
              w-full
              max-w-md
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-6
              shadow-2xl
            "
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div
              className="
                flex
                items-start
                justify-between
                gap-4
              "
            >
              <div>
                <h2
                  id="submit-profile-title"
                  className="
                    text-lg
                    font-bold
                    text-gray-800
                  "
                >
                  ارسال شناسنامه برای مدیر
                </h2>

                <p
                  className="
                    mt-2
                    text-sm
                    leading-7
                    text-gray-500
                  "
                >
                  آیا از ارسال شناسنامه موضوع

                  <span
                    className="
                      mx-1
                      font-bold
                      text-gray-700
                    "
                  >
                    {submitProfile.mainTopic}
                  </span>

                  برای مدیر اطمینان دارید؟
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSubmitProfile(null)
                }
                disabled={isSubmitting}
                className="
                  rounded-lg
                  p-2
                  text-gray-400
                  transition
                  hover:bg-gray-100
                  hover:text-gray-700
                  disabled:opacity-40
                "
                aria-label="بستن پنجره"
              >
                <X size={20} />
              </button>
            </div>

            <div
              className="
                mt-6
                flex
                items-center
                justify-between
                gap-3
                border-t
                border-gray-200
                pt-5
              "
            >
                <button
                  type="button"
                  onClick={() =>
                    setSubmitProfile(null)
                  }
                  disabled={isSubmitting}
                  className="
                    rounded-lg
                    border
                    border-gray-300
                    bg-white
                    px-5 py-2.5
                    font-semibold
                    text-gray-700
                    transition
                    hover:bg-gray-50
                    disabled:opacity-40
                  "
                >
                  خیر
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void handleSubmitForReview()
                  }
                  disabled={isSubmitting}
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-lg
                    bg-[#007fcf]
                    px-5 py-2.5
                    font-semibold
                    text-white
                    transition
                    hover:bg-[#006bab]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {isSubmitting ? (
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <Send size={18} />
                  )}

                  {isSubmitting
                    ? "در حال ارسال..."
                    : "بله، ارسال شود"}
                </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}


/* --------------------------------
   فیلتر ورودی متنی
--------------------------------- */

interface FilterInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

function FilterInput({
  label,
  placeholder,
  value,
  onChange,
}: FilterInputProps) {
  return (
    <div>
      <label className={labelClass}>
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className={filterInputClass}
      />
    </div>
  );
}


/* --------------------------------
   نرمال‌سازی پاسخ API
--------------------------------- */

function normalizeListResponse(
  value: unknown,
  requestedPage: number,
  headerPagination: unknown = null
): ProgramProfileListResponse | null {
  const rawItems = findProfilesArray(value);

  if (!rawItems) {
    return null;
  }

  const items = rawItems.filter(
    isProgramProfile
  );

  const bodyPagination =
    findPaginationData(value);

  return {
    items,
    pagination: normalizePagination(
      bodyPagination ?? headerPagination,
      items.length,
      requestedPage
    ),
  };
}


function findProfilesArray(
  value: unknown,
  depth = 0
): unknown[] | null {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    !isRecord(value) ||
    depth > 4
  ) {
    return null;
  }

  const possibleFields = [
    "items",
    "Items",
    "profiles",
    "Profiles",
    "data",
    "Data",
    "result",
    "Result",
  ];

  for (const field of possibleFields) {
    const nestedValue = value[field];

    if (Array.isArray(nestedValue)) {
      return nestedValue;
    }

    const nestedArray = findProfilesArray(
      nestedValue,
      depth + 1
    );

    if (nestedArray) {
      return nestedArray;
    }
  }

  return null;
}


function findPaginationData(
  value: unknown,
  depth = 0
): unknown | null {
  if (
    !isRecord(value) ||
    depth > 4
  ) {
    return null;
  }

  const directPagination =
    value.pagination ??
    value.Pagination ??
    value.paging ??
    value.Paging ??
    value.pageInfo ??
    value.PageInfo ??
    value.meta ??
    value.Meta ??
    value.metadata ??
    value.Metadata;

  if (isRecord(directPagination)) {
    return directPagination;
  }

  if (hasPaginationFields(value)) {
    return value;
  }

  for (const field of [
    "data",
    "Data",
    "result",
    "Result",
  ]) {
    const nestedPagination =
      findPaginationData(
        value[field],
        depth + 1
      );

    if (nestedPagination) {
      return nestedPagination;
    }
  }

  return null;
}


function hasPaginationFields(
  value: Record<string, unknown>
): boolean {
  return (
    value.totalCount !== undefined ||
    value.TotalCount !== undefined ||
    value.totalRecords !== undefined ||
    value.TotalRecords !== undefined ||
    value.totalItems !== undefined ||
    value.TotalItems !== undefined ||
    value.totalPages !== undefined ||
    value.TotalPages !== undefined ||
    value.pageCount !== undefined ||
    value.PageCount !== undefined ||
    value.pageNumber !== undefined ||
    value.PageNumber !== undefined ||
    value.currentPage !== undefined ||
    value.CurrentPage !== undefined
  );
}


/* --------------------------------
   نام و شناسه برنامه
--------------------------------- */

function getProgramKey(
  networkId: unknown,
  planId: unknown
): string {
  const normalizedNetworkId =
    readNumericValue(networkId);

  const normalizedPlanId =
    readNumericValue(planId);

  if (
    normalizedNetworkId === null ||
    normalizedPlanId === null
  ) {
    return "";
  }

  return `${normalizedNetworkId}:${normalizedPlanId}`;
}


/* --------------------------------
   تاریخ
--------------------------------- */

function convertPersianDateToGregorian(
  value: DateObject
): string {
  return new DateObject(value)
    .convert(gregorian, gregorianEn)
    .format("YYYY-MM-DD");
}


function getComparableDate(
  value: string
): string {
  if (!value) {
    return "";
  }

  const normalized = normalizeDigits(value);

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function formatPersianDate(
  value: string
): string {
  const date = new Date(
    normalizeDigits(value)
  );

  if (
    Number.isNaN(date.getTime())
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "fa-IR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(date);
}


/* --------------------------------
   فیلتر متن و اعداد
--------------------------------- */

function includesText(
  source: unknown,
  search: string
): boolean {
  if (!search.trim()) {
    return true;
  }

  const normalizedSource =
    normalizeSearchText(source);

  const normalizedSearch =
    normalizeSearchText(search);

  return normalizedSource.includes(
    normalizedSearch
  );
}


function normalizeSearchText(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return normalizeDigits(String(value))
    .trim()
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .replace(/\s+/g, " ");
}


function normalizeDigits(
  value: string
): string {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

  return value
    .replace(
      /[۰-۹]/g,
      (digit) =>
        String(
          persianDigits.indexOf(digit)
        )
    )
    .replace(
      /[٠-٩]/g,
      (digit) =>
        String(
          arabicDigits.indexOf(digit)
        )
    );
}


function readNumericValue(
  value: unknown
): number | null {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string" &&
          value.trim()
        ? Number(
            normalizeDigits(value)
          )
        : Number.NaN;

  return Number.isFinite(numericValue)
    ? numericValue
    : null;
}


/* --------------------------------
   صفحه‌بندی
--------------------------------- */

function normalizePagination(
  value: unknown,
  itemCount: number,
  requestedPage: number
): ProgramProfilePagination {
  const hasPossibleNextPage =
    itemCount >= PAGE_SIZE;

  const minimumKnownTotal =
    (requestedPage - 1) * PAGE_SIZE +
    itemCount;

  const defaultPagination: ProgramProfilePagination = {
    currentPage: requestedPage,
    pageSize: PAGE_SIZE,
    totalCount:
      minimumKnownTotal +
      (hasPossibleNextPage ? 1 : 0),
    totalPages:
      itemCount === 0
        ? Math.max(requestedPage - 1, 0)
        : requestedPage +
          (hasPossibleNextPage ? 1 : 0),
    hasPrevious: requestedPage > 1,
    hasNext: hasPossibleNextPage,
  };

  if (!isRecord(value)) {
    return defaultPagination;
  }

  const currentPage =
    readNumber(value.currentPage) ??
    readNumber(value.CurrentPage) ??
    readNumber(value.pageNumber) ??
    readNumber(value.PageNumber) ??
    defaultPagination.currentPage;

  const pageSize =
    readNumber(value.pageSize) ??
    readNumber(value.PageSize) ??
    defaultPagination.pageSize;

  const totalCount =
    readNumber(value.totalCount) ??
    readNumber(value.TotalCount) ??
    readNumber(value.totalRecords) ??
    readNumber(value.TotalRecords) ??
    readNumber(value.totalItems) ??
    readNumber(value.TotalItems) ??
    defaultPagination.totalCount;

  const totalPages =
    readNumber(value.totalPages) ??
    readNumber(value.TotalPages) ??
    readNumber(value.pageCount) ??
    readNumber(value.PageCount) ??
    (
      totalCount > 0
        ? Math.ceil(totalCount / pageSize)
        : 0
    );

  return {
    currentPage,
    pageSize,
    totalCount,
    totalPages,

    hasPrevious:
      readBoolean(
        value.hasPrevious ??
        value.HasPrevious ??
        value.hasPreviousPage ??
        value.HasPreviousPage
      ) ?? currentPage > 1,

    hasNext:
      readBoolean(
        value.hasNext ??
        value.HasNext ??
        value.hasNextPage ??
        value.HasNextPage
      ) ?? currentPage < totalPages,
  };
}


function getVisiblePageNumbers(
  currentPage: number,
  totalPages: number
): number[] {
  const firstPage = Math.max(
    1,
    Math.min(
      currentPage - 2,
      totalPages - 4
    )
  );

  const lastPage = Math.min(
    totalPages,
    firstPage + 4
  );

  return Array.from(
    {
      length: Math.max(
        lastPage - firstPage + 1,
        0
      ),
    },
    (_, index) => firstPage + index
  );
}


function readNumber(
  value: unknown
): number | null {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string" &&
          value.trim()
        ? Number(
            normalizeDigits(value.trim())
          )
        : Number.NaN;

  return Number.isFinite(numericValue)
    ? numericValue
    : null;
}


function readBoolean(
  value: unknown
): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value
      .trim()
      .toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return null;
}


/* --------------------------------
   پاسخ JSON و خطا
--------------------------------- */

function parseJsonResponse(
  responseText: string
): unknown | null {
  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return null;
  }
}


function getErrorMessage(
  value: unknown
): string | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.message === "string") {
    return value.message;
  }

  if (typeof value.description === "string") {
    return value.description;
  }

  return null;
}


/* --------------------------------
   شناسنامه
--------------------------------- */

function isProgramProfile(
  value: unknown
): value is ProgramProfileResponse {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.mainTopic === "string" &&
    typeof value.broadcastDate === "string"
  );
}


/* --------------------------------
   وضعیت ارسال شناسنامه
--------------------------------- */

function canSubmitProfile(
  profile: ProgramProfileResponse
): boolean {
  const normalizedStatus =
    normalizeProfileStatus(profile.status);

  const isDraftStatus =
    normalizedStatus === "draft" ||
    normalizedStatus === "draftatprovider";

  const isReturnedStatus =
    normalizedStatus === "returnedforedit";

  if (
    isDraftStatus ||
    isReturnedStatus
  ) {
    return true;
  }

  const normalizedDisplayName =
    normalizePersianStatusTitle(
      profile.statusDisplayName
    );

  return (
    normalizedDisplayName.startsWith(
      "پیش نویس"
    ) ||
    normalizedDisplayName.includes(
      "بازگشت برای اصلاح"
    ) ||
    normalizedDisplayName.includes(
      "برگشت برای اصلاح"
    )
  );
}


function normalizeProfileStatus(
  status: unknown
): string {
  if (typeof status !== "string") {
    return "";
  }

  return status
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");
}


function normalizePersianStatusTitle(
  value: unknown
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .replace(/\u200c/g, " ")
    .replace(/\s+/g, " ");
}


const PROFILE_STATUS_TITLES:
  Record<ProgramProfileStatus, string> = {
    0: "پیش‌نویس",
    10: "در انتظار مدیر گروه",
    20: "در انتظار ناظر",
    30: "در انتظار مدیر پخش",
    40: "در انتظار مدیر طرح و برنامه",
    50: "تأیید نهایی",
    60: "بازگشت برای اصلاح",
  };


function getProfileStatusTitle(
  profile: ProgramProfileResponse
): string {
  const backendTitle =
    typeof profile.statusDisplayName === "string"
      ? profile.statusDisplayName.trim()
      : "";

  return (
    backendTitle ||
    PROFILE_STATUS_TITLES[profile.status] ||
    "نامشخص"
  );
}


function getStatusBadgeClass(
  status: ProgramProfileStatus
): string {
  const baseClass =
    "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold";

  switch (status) {
    case 0:
      return `${baseClass} bg-gray-100 text-gray-700`;

    case 60:
      return `${baseClass} bg-red-100 text-red-700`;

    case 50:
      return `${baseClass} bg-green-100 text-green-700`;

    case 10:
    case 20:
    case 30:
    case 40:
      return `${baseClass} bg-amber-100 text-amber-800`;

    default:
      return `${baseClass} bg-gray-100 text-gray-700`;
  }
}


/* --------------------------------
   بررسی Object
--------------------------------- */

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}


/* --------------------------------
   کلاس‌های ظاهری
--------------------------------- */

const labelClass = `
  mb-2
  block
  text-sm
  font-semibold
  text-gray-700
`;

const dateInputClass = `
  h-11
  w-full
  rounded-lg
  border
  border-gray-300
  bg-white
  px-3
  text-right
  outline-none
  transition
  focus:border-[#007fcf]
  focus:ring-2
  focus:ring-blue-100
`;

const selectClass = `
  h-11
  w-full
  rounded-lg
  border
  border-gray-300
  bg-white
  px-3
  text-sm
  text-gray-700
  outline-none
  transition
  focus:border-[#007fcf]
  focus:ring-2
  focus:ring-blue-100
  disabled:cursor-not-allowed
  disabled:bg-gray-100
`;

const filterInputClass = `
  h-11
  w-full
  rounded-lg
  border
  border-gray-300
  bg-white
  px-3
  text-sm
  text-gray-700
  outline-none
  transition
  placeholder:text-gray-400
  focus:border-[#007fcf]
  focus:ring-2
  focus:ring-blue-100
`;

const headerClass = `
  whitespace-nowrap
  px-4 py-4
  font-semibold
`;

const cellClass = `
  whitespace-nowrap
  px-4 py-4
  text-gray-600
`;

const paginationButtonClass = `
  rounded-lg
  border
  border-gray-300
  px-4 py-2
  text-sm
  font-semibold
  text-gray-700
  transition
  hover:bg-gray-50
  disabled:cursor-not-allowed
  disabled:opacity-40
`;

const activePaginationButtonClass = `
  rounded-lg
  border
  border-[#007fcf]
  bg-[#007fcf]
  px-4 py-2
  text-sm
  font-semibold
  text-white
`;
