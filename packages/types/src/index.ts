/** Shared API types — Phase 0 foundation + Phase 1 auth. */

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
  };
}

export type RoleCode =
  | 'CUSTOMER'
  | 'COMMERCE_ADMIN'
  | 'CONTENT_ADMIN'
  | 'WRITER'
  | 'SEO_EDITOR'
  | 'MEDICAL_REVIEWER'
  | 'CREATOR'
  | 'BRAND'
  | 'FINANCE'
  | 'SUPPORT'
  | 'SUPER_ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  roles: RoleCode[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthSessionResponse {
  user: AuthUser;
  tokens: AuthTokens;
}
