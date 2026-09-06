"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Check,
  ChevronDown,
  EllipsisVertical,
  Pencil,
  Search,
  Trash2,
  UserRound,
  UserPlus,
  X,
} from "lucide-react";

import CreateExpertDialog from
  "@/app/component/wizard/experts/CreateExpertDialog";

import type {
  ExpertOption,
  ExpertsClientResponse,
} from "@/app/types/expert";

import {
  getUserSession,
} from "@/app/lib/storage";

interface ExpertsStepProps {
  /*
   * مقدار گزینه «دارای کارشناس»
   * از مرحله اول دریافت می‌شود.
   */
  hasExpert: boolean;

  /*
   * کارشناسان انتخاب‌شده در State والد
   * نگهداری می‌شوند.
   */
  experts: ExpertOption[];

  onChange: (
    experts: ExpertOption[]
  ) => void;

  onBack: () => void;

  onNext: () => void;
}

export default function ExpertsStep({
  hasExpert,
  experts,
  onChange,
  onBack,
  onNext,
}: ExpertsStepProps) {
  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    expertOptions,
    setExpertOptions,
  ] = useState<ExpertOption[]>([]);

  const [
    selectedExpert,
    setSelectedExpert,
  ] = useState<ExpertOption | null>(null);

  const [
    editingExpertId,
    setEditingExpertId,
  ] = useState<string | null>(null);

  const [
    openDropdown,
    setOpenDropdown,
  ] = useState(false);

  const [
    openMenuId,
    setOpenMenuId,
  ] = useState<string | null>(null);

  const [
    deletingExpert,
    setDeletingExpert,
  ] = useState<ExpertOption | null>(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [
    selectionError,
    setSelectionError,
  ] = useState("");

  const [
    showCreateExpert,
    setShowCreateExpert,
  ] = useState(false);

  /*
   * برای جلوگیری از اعمال پاسخ قدیمی‌تر جستجو
   */
  const requestController =
    useRef<AbortController | null>(null);

  /*
   * جستجوی کارشناسان با تأخیر ۴۰۰ میلی‌ثانیه
   */
  useEffect(() => {
    if (!hasExpert) {
      setExpertOptions([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      loadExperts(searchTerm);
    }, 400);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    searchTerm,
    hasExpert,
  ]);

  async function loadExperts(
    search: string
  ) {
    /*
     * درخواست قبلی لغو می‌شود.
     */
    requestController.current?.abort();

    const controller =
      new AbortController();

    requestController.current =
      controller;

    try {
      setIsLoading(true);
      setLoadError("");

      const session =
        getUserSession();

      /*
       * فعلاً اگر کاربر چند شبکه دارد،
       * اولین شبکه ارسال می‌شود.
       *
       * در صورت پشتیبانی Backend از چند شبکه،
       * این بخش قابل تغییر است.
       */
      const networkId =
        session?.networkIds?.[0];

      const query =
        new URLSearchParams();

      query.set(
        "searchTerm",
        search
      );

      query.set(
        "pageNumber",
        "1"
      );

      query.set(
        "pageSize",
        "20"
      );

      if (networkId) {
        query.set(
          "networkId",
          String(networkId)
        );
      }

      const response = await fetch(
        `/api/experts?${query.toString()}`,
        {
          signal:
            controller.signal,
        }
      );

      const responseText =
        await response.text();

      let responseData:
        | ExpertsClientResponse
        | {
            message?: string;
          };

      try {
        responseData =
          JSON.parse(responseText);
      } catch {
        throw new Error(
          "پاسخ کارشناسان JSON معتبر نیست."
        );
      }

      if (!response.ok) {
        throw new Error(
          "message" in responseData
            ? responseData.message ||
                "دریافت کارشناسان انجام نشد."
            : "دریافت کارشناسان انجام نشد."
        );
      }

      const result =
        responseData as ExpertsClientResponse;

      setExpertOptions(
        result.experts ?? []
      );
    } catch (error) {
      /*
       * لغو درخواست خطا محسوب نمی‌شود.
       */
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "خطای ناشناخته";

      setLoadError(message);
      setExpertOptions([]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelectExpert(
    expert: ExpertOption
  ) {
    setSelectedExpert(expert);

    setSearchTerm(
      expert.lastName
    );

    setOpenDropdown(false);

    setSelectionError("");
  }

  /*
   * کارشناس ایجادشده بلافاصله هم به گزینه‌ها
   * و هم به فهرست انتخاب‌شده ویزارد اضافه می‌شود.
   */
  function handleExpertCreated(
    createdExpert: ExpertOption
  ) {
    setExpertOptions((previous) => {
      const withoutDuplicate =
        previous.filter(
          (expert) =>
            expert.id !==
            createdExpert.id
        );

      return [
        createdExpert,
        ...withoutDuplicate,
      ];
    });

    const alreadySelected =
      experts.some(
        (expert) =>
          expert.id ===
          createdExpert.id
      );

    if (!alreadySelected) {
      onChange([
        ...experts,
        createdExpert,
      ]);
    }

    setSelectedExpert(
      createdExpert
    );

    setSearchTerm(
      createdExpert.firstName
    );

    setSearchTerm(
      createdExpert.lastName
    );

    setOpenDropdown(false);
    setShowCreateExpert(false);
    setSelectionError("");
  }

  function handleAddOrEdit() {
    if (!selectedExpert) {
      setSelectionError(
        "یک کارشناس انتخاب کنید."
      );

      return;
    }

    /*
     * حالت ویرایش
     */
    if (editingExpertId) {
      /*
       * کنترل می‌کنیم کارشناس جدید در ردیف
       * دیگری از جدول وجود نداشته باشد.
       */
      const duplicate =
        experts.some(
          (expert) =>
            expert.id ===
              selectedExpert.id &&
            expert.id !==
              editingExpertId
        );

      if (duplicate) {
        setSelectionError(
          "این کارشناس قبلاً به فهرست اضافه شده است."
        );

        return;
      }

      const updatedExperts =
        experts.map((expert) =>
          expert.id ===
          editingExpertId
            ? selectedExpert
            : expert
        );

      onChange(updatedExperts);

      resetSelection();

      return;
    }

    /*
     * حالت افزودن
     */
    const alreadyExists =
      experts.some(
        (expert) =>
          expert.id ===
          selectedExpert.id
      );

    if (alreadyExists) {
      setSelectionError(
        "این کارشناس قبلاً به فهرست اضافه شده است."
      );

      return;
    }

    onChange([
      ...experts,
      selectedExpert,
    ]);

    resetSelection();
  }

  function handleEdit(
    expert: ExpertOption
  ) {
    setSelectedExpert(expert);

    setSearchTerm(
      expert.firstName
    );

    setSearchTerm(
      expert.lastName
    );

    setEditingExpertId(
      expert.id
    );

    setSelectionError("");

    setOpenMenuId(null);

    /*
     * کارشناس انتخاب‌شده را نیز داخل
     * گزینه‌های Dropdown قرار می‌دهیم.
     */
    setExpertOptions((previous) => {
      const exists =
        previous.some(
          (item) =>
            item.id === expert.id
        );

      return exists
        ? previous
        : [expert, ...previous];
    });
  }

  function handleDeleteConfirm() {
    if (!deletingExpert) {
      return;
    }

    const updatedExperts =
      experts.filter(
        (expert) =>
          expert.id !==
          deletingExpert.id
      );

    onChange(updatedExperts);

    if (
      editingExpertId ===
      deletingExpert.id
    ) {
      resetSelection();
    }

    setDeletingExpert(null);
  }

  function handleNext() {
    /*
     * اگر در مرحله اول گزینه دارای کارشناس
     * فعال باشد، حداقل یک کارشناس لازم است.
     */
    if (
      hasExpert &&
      experts.length === 0
    ) {
      setSelectionError(
        "حداقل یک کارشناس به فهرست اضافه کنید."
      );

      return;
    }

    onNext();
  }

  function resetSelection() {
    setSelectedExpert(null);

    setSearchTerm("");

    setEditingExpertId(null);

    setSelectionError("");

    setOpenDropdown(false);
  }

  /*
   * اگر برنامه کارشناس ندارد،
   * فرم انتخاب نمایش داده نمی‌شود.
   */
  if (!hasExpert) {
    return (
      <section
        className="
          max-w-5xl mx-auto
          bg-white
          border border-gray-200
          rounded-2xl
          shadow-sm
          p-6
        "
      >
        <header>
          <h2
            className="
              text-xl
              font-bold
              text-gray-800
            "
          >
            کارشناسان برنامه
          </h2>

          <p
            className="
              mt-2
              text-sm
              text-gray-500
            "
          >
            در مرحله مشخصات، گزینه «دارای کارشناس»
            فعال نشده است.
          </p>
        </header>

        <div
          className="
            mt-7
            p-5
            border
            border-blue-200
            bg-blue-50
            rounded-xl
            text-sm
            text-blue-700
          "
        >
          این برنامه بدون کارشناس ثبت خواهد شد.
        </div>

        <footer
          className="
            mt-8 pt-5
            border-t
            border-gray-200
            flex justify-between
          "
        >
          <button
            type="button"
            onClick={onBack}
            className={secondaryButtonClass}
          >
            مرحله قبل
          </button>

          <button
            type="button"
            onClick={onNext}
            className={primaryButtonClass}
          >
            مرحله بعد
          </button>
        </footer>
      </section>
    );
  }

  return (
    <>
      <section
        className="
          max-w-5xl mx-auto
          bg-white
          border border-gray-200
          rounded-2xl
          shadow-sm
          p-6
        "
      >
        {/* عنوان */}
        <header className="mb-7">
          <h2
            className="
              text-xl
              font-bold
              text-gray-800
            "
          >
            کارشناسان برنامه
          </h2>

          <p
            className="
              mt-2
              text-sm
              text-gray-500
            "
          >
            کارشناس موردنظر را جستجو و به فهرست
            اضافه کنید.
          </p>
        </header>

        {/* جستجو و انتخاب کارشناس */}
        <div
          className="
            flex flex-col
            md:flex-row
            items-start
            gap-3
          "
        >
          <div className="relative w-full">
            <label
              htmlFor="expertSearch"
              className="
                block mb-2
                text-sm
                font-semibold
                text-gray-700
              "
            >
              انتخاب کارشناس

              <span className="text-red-500 mr-1">
                *
              </span>
            </label>

            <div className="relative">
              <Search
                size={18}
                className="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                "
              />

              <input
                id="expertSearch"
                type="text"
                value={searchTerm}
                onFocus={() =>
                  setOpenDropdown(true)
                }
                onChange={(event) => {
                  setSearchTerm(
                    event.target.value
                  );

                  setSelectedExpert(null);

                  setOpenDropdown(true);

                  setSelectionError("");
                }}
                placeholder="جستجو با نام، نام خانوادگی یا کد ملی"
                className={`
                  w-full h-12
                  pr-10 pl-10
                  border
                  rounded-lg
                  outline-none
                  ${
                    selectionError
                      ? "border-red-500"
                      : "border-gray-300 focus:border-[#007fcf]"
                  }
                `}
              />

              <ChevronDown
                size={18}
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                "
              />
            </div>

            {/* Dropdown جستجو */}
            {openDropdown && (
              <div
                className="
                  absolute
                  top-full
                  right-0 left-0
                  mt-2
                  z-40
                  max-h-72
                  overflow-y-auto
                  bg-white
                  border
                  border-gray-200
                  rounded-xl
                  shadow-xl
                "
              >
                {isLoading && (
                  <p
                    className="
                      p-4
                      text-center
                      text-sm
                      text-gray-500
                    "
                  >
                    در حال دریافت کارشناسان...
                  </p>
                )}

                {!isLoading &&
                  loadError && (
                    <p
                      className="
                        p-4
                        text-center
                        text-sm
                        text-red-500
                      "
                    >
                      {loadError}
                    </p>
                  )}

                {!isLoading &&
                  !loadError &&
                  expertOptions.length ===
                    0 && (
                    <p
                      className="
                        p-4
                        text-center
                        text-sm
                        text-gray-500
                      "
                    >
                      کارشناسی پیدا نشد.
                    </p>
                  )}

                {!isLoading &&
                  expertOptions.map(
                    (expert) => (
                      <button
                        key={expert.id}
                        type="button"
                        onClick={() =>
                          handleSelectExpert(
                            expert
                          )
                        }
                        className="
                          w-full
                          flex items-center
                          gap-3
                          px-4 py-3
                          text-right
                          border-b
                          border-gray-100
                          last:border-b-0
                          hover:bg-blue-50
                          transition
                        "
                      >
                        <div
                          className="
                            w-10 h-10
                            rounded-full
                            bg-blue-100
                            text-[#007fcf]
                            flex items-center
                            justify-center
                            shrink-0
                          "
                        >
                          <UserRound
                            size={19}
                          />
                        </div>

                        <div>
                          <p
                            className="
                              text-sm
                              font-semibold
                              text-gray-800
                            "
                          >
                            {expert.firstName}
                          </p>
                          <p
                            className="
                              text-sm
                              font-semibold
                              text-gray-800
                            "
                          >
                            {expert.lastName}
                          </p>

                          <p
                            className="
                              mt-1
                              text-xs
                              text-gray-500
                            "
                          >
                            {expert.specialty}

                            {expert.nationalCode &&
                              ` - ${expert.nationalCode}`}
                          </p>
                        </div>
                      </button>
                    )
                  )}

                {/* تعریف کارشناس جدید */}
                {!isLoading && (
                  <div
                    className="
                      sticky bottom-0
                      border-t
                      border-gray-200
                      bg-white
                      p-2
                    "
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(false);
                        setShowCreateExpert(true);
                      }}
                      className="
                        flex w-full
                        items-center
                        justify-center
                        gap-2
                        rounded-lg
                        border
                        border-dashed
                        border-[#007fcf]
                        px-4 py-3
                        text-sm
                        font-semibold
                        text-[#007fcf]
                        hover:bg-blue-50
                      "
                    >
                      <UserPlus size={18} />
                      تعریف کارشناس جدید
                    </button>
                  </div>
                )}
              </div>
            )}

            {selectionError && (
              <p
                className="
                  mt-1
                  text-xs
                  text-red-500
                "
              >
                {selectionError}
              </p>
            )}
          </div>

          {/* دکمه افزودن یا ویرایش */}
          <button
            type="button"
            onClick={handleAddOrEdit}
            className={`
              md:mt-7
              min-w-40 h-12
              px-5
              rounded-lg
              text-white
              font-semibold
              flex items-center
              justify-center
              gap-2
              transition
              ${
                editingExpertId
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-[#007fcf] hover:bg-[#006fb5]"
              }
            `}
          >
            {editingExpertId ? (
              <>
                <Check size={18} />
                ثبت ویرایش
              </>
            ) : (
              <>
                <UserRound size={18} />
                افزودن کارشناس
              </>
            )}
          </button>

          {editingExpertId && (
            <button
              type="button"
              onClick={resetSelection}
              className="
                md:mt-7
                h-12
                px-4
                border
                border-gray-300
                rounded-lg
                text-gray-600
              "
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* جدول کارشناسان انتخاب‌شده */}
        <div
          className="
            mt-8
            border
            border-gray-200
            rounded-xl
            overflow-visible
          "
        >
          <div className="overflow-x-auto">
            <table
              className="
                w-full
                min-w-3xl
                border-collapse
              "
            >
              <thead>
                <tr className="bg-gray-50">
                  <th className={tableHeaderClass}>
                    ردیف
                  </th>

                  <th className={tableHeaderClass}>
                    نام کارشناس
                  </th>

                  <th className={tableHeaderClass}>
                    تخصص
                  </th>

                  <th className={tableHeaderClass}>
                    کد ملی
                  </th>

                  <th className={tableHeaderClass}>
                    محل کار
                  </th>

                  <th
                    className={`${tableHeaderClass} text-center`}
                  >
                    عملیات
                  </th>
                </tr>
              </thead>

              <tbody>
                {experts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="
                        px-4 py-12
                        text-center
                        text-sm
                        text-gray-500
                      "
                    >
                      هنوز کارشناسی به فهرست اضافه نشده است.
                    </td>
                  </tr>
                ) : (
                  experts.map(
                    (expert, index) => (
                      <tr
                        key={expert.id}
                        className="
                          border-t
                          border-gray-200
                          hover:bg-gray-50
                        "
                      >
                        <td className={tableCellClass}>
                          {index + 1}
                        </td>

                        <td
                          className={`
                            ${tableCellClass}
                            font-semibold
                            text-gray-800
                          `}
                        >
                          {expert.firstName}
                        </td>
                        <td
                          className={`
                            ${tableCellClass}
                            font-semibold
                            text-gray-800
                          `}
                        >
                          {expert.lastName}
                        </td>

                        <td className={tableCellClass}>
                          {expert.specialty}
                        </td>

                        <td className={tableCellClass}>
                          {expert.nationalCode ||
                            "—"}
                        </td>

                        <td className={tableCellClass}>
                          {expert.workplace ||
                            "—"}
                        </td>

                        <td
                          className={`
                            ${tableCellClass}
                            text-center
                          `}
                        >
                          <div
                            className="
                              relative
                              inline-block
                            "
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenuId(
                                  (
                                    previous
                                  ) =>
                                    previous ===
                                    expert.id
                                      ? null
                                      : expert.id
                                )
                              }
                              className="
                                w-9 h-9
                                inline-flex
                                items-center
                                justify-center
                                rounded-lg
                                text-gray-500
                                hover:bg-gray-200
                              "
                            >
                              <EllipsisVertical
                                size={19}
                              />
                            </button>

                            {openMenuId ===
                              expert.id && (
                              <div
                                className="
                                  absolute
                                  left-0 top-10
                                  z-30
                                  w-32
                                  py-1
                                  bg-white
                                  border
                                  border-gray-200
                                  rounded-lg
                                  shadow-lg
                                  text-right
                                "
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEdit(
                                      expert
                                    )
                                  }
                                  className="
                                    w-full
                                    flex items-center
                                    gap-2
                                    px-3 py-2
                                    text-sm
                                    text-gray-700
                                    hover:bg-gray-50
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
                                    setDeletingExpert(
                                      expert
                                    );

                                    setOpenMenuId(
                                      null
                                    );
                                  }}
                                  className="
                                    w-full
                                    flex items-center
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
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* دکمه‌های پایین */}
        <footer
          className="
            mt-8 pt-5
            border-t
            border-gray-200
            flex justify-between
          "
        >
          <button
            type="button"
            onClick={onBack}
            className={secondaryButtonClass}
          >
            مرحله قبل
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={
              hasExpert &&
              experts.length === 0
            }
            className="
              px-7 py-3
              rounded-lg
              bg-[#007fcf]
              text-white
              font-semibold
              hover:bg-[#006fb5]
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            مرحله بعد
          </button>
        </footer>
      </section>

      {/* پنجره تأیید حذف */}
      <CreateExpertDialog
        open={showCreateExpert}
        onClose={() =>
          setShowCreateExpert(false)
        }
        onCreated={
          handleExpertCreated
        }
      />

      {/* پنجره تأیید حذف */}
      {deletingExpert && (
        <div
          className="
            fixed inset-0
            z-50
            flex items-center
            justify-center
            bg-black/40
            px-4
          "
        >
          <div
            className="
              w-full max-w-md
              bg-white
              rounded-2xl
              shadow-2xl
              p-6
            "
          >
            <div
              className="
                w-12 h-12
                rounded-full
                bg-red-100
                text-red-600
                flex items-center
                justify-center
                mb-4
              "
            >
              <Trash2 size={22} />
            </div>

            <h3 className="text-lg font-bold">
              حذف کارشناس
            </h3>

            <p
              className="
                mt-3
                text-sm
                text-gray-600
                leading-7
              "
            >
              آیا از حذف

              <strong className="mx-1">
                «{deletingExpert.lastName}»
              </strong>

              از فهرست اطمینان دارید؟
            </p>

            <div
              className="
                mt-6
                flex justify-end
                gap-3
              "
            >
              <button
                type="button"
                onClick={() =>
                  setDeletingExpert(null)
                }
                className={secondaryButtonClass}
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={
                  handleDeleteConfirm
                }
                className="
                  px-5 py-2.5
                  rounded-lg
                  bg-red-600
                  text-white
                  hover:bg-red-700
                "
              >
                حذف شود
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const primaryButtonClass = `
  px-7 py-3
  rounded-lg
  bg-[#007fcf]
  text-white
  font-semibold
  hover:bg-[#006fb5]
  transition
`;

const secondaryButtonClass = `
  px-6 py-3
  border
  border-gray-300
  rounded-lg
  text-gray-700
  hover:bg-gray-50
  transition
`;

const tableHeaderClass = `
  px-4 py-4
  text-right
  text-xs
  font-bold
  text-gray-600
  whitespace-nowrap
`;

const tableCellClass = `
  px-4 py-4
  text-sm
  text-gray-600
  whitespace-nowrap
`;
