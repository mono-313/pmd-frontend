import type { SafeUserSession } from "@/app/types/auth";

const USER_SESSION_KEY = "pmd-user-session";

export function saveUserSession(
  session: SafeUserSession
) {
  /*
   * window فقط در مرورگر وجود دارد.
   */
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    USER_SESSION_KEY,
    JSON.stringify(session)
  );
}

export function getUserSession():
  | SafeUserSession
  | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedSession =
    localStorage.getItem(USER_SESSION_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    return JSON.parse(
      storedSession
    ) as SafeUserSession;
  } catch {
    /*
     * اگر اطلاعات خراب یا غیرقابل‌خواندن بود،
     * آن را حذف می‌کنیم.
     */
    localStorage.removeItem(USER_SESSION_KEY);

    return null;
  }
}

export function removeUserSession() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(USER_SESSION_KEY);
}