"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EllipsisVertical, Pencil, Send, Trash2, Eye } from "lucide-react";

import ForecastConfirmDialog from
  "@/app/component/forecast/forecast-confirm-dialog";

import { getForecastRowPermissions } from
  "@/app/lib/forecast-permissions";

import type {
  ForecastActionResponse,
  ForecastResponse,
} from "@/app/types/forecast";

interface ForecastActionsProps {
  forecast: ForecastResponse;
  onChanged: () => void | Promise<void>;
}

type PendingAction = "delete" | "submit" | null;

interface MenuPosition {
  top: number;
  left: number;
}

export default function ForecastActions({
  forecast,
  onChanged,
}: ForecastActionsProps) {
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [openMenu, setOpenMenu] = useState(false);
  const [menuPosition, setMenuPosition] = 
  useState<MenuPosition>({
    top: 0,
    left: 0,
  });
  const [pendingAction, setPendingAction] = 
  useState<PendingAction>(null);
  const [isLoading, setIsLoading] = 
  useState(false);
  const [error, setError] = 
  useState("");

  const permissions = 
  getForecastRowPermissions(forecast.status);

  useEffect(() => {
    if (!openMenu) return;

    function closeOnOutsideClick(event: MouseEvent) {
      const target = event.target as Node;

      if (
        !buttonRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpenMenu(false);
      }
    }

    function closeOnScroll() {
      setOpenMenu(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    window.addEventListener("scroll", closeOnScroll, true);
    window.addEventListener("resize", closeOnScroll);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      window.removeEventListener("scroll", closeOnScroll, true);
      window.removeEventListener("resize", closeOnScroll);
    };
  }, [openMenu]);

  function toggleMenu() {
    if (!openMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();

      setMenuPosition({
        top: rect.bottom + 6,
        left: Math.max(12, rect.right - 192),
      });
    }

    setOpenMenu((previous) => !previous);
  }

  function openConfirmation
  (action: Exclude<PendingAction, null>) {
    setOpenMenu(false);
    setError("");
    setPendingAction(action);
  }

  async function confirmAction() {
    if (!pendingAction) return;

    try {
      setIsLoading(true);
      setError("");

      const endpoint =
        pendingAction === "delete"
          ? `/api/forecasts/${forecast.id}`
          : `/api/forecasts/${forecast.id}/submit`;

      const method = pendingAction === "delete" ? 
      "DELETE" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          Accept: "application/json",
        },
      });

      const responseData = parseJsonResponse
      (await response.text());

      if (!response.ok) {
        throw new Error(
          getMessage(responseData) ??
            (pendingAction === "delete"
              ? "حذف پیش‌بینی انجام نشد."
              : "ارسال پیش‌بینی برای مدیر گروه انجام نشد.")
        );
      }

      setPendingAction(null);
      await onChanged();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "انجام عملیات با خطا مواجه شد."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        aria-label="عملیات پیش‌بینی"
        aria-expanded={openMenu}
      >
        <EllipsisVertical size={20} />
      </button>

      {openMenu && (
        <div
          ref={menuRef}
          className="fixed 
                      z-[90] 
                      w-48 
                      overflow-hidden 
                      rounded-xl
                      border 
                      border-gray-200 
                      bg-white 
                      py-1 
                      shadow-xl"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
          }}
          dir="rtl"
        >
          {permissions.canView && (
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/forecasts/${forecast.id}`
                )
              }
              className="
                flex 
                w-full
                items-center 
                gap-3
                px-4 
                py-2.5
                text-right 
                text-sm
                text-gray-700
                hover:bg-gray-50
              "
            >
              <Eye size={17} />

              مشاهده
            </button>
          )}
          
          {permissions.canEdit && (
            <button
              type="button"
              onClick={() =>
                router.push(`/forecasts/${forecast.id}/edit`)
              }
              className="flex w-full items-center gap-3 px-4 py-2.5 text-right text-sm text-gray-700 hover:bg-blue-50 hover:text-[#007fcf]"
            >
              <Pencil size={17} />
              ویرایش
            </button>
          )}

          {permissions.canSubmit && (
            <button
              type="button"
              onClick={() => openConfirmation("submit")}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-right text-sm text-gray-700 hover:bg-blue-50 hover:text-[#007fcf]"
            >
              <Send size={17} />
              ارسال برای مدیر گروه
            </button>
          )}

          {permissions.canDelete && (
            <button
              type="button"
              onClick={() => openConfirmation("delete")}
              className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-2.5 text-right text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 size={17} />
              حذف
            </button>
          )}
        </div>
      )}

      {pendingAction && (
        <ForecastConfirmDialog
          open
          variant={pendingAction}
          forecastTitle={forecast.mainTopic}
          error={error}
          isLoading={isLoading}
          onCancel={() => {
            if (!isLoading) {
              setPendingAction(null);
              setError("");
            }
          }}
          onConfirm={confirmAction}
        />
      )}
    </>
  );
}

function parseJsonResponse(text: string): unknown | null {
  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): 
value is Record<string, unknown> {

  return typeof 
  value === "object" && 
  value !== null && !Array.isArray(value);
}

function getMessage(value: unknown):
 string | null {
  if (!isRecord(value)) 
    return null;

  if (typeof value.message === "string") 
    return value.message;
  
  if (typeof value.description === "string") 
    return value.description;
  return null;
}
