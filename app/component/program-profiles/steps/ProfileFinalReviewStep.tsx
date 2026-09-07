"use client";

import {
  useState,
} from "react";

import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Save,
  X,
} from "lucide-react";

import type {
  ReactNode,
} from "react";

import type {
  IssueProgramProfileRequest,
  ProgramProfileWizardData,
  UpdateProfileExpertsRequest,
} from "@/app/types/program-profile";


interface ProfileFinalReviewStepProps {
  wizardData:
    ProgramProfileWizardData;

  onBack:
    () => void;

  /*
   * بازگشت مستقیم به یک مرحله
   */
  onEditStep: (
    step: number
  ) => void;

  /*
   * پس از صدور کامل شناسنامه
   */
  onSuccess: (
    profileId: string
  ) => void;
}


export default function ProfileFinalReviewStep({
  wizardData,
  onBack,
  onEditStep,
  onSuccess,
}: ProfileFinalReviewStepProps) {
  const [
    isConfirmOpen,
    setIsConfirmOpen,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  /*
   * اگر صدور اصلی موفق شد ولی ثبت
   * کارشناسان خطا داد، شناسه نگهداری
   * می‌شود تا Issue دوباره اجرا نشود.
   */
  const [
    issuedProfileId,
    setIssuedProfileId,
  ] = useState<string | null>(
    null
  );


  const specifications =
    wizardData.specifications;


  async function handleIssueSubmit() {
    if (isSubmitting) {
      return;
    }


    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");
    setIsConfirmOpen(false);


    try {
      /*
       * اگر قبلاً شناسنامه صادر نشده،
       * ابتدا عملیات Issue اجرا می‌شود.
       */
      let profileId =
        issuedProfileId;


      if (!profileId) {
        const issueBody =
          buildIssueRequest(
            wizardData
          );


        const issueResponse =
          await fetch(
            "/api/program-profiles/issue",
            {
              method:
                "POST",

              headers: {
                Accept:
                  "application/json",

                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  issueBody
                ),

              cache:
                "no-store",
            }
          );


        const issueResponseText =
          await issueResponse.text();


        const issueResponseData =
          parseJsonResponse(
            issueResponseText
          );


        if (!issueResponse.ok) {
          throw new Error(
            getErrorMessage(
              issueResponseData
            ) ??
            (
              "صدور شناسنامه انجام نشد. " +
              "کد پاسخ: " +
              issueResponse.status
            )
          );
        }


        profileId =
          extractProfileId(
            issueResponseData
          );


        if (!profileId) {
          throw new Error(
            "شناسنامه صادر شد، اما شناسه آن در پاسخ سرور پیدا نشد."
          );
        }


        /*
         * نگهداری شناسه برای جلوگیری
         * از Issue تکراری
         */
        setIssuedProfileId(
          profileId
        );
      }


      /*
       * اگر برنامه کارشناس دارد،
       * فهرست کارشناسان با Endpoint
       * جداگانه ثبت می‌شود.
       */
      if (
        specifications.hasExpert
      ) {
        const expertsBody:
          UpdateProfileExpertsRequest = {
          profileId,

          experts:
            wizardData.experts.map(
              (expert) => ({
                expertId:
                  expert.expertId,

                topicAxisId:
                  expert.topicAxisId,

                duration:
                  normalizeDigits(
                    expert.duration
                  ),

                attendanceType:
                  expert.attendanceType,

                hasPayment:
                  expert.hasPayment,
              })
            ),
        };


        const expertsResponse =
          await fetch(
            "/api/program-profiles/experts",
            {
              method:
                "PUT",

              headers: {
                Accept:
                  "application/json",

                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  expertsBody
                ),

              cache:
                "no-store",
            }
          );


        const expertsResponseText =
          await expertsResponse.text();


        const expertsResponseData =
          parseJsonResponse(
            expertsResponseText
          );


        if (!expertsResponse.ok) {
          throw new Error(
            getErrorMessage(
              expertsResponseData
            ) ??
            (
              "شناسنامه صادر شد، اما ثبت کارشناسان انجام نشد. " +
              "کد پاسخ: " +
              expertsResponse.status
            )
          );
        }
      }


      setSuccessMessage(
        "شناسنامه با موفقیت صادر شد."
      );


      /*
       * نمایش کوتاه پیام موفقیت
       * و سپس بستن Modal
       */
      window.setTimeout(
        () => {
          onSuccess(
            profileId
          );
        },
        1200
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "صدور شناسنامه انجام نشد."
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <>
      <section
        className="
          rounded-xl
          border border-gray-200
          bg-white
          p-5
          shadow-sm
        "
        dir="rtl"
      >
        <header
          className="
            mb-6
            border-b
            border-gray-200
            pb-4
          "
        >
          <h2
            className="
              text-lg
              font-bold
              text-gray-800
            "
          >
            بازبینی و صدور شناسنامه
          </h2>

          <p
            className="
              mt-1
              text-sm
              text-gray-500
            "
          >
            اطلاعات واردشده را بررسی و در صورت صحت، شناسنامه را صادر کنید.
          </p>
        </header>


        {/* مشخصات برنامه */}
        <ReviewSection
          title="مشخصات برنامه"
          onEdit={() =>
            onEditStep(1)
          }
        >
          <div
            className="
              grid
              grid-cols-1
              gap-4
              md:grid-cols-2
              lg:grid-cols-3
            "
          >
            <ReviewItem
              label="نام برنامه"
              value={
                specifications
                  .programName
              }
            />

            <ReviewItem
              label="موضوع برنامه"
              value={
                specifications
                  .mainTopic
              }
            />

            <ReviewItem
              label="شماره قسمت"
              value={
                specifications
                  .episodeNumber !==
                null
                  ? toPersianNumber(
                      specifications
                        .episodeNumber
                    )
                  : "—"
              }
            />

            <ReviewItem
              label="تاریخ پخش"
              value={
                specifications
                  .broadcastDateJalali ||
                formatJalaliDate(
                  specifications
                    .broadcastDate
                )
              }
            />

            <ReviewItem
              label="مدت برنامه"
              value={
                toPersianNumber(
                  specifications.duration
                )
              }
            />

            <ReviewItem
              label="ساعت شروع"
              value={
                toPersianNumber(
                  specifications.startTime
                )
              }
            />

            <ReviewItem
              label="نحوه تولید"
              value={
                specifications
                  .productionMethod
              }
            />

            <ReviewItem
              label="مناسبت"
              value={
                specifications
                  .occasion
              }
            />

            <ReviewItem
              label="طبقه برنامه"
              value={
                specifications
                  .floorName
              }
            />

            <ReviewItem
              label="درجه برنامه"
              value={
                specifications
                  .programDegreeName
              }
            />

            <ReviewItem
              label="ساختار برنامه"
              value={
                specifications
                  .programStructureName
              }
            />

            <ReviewItem
              label="دارای کارشناس"
              value={
                specifications
                  .hasExpert
                  ? "بله"
                  : "خیر"
              }
            />
          </div>
        </ReviewSection>


        {/* عوامل برنامه */}
        <ReviewSection
          title="عوامل برنامه"
          onEdit={() =>
            onEditStep(2)
          }
        >
          <div
            className="
              overflow-x-auto
              rounded-lg
              border border-gray-200
            "
          >
            <table
              className="
                w-full
                min-w-[650px]
                text-sm
              "
            >
              <thead className="bg-gray-50">
                <tr>
                  <TableHeader>
                    ردیف
                  </TableHeader>

                  <TableHeader align="right">
                    نام پرسنل
                  </TableHeader>

                  <TableHeader align="right">
                    نوع فعالیت
                  </TableHeader>

                  <TableHeader>
                    حضور
                  </TableHeader>
                </tr>
              </thead>

              <tbody>
                {wizardData
                  .crewMembers
                  .map(
                    (
                      member,
                      index
                    ) => (
                      <tr
                        key={
                          `${member.personnelId}-${member.activityTypeId}-${index}`
                        }
                        className="
                          border-t
                          border-gray-100
                        "
                      >
                        <TableCell>
                          {toPersianNumber(
                            index + 1
                          )}
                        </TableCell>

                        <TableCell align="right">
                          {
                            member.personnelName
                          }
                        </TableCell>

                        <TableCell align="right">
                          {
                            member.activityTypeName
                          }
                        </TableCell>

                        <TableCell>
                          {member.isPresent
                            ? "بله"
                            : "خیر"}
                        </TableCell>
                      </tr>
                    )
                  )}


                {wizardData
                  .crewMembers
                  .length === 0 && (
                  <EmptyRow
                    colSpan={4}
                    message="عاملی در شناسنامه وجود ندارد."
                  />
                )}
              </tbody>
            </table>
          </div>
        </ReviewSection>


        {/* آیتم‌های برنامه */}
        <ReviewSection
          title="آیتم‌های برنامه"
          onEdit={() =>
            onEditStep(3)
          }
        >
          <div
            className="
              overflow-x-auto
              rounded-lg
              border border-gray-200
            "
          >
            <table
              className="
                w-full
                min-w-[650px]
                text-sm
              "
            >
              <thead className="bg-gray-50">
                <tr>
                  <TableHeader>
                    ردیف
                  </TableHeader>

                  <TableHeader align="right">
                    عنوان آیتم
                  </TableHeader>

                  <TableHeader align="right">
                    نوع تولید
                  </TableHeader>

                  <TableHeader>
                    مدت
                  </TableHeader>
                </tr>
              </thead>

              <tbody>
                {wizardData.items.map(
                  (
                    item,
                    index
                  ) => (
                    <tr
                      key={
                        `${item.itemName}-${index}`
                      }
                      className="
                        border-t
                        border-gray-100
                      "
                    >
                      <TableCell>
                        {toPersianNumber(
                          index + 1
                        )}
                      </TableCell>

                      <TableCell align="right">
                        {
                          item.itemName
                        }
                      </TableCell>

                      <TableCell align="right">
                        {
                          item.productionType
                        }
                      </TableCell>

                      <TableCell>
                        {toPersianNumber(
                          item.duration
                        )}
                      </TableCell>
                    </tr>
                  )
                )}


                {wizardData.items
                  .length === 0 && (
                  <EmptyRow
                    colSpan={4}
                    message="آیتمی در شناسنامه وجود ندارد."
                  />
                )}
              </tbody>
            </table>
          </div>
        </ReviewSection>


        {/* کارشناسان */}
        <ReviewSection
          title="کارشناسان برنامه"
          onEdit={() =>
            onEditStep(4)
          }
        >
          {!specifications
            .hasExpert ? (
            <p
              className="
                rounded-lg
                bg-gray-50
                p-4
                text-sm
                text-gray-500
              "
            >
              این برنامه کارشناس ندارد.
            </p>
          ) : (
            <div
              className="
                overflow-x-auto
                rounded-lg
                border border-gray-200
              "
            >
              <table
                className="
                  w-full
                  min-w-[850px]
                  text-sm
                "
              >
                <thead className="bg-gray-50">
                  <tr>
                    <TableHeader>
                      ردیف
                    </TableHeader>

                    <TableHeader align="right">
                      نام کارشناس
                    </TableHeader>

                    <TableHeader align="right">
                      محور موضوعی
                    </TableHeader>

                    <TableHeader>
                      مدت
                    </TableHeader>

                    <TableHeader>
                      نحوه حضور
                    </TableHeader>

                    <TableHeader>
                      هزینه
                    </TableHeader>
                  </tr>
                </thead>

                <tbody>
                  {wizardData.experts.map(
                    (
                      expert,
                      index
                    ) => (
                      <tr
                        key={
                          `${expert.expertId}-${expert.topicAxisId}-${index}`
                        }
                        className="
                          border-t
                          border-gray-100
                        "
                      >
                        <TableCell>
                          {toPersianNumber(
                            index + 1
                          )}
                        </TableCell>

                        <TableCell align="right">
                          {
                            `${expert.firstName} ${expert.lastName}`
                              .trim()
                          }
                        </TableCell>

                        <TableCell align="right">
                          {
                            expert.topicAxisTitle
                          }
                        </TableCell>

                        <TableCell>
                          {toPersianNumber(
                            expert.duration
                          )}
                        </TableCell>

                        <TableCell>
                          {
                            getAttendanceTitle(
                              expert
                                .attendanceType
                            )
                          }
                        </TableCell>

                        <TableCell>
                          {expert.hasPayment
                            ? "دارد"
                            : "ندارد"}
                        </TableCell>
                      </tr>
                    )
                  )}


                  {wizardData.experts
                    .length === 0 && (
                    <EmptyRow
                      colSpan={6}
                      message="کارشناسی انتخاب نشده است."
                    />
                  )}
                </tbody>
              </table>
            </div>
          )}
        </ReviewSection>


        {/* خطا */}
        {error && (
          <div
            className="
              mt-6
              rounded-xl
              border border-red-200
              bg-red-50
              px-4 py-3
              text-sm
              leading-7
              text-red-700
            "
          >
            {error}

            {issuedProfileId && (
              <p className="mt-2 font-semibold">
                شناسنامه اصلی صادر شده است؛ با زدن مجدد دکمه، فقط ثبت کارشناسان تکرار می‌شود.
              </p>
            )}
          </div>
        )}


        {/* موفقیت */}
        {successMessage && (
          <div
            className="
              mt-6
              flex
              items-center
              gap-3
              rounded-xl
              border border-green-200
              bg-green-50
              px-4 py-4
              font-semibold
              text-green-700
            "
          >
            <CheckCircle2
              size={22}
            />

            {successMessage}
          </div>
        )}


        {/* عملیات */}
        <footer
          className="
            mt-8
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
            onClick={
              onBack
            }
            disabled={
              isSubmitting
            }
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              border border-gray-300
              bg-white
              px-5 py-2.5
              font-semibold
              text-gray-700
              transition
              hover:bg-gray-50
              disabled:opacity-50
            "
          >
            <ArrowRight
              size={18}
            />

            مرحله قبل
          </button>


          <button
            type="button"
            onClick={() =>
              setIsConfirmOpen(
                true
              )
            }
            disabled={
              isSubmitting ||
              Boolean(
                successMessage
              )
            }
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              bg-green-600
              px-6 py-2.5
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-green-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {isSubmitting ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />

                در حال ثبت...
              </>
            ) : (
              <>
                <Save size={18} />

                {issuedProfileId
                  ? "تکمیل ثبت کارشناسان"
                  : "صدور شناسنامه"}
              </>
            )}
          </button>
        </footer>
      </section>


      {/* تأیید صدور */}
      {isConfirmOpen && (
        <div
          className="
            fixed inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/45
            p-4
          "
          dir="rtl"
        >
          <div
            className="
              w-full
              max-w-md
              rounded-2xl
              bg-white
              p-6
              shadow-2xl
            "
          >
            <header
              className="
                flex
                items-start
                justify-between
                gap-4
              "
            >
              <div>
                <h3
                  className="
                    text-lg
                    font-bold
                    text-gray-800
                  "
                >
                  تأیید صدور شناسنامه
                </h3>

                <p
                  className="
                    mt-3
                    text-sm
                    leading-7
                    text-gray-600
                  "
                >
                  آیا از صحت اطلاعات و صدور شناسنامه این برنامه مطمئن هستید؟
                </p>
              </div>


              <button
                type="button"
                onClick={() =>
                  setIsConfirmOpen(
                    false
                  )
                }
                className="
                  rounded-lg
                  p-2
                  text-gray-400
                  hover:bg-gray-100
                "
              >
                <X size={20} />
              </button>
            </header>


            <div
              className="
                mt-6
                flex
                items-center
                justify-between
                gap-3
              "
            >
              {/* خیر سمت راست */}
              <button
                type="button"
                onClick={() =>
                  setIsConfirmOpen(
                    false
                  )
                }
                className="
                  rounded-lg
                  border border-gray-300
                  bg-white
                  px-5 py-2.5
                  text-gray-700
                  hover:bg-gray-50
                "
              >
                خیر
              </button>


            
              <button
                type="button"
                onClick={
                  handleIssueSubmit
                }
                className="
                  rounded-lg
                  bg-green-600
                  px-5 py-2.5
                  font-semibold
                  text-white
                  hover:bg-green-700
                "
              >
                بله، صادر شود
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


/*
 * ساخت Payload صدور شناسنامه
 */
function buildIssueRequest(
  wizardData:
    ProgramProfileWizardData
): IssueProgramProfileRequest {
  const data =
    wizardData.specifications;


  if (
    data.floorId === null ||
    data.programDegreeId ===
      null ||
    data.programStructureId ===
      null
  ) {
    throw new Error(
      "اطلاعات طبقه، درجه یا ساختار برنامه کامل نیست."
    );
  }


  return {
    forecastId:
      data.forecastId,

    planId:
      data.planId,

    networkId:
      data.networkId,

    networkGroupId:
      data.networkGroupId,

    duration:
      normalizeDigits(
        data.duration
      ),

    broadcastDate:
      normalizeDigits(
        data.broadcastDate
      ),

    productionMethod:
      data.productionMethod
        .trim(),

    occasion:
      data.occasion.trim(),

    floorId:
      data.floorId,

    floorName:
      data.floorName.trim(),

    programDegreeId:
      data.programDegreeId,

    programDegreeName:
      data.programDegreeName
        .trim(),

    programStructureId:
      data.programStructureId,

    programStructureName:
      data.programStructureName
        .trim(),

    startTime:
      normalizeDigits(
        data.startTime
      ),

    crewMembers:
      wizardData.crewMembers.map(
        (member) => ({
          personnelId:
            member.personnelId,

          personnelName:
            member.personnelName
              .trim(),

          activityTypeId:
            member.activityTypeId,

          activityTypeName:
            member.activityTypeName
              .trim(),

          isPresent:
            member.isPresent,
        })
      ),

    items:
      wizardData.items.map(
        (item) => ({
          itemName:
            item.itemName.trim(),

          productionType:
            item.productionType
              .trim(),

          duration:
            normalizeDigits(
              item.duration
            ),
        })
      ),
  };
}


/*
 * استخراج شناسه شناسنامه
 * از پاسخ Route داخلی
 */
function extractProfileId(
  value: unknown
): string | null {
  if (!isRecord(value)) {
    return null;
  }


  if (
    typeof value.id ===
      "string" &&
    value.id.trim()
  ) {
    return value.id;
  }


  const candidates = [
    value.profile,
    value.data,
    value.result,
  ];


  for (
    const candidate of
    candidates
  ) {
    if (
      isRecord(candidate) &&
      typeof candidate.id ===
        "string" &&
      candidate.id.trim()
    ) {
      return candidate.id;
    }
  }


  return null;
}


/*
 * بخش بازبینی
 */
function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title:
    string;

  onEdit:
    () => void;

  children:
    ReactNode;
}) {
  return (
    <section
      className="
        mb-6
        rounded-xl
        border border-gray-200
        p-4
      "
    >
      <header
        className="
          mb-4
          flex
          items-center
          justify-between
          border-b
          border-gray-200
          pb-3
        "
      >
        <h3
          className="
            font-bold
            text-gray-800
          "
        >
          {title}
        </h3>

        <button
          type="button"
          onClick={
            onEdit
          }
          className="
            text-sm
            font-semibold
            text-[#007fcf]
            hover:underline
          "
        >
          ویرایش
        </button>
      </header>

      {children}
    </section>
  );
}


function ReviewItem({
  label,
  value,
}: {
  label:
    string;

  value:
    string | number;
}) {
  return (
    <div>
      <p
        className="
          text-xs
          text-gray-500
        "
      >
        {label}
      </p>

      <p
        className="
          mt-2
          min-h-10
          rounded-lg
          bg-gray-50
          p-3
          text-sm
          font-semibold
          text-gray-800
        "
      >
        {value || "—"}
      </p>
    </div>
  );
}


function TableHeader({
  children,
  align = "center",
}: {
  children:
    ReactNode;

  align?:
    "right" | "center";
}) {
  return (
    <th
      className={`
        whitespace-nowrap
        px-4 py-3
        font-bold
        ${
          align === "right"
            ? "text-right"
            : "text-center"
        }
      `}
    >
      {children}
    </th>
  );
}


function TableCell({
  children,
  align = "center",
}: {
  children:
    ReactNode;

  align?:
    "right" | "center";
}) {
  return (
    <td
      className={`
        whitespace-nowrap
        px-4 py-3
        ${
          align === "right"
            ? "text-right"
            : "text-center"
        }
      `}
    >
      {children}
    </td>
  );
}


function EmptyRow({
  colSpan,
  message,
}: {
  colSpan:
    number;

  message:
    string;
}) {
  return (
    <tr>
      <td
        colSpan={
          colSpan
        }
        className="
          p-8
          text-center
          text-gray-500
        "
      >
        {message}
      </td>
    </tr>
  );
}


function getAttendanceTitle(
  value: number
): string {
  const titles:
    Record<number, string> = {
    1: "حضوری",
    2: "تلفنی",
    3: "تولیدی (ضبط‌شده)",
    4: "محل کار",
  };


  return (
    titles[value] ??
    "نامشخص"
  );
}


function formatJalaliDate(
  value: string
): string {
  const date =
    new Date(
      normalizeDigits(value)
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }


  return new Intl.DateTimeFormat(
    "fa-IR-u-ca-persian",
    {
      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit",

      timeZone:
        "UTC",
    }
  ).format(date);
}


function getErrorMessage(
  value: unknown
): string | null {
  if (!isRecord(value)) {
    return null;
  }


  const fields = [
    "message",
    "description",
    "detail",
    "title",
  ];


  for (const field of fields) {
    const fieldValue =
      value[field];


    if (
      typeof fieldValue ===
        "string" &&
      fieldValue.trim()
    ) {
      return fieldValue;
    }
  }


  return null;
}


function parseJsonResponse(
  value: string
): unknown | null {
  if (!value.trim()) {
    return null;
  }


  try {
    return JSON.parse(
      value
    ) as unknown;
  } catch {
    return null;
  }
}


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


function toPersianNumber(
  value: string | number
): string {
  return String(value).replace(
    /\d/g,
    (digit) =>
      "۰۱۲۳۴۵۶۷۸۹"[
        Number(digit)
      ]
  );
}


function normalizeDigits(
  value: string
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