"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  useState,
} from "react";
import { z } from "zod";

import { saveUserSession } from "@/app/lib/storage";
import type { SafeUserSession } from "@/app/types/auth";
import styles from "./register.module.css";

const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, "نام کامل حداقل سه کاراکتر باشد."),

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

    networkIds: z
      .string()
      .trim(),

    networkGroupId: z
      .string()
      .trim(),
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
  networkIds: "",
  networkGroupId: "",
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

    //network - networkGroupId
    const networkIds = validationResult.data.networkIds
      ? validationResult.data.networkIds
          .split(",")
          .map((value) => Number(value.trim()))
          .filter((value) => Number.isInteger(value) && value > 0)
      : [];

    const networkGroupId =
      validationResult.data.networkGroupId
        ? Number(validationResult.data.networkGroupId)
        : null;

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
            networkIds,
            networkGroupId,
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
              label="نام کامل"
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
            />

            <FormField
              id="confirmPassword"
              label="تکرار رمز عبور"
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              error={fieldErrors.confirmPassword}
              onChange={handleInputChange}
              dir="ltr"
            />
          </div>

          <label className={styles.showPassword}>
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) =>
                setShowPassword(event.target.checked)
              }
            />
            نمایش رمز عبور
          </label>

          <div className={styles.twoColumns}>
            <FormField
              id="networkIds"
              label="شناسه شبکه‌ها"
              placeholder="مثال: 1,2"
              value={formData.networkIds}
              error={fieldErrors.networkIds}
              onChange={handleInputChange}
              dir="ltr"
            />

            <FormField
              id="networkGroupId"
              label="شناسه گروه برنامه‌ساز"
              type="number"
              placeholder="مثال: 5"
              value={formData.networkGroupId}
              error={fieldErrors.networkGroupId}
              onChange={handleInputChange}
              dir="ltr"
            />
          </div>

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
  onChange,
}: FormFieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>

      <input
        id={id}
        name={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        dir={dir}
        aria-invalid={Boolean(error)}
      />

      {error && (
        <small className={styles.error}>{error}</small>
      )}
    </div>
  );
}
