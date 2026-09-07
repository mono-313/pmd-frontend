"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  MoreVertical,
  Pencil,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";

import type {
  ProfileCrewMemberData,
} from "@/app/types/program-profile";


/*
 * گزینه پرسنل برای Dropdown
 */
export interface PersonnelOption {
  id:
    number;

  name:
    string;
}


/*
 * گزینه نوع فعالیت
 */
export interface CrewActivityOption {
  id:
    number;

  name:
    string;
}


interface ProfileCrewStepProps {
  /*
   * عوامل موجود در FormData مرکزی
   */
  crewMembers:
    ProfileCrewMemberData[];

  /*
   * فهرست پرسنل قابل انتخاب
   */
  personnelOptions:
    PersonnelOption[];

  /*
   * فهرست انواع فعالیت
   */
  activityOptions:
    CrewActivityOption[];

  /*
   * وضعیت دریافت Dropdownها
   */
  isOptionsLoading?:
    boolean;

  /*
   * ذخیره تغییرات در FormData مرکزی
   */
  onChange: (
    crewMembers:
      ProfileCrewMemberData[]
  ) => void;

  onBack:
    () => void;

  onNext:
    () => void;
}


export default function ProfileCrewStep({
  crewMembers,
  personnelOptions,
  activityOptions,
  isOptionsLoading = false,
  onChange,
  onBack,
  onNext,
}: ProfileCrewStepProps) {
  /*
   * ردیفی که منوی سه‌نقطه آن باز است.
   */
  const [
    openMenuIndex,
    setOpenMenuIndex,
  ] = useState<number | null>(
    null
  );

  /*
   * ردیف در حال ویرایش
   */
  const [
    editingIndex,
    setEditingIndex,
  ] = useState<number | null>(
    null
  );

  /*
   * اطلاعات موقت فرم ویرایش
   */
  const [
    editingMember,
    setEditingMember,
  ] =
    useState<
      ProfileCrewMemberData | null
    >(null);

  /*
   * ردیف انتخاب‌شده برای حذف
   */
  const [
    deletingIndex,
    setDeletingIndex,
  ] = useState<number | null>(
    null
  );

  const [
    editError,
    setEditError,
  ] = useState("");

  const menuContainerRef =
    useRef<HTMLDivElement | null>(
      null
    );


  /*
   * بستن منوی سه‌نقطه با کلیک
   * بیرون از منو
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
   * باز کردن فرم ویرایش
   */
  function openEditDialog(
    member:
      ProfileCrewMemberData,

    index:
      number
  ) {
    setEditingIndex(
      index
    );

    setEditingMember({
      ...member,
    });

    setEditError("");

    setOpenMenuIndex(null);
  }


  /*
   * بستن فرم ویرایش
   */
  function closeEditDialog() {
    setEditingIndex(null);

    setEditingMember(null);

    setEditError("");
  }


  /*
   * تغییر پرسنل
   *
   * id و name هم‌زمان تغییر می‌کنند.
   */
  function handlePersonnelChange(
    personnelIdValue:
      string
  ) {
    if (!editingMember) {
      return;
    }


    const personnelId =
      Number(
        personnelIdValue
      );


    const selectedPersonnel =
      personnelOptions.find(
        (personnel) =>
          personnel.id ===
          personnelId
      );


    if (!selectedPersonnel) {
      setEditingMember({
        ...editingMember,

        personnelId: 0,

        personnelName: "",
      });

      return;
    }


    setEditingMember({
      ...editingMember,

      personnelId:
        selectedPersonnel.id,

      personnelName:
        selectedPersonnel.name,
    });


    setEditError("");
  }


  /*
   * تغییر نوع فعالیت
   *
   * id و name هم‌زمان تغییر می‌کنند.
   */
  function handleActivityChange(
    activityIdValue:
      string
  ) {
    if (!editingMember) {
      return;
    }


    const activityId =
      Number(
        activityIdValue
      );


    const selectedActivity =
      activityOptions.find(
        (activity) =>
          activity.id ===
          activityId
      );


    if (!selectedActivity) {
      setEditingMember({
        ...editingMember,

        activityTypeId: 0,

        activityTypeName: "",
      });

      return;
    }


    setEditingMember({
      ...editingMember,

      activityTypeId:
        selectedActivity.id,

      activityTypeName:
        selectedActivity.name,
    });


    setEditError("");
  }


  /*
   * ثبت تغییرات عامل
   */
  function saveEditedMember() {
    if (
      editingIndex === null ||
      !editingMember
    ) {
      return;
    }


    if (
      !Number.isInteger(
        editingMember.personnelId
      ) ||
      editingMember.personnelId <= 0 ||
      !editingMember.personnelName
        .trim()
    ) {
      setEditError(
        "انتخاب نام پرسنل الزامی است."
      );

      return;
    }


    if (
      !Number.isInteger(
        editingMember
          .activityTypeId
      ) ||
      editingMember
        .activityTypeId <= 0 ||
      !editingMember
        .activityTypeName
        .trim()
    ) {
      setEditError(
        "انتخاب نوع فعالیت الزامی است."
      );

      return;
    }


    const updatedCrewMembers =
      crewMembers.map(
        (
          member,
          memberIndex
        ) =>
          memberIndex ===
          editingIndex
            ? {
                ...editingMember,

                personnelName:
                  editingMember
                    .personnelName
                    .trim(),

                activityTypeName:
                  editingMember
                    .activityTypeName
                    .trim(),
              }
            : member
      );


    onChange(
      updatedCrewMembers
    );

    closeEditDialog();
  }


  /*
   * حذف عامل از FormData شناسنامه
   */
  function confirmDelete() {
    if (
      deletingIndex === null
    ) {
      return;
    }


    onChange(
      crewMembers.filter(
        (
          _member,
          memberIndex
        ) =>
          memberIndex !==
          deletingIndex
      )
    );


    setDeletingIndex(null);
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
              <UsersRound
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
                عوامل برنامه
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >
                عوامل دریافت‌شده از طرح برنامه را بررسی و در صورت نیاز ویرایش کنید.
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
              crewMembers.length
            )}{" "}
            عامل
          </span>
        </header>


        {/* جدول عوامل */}
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
              min-w-[760px]
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
                  نام پرسنل
                </th>

                <th
                  className="
                    px-4 py-4
                    text-right
                    font-bold
                  "
                >
                  نوع فعالیت
                </th>

                <th
                  className="
                    px-4 py-4
                    text-center
                    font-bold
                  "
                >
                  وضعیت حضور
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
              {crewMembers.map(
                (
                  member,
                  index
                ) => (
                  <tr
                    key={
                      `${member.personnelId}` +
                      `-${member.activityTypeId}` +
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
                      {
                        member
                          .personnelName
                      }
                    </td>


                    <td
                      className="
                        px-4 py-4
                      "
                    >
                      {
                        member
                          .activityTypeName
                      }
                    </td>


                    <td
                      className="
                        px-4 py-4
                        text-center
                      "
                    >
                      <span
                        className={`
                          inline-flex
                          rounded-full
                          px-3 py-1
                          text-xs
                          font-bold
                          ${
                            member.isPresent
                              ? `
                                  bg-green-100
                                  text-green-700
                                `
                              : `
                                  bg-gray-100
                                  text-gray-600
                                `
                          }
                        `}
                      >
                        {member.isPresent
                          ? "حاضر"
                          : "غایب"}
                      </span>
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
                          aria-label="عملیات عامل"
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
                              w-36
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
                                openEditDialog(
                                  member,
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
                                text-gray-700
                                hover:bg-blue-50
                                hover:text-[#007fcf]
                              "
                            >
                              <Pencil
                                size={16}
                              />

                              ویرایش
                            </button>


                            <button
                              type="button"
                              onClick={() => {
                                setDeletingIndex(
                                  index
                                );

                                setOpenMenuIndex(
                                  null
                                );
                              }}
                              className="
                                flex
                                w-full
                                items-center
                                gap-2
                                px-3 py-2
                                text-sm
                                text-red-600
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


              {crewMembers.length ===
                0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="
                      px-4 py-12
                      text-center
                      text-gray-500
                    "
                  >
                    عاملی برای این برنامه ثبت نشده است.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>


        {/* دکمه‌های جابه‌جایی */}
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


      {/* پنجره ویرایش عامل */}
      {editingMember &&
        editingIndex !== null && (
        <div
          className="
            fixed inset-0
            z-[80]
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
              max-w-xl
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
                border-b
                border-gray-200
                pb-4
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
                  ویرایش عامل برنامه
                </h3>

                <p
                  className="
                    mt-1
                    text-sm
                    text-gray-500
                  "
                >
                  اطلاعات عامل انتخاب‌شده را اصلاح کنید.
                </p>
              </div>


              <button
                type="button"
                onClick={
                  closeEditDialog
                }
                className="
                  rounded-lg
                  p-2
                  text-gray-400
                  hover:bg-gray-100
                  hover:text-gray-700
                "
                aria-label="بستن"
              >
                <X size={20} />
              </button>
            </header>


            <div
              className="
                mt-5
                grid
                grid-cols-1
                gap-5
                md:grid-cols-2
              "
            >
              {/* انتخاب پرسنل */}
              <label className="block">
                <span
                  className="
                    mb-2
                    block
                    text-sm
                    font-semibold
                    text-gray-700
                  "
                >
                  نام پرسنل

                  <span
                    className="
                      mr-1
                      text-red-500
                    "
                  >
                    *
                  </span>
                </span>


                <select
                  value={
                    editingMember
                      .personnelId ||
                    ""
                  }
                  onChange={(event) =>
                    handlePersonnelChange(
                      event.target.value
                    )
                  }
                  disabled={
                    isOptionsLoading
                  }
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    bg-white
                    px-3 py-2.5
                    outline-none
                    focus:border-[#007fcf]
                    disabled:bg-gray-100
                  "
                >
                  <option value="">
                    {isOptionsLoading
                      ? "در حال دریافت..."
                      : "انتخاب پرسنل"}
                  </option>


                  {personnelOptions.map(
                    (personnel) => (
                      <option
                        key={
                          personnel.id
                        }
                        value={
                          personnel.id
                        }
                      >
                        {personnel.name}
                      </option>
                    )
                  )}
                </select>
              </label>


              {/* انتخاب نوع فعالیت */}
              <label className="block">
                <span
                  className="
                    mb-2
                    block
                    text-sm
                    font-semibold
                    text-gray-700
                  "
                >
                  نوع فعالیت

                  <span
                    className="
                      mr-1
                      text-red-500
                    "
                  >
                    *
                  </span>
                </span>


                <select
                  value={
                    editingMember
                      .activityTypeId ||
                    ""
                  }
                  onChange={(event) =>
                    handleActivityChange(
                      event.target.value
                    )
                  }
                  disabled={
                    isOptionsLoading
                  }
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    bg-white
                    px-3 py-2.5
                    outline-none
                    focus:border-[#007fcf]
                    disabled:bg-gray-100
                  "
                >
                  <option value="">
                    {isOptionsLoading
                      ? "در حال دریافت..."
                      : "انتخاب نوع فعالیت"}
                  </option>


                  {activityOptions.map(
                    (activity) => (
                      <option
                        key={
                          activity.id
                        }
                        value={
                          activity.id
                        }
                      >
                        {activity.name}
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>


            {/* وضعیت حضور */}
            <label
              className="
                mt-5
                flex
                items-start
                gap-3
                rounded-xl
                border border-gray-200
                bg-gray-50
                p-4
              "
            >
              <input
                type="checkbox"
                checked={
                  editingMember
                    .isPresent
                }
                onChange={(event) =>
                  setEditingMember({
                    ...editingMember,

                    isPresent:
                      event.target
                        .checked,
                  })
                }
                className="
                  mt-1
                  h-4 w-4
                  accent-[#007fcf]
                "
              />


              <span>
                <span
                  className="
                    block
                    font-semibold
                    text-gray-800
                  "
                >
                  حضور در برنامه
                </span>

                <span
                  className="
                    mt-1
                    block
                    text-xs
                    text-gray-500
                  "
                >
                  در صورت حضور این عامل در برنامه، گزینه را فعال کنید.
                </span>
              </span>
            </label>


            {editError && (
              <div
                className="
                  mt-5
                  rounded-lg
                  border border-red-200
                  bg-red-50
                  px-4 py-3
                  text-sm
                  text-red-700
                "
              >
                {editError}
              </div>
            )}


            <footer
              className="
                mt-6
                flex
                justify-end
                gap-3
                border-t
                border-gray-200
                pt-5
              "
            >
              <button
                type="button"
                onClick={
                  closeEditDialog
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
                انصراف
              </button>


              <button
                type="button"
                onClick={
                  saveEditedMember
                }
                className="
                  rounded-lg
                  bg-[#007fcf]
                  px-5 py-2.5
                  font-semibold
                  text-white
                  hover:bg-[#006daf]
                "
              >
                ثبت تغییرات
              </button>
            </footer>
          </div>
        </div>
      )}


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
              حذف عامل برنامه
            </h3>

            <p
              className="
                mt-3
                text-sm
                leading-7
                text-gray-600
              "
            >
              آیا از حذف عامل «
              <strong>
                {
                  crewMembers[
                    deletingIndex
                  ]?.personnelName
                }
              </strong>
              » از شناسنامه مطمئن هستید؟
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
 * تبدیل اعداد انگلیسی به فارسی
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