"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  LoaderCircle,
  MessageSquareText,
  Send,
  UserRound,
} from "lucide-react";

import type {
  ProgramProfileStatus,
  ProgramType,
  SupervisorCommentResponse,
} from "@/app/types/program-profile";


interface ProgramProfileSupervisorCommentsProps {
  profileId:
    string;

  status:
    ProgramProfileStatus;

  programType:
    ProgramType;
}


interface StoredUserSession {
  roles?: unknown;
  profileRole?: unknown;
  profile_role?: unknown;
}


export default function ProgramProfileSupervisorComments({
  profileId,
  status,
  programType,
}: ProgramProfileSupervisorCommentsProps) {
  const [
    comments,
    setComments,
  ] = useState<
    SupervisorCommentResponse[]
  >([]);

  const [
    roles,
    setRoles,
  ] = useState<string[]>([]);

  const [
    commentText,
    setCommentText,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

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


  useEffect(() => {
    setRoles(
      readStoredRoles()
    );
  }, []);


  const canCreateComment =
    useMemo(
      () =>
        canUserCreateComment(
          status,
          programType,
          roles
        ),
      [
        programType,
        roles,
        status,
      ]
    );


  const loadComments =
    useCallback(
      async () => {
        try {
          setIsLoading(true);
          setError("");

          const response =
            await fetch(
              `/api/program-profiles/${encodeURIComponent(
                profileId
              )}/supervisor-comments`,
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
                "دریافت نظرات ناظر انجام نشد."
            );
          }

          const commentItems =
            extractCommentItems(
              responseData
            );

          if (!commentItems) {
            throw new Error(
              "ساختار پاسخ نظرات ناظر معتبر نیست."
            );
          }

          setComments(
            commentItems
          );
        } catch (loadError) {
          setComments([]);

          setError(
            loadError instanceof Error
              ? loadError.message
              : "دریافت نظرات ناظر انجام نشد."
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
    void loadComments();
  }, [
    loadComments,
  ]);


  async function submitComment() {
    const normalizedComment =
      commentText.trim();

    if (!normalizedComment) {
      setError(
        "متن نظر ناظر الزامی است."
      );

      return;
    }

    if (
      !canCreateComment ||
      isSubmitting
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
            profileId
          )}/supervisor-comments`,
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
              JSON.stringify({
                comment:
                  normalizedComment,
              }),

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
            "ثبت نظر ناظر انجام نشد."
        );
      }

      setCommentText("");

      setSuccessMessage(
        "نظر ناظر با موفقیت ثبت شد."
      );

      await loadComments();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "ثبت نظر ناظر انجام نشد."
      );
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
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
      dir="rtl"
    >
      <header
        className="
          flex
          items-center
          gap-2
        "
      >
        <MessageSquareText
          size={21}
          className="text-[#007fcf]"
        />

        <h2
          className="
            text-lg
            font-bold
            text-gray-800
          "
        >
          نظرات ناظر
        </h2>
      </header>


      {canCreateComment && (
        <div
          className="
            mt-5
            rounded-xl
            border
            border-blue-100
            bg-blue-50/40
            p-4
          "
        >
          <label
            htmlFor="supervisor-comment"
            className="
              mb-2
              block
              text-sm
              font-medium
              text-gray-700
            "
          >
            ثبت نظر جدید
          </label>

          <textarea
            id="supervisor-comment"
            value={
              commentText
            }
            onChange={(
              event
            ) =>
              setCommentText(
                event.target.value
              )
            }
            rows={4}
            disabled={
              isSubmitting
            }
            placeholder="نظر تخصصی خود را درباره شناسنامه وارد کنید."
            className="
              w-full
              resize-y
              rounded-xl
              border
              border-gray-300
              bg-white
              p-3
              text-sm
              outline-none
              transition
              focus:border-[#007fcf]
              disabled:bg-gray-100
            "
          />

          <button
            type="button"
            disabled={
              isSubmitting ||
              !commentText.trim()
            }
            onClick={() =>
              void submitComment()
            }
            className="
              mt-3
              flex
              items-center
              gap-2
              rounded-xl
              bg-[#007fcf]
              px-5
              py-2.5
              text-sm
              font-medium
              text-white
              transition
              hover:bg-blue-700
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
                  <Send
                    size={18}
                  />
                )}

            ثبت نظر
          </button>
        </div>
      )}


      {error && (
        <div
          className="
            mt-4
            flex
            items-start
            gap-2
            rounded-xl
            border
            border-red-200
            bg-red-50
            p-3
            text-sm
            text-red-700
          "
        >
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          {error}
        </div>
      )}


      {successMessage && (
        <div
          className="
            mt-4
            rounded-xl
            border
            border-green-200
            bg-green-50
            p-3
            text-sm
            text-green-700
          "
        >
          {successMessage}
        </div>
      )}


      <div
        className="
          mt-6
          border-t
          border-gray-200
          pt-5
        "
      >
        {isLoading
          ? (
              <div
                className="
                  flex
                  items-center
                  gap-2
                  py-6
                  text-sm
                  text-gray-500
                "
              >
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />

                در حال دریافت نظرات...
              </div>
            )
          : comments.length ===
              0
            ? (
                <p
                  className="
                    py-6
                    text-center
                    text-sm
                    text-gray-500
                  "
                >
                  تاکنون نظری برای این شناسنامه ثبت نشده است.
                </p>
              )
            : (
                <div
                  className="space-y-3"
                >
                  {comments.map(
                    (
                      comment
                    ) => (
                      <article
                        key={
                          comment.id
                        }
                        className="
                          rounded-xl
                          border
                          border-gray-200
                          bg-gray-50
                          p-4
                        "
                      >
                        <div
                          className="
                            flex
                            flex-wrap
                            items-center
                            justify-between
                            gap-2
                          "
                        >
                          <div
                            className="
                              flex
                              items-center
                              gap-2
                              text-sm
                              font-medium
                              text-gray-700
                            "
                          >
                            <UserRound
                              size={17}
                            />

                            {comment.supervisorName ||
                              "ناظر برنامه"}
                          </div>

                          <time
                            className="
                              text-xs
                              text-gray-400
                            "
                          >
                            {formatPersianDateTime(
                              comment.createdDate
                            )}
                          </time>
                        </div>

                        <p
                          className="
                            mt-3
                            whitespace-pre-wrap
                            text-sm
                            leading-7
                            text-gray-700
                          "
                        >
                          {comment.comment}
                        </p>
                      </article>
                    )
                  )}
                </div>
              )}
      </div>
    </section>
  );
}


function canUserCreateComment(
  status:
    ProgramProfileStatus,

  programType:
    ProgramType,

  roles:
    readonly string[]
): boolean {
  if (
    status !==
    "PendingSupervisor"
  ) {
    return false;
  }

  const normalizedRoles =
    new Set(
      roles.map(
        normalizeRoleName
      )
    );

  if (
    normalizedRoles.has(
      "admin"
    )
  ) {
    return true;
  }

  if (
    Number(
      programType
    ) === 10
  ) {
    return normalizedRoles.has(
      "livesupervisor"
    );
  }

  if (
    Number(
      programType
    ) === 20
  ) {
    return normalizedRoles.has(
      "supervisor"
    );
  }

  return false;
}


function extractCommentItems(
  value:
    unknown
): SupervisorCommentResponse[] | null {
  if (
    Array.isArray(
      value
    )
  ) {
    return value.filter(
      isSupervisorComment
    );
  }

  if (
    !isRecord(
      value
    )
  ) {
    return null;
  }

  if (
    Array.isArray(
      value.items
    )
  ) {
    return value.items.filter(
      isSupervisorComment
    );
  }

  if (
    isRecord(
      value.data
    ) ||
    Array.isArray(
      value.data
    )
  ) {
    return extractCommentItems(
      value.data
    );
  }

  return null;
}


function isSupervisorComment(
  value:
    unknown
): value is SupervisorCommentResponse {
  return (
    isRecord(
      value
    ) &&
    typeof value.id ===
      "string" &&
    typeof value.comment ===
      "string" &&
    typeof value.createdDate ===
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

    const parsed =
      JSON.parse(
        storedSession
      ) as unknown;

    if (
      !isRecord(
        parsed
      )
    ) {
      return [];
    }

    const session =
      parsed as StoredUserSession;

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
  value:
    string
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /[\s_-]+/g,
      ""
    );
}


function formatPersianDateTime(
  value:
    string
): string {
  const date =
    new Date(
      value
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

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  ).format(
    date
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