"use client";

/*
 * مسیر نصب: app/reports/topics/page.tsx (یا src/app/reports/topics/page.tsx)
 * وابستگی‌ها: همان react-multi-date-picker و react-date-object موجود در پروژه.
 * خروجی XLSX واقعی، بدون کتابخانه یا اتصال اینترنتی اضافه ساخته می‌شود.
 * دسترسی داده فقط توسط Routeهای موجود و توکن Backend تعیین می‌شود.
 * گروه‌های فیلتر از شناسنامه‌های قابل‌دسترسی استخراج می‌شوند؛ این لیست کاتالوگ مجوزها نیست.
 * تاریخ تأیید در ProfileResponse مستند نشده؛ پس از توافق با Backend فقط ثابت زیر را تنظیم کنید.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, Download, FileText, LoaderCircle, RefreshCcw, Search } from "lucide-react";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import gregorian from "react-date-object/calendars/gregorian";
import persianFa from "react-date-object/locales/persian_fa";
import gregorianEn from "react-date-object/locales/gregorian_en";

const APPROVAL_DATE_FIELD: string | null = null;
const PAGE_SIZE = 10;
const MAX_PAGES = 200;
const API = {
  profiles: "/api/program-profiles",
  programs: "/api/programs",
  profile: (id: string) => `/api/program-profiles/${encodeURIComponent(id)}`,
  forecast: (id: string) => `/api/forecasts/${encodeURIComponent(id)}`,
  expert: (id: string) => `/api/experts/${encodeURIComponent(id)}`,
};
type Obj = Record<string, unknown>;
type Profile = Obj & { id: string; planId: number; networkId: number; networkGroupId: number };
type Filters = { program: string; groups: string[]; from: string; to: string; topic: string };
type ReportRow = {
  id: string; program: string; topic: string; broadcast: string;
  experts: string; axes: string; crew: string; approval: string;
  warnings: string[];
};
type NamedOption = { id: string; name: string };
const HEADERS = ["ردیف", "نام برنامه", "موضوع برنامه", "تاریخ پخش", "کارشناس (نام)", "محورهای موضوعی", "عوامل", "تاریخ تأیید شناسنامه"];
const inputClass = "h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#007fcf] disabled:opacity-50";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
const cellClass = "whitespace-pre-line break-words px-4 py-4 text-right align-top leading-7";

function isObj(v: unknown): v is Obj { return typeof v === "object" && v !== null && !Array.isArray(v); }
function text(v: unknown): string { return typeof v === "string" ? v.trim() : ""; }
function numeric(v: unknown): number | null {
  if (typeof v !== "number" && typeof v !== "string") return null;
  if (typeof v === "string" && !v.trim()) return null;
  const n = Number(v); return Number.isFinite(n) ? n : null;
}
function normalized(v: string): string { return v.replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/\u200c/g, " ").trim().toLowerCase(); }
function unique(values: string[]): string[] { return [...new Set(values.filter(Boolean))]; }
function approved(v: unknown): boolean { return v === 50 || v === "50" || v === "Approved"; }
function groupKey(p: Profile): string { return `${p.networkId}:${p.networkGroupId}`; }
function groupName(p: Profile): string {
  return `${text(p.networkGroupName) || `گروه شماره ${p.networkGroupId}`} — ${text(p.networkName) || `شبکه ${p.networkId}`}`;
}
function profileValue(v: unknown): Profile {
  if (!isObj(v) || !text(v.id) || numeric(v.planId) === null ||
      numeric(v.networkId) === null || numeric(v.networkGroupId) === null) {
    throw new Error("ساختار شناسنامه یا شناسهٔ گروه و شبکه معتبر نیست؛ گزارش ناقص ساخته نشد.");
  }
  return { ...v, id: text(v.id), planId: Number(v.planId), networkId: Number(v.networkId), networkGroupId: Number(v.networkGroupId) };
}
function unwrap(v: unknown): Obj {
  if (isObj(v) && text(v.id)) return v;
  if (isObj(v)) for (const key of ["data", "result", "profile", "forecast", "expert"]) {
    if (isObj(v[key]) && text((v[key] as Obj).id)) return v[key] as Obj;
  }
  throw new Error("ساختار پاسخ جزئیات معتبر نیست.");
}
async function getJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { cache: "no-store", credentials: "same-origin", signal, headers: { Accept: "application/json" } });
  const raw = await response.text();
  let value: unknown = null;
  try { value = raw.trim() ? JSON.parse(raw) : null; } catch { /* خطا پایین گزارش می‌شود */ }
  if (!response.ok) {
    if (response.status === 401) throw new Error("نشست شما معتبر نیست؛ دوباره وارد شوید.");
    if (response.status === 403) throw new Error("دسترسی به این اطلاعات مجاز نیست.");
    throw new Error(isObj(value) ? text(value.message) || text(value.description) || `خطای دریافت اطلاعات (${response.status})` : `خطای دریافت اطلاعات (${response.status})`);
  }
  if (value === null) throw new Error("پاسخ سرویس خالی یا JSON نامعتبر است.");
  return value;
}
function arrayValue(v: unknown, depth = 0): unknown[] | null {
  if (Array.isArray(v)) return v;
  if (!isObj(v) || depth > 6) return null;
  for (const key of ["items", "Items", "programs", "Programs", "profiles", "data", "Data", "result", "Result"]) {
    const found = arrayValue(v[key], depth + 1); if (found) return found;
  }
  return null;
}
async function allProfiles(signal: AbortSignal): Promise<Profile[]> {
  const result = new Map<string, Profile>();
  // Route موجود در نبود Pagination مقدار جایگزین می‌سازد؛ تا صفحه خالی پیش می‌رویم.
  for (let page = 1; page <= MAX_PAGES; page++) {
    const body = await getJson(`${API.profiles}?pageNumber=${page}&pageSize=100`, signal);
    const rows = arrayValue(body);
    if (!rows) throw new Error("آرایهٔ شناسنامه‌ها در پاسخ پیدا نشد.");
    if (!rows.length) return [...result.values()];
    let added = 0;
    for (const item of rows) {
      const p = profileValue(item); if (!result.has(p.id)) added++;
      result.set(p.id, p);
    }
    if (!added) throw new Error("صفحه‌بندی سرویس تکراری است؛ کامل‌بودن گزارش تأیید نشد.");
  }
  throw new Error("حجم گزارش از سقف دریافت بیشتر است؛ برای این حجم به سرویس گزارش صفحه‌بندی‌شده نیاز است.");
}
function programNames(value: unknown): Map<number, string> {
  const rows = arrayValue(value); if (!rows) throw new Error("فهرست نام برنامه‌ها قابل خواندن نیست.");
  const names = new Map<number, string>();
  for (const row of rows) if (isObj(row)) {
    const id = numeric(row.id ?? row.Id ?? row.value ?? row.Value ?? row.planId ?? row.PlanId);
    const name = text(row.name ?? row.Name ?? row.text ?? row.Text ?? row.title ?? row.Title ?? row.planName ?? row.PlanName);
    if (id !== null && name) names.set(id, name);
  }
  return names;
}
function dayKey(value: unknown): string {
  const raw = text(value);
  const match = /^(\d{4}-\d{2}-\d{2})(?:T|$)/.exec(raw);
  if (!match) return "";
  const date = new Date(`${match[1]}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === match[1] ? match[1] : "";
}
function displayDate(value: unknown): string {
  const key = dayKey(value); if (!key) return "—";
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC" }).format(new Date(`${key}T12:00:00Z`));
}
function pickerKey(value: DateObject | null): string {
  return value ? new DateObject(value).convert(gregorian, gregorianEn).format("YYYY-MM-DD") : "";
}
function selectProfiles(profiles: Profile[], filters: Filters): Profile[] {
  return profiles.filter(p => {
    const day = dayKey(p.broadcastDate);
    return (!filters.program || String(p.planId) === filters.program) &&
      (!filters.groups.length || filters.groups.includes(groupKey(p))) &&
      approved(p.status) &&
      (!filters.from || Boolean(day && day >= filters.from)) &&
      (!filters.to || Boolean(day && day <= filters.to)) &&
      (!filters.topic || normalized(text(p.mainTopic)) === normalized(filters.topic));
  }).sort((a,b) => dayKey(b.broadcastDate).localeCompare(dayKey(a.broadcastDate)) || a.id.localeCompare(b.id));
}
async function mapLimited<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>, signal: AbortSignal): Promise<R[]> {
  const result = new Array<R>(items.length); let index = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) { signal.throwIfAborted(); const i = index++; result[i] = await fn(items[i]); }
  }));
  return result;
}
async function reportRows(profiles: Profile[], names: Map<number, string>, signal: AbortSignal, progress: (n: number) => void): Promise<ReportRow[]> {
  const forecasts = new Map<string, Promise<Obj>>();
  const experts = new Map<string, Promise<Obj>>();
  function cached(cache: Map<string, Promise<Obj>>, id: string, url: string) {
    let request = cache.get(id);
    if (!request) { request = getJson(url, signal).then(unwrap); cache.set(id, request); }
    return request;
  }
  let done = 0;
  return mapLimited(profiles, 4, async original => {
    let p: Obj = original; const warnings: string[] = [];
    if (!Array.isArray(p.experts) || !Array.isArray(p.crewMembers)) {
      try { p = { ...original, ...unwrap(await getJson(API.profile(original.id), signal)) }; }
      catch { signal.throwIfAborted(); warnings.push("دریافت جزئیات شناسنامه ناموفق بود."); }
    }
    let forecast: Obj | null = null;
    const forecastId = text(p.forecastId);
    if (forecastId) {
      try { forecast = await cached(forecasts, forecastId, API.forecast(forecastId)); }
      catch { signal.throwIfAborted(); warnings.push("محورهای موضوعی: دریافت پیش‌بینی ناموفق بود."); }
    } else warnings.push("شناسهٔ پیش‌بینی موجود نیست.");
    let axisText = "اطلاعات دریافت نشد";
    if (forecast && Array.isArray(forecast.topicAxes)) {
      const axes = forecast.topicAxes;
      if (axes.some(a => !isObj(a) || !text(a.title))) warnings.push("عنوان بعضی محورهای موضوعی موجود نیست.");
      axisText = unique(axes.filter(isObj).sort((a,b) => (numeric(a.displayOrder) ?? 0) - (numeric(b.displayOrder) ?? 0)).map(a => text(a.title) || "عنوان محور موجود نیست")).join("\n") || "—";
    } else if (forecast) warnings.push("آرایهٔ محورهای موضوعی در پاسخ موجود نیست.");
    const expertNames: string[] = [];
    if (!Array.isArray(p.experts)) { expertNames.push("اطلاعات دریافت نشد"); warnings.push("فهرست کارشناسان در پاسخ موجود نیست."); }
    else for (const entry of p.experts) {
      if (!isObj(entry)) { expertNames.push("اطلاعات نامعتبر"); warnings.push("اطلاعات یک کارشناس معتبر نیست."); continue; }
      const id = text(entry.expertId);
      if (!id) { expertNames.push("شناسهٔ کارشناس موجود نیست"); warnings.push("شناسهٔ یک کارشناس موجود نیست."); continue; }
      try {
        const expert = await cached(experts, id, API.expert(id));
        const name = [text(expert.firstName), text(expert.lastName)].filter(Boolean).join(" ");
        expertNames.push(name || `نام کارشناس موجود نیست (${id})`);
        if (!name) warnings.push("نام یک کارشناس در پاسخ موجود نیست.");
      } catch { signal.throwIfAborted(); expertNames.push(`نام دریافت نشد (${id})`); warnings.push("دریافت نام یک کارشناس ناموفق بود."); }
    }
    let crewText = "اطلاعات دریافت نشد";
    if (Array.isArray(p.crewMembers)) {
      crewText = p.crewMembers.map(member => {
        if (!isObj(member) || !text(member.personnelName)) { warnings.push("نام یکی از عوامل موجود نیست."); return "نام عامل موجود نیست"; }
        return text(member.personnelName) + (text(member.activityTypeName) ? ` — ${text(member.activityTypeName)}` : "");
      }).join("\n") || "—";
    } else warnings.push("فهرست عوامل در پاسخ موجود نیست.");
    const program = names.get(original.planId) || text(p.programName) || `برنامه شماره ${original.planId}`;
    if (!text(p.programName) && !names.has(original.planId)) warnings.push("نام برنامه موجود نیست؛ شناسه نمایش داده شد.");
    if (!dayKey(p.broadcastDate)) warnings.push("تاریخ پخش معتبر در پاسخ موجود نیست.");
    const approvalDate = APPROVAL_DATE_FIELD ? displayDate(p[APPROVAL_DATE_FIELD]) : "—";
    const approval = !approved(p.status) ? "تأیید نهایی نشده" : approvalDate === "—" ? "تاریخ تأیید در دسترس نیست" : approvalDate;
    signal.throwIfAborted(); progress(++done);
    return { id: original.id, program, topic: text(p.mainTopic) || "—", broadcast: displayDate(p.broadcastDate), experts: unique(expertNames).join("\n") || "—", axes: axisText, crew: crewText, approval, warnings: unique(warnings) };
  }, signal);
}

export default function TopicReportPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [names, setNames] = useState<Map<number,string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [catalogWarning, setCatalogWarning] = useState("");
  const [program, setProgram] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [groupSearch, setGroupSearch] = useState("");
  const [from, setFrom] = useState<DateObject | null>(null);
  const [to, setTo] = useState<DateObject | null>(null);
  const [topic, setTopic] = useState("");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [snapshot, setSnapshot] = useState<{ filters: Filters; groupLabels: string[]; programLabel: string; at: string } | null>(null);
  const [page, setPage] = useState(1);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [reload, setReload] = useState(0);
  const active = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController(); active.current?.abort();
    const timeout = setTimeout(() => controller.abort(), 120000);
    let disposed = false;
    setLoading(true); setRunning(false); setError(""); setCatalogWarning(""); setRows([]); setSnapshot(null); setProfiles([]);
    void Promise.allSettled([allProfiles(controller.signal), getJson(API.programs, controller.signal).then(programNames)])
      .then(results => {
        if (disposed) return;
        if (controller.signal.aborted) throw new Error("زمان دریافت فهرست به پایان رسید؛ دوباره تلاش کنید.");
        if (results[0].status !== "fulfilled") throw results[0].reason;
        setProfiles(results[0].value.filter(p => approved(p.status)));
        if (results[1].status === "fulfilled") setNames(results[1].value);
        else { setNames(new Map()); setCatalogWarning("فهرست برنامه‌ها دریافت نشد؛ برای انتخاب نام برنامه، «به‌روزرسانی اطلاعات» را بزنید."); }
      }).catch((cause: unknown) => { if (!disposed) setError(cause instanceof Error ? cause.message : "دریافت فهرست ناموفق بود."); })
      .finally(() => { clearTimeout(timeout); if (!disposed) setLoading(false); });
    return () => { disposed = true; controller.abort(); clearTimeout(timeout); active.current?.abort(); };
  }, [reload]);
  const groupOptions = useMemo<NamedOption[]>(() => [...new Map(profiles.map(p => [groupKey(p), { id: groupKey(p), name: groupName(p) }])).values()].sort((a,b)=>a.name.localeCompare(b.name,"fa")), [profiles]);
  // نام‌ها مستقیماً از سرویس برنامه‌ها گرفته می‌شوند.
  const programOptions = useMemo<NamedOption[]>(() =>
    [...names].filter(([id]) => !groups.length || profiles.some(p => p.planId === id && groups.includes(groupKey(p))))
      .map(([id, name]) => ({ id: String(id), name }))
      .sort((a,b) => a.name.localeCompare(b.name, "fa")), [names, profiles, groups]);
  // موضوع یعنی mainTopic شناسنامه؛ محورهای موضوعی ستون جداگانهٔ گزارش هستند.
  const topicOptions = useMemo(() => {
    const options = new Map<string, string>();
    for (const p of profiles) {
      if (!approved(p.status) || (program && String(p.planId) !== program) ||
          (groups.length && !groups.includes(groupKey(p)))) continue;
      const title = text(p.mainTopic);
      if (title) options.set(normalized(title), title);
    }
    return [...options.values()].sort((a,b) => a.localeCompare(b, "fa"));
  }, [profiles, program, groups]);
  const filters: Filters = { program, groups, from: pickerKey(from), to: pickerKey(to), topic: topic.trim() };
  const changed = Boolean(snapshot && JSON.stringify(snapshot.filters) !== JSON.stringify(filters));
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visibleRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const warnings = unique(rows.flatMap(r => r.warnings));
  function reset() { setProgram(""); setGroups([]); setGroupSearch(""); setFrom(null); setTo(null); setTopic(""); }
  async function run() {
    if (loading || running) return;
    if (filters.from && filters.to && filters.from > filters.to) { setError("تاریخ شروع نباید بعد از تاریخ پایان باشد."); return; }
    active.current?.abort(); const controller = new AbortController(); active.current = controller;
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 180000);
    setRunning(true); setError(""); setRows([]); setSnapshot(null); setPage(1);
    const selected = selectProfiles(profiles, filters); setProgress({ current: 0, total: selected.length });
    try {
      const result = await reportRows(selected, names, controller.signal, n => { if (active.current === controller && !controller.signal.aborted) setProgress({ current: n, total: selected.length }); });
      controller.signal.throwIfAborted();
      if (active.current !== controller) return;
      setRows(result);
      setSnapshot({ filters, at: new Date().toISOString(), programLabel: programOptions.find(p=>p.id===program)?.name || "همه برنامه‌ها", groupLabels: groups.length ? groupOptions.filter(g=>groups.includes(g.id)).map(g=>g.name) : ["همه گروه‌های دارای شناسنامه در محدودهٔ دسترسی"] });
    } catch (cause) {
      if (active.current === controller) setError(timedOut ? "زمان تهیه گزارش به پایان رسید؛ بازه یا گروه‌های محدودتری انتخاب کنید." : controller.signal.aborted ? "دریافت گزارش لغو شد." : cause instanceof Error ? cause.message : "ساخت گزارش ناموفق بود.");
    } finally { clearTimeout(timeout); if (active.current === controller) { setRunning(false); active.current = null; } }
  }
  async function exportReport() {
    if (!snapshot || !rows.length || running || exporting) return;
    setExporting(true); setError("");
    try {
      await new Promise(resolve=>setTimeout(resolve,0));
      const summary = [
        ["گزارش موضوعی", "شناسنامه‌های تأییدشده"], ["برنامه", snapshot.programLabel],
        ["گروه‌ها", snapshot.groupLabels.join("؛ ")], ["از تاریخ پخش", snapshot.filters.from ? displayDate(snapshot.filters.from) : "بدون محدودیت"],
        ["تا تاریخ پخش", snapshot.filters.to ? displayDate(snapshot.filters.to) : "بدون محدودیت"],
        ["وضعیت", "فقط تأیید نهایی"],
        ["موضوع", snapshot.filters.topic || "همه موضوعات"], ["تعداد", rows.length],
        ["زمان تهیه گزارش", new Intl.DateTimeFormat("fa-IR",{dateStyle:"short",timeStyle:"short",timeZone:"Asia/Tehran"}).format(new Date(snapshot.at))],
        ["تاریخ تأیید", "فقط تاریخ صریح تأیید نهایی؛ تاریخ ایجاد یا ویرایش جایگزین آن نشده است."],
        ...warnings.map(w=>["نقص اطلاعات", w]),
      ];
      const bytes = xlsxBytes([
        { name: "گزارش موضوعی", rows: [HEADERS, ...rows.map((r,i)=>[i+1,r.program,r.topic,r.broadcast,r.experts,r.axes,r.crew,r.approval])], widths: [8,26,42,17,30,42,48,27], filter: true },
        { name: "مشخصات گزارش", rows: summary, widths: [24,100], filter: false },
      ]);
      const blob = new Blob([new Uint8Array(bytes).buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob); const a = document.createElement("a");
      a.href = url; a.download = `topic-report-${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),10000);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "ساخت فایل اکسل ناموفق بود."); }
    finally { setExporting(false); }
  }
  return <main dir="rtl" className="min-h-screen w-full min-w-0 bg-gray-50 px-4 py-8">
    <section className="mx-auto w-full max-w-7xl">
      <nav className="mb-4 text-sm text-gray-500" aria-label="مسیر صفحه">گزارشات / گزارش موضوعی</nav>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-blue-100 p-3 text-[#007fcf]"><FileText size={24}/></div><div><h1 className="text-2xl font-bold text-gray-800">گزارش موضوعی</h1><p className="mt-1 text-sm text-gray-500">شناسنامه‌های تأییدشده را بر اساس تاریخ پخش، برنامه و موضوع جست‌وجو کنید.</p></div></div>
        <button type="button" className={`${buttonClass} border-gray-300 bg-white text-gray-700`} disabled={loading || running || exporting} onClick={()=>setReload(n=>n+1)}><RefreshCcw size={17}/>به‌روزرسانی اطلاعات</button>
      </header>
      <form className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" onSubmit={e=>{e.preventDefault();void run();}}>
        <fieldset disabled={loading || running || exporting} className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-0"><label className="mb-2 block text-sm font-semibold" htmlFor="report-from">از تاریخ</label><DatePicker value={from} onChange={v=>setFrom(v as DateObject | null)} calendar={persian} locale={persianFa} format="YYYY/MM/DD" editable={false} containerStyle={{width:"100%"}} inputClass={inputClass} inputMode="none" id="report-from" placeholder="از تاریخ پخش (شمسی)" calendarPosition="bottom-right" /></div>
          <div className="min-w-0"><label className="mb-2 block text-sm font-semibold" htmlFor="report-to">تا تاریخ</label><DatePicker value={to} onChange={v=>setTo(v as DateObject | null)} calendar={persian} locale={persianFa} format="YYYY/MM/DD" editable={false} containerStyle={{width:"100%"}} inputClass={inputClass} inputMode="none" id="report-to" placeholder="تا تاریخ پخش (شمسی)" calendarPosition="bottom-right" /></div>
          <div className="min-w-0"><label className="mb-2 block text-sm font-semibold" htmlFor="report-program">نام برنامه</label><select id="report-program" value={program} onChange={e=>{setProgram(e.target.value);setTopic("");}} className={inputClass}><option value="">همه برنامه‌ها</option>{programOptions.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div className="min-w-0"><label htmlFor="report-topic" className="mb-2 block text-sm font-semibold">موضوع</label><select id="report-topic" className={inputClass} value={topic} onChange={e=>setTopic(e.target.value)}><option value="">همه موضوعات</option>{topicOptions.map(title=><option key={normalized(title)} value={title}>{title}</option>)}</select></div>
          {/* <details className="md:col-span-2 xl:col-span-4 rounded-xl border border-gray-200 p-3"><summary className="cursor-pointer text-sm text-gray-600">فیلتر گروه (اختیاری){groups.length ? ` — ${groups.length.toLocaleString("fa-IR")} گروه انتخاب شده` : " — همه گروه‌های در دسترس"}</summary><div className="mb-2 mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold">گروه‌های برنامه‌ساز</span><button type="button" className="text-sm text-[#007fcf]" onClick={()=>{setGroups([]);setProgram("");setTopic("");}}>انتخاب همه گروه‌ها</button></div>
            <p className="mb-3 text-xs text-gray-500">گروه‌های دارای شناسنامه در اطلاعات قابل‌دسترسی؛ بدون انتخاب گروه، همهٔ این گروه‌ها گزارش می‌شوند.</p>
            <input type="search" aria-label="جست‌وجوی گروه" value={groupSearch} onChange={e=>setGroupSearch(e.target.value)} className={`${inputClass} mb-3`} placeholder="جست‌وجوی گروه یا شماره شبکه"/>
            <div className="grid max-h-44 gap-2 overflow-y-auto rounded-xl border border-gray-200 p-3 sm:grid-cols-2 lg:grid-cols-3">{groupOptions.filter(g=>normalized(g.name).includes(normalized(groupSearch))).map(g=><label key={g.id} className="flex items-center gap-2 text-sm leading-6"><input type="checkbox" checked={groups.includes(g.id)} onChange={()=>{setGroups(old=>old.includes(g.id)?old.filter(id=>id!==g.id):[...old,g.id]);setProgram("");setTopic("");}} className="accent-[#007fcf]"/>{g.name}</label>)}{!loading && !groupOptions.length && <p className="text-sm text-gray-500">گروهی با شناسنامهٔ قابل‌دسترسی دریافت نشده است.</p>}</div>
          </details> */}
          <div className="flex flex-wrap gap-3 md:col-span-2 xl:col-span-4"><button type="submit" className={`${buttonClass} border-[#007fcf] bg-[#007fcf] text-white`}><Search size={18}/>نمایش گزارش</button><button type="button" className={`${buttonClass} border-gray-300 text-gray-600`} onClick={reset}>پاک‌کردن فیلترها</button></div>
        </fieldset>
      </form>
      {catalogWarning && <p role="status" className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{catalogWarning}</p>}
      {error && <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={19} className="shrink-0"/>{error}</div>}
      {!APPROVAL_DATE_FIELD && <p className="mb-4 text-sm leading-7 text-gray-500">تاریخ تأیید نهایی در اطلاعات فعلی موجود نیست؛ برای شناسنامه‌های تأییدشده، این ستون با عبارت «تاریخ تأیید در دسترس نیست» نمایش داده می‌شود.</p>}
      {changed && <p role="status" className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">فیلترها تغییر کرده‌اند؛ برای اعمال آن‌ها «نمایش گزارش» را بزنید. خروجی اکسل مربوط به نتایج نمایش‌داده‌شده است.</p>}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><div><h2 className="font-bold text-gray-800">نتایج گزارش</h2><p className="mt-1 text-sm text-gray-500">{snapshot ? `${rows.length.toLocaleString("fa-IR")} شناسنامه` : "فیلترها را انتخاب و گزارش را دریافت کنید."}</p></div><button type="button" onClick={()=>void exportReport()} disabled={!snapshot || !rows.length || running || loading || exporting} className={`${buttonClass} border-green-600 bg-green-600 text-white`}>{exporting?<LoaderCircle size={18} className="animate-spin"/>:<Download size={18}/>}خروجی اکسل همه نتایج</button></div>
        {(loading || running) ? <div role="status" className="flex min-h-60 flex-col items-center justify-center gap-4 text-gray-500"><LoaderCircle className="animate-spin" size={25}/><p>{loading ? "در حال دریافت فهرست شناسنامه‌ها…" : `آماده‌سازی گزارش: ${progress.current.toLocaleString("fa-IR")} از ${progress.total.toLocaleString("fa-IR")}`}</p>{running && <button type="button" onClick={()=>active.current?.abort()} className="text-sm text-red-600">لغو دریافت</button>}</div> : !snapshot ? <p className="p-16 text-center text-gray-500">هنوز گزارشی دریافت نشده است.</p> : !rows.length ? <p className="p-16 text-center text-gray-500">برای فیلترهای انتخاب‌شده شناسنامه‌ای پیدا نشد.</p> : <>
          {warnings.length > 0 && <details className="border-b bg-amber-50 px-4 py-3 text-sm text-amber-900"><summary className="cursor-pointer">بخشی از اطلاعات تکمیلی دریافت نشده است؛ جزئیات</summary><ul className="mt-2 list-inside list-disc leading-7">{warnings.map(w=><li key={w}>{w}</li>)}</ul><p className="mt-2">این نواقص در برگهٔ مشخصات فایل اکسل نیز درج می‌شوند.</p></details>}
          <div className="overflow-x-auto"><table className="w-full min-w-[1500px] table-fixed text-sm"><colgroup>{[5,12,17,9,12,17,17,11].map((w,i)=><col key={i} style={{width:`${w}%`}}/>)}</colgroup><thead className="bg-gray-50 text-gray-600"><tr>{HEADERS.map(h=><th key={h} scope="col" className="px-4 py-4 text-right font-semibold">{h}</th>)}</tr></thead><tbody>{visibleRows.map((r,i)=><tr key={r.id} className="border-t border-gray-100 text-gray-700 hover:bg-blue-50/40"><td className={cellClass}>{((page-1)*PAGE_SIZE+i+1).toLocaleString("fa-IR")}</td><td className={cellClass}><Link className="font-semibold text-[#007fcf] hover:underline" href={`/program-profiles/${encodeURIComponent(r.id)}`}>{r.program}</Link></td><td className={cellClass}>{r.topic}</td><td className={cellClass}>{r.broadcast}</td><td className={cellClass}>{r.experts}</td><td className={cellClass}>{r.axes}</td><td className={cellClass}>{r.crew}</td><td className={cellClass}>{r.approval}</td></tr>)}</tbody></table></div>
          <footer className="flex items-center justify-between gap-3 border-t p-4 text-sm"><span>صفحه {page.toLocaleString("fa-IR")} از {pages.toLocaleString("fa-IR")}</span><div className="flex gap-2"><button type="button" disabled={page===1} onClick={()=>setPage(n=>n-1)} className={`${buttonClass} border-gray-300`}>قبلی</button><button type="button" disabled={page===pages} onClick={()=>setPage(n=>n+1)} className={`${buttonClass} border-gray-300`}>بعدی</button></div></footer>
        </>}
      </section>
    </section>
  </main>;
}

/* XLSX استاندارد با ZIP بدون فشرده‌سازی و سلول‌های صریح رشته‌ای؛ ورودی کاربر فرمول نمی‌شود. */
type Sheet = { name: string; rows: (string | number)[][]; widths: number[]; filter: boolean };
function xml(value: string): string {
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
}
function columnName(index: number): string {
  let n=index+1, result=""; while(n>0){n--;result=String.fromCharCode(65+n%26)+result;n=Math.floor(n/26);}return result;
}
function xlsxBytes(sheets: Sheet[]): Uint8Array {
  const enc=new TextEncoder();
  const files: { name: string; data: Uint8Array }[]=[];
  const add=(name:string,value:string)=>files.push({name,data:enc.encode(value)});
  add("[Content_Types].xml",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`);
  add("_rels/.rels",`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  add("xl/workbook.xml",`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>${sheets.map((s,i)=>`<sheet name="${xml(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join("")}</sheets></workbook>`);
  add("xl/_rels/workbook.xml.rels",`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  add("xl/styles.xml",`<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Tahoma"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Tahoma"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF007FCF"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="right" vertical="top" wrapText="1" readingOrder="2"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="right" vertical="center" wrapText="1" readingOrder="2"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`);
  sheets.forEach((sheet,index)=>{
    if(sheet.rows.length>1048576)throw new Error("تعداد سطرها بیش از ظرفیت اکسل است.");
    const last=`${columnName(sheet.widths.length-1)}${Math.max(sheet.rows.length,1)}`;
    const rowsXml=sheet.rows.map((row,i)=>`<row r="${i+1}"${i===0?' ht="30" customHeight="1"':""}>${row.map((cell,j)=>{
      const attrs=`r="${columnName(j)}${i+1}" s="${i===0?1:0}"`;
      if(typeof cell==="number"&&Number.isFinite(cell))return `<c ${attrs} t="n"><v>${cell}</v></c>`;
      if(String(cell).length>32767)throw new Error("متن یک سلول از ظرفیت اکسل بیشتر است؛ فیلتر گزارش را محدود کنید.");
      return `<c ${attrs} t="inlineStr"><is><t xml:space="preserve">${xml(String(cell))}</t></is></c>`;
    }).join("")}</row>`).join("");
    add(`xl/worksheets/sheet${index+1}.xml`,`<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${last}"/><sheetViews><sheetView rightToLeft="1" workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="36"/><cols>${sheet.widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join("")}</cols><sheetData>${rowsXml}</sheetData>${sheet.filter?`<autoFilter ref="A1:${last}"/>`:""}</worksheet>`);
  });
  return zipStore(files);
}
function zipStore(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const enc=new TextEncoder(); const parts:Uint8Array[]=[];const central:Uint8Array[]=[];let offset=0;
  const crc=(data:Uint8Array)=>{let c=0xffffffff;for(const b of data){c^=b;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
  for(const file of files){
    const name=enc.encode(file.name), checksum=crc(file.data);
    const local=new Uint8Array(30+name.length),lv=new DataView(local.buffer);
    lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0x800,true);lv.setUint16(12,33,true);
    lv.setUint32(14,checksum,true);lv.setUint32(18,file.data.length,true);lv.setUint32(22,file.data.length,true);lv.setUint16(26,name.length,true);local.set(name,30);
    parts.push(local,file.data);
    const c=new Uint8Array(46+name.length),cv=new DataView(c.buffer);
    cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint16(14,33,true);
    cv.setUint32(16,checksum,true);cv.setUint32(20,file.data.length,true);cv.setUint32(24,file.data.length,true);cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);c.set(name,46);central.push(c);
    offset+=local.length+file.data.length;
  }
  const centralSize=central.reduce((n,p)=>n+p.length,0),end=new Uint8Array(22),ev=new DataView(end.buffer);
  ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,centralSize,true);ev.setUint32(16,offset,true);
  const out=new Uint8Array(offset+centralSize+22);let cursor=0;for(const part of [...parts,...central,end]){out.set(part,cursor);cursor+=part.length;}return out;
}
