/** Shared API types — Phase 0 foundation only. */

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
