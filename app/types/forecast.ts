export type ForecastStatus =
  | "Draft"
  | "PendingReview"
  | "Approved"
  | "Rejected"
  | "ReturnedForEdit";


  export interface ForecastTopicAxis {
  id: string;

  title: string;

  displayOrder: number;
}


//ایجاد داخل route sen for backend
export interface CreateForecastRequest {
  planId: number;

  networkId: number;

  networkGroupId: number;

  broadcastDate: string;

  mainTopic: string;

  hasExpert: boolean;

  topicAxes: string[];

  expertIds: string[];
}



/*
 * درخواست ثبت نهایی ویزارد
 *
 * این اطلاعات ابتدا به Route داخلی
 * Next.js ارسال می‌شوند.
 */
export interface FinalSubmitRequest {
  planId: number;

  networkId: number;

  networkGroupId: number;

  broadcastDate: string;

  mainTopic: string;

  hasExpert: boolean;

  topicAxes: string[];

  expertIds: string[];

  //for front
  submitAfterCreate: boolean;
}



export interface ForecastResponse {
  id: string;

  planId: number;

  networkId: number;

  networkGroupId: number;

  episodeNumber: number;

  broadcastDate: string;

  mainTopic: string;

  hasExpert: boolean;

  status: ForecastStatus;

  topicAxes:
    ForecastTopicAxis[];

  expertIds:
    string[];

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
export interface PaginationMetadata {
  totalCount: number;

  pageSize: number;

  totalPages: number;

  hasNext: boolean;

  hasPrevious: boolean;

   currentPage: number;
}


export interface ForecastListResponse {
  items: ForecastResponse[];
  pagination: PaginationMetadata;
}

    
/*
 * پاسخ Route Handler مرحله نهایی ویزارد
 *
 * این پاسخ از Route داخلی Next.js برمی‌گردد،
 * نه مستقیماً از Backend.
 */
export interface FinalSubmitResponse {
  //پیام برای کاربر
  message: string;
  //در بک اند ایجاد شد؟؟
  forecast:ForecastResponse;
  createSucceeded: boolean;
  //ارسال برای بررسی
  submitSucceeded: boolean;
}

export interface ForecastListFilters {
  planId?: number;

  status?: ForecastStatus | "";

  fromDate?: string;

  toDate?: string;

  pageNumber: number;

  pageSize: number;
}

/*
 * بدنه عملیات رد یا
 * بازگشت برای اصلاح
 */
export interface ForecastReasonRequest {
  reason: string;
}


export type ForecastExpert = {
  id: string;
  fullName?: string;
};

export type Forecast = {
  id: string;

  planId: number;
  networkId: number;
  networkGroupId:
    | number
    | null;

  broadcastDate: string;
  mainTopic: string;
  hasExpert: boolean;

  episodeNumber?: number;

  status: ForecastStatus;

  topicAxes?:
    ForecastTopicAxis[];

  experts?:
    ForecastExpert[];

  expertIds?: string[];

  createdAt?: string;
  updatedAt?: string;

  returnReason?:
    | string
    | null;

  rejectionReason?:
    | string
    | null;
};


export type WorkflowReasonRequest = {
  reason: string;
};

export type ForecastApiError = {
  message?: string;
  description?: string;
  errors?: unknown;
};


export interface ApiErrorResponse {
  message?: string;

  description?: string;

  code?: string;

  errors?:
    | string
    | Record<
        string,
        string[]
      >;
}



export interface UpdateForecastRequest {
  id:string;

  broadcastDate: string;

  mainTopic: string;

  hasExpert: boolean;

  topicAxes: string[];

  expertIds: string[];
}

//پایخ داخلی
export interface ForecastActionResponse {
  message: string;

  /*
   * ممکن است Endpoint Backend
   * پاسخ خالی داشته باشد.
   */
  forecast?: ForecastResponse;
}

//delete
export interface DeleteForecastResponse {
  message: string;

  deletedId: string;
}

//دلیل رد یا برگشت
export interface ForecastReasonRequest {
  reason: string;
}

//مجوز action  3.
export interface ForecastRowPermissions {
  canView: boolean;

  canEdit: boolean;

  canDelete: boolean;

  canSubmit: boolean;
}



