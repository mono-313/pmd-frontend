"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  Check,
  EllipsisVertical,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { z } from "zod";

import type {
  Topic,
  TopicStatus,
} from "@/app/types/wizard";

/*
 * zod
 */
const topicSchema = z.object({
  title: z
    .string()
    .trim()
    .min(
      1,
      "عنوان موضوع را وارد کنید."
    )
    .min(
      3,
      "عنوان موضوع حداقل سه کاراکتر باشد."
    )
    .max(
      300,
      "عنوان موضوع حداکثر ۳۰۰ کاراکتر باشد."
    ),
});

type TopicFormData =
  z.infer<typeof topicSchema>;

interface TopicsStepProps {
  /*
   * keep topic in wizard
   */
  topics: Topic[];

  /*
   * با هر ثبت، ویرایش یا حذف،
   * State والد به‌روزرسانی می‌شود.
   */
  onChange: (topics: Topic[]) => void;

  onBack: () => void;

  onNext: () => void;
}


//main
export default function TopicsStep({
  topics,
  onChange,
  onBack,
  onNext,
}: TopicsStepProps) {

  const [formData, setFormData] =
    useState<TopicFormData>({
      title: "",
    });

  const [titleError, setTitleError] =
    useState("");

  
  // ویرایش موضوع - null کردن مقدار مثل ثبت جدید
  const [
    editingTopicId,
    setEditingTopicId,
  ] = useState<string | null>(null);

 
   // شناسه ردیفی که منوی سه‌نقطه آن باز است.
  const [
    openMenuId,
    setOpenMenuId,
  ] = useState<string | null>(null);


  // نمایش پنجره تأیید حذف .
  const [
    deletingTopic,
    setDeletingTopic,
  ] = useState<Topic | null>(null);


  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setTitleError("");

    const validationResult =
      topicSchema.safeParse(formData);

    if (!validationResult.success) {
      setTitleError(
        validationResult.error
          .issues[0]
          .message
      );

      return;
    }

    
   
    const normalizedTitle =
      validationResult.data.title
        .trim();

     /*
     * topic duplicate control
     */
    const duplicateTopic =
      topics.find((topic) => {
          const isSameTitle =
            topic.title
              .trim()
              .toLocaleLowerCase() ===
            normalizedTitle
              .toLocaleLowerCase();

          /*
          * در حال ویرایش ->تکراری نیست
          */
          const isAnotherTopic =
            topic.id !== editingTopicId;

          return (
            isSameTitle &&
            isAnotherTopic
          );
      } );

    if (duplicateTopic) {
      setTitleError(
        "این موضوع قبلاً ثبت شده است."
      );

      return;
    }

    /*
     * حالت ویرایش
     */
    if (editingTopicId) {
      const updatedTopics =
        topics.map((topic) => {
          if (
            topic.id !== editingTopicId
          ) {
            return topic;
          }

          return {
            ...topic,

            title: normalizedTitle,
          };
        });

      onChange(updatedTopics);

      resetForm();

      return;
    }

    /*
     * new add
     */
    const newTopic: Topic = {
      id: crypto.randomUUID(),

      title: normalizedTitle,

      registeredAt:
        getCurrentPersianDate(),

      status: "Draft",
    };

    onChange([
      ...topics,
      newTopic,
    ]);

    resetForm();
  }

  // edit
  function handleEdit(
    topic: Topic
  ) {
    setFormData({
      title: topic.title,
    });

    setEditingTopicId(
      topic.id
    );

    setTitleError("");

    setOpenMenuId(null);
  }


// delete topic
  function handleDeleteConfirm() {
    if (!deletingTopic) {
      return;
    }

    const updatedTopics =
      topics.filter(
        (topic) =>
          topic.id !==
          deletingTopic.id
      );

    onChange(updatedTopics);

    /*
     * اگر موضوع در حال ویرایش حذف شد،
     * فرم نیز پاک می‌شود.
     */
    if (
      editingTopicId ===
      deletingTopic.id
    ) {
      resetForm();
    }

    setDeletingTopic(null);
    setOpenMenuId(null);
  }


  function handleNext() {
    /*
     * کنترل مجدد قبل از رفتن
     * به مرحله بعد
     */
    if (topics.length === 0) {
      setTitleError(
        "برای رفتن به مرحله بعد، حداقل یک موضوع ثبت کنید."
      );

      return;
    }

    onNext();
  }

  //reset
  function resetForm() {
    setFormData({
      title: "",
    });

    setEditingTopicId(null);

    setTitleError("");
  }
//Result
  return (
    <>
      <section
        className="
          max-w-4xl mx-auto
          bg-white
          border border-gray-200
          rounded-2xl
          shadow-sm
          p-6
        "
      >
        {/* عنوان بخش */}
        <header className="mb-7">
          <h2
            className="
              text-xl
              font-bold
              text-gray-800
            "
          >
            محورهای موضوعی
          </h2>

          <p
            className="
              mt-2
              text-sm
              text-gray-500
            "
          >
            حداقل یک موضوع برای برنامه ثبت کنید.
          </p>
        </header>

        {/* فرم ثبت موضوع */}
        <form
          onSubmit={handleSubmit}
          noValidate
        >
          <label
            htmlFor="topicTitle"
            className="
              block mb-2
              text-sm
              font-semibold
              text-gray-700
            "
          >
            عنوان موضوع

            <span className="text-red-500 mr-1">
              *
            </span>
          </label>

          <div
            className="
              flex flex-col
              md:flex-row
              items-start
              gap-3
            "
          >
            <div className="w-full">
              <input
                id="topicTitle"
                type="text"
                value={formData.title}
                onChange={(event) => {
                  setFormData({
                    title:
                      event.target.value,
                  });

                  setTitleError("");
                }}
                placeholder="عنوان موضوع را وارد کنید."
                className={`
                  w-full h-12
                  px-3
                  border
                  rounded-lg
                  outline-none
                  ${
                    titleError
                      ? "border-red-500"
                      : "border-gray-300 focus:border-[#007fcf]"
                  }
                `}
                aria-invalid={
                  Boolean(titleError)
                }
              />

              {titleError && (
                <p
                  className="
                    mt-1
                    text-xs
                    text-red-500
                  "
                >
                  {titleError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className={`
                min-w-36 h-12
                px-5
                rounded-lg
                text-white
                font-semibold
                flex items-center
                justify-center
                gap-2
                transition
                ${
                  editingTopicId
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-[#007fcf] hover:bg-[#006fb5]"
                }
              `}
            >
              {editingTopicId ? (
                <>
                  <Check size={18} />
                  ثبت ویرایش
                </>
              ) : (
                <>
                  <Plus size={18} />
                  ثبت موضوع
                </>
              )}
            </button>

            {editingTopicId && (
              <button
                type="button"
                onClick={resetForm}
                className="
                  h-12
                  px-4
                  border
                  border-gray-300
                  rounded-lg
                  text-gray-600
                  hover:bg-gray-50
                  transition
                "
              >
                <X size={18} />
              </button>
            )}
          </div>
        </form>

        {/* جدول موضوعات */}
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
                border-collapse
                min-w-2xl
              "
            >
              <thead>
                <tr className="bg-gray-50">
                  <th className={tableHeaderClass}>
                    ردیف
                  </th>

                  <th className={tableHeaderClass}>
                    موضوع
                  </th>

                  <th className={tableHeaderClass}>
                    تاریخ ثبت
                  </th>

                  <th className={tableHeaderClass}>
                    وضعیت
                  </th>

                  <th
                    className={`${tableHeaderClass} text-center`}
                  >
                    عملیات
                  </th>
                </tr>
              </thead>

              <tbody>
                {topics.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="
                        px-4 py-12
                        text-center
                        text-sm
                        text-gray-500
                      "
                    >
                      هنوز موضوعی ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  topics.map(
                    (topic, index) => (
                      <tr
                        key={topic.id}
                        className="
                          border-t
                          border-gray-200
                          hover:bg-gray-50/70
                        "
                      >
                        <td className={tableCellClass}>
                          {toPersianNumber(
                            index + 1
                          )}
                        </td>

                        <td
                          className={`
                            ${tableCellClass}
                            font-semibold
                            text-gray-800
                          `}
                        >
                          {topic.title}
                        </td>

                        <td className={tableCellClass}>
                          {topic.registeredAt}
                        </td>

                        <td className={tableCellClass}>
                          <TopicStatusBadge
                            status={
                              topic.status
                            }
                          />
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
                                    topic.id
                                      ? null
                                      : topic.id
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
                                transition
                              "
                              aria-label={
                                `عملیات موضوع ${topic.title}`
                              }
                            >
                              <EllipsisVertical
                                size={19}
                              />
                            </button>

                            {openMenuId ===
                              topic.id && (
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
                                      topic
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
                                    setDeletingTopic(
                                      topic
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

        {/* دکمه‌های پایین صفحه */}
        <footer
          className="
            mt-8 pt-5
            border-t
            border-gray-200
            flex items-center
            justify-between
          "
        >
          <button
            type="button"
            onClick={onBack}
            className="
              px-6 py-3
              border
              border-gray-300
              rounded-lg
              text-gray-700
              hover:bg-gray-50
              transition
            "
          >
            مرحله قبل
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={
              topics.length === 0
            }
            className="
              px-7 py-3
              rounded-lg
              bg-[#007fcf]
              text-white
              font-semibold
              hover:bg-[#006fb5]
              transition
              disabled:opacity-50
              disabled:cursor-not-allowed
              disabled:hover:bg-[#007fcf]
            "
          >
            مرحله بعد
          </button>
        </footer>
      </section>

      {/* پنجره تأیید حذف */}
      {deletingTopic && (
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

            <h3
              className="
                text-lg
                font-bold
                text-gray-800
              "
            >
              حذف موضوع
            </h3>

            <p
              className="
                mt-3
                text-sm
                text-gray-600
                leading-7
              "
            >
              آیا از حذف موضوع

              <strong className="mx-1">
                «{deletingTopic.title}»
              </strong>

              اطمینان دارید؟
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
                  setDeletingTopic(null)
                }
                className="
                  px-5 py-2.5
                  border
                  border-gray-300
                  rounded-lg
                  text-gray-700
                "
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

/*
 * تبدیل وضعیت انگلیسی به فارسی
 */
function TopicStatusBadge({
  status,
}: {
  status: TopicStatus;
}) {
  const statusConfig: Record<
    TopicStatus,
    {
      title: string;
      className: string;
    }
  > = {
    Draft: {
      title: "پیش‌نویس",

      className:
        "bg-yellow-100 text-yellow-700",
    },

    PendingReview: {
      title: "در انتظار بررسی",

      className:
        "bg-blue-100 text-blue-700",
    },

    Approved: {
      title: "تأییدشده",

      className:
        "bg-green-100 text-green-700",
    },

    Rejected: {
      title: "ردشده",

      className:
        "bg-red-100 text-red-700",
    },
  };

  const config =
    statusConfig[status];

  return (
    <span
      className={`
        inline-flex
        px-3 py-1
        rounded-full
        text-xs
        font-semibold
        ${config.className}
      `}
    >
      {config.title}
    </span>
  );
}

/*
 * تاریخ جاری شمسی
 *
 * چون این تابع بعد از کلیک کاربر اجرا می‌شود،
 * باعث خطای Hydration نمی‌شود.
 */
function getCurrentPersianDate() {
  return new Intl.DateTimeFormat(
    "fa-IR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(new Date());
}

/*
 * تبدیل عدد انگلیسی به فارسی
 */
function toPersianNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "fa-IR",
    {
      useGrouping: false,
    }
  ).format(value);
}

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