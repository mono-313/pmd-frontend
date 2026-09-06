"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye,EyeOff } from 'lucide-react';
import Image from "next/image";


const eye = () => {
  return (
    <Eye />
  );
};

const eyeoff = () => {
  return (
    <EyeOff />
  );
};





import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import { z } from "zod";

import { saveUserSession } from "@/app/lib/storage";

import type { SafeUserSession } from "@/app/types/auth";

import styles from "@/app/login/login.module.css";

/*
 * Schema اعتبارسنجی فرم Login
 */
const loginSchema = z.object({
  userName: z
    .string()
    .trim()
    .min(
      1,
      "نام کاربری را وارد کنید."
    )
    .min(
      3,
      "نام کاربری حداقل سه کاراکتر باشد."
    ),

  password: z
    .string()
    .min(
      1,
      "رمز عبور را وارد کنید."
    )
    .min(
      8,
      "رمز عبور حداقل هشت کاراکتر باشد."
    ),

  captcha: z
    .string()
    .min(
      1,
      "پاسخ کپچا را وارد کنید."
    ),
});


type LoginFormData =
  z.infer<typeof loginSchema>;

type LoginFieldErrors = Partial<
  Record<keyof LoginFormData, string>
>;


//captcha test
function createCaptcha() {
  const firstNumber =
    Math.floor(Math.random() * 8) + 1;

  const secondNumber =
    Math.floor(Math.random() * 8) + 1;

  return {
    firstNumber,
    secondNumber,

    answer:
      firstNumber + secondNumber,
  };
}



//main function
export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] =
    useState<LoginFormData>({
      userName: "",
      password: "",
      captcha: "",
    });

//field error
  const [fieldErrors, setFieldErrors] =
    useState<LoginFieldErrors>({});
//server error
  const [serverError, setServerError] =
    useState("");

//submit
  const [isSubmitting, setIsSubmitting] =
    useState(false);

//password
  const [showPassword, setShowPassword] =
    useState(false);
//captcha
  const captcha = useMemo(
    () => createCaptcha(),
    []
  );


  
  //handle field error
  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setFieldErrors((previousErrors) => ({
      ...previousErrors,
      [name]: undefined,
    }));

    setServerError("");
  }

  //submit func
  //fetch
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFieldErrors({});
    setServerError("");

    //validation zod :)

    const validationResult =
      loginSchema.safeParse(formData);

    if (!validationResult.success) {
      const newErrors: LoginFieldErrors = {};

      for (
        const issue of validationResult.error.issues
      ) {
        const fieldName =
          issue.path[0] as keyof LoginFormData;

        newErrors[fieldName] =
          issue.message;
      }

      setFieldErrors(newErrors);

      return;
    }

    /*
     * کپچای تستی
     */
    if (
      Number(validationResult.data.captcha) !==
      captcha.answer
    ) {
      setFieldErrors({
        captcha:
          "پاسخ کپچا صحیح نیست.",
      });

      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            userName:
              validationResult.data.userName,

            password:
              validationResult.data.password,
          }),
        }
      );

      const responseData =
        await response.json();

      if (!response.ok) {
        setServerError(
          responseData.message ||
            "ورود انجام نشد."
        );

        return;
      }

      const safeSession =
        responseData as SafeUserSession;

      saveUserSession(safeSession);

      router.replace("/");
    } catch (error) {
      console.error(
        "Login page error:",
        error
      );

      setServerError(
        "خطایی در ارتباط با سرور رخ داد."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      className={styles.page}
      dir="rtl"
    >
      <section className={styles.intro}>
        <div className={styles.logo}>
          <Image
              src="/images/logo.jpg"
              alt="لوگوی موج پلاس"
              width={200}
              height={200}
              priority
              className="rounded-full object-cover"
            />
        </div>

        <div>
          <span className={styles.eyebrow}>
           ورود به سامانه
          </span>

          <h1>
           سامانه موج پلاس
          </h1>

          <p>
          </p>
        </div>
      </section>

      <section className={styles.formSection}>
        <form
          className={styles.form}
          onSubmit={handleSubmit}
          noValidate
        >
          <header className={styles.formHeader}>
            
            <h2>خوش آمدید</h2>

            <p>
              اطلاعات حساب خود را وارد کنید.
            </p>
          </header>

          <div className={styles.field}>
            <label htmlFor="userName">
              نام کاربری
            </label>

            <input
              id="userName"
              name="userName"
              type="text"
              value={formData.userName}
              onChange={handleInputChange}
              autoComplete="username"
              placeholder="نام کاربری"
              aria-invalid={
                Boolean(fieldErrors.userName)
              }
            />

            {fieldErrors.userName && (
              <small className={styles.error}>
                {fieldErrors.userName}
              </small>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="password">
              رمز عبور
            </label>

            <div className={styles.passwordField}>
              <input
                id="password"
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={formData.password}
                onChange={handleInputChange}
                autoComplete="current-password"
                placeholder="رمز عبور"
                aria-invalid={
                  Boolean(
                    fieldErrors.password
                  )
                }
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (previous) => !previous
                  )
                }
              >
                {showPassword
                  ? <EyeOff />
                  : <Eye />}
              </button>
            </div>

            {fieldErrors.password && (
              <small className={styles.error}>
                {fieldErrors.password}
              </small>
            )}
          </div>

          <div className={styles.captchaRow}>
            <div className={styles.field}>
              <label htmlFor="captcha">
               کپچا
              </label>

              <input
                id="captcha"
                name="captcha"
                type="text"
                inputMode="numeric"
                value={formData.captcha}
                onChange={handleInputChange}
                placeholder="پاسخ"
                aria-invalid={
                  Boolean(fieldErrors.captcha)
                }
              />

              {fieldErrors.captcha && (
                <small className={styles.error}>
                  {fieldErrors.captcha}
                </small>
              )}
            </div>

            <div className={styles.captcha}>
              <span>
                {captcha.firstNumber}
                {" + "}
                {captcha.secondNumber}
                {" = ؟"}
              </span>
            </div>
          </div>

          {serverError && (
            <div
              className={styles.serverError}
              role="alert"
            >
              {serverError}
            </div>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "در حال ورود..."
              : "ورود به سامانه"}
          </button>

          <p className={styles.registerLink}>
            حساب کاربری ندارید؟

            <Link href="/register">
              ثبت‌نام
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}