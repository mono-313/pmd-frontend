"use client";

import { useEffect, useState, type ReactNode } from 
"react";
import { useParams, useRouter } from 
"next/navigation";
import { ArrowRight, CalendarDays, Hash, User } from 
"lucide-react";
import ReviewActions from 
"@/app/component/forecast/review-actions";

type Row = Record<string, unknown>;

interface ViewForecast {
  id: string;
  planId: number | null;
  planName: string;
  networkId: number | null;
  networkGroupId: number | null;
  episodeNumber: number | null;
  broadcastDate: string;
  mainTopic: string;
  hasExpert: boolean;
  status: unknown;
  topicAxes: { id: string; title: string; displayOrder: number }[];
  experts: { id: string; name: string }[];
  createdByUserName: string;
  createdDate: string;
}

export default function ForecastReviewDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const forecastId = typeof params.id === "string" ? params.id.trim() : "";
  const [forecast, setForecast] = useState<ViewForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadForecast() {
      if (!forecastId) {
        setError("شناسه موضوع معتبر نیست.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");
        const response = await 
        fetch(`/api/forecasts/${encodeURIComponent(forecastId)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const text = await response.text();
        const data = parseJson(text);

        if (!response.ok) {
          throw new Error(errorMessage(data) ?? `دریافت اطلاعات انجام نشد. کد پاسخ: ${response.status}`);
        }

        const raw = extractForecast(data);
        if (!raw) throw new Error("اطلاعات پیش‌بینی در پاسخ سرور پیدا نشد.");
        if (!cancelled) 
          setForecast(normalizeForecast(raw, forecastId));
      } catch (cause) {
        if (!cancelled) 
          setError(cause instanceof Error ? cause.message : "دریافت اطلاعات انجام نشد.");
      } finally {
        if (!cancelled) 
          setIsLoading(false);
      }
    }

    void loadForecast();
    return () => { cancelled = true; };
  }, [forecastId]);

  if (isLoading) 
    return <main className="p-8 text-center" dir="rtl"
    >در حال دریافت اطلاعات...</main>;

  if (error || !forecast) {
    return (
      <main className="p-6" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <h1 className="font-bold">نمایش موضوع امکان‌پذیر نیست</h1>
          <p className="mt-2 text-sm">{error || "موضوع پیدا نشد."}</p>
          <button onClick={() => router.push("/forecasts/review")} className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2">بازگشت به کارتابل</button>
        </div>
      </main>
    );
  }

  const canReview = isPending(forecast.status);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8" dir="rtl">
      <section className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
            onClick={() => router.push("/forecasts/review")} 
            className="rounded-lg border bg-white p-2">
              <ArrowRight size={20} />
              </button>

            <div>
              <h1 className="text-xl font-bold"
              >بررسی موضوع پیشنهادی</h1>
              <p className="mt-1 text-sm text-gray-500"
              >نمای کلی اطلاعات ثبت‌شده</p>
              </div>
          </div>
          <span 
          className=
          "rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
            {isPending(forecast.status) ? 
            "در انتظار بررسی" : 
            statusTitle(forecast.status)}
            </span>
        </header>
        <Card title="مشخصات برنامه">
          <div 
          className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <Info label="نام برنامه" 
            value={forecast.planName || (forecast.planId !== null ? `برنامه شماره ${fa(forecast.planId)}` : "—")} />
            <Info label="موضوع اصلی" 
            value={forecast.mainTopic} />
            <Info label="شماره قسمت" 
            value={forecast.episodeNumber !== null ? fa(forecast.episodeNumber) : "—"} icon={<Hash size={16} />} />
            <Info label="تاریخ پخش" 
            value={jalali(forecast.broadcastDate)} icon={<CalendarDays size={16} />} />
            <Info label="دارای کارشناس" 
            value={forecast.hasExpert ? "بله" : "خیر"} />
            <Info label="ثبت‌کننده" 
            value={forecast.createdByUserName} icon={<User size={16} />} />
            <Info label="شبکه" 
            value={forecast.networkId !== null ? fa(forecast.networkId) : "—"} />
            <Info label="گروه برنامه‌ساز" 
            value={forecast.networkGroupId !== null ? fa(forecast.networkGroupId) : "—"} />
            <Info label="تاریخ ثبت" 
            value={jalali(forecast.createdDate)} />
          </div>
        </Card>

        <Card title="محورهای موضوعی">
          {forecast.topicAxes.length ?
           forecast.topicAxes.sort((a, b) => a.displayOrder - b.displayOrder)
           .map((axis, index) => <div key={axis.id} 
           className="mb-2 rounded-lg bg-gray-50 p-3">
            {fa(index + 1)}. {axis.title}</div>) : 
            <p className="text-gray-500">محوری ثبت نشده است.</p>}
        </Card>

        <Card title="کارشناسان برنامه">
          {!forecast.hasExpert ? <p className="text-gray-500"
          >این برنامه کارشناس ندارد.</p> : 
          forecast.experts.length ? forecast.experts.
          map((expert, index) => 
          <div key={`${expert.id}-${index}`}
           className="mb-2 rounded-lg bg-gray-50 p-3">
            {fa(index + 1)}. {expert.name || expert.id}</div>) :
             <p className="text-amber-700"
             >اطلاعات کارشناسان در پاسخ وجود ندارد.</p>}
        </Card>

        {canReview
         ? <ReviewActions 
         forecastId={forecast.id} /> : 
         <div 
         className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700">این موضوع در وضعیت فعلی قابل بررسی نیست.</div>}
      </section>
    </main>
  );
}

function Card({ title, children }:
   { title: string; children: ReactNode }) {
  return <section 
  className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
    <h2 className="mb-5 border-b pb-3 text-lg font-bold">
      {title}</h2>
      {children}
      </section>;
}

function Info({ label, value, icon }:
   { label: string; value: string | number | null | undefined;
     icon?: ReactNode }) {
  return <div><div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
    {icon}{label}</div>
    <p className="min-h-11 rounded-lg bg-gray-50 p-3 font-semibold">
      {value === null || value === undefined || value === "" ?
       "—" : value}
       </p>
       </div>;
}

function extractForecast(value: unknown):
 Row | null {
  if (!record(value)) return null;
  const candidates: unknown[] =
   [value, value.forecast, value.data, value.result];
  if (record(value.data))
     candidates.push(
      value.data.forecast, 
      value.data.data,
      value.data.result);
  return candidates.find((item): item is Row => record(item) && typeof item.id === "string") ?? null;
}

function normalizeForecast(v: Row, fallbackId: string):
 ViewForecast {
  return {
    id: str(v.id) || fallbackId,
    planId: num(v.planId), planName: str(v.planName) || str(v.programName),
    networkId: num(v.networkId), networkGroupId: num(v.networkGroupId), episodeNumber: num(v.episodeNumber),
    broadcastDate: str(v.broadcastDate), mainTopic: str(v.mainTopic) || "—", hasExpert: bool(v.hasExpert), status: v.status,
    topicAxes: axes(v.topicAxes), experts: experts(v), createdByUserName: str(v.createdByUserName) || str(v.createdByName),
    createdDate: str(v.createdDate) || str(v.createdAt),
  };
}

function axes(value: unknown): ViewForecast["topicAxes"] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (typeof item === "string") return item.trim() ?
     [{ id: `axis-${index}`, 
      title: item.trim(), 
      displayOrder: index + 1 }] : 
      [];
    if (!record(item)) return [];
    const title = str(item.title) || str(item.name);
    return title ?
     [{ id: str(item.id) || `axis-${index}`,
       title,
       displayOrder: num(item.displayOrder) ?? index + 1 }] :
       [];
  });
}

function experts(v: Row): ViewForecast["experts"] {
  if (Array.isArray(v.experts)) {
    const rows = v.experts.flatMap((item, index) => 
      record(item) ? 
    [{ id: str(item.id) || `expert-${index}`, 
      name: str(item.name) || str(item.fullName) || 
      `${str(item.firstName)} ${str(item.lastName)}`.trim() }] :
       []);
    if (rows.length) return rows;
  }
  return Array.isArray(v.expertIds) ?
   v.expertIds.flatMap((id, index) =>
     typeof id === "string" ?
    [{ id, name: `کارشناس ${fa(index + 1)}` }] : []) : [];
}

function isPending(s: unknown) 
{ return s === 2 || s === "2" || s === "PendingReview"; }
function statusTitle(s: unknown) { const x = String(s ?? ""); 
  return ({ "1": "پیش‌نویس", Draft: "پیش‌نویس", "3": "تأییدشده", Approved: "تأییدشده", "4": "ردشده", Rejected: "ردشده", "5": "بازگشت برای اصلاح", ReturnedForEdit: "بازگشت برای اصلاح" } as Record<string, string>)[x] ?? x ?? "نامشخص"; }
function jalali(value: string) { if (!value) 
  return "—"; const date = new Date(normalizeDigits(value)); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC" }).format(date); }
function fa(value: string | number) { 
  return String(value).replace(/\d/g, digit => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]); }
function normalizeDigits(value: string) { 
  return value.replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))); }
function parseJson(text: string): unknown | null { try 
  { return text.trim() ? JSON.parse(text) as unknown : null; } catch { return null; } }
function errorMessage(value: unknown) { if (!record(value)) 
  return null; return str(value.message) || str(value.description) || str(value.detail) || (record(value.details) ? str(value.details.detail) || str(value.details.message) : "") || null; }
function str(value: unknown) { 
  return typeof value === "string" ? value.trim() : ""; }
function num(value: unknown): number | null 
{ const result = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(normalizeDigits(value)) : NaN; return Number.isFinite(result) ? result : null; }
function bool(value: unknown) { 
  return value === true || value === "true" || value === 1 || value === "1"; }
function record(value: unknown): value is Row { 
  return typeof value === "object" && value !== null && 
  !Array.isArray(value); }
