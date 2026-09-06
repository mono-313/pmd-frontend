/*
 * این فایل فقط باید در Route Handlerها
 * و کدهای سمت Server استفاده شود.
 */
import "server-only";

// پیش بینی
export const API_BASE_URL =
  "http://172.16.60.34:8000/api";

//اطلاعات برنامه- شبکه
export const BASE_INFO_API_URL =
  "http://172.16.60.34/api/v1/baseinfo";


export const BASE_INFO_API_KEY =
  process.env.BASE_INFO_API_KEY ??
  "";


/*
 * main api
 */
export const API_CONFIG = {
  baseUrl:
    API_BASE_URL,

  endpoints: {
    login:
      "/auth/login",

    register:
      "/auth/register",

    refresh:
      "/auth/refresh",

    revoke:
      "/auth/revoke",

    currentUser:
      "/auth/me",
  },
} as const;


/*
 * Endpoint
 */
export const API_ENDPOINTS = {
  auth: {
    login:
      "/auth/login",

    register:
      "/auth/register",

    refresh:
      "/auth/refresh",

    revoke:
      "/auth/revoke",

    currentUser:
      "/auth/me",

    profile:
      "/auth/profile",
  },

  experts: {
  list:
    "/experts",

  create:
    "/experts",

  byId: (
    expertId: string
  ) =>
    `/experts/${expertId}`,
},

  forecasts: {
    list:
      "/forecasts",

    create:
      "/forecasts",

    byId: (
      forecastId: string
    ) =>
      `/forecasts/${forecastId}`,

    submit: (
      forecastId: string
    ) =>
      `/forecasts/${forecastId}/submit`,

    approve: (
      forecastId: string
    ) =>
      `/forecasts/${forecastId}/approve`,

    reject: (
      forecastId: string
    ) =>
      `/forecasts/${forecastId}/reject`,

    returnForEdit: (
      forecastId: string
    ) =>
      `/forecasts/${forecastId}/return-for-edit`,
    nextEpisodeNumber: (
    planId: number
  ) =>
    `/forecasts/next-episode-number/${planId}`
  },

  programProfiles: {
  list:
    "/program-profiles",

  byId: (
    profileId: string
  ) =>
    `/program-profiles/${profileId}`,

  issue:
    "/program-profiles/issue",

  updateExperts:
    "/program-profiles/experts",
},
} as const;



/*
 * وب‌سرویس اطلاعات پایه
 */
export const BASE_INFO_API_CONFIG = {
  baseUrl:
    process.env.BASE_INFO_API_URL ??
    "http://172.16.60.34/api/v1/baseinfo",

  apiKey:
    process.env.BASE_INFO_API_KEY ??
    "",

  endpoints: {
    plans:
      "/plans",

    planDetail: (
      planId: number
    ) =>
      `/planDetail/${planId}`,

    planItems: (
      planId: number
    ) =>
      `/planItems/${planId}`,

    estimateDetail: (
      planId: number
    ) =>
      `/estimateDetail/${planId}`,
  },
networks:
    "/networks",

  networkGroups:
    "/networkgroups",

  programStructures:
    "/structurePrograms",

  programDegrees:
    "/programDgree",

  businessTypes:
    "/bussinessTypes",

  activityTypes:
    "/activityTypes",

  programMakerPersonnel:
    "/personelProgramMaker",


  } as const;

  