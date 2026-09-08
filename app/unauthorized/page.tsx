"use client";

import {
  ShieldAlert,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";


export default function UnauthorizedPage() {
  const router =
    useRouter();


  return (
    <main
      className="
        flex min-h-[70vh]
        items-center
        justify-center
        p-6
      "
      dir="rtl"
    >
      <div
        className="
          w-full
          max-w-lg
          rounded-2xl
          border border-red-200
          bg-white
          p-8
          text-center
          shadow-sm
        "
      >
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600"
        >
          <ShieldAlert
            size={30}
          />
        </div>

        <h1
          className="
            mt-5
            text-xl
            font-bold
            text-gray-800
          "
        >
          عدم دسترسی
        </h1>

        <p
          className="
            mt-3
            text-sm
            leading-7
            text-gray-500
          "
        >
          نقش کاربری شما اجازه مشاهده این صفحه یا انجام این عملیات را ندارد.
        </p>

        <button
          type="button"
          onClick={() =>
            router.replace("/")
          }
          className="
            mt-6
            rounded-lg
            bg-[#007fcf]
            px-6 py-2.5
            font-semibold
            text-white
            hover:bg-[#006bab]
          "
        >
          بازگشت به صفحه اصلی
        </button>
      </div>
    </main>
  );
}