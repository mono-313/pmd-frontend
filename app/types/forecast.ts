/*
 * وضعیت‌های پیش‌بینی
 *
 * Backend طبق مستند جدید
 * این Enum را به‌صورت رشته
 * در JSON برمی‌گرداند.
 */
export type ForecastStatus =
  | "Draft"
  | "PendingReview"
  | "Approved"
  | "Rejected"
  | "ReturnedForEdit";


/*
 * محور موضوعی پیش‌بینی
 */
export interface ForecastTopicAxis {
  id:
    string;

  title:
    string;

  displayOrder:
    number;
}


/*
 * بدنه ارسالی مستقیم به Backend
 * برای ایجاد پیش‌بینی
 *
 * POST /api/forecasts
 */
export interface CreateForecastRequest {
  planId:
    number;

  networkId:
    number;

  networkGroupId:
    number;

  broadcastDate:
    string;

  mainTopic:
    string;

  hasExpert:
    boolean;

  topicAxes:
    string[];

  expertIds:
    string[];
}


/*
 * بدنه دریافتی Route داخلی
 * از مرحله نهایی Wizard
 *
 * submitAfterCreate فقط مربوط
 * به منطق Frontend است و نباید
 * به درخواست Create Backend
 * اضافه شود.
 */
export interface FinalSubmitRequest
  extends CreateForecastRequest {
  submitAfterCreate:
    boolean;
}


/*
 * پاسخ اصلی Forecast از Backend
 */
export interface ForecastResponse {
  id:
    string;

  planId:
    number;

  networkId:
    number;

  networkGroupId:
    number;

  episodeNumber:
    number;

  broadcastDate:
    string;

  mainTopic:
    string;

  hasExpert:
    boolean;

  status:
    ForecastStatus;

  topicAxes:
    ForecastTopicAxis[];

  expertIds:
    string[];

  /*
   * اطلاعات ثبت‌کننده
   */
  createdByUserId:
    string;

  createdByUserName:
    string;

  createdDate:
    string;

  /*
   * آخرین تاریخ ویرایش ممکن است
   * در برخی پاسخ‌ها وجود نداشته باشد.
   */
  lastModifiedDate?:
    string | null;

  /*
   * پس از تأیید، رد یا بازگشت
   * توسط Backend تکمیل می‌شوند.
   */
  reviewedByUserId?:
    string | null;

  lastActionReason?:
    string | null;
}


/*
 * اطلاعات تکمیلی کارشناس
 * برای نمایش در Frontend
 */
export interface ForecastExpert {
  id:
    string;

  fullName?:
    string;
}


/*
 * مدل مورد استفاده صفحات Frontend
 *
 * هسته این مدل همان پاسخ Backend است.
 */
export interface Forecast
  extends ForecastResponse {
  /*
   * ممکن است صفحه جزئیات،
   * اطلاعات کامل کارشناسان را
   * جداگانه دریافت و اضافه کند.
   */
  experts?:
    ForecastExpert[];

  /*
   * نام برنامه از سرویس اطلاعات
   * پایه و براساس planId تکمیل می‌شود.
   */
  programName?:
    string;

  /*
   * فیلدهای سازگاری موقت با
   * صفحات قدیمی پروژه.
   *
   * بعد از اصلاح صفحه مشاهده و
   * ویرایش حذف خواهند شد.
   */
  createdAt?:
    string;

  updatedAt?:
    string;

  /**
   * @deprecated
   * از lastActionReason استفاده شود.
   */
  returnReason?:
    string | null;

  /**
   * @deprecated
   * از lastActionReason استفاده شود.
   */
  rejectionReason?:
    string | null;
}


/*
 * اطلاعات صفحه‌بندی داخلی Frontend
 */
export interface PaginationMetadata {
  currentPage:
    number;

  totalPages:
    number;

  pageSize:
    number;

  totalCount:
    number;

  hasPrevious:
    boolean;

  hasNext:
    boolean;
}


/*
 * پاسخ یکپارچه Route داخلی
 * فهرست پیش‌بینی‌ها
 *
 * Backend آرایه را در Body و
 * Pagination را در Header می‌دهد؛
 * Route داخلی آن‌ها را در این
 * ساختار یکپارچه می‌کند.
 */
export interface ForecastListResponse {
  items:
    ForecastResponse[];

  pagination:
    PaginationMetadata;
}


/*
 * فیلترهای GET /api/forecasts
 *
 * pageNumber و pageSize طبق
 * مستند Backend اجباری هستند.
 */
export interface ForecastListFilters {
  planId?:
    number;

  status?:
    ForecastStatus | "";

  fromDate?:
    string;

  toDate?:
    string;

  pageNumber:
    number;

  pageSize:
    number;
}


/*
 * بدنه ویرایش Forecast
 *
 * PUT /api/forecasts/{id}
 */
export interface UpdateForecastRequest {
  /*
   * باید با شناسه موجود
   * در مسیر برابر باشد.
   */
  id:
    string;

  broadcastDate:
    string;

  mainTopic:
    string;

  hasExpert:
    boolean;

  topicAxes:
    string[];

  expertIds:
    string[];
}


/*
 * بدنه عملیات رد یا بازگشت
 *
 * POST /reject
 * POST /return-for-edit
 */
export interface ForecastReasonRequest {
  reason:
    string;
}


/*
 * پاسخ Route داخلی عملیات
 * submit، approve، reject و return
 *
 * Backend ممکن است Forecast یا
 * پاسخ خالی برگرداند.
 */
export interface ForecastActionResponse {
  message:
    string;

  forecast?:
    ForecastResponse;
}


/*
 * پاسخ Route داخلی مرحله
 * نهایی Wizard پیش‌بینی
 */
export interface FinalSubmitResponse {
  message:
    string;

  forecast:
    ForecastResponse;

  createSucceeded:
    boolean;

  submitSucceeded:
    boolean;
}


/*
 * پاسخ داخلی حذف Forecast
 */
export interface DeleteForecastResponse {
  message:
    string;

  deletedId:
    string;
}


/*
 * مجوز عملیات هر ردیف
 */
export interface ForecastRowPermissions {
  canView:
    boolean;

  canEdit:
    boolean;

  canDelete:
    boolean;

  canSubmit:
    boolean;
}


/*
 * مدل عمومی خطاهای API
 */
export interface ForecastApiError {
  type?:
    string;

  title?:
    string;

  status?:
    number;

  detail?:
    string;

  traceId?:
    string;

  message?:
    string;

  description?:
    string;

  code?:
    string;

  errors?:
    unknown;
}


/*
 * مدل سازگار خطا برای بخش‌هایی
 * که قبلاً از ApiErrorResponse
 * استفاده کرده‌اند.
 */
export interface ApiErrorResponse {
  type?:
    string;

  title?:
    string;

  status?:
    number;

  statusCode?:
    number;

  detail?:
    string;

  traceId?:
    string;

  message?:
    string;

  description?:
    string;

  code?:
    string;

  errors?:
    | string
    | Record<
        string,
        string[]
      >;
}