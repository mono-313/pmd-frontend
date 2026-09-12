"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  ListVideo,
  MoreVertical,
  Trash2,
} from "lucide-react";

import type {
  ProfileItemData,
} from "@/app/types/program-profile";


interface ProfileItemsStepProps {
  /*
   * آیتم‌های موجود در FormData
   */
  items:
    ProfileItemData[];

  /*
   * ذخیره آرایه جدید در
   * FormData مرکزی
   */
  onChange: (
    items:
      ProfileItemData[]
  ) => void;

  onBack:
    () => void;

  onNext:
    () => void;
}


export default function ProfileItemsStep({
  items,
  onChange,
  onBack,
  onNext,
}: ProfileItemsStepProps) {
  /*
   * ردیفی که منوی آن باز است.
   */
  const [
    openMenuIndex,
    setOpenMenuIndex,
  ] = useState<number | null>(
    null
  );

  /*
   * ردیف انتخاب‌شده برای حذف
   */
  const [
    deletingIndex,
    setDeletingIndex,
  ] = useState<number | null>(
    null
  );

  const menuContainerRef =
    useRef<HTMLDivElement | null>(
      null
    );


  /*
   * بستن منوی سه‌نقطه
   * با کلیک بیرون از آن
   */
  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent
    ) {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current
          .contains(
            event.target as Node
          )
      ) {
        setOpenMenuIndex(null);
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
   * بازکردن پنجره تأیید حذف
   */
  function requestDelete(
    index: number
  ) {
    setDeletingIndex(
      index
    );

    setOpenMenuIndex(
      null
    );
  }


  /*
   * حذف آیتم از FormData
   */
  function confirmDelete() {
    if (
      deletingIndex === null
    ) {
      return;
    }


    const updatedItems =
      items.filter(
        (
          _item,
          itemIndex
        ) =>
          itemIndex !==
          deletingIndex
      );


    onChange(
      updatedItems
    );

    setDeletingIndex(
      null
    );
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
        {/* عنوان مرحله */}
        <header
          className="
            mb-6
            flex
            flex-wrap
            items-center
            justify-between
            gap-4
            border-b
            border-gray-200
            pb-4
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
                h-11 w-11
                items-center
                justify-center
                rounded-full
                bg-blue-50
                text-[#007fcf]
              "
            >
              <ListVideo
                size={23}
              />
            </div>


            <div>
              <h2
                className="
                  text-lg
                  font-bold
                  text-gray-800
                "
              >
                آیتم‌های برنامه
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >
                آیتم‌های دریافت‌شده از طرح برنامه را بررسی کنید.
              </p>
            </div>
          </div>


          <span
            className="
              rounded-full
              bg-blue-50
              px-3 py-1
              text-xs
              font-bold
              text-[#007fcf]
            "
          >
            {toPersianNumber(
              items.length
            )}{" "}
            آیتم
          </span>
        </header>


        {/* توضیح عملکرد حذف */}
        <div
          className="
            mb-5
            rounded-lg
            border border-blue-100
            bg-blue-50/60
            px-4 py-3
            text-sm
            leading-7
            text-blue-700
          "
        >
          حذف آیتم در این مرحله فقط آن را از شناسنامه در حال صدور حذف می‌کند و اطلاعات اصلی طرح برنامه تغییر نمی‌کند.
        </div>


        {/* جدول آیتم‌ها */}
        <div
          className="
            overflow-x-auto
            rounded-xl
            border border-gray-200
          "
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
                text-gray-700
              "
            >
              <tr>
                <th
                  className="
                    w-20
                    px-4 py-4
                    text-center
                    font-bold
                  "
                >
                  ردیف
                </th>

                <th
                  className="
                    px-4 py-4
                    text-right
                    font-bold
                  "
                >
                  عنوان آیتم
                </th>

                <th
                  className="
                    px-4 py-4
                    text-right
                    font-bold
                  "
                >
                 موضوع
                </th>

                <th
                  className="
                    px-4 py-4
                    text-center
                    font-bold
                  "
                >
                  مدت
                </th>

                <th
                  className="
                    w-24
                    px-4 py-4
                    text-center
                    font-bold
                  "
                >
                  عملیات
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
                      `${item.itemName}` +
                      `-${index}`
                    }
                    className="
                      border-t
                      border-gray-100
                      text-gray-700
                      transition
                      hover:bg-blue-50/40
                    "
                  >
                    <td
                      className="
                        px-4 py-4
                        text-center
                        text-gray-500
                      "
                    >
                      {toPersianNumber(
                        index + 1
                      )}
                    </td>


                    <td
                      className="
                        px-4 py-4
                        font-semibold
                        text-gray-800
                      "
                    >
                      {item.itemName ||
                        "—"}
                    </td>


                    <td
                      className="
                        px-4 py-4
                      "
                    >
                      {
                        item.itemSubject
                      }
                    </td>


                    <td
                      className="
                        whitespace-nowrap
                        px-4 py-4
                        text-center
                      "
                      dir="ltr"
                    >
                      {item.duration
                        ? toPersianNumber(
                            item.duration
                          )
                        : "—"}
                    </td>


                    <td
                      className="
                        px-4 py-4
                        text-center
                      "
                    >
                      <div
                        ref={
                          openMenuIndex ===
                          index
                            ? menuContainerRef
                            : undefined
                        }
                        className="
                          relative
                          inline-block
                          text-right
                        "
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuIndex(
                              (
                                previous
                              ) =>
                                previous ===
                                index
                                  ? null
                                  : index
                            )
                          }
                          className="
                            rounded-lg
                            p-2
                            text-gray-500
                            transition
                            hover:bg-gray-100
                            hover:text-gray-800
                          "
                          aria-label="عملیات آیتم"
                        >
                          <MoreVertical
                            size={19}
                          />
                        </button>


                        {openMenuIndex ===
                          index && (
                          <div
                            className="
                              absolute
                              left-0
                              top-full
                              z-30
                              mt-1
                              w-32
                              overflow-hidden
                              rounded-lg
                              border
                              border-gray-200
                              bg-white
                              py-1
                              shadow-xl
                            "
                          >
                            <button
                              type="button"
                              onClick={() =>
                                requestDelete(
                                  index
                                )
                              }
                              className="
                                flex
                                w-full
                                items-center
                                gap-2
                                px-3 py-2
                                text-sm
                                text-red-600
                                transition
                                hover:bg-red-50
                              "
                            >
                              <Trash2
                                size={16}
                              />

                              حذف
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              )}


              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="
                      px-4 py-12
                      text-center
                      text-gray-500
                    "
                  >
                    آیتمی برای این برنامه وجود ندارد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>


        {/* جمع مدت آیتم‌ها */}
        {items.length > 0 && (
          <div
            className="
              mt-4
              flex
              justify-end
            "
          >
            <div
              className="
                rounded-lg
                bg-gray-50
                px-4 py-3
                text-sm
                text-gray-600
              "
            >
              مجموع مدت آیتم‌ها:{" "}

              <strong
                className="
                  mr-1
                  text-gray-800
                "
                dir="ltr"
              >
                {toPersianNumber(
                  calculateTotalDuration(
                    items
                  )
                )}
              </strong>
            </div>
          </div>
        )}


        {/* دکمه‌های مراحل */}
        <footer
          className="
            mt-8
            flex
            flex-wrap
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
            "
          >
            <ArrowRight
              size={18}
            />

            مرحله قبل
          </button>


          <button
            type="button"
            onClick={
              onNext
            }
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              bg-[#007fcf]
              px-6 py-2.5
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-[#006daf]
            "
          >
            مرحله بعد

            <ArrowLeft
              size={18}
            />
          </button>
        </footer>
      </section>


      {/* پنجره تأیید حذف */}
      {deletingIndex !== null && (
        <div
          className="
            fixed inset-0
            z-[90]
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
            <h3
              className="
                text-lg
                font-bold
                text-gray-800
              "
            >
              حذف آیتم برنامه
            </h3>


            <p
              className="
                mt-3
                text-sm
                leading-7
                text-gray-600
              "
            >
              آیا از حذف آیتم «

              <strong>
                {
                  items[
                    deletingIndex
                  ]?.itemName
                }
              </strong>

              » از شناسنامه مطمئن هستید؟
            </p>


            <p
              className="
                mt-2
                text-xs
                leading-6
                text-gray-500
              "
            >
              این عملیات اطلاعات آیتم را از طرح اصلی برنامه حذف نمی‌کند.
            </p>


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
                  setDeletingIndex(
                    null
                  )
                }
                className="
                  rounded-lg
                  border border-gray-300
                  bg-white
                  px-5 py-2.5
                  text-gray-700
                  transition
                  hover:bg-gray-50
                "
              >
                خیر
              </button>


              {/* بله سمت چپ */}
              <button
                type="button"
                onClick={
                  confirmDelete
                }
                className="
                  rounded-lg
                  bg-red-600
                  px-5 py-2.5
                  font-semibold
                  text-white
                  transition
                  hover:bg-red-700
                "
              >
                بله، حذف شود
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


/*
 * محاسبه مجموع مدت آیتم‌ها
 *
 * ورودی:
 * 00:10:00
 * 00:20:00
 *
 * خروجی:
 * 00:30:00
 */
function calculateTotalDuration(
  items:
    ProfileItemData[]
): string {
  const totalSeconds =
    items.reduce(
      (
        sum,
        item
      ) =>
        sum +
        timeSpanToSeconds(
          item.duration
        ),
      0
    );


  return secondsToTimeSpan(
    totalSeconds
  );
}


/*
 * تبدیل hh:mm:ss به ثانیه
 */
function timeSpanToSeconds(
  value: string
): number {
  const normalizedValue =
    normalizeDigits(
      value
    );


  const parts =
    normalizedValue
      .split(":")
      .map(Number);


  if (
    parts.length !== 3 ||
    parts.some(
      (part) =>
        !Number.isFinite(part)
    )
  ) {
    return 0;
  }


  const [
    hours,
    minutes,
    seconds,
  ] = parts;


  if (
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return 0;
  }


  return (
    hours * 3600 +
    minutes * 60 +
    seconds
  );
}


/*
 * تبدیل ثانیه به hh:mm:ss
 */
function secondsToTimeSpan(
  totalSeconds: number
): string {
  const safeTotal =
    Math.max(
      0,
      Math.floor(
        totalSeconds
      )
    );


  const hours =
    Math.floor(
      safeTotal / 3600
    );

  const minutes =
    Math.floor(
      (
        safeTotal % 3600
      ) / 60
    );

  const seconds =
    safeTotal % 60;


  return [
    String(hours).padStart(
      2,
      "0"
    ),

    String(minutes).padStart(
      2,
      "0"
    ),

    String(seconds).padStart(
      2,
      "0"
    ),
  ].join(":");
}


/*
 * تبدیل عدد انگلیسی به فارسی
 */
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


/*
 * تبدیل اعداد فارسی و عربی
 * به انگلیسی
 */
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