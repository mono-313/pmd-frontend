"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Eye,
  EyeOff,
} from "lucide-react";
import { z } from "zod";

import { saveUserSession } from "@/app/lib/storage";
import type { SafeUserSession } from "@/app/types/auth";
import styles from "./register.module.css";


const ROLE_VALUES = [
  "User",
  "Providers",
  "NetworkGroupManager",
  "NetworkManager",
  "Supervisor",
  "LiveSupervisor",
  "BroadcastManager",
  "PlanManager",
  "Admin",
] as const;


type RoleValue =
  typeof ROLE_VALUES[number];


interface SelectOption {
  id: number;
  name: string;
  networkId?: number;
}


const ROLE_OPTIONS:
  Array<{
    value: RoleValue;
    label: string;
  }> = [
  { value: "User", label: "کاربر" },
  { value: "Providers", label: "تهیه‌کننده" },
  {
    value: "NetworkGroupManager",
    label: "مدیر گروه شبکه",
  },
  {
    value: "NetworkManager",
    label: "مدیر شبکه",
  },
  { value: "Supervisor", label: "ناظر" },
  {
    value: "LiveSupervisor",
    label: "ناظر زنده",
  },
  {
    value: "BroadcastManager",
    label: "مدیر پخش",
  },
  {
    value: "PlanManager",
    label: "مدیر طرح و برنامه‌ریزی",
  },
  { value: "Admin", label: "ادمین" },
];

const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(
        3,
        "نام و نام خانوادگی حداقل سه کاراکتر باشد."
      ),

    userName: z
      .string()
      .trim()
      .min(3, "نام کاربری حداقل سه کاراکتر باشد.")
      .regex(
        /^[a-zA-Z0-9._-]+$/,
        "نام کاربری فقط شامل حروف انگلیسی، عدد، نقطه، خط تیره و زیرخط باشد."
      ),

    email: z
      .string()
      .trim()
      .email("ایمیل واردشده معتبر نیست."),

    password: z
      .string()
      .min(8, "رمز عبور حداقل هشت کاراکتر باشد."),

    confirmPassword: z.string(),

    networkIds: z.array(
      z.number().int().positive()
    ),

    networkGroupId: z
      .number()
      .int()
      .positive()
      .nullable(),

    role: z.enum(ROLE_VALUES),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "تکرار رمز عبور یکسان نیست.",
      path: ["confirmPassword"],
    }
  );

type RegisterFormData = z.infer<
  typeof registerSchema
>;

type RegisterFieldErrors = Partial<
  Record<keyof RegisterFormData, string>
>;

const initialFormData: RegisterFormData = {
  fullName: "",
  userName: "",
  email: "",
  password: "",
  confirmPassword: "",
  networkIds: [],
  networkGroupId: null,
  role: "User",
};

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] =
    useState<RegisterFormData>(initialFormData);

  const [fieldErrors, setFieldErrors] =
    useState<RegisterFieldErrors>({});

  const [serverError, setServerError] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [networks, setNetworks] =
    useState<SelectOption[]>([]);

  const [networkGroups, setNetworkGroups] =
    useState<SelectOption[]>([]);

  const [isLoadingAssignments, setIsLoadingAssignments] =
    useState(true);

  const [assignmentsError, setAssignmentsError] =
    useState("");


  const visibleNetworkGroups =
    useMemo(() => {
      if (formData.networkIds.length === 0) {
        return networkGroups;
      }

      const relatedGroups =
        networkGroups.filter(
          (group) =>
            group.networkId == null ||
            formData.networkIds.includes(
              group.networkId
            )
        );

      return relatedGroups.length > 0
        ? relatedGroups
        : networkGroups;
    }, [
      formData.networkIds,
      networkGroups,
    ]);


  useEffect(() => {
    const controller =
      new AbortController();

    async function loadNetworks() {
      try {
        setIsLoadingAssignments(true);
        setAssignmentsError("");

        const networkOptions =
          await fetchSelectOptions(
            ["/api/networks"],
            "network",
            controller.signal
          );

        if (controller.signal.aborted) {
          return;
        }

        setNetworks(networkOptions);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        console.error(
          "Register assignments error:",
          loadError
        );

        setAssignmentsError(
          loadError instanceof Error
            ? loadError.message
            : "دریافت شبکه‌ها انجام نشد."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingAssignments(false);
        }
      }
    }

    void loadNetworks();

    return () => controller.abort();
  }, []);


  useEffect(() => {
    if (formData.networkIds.length === 0) {
      setNetworkGroups([]);
      return;
    }

    const controller =
      new AbortController();

    async function loadNetworkGroups() {
      try {
        setIsLoadingAssignments(true);
        setAssignmentsError("");

        const groupsByNetwork =
          await Promise.all(
            formData.networkIds.map(
              (networkId) =>
                fetchSelectOptions(
                  [
                    `/api/networkgroups/${networkId}`,
                  ],
                  "networkGroup",
                  controller.signal
                )
            )
          );

        if (controller.signal.aborted) {
          return;
        }

        const mergedGroups = Array.from(
          new Map(
            groupsByNetwork
              .flat()
              .map((group) => [
                group.id,
                group,
              ])
          ).values()
        );

        setNetworkGroups(mergedGroups);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        console.error(
          "Register network groups error:",
          loadError
        );

        setNetworkGroups([]);
        setAssignmentsError(
          loadError instanceof Error
            ? loadError.message
            : "دریافت گروه‌های شبکه انجام نشد."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingAssignments(false);
        }
      }
    }

    void loadNetworkGroups();

    return () => controller.abort();
  }, [formData.networkIds]);

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [name]: undefined,
    }));

    setServerError("");
  }


  function handleNetworkToggle(
    networkId: number
  ) {
    setFormData((previous) => ({
      ...previous,
      networkGroupId: null,
      networkIds:
        previous.networkIds.includes(networkId)
          ? previous.networkIds.filter(
              (id) => id !== networkId
            )
          : [
              ...previous.networkIds,
              networkId,
            ],
    }));

    setFieldErrors((previous) => ({
      ...previous,
      networkIds: undefined,
      networkGroupId: undefined,
    }));
    setServerError("");
  }


  function handleNetworkGroupChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    const value = event.target.value;

    setFormData((previous) => ({
      ...previous,
      networkGroupId:
        value ? Number(value) : null,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      networkGroupId: undefined,
    }));
    setServerError("");
  }


  function handleRoleChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    setFormData((previous) => ({
      ...previous,
      role: event.target.value as RoleValue,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      role: undefined,
    }));
    setServerError("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFieldErrors({});
    setServerError("");

    const validationResult =
      registerSchema.safeParse(formData);

    if (!validationResult.success) {
      const nextErrors: RegisterFieldErrors = {};

      for (const issue of validationResult.error.issues) {
        const field =
          issue.path[0] as keyof RegisterFormData;

        if (!nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      }

      setFieldErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        "/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName: validationResult.data.fullName,
            userName: validationResult.data.userName,
            email: validationResult.data.email,
            password: validationResult.data.password,
            roles: [validationResult.data.role],
            networkIds:
              validationResult.data.networkIds,
            networkGroupId:
              validationResult.data.networkGroupId,
          }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        setServerError(
          responseData.message ||
            "ثبت‌نام انجام نشد."
        );
        return;
      }

      const safeSession =
        responseData as SafeUserSession;

      saveUserSession(safeSession);

      router.replace("/");
    } catch (error) {
      console.error("Register page error:", error);

      setServerError(
        "در ارتباط با سرور خطایی رخ داد."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page} dir="rtl">
      <section className={styles.intro}>
        <div className={styles.logo}>logo</div>

        <div>
          <span className={styles.eyebrow}>
           
          </span>

          <h1>
            ساخت حساب
            <br />
            کاربری جدید
          </h1>

          <p>
            پس از ثبت اطلاعات، دسترسی کاربر بر اساس
            نقش و شبکه‌های تخصیص‌یافته مدیریت می‌شود.
          </p>
        </div>
      </section>

      <section className={styles.formSection}>
        <form
          className={styles.form}
          onSubmit={handleSubmit}
          noValidate
        >
          <header className={styles.header}>
            <span>ثبت‌نام کاربر</span>
            <h2>ایجاد حساب</h2>
            <p>اطلاعات زیر را با دقت وارد کنید.</p>
          </header>

          <div className={styles.twoColumns}>
            <FormField
              id="fullName"
              label="نام و نام خانوادگی"
              value={formData.fullName}
              error={fieldErrors.fullName}
              onChange={handleInputChange}
            />

            <FormField
              id="userName"
              label="نام کاربری"
              value={formData.userName}
              error={fieldErrors.userName}
              onChange={handleInputChange}
              dir="ltr"
            />
          </div>

          <FormField
            id="email"
            label="ایمیل"
            type="email"
            value={formData.email}
            error={fieldErrors.email}
            onChange={handleInputChange}
            dir="ltr"
          />

          <div className={styles.twoColumns}>
            <FormField
              id="password"
              label="رمز عبور"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              error={fieldErrors.password}
              onChange={handleInputChange}
              dir="ltr"
              endAdornment={
                <PasswordVisibilityButton
                  isVisible={showPassword}
                  label="رمز عبور"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                />
              }
            />

            <FormField
              id="confirmPassword"
              label="تکرار رمز عبور"
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              value={formData.confirmPassword}
              error={fieldErrors.confirmPassword}
              onChange={handleInputChange}
              dir="ltr"
              endAdornment={
                <PasswordVisibilityButton
                  isVisible={showConfirmPassword}
                  label="تکرار رمز عبور"
                  onClick={() =>
                    setShowConfirmPassword(
                      (value) => !value
                    )
                  }
                />
              }
            />
          </div>

          <div className={styles.twoColumns}>
            <MultiSelectField
              label="شبکه‌ها"
              options={networks}
              selectedIds={formData.networkIds}
              error={fieldErrors.networkIds}
              isLoading={isLoadingAssignments}
              onToggle={handleNetworkToggle}
            />

            <SelectField
              id="networkGroupId"
              label="گروه شبکه"
              value={formData.networkGroupId}
              placeholder="گروه شبکه را انتخاب کنید"
              options={visibleNetworkGroups}
              error={fieldErrors.networkGroupId}
              disabled={isLoadingAssignments}
              onChange={handleNetworkGroupChange}
            />
          </div>

          <SelectField
            id="role"
            label="نقش"
            value={formData.role}
            options={ROLE_OPTIONS}
            error={fieldErrors.role}
            onChange={handleRoleChange}
          />

          {assignmentsError && (
            <div
              className={styles.serverError}
              role="alert"
            >
              {assignmentsError}
            </div>
          )}

          {serverError && (
            <div className={styles.serverError} role="alert">
              {serverError}
            </div>
          )}

          <button
            className={styles.submit}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "در حال ثبت‌نام..."
              : "ایجاد حساب کاربری"}
          </button>

          <p className={styles.loginLink}>
            قبلاً ثبت‌نام کرده‌اید؟
            <Link href="/login">ورود</Link>
          </p>
        </form>
      </section>
    </main>
  );
}

interface FormFieldProps {
  id: keyof RegisterFormData;
  label: string;
  value: string;
  error?: string;
  type?: string;
  placeholder?: string;
  dir?: "rtl" | "ltr";
  endAdornment?: ReactNode;
  onChange: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
}

function FormField({
  id,
  label,
  value,
  error,
  type = "text",
  placeholder,
  dir = "rtl",
  endAdornment,
  onChange,
}: FormFieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>

      <div style={{ position: "relative" }}>
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          dir={dir}
          aria-invalid={Boolean(error)}
          style={
            endAdornment
              ? { paddingLeft: 46 }
              : undefined
          }
        />

        {endAdornment}
      </div>

      {error && (
        <small className={styles.error}>{error}</small>
      )}
    </div>
  );
}


function PasswordVisibilityButton({
  isVisible,
  label,
  onClick,
}: {
  isVisible: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        isVisible
          ? `مخفی کردن ${label}`
          : `نمایش ${label}`
      }
      title={
        isVisible
          ? "مخفی کردن رمز"
          : "نمایش رمز"
      }
      style={{
        position: "absolute",
        left: 10,
        top: "50%",
        transform: "translateY(-50%)",
        display: "grid",
        placeItems: "center",
        width: 32,
        height: 32,
        padding: 0,
        border: 0,
        color: "#657087",
        background: "transparent",
        cursor: "pointer",
      }}
    >
      {isVisible
        ? <EyeOff size={19} />
        : <Eye size={19} />}
    </button>
  );
}


function MultiSelectField({
  label,
  options,
  selectedIds,
  error,
  isLoading,
  onToggle,
}: {
  label: string;
  options: SelectOption[];
  selectedIds: number[];
  error?: string;
  isLoading: boolean;
  onToggle: (id: number) => void;
}) {
  const selectedNames = options
    .filter((option) =>
      selectedIds.includes(option.id)
    )
    .map((option) => option.name);

  return (
    <div className={styles.field}>
      <label>{label}</label>

      <details style={{ position: "relative" }}>
        <summary
          aria-invalid={Boolean(error)}
          style={{
            display: "flex",
            alignItems: "center",
            minHeight: 48,
            padding: "0 14px",
            border: `1px solid ${
              error ? "#c33c4d" : "#e1e6ef"
            }`,
            borderRadius: 10,
            color:
              selectedNames.length > 0
                ? "#17233d"
                : "#758097",
            background: "#ffffff",
            cursor: isLoading
              ? "wait"
              : "pointer",
            listStyle: "none",
          }}
        >
          {isLoading
            ? "در حال دریافت شبکه‌ها..."
            : selectedNames.length > 0
              ? selectedNames.join("، ")
              : "شبکه‌ها را انتخاب کنید"}
        </summary>

        {!isLoading && (
          <div
            style={{
              position: "absolute",
              zIndex: 20,
              top: "calc(100% + 6px)",
              right: 0,
              left: 0,
              maxHeight: 220,
              overflowY: "auto",
              padding: 8,
              border: "1px solid #e1e6ef",
              borderRadius: 10,
              background: "#ffffff",
              boxShadow:
                "0 12px 28px rgba(23,35,61,0.14)",
            }}
          >
            {options.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  padding: 10,
                  color: "#758097",
                  fontSize: 13,
                }}
              >
                شبکه‌ای برای انتخاب وجود ندارد.
              </p>
            ) : (
              options.map((option) => (
                <label
                  key={option.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "9px 8px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(
                      option.id
                    )}
                    onChange={() =>
                      onToggle(option.id)
                    }
                    style={{
                      width: 16,
                      height: 16,
                      padding: 0,
                      accentColor: "#2457d6",
                    }}
                  />
                  {option.name}
                </label>
              ))
            )}
          </div>
        )}
      </details>

      {error && (
        <small className={styles.error}>{error}</small>
      )}
    </div>
  );
}


function SelectField({
  id,
  label,
  value,
  options,
  placeholder,
  error,
  disabled = false,
  onChange,
}: {
  id: "networkGroupId" | "role";
  label: string;
  value: number | string | null;
  options: Array<{
    id?: number;
    name?: string;
    value?: string;
    label?: string;
  }>;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  onChange: (
    event: ChangeEvent<HTMLSelectElement>
  ) => void;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>

      <select
        id={id}
        name={id}
        value={value ?? ""}
        disabled={disabled}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        style={{
          width: "100%",
          height: 48,
          padding: "0 14px",
          border: `1px solid ${
            error ? "#c33c4d" : "#e1e6ef"
          }`,
          borderRadius: 10,
          outline: "none",
          color: "#17233d",
          background: "#ffffff",
        }}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}

        {options.map((option) => {
          const optionValue =
            option.id ?? option.value ?? "";
          const optionLabel =
            option.name ?? option.label ?? "";

          return (
            <option
              key={String(optionValue)}
              value={optionValue}
            >
              {optionLabel}
            </option>
          );
        })}
      </select>

      {error && (
        <small className={styles.error}>{error}</small>
      )}
    </div>
  );
}


async function fetchSelectOptions(
  paths: string[],
  kind: "network" | "networkGroup",
  signal: AbortSignal
): Promise<SelectOption[]> {
  let lastError:
    Error | null = null;

  for (const path of paths) {
    try {
      const response = await fetch(path, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
        signal,
      });

      const responseText =
        await response.text();
      const responseData =
        parseJsonResponse(responseText);

      if (!response.ok) {
        lastError = new Error(
          getApiErrorMessage(responseData) ??
            `دریافت اطلاعات انجام نشد. کد پاسخ: ${response.status}`
        );
        continue;
      }

      return normalizeSelectOptions(
        responseData,
        kind
      );
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }

      lastError =
        error instanceof Error
          ? error
          : new Error(
              "دریافت اطلاعات پایه انجام نشد."
            );
    }
  }

  throw (
    lastError ??
    new Error(
      "وب‌سرویس اطلاعات پایه در دسترس نیست."
    )
  );
}


function normalizeSelectOptions(
  value: unknown,
  kind: "network" | "networkGroup"
): SelectOption[] {
  const rawItems = findFirstArray(value);
  const result:
    SelectOption[] = [];

  for (const item of rawItems) {
    if (!isRecord(item)) {
      continue;
    }

    const id = readPositiveInteger(
      kind === "network"
        ? item.id ??
            item.Id ??
            item.networkId ??
            item.NetworkId ??
            item.value ??
            item.Value
        : item.id ??
            item.Id ??
            item.networkGroupId ??
            item.NetworkGroupId ??
            item.value ??
            item.Value
    );

    const rawName =
      item.name ??
      item.Name ??
      item.title ??
      item.Title ??
      item.text ??
      item.Text ??
      (kind === "network"
        ? item.networkName ??
          item.NetworkName ??
          item.networkTitle ??
          item.NetworkTitle
        : item.networkGroupName ??
          item.NetworkGroupName ??
          item.networkGroupTitle ??
          item.NetworkGroupTitle ??
          item.groupName ??
          item.GroupName);

    const name =
      typeof rawName === "string"
        ? rawName.trim()
        : "";

    if (id === null || !name) {
      continue;
    }

    const networkId =
      kind === "networkGroup"
        ? readPositiveInteger(
            item.networkId ??
              item.NetworkId
          ) ?? undefined
        : undefined;

    result.push({
      id,
      name,
      networkId,
    });
  }

  return Array.from(
    new Map(
      result.map((item) => [
        item.id,
        item,
      ])
    ).values()
  ).sort((first, second) =>
    first.name.localeCompare(
      second.name,
      "fa"
    )
  );
}


function findFirstArray(
  value: unknown
): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return [];
  }

  for (const field of [
    "items",
    "Items",
    "data",
    "Data",
    "result",
    "Result",
    "networks",
    "Networks",
    "networkGroups",
    "NetworkGroups",
  ]) {
    const nested = value[field];

    if (Array.isArray(nested)) {
      return nested;
    }

    const nestedArray =
      findFirstArray(nested);

    if (nestedArray.length > 0) {
      return nestedArray;
    }
  }

  return [];
}


function parseJsonResponse(
  value: string
): unknown | null {
  if (!value.trim()) {
    return null;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}


function getApiErrorMessage(
  value: unknown
): string | null {
  if (!isRecord(value)) {
    return null;
  }

  for (const field of [
    "message",
    "description",
    "detail",
    "title",
  ]) {
    const message = value[field];

    if (
      typeof message === "string" &&
      message.trim()
    ) {
      return message.trim();
    }
  }

  return null;
}


function readPositiveInteger(
  value: unknown
): number | null {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string" &&
          value.trim()
        ? Number(value)
        : Number.NaN;

  return Number.isInteger(numberValue) &&
    numberValue > 0
    ? numberValue
    : null;
}


function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}
