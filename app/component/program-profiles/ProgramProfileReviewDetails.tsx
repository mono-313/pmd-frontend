"use client";



import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  LoaderCircle,
  RotateCcw,
  Users,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import type {
  ProgramProfileResponse,
} from "@/app/types/program-profile";


import ProgramProfileSupervisorComments from
  "@/app/component/program-profiles/ProgramProfileSupervisorComments";


interface ProgramProfileReviewDetailsProps {
  profileId:
    string;
}


interface StoredUserSession {
  roles?: unknown;
  profileRole?: unknown;
  profile_role?: unknown;
}


interface ActionAccess {
  canApprove:
    boolean;

  canReturn:
    boolean;

  isSupervisorStage:
    boolean;
}


export default function ProgramProfileReviewDetails({
  profileId,
}: ProgramProfileReviewDetailsProps) {
  const router =
    useRouter();

  const [
    profile,
    setProfile,
  ] = useState<
    ProgramProfileResponse | null
  >(null);

  const [
    roles,
    setRoles,
  ] = useState<string[]>([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    reason,
    setReason,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  useEffect(() => {
    setRoles(
      readStoredRoles()
    );
  }, []);


  const loadProfile =
    useCallback(
      async () => {
        try {
          setIsLoading(true);
          setError("");

          const response =
            await fetch(
              `/api/program-profiles/${encodeURIComponent(
                profileId
              )}`,
              {
                method:
                  "GET",

                headers: {
                  Accept:
                    "application/json",
                },

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
              getErrorMessage(
                responseData
              ) ??
                (
                  "دریافت اطلاعات شناسنامه انجام نشد. " +
                  `کد پاسخ: ${response.status}`
                )
            );
          }

          const normalizedProfile =
            extractProfile(
              responseData
            );

          if (!normalizedProfile) {
            console.error(
              "Invalid program profile details response:",
              {
                responseData,
                responseText,
              }
            );

            throw new Error(
              "ساختار پاسخ شناسنامه معتبر نیست."
            );
          }

          setProfile(
            normalizedProfile
          );
        } catch (loadError) {
          setProfile(null);

          setError(
            loadError instanceof Error
              ? loadError.message
              : "دریافت اطلاعات شناسنامه انجام نشد."
          );
        } finally {
          setIsLoading(false);
        }
      },
      [
        profileId,
      ]
    );


  useEffect(() => {
    void loadProfile();
  }, [
    loadProfile,
  ]);


  const actionAccess =
    useMemo(
      () =>
        profile
          ? getActionAccess(
              profile,
              roles
            )
          : {
              canApprove:
                false,

              canReturn:
                false,

              isSupervisorStage:
                false,
            },
      [
        profile,
        roles,
      ]
    );


  async function sendAction(
    action:
      "approve" |
      "return"
  ) {
    if (
      !profile ||
      isSubmitting
    ) {
      return;
    }

    const normalizedReason =
      reason.trim();

    if (
      action === "return" &&
      !normalizedReason
    ) {
      setError(
        "وارد کردن دلیل بازگشت الزامی است."
      );

      return;
    }

    const confirmationText =
      action === "approve"
        ? "آیا از تأیید این مرحله از شناسنامه اطمینان دارید؟"
        : "آیا از بازگرداندن این شناسنامه اطمینان دارید؟";

    if (
      !window.confirm(
        confirmationText
      )
    ) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setSuccessMessage("");

      const response =
        await fetch(
          `/api/program-profiles/${encodeURIComponent(
            profile.id
          )}/${action}`,
          {
            method:
              "POST",

            headers: {
              Accept:
                "application/json",

              ...(action ===
              "return"
                ? {
                    "Content-Type":
                      "application/json",
                  }
                : {}),
            },

            body:
              action ===
              "return"
                ? JSON.stringify({
                    reason:
                      normalizedReason,
                  })
                : undefined,

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
          getErrorMessage(
            responseData
          ) ??
            (
              "عملیات شناسنامه انجام نشد. " +
              `کد پاسخ: ${response.status}`
            )
        );
      }

      setSuccessMessage(
        getString(
          isRecord(
            responseData
          )
            ? responseData.message
            : null
        ) ??
          (
            action ===
              "approve"
              ? "مرحله جاری با موفقیت تأیید شد."
              : "شناسنامه با موفقیت بازگردانده شد."
          )
      );

      setReason("");

      /*
       * آیتم پس از عملیات دیگر متعلق به
       * کارتابل مرحله فعلی نیست.
       */
      window.setTimeout(
        () => {
          router.push(
            "/program-profiles/review"
          );

          router.refresh();
        },
        700
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "عملیات شناسنامه انجام نشد."
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  if (isLoading) {
    return (
      <main
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-gray-50
        "
        dir="rtl"
      >
        <div
          className="
            flex
            items-center
            gap-3
            text-gray-500
          "
        >
          <LoaderCircle
            size={23}
            className="animate-spin"
          />

          در حال دریافت شناسنامه...
        </div>
      </main>
    );
  }


  if (
    !profile
  ) {
    return (
      <main
        className="
          min-h-screen
          bg-gray-50
          px-4
          py-8
        "
        dir="rtl"
      >
        <section
          className="
            mx-auto
            max-w-4xl
            rounded-2xl
            border
            border-red-200
            bg-red-50
            p-6
          "
        >
          <div
            className="
              flex
              items-start
              gap-3
              text-red-700
            "
          >
            <AlertCircle
              size={22}
              className="mt-0.5"
            />

            <div>
              <h1
                className="
                  text-lg
                  font-bold
                "
              >
                نمایش شناسنامه امکان‌پذیر نیست
              </h1>

              <p
                className="
                  mt-2
                  text-sm
                "
              >
                {error ||
                  "اطلاعات شناسنامه پیدا نشد."}
              </p>

              <Link
                href="/program-profiles/review"
                className="
                  mt-4
                  inline-flex
                  rounded-lg
                  border
                  border-red-300
                  bg-white
                  px-4
                  py-2
                  text-sm
                "
              >
                بازگشت به کارتابل
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }


  const crewMembers =
    profile.crewMembers ?? [];

  const items =
    profile.items ?? [];

  const experts =
    profile.experts ?? [];


  return (
    <main
      className="
        min-h-screen
        bg-gray-50
        px-4
        py-8
      "
      dir="rtl"
    >
      <section
        className="
          mx-auto
          w-full
          max-w-7xl
        "
      >
        <header
          className="
            mb-6
            flex
            flex-wrap
            items-center
            justify-between
            gap-4
          "
        >
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
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-blue-100
                text-[#007fcf]
              "
            >
              <ClipboardCheck
                size={23}
              />
            </div>

            <div>
              <h1
                className="
                  text-2xl
                  font-bold
                  text-gray-800
                "
              >
                بررسی شناسنامه برنامه
              </h1>

              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >
                مشاهده اطلاعات و انجام عملیات مرحله جاری
              </p>
            </div>
          </div>

          <Link
            href="/program-profiles/review"
            className="
              flex
              items-center
              gap-2
              rounded-xl
              border
              border-gray-300
              bg-white
              px-4
              py-2.5
              text-sm
              text-gray-700
              transition
              hover:border-[#007fcf]
              hover:text-[#007fcf]
            "
          >
            <ArrowRight
              size={18}
            />

            بازگشت به کارتابل
          </Link>
        </header>


        {error && (
          <MessageBox
            variant="error"
            message={error}
          />
        )}

        {successMessage && (
          <MessageBox
            variant="success"
            message={
              successMessage
            }
          />
        )}


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
            <h2
              className="
                text-lg
                font-bold
                text-gray-800
              "
            >
              مشخصات شناسنامه
            </h2>

            <StatusBadge
              profile={profile}
            />
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
            <InfoField
              title="نام برنامه"
              value={
                profile.programName ||
                `برنامه شماره ${profile.planId}`
              }
            />

            <InfoField
              title="موضوع اصلی"
              value={
                profile.mainTopic
              }
            />

            <InfoField
              title="نوع برنامه"
              value={
                profile.programTypeName ||
                getProgramTypeName(
                  profile.programType
                )
              }
            />

            <InfoField
              title="مدت برنامه"
              value={
                profile.duration
              }
            />

            <InfoField
              title="تاریخ پخش"
              value={
                formatPersianDate(
                  profile.broadcastDate
                )
              }
            />

            <InfoField
              title="ساعت شروع"
              value={
                profile.startTime
              }
            />

            <InfoField
              title="روش تولید"
              value={
                profile.productionMethod
              }
            />

            <InfoField
              title="مناسبت"
              value={
                profile.occasion
              }
            />

            <InfoField
              title="طبقه"
              value={
                profile.floorName
              }
            />

            <InfoField
              title="درجه برنامه"
              value={
                profile.programDegreeName
              }
            />

            <InfoField
              title="ساختار برنامه"
              value={
                profile.programStructureName
              }
            />

            <InfoField
              title="صادرکننده"
              value={
                profile.createdByUserName
              }
            />
          </div>
        </section>


        <DataSection
          title="عوامل برنامه"
          icon={
            <Users size={20} />
          }
          emptyMessage="عاملی برای این شناسنامه ثبت نشده است."
        >
          {crewMembers.length >
          0 && (
            <div
              className="overflow-x-auto"
            >
              <table
                className="
                  w-full
                  min-w-[700px]
                  text-sm
                "
              >
                <thead
                  className="
                    bg-gray-50
                    text-gray-600
                  "
                >
                  <tr>
                    <th className="px-4 py-3 text-right">
                      ردیف
                    </th>

                    <th className="px-4 py-3 text-right">
                      نام عامل
                    </th>

                    <th className="px-4 py-3 text-right">
                      نوع فعالیت
                    </th>

                    <th className="px-4 py-3 text-right">
                      وضعیت حضور
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {crewMembers.map(
                    (
                      crew,
                      index
                    ) => (
                      <tr
                        key={
                          crew.id ??
                          index
                        }
                        className="
                          border-t
                          border-gray-100
                        "
                      >
                        <td className="px-4 py-3">
                          {index + 1}
                        </td>

                        <td className="px-4 py-3">
                          {crew.personnelName ||
                            "—"}
                        </td>

                        <td className="px-4 py-3">
                          {crew.activityTypeName ||
                            "—"}
                        </td>

                        <td className="px-4 py-3">
                          {crew.isPresent
                            ? "حاضر"
                            : "غایب"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </DataSection>


        <DataSection
          title="آیتم‌های برنامه"
          emptyMessage="آیتمی برای این شناسنامه ثبت نشده است."
        >
          {items.length >
          0 && (
            <div
              className="overflow-x-auto"
            >
              <table
                className="
                  w-full
                  min-w-[700px]
                  text-sm
                "
              >
                <thead
                  className="
                    bg-gray-50
                    text-gray-600
                  "
                >
                  <tr>
                    <th className="px-4 py-3 text-right">
                      ردیف
                    </th>

                    <th className="px-4 py-3 text-right">
                      عنوان آیتم
                    </th>

                    <th className="px-4 py-3 text-right">
                      نوع تولید
                    </th>

                    <th className="px-4 py-3 text-right">
                      مدت
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.map(
                    (
                      item,
                      index
                    ) => (
                      <tr
                        key={
                          item.id ??
                          index
                        }
                        className="
                          border-t
                          border-gray-100
                        "
                      >
                        <td className="px-4 py-3">
                          {index + 1}
                        </td>

                        <td className="px-4 py-3">
                          {item.itemName ||
                            "—"}
                        </td>

                        <td className="px-4 py-3">
                          {item.productionType ||
                            "—"}
                        </td>

                        <td className="px-4 py-3">
                          {item.duration ||
                            "—"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </DataSection>


        {profile.hasExpert && (
          <DataSection
            title="کارشناسان برنامه"
            emptyMessage="کارشناسی برای این شناسنامه ثبت نشده است."
          >
            {experts.length >
            0 && (
              <div
                className="overflow-x-auto"
              >
                <table
                  className="
                    w-full
                    min-w-[800px]
                    text-sm
                  "
                >
                  <thead
                    className="
                      bg-gray-50
                      text-gray-600
                    "
                  >
                    <tr>
                      <th className="px-4 py-3 text-right">
                        ردیف
                      </th>

                      <th className="px-4 py-3 text-right">
                        شناسه کارشناس
                      </th>

                      <th className="px-4 py-3 text-right">
                        محور موضوعی
                      </th>

                      <th className="px-4 py-3 text-right">
                        مدت حضور
                      </th>

                      <th className="px-4 py-3 text-right">
                        نحوه حضور
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {experts.map(
                      (
                        expert,
                        index
                      ) => (
                        <tr
                          key={
                            expert.id ??
                            index
                          }
                          className="
                            border-t
                            border-gray-100
                          "
                        >
                          <td className="px-4 py-3">
                            {index + 1}
                          </td>

                          <td className="px-4 py-3">
                            {expert.expertId}
                          </td>

                          <td className="px-4 py-3">
                            {expert.topicAxisId}
                          </td>

                          <td className="px-4 py-3">
                            {expert.duration}
                          </td>

                          <td className="px-4 py-3">
                            {getAttendanceTitle(
                              expert.attendanceType
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </DataSection>
        )}

        <ProgramProfileSupervisorComments
          profileId={
            profile.id
          }
          status={
            profile.status
          }
          programType={
            profile.programType
          }
        />


        <section
          className="
            rounded-2xl
            border
            border-gray-200
            bg-white
            p-5
            shadow-sm
          "
        >
          <h2
            className="
              text-lg
              font-bold
              text-gray-800
            "
          >
            عملیات مرحله جاری
          </h2>

          {actionAccess.canReturn && (
            <div
              className="mt-5"
            >
              <label
                htmlFor="return-reason"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-gray-700
                "
              >
                دلیل بازگشت
              </label>

              <textarea
                id="return-reason"
                value={reason}
                onChange={(
                  event
                ) =>
                  setReason(
                    event.target.value
                  )
                }
                rows={4}
                disabled={
                  isSubmitting
                }
                placeholder="دلیل بازگشت شناسنامه را به‌صورت کامل وارد کنید."
                className="
                  w-full
                  resize-y
                  rounded-xl
                  border
                  border-gray-300
                  p-3
                  text-sm
                  outline-none
                  transition
                  focus:border-[#007fcf]
                  disabled:bg-gray-100
                "
              />
            </div>
          )}


          {actionAccess.isSupervisorStage && (
            <div
              className="
                mt-4
                rounded-xl
                border
                border-blue-200
                bg-blue-50
                p-4
                text-sm
                text-blue-700
              "
            >
              طبق گردش‌کار، ناظر فقط می‌تواند شناسنامه را تأیید کند؛ بازگشت از مرحله ناظر مجاز نیست.
            </div>
          )}


          {!actionAccess.canApprove &&
            !actionAccess.canReturn && (
              <div
                className="
                  mt-4
                  rounded-xl
                  border
                  border-gray-200
                  bg-gray-50
                  p-4
                  text-sm
                  text-gray-600
                "
              >
                با نقش فعلی، عملیاتی برای این مرحله در دسترس نیست.
              </div>
            )}


          <div
            className="
              mt-5
              flex
              flex-wrap
              gap-3
            "
          >
            {actionAccess.canApprove && (
              <button
                type="button"
                disabled={
                  isSubmitting
                }
                onClick={() =>
                  void sendAction(
                    "approve"
                  )
                }
                className="
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-green-600
                  px-5
                  py-2.5
                  text-sm
                  font-medium
                  text-white
                  transition
                  hover:bg-green-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {isSubmitting
                  ? (
                      <LoaderCircle
                        size={18}
                        className="animate-spin"
                      />
                    )
                  : (
                      <CheckCircle2
                        size={18}
                      />
                    )}

                تأیید مرحله
              </button>
            )}

            {actionAccess.canReturn && (
              <button
                type="button"
                disabled={
                  isSubmitting
                }
                onClick={() =>
                  void sendAction(
                    "return"
                  )
                }
                className="
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-amber-500
                  px-5
                  py-2.5
                  text-sm
                  font-medium
                  text-white
                  transition
                  hover:bg-amber-600
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <RotateCcw
                  size={18}
                />

                بازگشت شناسنامه
              </button>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}


function getActionAccess(
  profile:
    ProgramProfileResponse,

  roles:
    readonly string[]
): ActionAccess {
  const normalizedRoles =
    new Set(
      roles.map(
        normalizeRoleName
      )
    );

  const isAdmin =
    normalizedRoles.has(
      "admin"
    );

  if (
    profile.status ===
      "PendingGroupManager"
  ) {
    const allowed =
      isAdmin ||
      normalizedRoles.has(
        "networkgroupmanager"
      ) ||
      normalizedRoles.has(
        "networkgroup"
      );

    return {
      canApprove:
        allowed,

      canReturn:
        allowed,

      isSupervisorStage:
        false,
    };
  }

  if (
    profile.status ===
      "PendingSupervisor"
  ) {
    const isLiveProgram =
      Number(
        profile.programType
      ) === 10;

    const allowed =
      isAdmin ||
      (
        isLiveProgram &&
        normalizedRoles.has(
          "livesupervisor"
        )
      ) ||
      (
        !isLiveProgram &&
        normalizedRoles.has(
          "supervisor"
        )
      );

    return {
      canApprove:
        allowed,

      /*
       * بازگشت در مرحله ناظر ممنوع است.
       */
      canReturn:
        false,

      isSupervisorStage:
        allowed,
    };
  }

  if (
    profile.status ===
      "PendingBroadcastManager"
  ) {
    const allowed =
      isAdmin ||
      normalizedRoles.has(
        "broadcastmanager"
      );

    return {
      canApprove:
        allowed,

      canReturn:
        allowed,

      isSupervisorStage:
        false,
    };
  }

  if (
    profile.status ===
      "PendingPlanningManager"
  ) {
    const allowed =
      isAdmin ||
      normalizedRoles.has(
        "planmanager"
      );

    return {
      canApprove:
        allowed,

      canReturn:
        allowed,

      isSupervisorStage:
        false,
    };
  }

  return {
    canApprove:
      false,

    canReturn:
      false,

    isSupervisorStage:
      false,
  };
}


function InfoField({
  title,
  value,
}: {
  title:
    string;

  value:
    unknown;
}) {
  const normalizedValue =
    value === null ||
    value === undefined ||
    value === ""
      ? "—"
      : String(
          value
        );

  return (
    <div
      className="
        rounded-xl
        bg-gray-50
        p-4
      "
    >
      <p
        className="
          text-xs
          text-gray-500
        "
      >
        {title}
      </p>

      <p
        className="
          mt-2
          text-sm
          font-medium
          text-gray-800
        "
      >
        {normalizedValue}
      </p>
    </div>
  );
}


function DataSection({
  title,
  icon,
  emptyMessage,
  children,
}: {
  title:
    string;

  icon?:
    React.ReactNode;

  emptyMessage:
    string;

  children:
    React.ReactNode;
}) {
  const hasContent =
    Boolean(
      children
    );

  return (
    <section
      className="
        mb-6
        overflow-hidden
        rounded-2xl
        border
        border-gray-200
        bg-white
        shadow-sm
      "
    >
      <header
        className="
          flex
          items-center
          gap-2
          border-b
          border-gray-200
          px-5
          py-4
        "
      >
        {icon}

        <h2
          className="
            text-lg
            font-bold
            text-gray-800
          "
        >
          {title}
        </h2>
      </header>

      {hasContent
        ? children
        : (
            <p
              className="
                p-5
                text-sm
                text-gray-500
              "
            >
              {emptyMessage}
            </p>
          )}
    </section>
  );
}


function StatusBadge({
  profile,
}: {
  profile:
    ProgramProfileResponse;
}) {
  return (
    <span
      className="
        inline-flex
        rounded-full
        bg-amber-100
        px-3
        py-1.5
        text-xs
        font-medium
        text-amber-700
      "
    >
      {profile.statusDisplayName ||
        getStatusTitle(
          profile.status
        )}
    </span>
  );
}


function MessageBox({
  variant,
  message,
}: {
  variant:
    "error" |
    "success";

  message:
    string;
}) {
  const success =
    variant ===
    "success";

  return (
    <div
      className={`
        mb-5
        flex
        items-start
        gap-3
        rounded-xl
        border
        p-4
        text-sm
        ${
          success
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-red-200 bg-red-50 text-red-700"
        }
      `}
    >
      {success
        ? (
            <CheckCircle2
              size={20}
            />
          )
        : (
            <AlertCircle
              size={20}
            />
          )}

      {message}
    </div>
  );
}


function extractProfile(
  value:
    unknown
): ProgramProfileResponse | null {
  if (
    isProgramProfile(
      value
    )
  ) {
    return value;
  }

  if (
    !isRecord(
      value
    )
  ) {
    return null;
  }

  const possibleProfiles = [
    value.profile,
    value.data,
    value.result,
  ];

  for (
    const possibleProfile of
    possibleProfiles
  ) {
    if (
      isProgramProfile(
        possibleProfile
      )
    ) {
      return possibleProfile;
    }

    if (
      isRecord(
        possibleProfile
      )
    ) {
      const nestedProfile =
        extractProfile(
          possibleProfile
        );

      if (nestedProfile) {
        return nestedProfile;
      }
    }
  }

  return null;
}


function isProgramProfile(
  value:
    unknown
): value is ProgramProfileResponse {
  return (
    isRecord(
      value
    ) &&
    typeof value.id ===
      "string" &&
    typeof value.status ===
      "string"
  );
}


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

    const parsedSession =
      JSON.parse(
        storedSession
      ) as unknown;

    if (
      !isRecord(
        parsedSession
      )
    ) {
      return [];
    }

    const session =
      parsedSession as StoredUserSession;

    const roles =
      Array.isArray(
        session.roles
      )
        ? session.roles.filter(
            (
              role
            ): role is string =>
              typeof role ===
                "string" &&
              Boolean(
                role.trim()
              )
          )
        : [];

    const profileRole =
      getString(
        session.profileRole
      ) ??
      getString(
        session.profile_role
      );

    return [
      ...new Set(
        profileRole
          ? [
              ...roles,
              profileRole,
            ]
          : roles
      ),
    ];
  } catch {
    return [];
  }
}


function normalizeRoleName(
  role:
    string
): string {
  return role
    .trim()
    .toLowerCase()
    .replace(
      /[\s_-]+/g,
      ""
    );
}


function getStatusTitle(
  status:
    ProgramProfileResponse["status"]
): string {
  switch (status) {
    case "Draft":
      return "پیش‌نویس";

    case "PendingGroupManager":
      return "در انتظار مدیر گروه";

    case "PendingSupervisor":
      return "در انتظار ناظر";

    case "PendingBroadcastManager":
      return "در انتظار مدیر پخش";

    case "PendingPlanningManager":
      return "در انتظار مدیر طرح و برنامه‌ریزی";

    case "Approved":
      return "تأیید نهایی";

    case "ReturnedForEdit":
      return "بازگشت برای اصلاح";

    default:
      return String(
        status
      );
  }
}


function getProgramTypeName(
  value:
    unknown
): string {
  switch (
    Number(
      value
    )
  ) {
    case 10:
      return "زنده";

    case 20:
      return "ضبطی (تولیدی)";

    default:
      return "—";
  }
}


function getAttendanceTitle(
  value:
    unknown
): string {
  switch (
    Number(
      value
    )
  ) {
    case 1:
      return "حضوری";

    case 2:
      return "تلفنی";

    case 3:
      return "تولیدی (ضبط‌شده)";

    case 4:
      return "محل کار";

    default:
      return String(
        value ?? "—"
      );
  }
}


function formatPersianDate(
  value:
    string
): string {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      normalizeDigits(
        value
      )
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "fa-IR",
    {
      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit",
    }
  ).format(
    date
  );
}


function normalizeDigits(
  value:
    string
): string {
  const persianDigits =
    "۰۱۲۳۴۵۶۷۸۹";

  const arabicDigits =
    "٠١٢٣٤٥٦٧٨٩";

  return value
    .replace(
      /[۰-۹]/g,
      (digit) =>
        String(
          persianDigits.indexOf(
            digit
          )
        )
    )
    .replace(
      /[٠-٩]/g,
      (digit) =>
        String(
          arabicDigits.indexOf(
            digit
          )
        )
    );
}


function parseJsonResponse(
  responseText:
    string
): unknown | null {
  if (
    !responseText.trim()
  ) {
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


function getErrorMessage(
  value:
    unknown
): string | null {
  if (
    !isRecord(
      value
    )
  ) {
    return null;
  }

  return (
    getString(
      value.message
    ) ??
    getString(
      value.description
    ) ??
    getString(
      value.detail
    ) ??
    getString(
      value.title
    ) ??
    getString(
      value.errors
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
    !Array.isArray(
      value
    )
  );
}