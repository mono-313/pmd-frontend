"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  Building2,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Mail,
  Network,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

type Profile = {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  phoneNumber: string | null;
  profilePictureUrl: string | null;
  roles: string[];
  networkIds: number[];
  networkGroupId: number | null;
};

type Option = { id: number; name: string };
type RoleOption = { id: string; name: string };

const ROLE_TITLES: Record<string, string> = {
  User: "کاربر",
  Producer: "تهیه‌کننده",
  NetworkGroupManager: "مدیر گروه شبکه",
  NetworkManager: "مدیر شبکه",
  Supervisor: "ناظر",
  LiveSupervisor: "ناظر زنده",
  BroadcastManager: "مدیر پخش",
  PlanningManager: "مدیر طرح و برنامه‌ریزی",
  Admin: "ادمین",
};

function pickArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const object = payload as Record<string, unknown>;
  for (const key of ["data", "items", "roles", "networks", "networkGroups"]) {
    if (Array.isArray(object[key])) return object[key] as unknown[];
    const nested = object[key];
    if (nested && typeof nested === "object") {
      const result = pickArray(nested);
      if (result.length) return result;
    }
  }
  return [];
}

function normalizeOptions(payload: unknown): Option[] {
  return pickArray(payload)
    .map((item) => {
      const value = item as Record<string, unknown>;
      return {
        id: Number(value.id ?? value.value ?? value.networkId ?? value.networkGroupId),
        name: String(value.name ?? value.title ?? value.text ?? value.label ?? ""),
      };
    })
    .filter((item) => Number.isInteger(item.id) && item.id > 0 && item.name);
}

function normalizeRoles(payload: unknown): RoleOption[] {
  return pickArray(payload)
    .map((item) => {
      if (typeof item === "string") return { id: item, name: item };
      const value = item as Record<string, unknown>;
      return { id: String(value.id ?? value.roleId ?? ""), name: String(value.name ?? value.roleName ?? "") };
    })
    .filter((item) => item.id && item.name);
}

async function readJson(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message ?? payload?.Message ?? "انجام عملیات ممکن نشد.");
  }
  return payload;
}

export default function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [networks, setNetworks] = useState<Option[]>([]);
  const [groups, setGroups] = useState<Option[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [selectedNetworkIds, setSelectedNetworkIds] = useState<number[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [imageVersion, setImageVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isAdmin = useMemo(
    () => profile?.roles.some((role) => role.toLowerCase().replace(/[\s_-]/g, "") === "admin") ?? false,
    [profile]
  );

  const loadGroups = useCallback(async (networkIds: number[]) => {
    if (!networkIds.length) {
      setGroups([]);
      return;
    }
    const results = await Promise.allSettled(
      networkIds.map((id) => fetch(`/api/networkgroups/${id}`, { cache: "no-store" }).then(readJson))
    );
    const merged = results.flatMap((result) =>
      result.status === "fulfilled" ? normalizeOptions(result.value) : []
    );
    setGroups(Array.from(new Map(merged.map((item) => [item.id, item])).values()));
  }, []);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [profilePayload, networksPayload] = await Promise.all([
        fetch("/api/auth/profile", { cache: "no-store" }).then(readJson),
        fetch("/api/networks", { cache: "no-store" }).then(readJson),
      ]);
      const data = (profilePayload?.data ?? profilePayload) as Profile;
      setProfile(data);
      setPhoneNumber(data.phoneNumber ?? "");
      setSelectedNetworkIds(data.networkIds ?? []);
      setSelectedGroupId(data.networkGroupId ?? null);
      setNetworks(normalizeOptions(networksPayload));
      await loadGroups(data.networkIds ?? []);

      const admin = data.roles?.some(
        (role) => role.toLowerCase().replace(/[\s_-]/g, "") === "admin"
      );
      if (admin) {
        const [rolesPayload, assignedPayload] = await Promise.all([
          fetch("/api/roles", { cache: "no-store" }).then(readJson),
          fetch(`/api/users/${encodeURIComponent(data.id)}/roles`, { cache: "no-store" }).then(readJson),
        ]);
        const roleOptions = normalizeRoles(rolesPayload);
        const assigned = normalizeRoles(assignedPayload);
        setRoles(roleOptions);
        setSelectedRoleIds(
          assigned.length
            ? assigned.map((role) => role.id)
            : roleOptions.filter((role) => data.roles.includes(role.name)).map((role) => role.id)
        );
      }
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "دریافت پروفایل ممکن نشد." });
    } finally {
      setLoading(false);
    }
  }, [loadGroups]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  async function uploadPicture(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "فقط JPG، PNG یا WEBP تا حجم ۲ مگابایت مجاز است." });
      return;
    }
    setBusy("picture");
    try {
      const formData = new FormData();
      formData.append("file", file);
      await readJson(await fetch("/api/auth/profile/picture", { method: "POST", body: formData }));
      setProfile((current) => current ? { ...current, profilePictureUrl: "uploaded" } : current);
      setImageVersion(Date.now());
      setMessage({ type: "success", text: "تصویر پروفایل با موفقیت ذخیره شد." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "آپلود تصویر ممکن نشد." });
    } finally {
      setBusy(null);
    }
  }

  async function savePhone(event: FormEvent) {
    event.preventDefault();
    if (phoneNumber && !/^09\d{9}$/.test(phoneNumber)) {
      setMessage({ type: "error", text: "شماره همراه باید با 09 شروع شود و 11 رقم باشد." });
      return;
    }
    setBusy("phone");
    try {
      await readJson(await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      }));
      setProfile((current) => current ? { ...current, phoneNumber } : current);
      setMessage({ type: "success", text: "شماره همراه ذخیره شد." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "ذخیره ممکن نشد." });
    } finally {
      setBusy(null);
    }
  }

  async function saveAdminAssignments() {
    if (!profile || !selectedNetworkIds.length || !selectedGroupId || !selectedRoleIds.length) {
      setMessage({ type: "error", text: "نقش، حداقل یک شبکه و زیرشبکه الزامی است." });
      return;
    }
    setBusy("admin");
    try {
      await readJson(await fetch(`/api/users/${encodeURIComponent(profile.id)}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleIds: selectedRoleIds }),
      }));
      await readJson(await fetch(`/api/auth/users/${encodeURIComponent(profile.id)}/assignments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ networkIds: selectedNetworkIds, networkGroupId: selectedGroupId }),
      }));
      setMessage({ type: "success", text: "نقش و دسترسی‌های سازمانی ذخیره شد." });
      await loadPage();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "ذخیره دسترسی‌ها ممکن نشد." });
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return <main dir="rtl" className="min-h-screen grid place-items-center bg-slate-50"><LoaderCircle className="animate-spin text-sky-600" size={38} /></main>;
  }

  if (!profile) {
    return <main dir="rtl" className="min-h-screen grid place-items-center bg-slate-50 p-6"><div className="max-w-lg rounded-2xl border bg-white p-6 text-red-700">{message?.text ?? "اطلاعات پروفایل در دسترس نیست."}</div></main>;
  }

  const networkNames = selectedNetworkIds.map((id) => networks.find((item) => item.id === id)?.name ?? `شبکه ${id}`);
  const groupName = groups.find((item) => item.id === selectedGroupId)?.name ?? (selectedGroupId ? `زیرشبکه ${selectedGroupId}` : "تخصیص داده نشده");

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {message && (
          <div role="alert" className={`rounded-xl border px-4 py-3 ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
            {message.text}
          </div>
        )}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="h-28 bg-gradient-to-l from-sky-700 via-sky-600 to-cyan-500" />
          <div className="px-6 pb-7 sm:px-9">
            <div className="-mt-14 flex flex-col gap-5 sm:flex-row sm:items-end">
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl border-4 border-white bg-sky-50 shadow-md">
                {profile.profilePictureUrl ? (
                  <img className="h-full w-full object-cover" alt={`تصویر ${profile.fullName}`} src={`/api/auth/profile/picture?v=${imageVersion}`} />
                ) : (
                  <div className="grid h-full w-full place-items-center text-sky-700"><UserRound size={54} /></div>
                )}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <h1 className="truncate text-2xl font-black text-slate-900">{profile.fullName || profile.userName}</h1>
                <p className="mt-1 text-sm text-slate-500">@{profile.userName}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.roles.map((role) => <span key={role} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">{ROLE_TITLES[role] ?? role}</span>)}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <input ref={fileInputRef} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPicture} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={busy === "picture"} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 font-bold text-white hover:bg-sky-700 disabled:opacity-60">
                  {busy === "picture" ? <LoaderCircle className="animate-spin" size={18} /> : <Camera size={18} />}
                  {profile.profilePictureUrl ? "تعویض تصویر" : "افزودن تصویر"}
                </button>
                <button type="button" disabled title="وب‌سرویس حذف تصویر در داکیومنت فعلی ارائه نشده است." onClick={() => setMessage({ type: "error", text: "برای حذف تصویر باید endpoint حذف عکس در Backend اضافه شود." })} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-slate-400 disabled:cursor-not-allowed">
                  <Trash2 size={18} /> حذف
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-black"><UserRound className="text-sky-600" /> اطلاعات فردی</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Info icon={<Mail size={18} />} label="ایمیل" value={profile.email || "ثبت نشده"} />
              <Info icon={<ShieldCheck size={18} />} label="نام کاربری" value={profile.userName} />
              <Info icon={<Network size={18} />} label="شبکه‌ها" value={networkNames.join("، ") || "تخصیص داده نشده"} />
              <Info icon={<Building2 size={18} />} label="زیرشبکه" value={groupName} />
            </div>
            <form onSubmit={savePhone} className="mt-5 rounded-2xl bg-slate-50 p-4">
              <label className="mb-2 block text-sm font-bold" htmlFor="phoneNumber">شماره همراه</label>
              <div className="flex gap-2">
                <div className="relative flex-1"><Phone className="absolute right-3 top-3 text-slate-400" size={18} /><input id="phoneNumber" dir="ltr" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value.replace(/\D/g, "").slice(0, 11))} className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-10 pl-3 outline-none focus:border-sky-500" placeholder="09123456789" /></div>
                <button disabled={busy === "phone"} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 font-bold text-white disabled:opacity-60"><Save size={17} /> ذخیره</button>
              </div>
            </form>
          </section>

          <PasswordCard setBusy={setBusy} busy={busy} setMessage={setMessage} />
        </div>

        {isAdmin && (
          <section className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-lg font-black"><ShieldCheck className="text-amber-600" /> مدیریت دسترسی‌ها</h2><p className="mt-1 text-sm text-slate-500">این بخش فقط برای ادمین قابل مشاهده و اجراست.</p></div></div>
            <div className="grid gap-5 lg:grid-cols-3">
              <fieldset><legend className="mb-2 text-sm font-bold">نقش‌ها</legend><div className="max-h-52 space-y-2 overflow-auto rounded-xl border p-3">{roles.map((role) => <label key={role.id} className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={selectedRoleIds.includes(role.id)} onChange={() => setSelectedRoleIds((current) => current.includes(role.id) ? current.filter((id) => id !== role.id) : [...current, role.id])} /><span>{ROLE_TITLES[role.name] ?? role.name}</span></label>)}</div></fieldset>
              <fieldset><legend className="mb-2 text-sm font-bold">شبکه‌ها</legend><div className="max-h-52 space-y-2 overflow-auto rounded-xl border p-3">{networks.map((network) => <label key={network.id} className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={selectedNetworkIds.includes(network.id)} onChange={async () => { const next = selectedNetworkIds.includes(network.id) ? selectedNetworkIds.filter((id) => id !== network.id) : [...selectedNetworkIds, network.id]; setSelectedNetworkIds(next); setSelectedGroupId(null); await loadGroups(next); }} /><span>{network.name}</span></label>)}</div></fieldset>
              <div><label className="mb-2 block text-sm font-bold" htmlFor="networkGroup">زیرشبکه</label><select id="networkGroup" value={selectedGroupId ?? ""} onChange={(event) => setSelectedGroupId(event.target.value ? Number(event.target.value) : null)} className="h-11 w-full rounded-xl border bg-white px-3"><option value="">انتخاب کنید</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></div>
            </div>
            <button type="button" onClick={saveAdminAssignments} disabled={busy === "admin"} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 font-bold text-white hover:bg-amber-700 disabled:opacity-60">{busy === "admin" ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />} ذخیره دسترسی‌ها</button>
          </section>
        )}
      </div>
    </main>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex items-center gap-2 text-xs font-bold text-slate-500">{icon}{label}</div><p className="mt-2 break-words font-bold text-slate-800">{value}</p></div>;
}

function PasswordCard({ busy, setBusy, setMessage }: {
  busy: string | null;
  setBusy: (value: string | null) => void;
  setMessage: (value: { type: "success" | "error"; text: string } | null) => void;
}) {
  const [stage, setStage] = useState<"current" | "new">("current");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (stage === "current") {
      if (!currentPassword) return setMessage({ type: "error", text: "رمز عبور فعلی را وارد کنید." });
      setStage("new");
      return;
    }
    if (newPassword.length < 8 || newPassword !== confirmation) {
      setMessage({ type: "error", text: "رمز جدید حداقل ۸ کاراکتر و با تکرار آن یکسان باشد." });
      return;
    }
    setBusy("password");
    try {
      await readJson(await fetch("/api/auth/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      }));
      setCurrentPassword(""); setNewPassword(""); setConfirmation(""); setStage("current");
      setMessage({ type: "success", text: "رمز عبور با موفقیت تغییر کرد." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "تغییر رمز ممکن نشد." });
    } finally { setBusy(null); }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-2 flex items-center gap-2 text-lg font-black"><KeyRound className="text-sky-600" /> تغییر رمز عبور</h2>
      <p className="mb-5 text-sm text-slate-500">{stage === "current" ? "ابتدا رمز عبور فعلی را وارد کنید." : "حالا رمز جدید و تکرار آن را وارد کنید."}</p>
      <form onSubmit={submit} className="space-y-4">
        {stage === "current" ? <PasswordInput label="رمز عبور فعلی" value={currentPassword} onChange={setCurrentPassword} visible={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} /> : <><PasswordInput label="رمز عبور جدید" value={newPassword} onChange={setNewPassword} visible={showNew} onToggle={() => setShowNew(!showNew)} /><PasswordInput label="تکرار رمز عبور جدید" value={confirmation} onChange={setConfirmation} visible={showNew} onToggle={() => setShowNew(!showNew)} /></>}
        <div className="flex gap-2">{stage === "new" && <button type="button" onClick={() => setStage("current")} className="rounded-xl border px-4 py-2.5 font-bold">بازگشت</button>}<button disabled={busy === "password"} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 font-bold text-white disabled:opacity-60">{busy === "password" ? <LoaderCircle className="animate-spin" size={18} /> : stage === "current" ? <CheckCircle2 size={18} /> : <Save size={18} />}{stage === "current" ? "ادامه" : "ثبت رمز جدید"}</button></div>
      </form>
    </section>
  );
}

function PasswordInput({ label, value, onChange, visible, onToggle }: { label: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void }) {
  return <div><label className="mb-2 block text-sm font-bold">{label}</label><div className="relative"><input type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete="new-password" className="h-11 w-full rounded-xl border border-slate-200 px-3 pl-11 outline-none focus:border-sky-500" /><button type="button" onClick={onToggle} aria-label={visible ? "مخفی کردن رمز" : "نمایش رمز"} className="absolute left-3 top-2.5 text-slate-500">{visible ? <EyeOff size={20} /> : <Eye size={20} />}</button></div></div>;
}
