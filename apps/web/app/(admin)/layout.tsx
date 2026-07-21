'use client';

import { AdminGate } from '@/components/admin-gate';

const ADMIN_ROLES = [
  'COMMERCE_ADMIN',
  'CONTENT_ADMIN',
  'WRITER',
  'SEO_EDITOR',
  'MEDICAL_REVIEWER',
  'FINANCE',
  'SUPPORT',
  'SUPER_ADMIN',
];

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="admin">
      <AdminGate allow={ADMIN_ROLES} loginNext="/admin/commerce">
        {children}
      </AdminGate>
    </div>
  );
}
