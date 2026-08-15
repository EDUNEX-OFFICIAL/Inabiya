'use client';

import { CmsPageEditor } from '@/components/cms/page-builder/cms-page-editor';

export default function AdminCmsPageEditor({ params }: { params: { id: string } }) {
  return <CmsPageEditor pageId={params.id} />;
}
