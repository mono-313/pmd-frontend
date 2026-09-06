/*
 * Experts
 */

export interface ExpertApiResponse {
  id: string;

  firstName: string;

  lastName: string;

  specialty: string;

  education: number;

  workplace: string;

  mobilePhone: string;

  nationalCode: string;

  workPhone: string | null;

  isActive: boolean;

  networkIds: number[];

  createdAt: string;
}

/*
 * UI
 */
export interface ExpertOption {
  id: string;
  firstName: string;
  lastName:string;
  specialty: string;
  education:number;
  nationalCode: string;
  workplace: string;
  mobilePhone: string;
  networkIds: number[];
}

/*
 * پاسخ Route Handler داخلی Next.js
 */
export interface ExpertsClientResponse {
  experts: ExpertOption[];

  pagination?: {
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}


export interface CreateExpertClientResponse {
  message: string;
  expert: ExpertOption;
}

/*
 * مقطع تحصیلی مطابق EducationLevel در Backend
 */
export type EducationLevel = 1 | 2 | 3 | 4 | 5;

export const EDUCATION_LEVEL_OPTIONS: ReadonlyArray<{
  value: EducationLevel;
  label: string;
}> = [
  { value: 1, label: "دیپلم" },
  { value: 2, label: "فوق دیپلم" },
  { value: 3, label: "لیسانس" },
  { value: 4, label: "فوق لیسانس" },
  { value: 5, label: "دکترا" },
];

/*
 * بدنه دقیق POST /api/experts
 * workPhone تنها فیلد اختیاری مستند است.
 */
export interface CreateExpertRequest {
  firstName: string;
  lastName: string;
  specialty: string;
  education: EducationLevel;
  workplace: string;
  mobilePhone: string;
  nationalCode: string;
  workPhone?: string;
  networkIds: number[];
}

/* پاسخ دقیق ExpertResponse از Backend */
export interface ExpertResponse {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  education: EducationLevel;
  workplace: string;
  mobilePhone: string;
  nationalCode: string;
  workPhone: string | null;
  isActive: boolean;
  networkIds: number[];
  createdAt: string;
}


export interface ExpertsPaginationMetadata {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}


export interface CreateExpertClientResponse {
  message: string;
  expert: ExpertOption;
}

export interface ExpertApiErrorResponse {
  message?: string;
  title?: string;
  description?: string;
  code?: string;
  errors?: unknown;
}
