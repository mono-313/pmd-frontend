"use client";

import {
  useCallback,
  useMemo,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import ForecastStatusBadge from
  "@/app/component/forecast/forecast-status-badge";

import type {
  ForecastListResponse,
  ForecastResponse,
  ForecastStatus,
  PaginationMetadata,
} from "@/app/types/forecast";

import ForecastActions from
  "@/app/component/forecast/forecast-actions";

import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persianFa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";
import gregorianEn from "react-date-object/locales/gregorian_en";

type ListForecast = ForecastResponse & { networkId: number; createdDate?: string };
const filterClass = "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#007fcf]";
function dayKey(value: unknown): string {
  if (typeof value !== "string") return "";
  const match = /^(\d{4}-\d{2}-\d{2})(?:T|$)/.exec(value);
  if (!match) return "";
  const d = new Date(match[1] + "T12:00:00Z");
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === match[1] ? match[1] : "";
}
function pickerDay(value: DateObject | null): string {
  return value ? new DateObject(value).convert(gregorian, gregorianEn).format("YYYY-MM-DD") : "";
}
function searchText(value: string): string {
  return normalizeDigits(value).replace(/ي/g,"ی").replace(/ك/g,"ک")
    .replace(/[\u064B-\u065F\u0670]/g,"").replace(/\u200c/g," ")
    .replace(/\s+/g," ").trim().toLowerCase();
}
function programKey(networkId: number, planId: number): string {
  return networkId + ":" + planId;
}
const initialPagination:
  PaginationMetadata = {
  totalCount: 0,

  currentPage: 1,

  pageSize: 10,

  totalPages: 0,

  hasNext: false,

  hasPrevious: false,
};


export default function ForecastListPage() {
  const [
    focusedForecastId,
    setFocusedForecastId,
  ] = useState("");

  const focusedRowRef =
    useRef<HTMLTableRowElement | null>(
      null
    );

  const [allForecasts, setAllForecasts] = useState<ListForecast[]>([]);
  const [programNames, setProgramNames] = useState<Record<string,string>>({});
  const [selectedStatus, setSelectedStatus] = useState<ForecastStatus | "">("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [createdFrom, setCreatedFrom] = useState<DateObject | null>(null);
  const [createdTo, setCreatedTo] = useState<DateObject | null>(null);
  const [broadcastFrom, setBroadcastFrom] = useState<DateObject | null>(null);
  const [broadcastTo, setBroadcastTo] = useState<DateObject | null>(null);
  const [topic, setTopic] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [programWarning, setProgramWarning] = useState("");
  const controllerRef = useRef<AbortController | null>(null);

  const loadForecasts = useCallback(async (_pageNumber = 1) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 120000);
    setIsLoading(true); setError(""); setProgramWarning("");
    try {
      const collected = new Map<string,ListForecast>();
      let complete = false;
      // تا صفحهٔ خالی: metadata جایگزین Route ممکن است totalPages=1 باشد.
      for (let page = 1; page <= 200; page++) {
        const response = await fetch(`/api/forecasts?pageNumber=${page}&pageSize=100`, {cache:"no-store", signal:controller.signal});
        const data = parseJsonResponse(await response.text());
        if (!response.ok) throw new Error(getMessage(data) || "دریافت پیش‌بینی‌ها ناموفق بود.");
        if (!isForecastListResponse(data)) throw new Error("ساختار فهرست پیش‌بینی‌ها معتبر نیست.");
        if (!data.items.length) { complete = true; break; }
        let added = 0;
        for (const raw of data.items) {
          const item = raw as ListForecast;
          if (!item.id) throw new Error("شناسهٔ پیش‌بینی در پاسخ موجود نیست.");
          if (!collected.has(item.id)) added++;
          collected.set(item.id,item);
        }
        if (!added) throw new Error("صفحه‌بندی سرویس تکراری است؛ دریافت فهرست کامل نشد.");
      }
      if (!complete) throw new Error("حجم فهرست از سقف دریافت بیشتر است؛ سرویس جست‌وجوی سمت سرور لازم است.");
      const records = [...collected.values()];
      const names: Record<string,string> = {};
      const networks = [...new Set(records.map(r=>Number(r.networkId)).filter(n=>Number.isInteger(n)&&n>0))];
      const failed: number[] = [];
      // حداکثر چهار درخواست همزمان؛ هر شبکه فقط یک بار دریافت می‌شود.
      let next = 0;
      await Promise.all(Array.from({length:Math.min(4,networks.length)},async()=>{
        while (next < networks.length) {
          const networkId = networks[next++];
          try {
            const res = await fetch(`/api/programs?networkId=${networkId}`,{cache:"no-store",signal:controller.signal});
            const data = parseJsonResponse(await res.text());
            if (!res.ok || !findProgramsArray(data)) throw new Error("نام برنامه دریافت نشد");
            for (const p of extractPrograms(data)) names[programKey(networkId,p.id)] = p.name;
          } catch { if (controller.signal.aborted) throw new Error("دریافت لغو شد"); failed.push(networkId); }
        }
      }));
      if (controllerRef.current !== controller) return;
      controller.signal.throwIfAborted();
      setAllForecasts(records); setProgramNames(names);
      if (failed.length) setProgramWarning("نام برنامه‌های بعضی شبکه‌ها دریافت نشد؛ موقتاً شمارهٔ برنامه نمایش داده می‌شود. دوباره به‌روزرسانی کنید.");
    } catch (cause) {
      if (controllerRef.current !== controller) return;
      setAllForecasts([]); setProgramNames({});
      setError(controller.signal.aborted ? "زمان دریافت اطلاعات به پایان رسید؛ دوباره تلاش کنید." : cause instanceof Error ? cause.message : "دریافت اطلاعات ناموفق بود.");
    } finally {
      clearTimeout(timeout);
      if (controllerRef.current === controller) setIsLoading(false);
    }
  },[]);
  useEffect(()=>{void loadForecasts(); return ()=>{controllerRef.current?.abort();controllerRef.current=null;};},[loadForecasts]);
  useEffect(()=>{setFocusedForecastId(new URLSearchParams(window.location.search).get("focusId")?.trim() || "");},[]);

  const from = pickerDay(createdFrom), to = pickerDay(createdTo);
  const broadcastStart = pickerDay(broadcastFrom), broadcastEnd = pickerDay(broadcastTo);
  const invalidDates = Boolean((from && to && from > to) || (broadcastStart && broadcastEnd && broadcastStart > broadcastEnd));
  const filtered = useMemo(()=> invalidDates ? [] : allForecasts.filter(f=>{
    const registered = dayKey(f.createdDate), broadcast = dayKey(f.broadcastDate);
    return (!selectedStatus || f.status === selectedStatus) &&
      (!selectedProgram || programKey(f.networkId,f.planId) === selectedProgram) &&
      (!from || Boolean(registered && registered >= from)) &&
      (!to || Boolean(registered && registered <= to)) &&
      (!broadcastStart || Boolean(broadcast && broadcast >= broadcastStart)) &&
      (!broadcastEnd || Boolean(broadcast && broadcast <= broadcastEnd)) &&
      (!searchText(topic) || searchText(f.mainTopic || "").includes(searchText(topic)));
  }),[allForecasts,selectedStatus,selectedProgram,from,to,broadcastStart,broadcastEnd,topic,invalidDates]);
  const programOptions = useMemo(()=>[...new Map(allForecasts.map(f=>{
    const id = programKey(f.networkId,f.planId);
    return [id,{id,name:getProgramName(programNames,f.planId,f.networkId)}] as const;
  })).values()].sort((a,b)=>a.name.localeCompare(b.name,"fa")),[allForecasts,programNames]);
  useEffect(()=>{setCurrentPage(1);},[selectedStatus,selectedProgram,from,to,broadcastStart,broadcastEnd,topic]);
  const totalPages = Math.max(1,Math.ceil(filtered.length/10));
  const effectivePage = Math.min(currentPage,totalPages);
  const pagination = {...initialPagination,currentPage:effectivePage,totalCount:filtered.length,totalPages,pageSize:10,hasPrevious:effectivePage>1,hasNext:effectivePage<totalPages};
  const forecasts = filtered.slice((effectivePage-1)*10,effectivePage*10);
  useEffect(()=>{
    if (isLoading || !focusedForecastId) return;
    const index = filtered.findIndex(f=>f.id===focusedForecastId);
    if(index>=0) setCurrentPage(Math.floor(index/10)+1);
  },[filtered,focusedForecastId,isLoading]);
  useEffect(()=>{
    if(isLoading || !forecasts.some(f=>f.id===focusedForecastId)) return;
    const frame=window.requestAnimationFrame(()=>{focusedRowRef.current?.scrollIntoView({behavior:"smooth",block:"center"});focusedRowRef.current?.focus({preventScroll:true});});
    return ()=>window.cancelAnimationFrame(frame);
  },[effectivePage,filtered,focusedForecastId,isLoading]);
  function resetFilters() {setCreatedFrom(null);setCreatedTo(null);setBroadcastFrom(null);setBroadcastTo(null);setSelectedProgram("");setSelectedStatus("");setTopic("");setCurrentPage(1);}

  return (
    <main
      className="
        min-h-screen
        bg-gray-50
        px-4 py-8
      "
      dir="rtl"
    >
      <section
        className="
          mx-auto
          max-w-7xl
        "
      >
        <header
          className="
            mb-6
            flex flex-col
            gap-4
            md:flex-row
            md:items-center
            md:justify-between
          "
        >
          <div>
            <h1
              className="
                text-2xl
                
                text-gray-800
              "
            >
              لیست پیش‌بینی‌ها
            </h1>

            <p
              className="
                mt-2
                text-sm
                text-gray-500
              "
            >
              پیش‌بینی‌های ثبت‌شده متناسب با سطح دسترسی شما
            </p>
          </div>


          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <button
              type="button"
              onClick={() =>
                loadForecasts(
                  pagination.currentPage
                )
              }
              disabled={
                isLoading
              }
              className="
                flex h-11
                items-center
                gap-2
                rounded-lg
                border
                border-gray-300
                bg-white
                px-4
                text-gray-700
                hover:bg-gray-50
                disabled:opacity-60
              "
            >
              <RefreshCw
                size={17}
              />

              بروزرسانی
            </button>
          </div>
        </header>


        <section aria-label="فیلتر پیش‌بینی‌ها" 
        className="mb-5 rounded-xl border
         border-gray-200 
         bg-white p-5">
          <div className="grid gap-4
           sm:grid-cols-2 
           lg:grid-cols-4">
<div><label htmlFor="created-from"
 className="mb-2 block text-sm">از تاریخ ثبت</label>
 <DatePicker id="created-from" value={createdFrom} 
 onChange={v=>setCreatedFrom(v as DateObject | null)} 
 calendar={persian} locale={persianFa} format="YYYY/MM/DD" 
 editable={false} containerStyle={{width:"100%"}} 
 inputClass={filterClass} 
 calendarPosition="bottom-right"/>
 </div>
<div><label htmlFor="created-to" 
className="mb-2 block text-sm">تا تاریخ ثبت</label>
<DatePicker id="created-to" value={createdTo} 
onChange={v=>setCreatedTo(v as DateObject | null)} 
calendar={persian} locale={persianFa} 
format="YYYY/MM/DD" editable={false} 
containerStyle={{width:"100%"}} 
inputClass={filterClass} 
 calendarPosition="bottom-right"/>
 </div>
<div><label htmlFor="broadcast-from" 
className="mb-2 block text-sm">از تاریخ پخش</label>
<DatePicker id="broadcast-from" 
value={broadcastFrom} 
onChange={v=>setBroadcastFrom(v as DateObject | null)} 
calendar={persian} locale={persianFa} 
format="YYYY/MM/DD" editable={false} 
containerStyle={{width:"100%"}} 
inputClass={filterClass} 
calendarPosition="bottom-right"/>
</div>

<div><label htmlFor="broadcast-to"
 className="mb-2 block text-sm">تا تاریخ پخش</label>
 <DatePicker id="broadcast-to" 
 value={broadcastTo} 
 onChange={v=>setBroadcastTo(v as DateObject | null)} 
 calendar={persian} 
 locale={persianFa} 
 format="YYYY/MM/DD" 
 editable={false} 
 containerStyle={{width:"100%"}} 
 inputClass={filterClass} 
  calendarPosition="bottom-right"/>
  </div>
<div><label htmlFor="program-filter"
 className="mb-2 block
  text-sm">نام برنامه</label>
  <select id="program-filter" 
  className={filterClass} 
  value={selectedProgram} 
  onChange={e=>setSelectedProgram(e.target.value)}>
    <option value="">همه برنامه‌ها</option>
    {programOptions.map(p=><option key={p.id}
     value={p.id}>{p.name}</option>)}</select>
     </div>
<div>
  <label className="mb-2
                       block
                       text-sm"
              htmlFor="status-filter">وضعیت
      </label>
            <select id="status-filter"
              value={
                selectedStatus
              }
              onChange={(event) =>
                setSelectedStatus(
                  event.target.value as
                    | ForecastStatus
                    | ""
                )
              }
              className="
                h-11
                rounded-lg
                border
                border-gray-300
                bg-white
                px-3
                outline-none
                focus:border-[#007fcf]
              "
            >
              <option value="">
                همه وضعیت‌ها
              </option>

              <option value="Draft">
                پیش‌نویس
              </option>

              <option value="PendingReview">
                در انتظار بررسی
              </option>

              <option value="Approved">
                تأیید شده
              </option>

              <option value="Rejected">
                رد شده
              </option>

              <option value="ReturnedForEdit">
                برگشت برای اصلاح
              </option>
            </select>


</div>
<div className="sm:col-span-2">
  <label htmlFor="topic-filter" 
  className="mb-2 block text-sm">موضوع اصلی</label>
  <input id="topic-filter" 
  className={filterClass} 
  value={topic} 
  onChange={e=>setTopic(e.target.value)} 
  placeholder="موضوع را جستجو کنید" 
  type="search"/>
  </div>
</div>
<div className="mt-4 
      flex items-center
      justify-between 
      gap-3">
        <p className="text-xs text-gray-500"
        >فیلترها هم‌زمان اعمال می‌شوند؛ تاریخ ابتدا و
         انتها نیز در نتایج محاسبه می‌شود.
         </p>
        <button type="button" 
        onClick={resetFilters} 
        className={paginationButtonClass}>پاک‌کردن فیلترها</button>
        </div>
{invalidDates && 
<p role="alert" 
className="mt-3 text-sm text-red-600"
>تاریخ شروع نباید بعد از تاریخ پایان باشد.
</p>}
</section>
{programWarning && 
<p role="status" 
className="mb-4 rounded-lg
 bg-amber-50 p-3 
 text-sm 
 text-amber-800">
  {programWarning}
  </p>
  }
        {error && (
          <div
            className="
              mb-5
              rounded-xl
              border
              border-red-200
              bg-red-50
              p-4
              text-sm
              text-red-700
            "
          >
            {error}
          </div>
        )}


        <div
          className="
            overflow-hidden
            rounded-2xl
            border
            border-gray-200
            bg-white
            shadow-sm
          "
        >
          <div
            className="
              overflow-x-auto
            "
          >
            <table
              className="
                w-full
                  table-fixed
                  border-collapse
              "
            >
              <colgroup>
                    <col className="w-[4%]" />
                    <col className="w-[20%]" />
                    <col className="w-[4%]" />
                    <col className="w-[10%]" />
                    <col className="w-[7%]" />
                    <col className="w-[7%]" />
                    <col className="w-[10%]" />
                    <col className="w-[7%]" />
                    <col className="w-[7%]" />
                    </colgroup>
              <thead
                className="
                  bg-gray-50
                "
              >
                <tr>
                  <th className={headerClass}>
                    ردیف
                  </th>

                  <th className={headerClass}>
                    نام برنامه
                  </th>

                  <th className={headerClass}>
                    قسمت
                  </th>

                  <th className={headerClass}>
                    موضوع اصلی
                  </th>

                  <th className={headerClass}>
                    تاریخ پخش
                  </th>

                  <th className={headerClass}>
                    کارشناس
                  </th>

                  <th className={headerClass}>
                    محورهای موضوعی
                  </th>

                  {/* <th className={headerClass}>
                    ثبت‌کننده
                  </th> */}

                  <th className={headerClass}>
                    وضعیت
                  </th>
                  <th className={headerClass}>
                    عملیات
                  </th>
                </tr>
              </thead>


              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="
                        py-16
                        text-center
                      "
                    >
                      <div
                        className="
                          flex
                          items-center
                          justify-center
                          gap-2
                          text-gray-500
                        "
                      >
                        <LoaderCircle
                          size={20}
                          className="
                            animate-spin
                          "
                        />

                        در حال دریافت پیش‌بینی‌ها...
                      </div>
                    </td>
                  </tr>
                ) : forecasts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="
                        py-16
                        text-center
                        text-gray-500
                      "
                    >
                      پیش‌بینی ثبت‌شده‌ای پیدا نشد.
                    </td>
                  </tr>
                ) : (
                  forecasts.map(
                    (
                      forecast,
                      index
                    ) => {
                      const isFocused =
                        forecast.id ===
                        focusedForecastId;

                      return (
                        <tr
                          key={
                            forecast.id
                          }
                          ref={
                            isFocused
                              ? focusedRowRef
                              : undefined
                          }
                          tabIndex={
                            isFocused
                              ? -1
                              : undefined
                          }
                          aria-current={
                            isFocused
                              ? "true"
                              : undefined
                          }
                          className={`
                            border-t
                            border-gray-100
                            outline-none
                            transition-colors
                            ${
                              isFocused
                                ? "bg-blue-50 ring-2 ring-inset ring-[#007fcf]/40"
                                : "hover:bg-gray-50/70"
                            }
                          `}
                        >
                        <td className={cellClass}>
                          {(
                            pagination.currentPage -
                            1
                          ) *
                            pagination.pageSize +
                            index +
                            1}
                        </td>

                       <td
                          className="
                            px-3 py-4
                            align-middle
                            text-sm
                            text-gray-700
                          "
                        >
                          <span
                            className="
                              block
                              overflow-hidden
                             
                              break-words
                              whitespace-normal
                              leading-6
                              line-clamp-2
                            "
                            title={getProgramName(
                              programNames,
                              forecast.planId,
                              forecast.networkId
                            )}
                          >
                            {getProgramName(
                              programNames,
                              forecast.planId,
                              forecast.networkId
                            )}
                          </span>
                        </td>

                        <td className={cellClass}>
                          {forecast.episodeNumber}
                        </td>

                        <td
                          className={`
                            ${cellClass}
                            max-w-64
                            whitespace-normal
                             text-gray-800
                          `}
                        >
                          {forecast.mainTopic}
                        </td>

                        <td className={cellClass}>
                          {formatPersianDate(
                            forecast.broadcastDate
                          )}
                        </td>

                        <td className={cellClass}>
                          {forecast.hasExpert
                            ? `${forecast.expertIds?.length ?? 0} کارشناس`
                            : "ندارد"}
                        </td>

                        <td className={cellClass}>
                          {Array.isArray(
                              forecast.topicAxes
                            ) &&
                            forecast.topicAxes.length > 0
                              ? [...forecast.topicAxes]
                                  .sort(
                                    (
                                      first,
                                      second
                                    ) =>
                                      (
                                        first.displayOrder ??
                                        0
                                      ) -
                                      (
                                        second.displayOrder ??
                                        0
                                      )
                                  )
                                  .map(
                                    (axis) =>
                                      axis.title
                                  )
                                  .filter(Boolean)
                                  .join("، ")
                              : "—"}
                        </td>

                        {/* <td className={cellClass}>
                          {forecast.createdByUserName}
                        </td> */}

                        <td className={cellClass}>
                          <ForecastStatusBadge
                            status={
                              forecast.status
                            }
                          />
                        </td>
                        <td className={cellClass}>
                        <ForecastActions
                          forecast={forecast}
                          onChanged={() =>
                            loadForecasts(
                              pagination.currentPage
                            )
                          }
                        />
                      </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>


          <footer
            className="
              flex flex-col
              gap-3
              border-t
              border-gray-200
              px-5 py-4
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <p
              className="
                text-sm
                text-gray-500
              "
            >
              تعداد کل:
              {" "}
              {pagination.totalCount}
            </p>


            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <button
                type="button"
                onClick={() =>
                  setCurrentPage(pagination.currentPage - 1)
                }
                disabled={
                  isLoading ||
                  !pagination.hasPrevious
                }
                className={paginationButtonClass}
              >
                <ChevronRight
                  size={18}
                />

                قبلی
              </button>


              <span
                className="
                  text-sm
                  text-gray-600
                "
              >
                صفحه
                {" "}
                {pagination.currentPage}
                {" "}
                از
                {" "}
                {Math.max(
                  pagination.totalPages,
                  1
                )}
              </span>


              <button
                type="button"
                onClick={() =>
                  setCurrentPage(pagination.currentPage + 1)
                }
                disabled={
                  isLoading ||
                  !pagination.hasNext
                }
                className={paginationButtonClass}
              >
                بعدی

                <ChevronLeft
                  size={18}
                />
              </button>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}


function parseJsonResponse(
  responseText: string
): unknown | null {
  if (!responseText.trim()) {
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


function isForecastListResponse(
  value: unknown
): value is ForecastListResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(
      value.items
    ) &&
    isRecord(
      value.pagination
    )
  );
}


function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}


function getMessage(
  value: unknown
): string | null {
  if (!isRecord(value)) {
    return null;
  }

  return typeof value.message ===
    "string"
    ? value.message
    : null;
}


function formatPersianDate(
  isoDate: string
): string {
  const date =
    new Date(isoDate);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return isoDate;
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
    }
  ).format(date);
}


const headerClass = `
  whitespace-nowrap
  px-4 py-4
  text-right
  text-xs
  text-gray-600
`;


const cellClass = `
  whitespace-nowrap
  px-4 py-4
  text-sm
  text-gray-600
`;


const paginationButtonClass = `
  flex
  items-center
  gap-1
  rounded-lg
  border
  border-gray-300
  bg-white
  px-3 py-2
  text-sm
  text-gray-700
  hover:bg-gray-50
  disabled:cursor-not-allowed
  disabled:opacity-50
`;



interface ProgramListItem {
  id: number;
  name: string;
}


function extractPrograms(
  value: unknown
): ProgramListItem[] {
  const rawPrograms =
    findProgramsArray(value);

  if (!rawPrograms) {
    console.error(
      "Programs array was not found:",
      value
    );

    return [];
  }

  return rawPrograms
    .map(normalizeProgram)
    .filter(
      (
        program
      ): program is ProgramListItem =>
        program !== null
    );
}


function findProgramsArray(
  value: unknown
): unknown[] | null {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return null;
  }

  const possibleFields = [
    "programs",
    "Programs",
    "items",
    "Items",
    "data",
    "Data",
    "result",
    "Result",
  ];

  for (
    const fieldName of
    possibleFields
  ) {
    const fieldValue =
      value[fieldName];

    if (Array.isArray(fieldValue)) {
      return fieldValue;
    }

    const nestedResult =
      findProgramsArray(
        fieldValue
      );

    if (nestedResult) {
      return nestedResult;
    }
  }

  return null;
}


function normalizeProgram(
  value: unknown
): ProgramListItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const rawId =
    value.id ??
    value.Id ??
    value.value ??
    value.Value ??
    value.planId ??
    value.PlanId;

  const rawName =
    value.name ??
    value.Name ??
    value.text ??
    value.Text ??
    value.title ??
    value.Title ??
    value.planName ??
    value.PlanName;

  const id =
    typeof rawId === "number"
      ? rawId
      : typeof rawId === "string"
        ? Number(rawId)
        : Number.NaN;

  const name =
    typeof rawName === "string"
      ? rawName.trim()
      : "";

  if (
    !Number.isFinite(id) ||
    !name
  ) {
    return null;
  }

  return {
    id,
    name,
  };
}


function getProgramName(
  programNames:
    Record<string, string>,
  planId: unknown,
  networkId: number
): string {
  const normalizedPlanId =
    readNumericValue(planId);

  if (normalizedPlanId === null) {
    return "—";
  }

  return (
    programNames[
      programKey(networkId,normalizedPlanId)
    ] ??
    `برنامه شماره ${normalizedPlanId}`
  );
}



function readNumericValue(
  value: unknown
): number | null {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string" &&
          value.trim()
        ? Number(
            normalizeDigits(
              value
            )
          )
        : Number.NaN;

  return Number.isFinite(
    numericValue
  )
    ? numericValue
    : null;
}

function normalizeDigits(
  value: string
): string {
  const persianDigits =
    "۰۱۲۳۴۵۶۷۸۹";

  const arabicDigits =
    "٠١٢٣٤٥٦٧٨٩";

  return value
    .replace(
      /[۰-۹]/g,
      (digit) =>
        String(
          persianDigits.indexOf(
            digit
          )
        )
    )
    .replace(
      /[٠-٩]/g,
      (digit) =>
        String(
          arabicDigits.indexOf(
            digit
          )
        )
    );
}
