import { CmsAdminChrome } from '@/components/cms/page-builder/cms-admin-chrome';

export default function CmsAdminLayout({ children }: { children: React.ReactNode }) {
  return <CmsAdminChrome>{children}</CmsAdminChrome>;
}
