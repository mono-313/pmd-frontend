export interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginApiResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  roles: string[];
  networkIds: number[];
  networkGroupId: number | null;
}

export interface SafeUserSession {
  userName: string;
  expiresAt: string;
  roles: string[];
  networkIds: number[];
  networkGroupId: number | null;
}

export interface ApiErrorResponse {
  type?: string;
  title?: string;
  statusCode?: number;
  errors?: string;
  code?: string;
  description?: string;
}

//register

export interface RegisterRequest {
  fullName: string;
  userName: string;
  email: string;
  password: string;
  roles: string[];
  networkIds: number[];
  networkGroupId: number | null;
}

export interface RegisterApiResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  roles: string[];
  networkIds: number[];
  networkGroupId: number | null;
}

export interface SafeUserSession {
  userName: string;
  expiresAt: string;
  roles: string[];
  networkIds: number[];
  networkGroupId: number | null;
}

export interface ApiErrorResponse {
  type?: string;
  title?: string;
  statusCode?: number;
  errors?: string;
  code?: string;
  description?: string;
}


