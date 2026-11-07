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
  Plus,
  Pencil,
  RefreshCw,
  X,
} from "lucide-react";

import type {
  ProfileItemData,
} from "@/app/types/program-profile";


const PRODUCTION_TYPE_OPTIONS = [
  { value: "زنده", title: "زنده" },
  { value: "ضبطی", title: "ضبطی" },
] as const;


interface ProfileItemsStepProps {
  items: ProfileItemData[];

  programDurationMinutes: number;

  onChange: (
    items: ProfileItemData[]
  ) => void;

  onReset: () => Promise<void>;

  onBack: () => void;

  onNext: () => void;
}


interface ItemFormData {
  itemName: string;
  itemSubject: string;
  productionType: string;
  duration: string;
}


const EMPTY_FORM: ItemFormData = {
  itemName: "",
  itemSubject: "",
  productionType: "",
  duration: "00:00:00",
};


export default function ProfileItemsStep({
  items,
  programDurationMinutes,
  onChange,
  onReset,
  onBack,
  onNext,
}: ProfileItemsStepProps) {
  const [openMenuIndex, setOpenMenuIndex] =
    useState<number | null>(null);

  const [deletingIndex, setDeletingIndex] =
    useState<number | null>(null);

  const [editingIndex, setEditingIndex] =
    useState<number | null>(null);

  const [isFormOpen, setIsFormOpen] =
    useState(false);

  const [formData, setFormData] =
    useState<ItemFormData>(EMPTY_FORM);

  const [validationError, setValidationError] =
    useState("");

  const [isResetConfirmOpen, setIsResetConfirmOpen] =
    useState(false);

  const [isResetting, setIsResetting] =
    useState(false);

  const [resetError, setResetError] =
    useState("");

  const menuContainerRef =
    useRef<HTMLDivElement | null>(null);


  const totalDurationSeconds =
    calculateTotalDurationSeconds(items);

  const maxDurationSeconds =
    Math.max(0, programDurationMinutes * 60);

  const remainingSeconds =
    maxDurationSeconds - totalDurationSeconds;

  const isDurationExceeded =
    totalDurationSeconds > maxDurationSeconds;


  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(
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


  function openAddForm() {
    setEditingIndex(null);
    setFormData(EMPTY_FORM);
    setValidationError("");
    setIsFormOpen(true);
  }


  function openEditForm(index: number) {
    const item = items[index];

    if (!item) {
      return;
    }

    setEditingIndex(index);

    setFormData({
      itemName: item.itemName ?? "",
      itemSubject: item.itemSubject ?? "",
      productionType: item.productionType ?? "",
      duration: item.duration || "00:00:00",
    });

    setValidationError("");
    setOpenMenuIndex(null);
    setIsFormOpen(true);
  }


  function closeForm() {
    setIsFormOpen(false);
    setEditingIndex(null);
    setFormData(EMPTY_FORM);
    setValidationError("");
  }


  function handleFormChange(
    field: keyof ItemFormData,
    value: string
  ) {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    setValidationError("");
  }


  function saveItem() {
    const itemName = formData.itemName.trim();
    const itemSubject = formData.itemSubject.trim();
    const productionType = formData.productionType.trim();
    const duration = normalizeDigits(
      formData.duration.trim()
    );

    if (!itemName) {
      setValidationError(
        "عنوان آیتم را وارد کنید."
      );
      return;
    }

    const durationSeconds =
      timeSpanToSeconds(duration);

    if (durationSeconds === null) {
      setValidationError(
        "مدت آیتم را با قالب ساعت:دقیقه:ثانیه وارد کنید؛ مانند 00:15:00."
      );
      return;
    }

    if (durationSeconds <= 0) {
      setValidationError(
        "مدت آیتم باید بیشتر از صفر باشد."
      );
      return;
    }

    const currentTotal =
      calculateTotalDurationSeconds(items);

    const previousItemDuration =
      editingIndex !== null
        ? timeSpanToSeconds(
            items[editingIndex]?.duration ?? ""
          ) ?? 0
        : 0;

    const newTotal =
      currentTotal -
      previousItemDuration +
      durationSeconds;

    if (
      programDurationMinutes <= 0 ||
      newTotal > maxDurationSeconds
    ) {
      setValidationError(
        `مجموع مدت آیتم‌ها نباید از مدت برنامه (${toPersianNumber(
          secondsToTimeSpan(maxDurationSeconds)
        )}) بیشتر شود.`
      );
      return;
    }

    const updatedItem: ProfileItemData = {
      itemId:
        editingIndex !== null
          ? items[editingIndex].itemId
          : null,

      itemName,
      itemSubject,

      productionTypeId:
        editingIndex !== null
          ? items[editingIndex].productionTypeId
          : null,

      productionType,

      duration,
    };

    let updatedItems: ProfileItemData[];

    if (editingIndex !== null) {
      updatedItems = items.map(
        (item, index) =>
          index === editingIndex
            ? updatedItem
            : item
      );
    } else {
      updatedItems = [
        ...items,
        updatedItem,
      ];
    }

    onChange(updatedItems);
    closeForm();
  }


  function requestDelete(index: number) {
    setDeletingIndex(index);
    setOpenMenuIndex(null);
  }


  function confirmDelete() {
    if (deletingIndex === null) {
      return;
    }

    const updatedItems = items.filter(
      (_item, index) =>
        index !== deletingIndex
    );

    onChange(updatedItems);
    setDeletingIndex(null);
    setValidationError("");
  }


  async function handleReset() {
    if (isResetting) {
      return;
    }

    setIsResetting(true);
    setResetError("");

    try {
      await onReset();

      setIsResetConfirmOpen(false);
      setValidationError("");
    } catch (error) {
      setResetError(
        error instanceof Error
          ? error.message
          : "دریافت مجدد آیتم‌ها با خطا مواجه شد."
      );
    } finally {
      setIsResetting(false);
    }
  }


  function handleNext() {
    setValidationError("");

    if (
      programDurationMinutes <= 0
    ) {
      setValidationError(
        "مدت برنامه معتبر نیست. لطفاً اطلاعات مرحله مشخصات برنامه را بررسی کنید."
      );
      return;
    }

    const invalidItemIndex =
      items.findIndex(
        (item) =>
          !item.itemName.trim() ||
          timeSpanToSeconds(item.duration) === null ||
          (timeSpanToSeconds(item.duration) ?? 0) <= 0
      );

    if (invalidItemIndex !== -1) {
      setValidationError(
        `اطلاعات عنوان یا مدت آیتم ردیف ${toPersianNumber(
          invalidItemIndex + 1
        )} معتبر نیست.`
      );
      return;
    }

    if (isDurationExceeded) {
      setValidationError(
        "مجموع مدت آیتم‌ها از مدت کل برنامه بیشتر است. لطفاً آیتم‌ها را اصلاح کنید."
      );
      return;
    }

    onNext();
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
            flex flex-wrap
            items-center
            justify-between
            gap-4
            border-b
            border-gray-200
            pb-4
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-11 w-11
                items-center justify-center
                rounded-full
                bg-blue-50
                text-[#007fcf]
              "
            >
              <ListVideo size={23} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-800">
                آیتم‌های برنامه
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                آیتم‌های شناسنامه را بررسی و در صورت نیاز ویرایش کنید.
              </p>
            </div>
          </div>

          <span
            className="
              rounded-full
              bg-blue-50
              px-3 py-1
              text-xs font-bold
              text-[#007fcf]
            "
          >
            {toPersianNumber(items.length)} آیتم
          </span>
        </header>


        {/* توضیحات */}
        <div
          className="
            mb-5
            rounded-lg
            border border-blue-100
            bg-blue-50/60
            px-4 py-3
            text-sm leading-7
            text-blue-700
          "
        >
          تغییرات این مرحله فقط در شناسنامه در حال صدور اعمال می‌شود و اطلاعات اصلی طرح برنامه تغییر نمی‌کند.
        </div>


        {/* دکمه‌های افزودن و بارگذاری مجدد */}
        <div
          className="
            mb-5
            flex flex-wrap
            items-center
            justify-between
            gap-3
          "
        >
          <button
            type="button"
            onClick={openAddForm}
            className="
              inline-flex items-center gap-2
              rounded-lg
              bg-[#007fcf]
              px-4 py-2.5
              text-sm font-semibold
              text-white
              transition
              hover:bg-[#006daf]
            "
          >
            <Plus size={18} />
            افزودن آیتم
          </button>

          <button
            type="button"
            onClick={() => {
              setResetError("");
              setIsResetConfirmOpen(true);
            }}
            disabled={isResetting}
            className="
              inline-flex items-center gap-2
              rounded-lg
              border border-gray-300
              bg-white
              px-4 py-2.5
              text-sm font-semibold
              text-gray-700
              transition
              hover:bg-gray-50
              disabled:opacity-50
            "
          >
            <RefreshCw size={17} />
            بارگذاری مجدد آیتم‌های طرح
          </button>
        </div>


        {validationError && (
          <div
            className="
              mb-5
              rounded-lg
              border border-red-200
              bg-red-50
              px-4 py-3
              text-sm leading-7
              text-red-700
            "
            role="alert"
          >
            {validationError}
          </div>
        )}


        {/* جدول */}
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
              min-w-[900px]
              text-sm
            "
          >
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="w-20 px-4 py-4 text-center font-bold">
                  ردیف
                </th>

                <th className="px-4 py-4 text-right font-bold">
                  عنوان آیتم
                </th>

                <th className="px-4 py-4 text-right font-bold">
                  موضوع
                </th>

                {/* <th className="px-4 py-4 text-center font-bold">
                  نوع تولید
                </th> */}

                <th className="px-4 py-4 text-center font-bold">
                  مدت
                </th>

                <th className="w-24 px-4 py-4 text-center font-bold">
                  عملیات
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => (
                <tr
                  key={`${item.itemId ?? "new"}-${index}`}
                  className="
                    border-t border-gray-100
                    text-gray-700
                    transition
                    hover:bg-blue-50/40
                  "
                >
                  <td className="px-4 py-4 text-center text-gray-500">
                    {toPersianNumber(index + 1)}
                  </td>

                  <td className="px-4 py-4 font-semibold text-gray-800">
                    {item.itemName || "—"}
                  </td>

                  <td className="px-4 py-4">
                    {item.itemSubject || "—"}
                  </td>

                  {/* <td className="px-4 py-4 text-center">
                    {item.productionType || "—"}
                  </td> */}

                  <td
                    className="whitespace-nowrap px-4 py-4 text-center"
                    dir="ltr"
                  >
                    {item.duration
                      ? toPersianNumber(item.duration)
                      : "—"}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <div
                      ref={
                        openMenuIndex === index
                          ? menuContainerRef
                          : undefined
                      }
                      className="relative inline-block text-right"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuIndex(
                            (previous) =>
                              previous === index
                                ? null
                                : index
                          )
                        }
                        className="
                          rounded-lg p-2
                          text-gray-500
                          transition
                          hover:bg-gray-100
                          hover:text-gray-800
                        "
                        aria-label="عملیات آیتم"
                      >
                        <MoreVertical size={19} />
                      </button>

                      {openMenuIndex === index && (
                        <div
                          className="
                            absolute left-0 bottom-full
                            z-50 mb-1 w-36
                            overflow-hidden
                            rounded-lg
                            border border-gray-200
                            bg-white py-1
                            shadow-xl
                          "
                        >
                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(index)
                            }
                            className="
                              flex w-full items-center gap-2
                              px-3 py-2
                              text-sm text-gray-700
                              transition hover:bg-blue-50
                            "
                          >
                            <Pencil size={16} />
                            ویرایش
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              requestDelete(index)
                            }
                            className="
                              flex w-full items-center gap-2
                              px-3 py-2
                              text-sm text-red-600
                              transition hover:bg-red-50
                            "
                          >
                            <Trash2 size={16} />
                            حذف
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
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


        {/* جمع مدت و ظرفیت */}
        <div
          className="
            mt-4
            flex flex-wrap
            justify-end
            gap-3
          "
        >
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
            مدت برنامه:{" "}
            <strong className="text-gray-800" dir="ltr">
              {toPersianNumber(
                secondsToTimeSpan(maxDurationSeconds)
              )}
            </strong>
          </div>

          <div
            className={`
              rounded-lg px-4 py-3 text-sm
              ${
                isDurationExceeded
                  ? "bg-red-50 text-red-700"
                  : "bg-gray-50 text-gray-600"
              }
            `}
          >
            مجموع مدت آیتم‌ها:{" "}
            <strong
              className={
                isDurationExceeded
                  ? "text-red-700"
                  : "text-gray-800"
              }
              dir="ltr"
            >
              {toPersianNumber(
                secondsToTimeSpan(totalDurationSeconds)
              )}
            </strong>
          </div>

          <div
            className={`
              rounded-lg px-4 py-3 text-sm
              ${
                remainingSeconds < 0
                  ? "bg-red-50 text-red-700"
                  : "bg-green-50 text-green-700"
              }
            `}
          >
            {remainingSeconds >= 0
              ? "زمان باقی‌مانده: "
              : "زمان اضافه: "}

            <strong dir="ltr">
              {toPersianNumber(
                secondsToTimeSpan(
                  Math.abs(remainingSeconds)
                )
              )}
            </strong>
          </div>
        </div>


        {/* دکمه‌های مراحل */}
        <footer
          className="
            mt-8
            flex flex-wrap
            items-center justify-between
            gap-3
            border-t border-gray-200
            pt-5
          "
        >
          <button
            type="button"
            onClick={onBack}
            className="
              inline-flex items-center gap-2
              rounded-lg
              border border-gray-300
              bg-white
              px-5 py-2.5
              font-semibold
              text-gray-700
              transition hover:bg-gray-50
            "
          >
            <ArrowRight size={18} />
            مرحله قبل
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="
              inline-flex items-center gap-2
              rounded-lg
              bg-[#007fcf]
              px-6 py-2.5
              font-semibold
              text-white
              shadow-sm
              transition hover:bg-[#006daf]
            "
          >
            مرحله بعد
            <ArrowLeft size={18} />
          </button>
        </footer>
      </section>


      {/* فرم افزودن و ویرایش */}
      {isFormOpen && (
        <div
          className="
            fixed inset-0 z-[100]
            flex items-center justify-center
            bg-black/45 p-4
          "
          dir="rtl"
        >
          <div
            className="
              w-full max-w-lg
              rounded-2xl
              bg-white p-6
              shadow-2xl
            "
          >
            <header className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">
                {editingIndex !== null
                  ? "ویرایش آیتم برنامه"
                  : "افزودن آیتم جدید"}
              </h3>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </header>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  عنوان آیتم
                  <span className="mr-1 text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={formData.itemName}
                  onChange={(event) =>
                    handleFormChange(
                      "itemName",
                      event.target.value
                    )
                  }
                  className="
                    w-full rounded-lg
                    border border-gray-300
                    px-3 py-2.5
                    text-sm outline-none
                    focus:border-[#007fcf]
                    focus:ring-2 focus:ring-blue-100
                  "
                  placeholder="عنوان آیتم را وارد کنید"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  موضوع آیتم
                </label>

                <textarea
                  value={formData.itemSubject}
                  onChange={(event) =>
                    handleFormChange(
                      "itemSubject",
                      event.target.value
                    )
                  }
                  rows={3}
                  className="
                    w-full rounded-lg
                    border border-gray-300
                    px-3 py-2.5
                    text-sm outline-none
                    focus:border-[#007fcf]
                    focus:ring-2 focus:ring-blue-100
                  "
                  placeholder="موضوع یا توضیحات آیتم"
                />
              </div>

              {/* <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  نوع تولید
                </label>

                <select
                  value={formData.productionType}
                  onChange={(event) =>
                    handleFormChange(
                      "productionType",
                      event.target.value
                    )
                  }
                  className="
                    w-full rounded-lg
                    border border-gray-300
                    bg-white px-3 py-2.5
                    text-sm outline-none
                    focus:border-[#007fcf]
                    focus:ring-2 focus:ring-blue-100
                  "
                >
                  <option value="">
                    انتخاب نوع تولید
                  </option>

                  {PRODUCTION_TYPE_OPTIONS.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.title}
                      </option>
                    )
                  )}
                </select>
              </div> */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  مدت آیتم
                  <span className="mr-1 text-red-500">*</span>
                </label>

                <input
                  type="text"
                  dir="ltr"
                  value={formData.duration}
                  onChange={(event) =>
                    handleFormChange(
                      "duration",
                      event.target.value
                    )
                  }
                  className="
                    w-full rounded-lg
                    border border-gray-300
                    px-3 py-2.5
                    text-left text-sm
                    outline-none
                    focus:border-[#007fcf]
                    focus:ring-2 focus:ring-blue-100
                  "
                  placeholder="00:15:00"
                />

                <p className="mt-1 text-xs text-gray-500">
                  مدت را به صورت ساعت:دقیقه:ثانیه وارد کنید.
                </p>
              </div>
            </div>

            {validationError && (
              <div
                className="
                  mt-4 rounded-lg
                  border border-red-200
                  bg-red-50
                  px-3 py-2
                  text-sm leading-6
                  text-red-700
                "
                role="alert"
              >
                {validationError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="
                  rounded-lg
                  border border-gray-300
                  bg-white px-5 py-2.5
                  text-sm text-gray-700
                  hover:bg-gray-50
                "
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={saveItem}
                className="
                  rounded-lg
                  bg-[#007fcf]
                  px-5 py-2.5
                  text-sm font-semibold
                  text-white
                  hover:bg-[#006daf]
                "
              >
                {editingIndex !== null
                  ? "ذخیره تغییرات"
                  : "افزودن آیتم"}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* تأیید حذف */}
      {deletingIndex !== null && (
        <div
          className="
            fixed inset-0 z-[110]
            flex items-center justify-center
            bg-black/45 p-4
          "
          dir="rtl"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800">
              حذف آیتم برنامه
            </h3>

            <p className="mt-3 text-sm leading-7 text-gray-600">
              آیا از حذف آیتم «
              <strong>
                {items[deletingIndex]?.itemName}
              </strong>
              » از شناسنامه مطمئن هستید؟
            </p>

            <p className="mt-2 text-xs leading-6 text-gray-500">
              این عملیات اطلاعات آیتم را از طرح اصلی برنامه حذف نمی‌کند.
            </p>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setDeletingIndex(null)}
                className="
                  rounded-lg border border-gray-300
                  bg-white px-5 py-2.5
                  text-gray-700 hover:bg-gray-50
                "
              >
                خیر
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                className="
                  rounded-lg bg-red-600
                  px-5 py-2.5
                  font-semibold text-white
                  hover:bg-red-700
                "
              >
                بله، حذف شود
              </button>
            </div>
          </div>
        </div>
      )}


      {/* تأیید بارگذاری مجدد */}
      {isResetConfirmOpen && (
        <div
          className="
            fixed inset-0 z-[110]
            flex items-center justify-center
            bg-black/45 p-4
          "
          dir="rtl"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800">
              بارگذاری مجدد آیتم‌ها
            </h3>

            <p className="mt-3 text-sm leading-7 text-gray-600">
              با این کار، فهرست فعلی با آیتم‌های اولیه دریافتی از سرویس طرح جایگزین می‌شود.
              تمام افزودن‌ها، ویرایش‌ها و حذف‌های انجام‌شده در این مرحله از بین می‌روند.
            </p>

            {resetError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-700">
                {resetError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                disabled={isResetting}
                className="
                  rounded-lg border border-gray-300
                  bg-white px-5 py-2.5
                  text-gray-700 hover:bg-gray-50
                  disabled:opacity-50
                "
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={isResetting}
                className="
                  inline-flex items-center gap-2
                  rounded-lg bg-[#007fcf]
                  px-5 py-2.5
                  font-semibold text-white
                  hover:bg-[#006daf]
                  disabled:opacity-50
                "
              >
                <RefreshCw
                  size={16}
                  className={
                    isResetting
                      ? "animate-spin"
                      : ""
                  }
                />

                {isResetting
                  ? "در حال دریافت..."
                  : "بله، بارگذاری شود"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


/* محاسبه مجموع مدت آیتم‌ها برحسب ثانیه */
function calculateTotalDurationSeconds(
  items: ProfileItemData[]
): number {
  return items.reduce(
    (sum, item) =>
      sum +
      (timeSpanToSeconds(item.duration) ?? 0),
    0
  );
}


/* تبدیل hh:mm:ss به ثانیه؛ مقدار نامعتبر null برمی‌گرداند */
function timeSpanToSeconds(
  value: string
): number | null {
  const normalized = normalizeDigits(
    value.trim()
  );

  const match =
    /^(\d+):([0-5]\d):([0-5]\d)$/.exec(
      normalized
    );

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);

  if (
    !Number.isSafeInteger(hours) ||
    hours < 0
  ) {
    return null;
  }

  return (
    hours * 3600 +
    minutes * 60 +
    seconds
  );
}


/* تبدیل ثانیه به hh:mm:ss */
function secondsToTimeSpan(
  totalSeconds: number
): string {
  const safeTotal = Math.max(
    0,
    Math.floor(totalSeconds)
  );

  const hours = Math.floor(
    safeTotal / 3600
  );

  const minutes = Math.floor(
    (safeTotal % 3600) / 60
  );

  const seconds = safeTotal % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":");
}


/* تبدیل عدد انگلیسی به فارسی */
function toPersianNumber(
  value: string | number
): string {
  return String(value).replace(
    /\d/g,
    (digit) =>
      "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]
  );
}


/* تبدیل اعداد فارسی و عربی به انگلیسی */
function normalizeDigits(
  value: string
): string {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

  return value
    .replace(
      /[۰-۹]/g,
      (digit) =>
        String(persianDigits.indexOf(digit))
    )
    .replace(
      /[٠-٩]/g,
      (digit) =>
        String(arabicDigits.indexOf(digit))
    );
}