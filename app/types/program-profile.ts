/*
 * انواع داده‌های مربوط به
 * Wizard صدور شناسنامه برنامه
 */


/*
 * نحوه حضور کارشناس
 *
 * 1 = حضوری
 * 2 = تلفنی
 * 3 = تولیدی یا ضبط‌شده
 * 4 = محل کار
 */
export type AttendanceType =
  | 1
  | 2
  | 3
  | 4;


/*
 * گزینه آبشاری نحوه حضور
 */
export interface AttendanceTypeOption {
  value:
    AttendanceType;

  title:
    string;
}


/*
 * گزینه‌های ثابت نحوه حضور
 */
export const ATTENDANCE_TYPE_OPTIONS:
  AttendanceTypeOption[] = [
  {
    value: 1,
    title: "حضوری",
  },
  {
    value: 2,
    title: "تلفنی",
  },
  {
    value: 3,
    title: "تولیدی (ضبط‌شده)",
  },
  {
    value: 4,
    title: "محل کار",
  },
];


/*
 * اطلاعات مرحله اول ویزارد:
 * مشخصات شناسنامه برنامه
 */
export interface ProfileSpecificationsData {
  /*
   * شناسه پیش‌بینی
   */
  forecastId:
    string;

  /*
   * شناسه طرح یا برنامه
   */
  planId:
    number;

  /*
   * شناسه شبکه
   */
  networkId:
    number;

  /*
   * شناسه گروه شبکه
   *
   * در بعضی کاربران ممکن است
   * مقدار وجود نداشته باشد.
   */
  networkGroupId:
    number | null;


  /*
   * اطلاعات نمایشی
   */
  programName:
    string;

  mainTopic:
    string;

  episodeNumber:
    number | null;


  /*
   * مدت برنامه با فرمت:
   * hh:mm:ss
   */
  duration:
    string;

  /*
   * تاریخ میلادی ISO
   * قابل ارسال به Backend
   */
  broadcastDate:
    string;

  /*
   * تاریخ شمسی فقط برای نمایش
   * و DatePicker
   */
  broadcastDateJalali:
    string;


  /*
   * مشخصات برنامه
   */
  productionMethod:
    string;

  occasion:
    string;

  floorId:
    number | null;

  floorName:
    string;

  programDegreeId:
    number | null;

  programDegreeName:
    string;

  programStructureId:
    number | null;

  programStructureName:
    string;

  /*
   * ساعت شروع با فرمت:
   * hh:mm:ss
   */
  startTime:
    string;

  /*
   * آیا برنامه کارشناس دارد؟
   */
  hasExpert:
    boolean;
}


/*
 * عامل برنامه داخل FormData ویزارد
 *
 * اطلاعات اولیه معمولاً از:
 * GET /estimateDetail/{planId}
 */
export interface ProfileCrewMemberData {
  personnelId:
    number;

  personnelName:
    string;

  activityTypeId:
    number;

  activityTypeName:
    string;

  isPresent:
    boolean;
}


/*
 * آیتم برنامه داخل FormData ویزارد
 *
 * اطلاعات اولیه از:
 * GET /planItems/{planId}
 */
export interface ProfileItemData {
  /*
   * شناسه آیتم منبع
   */
  itemId:
    number | null;

  /*
   * عنوان آیتم
   */
  itemName:
    string;

  /*
   * موضوع یا توضیحات آیتم
   */
  itemSubject:
    string;

  /*
   * شناسه نوع تولید
   *
   * ممکن است سرویس اولیه
   * این مقدار را برنگرداند.
   */
  productionTypeId:
    number | null;

  /*
   * عنوان نوع تولید
   */
  productionType:
    string;

  /*
   * مدت آیتم با فرمت:
   * hh:mm:ss
   */
  duration:
    string;
}


/*
 * کارشناس انتخاب‌شده
 * در مرحله چهارم ویزارد
 */
export interface ProfileExpertData {
  expertId:
    string;

  /*
   * اطلاعات نمایشی
   */
  firstName:
    string;

  lastName:
    string;

  /*
   * محور موضوعی
   */
  topicAxisId:
    string;

  topicAxisTitle:
    string;

  /*
   * مدت حضور با فرمت:
   * hh:mm:ss
   */
  duration:
    string;

  attendanceType:
    AttendanceType;

  hasPayment:
    boolean;
}


/*
 * FormData اصلی ویزارد
 *
 * این داده در IssueProfileDialog
 * نگهداری می‌شود تا با جابه‌جایی
 * بین مراحل از بین نرود.
 */
export interface ProgramProfileWizardData {
  specifications:
    ProfileSpecificationsData;

  crewMembers:
    ProfileCrewMemberData[];

  items:
    ProfileItemData[];

  experts:
    ProfileExpertData[];
}


/*
 * مدل عامل قابل ارسال هنگام
 * صدور شناسنامه
 *
 * این مدل عمداً از مدل FormData
 * جدا تعریف شده است.
 */
export interface IssueProfileCrewMemberRequest {
  personnelId:
    number;

  personnelName:
    string;

  activityTypeId:
    number;

  activityTypeName:
    string;

  isPresent:
    boolean;
}


/*
 * مدل آیتم قابل ارسال هنگام
 * صدور شناسنامه
 *
 * itemId، itemSubject و
 * productionTypeId فعلاً در
 * قرارداد صدور Backend وجود ندارند.
 */
export interface IssueProfileItemRequest {
  itemName:
    string;

  productionType:
    string;

  duration:
    string;
}


/*
 * بدنه درخواست صدور شناسنامه
 *
 * POST /api/program-profiles/issue
 */
export interface IssueProgramProfileRequest {
  forecastId:
    string;

  planId:
    number;

  networkId:
    number;

  networkGroupId:
    number | null;

  /*
   * فرمت:
   * hh:mm:ss
   */
  duration:
    string;

  /*
   * فرمت ISO میلادی
   */
  broadcastDate:
    string;

  productionMethod:
    string;

  occasion:
    string;

  floorId:
    number;

  floorName:
    string;

  programDegreeId:
    number;

  programDegreeName:
    string;

  programStructureId:
    number;

  programStructureName:
    string;

  /*
   * فرمت:
   * hh:mm:ss
   */
  startTime:
    string;

  crewMembers:
    IssueProfileCrewMemberRequest[];

  items:
    IssueProfileItemRequest[];
}


/*
 * کارشناس قابل ارسال به Backend
 *
 * فیلدهای نمایشی firstName،
 * lastName و topicAxisTitle
 * ارسال نمی‌شوند.
 */
export interface ProfileExpertRequest {
  expertId:
    string;

  topicAxisId:
    string;

  duration:
    string;

  attendanceType:
    AttendanceType;

  hasPayment:
    boolean;
}


/*
 * درخواست ثبت یا جایگزینی
 * کارشناسان شناسنامه
 *
 * PUT /api/program-profiles/experts
 */
export interface UpdateProfileExpertsRequest {
  profileId:
    string;

  experts:
    ProfileExpertRequest[];
}


/*
 * عامل ثبت‌شده در پاسخ شناسنامه
 */
export interface ProfileCrewMemberResponse {
  personnelId:
    number;

  personnelName:
    string;

  activityTypeId:
    number;

  activityTypeName:
    string;

  isPresent:
    boolean;
}


/*
 * آیتم ثبت‌شده در پاسخ شناسنامه
 *
 * بعضی نسخه‌های Backend ممکن است
 * شناسه یا موضوع آیتم را نیز برگردانند؛
 * به همین علت اختیاری تعریف شده‌اند.
 */
export interface ProfileItemResponse {
  itemId?:
    number | null;

  itemName:
    string;

  itemSubject?:
    string;

  productionTypeId?:
    number | null;

  productionType:
    string;

  duration:
    string;
}


/*
 * کارشناس ثبت‌شده در پاسخ شناسنامه
 */
export interface ProfileExpertResponse {
  expertId:
    string;

  topicAxisId:
    string;

  duration:
    string;

  /*
   * Backend ممکن است Enum را
   * به شکل رشته یا عدد برگرداند.
   */
  attendanceType:
    AttendanceType | string;

  hasPayment:
    boolean;
}


/*
 * پاسخ شناسنامه از Backend
 */
export interface ProgramProfileResponse {
  id:
    string;

  forecastId:
    string;

  planId:
    number;

  networkId:
    number;

  networkGroupId:
    number | null;

  /*
   * نام برنامه ممکن است در برخی
   * پاسخ‌ها وجود نداشته باشد.
   */
  programName?:
    string;

  mainTopic:
    string;

  duration:
    string;

  broadcastDate:
    string;

  productionMethod:
    string;

  occasion:
    string;

  floorId:
    number;

  floorName:
    string;

  programDegreeId:
    number;

  programDegreeName:
    string;

  programStructureId:
    number;

  programStructureName:
    string;

  startTime:
    string;

  hasExpert:
    boolean;

  crewMembers:
    ProfileCrewMemberResponse[];

  items:
    ProfileItemResponse[];

  experts:
    ProfileExpertResponse[];

  createdByUserId:
    string;

  createdByUserName:
    string;

  createdDate:
    string;
}


/*
 * اطلاعات صفحه‌بندی
 */
export interface ProgramProfilePagination {
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
 * پاسخ Route داخلی Next.js
 * برای فهرست شناسنامه‌ها
 */
export interface ProgramProfileListResponse {
  items:
    ProgramProfileResponse[];

  pagination:
    ProgramProfilePagination;
}


/*
 * پاسخ نهایی Route صدور شناسنامه
 *
 * این مدل مربوط به پاسخ یکپارچه
 * Route داخلی Frontend است.
 */
export interface IssueProgramProfileResponse {
  message:
    string;

  profile:
    ProgramProfileResponse;

  issueSucceeded:
    boolean;

  expertsSucceeded:
    boolean;
}


/*
 * پاسخ عمومی خطا
 */
export interface ProgramProfileApiError {
  message:
    string;

  description?:
    string;

  details?:
    unknown;
}