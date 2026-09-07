/*
 * انواع داده مربوط به
 * Wizard صدور شناسنامه برنامه
 */


/*
 * نحوه حضور کارشناس
 *
 * مطابق Enum مستند Backend:
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
 * گزینه قابل نمایش در فیلد
 * آبشاری نحوه حضور
 */
export interface AttendanceTypeOption {
  value:
    AttendanceType;

  title:
    string;
}


/*
 * مقادیر ثابت آبشاری
 * نحوه حضور کارشناس
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
 * اطلاعات مرحله اول:
 * مشخصات شناسنامه برنامه
 */
export interface ProfileSpecificationsData {
  /*
   * اطلاعات مرجع
   */
  forecastId:
    string;

  planId:
    number;

  networkId:
    number;

  networkGroupId:
    number;


  /*
   * اطلاعات فقط نمایشی
   *
   * programName و episodeNumber
   * طبق مستند در درخواست صدور
   * ارسال نمی‌شوند.
   */
  programName:
    string;

  mainTopic:
    string;

  episodeNumber:
    number | null;


  /*
   * مشخصات قابل استفاده
   * در درخواست صدور شناسنامه
   */
  duration:
    string;

  broadcastDate:
    string;

  /*
   * فقط برای نمایش و DatePicker
   * است و به Backend ارسال نمی‌شود.
   */
  broadcastDateJalali:
    string;

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

  startTime:
    string;


  /*
   * طبق مستند، Backend این مقدار
   * را از Forecast می‌خواند.
   *
   * بنابراین در IssueRequest
   * ارسال نمی‌شود.
   */
  hasExpert:
    boolean;
}


/*
 * عامل برنامه
 *
 * اطلاعات اولیه از:
 * GET /estimateDetail/{planId}
 *
 * و هنگام صدور داخل crewMembers
 * ارسال می‌شود.
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
 * آیتم برنامه
 *
 * اطلاعات اولیه از:
 * GET /planItems/{planId}
 */
export interface ProfileItemData {
  itemName:
    string;

  productionType:
    string;

  /*
   * فرمت مورد انتظار:
   * hh:mm:ss
   */
  duration:
    string;
}


/*
 * کارشناس انتخاب‌شده
 * در مرحله چهارم Wizard
 */
export interface ProfileExpertData {
  expertId:
    string;

  /*
   * این دو فیلد فقط برای نمایش
   * در جدول و مرحله بازبینی هستند.
   */
  firstName:
    string;

  lastName:
    string;

  /*
   * محور موضوعی مرتبط
   */
  topicAxisId:
    string;

  /*
   * عنوان محور فقط برای نمایش
   */
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
 * FormData اصلی Wizard شناسنامه
 *
 * این Object در IssueProfileDialog
 * نگهداری می‌شود تا هنگام جابه‌جایی
 * بین مراحل، اطلاعات از بین نرود.
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
 * بدنه اصلی صدور شناسنامه
 *
 * مطابق:
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
    number;

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
    ProfileCrewMemberData[];

  items:
    ProfileItemData[];
}


/*
 * کارشناس قابل ارسال به Backend
 *
 * فیلدهای نمایشی firstName،
 * lastName و topicAxisTitle
 * در این مدل وجود ندارند.
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
 * بدنه ثبت یا جایگزینی
 * کارشناسان شناسنامه
 *
 * مطابق:
 * PUT /api/program-profiles/experts
 */
export interface UpdateProfileExpertsRequest {
  profileId:
    string;

  experts:
    ProfileExpertRequest[];
}


/*
 * عامل ثبت‌شده در پاسخ
 * ProfileResponse
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
 * آیتم ثبت‌شده در پاسخ
 * ProfileResponse
 */
export interface ProfileItemResponse {
  itemName:
    string;

  productionType:
    string;

  duration:
    string;
}


/*
 * کارشناس ثبت‌شده در پاسخ
 * ProfileResponse
 *
 * Backend طبق مستند نام کارشناس
 * را داخل این مدل برنمی‌گرداند.
 */
export interface ProfileExpertResponse {
  expertId:
    string;

  topicAxisId:
    string;

  duration:
    string;

  /*
   * ممکن است Backend Enum را
   * رشته یا عدد برگرداند.
   */
  attendanceType:
    AttendanceType | string;

  hasPayment:
    boolean;
}


/*
 * پاسخ شناسنامه از Backend
 *
 * مطابق ProfileResponse مستند
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
    number;

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
 * Metadata مربوط به Pagination
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
 * این مدل پاسخ داخلی فرانت است
 * و الزاماً پاسخ مستقیم Backend نیست.
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